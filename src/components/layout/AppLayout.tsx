import React, { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "../../contexts/AuthContext";
import { Home, Briefcase, CreditCard, Receipt, PieChart, Wallet, User as UserIcon } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, firebaseError } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (firebaseError) {
    return <>{children}</>;
  }

  if (showSplash) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white relative">
        <div className="animate-pulse text-6xl font-extrabold tracking-tighter text-center px-4">
          <span className="text-emerald-500">£</span> → THE POUNDSTRACKER
        </div>
        <div className="absolute bottom-8 text-sm text-zinc-500 animate-pulse text-center">
          designed and developed by anand pinisetty
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Work", href: "/work", icon: Briefcase },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Savings", href: "/savings", icon: Wallet },
    { name: "Reports", href: "/reports", icon: PieChart },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-full">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-emerald-500">£</span> PoundsTracker
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href as any}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/50 text-xs text-zinc-400 text-center">
          designed and developed by anand pinisetty
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 h-full w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href as any}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "fill-current/20" : ""}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
