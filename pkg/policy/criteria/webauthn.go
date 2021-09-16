package criteria

import (
	"github.com/open-policy-agent/opa/ast"

	"github.com/pomerium/pomerium/pkg/policy/generator"
	"github.com/pomerium/pomerium/pkg/policy/parser"
)

var webauthnBody = ast.Body{
	ast.MustParseExpr(`session := get_session(input.session.id)`),
	ast.MustParseExpr(`session.user_id != null`),
	ast.MustParseExpr(`session.user_id != ""`),
}

type webauthnCriterion struct {
	g *Generator
}

func (webauthnCriterion) DataType() CriterionDataType {
	return generator.CriterionDataTypeUnknown
}

func (webauthnCriterion) Name() string {
	return "webauthn"
}

func (c webauthnCriterion) GenerateRule(_ string, _ parser.Value) (*ast.Rule, []*ast.Rule, error) {
	/*
		webauthn:
			pubKeyCredAlgorithms: ["ES256", "RS256"]
			authenticatorSelection:
				authenticatorAttachment: "platform"
				requireResidentKey: true
				userVerification: "discouraged"
			attestation: "indirect"
	*/

	rule := c.g.NewRule("webauthn")
	rule.Body = webauthnBody
	return rule, nil, nil
}

// WebAuthnCriterion returns a Criterion which returns true if the user has a valid webauthn device.
func WebAuthnCriterion(generator *Generator) Criterion {
	return webauthnCriterion{g: generator}
}

func init() {
	Register(WebAuthnCriterion)
}
