import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { getCachedScan, saveScan } from '@/lib/supabase';
import { hashUrl, validateUrl } from '@/lib/utils';
import type {
  AnalysisRequest,
  AnalysisResponse,
  GeminiAnalysisResult,
  ScrapedContent,
} from '@/types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Timeout for fetch requests (8 seconds)
const FETCH_TIMEOUT = 8000;

/**
 * Fetch HTML with timeout guard
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Site took too long to respond');
    }
    throw error;
  }
}

/**
 * Scrape and clean website content using cheerio
 */
function scrapeContent(html: string): ScrapedContent {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, nav, footer, header, iframe, noscript, svg').remove();

  // Try to get the main content
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

  // Clean whitespace and limit length to save tokens
  text = text.replace(/\s+/g, ' ').trim().substring(0, 12000);

  const title = $('title').text().trim() || 'Unknown Website';

  return { text, title };
}

/**
 * Analyze content with Gemini AI
 */
async function analyzeWithAI(
  content: ScrapedContent,
): Promise<GeminiAnalysisResult> {
  // ✅ FINAL FIX: Use the generic stable alias 'gemini-flash-latest'
  // This appeared explicitly in your 'debug-gemini.js' success list
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `Analyze this website.
  Title: ${content.title}
  Content: ${content.text}

  Return a JSON object with this EXACT structure:
  {
    "summary": "2-sentence summary of what this website is about",
    "risk_score": 50,
    "category": "Category Name",
    "tags": ["tag1", "tag2", "tag3"]
  }`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON
    const analysis = JSON.parse(text);

    return {
      summary: analysis.summary || 'Unable to generate summary',
      risk_score:
        typeof analysis.risk_score === 'number' ? analysis.risk_score : 50,
      category: analysis.category || 'Unknown',
      tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 5) : [],
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    // Graceful fallback
    return {
      summary: 'Unable to analyze this website at the moment.',
      risk_score: 50,
      category: 'Uncategorized',
      tags: ['error'],
    };
  }
}

/**
 * Main POST handler for /api/analyze
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { url } = body;

    // 1. Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL' },
        { status: 400 },
      );
    }

    const normalizedUrl = validation.normalized!;
    const urlHash = hashUrl(normalizedUrl);

    // 2. Check Cache
    const cachedScan = await getCachedScan(urlHash);
    if (cachedScan) {
      const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(normalizedUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
      return NextResponse.json({
        success: true,
        data: {
          ...cachedScan,
          screenshot_url: screenshotUrl,
          from_cache: true,
        },
      });
    }

    // 3. Fetch HTML
    let html: string;
    try {
      html = await fetchWithTimeout(normalizedUrl, FETCH_TIMEOUT);
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load website. It might be blocking bots.',
        },
        { status: 500 },
      );
    }

    // 4. Scrape
    const scrapedContent = scrapeContent(html);
    if (!scrapedContent.text || scrapedContent.text.length < 50) {
      return NextResponse.json(
        { success: false, error: 'Website has no readable content.' },
        { status: 422 },
      );
    }

    // 5. Analyze
    const analysis = await analyzeWithAI(scrapedContent);

    // 6. Save & Return
    const savedScan = await saveScan({
      url_hash: urlHash,
      url: normalizedUrl,
      ...analysis,
    });

    const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(normalizedUrl)}&screenshot=true&meta=false&embed=screenshot.url`;

    return NextResponse.json({
      success: true,
      data: {
        id: savedScan?.id || 'temp',
        url: normalizedUrl,
        ...analysis,
        screenshot_url: screenshotUrl,
        created_at: new Date().toISOString(),
        from_cache: false,
      },
    });
  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
