'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
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
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'quick' | 'deep' | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const { data: session } = useSession();

  // Fetch recent scans on mount and listen for auth changes
  useEffect(() => {
    fetchRecentScans();
  }, []);

  // Removed handleSignIn and handleSignOut

  const fetchRecentScans = async () => {
    try {
      const response = await fetch('/api/recent');
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
      const endpoint =
        scanType === 'quick' ? '/api/analyze' : '/api/analyze/deep';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      {/* Top Navigation Bar with Login */}
      <nav className='w-full bg-gray-900/50 backdrop-blur-sm border-b border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 py-3 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
              <svg
                className='w-5 h-5'
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
            <span className='text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'>
              LinkRay
            </span>
          </div>
          {/* Google Sign-In Button - Top Right */}
          <div>
            {session ? (
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2'>
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt='Profile'
                      className='w-8 h-8 rounded-full border-2 border-blue-500'
                    />
                  )}
                  <span className='text-sm text-gray-300 hidden sm:inline'>
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <button
                  className='bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-all text-sm'
                  onClick={() => signOut()}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className='bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm'
                onClick={() => signIn('google')}
              >
                <svg
                  className='w-5 h-5'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path
                    d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    fill='#4285F4'
                  />
                  <path
                    d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    fill='#34A853'
                  />
                  <path
                    d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    fill='#FBBC05'
                  />
                  <path
                    d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    fill='#EA4335'
                  />
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </nav>

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
                  <div className='mb-6 flex flex-col items-center justify-center'>
                    <ScreenshotWithSkeleton
                      src={result.screenshot_url}
                      alt='Website Screenshot'
                    />
                    {result.url && (
                      <a
                        href={
                          result.url.startsWith('http')
                            ? result.url
                            : `https://${result.url}`
                        }
                        target='_blank'
                        rel='noopener noreferrer'
                        className='mt-3 inline-block text-blue-400 hover:text-blue-200 underline break-all text-sm font-medium transition-colors'
                        aria-label='Open scanned website in new tab'
                      >
                        {result.url}
                        <svg
                          className='inline ml-1 mb-0.5 w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M14 3h7m0 0v7m0-7L10 14m-7 7h7a2 2 0 002-2v-7'
                          ></path>
                        </svg>
                      </a>
                    )}
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
                        <span className='flex-1 text-right text-xs text-gray-600 block sm:text-left'>
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
