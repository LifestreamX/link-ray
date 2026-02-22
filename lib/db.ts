import { prisma } from './prisma';
import type { Scan } from '@/types';

// Database helper functions
export async function getCachedScan(urlHash: string): Promise<Scan | null> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const scan = await prisma.scan.findFirst({
      where: {
        urlHash,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    if (!scan) {
      return null;
    }

    // Convert Prisma model to Scan type
    return {
      id: scan.id,
      user_id: scan.userId,
      url_hash: scan.urlHash,
      url: scan.url,
      summary: scan.summary,
      risk_score: scan.riskScore,
      reason: scan.reason,
      category: scan.category,
      tags: scan.tags,
      created_at: scan.createdAt.toISOString(),
    } as Scan;
  } catch (error) {
    console.error('Error fetching cached scan:', error);
    return null;
  }
}

export async function saveScan(scan: {
  user_id: string;
  url_hash: string;
  url: string;
  summary: string;
  risk_score: number;
  reason: string;
  category: string;
  tags: string[];
}): Promise<Scan | null> {
  try {
    const createdScan = await prisma.scan.create({
      data: {
        userId: scan.user_id,
        urlHash: scan.url_hash,
        url: scan.url,
        summary: scan.summary,
        riskScore: scan.risk_score,
        reason: scan.reason,
        category: scan.category,
        tags: scan.tags || [],
      },
    });

    // Convert Prisma model to Scan type
    return {
      id: createdScan.id,
      user_id: createdScan.userId,
      url_hash: createdScan.urlHash,
      url: createdScan.url,
      summary: createdScan.summary,
      risk_score: createdScan.riskScore,
      reason: createdScan.reason,
      category: createdScan.category,
      tags: createdScan.tags,
      created_at: createdScan.createdAt.toISOString(),
    } as Scan;
  } catch (error) {
    console.error('Error saving scan:', error);
    return null;
  }
}

export async function getRecentScans(
  user_id: string,
  limit?: number,
): Promise<Scan[]> {
  try {
    const scans = await prisma.scan.findMany({
      where: {
        userId: user_id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    console.log(
      'getRecentScans: returned',
      scans.length,
      'rows:',
      scans.map((scan: any) => scan.id),
    );

    // Convert Prisma models to Scan types
    return scans.map((scan: any) => ({
      id: scan.id,
      user_id: scan.userId,
      url_hash: scan.urlHash,
      url: scan.url,
      summary: scan.summary,
      risk_score: scan.riskScore,
      reason: scan.reason,
      category: scan.category,
      tags: scan.tags,
      created_at: scan.createdAt.toISOString(),
    })) as Scan[];
  } catch (error) {
    console.error('Error fetching recent scans:', error);
    return [];
  }
}
