type BeginResponse =
  | {
      type: "get";
      options: PublicKeyCredentialRequestOptions;
    }
  | {
      type: "create";
      options: PublicKeyCredentialCreationOptions;
    };

async function begin() {
  const result = await fetch("/.pomerium/webauthn/begin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const response = (await result.json()) as BeginResponse;
  const credential = await (response.type === "get"
    ? navigator.credentials.get({ publicKey: response.options })
    : navigator.credentials.create({ publicKey: response.options }));
  await authenticate(credential);
}

type AuthenticateResponse = {
  redirect_url: string;
};

async function authenticate(credential: Credential) {
  const result = await fetch("/.pomerium/webauthn/authenticate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      credential: credential,
    }),
  });
  const response = (await result.json()) as AuthenticateResponse;
  location.href = response.redirect_url;
}

begin();
