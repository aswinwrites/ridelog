"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Filter, ChevronRight } from "lucide-react";
import { useRideStore } from "@/store/useRideStore";
import { RideCard } from "@/components/home/RecentRides";
import { toMonthString } from "@/lib/utils/format";

type SortKey = "newest" | "oldest" | "distance" | "duration";

export function RidesScreen() {
  const { rides } = useRideStore();
  const [query, setQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");

  const completed = useMemo(
    () => rides.filter((r) => r.status === "completed"),
    [rides]
  );

  // Available months
  const months = useMemo(() => {
    const set = new Set(completed.map((r) => toMonthString(new Date(r.startTime))));
    return Array.from(set).sort().reverse();
  }, [completed]);

  const filtered = useMemo(() => {
    let list = [...completed];

    if (selectedMonth) {
      list = list.filter((r) => toMonthString(new Date(r.startTime)) === selectedMonth);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "newest":
        list.sort((a, b) => b.startTime.localeCompare(a.startTime));
        break;
      case "oldest":
        list.sort((a, b) => a.startTime.localeCompare(b.startTime));
        break;
      case "distance":
        list.sort((a, b) => (b.analytics?.distanceKm ?? 0) - (a.analytics?.distanceKm ?? 0));
        break;
      case "duration":
        list.sort((a, b) => (b.analytics?.durationSeconds ?? 0) - (a.analytics?.durationSeconds ?? 0));
        break;
    }

    return list;
  }, [completed, selectedMonth, query, sort]);

  return (
    <div className="min-h-screen bg-bg-base pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Rides</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {completed.length} rides recorded
        </p>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2 bg-bg-card border border-border/50 rounded-xl px-3 py-2.5">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search rides…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Month filter */}
      {months.length > 0 && (
        <div className="px-5 mb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedMonth(null)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                selectedMonth === null
                  ? "bg-primary text-white border-primary"
                  : "bg-bg-card text-muted-foreground border-border/50"
              }`}
            >
              All
            </button>
            {months.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(selectedMonth === m ? null : m)}
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  selectedMonth === m
                    ? "bg-primary text-white border-primary"
                    : "bg-bg-card text-muted-foreground border-border/50"
                }`}
              >
                {new Date(m + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          {(["newest", "oldest", "distance", "duration"] as SortKey[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${
                sort === s ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Rides list */}
      {filtered.length === 0 ? (
        <div className="px-5">
          <div className="bg-bg-card rounded-2xl p-8 border border-border/50 text-center">
            <p className="text-muted-foreground text-sm">
              {query || selectedMonth ? "No rides match your filter" : "No rides yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-3">
          {filtered.map((ride, i) => (
            <motion.div
              key={ride.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <Link href={`/rides/${ride.id}`}>
                <RideCard ride={ride} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
