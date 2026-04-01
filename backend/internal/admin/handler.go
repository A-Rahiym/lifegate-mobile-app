package admin

import (
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

// GetDashboard returns live counts: active users, case counts by state,
// physician availability, escalations today, completions today.
func (h *Handler) GetDashboard(c *gin.Context) {
	stats, err := h.svc.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load dashboard"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": stats})
}

// ─── GET /api/admin/cases ─────────────────────────────────────────────────────

// GetCases returns all cases with optional filters:
//
//	?status=Pending|Active|Completed
//	?urgency=LOW|MEDIUM|HIGH|CRITICAL
//	?category=general_health|doctor_consultation|…
//	?search=<text>
//	?page=1&pageSize=20
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

// GetSLA returns all Pending (unassigned) cases with colour-coded SLA status:
//
//	green  — in queue < 4 h  (< 2 h for HIGH/CRITICAL)
//	yellow — in queue 4–24 h (2–12 h for HIGH/CRITICAL)
//	red    — in queue > 24 h (> 12 h for HIGH/CRITICAL)
func (h *Handler) GetSLA(c *gin.Context) {
	items, err := h.svc.GetSLAReport()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to load SLA report"})
		return
	}
	if items == nil {
		items = []SLAItem{}
	}

	// Annotate with human-readable wait times.
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

// GetEDISMetrics returns EDIS performance metrics:
// escalation rates, confidence averages, low-confidence counts, flag frequency.
//
//	?days=30  (default 30)
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

// GetPhysicians returns all physicians with active-case count and availability.
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
