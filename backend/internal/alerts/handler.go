package alerts

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for the alerts resource.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GetPatientAlerts handles GET /api/alerts — patient-scoped preventive alerts.
func (h *Handler) GetPatientAlerts(c *gin.Context) {
	userID, _ := c.Get("userID")
	uid, _ := userID.(string)

	alts, err := h.svc.GetAlertsForPatient(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	if alts == nil {
		alts = []Alert{}
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Alerts fetched",
		"data": gin.H{
			"alerts": alts,
			"total":  len(alts),
		},
	})
}

// GetPhysicianAlerts handles GET /api/physician/alerts — physician-scoped workload alerts.
func (h *Handler) GetPhysicianAlerts(c *gin.Context) {
	physicianID, _ := c.Get("userID")
	pid, _ := physicianID.(string)

	alts, err := h.svc.GetAlertsForPhysician(pid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	if alts == nil {
		alts = []Alert{}
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Physician alerts fetched",
		"data": gin.H{
			"alerts": alts,
			"total":  len(alts),
		},
	})
}
