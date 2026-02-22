import { NextResponse } from 'next/server';
import { getRecentScans } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    // Get the logged-in user from session
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : 'anonymous';

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
