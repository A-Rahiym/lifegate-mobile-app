import { create } from 'zustand';
import { ReportStatus, ProfessionalDashboard } from '../types/professional-types';
import { ProfessionalService } from '../services/professional-service';

type ProfessionalStore = ProfessionalDashboard & {
  fetchReports: () => Promise<void>;
  setFilter: (filter: ReportStatus | 'All') => void;
  searchReports: (query: string) => void;
  clearSearch: () => void;
};

export const useProfessionalStore = create<ProfessionalStore>((set, get) => ({
  // Initial state
  stats: {
    totalReports: 0,
    pendingCount: 0,
    activeCount: 0,
    completedCount: 0,
  },
  reports: [],
  filteredReports: [],
  selectedFilter: 'All',
  searchQuery: '',
  loading: false,
  error: null,

  // Actions
  fetchReports: async () => {
    set({ loading: true, error: null });
    try {
      const reports = await ProfessionalService.getProfessionalReports();
      const stats = await ProfessionalService.getProfessionalStats();
      
      set({
        reports,
        filteredReports: reports,
        stats,
        loading: false,
      });
      
      // Apply current filter
      get().setFilter(get().selectedFilter);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch reports',
        loading: false,
      });
    }
  },

  setFilter: (filter: ReportStatus | 'All') => {
    set(state => {
      const filtered = filter === 'All'
        ? state.reports
        : state.reports.filter(report => report.status === filter);

      return {
        selectedFilter: filter,
        filteredReports: filtered,
      };
    });
  },

  searchReports: (query: string) => {
    set(state => {
      const lowerQuery = query.toLowerCase();
      const filtered = state.reports.filter(report =>
        report.title.toLowerCase().includes(lowerQuery) ||
        report.description.toLowerCase().includes(lowerQuery) ||
        report.patientId.toLowerCase().includes(lowerQuery) ||
        report.patientName.toLowerCase().includes(lowerQuery)
      );

      // Apply current filter on top of search
      const currentFilter = state.selectedFilter;
      const finalFiltered = currentFilter === 'All'
        ? filtered
        : filtered.filter(report => report.status === currentFilter);

      return {
        searchQuery: query,
        filteredReports: finalFiltered,
      };
    });
  },

  clearSearch: () => {
    set(state => {
      const currentFilter = state.selectedFilter;
      const filtered = currentFilter === 'All'
        ? state.reports
        : state.reports.filter(report => report.status === currentFilter);

      return {
        searchQuery: '',
        filteredReports: filtered,
      };
    });
  },
}));
