import { PatientReport, ProfessionalStats } from '../types/professional-types';

// Mock data generator
const generateMockReports = (): PatientReport[] => [
  {
    id: '1',
    patientId: 'LG-202671',
    patientName: 'John Doe',
    reportType: 'Report',
    title: 'Constant headache making waves on both sides of the head for about 3hours.',
    description: 'Patient reports recurring headaches',
    status: 'Pending',
    timestamp: '2hrs ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    patientId: 'LG-202671',
    patientName: 'Sarah Johnson',
    reportType: 'Report',
    title: 'Constant headache making waves on both sides of the head for about 3hours.',
    description: 'Patient reports recurring headaches',
    status: 'Pending',
    timestamp: '2hrs ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '3',
    patientId: 'LG-202671',
    patientName: 'Mike Smith',
    reportType: 'Report',
    title: 'Constant headache making waves on both sides of the head for about 3hours.',
    description: 'Patient reports recurring headaches',
    status: 'Active',
    timestamp: '2hrs ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '4',
    patientId: 'LG-202671',
    patientName: 'Emma Davis',
    reportType: 'Report',
    title: 'Constant headache making waves on both sides of the head for about 3hours.',
    description: 'Patient reports recurring headaches',
    status: 'Active',
    timestamp: '2hrs ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '5',
    patientId: 'LG-202671',
    patientName: 'Oliver Wilson',
    reportType: 'Report',
    title: 'Constant headache making waves on both sides of the head for about 3hours.',
    description: 'Patient reports recurring headaches',
    status: 'Completed',
    timestamp: '2hrs ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '6',
    patientId: 'LG-202671',
    patientName: 'Sophia Brown',
    reportType: 'Report',
    title: 'Constant headache making waves on both sides of the head for about 3hours.',
    description: 'Patient reports recurring headaches',
    status: 'Completed',
    timestamp: '2hrs ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '7',
    patientId: 'LG-202671',
    patientName: 'Liam Martinez',
    reportType: 'Report',
    title: 'Constant headache making waves on both sides of the head for about 3hours.',
    description: 'Patient reports recurring headaches',
    status: 'Pending',
    timestamp: '2hrs ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '8',
    patientId: 'LG-202671',
    patientName: 'Ava Garcia',
    reportType: 'Report',
    title: 'Constant headache making waves on both sides of the head for about 3hours.',
    description: 'Patient reports recurring headaches',
    status: 'Active',
    timestamp: '2hrs ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

const calculateStats = (reports: PatientReport[]) => {
  return {
    totalReports: reports.length,
    pendingCount: reports.filter(r => r.status === 'Pending').length,
    activeCount: reports.filter(r => r.status === 'Active').length,
    completedCount: reports.filter(r => r.status === 'Completed').length,
  };
};

export const ProfessionalService = {
  /**
   * Fetch all patient reports for the physician
   * Mock implementation - returns hardcoded sample data
   */
  async getProfessionalReports(): Promise<PatientReport[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockReports();
  },

  /**
   * Get professional dashboard stats
   */
  async getProfessionalStats(): Promise<ProfessionalStats> {
    const reports = await this.getProfessionalReports();
    return calculateStats(reports);
  },

  /**
   * Placeholder: Get consultations
   */
  async getConsultations(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  },

  /**
   * Placeholder: Get chat conversations
   */
  async getConversations(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  },

  /**
   * Placeholder: Get specific patient details
   */
  async getPatientDetails(patientId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { id: patientId, name: 'Patient Name', email: 'patient@example.com' };
  },

  /**
   * Placeholder: Submit consultation response
   */
  async submitConsultationResponse(reportId: string, response: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { success: true, reportId };
  },
};
