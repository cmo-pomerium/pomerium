package webauthn

import (
	"github.com/duo-labs/webauthn/protocol"

	"github.com/pomerium/pomerium/pkg/grpc/user"
)

type UserEntity = protocol.UserEntity

// GetUserEntity gets a WebAuthn UserEntity from a user record.
func GetUserEntity(u *user.User) UserEntity {
	return UserEntity{
		ID: u.GetHandle(),
		CredentialEntity: protocol.CredentialEntity{
			Name: u.GetName(),
		},
		DisplayName: u.GetName(),
	}
}
