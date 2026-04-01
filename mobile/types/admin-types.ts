// Admin system types — mirrors backend internal/admin package

export type DashboardStats = {
  totalCases: number;
  casesByStatus: Record<string, number>;
  totalPhysicians: number;
  availablePhysicians: number;
  activeUsers7d: number;
  totalPatients: number;
  escalatedToday: number;
  completedToday: number;
};

export type AdminCaseRow = {
  id: string;
  patientName: string;
  patientEmail: string;
  title: string;
  condition: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'Pending' | 'Active' | 'Completed';
  category: string;
  escalated: boolean;
  confidence: number;
  physicianName: string;
  createdAt: string;
  updatedAt: string;
};

export type SLAItem = {
  id: string;
  title: string;
  urgency: string;
  secondsWait: number;
  slaColor: 'green' | 'yellow' | 'red';
  waitFormatted: string;
  createdAt: string;
};

export type FlagCount = {
  flag: string;
  count: number;
};

export type EDISMetrics = {
  totalDiagnoses: number;
  escalationCount: number;
  escalationRatePct: number;
  avgConfidence: number;
  lowConfidenceCount: number;
  lowConfidencePct: number;
  flagFrequency: FlagCount[];
  avgConditionsPerCase: number;
  periodDays: number;
};

export type PhysicianRow = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  mdcnVerified: boolean;
  activeCases: number;
  totalCompleted: number;
  available: boolean;
};

export type AdminCaseFilters = {
  status?: string;
  urgency?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedCases = {
  data: AdminCaseRow[];
  meta: { total: number; page: number; pageSize: number };
};
