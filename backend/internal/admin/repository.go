package admin

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

// ─── Domain types ─────────────────────────────────────────────────────────────

// CaseRow is a single case record for admin case management.
type CaseRow struct {
	ID             string  `json:"id"`
	PatientName    string  `json:"patientName"`
	PatientEmail   string  `json:"patientEmail"`
	Title          string  `json:"title"`
	Condition      string  `json:"condition"`
	Urgency        string  `json:"urgency"`
	Status         string  `json:"status"`
	Category       string  `json:"category"`
	Escalated      bool    `json:"escalated"`
	Confidence     int     `json:"confidence"`
	PhysicianName  string  `json:"physicianName,omitempty"`
	CreatedAt      string  `json:"createdAt"`
	UpdatedAt      string  `json:"updatedAt"`
}

// SLAItem is a Pending case with its time-in-queue and colour-coded SLA state.
type SLAItem struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Urgency     string `json:"urgency"`
	SecondsWait int64  `json:"secondsWait"`
	SLAColor    string `json:"slaColor"` // "green" | "yellow" | "red"
	CreatedAt   string `json:"createdAt"`
}

// DashboardStats is the live dashboard data.
type DashboardStats struct {
	TotalCases           int            `json:"totalCases"`
	CasesByStatus        map[string]int `json:"casesByStatus"`
	TotalPhysicians      int            `json:"totalPhysicians"`
	AvailablePhysicians  int            `json:"availablePhysicians"`
	ActiveUsers7d        int            `json:"activeUsers7d"`
	TotalPatients        int            `json:"totalPatients"`
	EscalatedToday       int            `json:"escalatedToday"`
	CompletedToday       int            `json:"completedToday"`
}

// EDISMetrics is the EDIS performance panel data.
type EDISMetrics struct {
	TotalDiagnoses       int                  `json:"totalDiagnoses"`
	EscalationCount      int                  `json:"escalationCount"`
	EscalationRatePct    float64              `json:"escalationRatePct"`
	AvgConfidence        float64              `json:"avgConfidence"`
	LowConfidenceCount   int                  `json:"lowConfidenceCount"`
	LowConfidencePct     float64              `json:"lowConfidencePct"`
	FlagFrequency        []FlagCount          `json:"flagFrequency"`
	AvgConditionsPerCase float64              `json:"avgConditionsPerCase"`
	PeriodDays           int                  `json:"periodDays"`
}

// FlagCount is a single EDIS risk flag with its occurrence count.
type FlagCount struct {
	Flag  string `json:"flag"`
	Count int    `json:"count"`
}

// PhysicianRow is a physician summary for admin view.
type PhysicianRow struct {
	ID                 string  `json:"id"`
	Name               string  `json:"name"`
	Email              string  `json:"email"`
	Specialization     string  `json:"specialization"`
	MdcnVerified       bool    `json:"mdcnVerified"`
	MdcnOverrideStatus string  `json:"mdcnOverrideStatus"` // "" | "confirmed" | "rejected"
	AccountStatus      string  `json:"accountStatus"`       // "active" | "suspended"
	Flagged            bool    `json:"flagged"`
	FlaggedReason      string  `json:"flaggedReason,omitempty"`
	SlaBreachCountWeek int     `json:"slaBreachCountWeek"`
	ActiveCases        int     `json:"activeCases"`
	TotalCompleted     int     `json:"totalCompleted"`
	Available          bool    `json:"available"` // true when ActiveCases == 0
}

