"use client";

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Lazy-loaded chart components to reduce initial bundle size
 * Charts are only loaded when needed, improving initial page load performance
 */

// Lazy load YearlyBarChart (includes recharts library)
export const LazyYearlyBarChart = dynamic<any>(
  () => import('./YearlyBarChart'),
  {
    loading: () => (
      <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
        <p className="text-sm text-gray-500">Loading chart...</p>
      </div>
    ),
    ssr: false, // Disable SSR for charts (they're client-side only)
  }
);

// Lazy load ProgressDonutCard (includes recharts library)
export const LazyProgressDonutCard = dynamic<any>(
  () => import('./ProgressDonutCard'),
  {
    loading: () => (
      <div className="h-full flex items-center justify-center bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="text-center">
          <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Lazy load BigCalendar (heavy calendar library)
export const LazyBigCalendar = dynamic<any>(
  () => import('../calendar/BigCalendar'),
  {
    loading: () => (
      <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
        <p className="text-sm text-gray-500">Loading calendar...</p>
      </div>
    ),
    ssr: false,
  }
);

export default {
  LazyYearlyBarChart,
  LazyProgressDonutCard,
  LazyBigCalendar,
};
