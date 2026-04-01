package admin

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────

func (h *Handler) GetDashboard(c *gin.Context) {
	stats, err := h.svc.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load dashboard"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": stats})
}

// ─── GET /api/admin/cases ─────────────────────────────────────────────────────

func (h *Handler) GetCases(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))

	f := CaseFilters{
		Status:   c.Query("status"),
		Urgency:  c.Query("urgency"),
		Category: c.Query("category"),
		Search:   c.Query("search"),
		Page:     page,
		PageSize: pageSize,
	}

	cases, total, err := h.svc.GetAllCases(f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load cases"})
		return
	}
	if cases == nil {
		cases = []CaseRow{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    cases,
		"meta": gin.H{
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

// ─── GET /api/admin/sla ───────────────────────────────────────────────────────

func (h *Handler) GetSLA(c *gin.Context) {
	items, err := h.svc.GetSLAReport()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load SLA report"})
		return
	}
	if items == nil {
		items = []SLAItem{}
	}

	type enriched struct {
		SLAItem
		WaitFormatted string `json:"waitFormatted"`
	}
	out := make([]enriched, len(items))
	for i, item := range items {
		out[i] = enriched{SLAItem: item, WaitFormatted: FormatWait(item.SecondsWait)}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": out})
}

// ─── GET /api/admin/metrics/edis ─────────────────────────────────────────────

func (h *Handler) GetEDISMetrics(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	metrics, err := h.svc.GetEDISMetrics(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load EDIS metrics"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": metrics})
}

// ─── GET /api/admin/physicians ───────────────────────────────────────────────

// GetPhysicians returns all physicians with status, flag, SLA breach count.
func (h *Handler) GetPhysicians(c *gin.Context) {
	physicians, err := h.svc.GetPhysicians()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load physicians"})
		return
	}
	if physicians == nil {
		physicians = []PhysicianRow{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": physicians})
}

// ─── GET /api/admin/physicians/:id ───────────────────────────────────────────

// GetPhysicianDetail returns the full physician profile for admin view,
// including verification status, case history, and breach count.
func (h *Handler) GetPhysicianDetail(c *gin.Context) {
	id := c.Param("id")
	detail, err := h.svc.GetPhysicianDetail(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Physician not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": detail})
}

// ─── POST /api/admin/physicians ──────────────────────────────────────────────

// CreatePhysician creates a new physician account.
func (h *Handler) CreatePhysician(c *gin.Context) {
	var inp CreatePhysicianInput
	if err := c.ShouldBindJSON(&inp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if inp.Name == "" || inp.Email == "" || inp.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "name, email and password are required"})
		return
	}

	id, err := h.svc.CreatePhysician(inp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create physician"})
		return
	}

	adminID, _ := c.Get("userID")
	adminIDStr, _ := adminID.(string)
	h.svc.LogAction(adminIDStr, "physician.create", "user", &id,
		map[string]interface{}{"email": inp.Email, "name": inp.Name})

	c.JSON(http.StatusCreated, gin.H{"success": true, "message": "Physician account created", "data": gin.H{"id": id}})
}

// ─── PATCH /api/admin/physicians/:id ─────────────────────────────────────────

// UpdatePhysician updates mutable physician fields.
func (h *Handler) UpdatePhysician(c *gin.Context) {
	id := c.Param("id")
	var inp UpdatePhysicianInput
	if err := c.ShouldBindJSON(&inp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.svc.UpdatePhysician(id, inp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update physician"})
		return
	}

	adminID, _ := c.Get("userID")
	adminIDStr, _ := adminID.(string)
	h.svc.LogAction(adminIDStr, "physician.update", "user", &id, map[string]interface{}{})

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Physician updated"})
}

// ─── DELETE /api/admin/physicians/:id ────────────────────────────────────────

// DeletePhysician removes a physician account.
func (h *Handler) DeletePhysician(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeletePhysician(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
		return
	}

	adminID, _ := c.Get("userID")
	adminIDStr, _ := adminID.(string)
	h.svc.LogAction(adminIDStr, "physician.delete", "user", &id, map[string]interface{}{})

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Physician account deleted"})
}

// ─── POST /api/admin/physicians/:id/suspend ──────────────────────────────────

// SuspendPhysician suspends a physician account.
func (h *Handler) SuspendPhysician(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&body)

	adminID, _ := c.Get("userID")
	adminIDStr, _ := adminID.(string)

	if err := h.svc.SuspendPhysician(id, adminIDStr, body.Reason); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Physician account suspended"})
}

// ─── POST /api/admin/physicians/:id/unsuspend ────────────────────────────────

// UnsuspendPhysician restores a suspended physician account.
func (h *Handler) UnsuspendPhysician(c *gin.Context) {
	id := c.Param("id")
	adminID, _ := c.Get("userID")
	adminIDStr, _ := adminID.(string)

	if err := h.svc.UnsuspendPhysician(id, adminIDStr); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Physician account reinstated"})
}

// ─── POST /api/admin/physicians/:id/mdcn-override ────────────────────────────

// OverrideMDCN lets an admin confirm or reject a physician's MDCN verification.
// Body: { "status": "confirmed" | "rejected" }
func (h *Handler) OverrideMDCN(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "status is required (confirmed | rejected)"})
		return
	}

	adminID, _ := c.Get("userID")
	adminIDStr, _ := adminID.(string)

	if err := h.svc.OverrideMDCN(id, adminIDStr, body.Status); err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "physician not found" {
			status = http.StatusNotFound
		} else if err.Error()[:7] == "invalid" {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "MDCN verification override applied"})
}

