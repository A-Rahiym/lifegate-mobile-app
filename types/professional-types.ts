export type ReportStatus = 'Pending' | 'Active' | 'Completed';

export interface PatientReport {
  id: string;
  patientId: string;
  patientName: string;
  reportType: string;
  title: string;
  description: string;
  status: ReportStatus;
  timestamp: string;
  createdAt: Date;
}

export interface ProfessionalStats {
  totalReports: number;
  pendingCount: number;
  activeCount: number;
  completedCount: number;
}

export interface ProfessionalDashboard {
  stats: ProfessionalStats;
  reports: PatientReport[];
  filteredReports: PatientReport[];
  selectedFilter: ReportStatus | 'All';
  searchQuery: string;
  loading: boolean;
  error: string | null;
}
