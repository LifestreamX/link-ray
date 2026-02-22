import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { getCachedScan, saveScan } from '@/lib/db';
import { hashUrl, validateUrl } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type {
  AnalysisRequest,
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
 * Helper to call Gemini with a specific model
 */
async function callGemini(modelName: string, prompt: string): Promise<any> {
  console.log(`🤖 Attempting to analyze with model: ${modelName}...`);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
}

/**
 * Analyze content with Gemini AI (With Fallback Strategy)
 */
async function analyzeWithAI(
  content: ScrapedContent,
): Promise<GeminiAnalysisResult> {
  // ✅ THE ULTIMATE FREE LIST
  // This tries your huge quotas first, then falls back to others.
  const modelsToTry = [
    // 1. Primary: Smartest Gemma Model (Huge Quota: 14k/day)
    'gemma-3-27b-it',

    // 2. Backup Gemma Models (If 27B is busy, these share the same huge 14k limit)
    'gemma-3-12b-it',
    'gemma-3-4b-it',

    // 3. Gemini "Flash Lite" (Separate Bucket: 1,500/day)
    'gemini-2.0-flash-lite-001',

    // 4. Gemini 3 Flash (Your screenshot shows 0/20 used here!)
    'gemini-3-flash-preview',

    // 5. Experimental (Separate Quota)
    'gemini-exp-1206',

    // 6. Standard Flash (The one you maxed out today - keep as last resort)
    'gemini-2.5-flash',
    'gemini-flash-latest',
  ];

  const prompt = `You are a cybersecurity expert. Analyze this website content.
  Title: ${content.title}
  Content: ${content.text}

  Rules for Risk Score (0-100, where 100 is Safe):
  - Phishing, Scams, Malware = 0-20
  - Spammy, Low Quality, Unverified Crypto = 30-50
  - Legitimate Business, Blogs, News = 80-90
  - Verified Tech Platforms (e.g., GitHub, AWS, Google) = 95-100

  Return a JSON object with this EXACT structure:
  {
    "summary": "A detailed 3-4 sentence paragraph summarizing the website's purpose, key features, and target audience.",
    "risk_score": 50,
    "reason": "Explain why you gave this risk_score, referencing specific content. Be consistent with the score.",
    "category": "Category Name",
    "tags": ["tag1", "tag2", "tag3"]
  }`;

  // Loop through models until one works
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
      console.warn(`⚠️ Failed with ${modelName}:`, error.message);
      // Continue loop to the next model...
    }
  }

  // If ALL models failed
  throw new Error('AI_ANALYSIS_FAILED');
}

/**
 * Main POST handler for /api/analyze
 */
export async function POST(request: Request) {
  try {
    // Get the logged-in user from session
    const session = await getServerSession(authOptions);
    const user = session?.user ? { id: (session.user as any).id } : null;

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
    if (user) {
      const cachedScan = await getCachedScan(urlHash);
      if (cachedScan && cachedScan.user_id === user.id) {
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
    }

    // 3. Fetch HTML
    let html = '';
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

    // 5. Analyze (With Fallback)
    let analysis;
    try {
      analysis = await analyzeWithAI(scrapedContent);
    } catch (aiError: any) {
      return NextResponse.json(
        {
          success: false,
          error:
            'AI analysis failed. This is likely due to API quota limits or service issues. Please try again later or check your API usage.',
        },
        { status: 500 },
      );
    }

    const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(normalizedUrl)}&screenshot=true&meta=false&embed=screenshot.url`;

    // 6. Save scan to database
    if (user) {
      const scanToSave = {
        user_id: user.id,
        url_hash: urlHash,
        url: normalizedUrl,
        summary: analysis.summary,
        risk_score: analysis.risk_score,
        reason: analysis.reason,
        category: analysis.category,
        tags: analysis.tags,
      };

      const savedScan = await saveScan(scanToSave);

      if (savedScan) {
        return NextResponse.json({
          success: true,
          data: {
            ...savedScan,
            screenshot_url: screenshotUrl,
            from_cache: false,
          },
        });
      }
    }

    // Anonymous User Response
    return NextResponse.json({
      success: true,
      data: {
        id: 'anon',
        user_id: '',
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
