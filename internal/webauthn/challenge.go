package webauthn

import (
	"crypto/rand"
	"encoding/binary"
	"errors"
	"io"
	"time"

	"github.com/pomerium/pomerium/pkg/cryptutil"
)

// Challenge errors
var (
	ErrInvalidChallenge = errors.New("invalid challenge")
	ErrExpiredChallenge = errors.New("expired challenge")
)

const (
	challengeNonceSize     = 24
	challengeTimestampSize = 8
	challengeHMACSize      = 32
)

var (
	defaultChallengeNow     = time.Now
	defaultChallengeRand    = rand.Reader
	defaultChallengeTimeout = time.Minute * 10
)

type challengeConfig struct {
	rand    io.Reader
	now     func() time.Time
	timeout time.Duration
}

// A ChallengeOption customizes the challenge configuration.
type ChallengeOption func(cfg *challengeConfig)

func getChallengeConfig(options ...ChallengeOption) *challengeConfig {
	cfg := new(challengeConfig)
	WithChallengeNow(defaultChallengeNow)(cfg)
	WithChallengeRand(defaultChallengeRand)(cfg)
	WithChallengeTimeout(defaultChallengeTimeout)(cfg)
	for _, option := range options {
		option(cfg)
	}
	return cfg
}

// WithChallengeNow customizes the challenge function used to get the current time.
func WithChallengeNow(now func() time.Time) ChallengeOption {
	return func(cfg *challengeConfig) {
		cfg.now = now
	}
}

// WithChallengeRand customizes the random byte source for generating challenges.
func WithChallengeRand(rdr io.Reader) ChallengeOption {
	return func(cfg *challengeConfig) {
		cfg.rand = rdr
	}
}

// WithChallengeTimeout customizes the challenge timeout.
func WithChallengeTimeout(timeout time.Duration) ChallengeOption {
	return func(cfg *challengeConfig) {
		cfg.timeout = timeout
	}
}

// GenerateChallenge generates a challenge suitable for WebAuthn.
//
// Format is nonce (24) | expiry (8) | hmac (32)
func GenerateChallenge(key []byte, options ...ChallengeOption) ([]byte, error) {
	cfg := getChallengeConfig(options...)

	challenge := make([]byte, challengeNonceSize+challengeTimestampSize+challengeHMACSize)

	// generate a nonce
	_, err := io.ReadFull(cfg.rand, challenge[:challengeNonceSize])
	if err != nil {
		return nil, err
	}

	// store the expiry
	expiry := cfg.now().Add(cfg.timeout)
	binary.LittleEndian.PutUint64(challenge[challengeNonceSize:], uint64(expiry.UnixMilli()))

	// store the hmac
	hmac := cryptutil.GenerateHMAC(challenge[:challengeNonceSize+challengeTimestampSize], key)
	copy(challenge[challengeNonceSize+challengeTimestampSize:], hmac)

	return challenge, nil
}

// VerifyChallenge verifies a WebAuthn challenge to confirm it was generated using the given key
// and that it hasn't expired.
func VerifyChallenge(key, challenge []byte, options ...ChallengeOption) error {
	cfg := getChallengeConfig(options...)

	if len(challenge) != challengeNonceSize+challengeTimestampSize+challengeHMACSize {
		return ErrInvalidChallenge
	}

	hmacOK := cryptutil.CheckHMAC(
		challenge[:challengeNonceSize+challengeTimestampSize],
		challenge[challengeNonceSize+challengeTimestampSize:],
		key)
	if !hmacOK {
		return ErrInvalidChallenge
	}

	expiry := time.UnixMilli(int64(binary.LittleEndian.Uint64(challenge[challengeNonceSize:])))
	if expiry.Before(cfg.now()) {
		return ErrExpiredChallenge
	}

	return nil
}
