/**
 * RideLog Bike Store (Zustand)
 * Manages bike profiles and maintenance records
 */

import { create } from "zustand";
import type { Bike, MaintenanceRecord } from "@/types";
import {
  saveBike,
  getAllBikes,
  getBike as dbGetBike,
  deleteBike as dbDeleteBike,
  saveMaintenanceRecord,
  getMaintenanceByBike,
  deleteMaintenanceRecord as dbDeleteMaintenance,
} from "@/lib/db/indexeddb";
import { uuid } from "@/lib/utils/format";

interface BikeStore {
  bikes: Bike[];
  maintenance: Record<string, MaintenanceRecord[]>; // bikeId → records
  isLoading: boolean;

  loadBikes: () => Promise<void>;
  addBike: (data: Omit<Bike, "id" | "createdAt" | "updatedAt" | "isDefault">) => Promise<Bike>;
  updateBike: (id: string, data: Partial<Bike>) => Promise<void>;
  deleteBike: (id: string) => Promise<void>;
  setDefaultBike: (id: string) => Promise<void>;

  loadMaintenance: (bikeId: string) => Promise<void>;
  addMaintenance: (record: Omit<MaintenanceRecord, "id" | "createdAt">) => Promise<MaintenanceRecord>;
  deleteMaintenance: (id: string, bikeId: string) => Promise<void>;

  getDefaultBike: () => Bike | undefined;
}

export const useBikeStore = create<BikeStore>()((set, get) => ({
  bikes: [],
  maintenance: {},
  isLoading: false,

  loadBikes: async () => {
    set({ isLoading: true });
    try {
      const bikes = await getAllBikes();
      set({ bikes, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addBike: async (data) => {
    const now = new Date().toISOString();
    const bikes = get().bikes;
    const bike: Bike = {
      ...data,
      id: uuid(),
      isDefault: bikes.length === 0,
      createdAt: now,
      updatedAt: now,
    };
    await saveBike(bike);
    set((s) => ({ bikes: [...s.bikes, bike] }));
    return bike;
  },

  updateBike: async (id, data) => {
    const bikes = get().bikes;
    const existing = bikes.find((b) => b.id === id);
    if (!existing) return;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await saveBike(updated);
    set((s) => ({ bikes: s.bikes.map((b) => (b.id === id ? updated : b)) }));
  },

  deleteBike: async (id) => {
    await dbDeleteBike(id);
    set((s) => ({ bikes: s.bikes.filter((b) => b.id !== id) }));
  },

  setDefaultBike: async (id) => {
    const bikes = get().bikes;
    const updated = bikes.map((b) => ({ ...b, isDefault: b.id === id }));
    for (const b of updated) await saveBike(b);
    set({ bikes: updated });
  },

  loadMaintenance: async (bikeId) => {
    const records = await getMaintenanceByBike(bikeId);
    set((s) => ({ maintenance: { ...s.maintenance, [bikeId]: records } }));
  },

  addMaintenance: async (data) => {
    const now = new Date().toISOString();
    const record: MaintenanceRecord = {
      ...data,
      id: uuid(),
      createdAt: now,
    };
    await saveMaintenanceRecord(record);
    set((s) => ({
      maintenance: {
        ...s.maintenance,
        [record.bikeId]: [record, ...(s.maintenance[record.bikeId] ?? [])],
      },
    }));
    return record;
  },

  deleteMaintenance: async (id, bikeId) => {
    await dbDeleteMaintenance(id);
    set((s) => ({
      maintenance: {
        ...s.maintenance,
        [bikeId]: (s.maintenance[bikeId] ?? []).filter((r) => r.id !== id),
      },
    }));
  },

  getDefaultBike: () => {
    return get().bikes.find((b) => b.isDefault) ?? get().bikes[0];
  },
}));
