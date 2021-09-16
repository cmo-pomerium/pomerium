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

  // internal/frontend/assets/ts/webauthn.ts
  function begin() {
    return __async(this, null, function* () {
      const result = yield fetch("/.pomerium/webauthn/begin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      const response = yield result.json();
      const credential = yield response.type === "get" ? navigator.credentials.get({ publicKey: response.options }) : navigator.credentials.create({ publicKey: response.options });
      yield authenticate(credential);
    });
  }
  function authenticate(credential) {
    return __async(this, null, function* () {
      const result = yield fetch("/.pomerium/webauthn/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          credential
        })
      });
      const response = yield result.json();
      location.href = response.redirect_url;
    });
  }
  begin();
})();
