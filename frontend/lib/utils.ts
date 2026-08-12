import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

export function getStatusBadgeStyle(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "paid":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "pending":
    case "draft":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "failed":
    case "ended":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}
