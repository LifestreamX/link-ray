import { NextResponse } from 'next/server';
import { crawlWebsite, validateUrl } from '@/lib/utils';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import type {
  AnalysisRequest,
  GeminiAnalysisResult,
  ScrapedContent,
} from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function callGemini(modelName: string, prompt: string): Promise<any> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
}

async function analyzeWithAI(
  content: ScrapedContent,
): Promise<GeminiAnalysisResult> {
  const modelsToTry = [
    'gemini-2.0-flash-lite-001',
    'gemini-flash-lite-latest',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
  ];
  const prompt = `You are a cybersecurity expert. Analyze this website content.\nTitle: ${content.title}\nContent: ${content.text}\n\nRules for Risk Score (0-100, where 100 is Safe):\n- Phishing, Scams, Malware = 0-20\n- Spammy, Low Quality, Unverified Crypto = 30-50\n- Legitimate Business, Blogs, News = 80-90\n- Verified Tech Platforms (e.g., GitHub, AWS, Google) = 95-100\n\nReturn a JSON object with this EXACT structure:\n{\n  "summary": "A detailed 3-4 sentence paragraph summarizing the website's purpose, key features, and target audience.",\n  "risk_score": 50,\n  "reason": "Explain why you gave this risk_score, referencing specific content. Be consistent with the score.",\n  "category": "Category Name",\n  "tags": ["tag1", "tag2", "tag3"]\n }`;
  for (const modelName of modelsToTry) {
    try {
      const analysis = await callGemini(modelName, prompt);
      return {
        summary: analysis.summary || 'Unable to generate summary',
        risk_score:
          typeof analysis.risk_score === 'number' ? analysis.risk_score : 50,
        reason: analysis.reason || 'No explanation provided.',
        category: analysis.category || 'Unknown',
        tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 5) : [],
      };
    } catch (error: any) {
      // Continue loop...
    }
  }
  throw new Error('AI_ANALYSIS_FAILED');
}

function scrapeContent(html: string): ScrapedContent {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, iframe, noscript, svg').remove();
  let text = '';
  const mainSelectors = [
    'main',
    'article',
    '[role="main"]',
    '#content',
    '.content',
    'body',
  ];
  for (const selector of mainSelectors) {
    const content = $(selector).text();
    if (content.length > text.length) {
      text = content;
    }
  }
  text = text.replace(/\s+/g, ' ').trim().substring(0, 12000);
  const title = $('title').text().trim() || 'Unknown Website';
  return { text, title };
}

export async function POST(request: Request) {
  try {
    const body: AnalysisRequest = await request.json();
    const { url } = body;
    const validation = validateUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL' },
        { status: 400 },
      );
    }
    const normalizedUrl = validation.normalized!;
    // Crawl website for up to 10 pages
    const pages = await crawlWebsite(normalizedUrl, 10); // Limit to 10 pages for quick scan
    if (!pages.length) {
      return NextResponse.json(
        { success: false, error: 'No pages found.' },
        { status: 422 },
      );
    }
    // Aggregate all page content and log crawl progress
    let combinedText = '';
    let combinedTitles = [];
    for (const page of pages) {
      console.log(`[Crawler] Crawling: ${page.url}`);
      const scraped = scrapeContent(page.content);
      if (scraped.text && scraped.text.length > 50) {
        combinedText += `\n---\n[${page.url}]\n${scraped.text}`;
        if (scraped.title) combinedTitles.push(scraped.title);
        console.log(`[Crawler] Analyzed: ${page.url}`);
      }
    }
    if (!combinedText) {
      return NextResponse.json(
        { success: false, error: 'No analyzable content found.' },
        { status: 422 },
      );
    }
    // Use all titles for context
    const siteTitle = combinedTitles.join(' | ');
    const unifiedContent = { text: combinedText, title: siteTitle };
    let analysis;
    try {
      analysis = await analyzeWithAI(unifiedContent);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'AI analysis failed.' },
        { status: 500 },
      );
    }
    // Add screenshot_url to response
    const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(normalizedUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
    return NextResponse.json({
      success: true,
      data: { ...analysis, screenshot_url: screenshotUrl },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