// ─── POST /api/admin/physicians/flag-check ───────────────────────────────────

// TriggerFlagCheck manually runs the SLA breach flag check across all physicians.
func (h *Handler) TriggerFlagCheck(c *gin.Context) {
	count, err := h.svc.CheckAndFlagPhysicians()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Flag check failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"newlyFlagged": count}})
}

// ─── GET /api/admin/sla/breach-alerts ────────────────────────────────────────

// GetSLABreachAlerts returns the most recent SLA breach events for the admin
// alert panel. Use ?limit=N (max 100, default 50) to cap the result set.
func (h *Handler) GetSLABreachAlerts(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	alerts, err := h.svc.GetSLABreachAlerts(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load breach alerts"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": alerts})
}

// ─── GET /api/admin/sla/reassignment-log ─────────────────────────────────────

// GetReassignmentLog returns a paginated list of auto-reassignment events
// where a breached case was successfully handed to a new physician.
func (h *Handler) GetReassignmentLog(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))

	entries, total, err := h.svc.GetReassignmentLog(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load reassignment log"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    entries,
		"meta": gin.H{
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

// ─── GET /api/admin/audit ─────────────────────────────────────────────────────

// GetAuditLog returns a filtered, paginated audit event list.
// Query: eventType, actorRole, resource, dateFrom, dateTo, page, pageSize
func (h *Handler) GetAuditLog(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "50"))

	f := AuditFilters{
		EventType: c.Query("eventType"),
		ActorRole: c.Query("actorRole"),
		Resource:  c.Query("resource"),
		DateFrom:  c.Query("dateFrom"),
		DateTo:    c.Query("dateTo"),
		Page:      page,
		PageSize:  pageSize,
	}

	events, total, err := h.svc.GetAuditEvents(f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load audit log"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    events,
		"meta":    gin.H{"total": total, "page": page, "pageSize": pageSize},
	})
}

// ─── GET /api/admin/audit/export ─────────────────────────────────────────────

// ExportAuditCSV streams a CSV file download of filtered audit events.
func (h *Handler) ExportAuditCSV(c *gin.Context) {
	f := AuditFilters{
		EventType: c.Query("eventType"),
		ActorRole: c.Query("actorRole"),
		Resource:  c.Query("resource"),
		DateFrom:  c.Query("dateFrom"),
		DateTo:    c.Query("dateTo"),
	}

	csv, err := h.svc.BuildAuditCSV(f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate CSV"})
		return
	}

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", `attachment; filename="lifegate-audit-log.csv"`)
	c.Header("Content-Length", fmt.Sprintf("%d", len(csv)))
	c.Data(http.StatusOK, "text/csv; charset=utf-8", csv)
}

// ─── GET /api/admin/transactions ─────────────────────────────────────────────

// GetAllTransactions returns a paginated admin view of all payment transactions.
// Query: status (pending|success|failed), page, pageSize
func (h *Handler) GetAllTransactions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	status := c.Query("status")

	txns, total, err := h.svc.GetAllTransactions(status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load transactions"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    txns,
		"meta":    gin.H{"total": total, "page": page, "pageSize": pageSize},
	})
}

