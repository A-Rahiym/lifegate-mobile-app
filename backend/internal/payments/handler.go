package payments

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Handler exposes payment and credits HTTP endpoints.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// GetBundles handles GET /api/payments/bundles
func (h *Handler) GetBundles(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    h.svc.GetBundles(),
	})
}

// GetCreditBalance handles GET /api/credits/balance
func (h *Handler) GetCreditBalance(c *gin.Context) {
	userID, _ := c.Get("userID")
	uid, _ := userID.(string)

	bal, err := h.svc.GetCreditBalance(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": bal})
}

// InitiatePayment handles POST /api/payments/initiate
// Body: { "bundleId": "2000" }
func (h *Handler) InitiatePayment(c *gin.Context) {
	userID, _ := c.Get("userID")
	uid, _ := userID.(string)
	email, _ := c.Get("email")
	emailStr, _ := email.(string)

	var body struct {
		BundleID string `json:"bundleId" binding:"required"`
		Name     string `json:"name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	name := body.Name
	if name == "" {
		name = "LifeGate User"
	}

	txRef, link, err := h.svc.InitiatePayment(uid, emailStr, name, body.BundleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"txRef":       txRef,
			"paymentLink": link,
		},
	})
}

// VerifyPayment handles POST /api/payments/verify
// Body: { "txRef": "LG-...", "flwTxId": "12345678" }
func (h *Handler) VerifyPayment(c *gin.Context) {
	userID, _ := c.Get("userID")
	uid, _ := userID.(string)

	var body struct {
		TxRef   string `json:"txRef"   binding:"required"`
		FlwTxID string `json:"flwTxId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	pt, err := h.svc.VerifyAndCredit(uid, body.TxRef, body.FlwTxID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	if pt.Status == "failed" {
		c.JSON(http.StatusPaymentRequired, gin.H{
			"success": false,
			"message": "Payment could not be verified. Please try again.",
			"data":    pt,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment successful. Credits added to your account.",
		"data":    pt,
	})
}

// GetTransactions handles GET /api/payments/transactions?limit=50
func (h *Handler) GetTransactions(c *gin.Context) {
	userID, _ := c.Get("userID")
	uid, _ := userID.(string)

	limit := 50
	if l := c.Query("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil {
			limit = n
		}
	}

	txns, err := h.svc.GetTransactions(uid, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	if txns == nil {
		txns = []PaymentTransaction{}
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"transactions": txns,
			"total":        len(txns),
		},
	})
}
