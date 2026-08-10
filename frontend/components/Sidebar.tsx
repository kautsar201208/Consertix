"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  userName?: string;
  userEmail?: string;
};

const menuItems = [
  { label: "Dashboard", href: "/Dashboard" },
  { label: "Daftar Event", href: "/Dashboard/DaftarEvent" },
  { label: "Tambah Event", href: "/Dashboard/TambahEvent" },
  { label: "Transaksi", href: "/Dashboard/Transaksi" },
  { label: "Laporan", href: "/Dashboard/Laporan" },
];

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-72 rounded-2xl bg-slate-800 p-4">
      <div className="mb-6">
        <p className="text-sm font-medium text-cyan-300">Dashboard</p>
        <h1 className="mt-2 text-2xl font-bold">Admin Panel</h1>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-slate-700 text-slate-100 hover:bg-slate-600"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {userName ? (
        <div className="mt-8 rounded-2xl bg-slate-700 p-4 text-sm">
          <p className="text-slate-400">Login sebagai</p>
          <p className="mt-1 font-semibold">{userName}</p>
          <p className="text-slate-300">{userEmail}</p>
        </div>
      ) : null}
    </aside>
  );
}
