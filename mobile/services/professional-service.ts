import api from './api';
import { PatientReport, ProfessionalStats } from '../types/professional-types';

// Helper to format timestamp from ISO string to relative time
const formatTimestamp = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Shape returned by the backend physician reports endpoint
interface BackendReport {
  id: string;
  user_id: string;
  status: string;
  title: string;
  description: string;
  condition: string;
  urgency: string;
  physician_notes: string;
  patient_name: string;
  created_at: string;
  updated_at: string;
}

const mapReport = (r: BackendReport): PatientReport => ({
  id: r.id,
  patientId: r.user_id,
  patientName: r.patient_name || 'Unknown Patient',
  reportType: 'Report',
  title: r.title || 'No title',
  description: r.description || 'No description',
  status: (r.status as PatientReport['status']) || 'Pending',
  timestamp: formatTimestamp(r.created_at),
  createdAt: new Date(r.created_at),
});

export const ProfessionalService = {
  /**
   * Fetch all patient reports for the physician
   * GET /physician/reports
   */
  async getProfessionalReports(page = 1, pageSize = 100): Promise<PatientReport[]> {
    const response = await api.get<{
      success: boolean;
      data: { reports: BackendReport[]; total: number; page: number; pageSize: number };
    }>('/physician/reports', { params: { page, pageSize } });

    if (!response.data.success) {
      throw new Error('Failed to fetch reports');
    }
    return (response.data.data.reports ?? []).map(mapReport);
  },

  /**
   * Get professional dashboard stats
   * GET /physician/stats
   */
  async getProfessionalStats(): Promise<ProfessionalStats> {
    const response = await api.get<{ success: boolean; data: ProfessionalStats }>(
      '/physician/stats'
    );
    if (!response.data.success) {
      throw new Error('Failed to fetch stats');
    }
    return response.data.data;
  },

  /**
   * Submit a review action on a report
   * POST /physician/reports/:id/review
   */
  async submitConsultationResponse(reportId: string, notes: string, action = 'Active'): Promise<void> {
    const response = await api.post<{ success: boolean; message: string }>(
      `/physician/reports/${reportId}/review`,
      { action, notes }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to submit review');
    }
  },

  /**
   * Placeholder: Get consultations (not yet on backend)
   */
  async getConsultations(): Promise<any[]> {
    return [];
  },

  /**
   * Placeholder: Get chat conversations (not yet on backend)
   */
  async getConversations(): Promise<any[]> {
    return [];
  },

  /**
   * Placeholder: Get specific patient details (not yet on backend)
   */
  async getPatientDetails(patientId: string): Promise<any> {
    return { id: patientId };
  },
};
