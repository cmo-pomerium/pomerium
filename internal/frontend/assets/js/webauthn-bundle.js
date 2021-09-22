(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __require = typeof require !== "undefined" ? require : (x) => {
    throw new Error('Dynamic require of "' + x + '" is not supported');
  };
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __reExport = (target, module, desc) => {
    if (module && typeof module === "object" || typeof module === "function") {
      for (let key of __getOwnPropNames(module))
        if (!__hasOwnProp.call(target, key) && key !== "default")
          __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
    }
    return target;
  };
  var __toModule = (module) => {
    return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
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

  // node_modules/arraybuffer-to-string/browser.js
  var require_browser = __commonJS({
    "node_modules/arraybuffer-to-string/browser.js"(exports, module) {
      "use strict";
      module.exports = function ArrayBufferToString(buffer, encoding) {
        if (encoding == null)
          encoding = "utf8";
        var uint8 = new Uint8Array(buffer);
        if (encoding === "hex") {
          var out = "";
          for (var i = 0, l = uint8.byteLength; i < l; ++i) {
            out += toHex(uint8[i]);
          }
          return out;
        }
        if (encoding === "base64") {
          str = String.fromCharCode.apply(null, uint8);
          return btoa(str);
        }
        if (encoding === "binary" || encoding === "latin1" || !window.TextDecoder) {
          str = String.fromCharCode.apply(null, uint8);
          return str;
        }
        if (encoding === "utf16le")
          encoding = "utf-16le";
        var decoder = new TextDecoder(encoding);
        var str = decoder.decode(uint8);
        return str;
      };
      function toHex(n) {
        if (n < 16)
          return "0" + n.toString(16);
        return n.toString(16);
      }
    }
  });

  // internal/frontend/assets/ts/webauthn.ts
  var import_arraybuffer_to_string = __toModule(require_browser());

  // node_modules/base64-arraybuffer/dist/base64-arraybuffer.es5.js
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
  for (i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  var i;
  var encode = function(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer), i, len = bytes.length, base64 = "";
    for (i = 0; i < len; i += 3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
      base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
      base64 += chars[bytes[i + 2] & 63];
    }
    if (len % 3 === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }
    return base64;
  };
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
  function toPomeriumCredentialResponse(credential) {
    const result = {
      id: credential.id,
      type: credential.type,
      rawId: encode(credential.rawId),
      extensions: credential.getClientExtensionResults(),
      response: null
    };
    if ("attestationObject" in credential.response) {
      result.response = {
        clientDataJSON: (0, import_arraybuffer_to_string.default)(credential.response.clientDataJSON),
        attestationObject: encode(credential.response.attestationObject)
      };
    } else {
      result.response = {
        clientDataJSON: (0, import_arraybuffer_to_string.default)(credential.response.clientDataJSON),
        authenticatorData: encode(credential.response.authenticatorData),
        signature: encode(credential.response.signature),
        userHandle: encode(credential.response.userHandle)
      };
    }
    return result;
  }
  function getInput(id) {
    return document.getElementById(id);
  }
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
  function submitForm(action, credential) {
    return __async(this, null, function* () {
      const credentialResponse = toPomeriumCredentialResponse(credential);
      getInput("action").value = action;
      getInput("credential_response").value = JSON.stringify(credentialResponse);
      console.log("RESPONSE", credentialResponse);
    });
  }
  function registerNewDeviceCredential(data) {
    return __async(this, null, function* () {
      const credential = yield navigator.credentials.create({
        publicKey: toPublicKeyCredentialCreationOptions(data)
      });
      yield submitForm("enroll", credential);
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
