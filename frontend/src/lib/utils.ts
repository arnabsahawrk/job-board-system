import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format salary as ৳ per month.
 * Backend stores annual salary — we divide by 12 for monthly display.
 */
export function formatSalary(salary: number | null): string {
  if (!salary) return "Negotiable";
  const monthly = salary;
  return `৳${monthly.toLocaleString("en-BD")}/mo`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateString);
}

export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: Record<string, unknown> } };
    const data = axiosError.response?.data;
    if (!data) return "Something went wrong. Please try again.";
    if (typeof data === "string") return data;
    if (data.error && typeof data.error === "string") return data.error;
    if (data.detail && typeof data.detail === "string") return data.detail;
    if (data.message && typeof data.message === "string") return data.message;
    if (Array.isArray(data.non_field_errors)) return String(data.non_field_errors[0]);
    const firstKey = Object.keys(data).find((k) => Array.isArray(data[k]));
    if (firstKey) return `${firstKey}: ${(data[firstKey] as string[])[0]}`;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
