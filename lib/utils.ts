import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Generate MD5 hash of a URL for cache lookups
 */
export function hashUrl(url: string): string {
  const crypto = require('crypto');
  return crypto
    .createHash('md5')
    .update(url.toLowerCase().trim())
    .digest('hex');
}

export async function crawlWebsite(
  startUrl: string,
  maxPages = 50,
): Promise<{ url: string; content: string }[]> {
  const visited = new Set<string>();
  const results: { url: string; content: string }[] = [];
  const domain = new URL(startUrl).hostname;

  async function crawl(url: string) {
    if (visited.has(url) || visited.size >= maxPages) return;
    visited.add(url);
    console.log(`[Crawler] Crawling: ${url}`);
    try {
      const { data } = await axios.get(url);
      results.push({ url, content: data });
      console.log(`[Crawler] Analyzed: ${url}`);
      const $ = cheerio.load(data);
      const links = $('a')
        .map((_, a) => $(a).attr('href'))
        .get()
        .filter((href) => {
          if (!href) return false;
          try {
            const u = new URL(href, url);
            return u.hostname === domain && !visited.has(u.href);
          } catch {
            return false;
          }
        });
      for (const link of links) {
        const absolute = new URL(link, url).href;
        await crawl(absolute);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log(`[Crawler] Error crawling ${url}:`, e.message);
      } else {
        console.log(`[Crawler] Error crawling ${url}:`, e);
      }
    }
  }

  await crawl(startUrl);
  return results;
}

/**
 * Validate and normalize a URL
 */
export function validateUrl(url: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  try {
    // Add protocol if missing
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }

    const urlObj = new URL(normalized);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' };
    }

    return { valid: true, normalized: urlObj.href };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Get color class based on risk score
 */
export function getRiskColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get risk label based on score
 */
export function getRiskLabel(score: number): string {
  if (score >= 80) return 'Safe';
  if (score >= 50) return 'Caution';
  return 'Risky';
}

/**
 * Format date to relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
