package authenticate

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/pomerium/pomerium/internal/telemetry/trace"
)

type (
	webAuthnBeginRequest  struct{}
	webAuthnBeginResponse struct {
		Type    string      `json:"type"`
		Options interface{} `json:"options"`
	}
	webAuthnGetOptions struct {
	}
	webAuthnCreateOptions struct {
	}
	webAuthnCredential struct {
		Type string `json:"type"`
		ID   string `json:"id"`
	}
	webAuthnAuthenticateRequest struct {
		Credential webAuthnCredential `json:"credential"`
	}
	webAuthnAuthenticateResponse struct {
		RedirectURL string `json:"redirect_url"`
	}
)

func (a *Authenticate) mountWebAuthn(dotPomeriumRouter *mux.Router) {
	dotPomeriumRouter.Path("/webauthn").Handler(a.requireValidSignatureOnRedirect(a.WebAuthn))
}

// WebAuthn is the handler for the webauthn device flow.
func (a *Authenticate) WebAuthn(w http.ResponseWriter, r *http.Request) error {
	ctx, span := trace.StartSpan(r.Context(), "authenticate.WebAuthn")
	defer span.End()

	_ = ctx

	return a.templates.ExecuteTemplate(w, "webauthn.html", nil)
}

func (a *Authenticate) WebAuthnBegin(w http.ResponseWriter, r *http.Request) error {
	panic("not implemented")
}

func (a *Authenticate) WebAuthnAuthenticatge(w http.ResponseWriter, r *http.Request) error {
	panic("not implemented")
}
