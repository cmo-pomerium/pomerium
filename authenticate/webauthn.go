package authenticate

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/gorilla/mux"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"

	"github.com/pomerium/pomerium/internal/httputil"
	"github.com/pomerium/pomerium/internal/urlutil"
	"github.com/pomerium/pomerium/pkg/grpc/databroker"
	"github.com/pomerium/pomerium/pkg/grpc/device"
	"github.com/pomerium/pomerium/pkg/protoutil"
)

var (
	errMissingDeviceType     = httputil.NewError(http.StatusBadRequest, errors.New("device_type is a required parameter"))
	errUnknownDeviceType     = httputil.NewError(http.StatusBadRequest, errors.New("unknown device_type"))
	errUnsupportedDeviceType = httputil.NewError(http.StatusBadRequest, errors.New("unsupported device_type"))
)

func (a *Authenticate) mountWebAuthn(pomeriumRouter *mux.Router) {
	pomeriumRouter.Path("/webauthn").Handler(a.requireValidSignature(a.webAuthn))
}

func (a *Authenticate) webAuthn(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	deviceTypeParam := r.FormValue(urlutil.QueryDeviceType)
	if deviceTypeParam == "" {
		return errMissingDeviceType
	}

	enrollmentToken := r.FormValue(urlutil.QueryEnrollmentToken)
	if enrollmentToken != "" {
		panic("TODO: implement enrollment token")
	}

	// get the session information
	session, _, err := a.getCurrentSession(ctx)
	if err != nil {
		return err
	}

	// get the user information
	user, err := a.getUser(ctx, session.GetUserId())
	if err != nil {
		return err
	}

	// get the device credentials
	var knownDeviceCredentials []*device.Credential
	for _, deviceCredentialID := range user.GetDeviceCredentialIds() {
		deviceCredential, err := a.getDeviceCredential(ctx, deviceCredentialID)
		if status.Code(err) == codes.NotFound {
			// ignore missing devices
			continue
		} else if err != nil {
			return httputil.NewError(http.StatusInternalServerError,
				fmt.Errorf("error retrieving device credential: %w", err))
		}
		knownDeviceCredentials = append(knownDeviceCredentials, deviceCredential)
	}

	// get the stored device type
	deviceType, err := a.getDeviceType(ctx, deviceTypeParam)
	if err != nil {
		return err
	}

	// get the webauthn options
	var options *device.WebAuthnOptions
	switch spec := deviceType.GetSpecifier().(type) {
	case *device.Type_Webauthn:
		options = spec.Webauthn.Options
	default:
		return errUnsupportedDeviceType
	}

	var buf bytes.Buffer
	err = a.templates.ExecuteTemplate(&buf, "webauthn.html", map[string]interface{}{
		"Data": &WebAuthnTemplateData{
			Options:                options,
			KnownDeviceCredentials: knownDeviceCredentials,
			Challenge:              []byte{1, 2, 3, 4},
			User: WebAuthnTemplateDataUser{
				ID:          []byte{5, 6, 7, 8},
				Name:        user.GetName(),
				DisplayName: user.GetName(),
			},
		},
	})
	if err != nil {
		return err
	}

	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	_, err = io.Copy(w, &buf)
	return err
}

func (a *Authenticate) getDeviceCredential(ctx context.Context, deviceCredentialID string) (*device.Credential, error) {
	any := protoutil.NewAny(new(device.Credential))
	res, err := a.state.Load().dataBrokerClient.Get(ctx, &databroker.GetRequest{
		Type: any.GetTypeUrl(),
		Id:   deviceCredentialID,
	})
	if err != nil {
		return nil, err
	}

	var obj device.Credential
	err = res.GetRecord().GetData().UnmarshalTo(&obj)
	if err != nil {
		return nil, err
	}
	return &obj, nil
}

func (a *Authenticate) getDeviceType(ctx context.Context, deviceType string) (*device.Type, error) {
	return &device.Type{
		Id:   "default",
		Name: "WebAuthn",
		Specifier: &device.Type_Webauthn{
			Webauthn: &device.Type_WebAuthn{
				Options: &device.WebAuthnOptions{
					AuthenticatorSelection: &device.WebAuthnOptions_AuthenticatorSelection{
						AuthenticatorAttachment: device.WebAuthnOptions_CROSS_PLATFORM,
						RequireResidentKey:      false,
						UserVerification:        device.WebAuthnOptions_PREFERRED,
					},
					Attestation: device.WebAuthnOptions_INDIRECT,
					PubKeyCredParamAlgorithms: []device.WebAuthnOptions_Algorithm{
						device.WebAuthnOptions_ES256,
						device.WebAuthnOptions_RS256,
					},
				},
			},
		},
	}, nil

	any := protoutil.NewAny(new(device.Type))
	res, err := a.state.Load().dataBrokerClient.Get(ctx, &databroker.GetRequest{
		Type: any.GetTypeUrl(),
		Id:   deviceType,
	})
	if err != nil {
		return nil, errUnknownDeviceType
	}

	var obj device.Type
	err = res.GetRecord().GetData().UnmarshalTo(&obj)
	if err != nil {
		return nil, errUnknownDeviceType
	}
	return &obj, nil
}

func (a *Authenticate) getWebAuthnURL(r *http.Request) (*url.URL, error) {
	uri, err := a.options.Load().GetAuthenticateURL()
	if err != nil {
		return nil, err
	}

	uri = uri.ResolveReference(&url.URL{
		Path: "/.pomerium/webauthn",
		RawQuery: (&url.Values{
			urlutil.QueryDeviceType: {"default"},
			urlutil.QueryRedirectURI: {uri.ResolveReference(&url.URL{
				Path: "/.pomerium/",
			}).String()},
		}).Encode(),
	})
	return urlutil.NewSignedURL(a.state.Load().sharedKey, uri).Sign(), nil
}

func marshalProtoJSONArray(msgs []proto.Message) ([]byte, error) {
	encoded := make([]json.RawMessage, 0, len(msgs))
	for _, msg := range msgs {
		bs, err := protojson.Marshal(msg)
		if err != nil {
			return nil, err
		}
		encoded = append(encoded, bs)
	}
	return json.Marshal(encoded)
}

type (
	// WebAuthnTemplateData is the data used by the webauthn HTML template.
	WebAuthnTemplateData struct {
		Options                *device.WebAuthnOptions  `json:"options"`
		KnownDeviceCredentials []*device.Credential     `json:"knownDeviceCredentials"`
		Challenge              []byte                   `json:"challenge"`
		User                   WebAuthnTemplateDataUser `json:"user"`
	}
	// WebAuthnTemplateDataUser is a WebAuthn user.
	WebAuthnTemplateDataUser struct {
		ID          []byte `json:"id"`
		Name        string `json:"name"`
		DisplayName string `json:"displayName"`
	}
)

func (data *WebAuthnTemplateData) MarshalJSON() ([]byte, error) {
	m := map[string]interface{}{}

	bs, err := protojson.Marshal(data.Options)
	if err != nil {
		return nil, err
	}
	m["options"] = json.RawMessage(bs)

	a := make([]json.RawMessage, 0, len(data.KnownDeviceCredentials))
	for _, deviceCredential := range data.KnownDeviceCredentials {
		bs, err = protojson.Marshal(deviceCredential)
		if err != nil {
			return nil, err
		}
		a = append(a, bs)
	}

	m["knownDeviceCredentials"] = a
	m["challenge"] = data.Challenge
	m["user"] = data.User

	return json.Marshal(m)
}
