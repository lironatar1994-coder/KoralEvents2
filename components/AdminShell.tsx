"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "./Brand";
import { ArrowUpLeft, LayoutDashboard, LogOut, Plus } from "lucide-react";
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const login = pathname === "/admin/login";
  return (
    <div className="admin-app">
      <header className="admin-header">
        <Brand small />
        <span className="admin-wordmark">המרחב שלך</span>
        <div className="admin-header-actions">
          <Link href="/" className="text-link">
            לאתר <ArrowUpLeft size={16} />
          </Link>
          {!login && (
            <button
              className="icon-button"
              aria-label="יציאה מהחשבון"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/admin/login");
                router.refresh();
              }}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>
      {!login && (
        <nav className="admin-nav">
          <Link className={pathname === "/admin" ? "active" : ""} href="/admin">
            <LayoutDashboard size={17} /> האירועים שלי
          </Link>
          <Link
            className={pathname === "/admin/events/new" ? "active" : ""}
            href="/admin/events/new"
          >
            <Plus size={18} /> אירוע חדש
          </Link>
        </nav>
      )}
      {children}
    </div>
  );
}
