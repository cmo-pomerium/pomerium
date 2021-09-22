import ab2str from "arraybuffer-to-string";
import { encode, decode } from "base64-arraybuffer";

interface PomeriumCredentialAssertionResponse {
  id: string;
  type: string;
  rawId: string; // base64
  extensions: unknown;
  response: {
    clientDataJSON: string; // json string
    authenticatorData: string; // base64
    signature: string; // base64
    userHandle: string; // base64
  };
}

interface PomeriumCredentialAttestationResponse {
  id: string;
  type: string;
  rawId: string; // base64
  extensions: unknown;
  response: {
    clientDataJSON: string; // base64
    attestationObject: string; // base64
  };
}

type PomeriumCredentialResponse =
  | PomeriumCredentialAssertionResponse
  | PomeriumCredentialAttestationResponse;

function toPomeriumCredentialResponse(
  credential: PublicKeyCredential
): PomeriumCredentialResponse {
  const result: PomeriumCredentialResponse = {
    id: credential.id,
    type: credential.type,
    rawId: encode(credential.rawId),
    extensions: credential.getClientExtensionResults(),
    response: null,
  };
  if ("attestationObject" in credential.response) {
    result.response = {
      clientDataJSON: ab2str(credential.response.clientDataJSON),
      attestationObject: encode(
        (credential.response as AuthenticatorAttestationResponse)
          .attestationObject
      ),
    };
  } else {
    result.response = {
      clientDataJSON: ab2str(credential.response.clientDataJSON),
      authenticatorData: encode(
        (credential.response as AuthenticatorAssertionResponse)
          .authenticatorData
      ),
      signature: encode(
        (credential.response as AuthenticatorAssertionResponse).signature
      ),
      userHandle: encode(
        (credential.response as AuthenticatorAssertionResponse).userHandle
      ),
    };
  }
  return result;
}

interface PomeriumData {
  options: {
    attestation: string;
    authenticatorSelection: {
      authenticatorAttachment: string;
      requireResidentKey?: boolean;
      userVerification: string;
    };
    pubKeyCredParamAlgorithms: string[];
  };
  knownDeviceCredentials: unknown[];
  challenge: string; // base64
  user: {
    id: string; // base64
    name: string;
    displayName: string;
  };
}

function getInput(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

function toPublicKeyCredentialCreationOptions(
  data: PomeriumData
): PublicKeyCredentialCreationOptions {
  return {
    attestation:
      data.options.attestation === "NONE"
        ? "none"
        : data.options.attestation === "INDIRECT"
        ? "indirect"
        : data.options.attestation === "DIRECT"
        ? "direct"
        : undefined,
    authenticatorSelection: {
      authenticatorAttachment:
        data.options.authenticatorSelection.authenticatorAttachment ===
        "CROSS_PLATFORM"
          ? "cross-platform"
          : data.options.authenticatorSelection.authenticatorAttachment ===
            "PLATFORM"
          ? "platform"
          : undefined,
      requireResidentKey:
        data.options.authenticatorSelection.requireResidentKey === true
          ? true
          : data.options.authenticatorSelection.requireResidentKey === false
          ? false
          : undefined,
      userVerification:
        data.options.authenticatorSelection.userVerification === "DISCOURAGED"
          ? "discouraged"
          : data.options.authenticatorSelection.userVerification === "PREFERRED"
          ? "preferred"
          : data.options.authenticatorSelection.userVerification === "REQUIRED"
          ? "required"
          : undefined,
    },
    challenge: decode(data.challenge),
    pubKeyCredParams: data.options.pubKeyCredParamAlgorithms.map((alg) => ({
      type: "public-key",
      alg: alg === "ES256" ? -7 : -257,
    })),
    rp: {
      name: "Pomerium",
    },
    user: {
      id: decode(data.user.id),
      name: data.user.name,
      displayName: data.user.displayName,
    },
  };
}

async function submitForm(action: string, credential: PublicKeyCredential) {
  const credentialResponse = toPomeriumCredentialResponse(credential);
  getInput("action").value = action;
  getInput("credential_response").value = JSON.stringify(credentialResponse);
  //(document.getElementById("webauthn_form") as HTMLFormElement).submit();
  console.log("RESPONSE", credentialResponse);
}

async function registerNewDeviceCredential(data: PomeriumData) {
  const credential = await navigator.credentials.create({
    publicKey: toPublicKeyCredentialCreationOptions(data),
  });
  await submitForm("enroll", credential as PublicKeyCredential);
}

async function authenticateExistingDeviceCredential(data: PomeriumData) {
  throw "not implemented";
}

async function init(data: PomeriumData) {
  if (data.knownDeviceCredentials.length > 0) {
    await authenticateExistingDeviceCredential(data);
  } else {
    await registerNewDeviceCredential(data);
  }
}

window.addEventListener("DOMContentLoaded", (evt) => {
  if ("PomeriumData" in window) {
    init((window as any).PomeriumData as PomeriumData);
  }
});
