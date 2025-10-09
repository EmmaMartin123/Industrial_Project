package routes

import (
	"fmt"
	"net/http"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/auth"
)

func SetupRouter() http.Handler {
	base := auth.NewChain(
		auth.LoggingMiddleware,
		auth.CORSMiddleware,
	)

	protected := auth.NewChain(
		auth.AuthMiddleWare,
	)

	mux := http.NewServeMux()
	mux.Handle("/api/pitch", protected.Then(http.HandlerFunc(pitch_route)))
	mux.Handle("/api/pitch/status", protected.Then(http.HandlerFunc(update_pitch_status_route)))
	mux.Handle("/api/profile", protected.Then(http.HandlerFunc(profile_route)))
	mux.Handle("/api/investment", protected.Then(http.HandlerFunc(investment_route)))
	mux.Handle("/api/wallet", protected.Then(http.HandlerFunc(wallet_route)))
	mux.Handle("/api/bank", protected.Then(http.HandlerFunc(bank_route)))
	mux.Handle("/api/profit", protected.Then(http.HandlerFunc(profit_route)))
	mux.Handle("/api/distribute", protected.Then(http.HandlerFunc(distribute_route)))
	mux.Handle("/api/portfolio", protected.Then(http.HandlerFunc(portfolio_route)))

	fmt.Println("Router setup complete")
	return base.Then(mux)
}
