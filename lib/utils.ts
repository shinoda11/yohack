import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Recharts/Canvas cannot read CSS variables — use these constants instead. */
export const CHART_COLORS = {
  median: '#374151',
  secondary: '#9ca3af',
  tertiary: '#6b7280',
  gold: '#C8B89A',
  bronze: '#8A7A62',
  stone: '#5A5550',
  safe: '#4A7C59',
  danger: '#8A7A62',  // red removed — use bronze for zero line
  canvas: '#FAF9F7',
} as const;
