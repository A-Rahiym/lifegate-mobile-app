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
