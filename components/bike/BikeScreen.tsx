"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Bike, Wrench, Fuel, Calendar, DollarSign, ChevronRight, Star, Trash2 } from "lucide-react";
import { useBikeStore } from "@/store/useBikeStore";
import type { Bike as BikeType, MaintenanceRecord, MaintenanceType } from "@/types";
import { formatDate, formatCurrency, uuid } from "@/lib/utils/format";
import {
  trackBikeAdded,
  trackBikeDeleted,
  trackBikeSetDefault,
  trackMaintenanceLogged,
} from "@/lib/analytics/gtag";

const MAINTENANCE_LABELS: Record<MaintenanceType, string> = {
  service: "Full Service",
  tyre_change: "Tyre Change",
  chain_service: "Chain Service",
  insurance_renewal: "Insurance Renewal",
  oil_change: "Oil Change",
  brake_service: "Brake Service",
  battery_change: "Battery Change",
  wash: "Wash & Detail",
  other: "Other",
};

const MAINTENANCE_ICONS: Record<string, string> = {
  service: "🔧",
  tyre_change: "🛞",
  chain_service: "⛓️",
  insurance_renewal: "📋",
  oil_change: "🛢️",
  brake_service: "🛑",
  battery_change: "🔋",
  wash: "🚿",
  other: "📝",
};

