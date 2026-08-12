"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { motion } from "framer-motion";
import { MOCK_REVENUE_7_DAYS, MOCK_REVENUE_30_DAYS } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

export default function RevenueChart() {
  const [range, setRange] = useState<"7d" | "30d">("7d");

  const data = range === "7d" ? MOCK_REVENUE_7_DAYS : MOCK_REVENUE_30_DAYS;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 shadow-xl p-3 rounded-xl text-xs sm:text-sm space-y-1">
          <p className="font-semibold text-slate-600">{label}</p>
          <p className="text-[#111844] font-bold text-base">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-slate-500">
            Tiket: <span className="text-slate-800 font-medium">{payload[0].payload.tickets} pcs</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#111844]" />
            <h3 className="text-base font-bold text-slate-900">Performance Metrics</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Grafik pendapatan tiket harian
          </p>
        </div>

        {/* Toggle pills */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto gap-1">
          <button
            onClick={() => setRange("7d")}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              range === "7d"
                ? "bg-[#111844] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setRange("30d")}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              range === "30d"
                ? "bg-[#111844] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenueNavy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111844" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#111844" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#111844"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenueNavy)"
              isAnimationActive={true}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
