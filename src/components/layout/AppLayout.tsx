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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white relative overflow-hidden">
        {/* Glowing background effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-emerald-500/20 blur-[120px] rounded-full" />
        
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000">
          {/* Logo container with spin */}
          <div className="relative flex items-center justify-center mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-2xl border-t-2 border-emerald-500 animate-spin opacity-70" />
            <div className="absolute inset-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <span className="text-4xl font-bold text-white shadow-sm">£</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-zinc-200 to-zinc-500">
            Pounds Tracker
          </h1>
        </div>

        <div className="absolute bottom-12 text-center z-10 animate-pulse">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-1">
            Designed & Developed by
          </p>
          <p className="text-sm font-medium text-emerald-400/90 tracking-wide">
            Anand Pinisetty
          </p>
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
        <div className="p-4 mt-auto">
          <div className="relative overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900/50 p-4 border border-zinc-200/50 dark:border-zinc-800/50 group hover:border-emerald-500/30 transition-colors">
            {/* Subtle gradient background inside */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 text-center space-y-1.5">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-200">
                Pounds Tracker
              </p>
              <div className="h-px w-8 mx-auto bg-zinc-200 dark:bg-zinc-800" />
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider leading-relaxed">
                Designed & Developed by
              </p>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Anand Pinisetty
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 h-full w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pb-safe">
        <div className="flex items-center justify-around h-16 px-2 overflow-x-auto">
          {navItems.map((item) => {
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
