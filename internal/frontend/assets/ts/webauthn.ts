import { decode } from "base64-arraybuffer";

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

async function registerNewDeviceCredential(data: PomeriumData) {
  const res = await navigator.credentials.create({
    publicKey: toPublicKeyCredentialCreationOptions(data),
  });
  console.log("RESULT", res);
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
