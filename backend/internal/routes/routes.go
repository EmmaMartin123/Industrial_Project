package routes

import (
	"fmt"
	"net/http"

	"github.com/EmmaMartin123/Industrial_Project/backend/internal/auth"
	"github.com/EmmaMartin123/Industrial_Project/backend/internal/utils"
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
	mux.Handle("/api/testroute", protected.Then(http.HandlerFunc(testroute)))

	fmt.Println("Router setup complete")
	return base.Then(mux)
}

func testroute(w http.ResponseWriter, r *http.Request) {
	uid, _ := utils.UserIDFromCtx(r.Context())
	fmt.Fprintf(w, "Hello %s", uid)
}