// ─── GET /api/admin/transactions/export ──────────────────────────────────────

// ExportTransactionsCSV streams a CSV of all payment transactions.
func (h *Handler) ExportTransactionsCSV(c *gin.Context) {
	status := c.Query("status")
	csv, err := h.svc.BuildTransactionCSV(status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate CSV"})
		return
	}
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", `attachment; filename="lifegate-transactions.csv"`)
	c.Header("Content-Length", fmt.Sprintf("%d", len(csv)))
	c.Data(http.StatusOK, "text/csv; charset=utf-8", csv)
}

// ─── GET /api/admin/compliance/ndpa ──────────────────────────────────────────

// GetNDPASnapshots returns recent NDPA 2023 compliance snapshots.
func (h *Handler) GetNDPASnapshots(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "30"))
	snaps, err := h.svc.GetNDPASnapshots(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load NDPA snapshots"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": snaps})
}

// ─── POST /api/admin/compliance/ndpa/generate ────────────────────────────────

// GenerateNDPASnapshot computes and persists a fresh NDPA compliance snapshot.
func (h *Handler) GenerateNDPASnapshot(c *gin.Context) {
	snap, err := h.svc.GenerateNDPASnapshot()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate NDPA snapshot"})
		return
	}

	adminID, _ := c.Get("userID")
	adminIDStr, _ := adminID.(string)
	h.svc.LogAction(adminIDStr, "compliance.ndpa_snapshot", "compliance", &snap.ID,
		map[string]interface{}{"snapshotDate": snap.SnapshotDate})

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": snap})
}

// ─── GET /api/admin/compliance/ndpa/export ───────────────────────────────────

// ExportNDPACSV streams a CSV of NDPA compliance snapshots.
func (h *Handler) ExportNDPACSV(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "90"))
	snaps, err := h.svc.GetNDPASnapshots(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate CSV"})
		return
	}

	var data []byte
	data = append(data, 0xEF, 0xBB, 0xBF) // UTF-8 BOM
	data = append(data, []byte("Snapshot Date,Data Subjects,Consent Captured %,Data Min OK,Retention OK,Breach Incidents (30d),Pending DSAR,Created At\n")...)
	for _, s := range snaps {
		dm := "No"
		if s.DataMinimisationOk {
			dm = "Yes"
		}
		rp := "No"
		if s.RetentionPolicyOk {
			rp = "Yes"
		}
		line := fmt.Sprintf("%s,%d,%.2f,%s,%s,%d,%d,%s\n",
			s.SnapshotDate, s.TotalDataSubjects, s.ConsentCapturedPct,
			dm, rp, s.BreachIncidents30d, s.PendingDSAR, s.CreatedAt)
		data = append(data, []byte(line)...)
	}

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", `attachment; filename="lifegate-ndpa-compliance.csv"`)
	c.Header("Content-Length", fmt.Sprintf("%d", len(data)))
	c.Data(http.StatusOK, "text/csv; charset=utf-8", data)
}

// ─── GET /api/admin/settings/alerts ──────────────────────────────────────────

// GetAlertThresholds returns all configurable alert thresholds.
func (h *Handler) GetAlertThresholds(c *gin.Context) {
	thresholds, err := h.svc.GetAlertThresholds()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load alert thresholds"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": thresholds})
}

// ─── PATCH /api/admin/settings/alerts/:key ───────────────────────────────────

// UpdateAlertThreshold updates a single threshold's value and enabled state.
// Body: { "value": 4.0, "enabled": true }
func (h *Handler) UpdateAlertThreshold(c *gin.Context) {
	key := c.Param("key")
	var body struct {
		Value   float64 `json:"value"`
		Enabled *bool   `json:"enabled"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	enabled := true
	if body.Enabled != nil {
		enabled = *body.Enabled
	}

	adminID, _ := c.Get("userID")
	adminIDStr, _ := adminID.(string)

	if err := h.svc.UpdateAlertThreshold(adminIDStr, key, body.Value, enabled); err != nil {
		status := http.StatusInternalServerError
		if err.Error()[:9] == "threshold" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"success": false, "message": err.Error()})
		return
	}

	h.svc.LogAction(adminIDStr, "alert_threshold.update", "config", nil,
		map[string]interface{}{"key": key, "value": body.Value, "enabled": enabled})

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Threshold updated"})
}
