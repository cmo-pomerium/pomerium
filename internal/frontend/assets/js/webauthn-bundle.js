(() => {
  var __require = typeof require !== "undefined" ? require : (x) => {
    throw new Error('Dynamic require of "' + x + '" is not supported');
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // node_modules/base64-arraybuffer/dist/base64-arraybuffer.es5.js
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
  for (i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  var i;
  var decode = function(base64) {
    var bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }
    var arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
    for (i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];
      bytes[p++] = encoded1 << 2 | encoded2 >> 4;
      bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
      bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }
    return arraybuffer;
  };

  // internal/frontend/assets/ts/webauthn.ts
  function toPublicKeyCredentialCreationOptions(data) {
    return {
      attestation: data.options.attestation === "NONE" ? "none" : data.options.attestation === "INDIRECT" ? "indirect" : data.options.attestation === "DIRECT" ? "direct" : void 0,
      authenticatorSelection: {
        authenticatorAttachment: data.options.authenticatorSelection.authenticatorAttachment === "CROSS_PLATFORM" ? "cross-platform" : data.options.authenticatorSelection.authenticatorAttachment === "PLATFORM" ? "platform" : void 0,
        requireResidentKey: data.options.authenticatorSelection.requireResidentKey === true ? true : data.options.authenticatorSelection.requireResidentKey === false ? false : void 0,
        userVerification: data.options.authenticatorSelection.userVerification === "DISCOURAGED" ? "discouraged" : data.options.authenticatorSelection.userVerification === "PREFERRED" ? "preferred" : data.options.authenticatorSelection.userVerification === "REQUIRED" ? "required" : void 0
      },
      challenge: decode(data.challenge),
      pubKeyCredParams: data.options.pubKeyCredParamAlgorithms.map((alg) => ({
        type: "public-key",
        alg: alg === "ES256" ? -7 : -257
      })),
      rp: {
        name: "Pomerium"
      },
      user: {
        id: decode(data.user.id),
        name: data.user.name,
        displayName: data.user.displayName
      }
    };
  }
  function registerNewDeviceCredential(data) {
    return __async(this, null, function* () {
      const res = yield navigator.credentials.create({
        publicKey: toPublicKeyCredentialCreationOptions(data)
      });
      console.log("RESULT", res);
    });
  }
  function authenticateExistingDeviceCredential(data) {
    return __async(this, null, function* () {
      throw "not implemented";
    });
  }
  function init(data) {
    return __async(this, null, function* () {
      if (data.knownDeviceCredentials.length > 0) {
        yield authenticateExistingDeviceCredential(data);
      } else {
        yield registerNewDeviceCredential(data);
      }
    });
  }
  window.addEventListener("DOMContentLoaded", (evt) => {
    if ("PomeriumData" in window) {
      init(window.PomeriumData);
    }
  });
})();
