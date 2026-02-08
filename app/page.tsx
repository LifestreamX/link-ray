'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ScanResult, Scan } from '@/types';
import { getRiskColor, formatRelativeTime } from '@/lib/utils';

function ScreenshotWithSkeleton({ src, alt }: { src: string; alt: string }) {
  const [loading, setLoading] = useState(true);
  return (
    <div
      className='relative w-full flex justify-center items-center'
      style={{ minHeight: 180 }}
    >
      {loading && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='w-full h-44 bg-gray-700 animate-pulse rounded-xl' />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`rounded-xl border border-gray-700 max-w-full h-auto shadow-lg transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        style={{ maxHeight: 300 }}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}

export default function Home() {
  // Use singleton supabase client from lib/supabase

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'quick' | 'deep' | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [user, setUser] = useState<any>(null);

  // Fetch recent scans on mount and listen for auth changes
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchRecentScans();
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchRecentScans();
        else setRecentScans([]);
      },
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { prompt: 'select_account' },
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const fetchRecentScans = async () => {
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const response = await fetch('/api/recent', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        setRecentScans([...data.data]);
      }
    } catch (error) {
      console.error('Failed to fetch recent scans:', error);
    }
  };

  // Unified handler for both scan types
  const handleAnalyze = async (
    e: React.FormEvent,
    scanType: 'quick' | 'deep',
  ) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setLoadingType(scanType);
    setError(null);
    setResult(null);

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const endpoint =
        scanType === 'quick' ? '/api/analyze' : '/api/analyze/deep';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ url }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        setError(
          'Website could not be analyzed. It may block bots or return invalid data.',
        );
        setLoading(false);
        return;
      }

      if (data.success) {
        setResult(data.data);
        fetchRecentScans();
      } else {
        setResult(null);
        setError(data.error || 'Failed to analyze URL');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleQuickScan = (scanUrl: string) => {
    setUrl(scanUrl);
    setError(null);
    // Find the scan in recentScans and display it directly
    const foundScan = recentScans.find((scan) => scan.url === scanUrl);
    if (foundScan) {
      setResult(foundScan);
      return;
    }
    setResult(null);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white'>
      <div className='w-full flex justify-end items-center px-4 sm:px-6 py-3'>
        {!user ? (
          <button
            onClick={handleSignIn}
            className='w-auto min-w-[0] max-w-xs sm:max-w-sm md:max-w-md bg-white hover:bg-gray-100 border border-gray-300 text-gray-900 font-medium text-sm sm:text-base px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95'
            aria-label='Sign in with Google'
          >
            <span className='flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-gray-200 mr-2'>
              <svg className='w-4 h-4 sm:w-5 sm:h-5' viewBox='0 0 48 48'>
                <g>
                  <path
                    fill='#4285F4'
                    d='M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-8.1 20-21 0-1.3-.1-2.7-.5-4z'
                  />
                  <path
                    fill='#34A853'
                    d='M6.3 14.7l7 5.1C15.1 17.1 19.2 14 24 14c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3c-7.2 0-13.4 3.1-17.7 8.1z'
                  />
                  <path
                    fill='#FBBC05'
                    d='M24 44c5.8 0 10.7-1.9 14.3-5.1l-6.6-5.4C29.7 35.1 27 36 24 36c-5.7 0-10.5-3.7-12.2-8.8l-7 5.4C7.9 41.1 15.3 44 24 44z'
                  />
                  <path
                    fill='#EA4335'
                    d='M44.5 20H24v8.5h11.7c-1.2 3.2-4.7 7.5-11.7 7.5-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 6 .9 8.2 2.6l6.2-6.2C36.2 5.1 30.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-8.1 20-21 0-1.3-.1-2.7-.5-4z'
                  />
                </g>
              </svg>
            </span>
            <span className='truncate'>Sign in with Google</span>
          </button>
        ) : (
          <div className='flex items-center gap-4'>
            <span className='text-gray-300 text-sm'>
              Signed in as <span className='font-semibold'>{user.email}</span>
            </span>
            <button
              onClick={handleSignOut}
              className='bg-gray-700 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-lg shadow transition-all'
            >
              Sign out
            </button>
          </div>
        )}
      </div>
      <div className='w-full max-w-7xl mx-auto px-4 py-6 flex flex-col items-center justify-center'>
        {/* Header */}
        <header className='text-center mb-12 pt-8 max-w-5xl mx-auto w-full'>
          <div className='inline-flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
              <svg
                className='w-7 h-7'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                />
              </svg>
            </div>
            <h1 className='text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'>
              LinkRay
            </h1>
          </div>
          <p className='text-xl text-gray-300 mb-2'>Know before you visit.</p>
          <p className='text-sm text-gray-400'>
            AI-powered link analysis with safety scoring
          </p>
        </header>

        {/* Search Form */}
        <div className='mb-12 max-w-5xl mx-auto w-full'>
          <form
            className='max-w-5xl w-full mx-auto'
            onSubmit={(e) => handleAnalyze(e, 'quick')}
          >
            <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700'>
              <div className='flex flex-col md:flex-row gap-4 items-center justify-center'>
                <input
                  type='text'
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder='Enter a URL to analyze (e.g., example.com)'
                  className='w-full md:flex-1 bg-gray-900/50 border border-gray-600 rounded-xl px-5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-0 h-14 min-h-0'
                  style={{ height: '56px', minHeight: '0', marginBottom: 0 }}
                  disabled={loading}
                />
                <div className='flex flex-col gap-2 w-full md:w-auto'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold px-8 py-4 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg mb-2'
                  >
                    {loading && loadingType === 'quick'
                      ? 'Analyzing...'
                      : 'Quick Analyze'}
                  </button>
                  <button
                    type='button'
                    disabled={loading}
                    onClick={(e) => handleAnalyze(e as any, 'deep')}
                    className='w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold px-8 py-4 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg'
                  >
                    {loading && loadingType === 'deep'
                      ? 'Analyzing...'
                      : 'Deep Analyze'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className='max-w-5xl mx-auto mb-8 w-full'>
            <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 animate-pulse'>
              <div className='flex items-center justify-center gap-3 mb-4'>
                <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                <p className='text-lg text-gray-300'>Scanning website...</p>
              </div>
              <div className='space-y-3'>
                <div className='h-4 bg-gray-700 rounded w-3/4'></div>
                <div className='h-4 bg-gray-700 rounded w-1/2'></div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='max-w-5xl mx-auto mb-8 w-full'>
            <div className='bg-red-900/20 border border-red-500/50 rounded-2xl p-6'>
              <div className='flex items-start gap-3'>
                <svg
                  className='w-6 h-6 text-red-400 flex-shrink-0 mt-0.5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <div>
                  <h3 className='font-semibold text-red-300 mb-1'>
                    Analysis Failed
                  </h3>
                  <p className='text-red-200'>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result Card */}
        {result && !Array.isArray(result) && (
          <div className='max-w-5xl mx-auto mb-12 w-full'>
            <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-gray-700 mb-8'>
              <div className='p-6'>
                {/* Screenshot Image */}
                {result.screenshot_url && (
                  <div className='mb-6 flex justify-center'>
                    <ScreenshotWithSkeleton
                      src={result.screenshot_url}
                      alt='Website Screenshot'
                    />
                  </div>
                )}
                {/* Safety Score Bar and Label */}
                <div className='mb-6'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-gray-400 text-sm font-medium'>
                      Safety Score
                    </span>
                    <span
                      className={`text-3xl font-bold ${getRiskColor(result.risk_score)}`}
                    >
                      {result.risk_score ?? 'N/A'}/100
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-3 overflow-hidden'>
                    <div
                      className={`h-full transition-all duration-500 ${
                        result.risk_score >= 80
                          ? 'bg-green-500'
                          : result.risk_score >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${result.risk_score ?? 0}%` }}
                    ></div>
                  </div>
                  <p
                    className={`text-sm mt-2 font-semibold ${getRiskColor(result.risk_score)}`}
                  >
                    {result.risk_score >= 80
                      ? 'Safe'
                      : result.risk_score >= 50
                        ? 'Caution'
                        : 'Risky'}
                  </p>
                </div>
                <div className='mb-2'>
                  <span className='text-gray-400 text-sm font-medium'>
                    Category:{' '}
                  </span>
                  <span>{result.category ?? 'N/A'}</span>
                </div>
                <div className='mb-2'>
                  <span className='text-gray-400 text-sm font-medium'>
                    Summary:{' '}
                  </span>
                  <span>{result.summary ?? 'N/A'}</span>
                </div>
                {result.reason && (
                  <div className='mb-2'>
                    <span className='text-gray-400 text-sm font-medium'>
                      Why this Safety Score?{' '}
                    </span>
                    <span>{result.reason}</span>
                  </div>
                )}
                {Array.isArray(result.tags) && result.tags.length > 0 && (
                  <div className='mb-2'>
                    <span className='text-gray-400 text-sm font-medium'>
                      Tags:{' '}
                    </span>
                    <span>
                      {result.tags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className='bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs mr-2'
                        >
                          #{tag}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div className='max-w-5xl mx-auto w-full'>
            <h2 className='text-2xl font-bold mb-4 text-gray-200'>
              Recent Scans
            </h2>
            <div className='space-y-3'>
              {recentScans.map((scan) => (
                <button
                  key={scan.id}
                  onClick={() => handleQuickScan(scan.url)}
                  className='w-full bg-gray-800/30 hover:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all text-left group'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm text-gray-400 mb-1 truncate'>
                        {scan.url}
                      </p>
                      <div className='flex items-center gap-3'>
                        <span
                          className={`text-sm font-semibold ${getRiskColor(scan.risk_score)}`}
                        >
                          {scan.risk_score}/100
                        </span>
                        <span className='text-xs text-gray-500'>
                          {scan.category}
                        </span>
                        <span className='text-xs text-gray-600'>
                          {formatRelativeTime(scan.created_at)}
                        </span>
                      </div>
                    </div>
                    <svg
                      className='w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 ml-3'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5l7 7-7 7'
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
      </div>
    </div>
  );
}
