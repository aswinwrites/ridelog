"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Route, BarChart3, Bike } from "lucide-react";
import { cn } from "@/lib/utils/format";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/rides", icon: Route, label: "Rides" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/bike", icon: Bike, label: "Garage" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide nav on active ride screen
  if (pathname.startsWith("/ride/active")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass safe-pb">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-4 py-1 relative"
            >
              <span className="relative">
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 -m-2 rounded-xl bg-primary/10"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                  />
                )}
                <Icon
                  size={22}
                  className={cn(
                    "relative z-10 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </span>
              <span
                className={cn(
                  "text-2xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
