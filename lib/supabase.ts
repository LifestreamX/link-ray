import { createClient } from '@supabase/supabase-js';
import type { Scan } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database helper functions
export async function getCachedScan(urlHash: string): Promise<Scan | null> {
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('url_hash', urlHash)
    .gte('created_at', twentyFourHoursAgo)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Scan;
}

export async function saveScan(
  scan: Omit<Scan, 'id' | 'created_at'> & { user_id: string },
): Promise<Scan | null> {
  // Always use server timestamp for created_at
  const { data, error } = await supabase
    .from('scans')
    .insert({ ...scan, created_at: undefined }) // let DB default NOW()
    .select()
    .single();

  if (error) {
    console.error('Error saving scan:', error);
    return null;
  }

  return data as Scan;
}

export async function getRecentScans(
  user_id: string,
  limit?: number,
): Promise<Scan[]> {
  let query = supabase
    .from('scans')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  if (limit !== undefined) {
    query = query.limit(limit);
  }
  const { data, error } = await query;
  if (error || !data) {
    console.log('getRecentScans: error or no data', error);
    return [];
  }
  console.log(
    'getRecentScans: returned',
    data.length,
    'rows:',
    data.map((row: any) => row.id),
  );
  return data as Scan[];
}
