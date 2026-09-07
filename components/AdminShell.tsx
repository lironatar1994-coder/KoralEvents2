"use client";
import { appPath } from "@/lib/paths";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "./Brand";
import { ArrowUpLeft, LayoutDashboard, LogOut } from "lucide-react";
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const login = pathname === "/admin/login";
  const dashboard = pathname === "/admin";
  return (
    <div className="admin-app">
      <header className={`admin-header ${dashboard ? "dashboard-header" : ""}`}>
        <Brand small />
        {!login && !dashboard && (
          <nav className="admin-nav" aria-label="ניווט ניהול">
            <Link
              className={pathname === "/admin" ? "active" : ""}
              href="/admin"
            >
              <LayoutDashboard size={17} /> האירועים שלי
            </Link>
          </nav>
        )}
        <div className="admin-header-actions">
          <Link href="/" className="text-link">
            לאתר <ArrowUpLeft size={16} />
          </Link>
          {!login && (
            <button
              className="icon-button"
              aria-label="יציאה מהחשבון"
              onClick={async () => {
                await fetch(appPath("/api/auth/logout"), { method: "POST" });
                router.push("/admin/login");
                router.refresh();
              }}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
