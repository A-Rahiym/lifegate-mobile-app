package admin

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

func (s *Service) LogAction(adminID, action, resource string, resourceID *string, details map[string]interface{}) {
	s.repo.LogAction(adminID, action, resource, resourceID, details)
}
