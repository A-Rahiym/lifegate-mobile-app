import { create } from 'zustand';
import { AdminService } from '../services/admin-service';
import type {
  DashboardStats,
  AdminCaseRow,
  SLAItem,
  EDISMetrics,
  PhysicianRow,
  AdminCaseFilters,
} from '../types/admin-types';

type AdminState = {
  // Data
  dashboard: DashboardStats | null;
  cases: AdminCaseRow[];
  casesTotal: number;
  slaItems: SLAItem[];
  edisMetrics: EDISMetrics | null;
  physicians: PhysicianRow[];

  // Filters
  filters: AdminCaseFilters;

  // UI state
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Actions
  fetchDashboard: () => Promise<void>;
  fetchCases: (filters?: AdminCaseFilters) => Promise<void>;
  fetchSLA: () => Promise<void>;
  fetchEDISMetrics: (days?: number) => Promise<void>;
  fetchPhysicians: () => Promise<void>;
  fetchAll: () => Promise<void>;
  setFilters: (f: Partial<AdminCaseFilters>) => void;
  clearError: () => void;
};

export const useAdminStore = create<AdminState>((set, get) => ({
  dashboard: null,
  cases: [],
  casesTotal: 0,
  slaItems: [],
  edisMetrics: null,
  physicians: [],
  filters: { status: '', urgency: '', search: '', page: 1, pageSize: 20 },
  loading: false,
  refreshing: false,
  error: null,

  fetchDashboard: async () => {
    try {
      const dashboard = await AdminService.getDashboard();
      set({ dashboard });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load dashboard' });
    }
  },

  fetchCases: async (extraFilters?: AdminCaseFilters) => {
    const filters = { ...get().filters, ...extraFilters };
    try {
      const result = await AdminService.getCases(filters);
      set({ cases: result.data, casesTotal: result.meta.total, filters });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load cases' });
    }
  },

  fetchSLA: async () => {
    try {
      const slaItems = await AdminService.getSLA();
      set({ slaItems });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load SLA' });
    }
  },

  fetchEDISMetrics: async (days = 30) => {
    try {
      const edisMetrics = await AdminService.getEDISMetrics(days);
      set({ edisMetrics });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load EDIS metrics' });
    }
  },

  fetchPhysicians: async () => {
    try {
      const physicians = await AdminService.getPhysicians();
      set({ physicians });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load physicians' });
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null });
    await Promise.all([
      get().fetchDashboard(),
      get().fetchCases(),
      get().fetchSLA(),
      get().fetchEDISMetrics(),
      get().fetchPhysicians(),
    ]);
    set({ loading: false });
  },

  setFilters: (f) => {
    set((state) => ({ filters: { ...state.filters, ...f } }));
  },

  clearError: () => set({ error: null }),
}));
