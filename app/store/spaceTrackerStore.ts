import { create } from "zustand";

export interface Location {
  lat: number;
  lng: number;
  label: string;
  country?: string;
  flag?: string;
}

interface SpaceTrackerState {
  activeLocation: Location;
  setActiveLocation: (loc: Location) => void;
  selectedObjectId: string;
  setSelectedObjectId: (id: string) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  simulationTime: number;
  setSimulationTime: (time: number | ((prev: number) => number)) => void;
  crtEnabled: boolean;
  setCrtEnabled: (val: boolean) => void;
  hudGridEnabled: boolean;
  setHudGridEnabled: (val: boolean) => void;
  trackingActive: boolean;
  setTrackingActive: (val: boolean) => void;
}

export const useSpaceTrackerStore = create<SpaceTrackerState>((set) => ({
  activeLocation: { lat: 28.5729, lng: -80.649, label: "Kennedy Space Center", country: "Florida, USA", flag: "🇺🇸" },
  setActiveLocation: (loc) => set({ activeLocation: loc }),
  selectedObjectId: "iss",
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
  simulationSpeed: 1,
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  simulationTime: Date.now(),
  setSimulationTime: (time) => 
    set((state) => ({
      simulationTime: typeof time === "function" ? time(state.simulationTime) : time,
    })),
  crtEnabled: false,
  setCrtEnabled: (val) => set({ crtEnabled: val }),
  hudGridEnabled: true,
  setHudGridEnabled: (val) => set({ hudGridEnabled: val }),
  trackingActive: true,
  setTrackingActive: (val) => set({ trackingActive: val }),
}));
