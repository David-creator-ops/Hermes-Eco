import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getVerificationColor(score: number): string {
  if (score >= 0.75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 0.5) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export function getVerificationBg(score: number): string {
  if (score >= 0.75) return 'bg-emerald-500';
  if (score >= 0.5) return 'bg-amber-500';
  return 'bg-red-400';
}

export function getVerificationScoreText(score: number): string {
  return `${Math.round(score * 8)}/8`;
}

export function getVerificationText(score: number): string {
  if (score >= 0.75) return 'Verified';
  if (score >= 0.5) return 'Community Listed';
  return 'Unverified';
}