// PhysicianCaseHistory is a brief case record in a physician profile.
type PhysicianCaseHistory struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Condition  string `json:"condition"`
	Urgency    string `json:"urgency"`
	Status     string `json:"status"`
	Escalated  bool   `json:"escalated"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
}

// PhysicianDetail is the full physician profile for the admin detail view.
type PhysicianDetail struct {
	PhysicianRow
	Phone                string                 `json:"phone"`
	DOB                  string                 `json:"dob"`
	Gender               string                 `json:"gender"`
	YearsOfExperience    string                 `json:"yearsOfExperience"`
	CertificateName      string                 `json:"certificateName"`
	CertificateID        string                 `json:"certificateId"`
	CertificateIssueDate string                 `json:"certificateIssueDate"`
	CertificateURL       string                 `json:"certificateUrl"`
	FlaggedAt            string                 `json:"flaggedAt,omitempty"`
	MdcnOverrideBy       string                 `json:"mdcnOverrideBy,omitempty"` // admin name
	MdcnOverrideAt       string                 `json:"mdcnOverrideAt,omitempty"`
	CreatedAt            string                 `json:"createdAt"`
	RecentCases          []PhysicianCaseHistory `json:"recentCases"`
}

// CreatePhysicianInput carries the fields for creating a new physician account.
type CreatePhysicianInput struct {
	Name              string `json:"name"`
	Email             string `json:"email"`
	Password          string `json:"password"`
	Specialization    string `json:"specialization"`
	Phone             string `json:"phone"`
	YearsOfExperience string `json:"yearsOfExperience"`
	CertificateName   string `json:"certificateName"`
	CertificateID     string `json:"certificateId"`
}

// UpdatePhysicianInput carries the fields that an admin can update.
type UpdatePhysicianInput struct {
	Name              string `json:"name"`
	Email             string `json:"email"`
	Specialization    string `json:"specialization"`
	Phone             string `json:"phone"`
	YearsOfExperience string `json:"yearsOfExperience"`
}

// CaseFilters controls admin case list filtering and pagination.
type CaseFilters struct {
	Status   string // "Pending" | "Active" | "Completed" | "" (all)
	Urgency  string // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | ""
	Category string // "general_health" | "doctor_consultation" | "" (all)
	Search   string // free-text search on title / condition / patient name
	Page     int
	PageSize int
}

// SLABreachAlert is a record from sla_reassignment_log for the admin alert panel.
type SLABreachAlert struct {
	ID                    string `json:"id"`
	CaseID                string `json:"caseId"`
	CaseTitle             string `json:"caseTitle"`
	Urgency               string `json:"urgency"`
	WaitSeconds           int64  `json:"waitSeconds"`
	WaitFormatted         string `json:"waitFormatted"`
	OriginalPhysicianName string `json:"originalPhysicianName,omitempty"`
	NewPhysicianName      string `json:"newPhysicianName,omitempty"`
	NatsPublished         bool   `json:"natsPublished"`
	CreatedAt             string `json:"createdAt"`
}

// ─── Repository ───────────────────────────────────────────────────────────────

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// GetAllCases returns a filtered, paginated list of all diagnoses for admin management.
func (r *Repository) GetAllCases(f CaseFilters) ([]CaseRow, int, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PageSize < 1 || f.PageSize > 100 {
		f.PageSize = 20
	}
	offset := (f.Page - 1) * f.PageSize

	// Build dynamic WHERE clause.
	where := "WHERE 1=1"
	args := []interface{}{}
	argN := 1

	if f.Status != "" {
		where += fmt.Sprintf(" AND d.status = $%d", argN)
		args = append(args, f.Status)
		argN++
	}
	if f.Urgency != "" {
		where += fmt.Sprintf(" AND d.urgency = $%d", argN)
		args = append(args, f.Urgency)
		argN++
	}
	if f.Category != "" {
		where += fmt.Sprintf(" AND s.category = $%d", argN)
		args = append(args, f.Category)
		argN++
	}
	if f.Search != "" {
		pattern := "%" + f.Search + "%"
		where += fmt.Sprintf(" AND (d.title ILIKE $%d OR d.condition ILIKE $%d OR u.name ILIKE $%d)", argN, argN+1, argN+2)
		args = append(args, pattern, pattern, pattern)
		argN += 3
	}

	// Count query.
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM diagnoses d
		JOIN users u ON u.id = d.user_id
		LEFT JOIN chat_sessions s ON s.user_id = d.user_id AND s.status = 'completed'
		%s`, where)

	var total int
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Data query.
	limitArgs := append(args, f.PageSize, offset)
	dataQuery := fmt.Sprintf(`
		SELECT d.id, u.name, u.email,
		       COALESCE(d.title,''), COALESCE(d.condition,''), COALESCE(d.urgency,''),
		       d.status, COALESCE(s.category,''), d.escalated,
		       COALESCE((d.ai_response->'diagnosis'->>'confidence')::int, 0),
		       COALESCE(p.name,''),
		       d.created_at::text, d.updated_at::text
		FROM diagnoses d
		JOIN users u ON u.id = d.user_id
		LEFT JOIN users p ON p.id = d.physician_id
		LEFT JOIN LATERAL (
		    SELECT category FROM chat_sessions
		    WHERE user_id = d.user_id AND status = 'completed'
		    ORDER BY updated_at DESC LIMIT 1
		) s ON true
		%s
		ORDER BY d.created_at DESC
		LIMIT $%d OFFSET $%d`, where, argN, argN+1)

	rows, err := r.db.Query(dataQuery, limitArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var cases []CaseRow
	for rows.Next() {
		var c CaseRow
		if err := rows.Scan(
			&c.ID, &c.PatientName, &c.PatientEmail,
			&c.Title, &c.Condition, &c.Urgency,
			&c.Status, &c.Category, &c.Escalated,
			&c.Confidence, &c.PhysicianName,
			&c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		cases = append(cases, c)
	}
	return cases, total, rows.Err()
}

// GetDashboardStats returns live counts for the admin dashboard.
func (r *Repository) GetDashboardStats() (*DashboardStats, error) {
	stats := &DashboardStats{CasesByStatus: map[string]int{}}

	// Case counts by status.
	rows, err := r.db.Query(`
		SELECT status, COUNT(*) FROM diagnoses GROUP BY status`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var status string
		var cnt int
		if err := rows.Scan(&status, &cnt); err != nil {
			return nil, err
		}
		stats.CasesByStatus[status] = cnt
		stats.TotalCases += cnt
	}

	// Physician counts.
	if err := r.db.QueryRow(`
		SELECT COUNT(*) FROM users WHERE role = 'professional'`,
	).Scan(&stats.TotalPhysicians); err != nil {
		return nil, err
	}

	// Available physicians = those with no Active cases right now.
	if err := r.db.QueryRow(`
		SELECT COUNT(*) FROM users u
		WHERE u.role = 'professional'
		  AND NOT EXISTS (
		      SELECT 1 FROM diagnoses d
		      WHERE d.physician_id = u.id AND d.status = 'Active'
		  )`,
	).Scan(&stats.AvailablePhysicians); err != nil {
		return nil, err
	}

	// Active users in last 7 days (users with at least one diagnosis).
	if err := r.db.QueryRow(`
		SELECT COUNT(DISTINCT user_id) FROM diagnoses
		WHERE created_at >= NOW() - INTERVAL '7 days'`,
	).Scan(&stats.ActiveUsers7d); err != nil {
		return nil, err
	}

	// Total patients.
	if err := r.db.QueryRow(`
		SELECT COUNT(*) FROM users WHERE role = 'user'`,
	).Scan(&stats.TotalPatients); err != nil {
		return nil, err
	}

	// Escalated today.
	if err := r.db.QueryRow(`
		SELECT COUNT(*) FROM diagnoses
		WHERE escalated = true AND created_at >= CURRENT_DATE`,
	).Scan(&stats.EscalatedToday); err != nil {
		return nil, err
	}

	// Completed today.
	if err := r.db.QueryRow(`
		SELECT COUNT(*) FROM diagnoses
		WHERE status = 'Completed' AND updated_at >= CURRENT_DATE`,
	).Scan(&stats.CompletedToday); err != nil {
		return nil, err
	}

	return stats, nil
}

// GetSLAReport returns all Pending cases with time-in-queue.
func (r *Repository) GetSLAReport() ([]SLAItem, error) {
	rows, err := r.db.Query(`
		SELECT id, COALESCE(title,''), COALESCE(urgency,'LOW'),
		       EXTRACT(EPOCH FROM (NOW() - created_at))::bigint,
		       created_at::text
		FROM diagnoses
		WHERE status = 'Pending' AND physician_id IS NULL
		ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []SLAItem
	for rows.Next() {
		var item SLAItem
		if err := rows.Scan(&item.ID, &item.Title, &item.Urgency, &item.SecondsWait, &item.CreatedAt); err != nil {
			return nil, err
		}
		item.SLAColor = slaColor(item.SecondsWait, item.Urgency)
		items = append(items, item)
	}
	return items, rows.Err()
}

// GetEDISMetrics returns aggregated EDIS performance metrics for the given period.
func (r *Repository) GetEDISMetrics(days int) (*EDISMetrics, error) {
	if days <= 0 {
		days = 30
	}
	interval := fmt.Sprintf("%d days", days)
	metrics := &EDISMetrics{PeriodDays: days}

	// Total + escalation counts.
	if err := r.db.QueryRow(fmt.Sprintf(`
		SELECT
		    COUNT(*),
		    COUNT(*) FILTER (WHERE escalated = true)
		FROM diagnoses
		WHERE created_at >= NOW() - INTERVAL '%s'`, interval),
	).Scan(&metrics.TotalDiagnoses, &metrics.EscalationCount); err != nil {
		return nil, err
	}

	if metrics.TotalDiagnoses > 0 {
		metrics.EscalationRatePct = float64(metrics.EscalationCount) / float64(metrics.TotalDiagnoses) * 100
	}

	// Avg confidence + low-confidence count (confidence < 60).
	if err := r.db.QueryRow(fmt.Sprintf(`
		SELECT
		    COALESCE(AVG(NULLIF((ai_response->'diagnosis'->>'confidence'),'')::int), 0),
		    COUNT(*) FILTER (
		        WHERE (ai_response->'diagnosis'->>'confidence') IS NOT NULL
		          AND (ai_response->'diagnosis'->>'confidence')::int > 0
		          AND (ai_response->'diagnosis'->>'confidence')::int < 60
		    )
		FROM diagnoses
		WHERE created_at >= NOW() - INTERVAL '%s'
		  AND ai_response IS NOT NULL`, interval),
	).Scan(&metrics.AvgConfidence, &metrics.LowConfidenceCount); err != nil {
		return nil, err
	}

	if metrics.TotalDiagnoses > 0 {
		metrics.LowConfidencePct = float64(metrics.LowConfidenceCount) / float64(metrics.TotalDiagnoses) * 100
	}

	// Avg conditions per case.
	if err := r.db.QueryRow(fmt.Sprintf(`
		SELECT COALESCE(AVG(jsonb_array_length(ai_response->'conditions')), 0)
		FROM diagnoses
		WHERE created_at >= NOW() - INTERVAL '%s'
		  AND ai_response IS NOT NULL
		  AND jsonb_typeof(ai_response->'conditions') = 'array'`, interval),
	).Scan(&metrics.AvgConditionsPerCase); err != nil {
		return nil, err
	}

	// Risk flag frequency — unnest the riskFlags array.
	flagRows, err := r.db.Query(fmt.Sprintf(`
		SELECT flag, COUNT(*) AS cnt
		FROM (
		    SELECT jsonb_array_elements(ai_response->'riskFlags')->>'flag' AS flag
		    FROM diagnoses
		    WHERE created_at >= NOW() - INTERVAL '%s'
		      AND ai_response IS NOT NULL
		      AND jsonb_typeof(ai_response->'riskFlags') = 'array'
		) sub
		WHERE flag IS NOT NULL AND flag != ''
		GROUP BY flag
		ORDER BY cnt DESC
		LIMIT 12`, interval))
	if err != nil {
		return nil, err
	}
	defer flagRows.Close()
	for flagRows.Next() {
		var fc FlagCount
		if err := flagRows.Scan(&fc.Flag, &fc.Count); err != nil {
			return nil, err
		}
		metrics.FlagFrequency = append(metrics.FlagFrequency, fc)
	}
	if metrics.FlagFrequency == nil {
		metrics.FlagFrequency = []FlagCount{}
	}

	return metrics, flagRows.Err()
}

// GetPhysicians returns all physicians with their case load and account management statistics.
func (r *Repository) GetPhysicians() ([]PhysicianRow, error) {
	rows, err := r.db.Query(`
		SELECT u.id, u.name, u.email, COALESCE(u.specialization,''),
		       u.mdcn_verified,
		       COALESCE(u.mdcn_override_status,''),
		       COALESCE(u.account_status,'active'),
		       u.flagged,
		       COALESCE(u.flagged_reason,''),
		       COUNT(d.id) FILTER (WHERE d.status = 'Active')   AS active_cases,
		       COUNT(d.id) FILTER (WHERE d.status = 'Completed') AS completed_cases,
		       (
		           SELECT COUNT(*) FROM physician_sla_breaches b
		           WHERE b.physician_id = u.id
		             AND b.breached_at >= NOW() - INTERVAL '7 days'
		       ) AS sla_breach_week
		FROM users u
		LEFT JOIN diagnoses d ON d.physician_id = u.id
		WHERE u.role = 'professional'
		GROUP BY u.id, u.name, u.email, u.specialization, u.mdcn_verified,
		         u.mdcn_override_status, u.account_status, u.flagged, u.flagged_reason
		ORDER BY u.flagged DESC, active_cases DESC, u.name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var physicians []PhysicianRow
	for rows.Next() {
		var p PhysicianRow
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Email, &p.Specialization,
			&p.MdcnVerified, &p.MdcnOverrideStatus, &p.AccountStatus,
			&p.Flagged, &p.FlaggedReason,
			&p.ActiveCases, &p.TotalCompleted, &p.SlaBreachCountWeek,
		); err != nil {
			return nil, err
		}
		p.Available = p.ActiveCases == 0
		physicians = append(physicians, p)
	}
	return physicians, rows.Err()
}

// GetPhysicianDetail returns the full admin profile for a single physician.
func (r *Repository) GetPhysicianDetail(physicianID string) (*PhysicianDetail, error) {
	var d PhysicianDetail
	var flaggedAt, mdcnOverrideAt sql.NullString
	var mdcnOverrideByName sql.NullString

	err := r.db.QueryRow(`
		SELECT u.id, u.name, u.email, COALESCE(u.specialization,''),
		       u.mdcn_verified, COALESCE(u.mdcn_override_status,''),
		       COALESCE(u.account_status,'active'), u.flagged,
		       COALESCE(u.flagged_reason,''), u.flagged_at::text,
		       COALESCE(u.phone,''), COALESCE(u.dob,''), COALESCE(u.gender,''),
		       COALESCE(u.years_of_experience,''), COALESCE(u.certificate_name,''),
		       COALESCE(u.certificate_id,''), COALESCE(u.certificate_issue_date,''),
		       COALESCE(u.certificate_url,''),
		       COALESCE(adm.name,''), u.mdcn_override_at::text,
		       u.created_at::text,
		       (
		           SELECT COUNT(*) FROM physician_sla_breaches b
		           WHERE b.physician_id = u.id
		             AND b.breached_at >= NOW() - INTERVAL '7 days'
		       ) AS sla_week,
		       (
		           SELECT COUNT(*) FROM diagnoses d WHERE d.physician_id = u.id AND d.status = 'Active'
		       ) AS active_cases,
		       (
		           SELECT COUNT(*) FROM diagnoses d WHERE d.physician_id = u.id AND d.status = 'Completed'
		       ) AS completed_cases
		FROM users u
		LEFT JOIN users adm ON adm.id = u.mdcn_override_by
		WHERE u.id = $1::uuid AND u.role = 'professional'`,
		physicianID,
	).Scan(
		&d.ID, &d.Name, &d.Email, &d.Specialization,
		&d.MdcnVerified, &d.MdcnOverrideStatus,
		&d.AccountStatus, &d.Flagged, &d.FlaggedReason, &flaggedAt,
		&d.Phone, &d.DOB, &d.Gender, &d.YearsOfExperience,
		&d.CertificateName, &d.CertificateID, &d.CertificateIssueDate, &d.CertificateURL,
		&mdcnOverrideByName, &mdcnOverrideAt,
		&d.CreatedAt,
		&d.SlaBreachCountWeek, &d.ActiveCases, &d.TotalCompleted,
	)
	if err != nil {
		return nil, err
	}
	d.Available = d.ActiveCases == 0
	if flaggedAt.Valid {
		d.FlaggedAt = flaggedAt.String
	}
	if mdcnOverrideByName.Valid {
		d.MdcnOverrideBy = mdcnOverrideByName.String
	}
	if mdcnOverrideAt.Valid {
		d.MdcnOverrideAt = mdcnOverrideAt.String
	}

	// Recent case history (last 20).
	caseRows, err := r.db.Query(`
		SELECT id, COALESCE(title,''), COALESCE(condition,''), COALESCE(urgency,'LOW'),
		       status, escalated, created_at::text, updated_at::text
		FROM diagnoses
		WHERE physician_id = $1::uuid
		ORDER BY updated_at DESC
		LIMIT 20`, physicianID)
	if err != nil {
		return nil, err
	}
	defer caseRows.Close()
	for caseRows.Next() {
		var ch PhysicianCaseHistory
		if err := caseRows.Scan(&ch.ID, &ch.Title, &ch.Condition, &ch.Urgency,
			&ch.Status, &ch.Escalated, &ch.CreatedAt, &ch.UpdatedAt); err != nil {
			continue
		}
		d.RecentCases = append(d.RecentCases, ch)
	}
	if d.RecentCases == nil {
		d.RecentCases = []PhysicianCaseHistory{}
	}
	return &d, caseRows.Err()
}

// CreatePhysician inserts a new physician account.  The caller must pass a
// bcrypt-hashed password; raw passwords must never reach this layer.
func (r *Repository) CreatePhysician(inp CreatePhysicianInput, passwordHash string) (string, error) {
	var id string
	err := r.db.QueryRow(`
		INSERT INTO users
		    (name, email, password_hash, role, specialization, phone,
		     years_of_experience, certificate_name, certificate_id, account_status)
		VALUES ($1, $2, $3, 'professional', $4, $5, $6, $7, $8, 'active')
		RETURNING id::text`,
		inp.Name, inp.Email, passwordHash, inp.Specialization, inp.Phone,
		inp.YearsOfExperience, inp.CertificateName, inp.CertificateID,
	).Scan(&id)
	return id, err
}

// UpdatePhysician patches mutable fields on a physician account.
func (r *Repository) UpdatePhysician(physicianID string, inp UpdatePhysicianInput) error {
	_, err := r.db.Exec(`
		UPDATE users
		SET name               = COALESCE(NULLIF($2,''), name),
		    email              = COALESCE(NULLIF($3,''), email),
		    specialization     = COALESCE(NULLIF($4,''), specialization),
		    phone              = COALESCE(NULLIF($5,''), phone),
		    years_of_experience = COALESCE(NULLIF($6,''), years_of_experience),
		    updated_at         = NOW()
		WHERE id = $1::uuid AND role = 'professional'`,
		physicianID, inp.Name, inp.Email, inp.Specialization,
		inp.Phone, inp.YearsOfExperience,
	)
	return err
}

// DeletePhysician removes a physician account. Cases remain with physician_id
// set (soft reference) so history is preserved.
func (r *Repository) DeletePhysician(physicianID string) error {
	res, err := r.db.Exec(
		`DELETE FROM users WHERE id = $1::uuid AND role = 'professional'`, physicianID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("physician not found")
	}
	return nil
}

// SuspendPhysician sets account_status = 'suspended' and logs the admin action.
func (r *Repository) SuspendPhysician(physicianID, adminID, reason string) error {
	res, err := r.db.Exec(`
		UPDATE users
		SET account_status = 'suspended', updated_at = NOW()
		WHERE id = $1::uuid AND role = 'professional'`,
		physicianID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("physician not found")
	}
	r.LogAction(adminID, "physician.suspend", "user", &physicianID,
		map[string]interface{}{"reason": reason})
	return nil
}

// UnsuspendPhysician restores account_status = 'active'.
func (r *Repository) UnsuspendPhysician(physicianID, adminID string) error {
	res, err := r.db.Exec(`
		UPDATE users
		SET account_status = 'active', updated_at = NOW()
		WHERE id = $1::uuid AND role = 'professional'`,
		physicianID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("physician not found")
	}
	r.LogAction(adminID, "physician.unsuspend", "user", &physicianID, map[string]interface{}{})
	return nil
}

// OverrideMDCN allows an admin to manually confirm or reject MDCN verification.
// status must be "confirmed" or "rejected".
func (r *Repository) OverrideMDCN(physicianID, adminID, status string) error {
	if status != "confirmed" && status != "rejected" {
		return fmt.Errorf("invalid mdcn override status: must be confirmed or rejected")
	}
	mdcnVerified := status == "confirmed"
	res, err := r.db.Exec(`
		UPDATE users
		SET mdcn_verified         = $2,
		    mdcn_override_status  = $3,
		    mdcn_override_by      = $4::uuid,
		    mdcn_override_at      = NOW(),
		    mdcn_verified_at      = CASE WHEN $2 THEN NOW() ELSE NULL END,
		    updated_at            = NOW()
		WHERE id = $1::uuid AND role = 'professional'`,
		physicianID, mdcnVerified, status, adminID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("physician not found")
	}
	r.LogAction(adminID, "physician.mdcn_override", "user", &physicianID,
		map[string]interface{}{"status": status})
	return nil
}

// CheckAndFlagPhysicians queries all physicians whose SLA breach count in the
// past 7 days is ≥ 3 and marks them flagged.  Returns the number newly flagged.
func (r *Repository) CheckAndFlagPhysicians() (int, error) {
	res, err := r.db.Exec(`
		UPDATE users u
		SET flagged        = TRUE,
		    flagged_at     = NOW(),
		    flagged_reason = '3 or more SLA breaches in the past 7 days',
		    updated_at     = NOW()
		FROM (
		    SELECT physician_id, COUNT(*) AS breach_count
		    FROM physician_sla_breaches
		    WHERE breached_at >= NOW() - INTERVAL '7 days'
		    GROUP BY physician_id
		    HAVING COUNT(*) >= 3
		) sub
		WHERE u.id = sub.physician_id
		  AND u.role = 'professional'
		  AND u.flagged = FALSE`)
	if err != nil {
		return 0, err
	}
	n, _ := res.RowsAffected()
	return int(n), nil
}

// RecordSLABreach inserts a physician SLA breach record.
// hoursOver is how many hours past the SLA deadline the case was completed.
func (r *Repository) RecordSLABreach(physicianID, caseID string, hoursOver float64) error {
	_, err := r.db.Exec(`
		INSERT INTO physician_sla_breaches (physician_id, case_id, hours_over_sla)
		VALUES ($1::uuid, $2::uuid, $3)
		ON CONFLICT (physician_id, case_id) DO NOTHING`,
		physicianID, caseID, hoursOver)
	return err
}

// LogAction writes an admin action to the admin_actions audit table.
func (r *Repository) LogAction(adminID, action, resource string, resourceID *string, details map[string]interface{}) {
	detailsJSON, _ := json.Marshal(details)
	var rid interface{}
	if resourceID != nil {
		rid = *resourceID
	}
	_, _ = r.db.Exec(`
		INSERT INTO admin_actions (admin_id, action, resource, resource_id, details)
		VALUES ($1::uuid, $2, $3, $4::uuid, $5)`,
		adminID, action, resource, rid, detailsJSON)
}

// GetSLABreachAlerts returns the most recent SLA breach events for the admin
// alert panel (all breaches, including those without a successful reassignment).
func (r *Repository) GetSLABreachAlerts(limit int) ([]SLABreachAlert, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	rows, err := r.db.Query(`
		SELECT id::text, case_id::text, case_title, urgency, wait_seconds,
		       original_physician_name, new_physician_name, nats_published, created_at::text
		FROM sla_reassignment_log
		ORDER BY created_at DESC
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []SLABreachAlert
	for rows.Next() {
		var a SLABreachAlert
		if err := rows.Scan(&a.ID, &a.CaseID, &a.CaseTitle, &a.Urgency, &a.WaitSeconds,
			&a.OriginalPhysicianName, &a.NewPhysicianName, &a.NatsPublished, &a.CreatedAt); err != nil {
			return nil, err
		}
		a.WaitFormatted = FormatWait(a.WaitSeconds)
		alerts = append(alerts, a)
	}
	if alerts == nil {
		alerts = []SLABreachAlert{}
	}
	return alerts, rows.Err()
}

// GetReassignmentLog returns a paginated list of SLA breaches where a
// successful reassignment to a new physician occurred.
func (r *Repository) GetReassignmentLog(page, pageSize int) ([]SLABreachAlert, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	var total int
	if err := r.db.QueryRow(`
		SELECT COUNT(*) FROM sla_reassignment_log WHERE new_physician_id IS NOT NULL`,
	).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(`
		SELECT id::text, case_id::text, case_title, urgency, wait_seconds,
		       original_physician_name, new_physician_name, nats_published, created_at::text
		FROM sla_reassignment_log
		WHERE new_physician_id IS NOT NULL
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2`, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var entries []SLABreachAlert
	for rows.Next() {
		var a SLABreachAlert
		if err := rows.Scan(&a.ID, &a.CaseID, &a.CaseTitle, &a.Urgency, &a.WaitSeconds,
			&a.OriginalPhysicianName, &a.NewPhysicianName, &a.NatsPublished, &a.CreatedAt); err != nil {
			return nil, 0, err
		}
		a.WaitFormatted = FormatWait(a.WaitSeconds)
		entries = append(entries, a)
	}
	if entries == nil {
		entries = []SLABreachAlert{}
	}
	return entries, total, rows.Err()
}

// ─── SLA helpers ──────────────────────────────────────────────────────────────

const (
	slaGreenSecs  = 4 * 3600  // < 4 h → green
	slaYellowSecs = 24 * 3600 // 4–24 h → yellow ; > 24 h → red
)

// slaColor returns the colour tier for time-in-queue.
// HIGH/CRITICAL cases have tighter thresholds (half the normal values).
func slaColor(secondsWait int64, urgency string) string {
	green, yellow := int64(slaGreenSecs), int64(slaYellowSecs)
	if urgency == "HIGH" || urgency == "CRITICAL" {
		green /= 2
		yellow /= 2
	}
	switch {
	case secondsWait < green:
		return "green"
	case secondsWait < yellow:
		return "yellow"
	default:
		return "red"
	}
}

// formatDuration converts seconds to a human-readable string.
func formatDuration(seconds int64) string {
	d := time.Duration(seconds) * time.Second
	h := int(d.Hours())
	m := int(d.Minutes()) % 60
	if h > 0 {
		return fmt.Sprintf("%dh %dm", h, m)
	}
	return fmt.Sprintf("%dm", m)
}

// FormatWait returns a human-readable wait time (exported for handler use).
func FormatWait(seconds int64) string { return formatDuration(seconds) }
