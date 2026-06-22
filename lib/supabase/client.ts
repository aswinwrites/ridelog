/**
 * Supabase Client — Cloud Sync Mode
 * Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import type { Ride, Bike, MaintenanceRecord, User } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

// ─── Auth ────────────────────────────────────────────────────

export async function signInWithGoogle() {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signInWithEmail(email: string) {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signOut() {
  if (!supabase) return;
  return supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    name: data.user.user_metadata?.full_name,
    avatarUrl: data.user.user_metadata?.avatar_url,
    createdAt: data.user.created_at ?? new Date().toISOString(),
  };
}

// ─── Sync — Rides ────────────────────────────────────────────

export async function syncRideToCloud(ride: Ride): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("rides").upsert({
    id: ride.id,
    user_id: user.id,
    start_time: ride.startTime,
    end_time: ride.endTime,
    status: ride.status,
    name: ride.name,
    notes: ride.notes,
    bike_id: ride.bikeId,
    analytics: ride.analytics ? JSON.stringify(ride.analytics) : null,
    synced_at: new Date().toISOString(),
    created_at: ride.createdAt,
    updated_at: ride.updatedAt,
  });

  if (error) throw error;
}

export async function fetchCloudRides(): Promise<Ride[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("rides")
    .select("*")
    .order("start_time", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    name: row.name,
    notes: row.notes,
    bikeId: row.bike_id,
    hasGpsTrack: false, // GPS points not synced in cloud (privacy)
    analytics: row.analytics ? JSON.parse(row.analytics) : null,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteCloudRide(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("rides").delete().eq("id", id);
  if (error) throw error;
}

// ─── Sync — Bikes ────────────────────────────────────────────

export async function syncBikeToCloud(bike: Bike): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("bikes").upsert({
    id: bike.id,
    user_id: user.id,
    name: bike.name,
    make: bike.make,
    model: bike.model,
    year: bike.year,
    type: bike.type,
    color: bike.color,
    purchase_date: bike.purchaseDate,
    current_odometer: bike.currentOdometer,
    fuel_efficiency_kml: bike.fuelEfficiencyKmL,
    is_default: bike.isDefault,
    created_at: bike.createdAt,
    updated_at: bike.updatedAt,
  });

  if (error) throw error;
}

// ─── Supabase SQL Schema (for reference) ─────────────────────
/*
-- Run this in Supabase SQL editor

create table public.rides (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  status text not null,
  name text not null,
  notes text,
  bike_id uuid,
  analytics jsonb,
  synced_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table public.bikes (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  make text,
  model text,
  year int,
  type text,
  color text,
  purchase_date date,
  current_odometer float,
  fuel_efficiency_kml float,
  is_default boolean default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- Row Level Security
alter table public.rides enable row level security;
alter table public.bikes enable row level security;

create policy "Users can manage their own rides" on public.rides
  for all using (auth.uid() = user_id);

create policy "Users can manage their own bikes" on public.bikes
  for all using (auth.uid() = user_id);
*/
