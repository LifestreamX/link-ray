import { NextResponse } from 'next/server';
import { getRecentScans } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // For now, use anonymous user (you can add auth later)
    const userId = 'anonymous';

    const scans = await getRecentScans(userId, 10);

    return NextResponse.json({ success: true, data: scans });
  } catch (error) {
    console.error('Error fetching recent scans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent scans' },
      { status: 500 },
    );
  }
}
