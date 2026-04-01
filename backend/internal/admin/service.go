package admin

import "golang.org/x/crypto/bcrypt"

// Service wraps the admin Repository with thin business logic.
// Currently business logic is minimal — the repository does the heavy lifting.
type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetAllCases(f CaseFilters) ([]CaseRow, int, error) {
	return s.repo.GetAllCases(f)
}

func (s *Service) GetDashboardStats() (*DashboardStats, error) {
	return s.repo.GetDashboardStats()
}

func (s *Service) GetSLAReport() ([]SLAItem, error) {
	return s.repo.GetSLAReport()
}

func (s *Service) GetEDISMetrics(days int) (*EDISMetrics, error) {
	return s.repo.GetEDISMetrics(days)
}

func (s *Service) GetPhysicians() ([]PhysicianRow, error) {
	return s.repo.GetPhysicians()
}

func (s *Service) GetPhysicianDetail(id string) (*PhysicianDetail, error) {
	return s.repo.GetPhysicianDetail(id)
}

func (s *Service) CreatePhysician(inp CreatePhysicianInput) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(inp.Password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return s.repo.CreatePhysician(inp, string(hash))
}

func (s *Service) UpdatePhysician(id string, inp UpdatePhysicianInput) error {
	return s.repo.UpdatePhysician(id, inp)
}

func (s *Service) DeletePhysician(id string) error {
	return s.repo.DeletePhysician(id)
}

func (s *Service) SuspendPhysician(physicianID, adminID, reason string) error {
	return s.repo.SuspendPhysician(physicianID, adminID, reason)
}

func (s *Service) UnsuspendPhysician(physicianID, adminID string) error {
	return s.repo.UnsuspendPhysician(physicianID, adminID)
}

func (s *Service) OverrideMDCN(physicianID, adminID, status string) error {
	return s.repo.OverrideMDCN(physicianID, adminID, status)
}

func (s *Service) CheckAndFlagPhysicians() (int, error) {
	return s.repo.CheckAndFlagPhysicians()
}

func (s *Service) RecordSLABreach(physicianID, caseID string, hoursOver float64) {
	_ = s.repo.RecordSLABreach(physicianID, caseID, hoursOver)
	// After recording, re-run the flag check so newly eligible physicians are flagged immediately.
	_, _ = s.repo.CheckAndFlagPhysicians()
}

func (s *Service) LogAction(adminID, action, resource string, resourceID *string, details map[string]interface{}) {
	s.repo.LogAction(adminID, action, resource, resourceID, details)
}
