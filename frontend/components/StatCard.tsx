"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  color?: "navy" | "indigo" | "emerald" | "amber" | "violet";
  subtitle?: string;
  delay?: number;
}

const colorMap = {
  navy: { iconBg: "bg-[#111844]/10 text-[#111844] border border-[#111844]/20" },
  indigo: { iconBg: "bg-[#111844]/10 text-[#111844] border border-[#111844]/20" },
  emerald: { iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  amber: { iconBg: "bg-amber-50 text-amber-600 border border-amber-100" },
  violet: { iconBg: "bg-[#111844]/10 text-[#111844] border border-[#111844]/20" }
};

export default function StatCard({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  color = "navy",
  subtitle = "vs last month",
  delay = 0
}: StatCardProps) {
  const colorStyles = colorMap[color] || colorMap.navy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="relative p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="mt-2.5 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {change}
            </span>
            <span className="text-xs text-slate-400">{subtitle}</span>
          </div>
        </div>

        <div className={`p-3 rounded-2xl ${colorStyles.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}
