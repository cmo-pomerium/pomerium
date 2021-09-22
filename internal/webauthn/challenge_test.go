package webauthn

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/pomerium/pomerium/pkg/cryptutil"
)

func TestChallenge(t *testing.T) {
	key1 := cryptutil.NewKey()
	key2 := cryptutil.NewKey()

	t1 := time.Date(2021, 9, 22, 3, 0, 0, 0, time.UTC)
	t2 := time.Date(2021, 9, 22, 6, 0, 0, 0, time.UTC)

	t.Run("valid", func(t *testing.T) {
		challenge, err := GenerateChallenge(key1)
		require.NoError(t, err)
		err = VerifyChallenge(key1, challenge)
		assert.NoError(t, err)
	})
	t.Run("bad hmac", func(t *testing.T) {
		challenge, err := GenerateChallenge(key1)
		require.NoError(t, err)
		err = VerifyChallenge(key2, challenge)
		assert.Equal(t, ErrInvalidChallenge, err)
	})
	t.Run("expired", func(t *testing.T) {
		challenge, err := GenerateChallenge(key1,
			WithChallengeNow(func() time.Time {
				return t1
			}))
		require.NoError(t, err)
		err = VerifyChallenge(key1, challenge,
			WithChallengeNow(func() time.Time {
				return t2
			}))
		assert.Equal(t, ErrExpiredChallenge, err)
	})
}
