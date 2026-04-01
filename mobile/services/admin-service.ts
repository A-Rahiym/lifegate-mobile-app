import api from './api';
import type {
  DashboardStats,
  AdminCaseRow,
  SLAItem,
  EDISMetrics,
  PhysicianRow,
  AdminCaseFilters,
  PaginatedCases,
} from '../types/admin-types';

export const AdminService = {
  async getDashboard(): Promise<DashboardStats> {
    const { data } = await api.get('/admin/dashboard');
    return data.data as DashboardStats;
  },

  async getCases(filters: AdminCaseFilters = {}): Promise<PaginatedCases> {
    const params: Record<string, string | number> = {};
    if (filters.status)   params.status   = filters.status;
    if (filters.urgency)  params.urgency  = filters.urgency;
    if (filters.category) params.category = filters.category;
    if (filters.search)   params.search   = filters.search;
    if (filters.page)     params.page     = filters.page;
    if (filters.pageSize) params.pageSize = filters.pageSize;

    const { data } = await api.get('/admin/cases', { params });
    return { data: data.data as AdminCaseRow[], meta: data.meta };
  },

  async getSLA(): Promise<SLAItem[]> {
    const { data } = await api.get('/admin/sla');
    return data.data as SLAItem[];
  },

  async getEDISMetrics(days = 30): Promise<EDISMetrics> {
    const { data } = await api.get('/admin/metrics/edis', { params: { days } });
    return data.data as EDISMetrics;
  },

  async getPhysicians(): Promise<PhysicianRow[]> {
    const { data } = await api.get('/admin/physicians');
    return data.data as PhysicianRow[];
  },
};