export function BikeScreen() {
  const { bikes, maintenance, loadBikes, loadMaintenance, addBike, deleteBike, setDefaultBike, addMaintenance } = useBikeStore();
  const [showAddBike, setShowAddBike] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [bikeForm, setBikeForm] = useState({ name: "", make: "", model: "", year: "", currentOdometer: "", fuelEfficiencyKmL: "" });
  const [maintForm, setMaintForm] = useState({ type: "service" as MaintenanceType, date: new Date().toISOString().slice(0, 10), cost: "", notes: "", serviceProvider: "" });

  useEffect(() => {
    loadBikes();
  }, [loadBikes]);

  useEffect(() => {
    const defaultBike = bikes.find((b) => b.isDefault) ?? bikes[0];
    if (defaultBike && !selectedBikeId) {
      setSelectedBikeId(defaultBike.id);
      loadMaintenance(defaultBike.id);
    }
  }, [bikes, selectedBikeId, loadMaintenance]);

  const selectedBike = bikes.find((b) => b.id === selectedBikeId);
  const selectedMaintenance = selectedBikeId ? (maintenance[selectedBikeId] ?? []) : [];

  const handleAddBike = async () => {
    if (!bikeForm.name.trim()) return;
    const bike = await addBike({
      name: bikeForm.name.trim(),
      make: bikeForm.make || undefined,
      model: bikeForm.model || undefined,
      year: bikeForm.year ? parseInt(bikeForm.year) : undefined,
      currentOdometer: bikeForm.currentOdometer ? parseFloat(bikeForm.currentOdometer) : undefined,
      fuelEfficiencyKmL: bikeForm.fuelEfficiencyKmL ? parseFloat(bikeForm.fuelEfficiencyKmL) : undefined,
    });
    setSelectedBikeId(bike.id);
    setShowAddBike(false);
    setBikeForm({ name: "", make: "", model: "", year: "", currentOdometer: "", fuelEfficiencyKmL: "" });
    trackBikeAdded({
      has_make: !!bikeForm.make,
      has_model: !!bikeForm.model,
      has_year: !!bikeForm.year,
      has_odometer: !!bikeForm.currentOdometer,
    });
  };

  const handleAddMaintenance = async () => {
    if (!selectedBikeId) return;
    await addMaintenance({
      bikeId: selectedBikeId,
      type: maintForm.type,
      date: maintForm.date,
      cost: maintForm.cost ? parseFloat(maintForm.cost) : undefined,
      notes: maintForm.notes || undefined,
      serviceProvider: maintForm.serviceProvider || undefined,
    });
    setShowAddMaintenance(false);
    setMaintForm({ type: "service", date: new Date().toISOString().slice(0, 10), cost: "", notes: "", serviceProvider: "" });
    trackMaintenanceLogged({
      type: maintForm.type,
      has_cost: !!maintForm.cost,
      has_provider: !!maintForm.serviceProvider,
    });
  };

  return (
    <div className="min-h-screen bg-bg-base pb-24">
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Garage</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{bikes.length} bike{bikes.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowAddBike(true)}
          className="bg-primary/15 border border-primary/30 text-primary rounded-xl px-3 py-2 flex items-center gap-1.5 text-sm font-medium"
        >
          <Plus size={16} />
          Add Bike
        </button>
      </div>

      {/* Bike selector */}
      {bikes.length > 0 ? (
        <>
          <div className="px-5 mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {bikes.map((b) => (
              <button
                key={b.id}
                onClick={() => { setSelectedBikeId(b.id); loadMaintenance(b.id); }}
                className={`shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedBikeId === b.id
                    ? "bg-primary text-white border-primary"
                    : "bg-bg-card text-muted-foreground border-border/50"
                }`}
              >
                <Bike size={14} />
                {b.name}
                {b.isDefault && <Star size={10} className="fill-current" />}
              </button>
            ))}
          </div>

          {selectedBike && (
            <div className="px-5">
              {/* Bike details card */}
              <motion.div
                key={selectedBike.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card rounded-2xl p-5 border border-border/50 mb-4"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{selectedBike.name}</h2>
                    {(selectedBike.make || selectedBike.model) && (
                      <p className="text-sm text-muted-foreground">
                        {[selectedBike.make, selectedBike.model, selectedBike.year].filter(Boolean).join(" ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedBike.isDefault && (
                      <button
                        onClick={() => { setDefaultBike(selectedBike.id); trackBikeSetDefault(); }}
                        className="text-xs text-muted-foreground bg-bg-surface px-2.5 py-1.5 rounded-lg"
                      >
                        Set default
                      </button>
                    )}
                    {selectedBike.isDefault && (
                      <span className="text-xs text-warning bg-warning/10 px-2.5 py-1 rounded-full">Default</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {selectedBike.currentOdometer && (
                    <div className="bg-bg-surface rounded-xl p-3">
                      <p className="text-2xs text-muted-foreground mb-1">Odometer</p>
                      <p className="text-sm font-bold font-numeric">{selectedBike.currentOdometer.toLocaleString()} km</p>
                    </div>
                  )}
                  {selectedBike.fuelEfficiencyKmL && (
                    <div className="bg-bg-surface rounded-xl p-3">
                      <p className="text-2xs text-muted-foreground mb-1">Efficiency</p>
                      <p className="text-sm font-bold font-numeric">{selectedBike.fuelEfficiencyKmL} km/L</p>
                    </div>
                  )}
                  {selectedBike.purchaseDate && (
                    <div className="bg-bg-surface rounded-xl p-3">
                      <p className="text-2xs text-muted-foreground mb-1">Purchased</p>
                      <p className="text-sm font-bold">{formatDate(selectedBike.purchaseDate, "short")}</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Maintenance log */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Maintenance Log</h3>
                <button
                  onClick={() => setShowAddMaintenance(true)}
                  className="text-xs text-primary font-medium flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Record
                </button>
              </div>

              {selectedMaintenance.length === 0 ? (
                <div className="bg-bg-card rounded-2xl p-6 border border-border/50 text-center">
                  <Wrench size={28} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No maintenance records yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedMaintenance.map((record) => (
                    <MaintenanceRow key={record.id} record={record} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="px-5">
          <div className="bg-bg-card rounded-2xl p-8 border border-border/50 text-center">
            <Bike size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground-secondary font-medium mb-1">No bikes added</p>
            <p className="text-xs text-muted-foreground mb-4">Add your motorcycle to track maintenance</p>
            <button
              onClick={() => setShowAddBike(true)}
              className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm"
            >
              Add My Bike
            </button>
          </div>
        </div>
      )}

      {/* Add Bike Sheet */}
      <BottomSheet show={showAddBike} onClose={() => setShowAddBike(false)} title="Add Bike">
        <div className="flex flex-col gap-3">
          <FormField label="Bike Name *" placeholder="e.g. My R15 V4" value={bikeForm.name} onChange={(v) => setBikeForm((f) => ({ ...f, name: v }))} />
          <FormField label="Make" placeholder="e.g. Yamaha" value={bikeForm.make} onChange={(v) => setBikeForm((f) => ({ ...f, make: v }))} />
          <FormField label="Model" placeholder="e.g. R15 V4" value={bikeForm.model} onChange={(v) => setBikeForm((f) => ({ ...f, model: v }))} />
          <FormField label="Year" placeholder="e.g. 2023" value={bikeForm.year} onChange={(v) => setBikeForm((f) => ({ ...f, year: v }))} inputMode="numeric" />
          <FormField label="Current Odometer (km)" placeholder="e.g. 5200" value={bikeForm.currentOdometer} onChange={(v) => setBikeForm((f) => ({ ...f, currentOdometer: v }))} inputMode="decimal" />
          <FormField label="Fuel Efficiency (km/L)" placeholder="e.g. 42" value={bikeForm.fuelEfficiencyKmL} onChange={(v) => setBikeForm((f) => ({ ...f, fuelEfficiencyKmL: v }))} inputMode="decimal" />
          <button
            onClick={handleAddBike}
            disabled={!bikeForm.name.trim()}
            className="mt-2 bg-primary text-white font-bold py-4 rounded-2xl disabled:opacity-40"
          >
            Add Bike
          </button>
        </div>
      </BottomSheet>

      {/* Add Maintenance Sheet */}
      <BottomSheet show={showAddMaintenance} onClose={() => setShowAddMaintenance(false)} title="Add Service Record">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Service Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(MAINTENANCE_LABELS) as MaintenanceType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setMaintForm((f) => ({ ...f, type: t }))}
                  className={`text-xs py-2 px-1 rounded-xl border font-medium transition-all ${
                    maintForm.type === t ? "bg-primary border-primary text-white" : "bg-bg-surface border-border/50 text-muted-foreground"
                  }`}
                >
                  {MAINTENANCE_ICONS[t]} {MAINTENANCE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <FormField label="Date" value={maintForm.date} onChange={(v) => setMaintForm((f) => ({ ...f, date: v }))} type="date" />
          <FormField label="Cost (₹)" placeholder="e.g. 2500" value={maintForm.cost} onChange={(v) => setMaintForm((f) => ({ ...f, cost: v }))} inputMode="decimal" />
          <FormField label="Service Provider" placeholder="e.g. Yamaha Service" value={maintForm.serviceProvider} onChange={(v) => setMaintForm((f) => ({ ...f, serviceProvider: v }))} />
          <FormField label="Notes" placeholder="Any additional notes" value={maintForm.notes} onChange={(v) => setMaintForm((f) => ({ ...f, notes: v }))} />
          <button
            onClick={handleAddMaintenance}
            className="mt-2 bg-primary text-white font-bold py-4 rounded-2xl"
          >
            Save Record
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

function MaintenanceRow({ record }: { record: MaintenanceRecord }) {
  return (
    <div className="bg-bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-3">
      <span className="text-2xl">{MAINTENANCE_ICONS[record.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{MAINTENANCE_LABELS[record.type]}</p>
        <p className="text-xs text-muted-foreground">{formatDate(record.date, "short")}</p>
        {record.serviceProvider && (
          <p className="text-xs text-muted-foreground truncate">{record.serviceProvider}</p>
        )}
      </div>
      {record.cost && (
        <span className="text-sm font-bold text-primary font-numeric shrink-0">
          ₹{record.cost.toLocaleString()}
        </span>
      )}
    </div>
  );
}

function BottomSheet({ show, onClose, title, children }: {
  show: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-30"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-bg-card rounded-t-3xl p-6 pb-10 safe-pb max-h-[90vh] overflow-y-auto"
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold mb-5">{title}</h3>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FormField({ label, value, onChange, placeholder, inputMode, type = "text" }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric" | "text";
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full bg-bg-surface border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 transition-colors"
      />
    </div>
  );
}
