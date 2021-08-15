var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res2) => function __init() {
  return fn && (res2 = (0, fn[Object.keys(fn)[0]])(fn = 0)), res2;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location3 = headers.get("Location");
        const locationURL = location3 === null ? null : new URL(location3, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, Readable, wm, Blob2, fetchBlob, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob2 = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob2) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob2([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob2.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob2;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error3;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new fetchBlob([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-netlify/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-netlify/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports2) {
    init_shims();
    "use strict";
    exports2.parse = parse;
    exports2.serialize = serialize;
    var decode = decodeURIComponent;
    var encode = encodeURIComponent;
    var pairSplitRegExp = /; */;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var pairs = str.split(pairSplitRegExp);
      var dec = opt.decode || decode;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var eq_idx = pair.indexOf("=");
        if (eq_idx < 0) {
          continue;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] == '"') {
          val = val.slice(1, -1);
        }
        if (obj[key] == void 0) {
          obj[key] = tryDecode(val, dec);
        }
      }
      return obj;
    }
    function serialize(name, val, options2) {
      var opt = options2 || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (opt.maxAge != null) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== "function") {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + opt.expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

// node_modules/marked/src/defaults.js
var require_defaults = __commonJS({
  "node_modules/marked/src/defaults.js"(exports2, module2) {
    init_shims();
    function getDefaults() {
      return {
        baseUrl: null,
        breaks: false,
        extensions: null,
        gfm: true,
        headerIds: true,
        headerPrefix: "",
        highlight: null,
        langPrefix: "language-",
        mangle: true,
        pedantic: false,
        renderer: null,
        sanitize: false,
        sanitizer: null,
        silent: false,
        smartLists: false,
        smartypants: false,
        tokenizer: null,
        walkTokens: null,
        xhtml: false
      };
    }
    function changeDefaults(newDefaults) {
      module2.exports.defaults = newDefaults;
    }
    module2.exports = {
      defaults: getDefaults(),
      getDefaults,
      changeDefaults
    };
  }
});

// node_modules/marked/src/helpers.js
var require_helpers = __commonJS({
  "node_modules/marked/src/helpers.js"(exports2, module2) {
    init_shims();
    var escapeTest = /[&<>"']/;
    var escapeReplace = /[&<>"']/g;
    var escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
    var escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
    var escapeReplacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    var getEscapeReplacement = (ch) => escapeReplacements[ch];
    function escape3(html, encode) {
      if (encode) {
        if (escapeTest.test(html)) {
          return html.replace(escapeReplace, getEscapeReplacement);
        }
      } else {
        if (escapeTestNoEncode.test(html)) {
          return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
        }
      }
      return html;
    }
    var unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
    function unescape2(html) {
      return html.replace(unescapeTest, (_, n) => {
        n = n.toLowerCase();
        if (n === "colon")
          return ":";
        if (n.charAt(0) === "#") {
          return n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
        }
        return "";
      });
    }
    var caret = /(^|[^\[])\^/g;
    function edit(regex, opt) {
      regex = regex.source || regex;
      opt = opt || "";
      const obj = {
        replace: (name, val) => {
          val = val.source || val;
          val = val.replace(caret, "$1");
          regex = regex.replace(name, val);
          return obj;
        },
        getRegex: () => {
          return new RegExp(regex, opt);
        }
      };
      return obj;
    }
    var nonWordAndColonTest = /[^\w:]/g;
    var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;
    function cleanUrl(sanitize, base2, href) {
      if (sanitize) {
        let prot;
        try {
          prot = decodeURIComponent(unescape2(href)).replace(nonWordAndColonTest, "").toLowerCase();
        } catch (e) {
          return null;
        }
        if (prot.indexOf("javascript:") === 0 || prot.indexOf("vbscript:") === 0 || prot.indexOf("data:") === 0) {
          return null;
        }
      }
      if (base2 && !originIndependentUrl.test(href)) {
        href = resolveUrl(base2, href);
      }
      try {
        href = encodeURI(href).replace(/%25/g, "%");
      } catch (e) {
        return null;
      }
      return href;
    }
    var baseUrls = {};
    var justDomain = /^[^:]+:\/*[^/]*$/;
    var protocol = /^([^:]+:)[\s\S]*$/;
    var domain = /^([^:]+:\/*[^/]*)[\s\S]*$/;
    function resolveUrl(base2, href) {
      if (!baseUrls[" " + base2]) {
        if (justDomain.test(base2)) {
          baseUrls[" " + base2] = base2 + "/";
        } else {
          baseUrls[" " + base2] = rtrim(base2, "/", true);
        }
      }
      base2 = baseUrls[" " + base2];
      const relativeBase = base2.indexOf(":") === -1;
      if (href.substring(0, 2) === "//") {
        if (relativeBase) {
          return href;
        }
        return base2.replace(protocol, "$1") + href;
      } else if (href.charAt(0) === "/") {
        if (relativeBase) {
          return href;
        }
        return base2.replace(domain, "$1") + href;
      } else {
        return base2 + href;
      }
    }
    var noopTest = { exec: function noopTest2() {
    } };
    function merge(obj) {
      let i = 1, target, key;
      for (; i < arguments.length; i++) {
        target = arguments[i];
        for (key in target) {
          if (Object.prototype.hasOwnProperty.call(target, key)) {
            obj[key] = target[key];
          }
        }
      }
      return obj;
    }
    function splitCells(tableRow, count) {
      const row = tableRow.replace(/\|/g, (match, offset, str) => {
        let escaped3 = false, curr = offset;
        while (--curr >= 0 && str[curr] === "\\")
          escaped3 = !escaped3;
        if (escaped3) {
          return "|";
        } else {
          return " |";
        }
      }), cells = row.split(/ \|/);
      let i = 0;
      if (cells.length > count) {
        cells.splice(count);
      } else {
        while (cells.length < count)
          cells.push("");
      }
      for (; i < cells.length; i++) {
        cells[i] = cells[i].trim().replace(/\\\|/g, "|");
      }
      return cells;
    }
    function rtrim(str, c, invert) {
      const l = str.length;
      if (l === 0) {
        return "";
      }
      let suffLen = 0;
      while (suffLen < l) {
        const currChar = str.charAt(l - suffLen - 1);
        if (currChar === c && !invert) {
          suffLen++;
        } else if (currChar !== c && invert) {
          suffLen++;
        } else {
          break;
        }
      }
      return str.substr(0, l - suffLen);
    }
    function findClosingBracket(str, b) {
      if (str.indexOf(b[1]) === -1) {
        return -1;
      }
      const l = str.length;
      let level = 0, i = 0;
      for (; i < l; i++) {
        if (str[i] === "\\") {
          i++;
        } else if (str[i] === b[0]) {
          level++;
        } else if (str[i] === b[1]) {
          level--;
          if (level < 0) {
            return i;
          }
        }
      }
      return -1;
    }
    function checkSanitizeDeprecation(opt) {
      if (opt && opt.sanitize && !opt.silent) {
        console.warn("marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options");
      }
    }
    function repeatString(pattern, count) {
      if (count < 1) {
        return "";
      }
      let result = "";
      while (count > 1) {
        if (count & 1) {
          result += pattern;
        }
        count >>= 1;
        pattern += pattern;
      }
      return result + pattern;
    }
    module2.exports = {
      escape: escape3,
      unescape: unescape2,
      edit,
      cleanUrl,
      resolveUrl,
      noopTest,
      merge,
      splitCells,
      rtrim,
      findClosingBracket,
      checkSanitizeDeprecation,
      repeatString
    };
  }
});

// node_modules/marked/src/Tokenizer.js
var require_Tokenizer = __commonJS({
  "node_modules/marked/src/Tokenizer.js"(exports2, module2) {
    init_shims();
    var { defaults: defaults2 } = require_defaults();
    var {
      rtrim,
      splitCells,
      escape: escape3,
      findClosingBracket
    } = require_helpers();
    function outputLink(cap, link, raw) {
      const href = link.href;
      const title = link.title ? escape3(link.title) : null;
      const text = cap[1].replace(/\\([\[\]])/g, "$1");
      if (cap[0].charAt(0) !== "!") {
        return {
          type: "link",
          raw,
          href,
          title,
          text
        };
      } else {
        return {
          type: "image",
          raw,
          href,
          title,
          text: escape3(text)
        };
      }
    }
    function indentCodeCompensation(raw, text) {
      const matchIndentToCode = raw.match(/^(\s+)(?:```)/);
      if (matchIndentToCode === null) {
        return text;
      }
      const indentToCode = matchIndentToCode[1];
      return text.split("\n").map((node) => {
        const matchIndentInNode = node.match(/^\s+/);
        if (matchIndentInNode === null) {
          return node;
        }
        const [indentInNode] = matchIndentInNode;
        if (indentInNode.length >= indentToCode.length) {
          return node.slice(indentToCode.length);
        }
        return node;
      }).join("\n");
    }
    module2.exports = class Tokenizer {
      constructor(options2) {
        this.options = options2 || defaults2;
      }
      space(src2) {
        const cap = this.rules.block.newline.exec(src2);
        if (cap) {
          if (cap[0].length > 1) {
            return {
              type: "space",
              raw: cap[0]
            };
          }
          return { raw: "\n" };
        }
      }
      code(src2) {
        const cap = this.rules.block.code.exec(src2);
        if (cap) {
          const text = cap[0].replace(/^ {1,4}/gm, "");
          return {
            type: "code",
            raw: cap[0],
            codeBlockStyle: "indented",
            text: !this.options.pedantic ? rtrim(text, "\n") : text
          };
        }
      }
      fences(src2) {
        const cap = this.rules.block.fences.exec(src2);
        if (cap) {
          const raw = cap[0];
          const text = indentCodeCompensation(raw, cap[3] || "");
          return {
            type: "code",
            raw,
            lang: cap[2] ? cap[2].trim() : cap[2],
            text
          };
        }
      }
      heading(src2) {
        const cap = this.rules.block.heading.exec(src2);
        if (cap) {
          let text = cap[2].trim();
          if (/#$/.test(text)) {
            const trimmed = rtrim(text, "#");
            if (this.options.pedantic) {
              text = trimmed.trim();
            } else if (!trimmed || / $/.test(trimmed)) {
              text = trimmed.trim();
            }
          }
          return {
            type: "heading",
            raw: cap[0],
            depth: cap[1].length,
            text
          };
        }
      }
      nptable(src2) {
        const cap = this.rules.block.nptable.exec(src2);
        if (cap) {
          const item = {
            type: "table",
            header: splitCells(cap[1].replace(/^ *| *\| *$/g, "")),
            align: cap[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
            cells: cap[3] ? cap[3].replace(/\n$/, "").split("\n") : [],
            raw: cap[0]
          };
          if (item.header.length === item.align.length) {
            let l = item.align.length;
            let i;
            for (i = 0; i < l; i++) {
              if (/^ *-+: *$/.test(item.align[i])) {
                item.align[i] = "right";
              } else if (/^ *:-+: *$/.test(item.align[i])) {
                item.align[i] = "center";
              } else if (/^ *:-+ *$/.test(item.align[i])) {
                item.align[i] = "left";
              } else {
                item.align[i] = null;
              }
            }
            l = item.cells.length;
            for (i = 0; i < l; i++) {
              item.cells[i] = splitCells(item.cells[i], item.header.length);
            }
            return item;
          }
        }
      }
      hr(src2) {
        const cap = this.rules.block.hr.exec(src2);
        if (cap) {
          return {
            type: "hr",
            raw: cap[0]
          };
        }
      }
      blockquote(src2) {
        const cap = this.rules.block.blockquote.exec(src2);
        if (cap) {
          const text = cap[0].replace(/^ *> ?/gm, "");
          return {
            type: "blockquote",
            raw: cap[0],
            text
          };
        }
      }
      list(src2) {
        const cap = this.rules.block.list.exec(src2);
        if (cap) {
          let raw = cap[0];
          const bull = cap[2];
          const isordered = bull.length > 1;
          const list = {
            type: "list",
            raw,
            ordered: isordered,
            start: isordered ? +bull.slice(0, -1) : "",
            loose: false,
            items: []
          };
          const itemMatch = cap[0].match(this.rules.block.item);
          let next = false, item, space, bcurr, bnext, addBack, loose, istask, ischecked, endMatch;
          let l = itemMatch.length;
          bcurr = this.rules.block.listItemStart.exec(itemMatch[0]);
          for (let i = 0; i < l; i++) {
            item = itemMatch[i];
            raw = item;
            if (!this.options.pedantic) {
              endMatch = item.match(new RegExp("\\n\\s*\\n {0," + (bcurr[0].length - 1) + "}\\S"));
              if (endMatch) {
                addBack = item.length - endMatch.index + itemMatch.slice(i + 1).join("\n").length;
                list.raw = list.raw.substring(0, list.raw.length - addBack);
                item = item.substring(0, endMatch.index);
                raw = item;
                l = i + 1;
              }
            }
            if (i !== l - 1) {
              bnext = this.rules.block.listItemStart.exec(itemMatch[i + 1]);
              if (!this.options.pedantic ? bnext[1].length >= bcurr[0].length || bnext[1].length > 3 : bnext[1].length > bcurr[1].length) {
                itemMatch.splice(i, 2, itemMatch[i] + (!this.options.pedantic && bnext[1].length < bcurr[0].length && !itemMatch[i].match(/\n$/) ? "" : "\n") + itemMatch[i + 1]);
                i--;
                l--;
                continue;
              } else if (!this.options.pedantic || this.options.smartLists ? bnext[2][bnext[2].length - 1] !== bull[bull.length - 1] : isordered === (bnext[2].length === 1)) {
                addBack = itemMatch.slice(i + 1).join("\n").length;
                list.raw = list.raw.substring(0, list.raw.length - addBack);
                i = l - 1;
              }
              bcurr = bnext;
            }
            space = item.length;
            item = item.replace(/^ *([*+-]|\d+[.)]) ?/, "");
            if (~item.indexOf("\n ")) {
              space -= item.length;
              item = !this.options.pedantic ? item.replace(new RegExp("^ {1," + space + "}", "gm"), "") : item.replace(/^ {1,4}/gm, "");
            }
            item = rtrim(item, "\n");
            if (i !== l - 1) {
              raw = raw + "\n";
            }
            loose = next || /\n\n(?!\s*$)/.test(raw);
            if (i !== l - 1) {
              next = raw.slice(-2) === "\n\n";
              if (!loose)
                loose = next;
            }
            if (loose) {
              list.loose = true;
            }
            if (this.options.gfm) {
              istask = /^\[[ xX]\] /.test(item);
              ischecked = void 0;
              if (istask) {
                ischecked = item[1] !== " ";
                item = item.replace(/^\[[ xX]\] +/, "");
              }
            }
            list.items.push({
              type: "list_item",
              raw,
              task: istask,
              checked: ischecked,
              loose,
              text: item
            });
          }
          return list;
        }
      }
      html(src2) {
        const cap = this.rules.block.html.exec(src2);
        if (cap) {
          return {
            type: this.options.sanitize ? "paragraph" : "html",
            raw: cap[0],
            pre: !this.options.sanitizer && (cap[1] === "pre" || cap[1] === "script" || cap[1] === "style"),
            text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape3(cap[0]) : cap[0]
          };
        }
      }
      def(src2) {
        const cap = this.rules.block.def.exec(src2);
        if (cap) {
          if (cap[3])
            cap[3] = cap[3].substring(1, cap[3].length - 1);
          const tag = cap[1].toLowerCase().replace(/\s+/g, " ");
          return {
            type: "def",
            tag,
            raw: cap[0],
            href: cap[2],
            title: cap[3]
          };
        }
      }
      table(src2) {
        const cap = this.rules.block.table.exec(src2);
        if (cap) {
          const item = {
            type: "table",
            header: splitCells(cap[1].replace(/^ *| *\| *$/g, "")),
            align: cap[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
            cells: cap[3] ? cap[3].replace(/\n$/, "").split("\n") : []
          };
          if (item.header.length === item.align.length) {
            item.raw = cap[0];
            let l = item.align.length;
            let i;
            for (i = 0; i < l; i++) {
              if (/^ *-+: *$/.test(item.align[i])) {
                item.align[i] = "right";
              } else if (/^ *:-+: *$/.test(item.align[i])) {
                item.align[i] = "center";
              } else if (/^ *:-+ *$/.test(item.align[i])) {
                item.align[i] = "left";
              } else {
                item.align[i] = null;
              }
            }
            l = item.cells.length;
            for (i = 0; i < l; i++) {
              item.cells[i] = splitCells(item.cells[i].replace(/^ *\| *| *\| *$/g, ""), item.header.length);
            }
            return item;
          }
        }
      }
      lheading(src2) {
        const cap = this.rules.block.lheading.exec(src2);
        if (cap) {
          return {
            type: "heading",
            raw: cap[0],
            depth: cap[2].charAt(0) === "=" ? 1 : 2,
            text: cap[1]
          };
        }
      }
      paragraph(src2) {
        const cap = this.rules.block.paragraph.exec(src2);
        if (cap) {
          return {
            type: "paragraph",
            raw: cap[0],
            text: cap[1].charAt(cap[1].length - 1) === "\n" ? cap[1].slice(0, -1) : cap[1]
          };
        }
      }
      text(src2) {
        const cap = this.rules.block.text.exec(src2);
        if (cap) {
          return {
            type: "text",
            raw: cap[0],
            text: cap[0]
          };
        }
      }
      escape(src2) {
        const cap = this.rules.inline.escape.exec(src2);
        if (cap) {
          return {
            type: "escape",
            raw: cap[0],
            text: escape3(cap[1])
          };
        }
      }
      tag(src2, inLink, inRawBlock) {
        const cap = this.rules.inline.tag.exec(src2);
        if (cap) {
          if (!inLink && /^<a /i.test(cap[0])) {
            inLink = true;
          } else if (inLink && /^<\/a>/i.test(cap[0])) {
            inLink = false;
          }
          if (!inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
            inRawBlock = true;
          } else if (inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
            inRawBlock = false;
          }
          return {
            type: this.options.sanitize ? "text" : "html",
            raw: cap[0],
            inLink,
            inRawBlock,
            text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape3(cap[0]) : cap[0]
          };
        }
      }
      link(src2) {
        const cap = this.rules.inline.link.exec(src2);
        if (cap) {
          const trimmedUrl = cap[2].trim();
          if (!this.options.pedantic && /^</.test(trimmedUrl)) {
            if (!/>$/.test(trimmedUrl)) {
              return;
            }
            const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), "\\");
            if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
              return;
            }
          } else {
            const lastParenIndex = findClosingBracket(cap[2], "()");
            if (lastParenIndex > -1) {
              const start = cap[0].indexOf("!") === 0 ? 5 : 4;
              const linkLen = start + cap[1].length + lastParenIndex;
              cap[2] = cap[2].substring(0, lastParenIndex);
              cap[0] = cap[0].substring(0, linkLen).trim();
              cap[3] = "";
            }
          }
          let href = cap[2];
          let title = "";
          if (this.options.pedantic) {
            const link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);
            if (link) {
              href = link[1];
              title = link[3];
            }
          } else {
            title = cap[3] ? cap[3].slice(1, -1) : "";
          }
          href = href.trim();
          if (/^</.test(href)) {
            if (this.options.pedantic && !/>$/.test(trimmedUrl)) {
              href = href.slice(1);
            } else {
              href = href.slice(1, -1);
            }
          }
          return outputLink(cap, {
            href: href ? href.replace(this.rules.inline._escapes, "$1") : href,
            title: title ? title.replace(this.rules.inline._escapes, "$1") : title
          }, cap[0]);
        }
      }
      reflink(src2, links) {
        let cap;
        if ((cap = this.rules.inline.reflink.exec(src2)) || (cap = this.rules.inline.nolink.exec(src2))) {
          let link = (cap[2] || cap[1]).replace(/\s+/g, " ");
          link = links[link.toLowerCase()];
          if (!link || !link.href) {
            const text = cap[0].charAt(0);
            return {
              type: "text",
              raw: text,
              text
            };
          }
          return outputLink(cap, link, cap[0]);
        }
      }
      emStrong(src2, maskedSrc, prevChar = "") {
        let match = this.rules.inline.emStrong.lDelim.exec(src2);
        if (!match)
          return;
        if (match[3] && prevChar.match(/[\p{L}\p{N}]/u))
          return;
        const nextChar = match[1] || match[2] || "";
        if (!nextChar || nextChar && (prevChar === "" || this.rules.inline.punctuation.exec(prevChar))) {
          const lLength = match[0].length - 1;
          let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;
          const endReg = match[0][0] === "*" ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
          endReg.lastIndex = 0;
          maskedSrc = maskedSrc.slice(-1 * src2.length + lLength);
          while ((match = endReg.exec(maskedSrc)) != null) {
            rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
            if (!rDelim)
              continue;
            rLength = rDelim.length;
            if (match[3] || match[4]) {
              delimTotal += rLength;
              continue;
            } else if (match[5] || match[6]) {
              if (lLength % 3 && !((lLength + rLength) % 3)) {
                midDelimTotal += rLength;
                continue;
              }
            }
            delimTotal -= rLength;
            if (delimTotal > 0)
              continue;
            rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
            if (Math.min(lLength, rLength) % 2) {
              return {
                type: "em",
                raw: src2.slice(0, lLength + match.index + rLength + 1),
                text: src2.slice(1, lLength + match.index + rLength)
              };
            }
            return {
              type: "strong",
              raw: src2.slice(0, lLength + match.index + rLength + 1),
              text: src2.slice(2, lLength + match.index + rLength - 1)
            };
          }
        }
      }
      codespan(src2) {
        const cap = this.rules.inline.code.exec(src2);
        if (cap) {
          let text = cap[2].replace(/\n/g, " ");
          const hasNonSpaceChars = /[^ ]/.test(text);
          const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
          if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
            text = text.substring(1, text.length - 1);
          }
          text = escape3(text, true);
          return {
            type: "codespan",
            raw: cap[0],
            text
          };
        }
      }
      br(src2) {
        const cap = this.rules.inline.br.exec(src2);
        if (cap) {
          return {
            type: "br",
            raw: cap[0]
          };
        }
      }
      del(src2) {
        const cap = this.rules.inline.del.exec(src2);
        if (cap) {
          return {
            type: "del",
            raw: cap[0],
            text: cap[2]
          };
        }
      }
      autolink(src2, mangle) {
        const cap = this.rules.inline.autolink.exec(src2);
        if (cap) {
          let text, href;
          if (cap[2] === "@") {
            text = escape3(this.options.mangle ? mangle(cap[1]) : cap[1]);
            href = "mailto:" + text;
          } else {
            text = escape3(cap[1]);
            href = text;
          }
          return {
            type: "link",
            raw: cap[0],
            text,
            href,
            tokens: [
              {
                type: "text",
                raw: text,
                text
              }
            ]
          };
        }
      }
      url(src2, mangle) {
        let cap;
        if (cap = this.rules.inline.url.exec(src2)) {
          let text, href;
          if (cap[2] === "@") {
            text = escape3(this.options.mangle ? mangle(cap[0]) : cap[0]);
            href = "mailto:" + text;
          } else {
            let prevCapZero;
            do {
              prevCapZero = cap[0];
              cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
            } while (prevCapZero !== cap[0]);
            text = escape3(cap[0]);
            if (cap[1] === "www.") {
              href = "http://" + text;
            } else {
              href = text;
            }
          }
          return {
            type: "link",
            raw: cap[0],
            text,
            href,
            tokens: [
              {
                type: "text",
                raw: text,
                text
              }
            ]
          };
        }
      }
      inlineText(src2, inRawBlock, smartypants) {
        const cap = this.rules.inline.text.exec(src2);
        if (cap) {
          let text;
          if (inRawBlock) {
            text = this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape3(cap[0]) : cap[0];
          } else {
            text = escape3(this.options.smartypants ? smartypants(cap[0]) : cap[0]);
          }
          return {
            type: "text",
            raw: cap[0],
            text
          };
        }
      }
    };
  }
});

// node_modules/marked/src/rules.js
var require_rules = __commonJS({
  "node_modules/marked/src/rules.js"(exports2, module2) {
    init_shims();
    var {
      noopTest,
      edit,
      merge
    } = require_helpers();
    var block = {
      newline: /^(?: *(?:\n|$))+/,
      code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
      fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/,
      hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
      heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
      blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
      list: /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?! {0,3}bull )\n*|\s*$)/,
      html: "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))",
      def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
      nptable: noopTest,
      table: noopTest,
      lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
      _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html| +\n)[^\n]+)*)/,
      text: /^[^\n]+/
    };
    block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
    block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
    block.def = edit(block.def).replace("label", block._label).replace("title", block._title).getRegex();
    block.bullet = /(?:[*+-]|\d{1,9}[.)])/;
    block.item = /^( *)(bull) ?[^\n]*(?:\n(?! *bull ?)[^\n]*)*/;
    block.item = edit(block.item, "gm").replace(/bull/g, block.bullet).getRegex();
    block.listItemStart = edit(/^( *)(bull) */).replace("bull", block.bullet).getRegex();
    block.list = edit(block.list).replace(/bull/g, block.bullet).replace("hr", "\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))").replace("def", "\\n+(?=" + block.def.source + ")").getRegex();
    block._tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
    block._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
    block.html = edit(block.html, "i").replace("comment", block._comment).replace("tag", block._tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
    block.paragraph = edit(block._paragraph).replace("hr", block.hr).replace("heading", " {0,3}#{1,6} ").replace("|lheading", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", block._tag).getRegex();
    block.blockquote = edit(block.blockquote).replace("paragraph", block.paragraph).getRegex();
    block.normal = merge({}, block);
    block.gfm = merge({}, block.normal, {
      nptable: "^ *([^|\\n ].*\\|.*)\\n {0,3}([-:]+ *\\|[-| :]*)(?:\\n((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)",
      table: "^ *\\|(.+)\\n {0,3}\\|?( *[-:]+[-| :]*)(?:\\n *((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
    });
    block.gfm.nptable = edit(block.gfm.nptable).replace("hr", block.hr).replace("heading", " {0,3}#{1,6} ").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", block._tag).getRegex();
    block.gfm.table = edit(block.gfm.table).replace("hr", block.hr).replace("heading", " {0,3}#{1,6} ").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", block._tag).getRegex();
    block.pedantic = merge({}, block.normal, {
      html: edit(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", block._comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
      def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
      heading: /^(#{1,6})(.*)(?:\n+|$)/,
      fences: noopTest,
      paragraph: edit(block.normal._paragraph).replace("hr", block.hr).replace("heading", " *#{1,6} *[^\n]").replace("lheading", block.lheading).replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").getRegex()
    });
    var inline = {
      escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
      autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
      url: noopTest,
      tag: "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",
      link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
      reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
      nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
      reflinkSearch: "reflink|nolink(?!\\()",
      emStrong: {
        lDelim: /^(?:\*+(?:([punct_])|[^\s*]))|^_+(?:([punct*])|([^\s_]))/,
        rDelimAst: /\_\_[^_*]*?\*[^_*]*?\_\_|[punct_](\*+)(?=[\s]|$)|[^punct*_\s](\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|[^punct*_\s](\*+)(?=[^punct*_\s])/,
        rDelimUnd: /\*\*[^_*]*?\_[^_*]*?\*\*|[punct*](\_+)(?=[\s]|$)|[^punct*_\s](\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/
      },
      code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
      br: /^( {2,}|\\)\n(?!\s*$)/,
      del: noopTest,
      text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
      punctuation: /^([\spunctuation])/
    };
    inline._punctuation = "!\"#$%&'()+\\-.,/:;<=>?@\\[\\]`^{|}~";
    inline.punctuation = edit(inline.punctuation).replace(/punctuation/g, inline._punctuation).getRegex();
    inline.blockSkip = /\[[^\]]*?\]\([^\)]*?\)|`[^`]*?`|<[^>]*?>/g;
    inline.escapedEmSt = /\\\*|\\_/g;
    inline._comment = edit(block._comment).replace("(?:-->|$)", "-->").getRegex();
    inline.emStrong.lDelim = edit(inline.emStrong.lDelim).replace(/punct/g, inline._punctuation).getRegex();
    inline.emStrong.rDelimAst = edit(inline.emStrong.rDelimAst, "g").replace(/punct/g, inline._punctuation).getRegex();
    inline.emStrong.rDelimUnd = edit(inline.emStrong.rDelimUnd, "g").replace(/punct/g, inline._punctuation).getRegex();
    inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
    inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
    inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
    inline.autolink = edit(inline.autolink).replace("scheme", inline._scheme).replace("email", inline._email).getRegex();
    inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
    inline.tag = edit(inline.tag).replace("comment", inline._comment).replace("attribute", inline._attribute).getRegex();
    inline._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
    inline._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
    inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
    inline.link = edit(inline.link).replace("label", inline._label).replace("href", inline._href).replace("title", inline._title).getRegex();
    inline.reflink = edit(inline.reflink).replace("label", inline._label).getRegex();
    inline.reflinkSearch = edit(inline.reflinkSearch, "g").replace("reflink", inline.reflink).replace("nolink", inline.nolink).getRegex();
    inline.normal = merge({}, inline);
    inline.pedantic = merge({}, inline.normal, {
      strong: {
        start: /^__|\*\*/,
        middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
        endAst: /\*\*(?!\*)/g,
        endUnd: /__(?!_)/g
      },
      em: {
        start: /^_|\*/,
        middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
        endAst: /\*(?!\*)/g,
        endUnd: /_(?!_)/g
      },
      link: edit(/^!?\[(label)\]\((.*?)\)/).replace("label", inline._label).getRegex(),
      reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", inline._label).getRegex()
    });
    inline.gfm = merge({}, inline.normal, {
      escape: edit(inline.escape).replace("])", "~|])").getRegex(),
      _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
      url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
      _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
      del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
      text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
    });
    inline.gfm.url = edit(inline.gfm.url, "i").replace("email", inline.gfm._extended_email).getRegex();
    inline.breaks = merge({}, inline.gfm, {
      br: edit(inline.br).replace("{2,}", "*").getRegex(),
      text: edit(inline.gfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
    });
    module2.exports = {
      block,
      inline
    };
  }
});

// node_modules/marked/src/Lexer.js
var require_Lexer = __commonJS({
  "node_modules/marked/src/Lexer.js"(exports2, module2) {
    init_shims();
    var Tokenizer = require_Tokenizer();
    var { defaults: defaults2 } = require_defaults();
    var { block, inline } = require_rules();
    var { repeatString } = require_helpers();
    function smartypants(text) {
      return text.replace(/---/g, "\u2014").replace(/--/g, "\u2013").replace(/(^|[-\u2014/(\[{"\s])'/g, "$1\u2018").replace(/'/g, "\u2019").replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1\u201C").replace(/"/g, "\u201D").replace(/\.{3}/g, "\u2026");
    }
    function mangle(text) {
      let out = "", i, ch;
      const l = text.length;
      for (i = 0; i < l; i++) {
        ch = text.charCodeAt(i);
        if (Math.random() > 0.5) {
          ch = "x" + ch.toString(16);
        }
        out += "&#" + ch + ";";
      }
      return out;
    }
    module2.exports = class Lexer {
      constructor(options2) {
        this.tokens = [];
        this.tokens.links = Object.create(null);
        this.options = options2 || defaults2;
        this.options.tokenizer = this.options.tokenizer || new Tokenizer();
        this.tokenizer = this.options.tokenizer;
        this.tokenizer.options = this.options;
        const rules = {
          block: block.normal,
          inline: inline.normal
        };
        if (this.options.pedantic) {
          rules.block = block.pedantic;
          rules.inline = inline.pedantic;
        } else if (this.options.gfm) {
          rules.block = block.gfm;
          if (this.options.breaks) {
            rules.inline = inline.breaks;
          } else {
            rules.inline = inline.gfm;
          }
        }
        this.tokenizer.rules = rules;
      }
      static get rules() {
        return {
          block,
          inline
        };
      }
      static lex(src2, options2) {
        const lexer = new Lexer(options2);
        return lexer.lex(src2);
      }
      static lexInline(src2, options2) {
        const lexer = new Lexer(options2);
        return lexer.inlineTokens(src2);
      }
      lex(src2) {
        src2 = src2.replace(/\r\n|\r/g, "\n").replace(/\t/g, "    ");
        this.blockTokens(src2, this.tokens, true);
        this.inline(this.tokens);
        return this.tokens;
      }
      blockTokens(src2, tokens = [], top = true) {
        if (this.options.pedantic) {
          src2 = src2.replace(/^ +$/gm, "");
        }
        let token, i, l, lastToken, cutSrc, lastParagraphClipped;
        while (src2) {
          if (this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((extTokenizer) => {
            if (token = extTokenizer.call(this, src2, tokens)) {
              src2 = src2.substring(token.raw.length);
              tokens.push(token);
              return true;
            }
            return false;
          })) {
            continue;
          }
          if (token = this.tokenizer.space(src2)) {
            src2 = src2.substring(token.raw.length);
            if (token.type) {
              tokens.push(token);
            }
            continue;
          }
          if (token = this.tokenizer.code(src2)) {
            src2 = src2.substring(token.raw.length);
            lastToken = tokens[tokens.length - 1];
            if (lastToken && lastToken.type === "paragraph") {
              lastToken.raw += "\n" + token.raw;
              lastToken.text += "\n" + token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }
          if (token = this.tokenizer.fences(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.heading(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.nptable(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.hr(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.blockquote(src2)) {
            src2 = src2.substring(token.raw.length);
            token.tokens = this.blockTokens(token.text, [], top);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.list(src2)) {
            src2 = src2.substring(token.raw.length);
            l = token.items.length;
            for (i = 0; i < l; i++) {
              token.items[i].tokens = this.blockTokens(token.items[i].text, [], false);
            }
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.html(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (top && (token = this.tokenizer.def(src2))) {
            src2 = src2.substring(token.raw.length);
            if (!this.tokens.links[token.tag]) {
              this.tokens.links[token.tag] = {
                href: token.href,
                title: token.title
              };
            }
            continue;
          }
          if (token = this.tokenizer.table(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.lheading(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          cutSrc = src2;
          if (this.options.extensions && this.options.extensions.startBlock) {
            let startIndex = Infinity;
            const tempSrc = src2.slice(1);
            let tempStart;
            this.options.extensions.startBlock.forEach(function(getStartIndex) {
              tempStart = getStartIndex.call(this, tempSrc);
              if (typeof tempStart === "number" && tempStart >= 0) {
                startIndex = Math.min(startIndex, tempStart);
              }
            });
            if (startIndex < Infinity && startIndex >= 0) {
              cutSrc = src2.substring(0, startIndex + 1);
            }
          }
          if (top && (token = this.tokenizer.paragraph(cutSrc))) {
            lastToken = tokens[tokens.length - 1];
            if (lastParagraphClipped && lastToken.type === "paragraph") {
              lastToken.raw += "\n" + token.raw;
              lastToken.text += "\n" + token.text;
            } else {
              tokens.push(token);
            }
            lastParagraphClipped = cutSrc.length !== src2.length;
            src2 = src2.substring(token.raw.length);
            continue;
          }
          if (token = this.tokenizer.text(src2)) {
            src2 = src2.substring(token.raw.length);
            lastToken = tokens[tokens.length - 1];
            if (lastToken && lastToken.type === "text") {
              lastToken.raw += "\n" + token.raw;
              lastToken.text += "\n" + token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }
          if (src2) {
            const errMsg = "Infinite loop on byte: " + src2.charCodeAt(0);
            if (this.options.silent) {
              console.error(errMsg);
              break;
            } else {
              throw new Error(errMsg);
            }
          }
        }
        return tokens;
      }
      inline(tokens) {
        let i, j, k, l2, row, token;
        const l = tokens.length;
        for (i = 0; i < l; i++) {
          token = tokens[i];
          switch (token.type) {
            case "paragraph":
            case "text":
            case "heading": {
              token.tokens = [];
              this.inlineTokens(token.text, token.tokens);
              break;
            }
            case "table": {
              token.tokens = {
                header: [],
                cells: []
              };
              l2 = token.header.length;
              for (j = 0; j < l2; j++) {
                token.tokens.header[j] = [];
                this.inlineTokens(token.header[j], token.tokens.header[j]);
              }
              l2 = token.cells.length;
              for (j = 0; j < l2; j++) {
                row = token.cells[j];
                token.tokens.cells[j] = [];
                for (k = 0; k < row.length; k++) {
                  token.tokens.cells[j][k] = [];
                  this.inlineTokens(row[k], token.tokens.cells[j][k]);
                }
              }
              break;
            }
            case "blockquote": {
              this.inline(token.tokens);
              break;
            }
            case "list": {
              l2 = token.items.length;
              for (j = 0; j < l2; j++) {
                this.inline(token.items[j].tokens);
              }
              break;
            }
            default: {
            }
          }
        }
        return tokens;
      }
      inlineTokens(src2, tokens = [], inLink = false, inRawBlock = false) {
        let token, lastToken, cutSrc;
        let maskedSrc = src2;
        let match;
        let keepPrevChar, prevChar;
        if (this.tokens.links) {
          const links = Object.keys(this.tokens.links);
          if (links.length > 0) {
            while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
              if (links.includes(match[0].slice(match[0].lastIndexOf("[") + 1, -1))) {
                maskedSrc = maskedSrc.slice(0, match.index) + "[" + repeatString("a", match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
              }
            }
          }
        }
        while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
          maskedSrc = maskedSrc.slice(0, match.index) + "[" + repeatString("a", match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
        }
        while ((match = this.tokenizer.rules.inline.escapedEmSt.exec(maskedSrc)) != null) {
          maskedSrc = maskedSrc.slice(0, match.index) + "++" + maskedSrc.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
        }
        while (src2) {
          if (!keepPrevChar) {
            prevChar = "";
          }
          keepPrevChar = false;
          if (this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((extTokenizer) => {
            if (token = extTokenizer.call(this, src2, tokens)) {
              src2 = src2.substring(token.raw.length);
              tokens.push(token);
              return true;
            }
            return false;
          })) {
            continue;
          }
          if (token = this.tokenizer.escape(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.tag(src2, inLink, inRawBlock)) {
            src2 = src2.substring(token.raw.length);
            inLink = token.inLink;
            inRawBlock = token.inRawBlock;
            lastToken = tokens[tokens.length - 1];
            if (lastToken && token.type === "text" && lastToken.type === "text") {
              lastToken.raw += token.raw;
              lastToken.text += token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }
          if (token = this.tokenizer.link(src2)) {
            src2 = src2.substring(token.raw.length);
            if (token.type === "link") {
              token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
            }
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.reflink(src2, this.tokens.links)) {
            src2 = src2.substring(token.raw.length);
            lastToken = tokens[tokens.length - 1];
            if (token.type === "link") {
              token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
              tokens.push(token);
            } else if (lastToken && token.type === "text" && lastToken.type === "text") {
              lastToken.raw += token.raw;
              lastToken.text += token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }
          if (token = this.tokenizer.emStrong(src2, maskedSrc, prevChar)) {
            src2 = src2.substring(token.raw.length);
            token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.codespan(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.br(src2)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.del(src2)) {
            src2 = src2.substring(token.raw.length);
            token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
            tokens.push(token);
            continue;
          }
          if (token = this.tokenizer.autolink(src2, mangle)) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          if (!inLink && (token = this.tokenizer.url(src2, mangle))) {
            src2 = src2.substring(token.raw.length);
            tokens.push(token);
            continue;
          }
          cutSrc = src2;
          if (this.options.extensions && this.options.extensions.startInline) {
            let startIndex = Infinity;
            const tempSrc = src2.slice(1);
            let tempStart;
            this.options.extensions.startInline.forEach(function(getStartIndex) {
              tempStart = getStartIndex.call(this, tempSrc);
              if (typeof tempStart === "number" && tempStart >= 0) {
                startIndex = Math.min(startIndex, tempStart);
              }
            });
            if (startIndex < Infinity && startIndex >= 0) {
              cutSrc = src2.substring(0, startIndex + 1);
            }
          }
          if (token = this.tokenizer.inlineText(cutSrc, inRawBlock, smartypants)) {
            src2 = src2.substring(token.raw.length);
            if (token.raw.slice(-1) !== "_") {
              prevChar = token.raw.slice(-1);
            }
            keepPrevChar = true;
            lastToken = tokens[tokens.length - 1];
            if (lastToken && lastToken.type === "text") {
              lastToken.raw += token.raw;
              lastToken.text += token.text;
            } else {
              tokens.push(token);
            }
            continue;
          }
          if (src2) {
            const errMsg = "Infinite loop on byte: " + src2.charCodeAt(0);
            if (this.options.silent) {
              console.error(errMsg);
              break;
            } else {
              throw new Error(errMsg);
            }
          }
        }
        return tokens;
      }
    };
  }
});

// node_modules/marked/src/Renderer.js
var require_Renderer = __commonJS({
  "node_modules/marked/src/Renderer.js"(exports2, module2) {
    init_shims();
    var { defaults: defaults2 } = require_defaults();
    var {
      cleanUrl,
      escape: escape3
    } = require_helpers();
    module2.exports = class Renderer {
      constructor(options2) {
        this.options = options2 || defaults2;
      }
      code(code, infostring, escaped3) {
        const lang = (infostring || "").match(/\S*/)[0];
        if (this.options.highlight) {
          const out = this.options.highlight(code, lang);
          if (out != null && out !== code) {
            escaped3 = true;
            code = out;
          }
        }
        code = code.replace(/\n$/, "") + "\n";
        if (!lang) {
          return "<pre><code>" + (escaped3 ? code : escape3(code, true)) + "</code></pre>\n";
        }
        return '<pre><code class="' + this.options.langPrefix + escape3(lang, true) + '">' + (escaped3 ? code : escape3(code, true)) + "</code></pre>\n";
      }
      blockquote(quote) {
        return "<blockquote>\n" + quote + "</blockquote>\n";
      }
      html(html) {
        return html;
      }
      heading(text, level, raw, slugger) {
        if (this.options.headerIds) {
          return "<h" + level + ' id="' + this.options.headerPrefix + slugger.slug(raw) + '">' + text + "</h" + level + ">\n";
        }
        return "<h" + level + ">" + text + "</h" + level + ">\n";
      }
      hr() {
        return this.options.xhtml ? "<hr/>\n" : "<hr>\n";
      }
      list(body, ordered, start) {
        const type = ordered ? "ol" : "ul", startatt = ordered && start !== 1 ? ' start="' + start + '"' : "";
        return "<" + type + startatt + ">\n" + body + "</" + type + ">\n";
      }
      listitem(text) {
        return "<li>" + text + "</li>\n";
      }
      checkbox(checked) {
        return "<input " + (checked ? 'checked="" ' : "") + 'disabled="" type="checkbox"' + (this.options.xhtml ? " /" : "") + "> ";
      }
      paragraph(text) {
        return "<p>" + text + "</p>\n";
      }
      table(header, body) {
        if (body)
          body = "<tbody>" + body + "</tbody>";
        return "<table>\n<thead>\n" + header + "</thead>\n" + body + "</table>\n";
      }
      tablerow(content) {
        return "<tr>\n" + content + "</tr>\n";
      }
      tablecell(content, flags) {
        const type = flags.header ? "th" : "td";
        const tag = flags.align ? "<" + type + ' align="' + flags.align + '">' : "<" + type + ">";
        return tag + content + "</" + type + ">\n";
      }
      strong(text) {
        return "<strong>" + text + "</strong>";
      }
      em(text) {
        return "<em>" + text + "</em>";
      }
      codespan(text) {
        return "<code>" + text + "</code>";
      }
      br() {
        return this.options.xhtml ? "<br/>" : "<br>";
      }
      del(text) {
        return "<del>" + text + "</del>";
      }
      link(href, title, text) {
        href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
        if (href === null) {
          return text;
        }
        let out = '<a href="' + escape3(href) + '"';
        if (title) {
          out += ' title="' + title + '"';
        }
        out += ">" + text + "</a>";
        return out;
      }
      image(href, title, text) {
        href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
        if (href === null) {
          return text;
        }
        let out = '<img src="' + href + '" alt="' + text + '"';
        if (title) {
          out += ' title="' + title + '"';
        }
        out += this.options.xhtml ? "/>" : ">";
        return out;
      }
      text(text) {
        return text;
      }
    };
  }
});

// node_modules/marked/src/TextRenderer.js
var require_TextRenderer = __commonJS({
  "node_modules/marked/src/TextRenderer.js"(exports2, module2) {
    init_shims();
    module2.exports = class TextRenderer {
      strong(text) {
        return text;
      }
      em(text) {
        return text;
      }
      codespan(text) {
        return text;
      }
      del(text) {
        return text;
      }
      html(text) {
        return text;
      }
      text(text) {
        return text;
      }
      link(href, title, text) {
        return "" + text;
      }
      image(href, title, text) {
        return "" + text;
      }
      br() {
        return "";
      }
    };
  }
});

// node_modules/marked/src/Slugger.js
var require_Slugger = __commonJS({
  "node_modules/marked/src/Slugger.js"(exports2, module2) {
    init_shims();
    module2.exports = class Slugger {
      constructor() {
        this.seen = {};
      }
      serialize(value) {
        return value.toLowerCase().trim().replace(/<[!\/a-z].*?>/ig, "").replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, "").replace(/\s/g, "-");
      }
      getNextSafeSlug(originalSlug, isDryRun) {
        let slug = originalSlug;
        let occurenceAccumulator = 0;
        if (this.seen.hasOwnProperty(slug)) {
          occurenceAccumulator = this.seen[originalSlug];
          do {
            occurenceAccumulator++;
            slug = originalSlug + "-" + occurenceAccumulator;
          } while (this.seen.hasOwnProperty(slug));
        }
        if (!isDryRun) {
          this.seen[originalSlug] = occurenceAccumulator;
          this.seen[slug] = 0;
        }
        return slug;
      }
      slug(value, options2 = {}) {
        const slug = this.serialize(value);
        return this.getNextSafeSlug(slug, options2.dryrun);
      }
    };
  }
});

// node_modules/marked/src/Parser.js
var require_Parser = __commonJS({
  "node_modules/marked/src/Parser.js"(exports2, module2) {
    init_shims();
    var Renderer = require_Renderer();
    var TextRenderer = require_TextRenderer();
    var Slugger = require_Slugger();
    var { defaults: defaults2 } = require_defaults();
    var {
      unescape: unescape2
    } = require_helpers();
    module2.exports = class Parser {
      constructor(options2) {
        this.options = options2 || defaults2;
        this.options.renderer = this.options.renderer || new Renderer();
        this.renderer = this.options.renderer;
        this.renderer.options = this.options;
        this.textRenderer = new TextRenderer();
        this.slugger = new Slugger();
      }
      static parse(tokens, options2) {
        const parser = new Parser(options2);
        return parser.parse(tokens);
      }
      static parseInline(tokens, options2) {
        const parser = new Parser(options2);
        return parser.parseInline(tokens);
      }
      parse(tokens, top = true) {
        let out = "", i, j, k, l2, l3, row, cell, header, body, token, ordered, start, loose, itemBody, item, checked, task, checkbox, ret2;
        const l = tokens.length;
        for (i = 0; i < l; i++) {
          token = tokens[i];
          if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
            ret2 = this.options.extensions.renderers[token.type].call(this, token);
            if (ret2 !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(token.type)) {
              out += ret2 || "";
              continue;
            }
          }
          switch (token.type) {
            case "space": {
              continue;
            }
            case "hr": {
              out += this.renderer.hr();
              continue;
            }
            case "heading": {
              out += this.renderer.heading(this.parseInline(token.tokens), token.depth, unescape2(this.parseInline(token.tokens, this.textRenderer)), this.slugger);
              continue;
            }
            case "code": {
              out += this.renderer.code(token.text, token.lang, token.escaped);
              continue;
            }
            case "table": {
              header = "";
              cell = "";
              l2 = token.header.length;
              for (j = 0; j < l2; j++) {
                cell += this.renderer.tablecell(this.parseInline(token.tokens.header[j]), { header: true, align: token.align[j] });
              }
              header += this.renderer.tablerow(cell);
              body = "";
              l2 = token.cells.length;
              for (j = 0; j < l2; j++) {
                row = token.tokens.cells[j];
                cell = "";
                l3 = row.length;
                for (k = 0; k < l3; k++) {
                  cell += this.renderer.tablecell(this.parseInline(row[k]), { header: false, align: token.align[k] });
                }
                body += this.renderer.tablerow(cell);
              }
              out += this.renderer.table(header, body);
              continue;
            }
            case "blockquote": {
              body = this.parse(token.tokens);
              out += this.renderer.blockquote(body);
              continue;
            }
            case "list": {
              ordered = token.ordered;
              start = token.start;
              loose = token.loose;
              l2 = token.items.length;
              body = "";
              for (j = 0; j < l2; j++) {
                item = token.items[j];
                checked = item.checked;
                task = item.task;
                itemBody = "";
                if (item.task) {
                  checkbox = this.renderer.checkbox(checked);
                  if (loose) {
                    if (item.tokens.length > 0 && item.tokens[0].type === "text") {
                      item.tokens[0].text = checkbox + " " + item.tokens[0].text;
                      if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === "text") {
                        item.tokens[0].tokens[0].text = checkbox + " " + item.tokens[0].tokens[0].text;
                      }
                    } else {
                      item.tokens.unshift({
                        type: "text",
                        text: checkbox
                      });
                    }
                  } else {
                    itemBody += checkbox;
                  }
                }
                itemBody += this.parse(item.tokens, loose);
                body += this.renderer.listitem(itemBody, task, checked);
              }
              out += this.renderer.list(body, ordered, start);
              continue;
            }
            case "html": {
              out += this.renderer.html(token.text);
              continue;
            }
            case "paragraph": {
              out += this.renderer.paragraph(this.parseInline(token.tokens));
              continue;
            }
            case "text": {
              body = token.tokens ? this.parseInline(token.tokens) : token.text;
              while (i + 1 < l && tokens[i + 1].type === "text") {
                token = tokens[++i];
                body += "\n" + (token.tokens ? this.parseInline(token.tokens) : token.text);
              }
              out += top ? this.renderer.paragraph(body) : body;
              continue;
            }
            default: {
              const errMsg = 'Token with "' + token.type + '" type was not found.';
              if (this.options.silent) {
                console.error(errMsg);
                return;
              } else {
                throw new Error(errMsg);
              }
            }
          }
        }
        return out;
      }
      parseInline(tokens, renderer) {
        renderer = renderer || this.renderer;
        let out = "", i, token, ret2;
        const l = tokens.length;
        for (i = 0; i < l; i++) {
          token = tokens[i];
          if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
            ret2 = this.options.extensions.renderers[token.type].call(this, token);
            if (ret2 !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(token.type)) {
              out += ret2 || "";
              continue;
            }
          }
          switch (token.type) {
            case "escape": {
              out += renderer.text(token.text);
              break;
            }
            case "html": {
              out += renderer.html(token.text);
              break;
            }
            case "link": {
              out += renderer.link(token.href, token.title, this.parseInline(token.tokens, renderer));
              break;
            }
            case "image": {
              out += renderer.image(token.href, token.title, token.text);
              break;
            }
            case "strong": {
              out += renderer.strong(this.parseInline(token.tokens, renderer));
              break;
            }
            case "em": {
              out += renderer.em(this.parseInline(token.tokens, renderer));
              break;
            }
            case "codespan": {
              out += renderer.codespan(token.text);
              break;
            }
            case "br": {
              out += renderer.br();
              break;
            }
            case "del": {
              out += renderer.del(this.parseInline(token.tokens, renderer));
              break;
            }
            case "text": {
              out += renderer.text(token.text);
              break;
            }
            default: {
              const errMsg = 'Token with "' + token.type + '" type was not found.';
              if (this.options.silent) {
                console.error(errMsg);
                return;
              } else {
                throw new Error(errMsg);
              }
            }
          }
        }
        return out;
      }
    };
  }
});

// node_modules/marked/src/marked.js
var require_marked = __commonJS({
  "node_modules/marked/src/marked.js"(exports2, module2) {
    init_shims();
    var Lexer = require_Lexer();
    var Parser = require_Parser();
    var Tokenizer = require_Tokenizer();
    var Renderer = require_Renderer();
    var TextRenderer = require_TextRenderer();
    var Slugger = require_Slugger();
    var {
      merge,
      checkSanitizeDeprecation,
      escape: escape3
    } = require_helpers();
    var {
      getDefaults,
      changeDefaults,
      defaults: defaults2
    } = require_defaults();
    function marked2(src2, opt, callback) {
      if (typeof src2 === "undefined" || src2 === null) {
        throw new Error("marked(): input parameter is undefined or null");
      }
      if (typeof src2 !== "string") {
        throw new Error("marked(): input parameter is of type " + Object.prototype.toString.call(src2) + ", string expected");
      }
      if (typeof opt === "function") {
        callback = opt;
        opt = null;
      }
      opt = merge({}, marked2.defaults, opt || {});
      checkSanitizeDeprecation(opt);
      if (callback) {
        const highlight = opt.highlight;
        let tokens;
        try {
          tokens = Lexer.lex(src2, opt);
        } catch (e) {
          return callback(e);
        }
        const done = function(err) {
          let out;
          if (!err) {
            try {
              if (opt.walkTokens) {
                marked2.walkTokens(tokens, opt.walkTokens);
              }
              out = Parser.parse(tokens, opt);
            } catch (e) {
              err = e;
            }
          }
          opt.highlight = highlight;
          return err ? callback(err) : callback(null, out);
        };
        if (!highlight || highlight.length < 3) {
          return done();
        }
        delete opt.highlight;
        if (!tokens.length)
          return done();
        let pending = 0;
        marked2.walkTokens(tokens, function(token) {
          if (token.type === "code") {
            pending++;
            setTimeout(() => {
              highlight(token.text, token.lang, function(err, code) {
                if (err) {
                  return done(err);
                }
                if (code != null && code !== token.text) {
                  token.text = code;
                  token.escaped = true;
                }
                pending--;
                if (pending === 0) {
                  done();
                }
              });
            }, 0);
          }
        });
        if (pending === 0) {
          done();
        }
        return;
      }
      try {
        const tokens = Lexer.lex(src2, opt);
        if (opt.walkTokens) {
          marked2.walkTokens(tokens, opt.walkTokens);
        }
        return Parser.parse(tokens, opt);
      } catch (e) {
        e.message += "\nPlease report this to https://github.com/markedjs/marked.";
        if (opt.silent) {
          return "<p>An error occurred:</p><pre>" + escape3(e.message + "", true) + "</pre>";
        }
        throw e;
      }
    }
    marked2.options = marked2.setOptions = function(opt) {
      merge(marked2.defaults, opt);
      changeDefaults(marked2.defaults);
      return marked2;
    };
    marked2.getDefaults = getDefaults;
    marked2.defaults = defaults2;
    marked2.use = function(...args) {
      const opts = merge({}, ...args);
      const extensions = marked2.defaults.extensions || { renderers: {}, childTokens: {} };
      let hasExtensions;
      args.forEach((pack) => {
        if (pack.extensions) {
          hasExtensions = true;
          pack.extensions.forEach((ext) => {
            if (!ext.name) {
              throw new Error("extension name required");
            }
            if (ext.renderer) {
              const prevRenderer = extensions.renderers ? extensions.renderers[ext.name] : null;
              if (prevRenderer) {
                extensions.renderers[ext.name] = function(...args2) {
                  let ret2 = ext.renderer.apply(this, args2);
                  if (ret2 === false) {
                    ret2 = prevRenderer.apply(this, args2);
                  }
                  return ret2;
                };
              } else {
                extensions.renderers[ext.name] = ext.renderer;
              }
            }
            if (ext.tokenizer) {
              if (!ext.level || ext.level !== "block" && ext.level !== "inline") {
                throw new Error("extension level must be 'block' or 'inline'");
              }
              if (extensions[ext.level]) {
                extensions[ext.level].unshift(ext.tokenizer);
              } else {
                extensions[ext.level] = [ext.tokenizer];
              }
              if (ext.start) {
                if (ext.level === "block") {
                  if (extensions.startBlock) {
                    extensions.startBlock.push(ext.start);
                  } else {
                    extensions.startBlock = [ext.start];
                  }
                } else if (ext.level === "inline") {
                  if (extensions.startInline) {
                    extensions.startInline.push(ext.start);
                  } else {
                    extensions.startInline = [ext.start];
                  }
                }
              }
            }
            if (ext.childTokens) {
              extensions.childTokens[ext.name] = ext.childTokens;
            }
          });
        }
        if (pack.renderer) {
          const renderer = marked2.defaults.renderer || new Renderer();
          for (const prop in pack.renderer) {
            const prevRenderer = renderer[prop];
            renderer[prop] = (...args2) => {
              let ret2 = pack.renderer[prop].apply(renderer, args2);
              if (ret2 === false) {
                ret2 = prevRenderer.apply(renderer, args2);
              }
              return ret2;
            };
          }
          opts.renderer = renderer;
        }
        if (pack.tokenizer) {
          const tokenizer = marked2.defaults.tokenizer || new Tokenizer();
          for (const prop in pack.tokenizer) {
            const prevTokenizer = tokenizer[prop];
            tokenizer[prop] = (...args2) => {
              let ret2 = pack.tokenizer[prop].apply(tokenizer, args2);
              if (ret2 === false) {
                ret2 = prevTokenizer.apply(tokenizer, args2);
              }
              return ret2;
            };
          }
          opts.tokenizer = tokenizer;
        }
        if (pack.walkTokens) {
          const walkTokens = marked2.defaults.walkTokens;
          opts.walkTokens = (token) => {
            pack.walkTokens.call(this, token);
            if (walkTokens) {
              walkTokens(token);
            }
          };
        }
        if (hasExtensions) {
          opts.extensions = extensions;
        }
        marked2.setOptions(opts);
      });
    };
    marked2.walkTokens = function(tokens, callback) {
      for (const token of tokens) {
        callback(token);
        switch (token.type) {
          case "table": {
            for (const cell of token.tokens.header) {
              marked2.walkTokens(cell, callback);
            }
            for (const row of token.tokens.cells) {
              for (const cell of row) {
                marked2.walkTokens(cell, callback);
              }
            }
            break;
          }
          case "list": {
            marked2.walkTokens(token.items, callback);
            break;
          }
          default: {
            if (marked2.defaults.extensions && marked2.defaults.extensions.childTokens && marked2.defaults.extensions.childTokens[token.type]) {
              marked2.defaults.extensions.childTokens[token.type].forEach(function(childTokens) {
                marked2.walkTokens(token[childTokens], callback);
              });
            } else if (token.tokens) {
              marked2.walkTokens(token.tokens, callback);
            }
          }
        }
      }
    };
    marked2.parseInline = function(src2, opt) {
      if (typeof src2 === "undefined" || src2 === null) {
        throw new Error("marked.parseInline(): input parameter is undefined or null");
      }
      if (typeof src2 !== "string") {
        throw new Error("marked.parseInline(): input parameter is of type " + Object.prototype.toString.call(src2) + ", string expected");
      }
      opt = merge({}, marked2.defaults, opt || {});
      checkSanitizeDeprecation(opt);
      try {
        const tokens = Lexer.lexInline(src2, opt);
        if (opt.walkTokens) {
          marked2.walkTokens(tokens, opt.walkTokens);
        }
        return Parser.parseInline(tokens, opt);
      } catch (e) {
        e.message += "\nPlease report this to https://github.com/markedjs/marked.";
        if (opt.silent) {
          return "<p>An error occurred:</p><pre>" + escape3(e.message + "", true) + "</pre>";
        }
        throw e;
      }
    };
    marked2.Parser = Parser;
    marked2.parser = Parser.parse;
    marked2.Renderer = Renderer;
    marked2.TextRenderer = TextRenderer;
    marked2.Lexer = Lexer;
    marked2.lexer = Lexer.lex;
    marked2.Tokenizer = Tokenizer;
    marked2.Slugger = Slugger;
    marked2.parse = marked2;
    module2.exports = marked2;
  }
});

// node_modules/kind-of/index.js
var require_kind_of = __commonJS({
  "node_modules/kind-of/index.js"(exports2, module2) {
    init_shims();
    var toString = Object.prototype.toString;
    module2.exports = function kindOf(val) {
      if (val === void 0)
        return "undefined";
      if (val === null)
        return "null";
      var type = typeof val;
      if (type === "boolean")
        return "boolean";
      if (type === "string")
        return "string";
      if (type === "number")
        return "number";
      if (type === "symbol")
        return "symbol";
      if (type === "function") {
        return isGeneratorFn(val) ? "generatorfunction" : "function";
      }
      if (isArray(val))
        return "array";
      if (isBuffer(val))
        return "buffer";
      if (isArguments(val))
        return "arguments";
      if (isDate(val))
        return "date";
      if (isError2(val))
        return "error";
      if (isRegexp(val))
        return "regexp";
      switch (ctorName(val)) {
        case "Symbol":
          return "symbol";
        case "Promise":
          return "promise";
        case "WeakMap":
          return "weakmap";
        case "WeakSet":
          return "weakset";
        case "Map":
          return "map";
        case "Set":
          return "set";
        case "Int8Array":
          return "int8array";
        case "Uint8Array":
          return "uint8array";
        case "Uint8ClampedArray":
          return "uint8clampedarray";
        case "Int16Array":
          return "int16array";
        case "Uint16Array":
          return "uint16array";
        case "Int32Array":
          return "int32array";
        case "Uint32Array":
          return "uint32array";
        case "Float32Array":
          return "float32array";
        case "Float64Array":
          return "float64array";
      }
      if (isGeneratorObj(val)) {
        return "generator";
      }
      type = toString.call(val);
      switch (type) {
        case "[object Object]":
          return "object";
        case "[object Map Iterator]":
          return "mapiterator";
        case "[object Set Iterator]":
          return "setiterator";
        case "[object String Iterator]":
          return "stringiterator";
        case "[object Array Iterator]":
          return "arrayiterator";
      }
      return type.slice(8, -1).toLowerCase().replace(/\s/g, "");
    };
    function ctorName(val) {
      return typeof val.constructor === "function" ? val.constructor.name : null;
    }
    function isArray(val) {
      if (Array.isArray)
        return Array.isArray(val);
      return val instanceof Array;
    }
    function isError2(val) {
      return val instanceof Error || typeof val.message === "string" && val.constructor && typeof val.constructor.stackTraceLimit === "number";
    }
    function isDate(val) {
      if (val instanceof Date)
        return true;
      return typeof val.toDateString === "function" && typeof val.getDate === "function" && typeof val.setDate === "function";
    }
    function isRegexp(val) {
      if (val instanceof RegExp)
        return true;
      return typeof val.flags === "string" && typeof val.ignoreCase === "boolean" && typeof val.multiline === "boolean" && typeof val.global === "boolean";
    }
    function isGeneratorFn(name, val) {
      return ctorName(name) === "GeneratorFunction";
    }
    function isGeneratorObj(val) {
      return typeof val.throw === "function" && typeof val.return === "function" && typeof val.next === "function";
    }
    function isArguments(val) {
      try {
        if (typeof val.length === "number" && typeof val.callee === "function") {
          return true;
        }
      } catch (err) {
        if (err.message.indexOf("callee") !== -1) {
          return true;
        }
      }
      return false;
    }
    function isBuffer(val) {
      if (val.constructor && typeof val.constructor.isBuffer === "function") {
        return val.constructor.isBuffer(val);
      }
      return false;
    }
  }
});

// node_modules/is-extendable/index.js
var require_is_extendable = __commonJS({
  "node_modules/is-extendable/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function isExtendable(val) {
      return typeof val !== "undefined" && val !== null && (typeof val === "object" || typeof val === "function");
    };
  }
});

// node_modules/extend-shallow/index.js
var require_extend_shallow = __commonJS({
  "node_modules/extend-shallow/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    var isObject2 = require_is_extendable();
    module2.exports = function extend(o) {
      if (!isObject2(o)) {
        o = {};
      }
      var len = arguments.length;
      for (var i = 1; i < len; i++) {
        var obj = arguments[i];
        if (isObject2(obj)) {
          assign2(o, obj);
        }
      }
      return o;
    };
    function assign2(a, b) {
      for (var key in b) {
        if (hasOwn(b, key)) {
          a[key] = b[key];
        }
      }
    }
    function hasOwn(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }
  }
});

// node_modules/section-matter/index.js
var require_section_matter = __commonJS({
  "node_modules/section-matter/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    var typeOf = require_kind_of();
    var extend = require_extend_shallow();
    module2.exports = function(input, options2) {
      if (typeof options2 === "function") {
        options2 = { parse: options2 };
      }
      var file = toObject(input);
      var defaults2 = { section_delimiter: "---", parse: identity2 };
      var opts = extend({}, defaults2, options2);
      var delim = opts.section_delimiter;
      var lines = file.content.split(/\r?\n/);
      var sections = null;
      var section = createSection();
      var content = [];
      var stack = [];
      function initSections(val) {
        file.content = val;
        sections = [];
        content = [];
      }
      function closeSection(val) {
        if (stack.length) {
          section.key = getKey(stack[0], delim);
          section.content = val;
          opts.parse(section, sections);
          sections.push(section);
          section = createSection();
          content = [];
          stack = [];
        }
      }
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var len = stack.length;
        var ln = line.trim();
        if (isDelimiter(ln, delim)) {
          if (ln.length === 3 && i !== 0) {
            if (len === 0 || len === 2) {
              content.push(line);
              continue;
            }
            stack.push(ln);
            section.data = content.join("\n");
            content = [];
            continue;
          }
          if (sections === null) {
            initSections(content.join("\n"));
          }
          if (len === 2) {
            closeSection(content.join("\n"));
          }
          stack.push(ln);
          continue;
        }
        content.push(line);
      }
      if (sections === null) {
        initSections(content.join("\n"));
      } else {
        closeSection(content.join("\n"));
      }
      file.sections = sections;
      return file;
    };
    function isDelimiter(line, delim) {
      if (line.slice(0, delim.length) !== delim) {
        return false;
      }
      if (line.charAt(delim.length + 1) === delim.slice(-1)) {
        return false;
      }
      return true;
    }
    function toObject(input) {
      if (typeOf(input) !== "object") {
        input = { content: input };
      }
      if (typeof input.content !== "string" && !isBuffer(input.content)) {
        throw new TypeError("expected a buffer or string");
      }
      input.content = input.content.toString();
      input.sections = [];
      return input;
    }
    function getKey(val, delim) {
      return val ? val.slice(delim.length).trim() : "";
    }
    function createSection() {
      return { key: "", data: "", content: "" };
    }
    function identity2(val) {
      return val;
    }
    function isBuffer(val) {
      if (val && val.constructor && typeof val.constructor.isBuffer === "function") {
        return val.constructor.isBuffer(val);
      }
      return false;
    }
  }
});

// node_modules/js-yaml/lib/js-yaml/common.js
var require_common = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/common.js"(exports2, module2) {
    init_shims();
    "use strict";
    function isNothing(subject) {
      return typeof subject === "undefined" || subject === null;
    }
    function isObject2(subject) {
      return typeof subject === "object" && subject !== null;
    }
    function toArray(sequence) {
      if (Array.isArray(sequence))
        return sequence;
      else if (isNothing(sequence))
        return [];
      return [sequence];
    }
    function extend(target, source) {
      var index2, length, key, sourceKeys;
      if (source) {
        sourceKeys = Object.keys(source);
        for (index2 = 0, length = sourceKeys.length; index2 < length; index2 += 1) {
          key = sourceKeys[index2];
          target[key] = source[key];
        }
      }
      return target;
    }
    function repeat(string, count) {
      var result = "", cycle;
      for (cycle = 0; cycle < count; cycle += 1) {
        result += string;
      }
      return result;
    }
    function isNegativeZero(number) {
      return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
    }
    module2.exports.isNothing = isNothing;
    module2.exports.isObject = isObject2;
    module2.exports.toArray = toArray;
    module2.exports.repeat = repeat;
    module2.exports.isNegativeZero = isNegativeZero;
    module2.exports.extend = extend;
  }
});

// node_modules/js-yaml/lib/js-yaml/exception.js
var require_exception = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/exception.js"(exports2, module2) {
    init_shims();
    "use strict";
    function YAMLException(reason, mark) {
      Error.call(this);
      this.name = "YAMLException";
      this.reason = reason;
      this.mark = mark;
      this.message = (this.reason || "(unknown reason)") + (this.mark ? " " + this.mark.toString() : "");
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = new Error().stack || "";
      }
    }
    YAMLException.prototype = Object.create(Error.prototype);
    YAMLException.prototype.constructor = YAMLException;
    YAMLException.prototype.toString = function toString(compact) {
      var result = this.name + ": ";
      result += this.reason || "(unknown reason)";
      if (!compact && this.mark) {
        result += " " + this.mark.toString();
      }
      return result;
    };
    module2.exports = YAMLException;
  }
});

// node_modules/js-yaml/lib/js-yaml/mark.js
var require_mark = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/mark.js"(exports2, module2) {
    init_shims();
    "use strict";
    var common = require_common();
    function Mark(name, buffer, position, line, column) {
      this.name = name;
      this.buffer = buffer;
      this.position = position;
      this.line = line;
      this.column = column;
    }
    Mark.prototype.getSnippet = function getSnippet(indent, maxLength) {
      var head, start, tail, end, snippet;
      if (!this.buffer)
        return null;
      indent = indent || 4;
      maxLength = maxLength || 75;
      head = "";
      start = this.position;
      while (start > 0 && "\0\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(start - 1)) === -1) {
        start -= 1;
        if (this.position - start > maxLength / 2 - 1) {
          head = " ... ";
          start += 5;
          break;
        }
      }
      tail = "";
      end = this.position;
      while (end < this.buffer.length && "\0\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(end)) === -1) {
        end += 1;
        if (end - this.position > maxLength / 2 - 1) {
          tail = " ... ";
          end -= 5;
          break;
        }
      }
      snippet = this.buffer.slice(start, end);
      return common.repeat(" ", indent) + head + snippet + tail + "\n" + common.repeat(" ", indent + this.position - start + head.length) + "^";
    };
    Mark.prototype.toString = function toString(compact) {
      var snippet, where = "";
      if (this.name) {
        where += 'in "' + this.name + '" ';
      }
      where += "at line " + (this.line + 1) + ", column " + (this.column + 1);
      if (!compact) {
        snippet = this.getSnippet();
        if (snippet) {
          where += ":\n" + snippet;
        }
      }
      return where;
    };
    module2.exports = Mark;
  }
});

// node_modules/js-yaml/lib/js-yaml/type.js
var require_type = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type.js"(exports2, module2) {
    init_shims();
    "use strict";
    var YAMLException = require_exception();
    var TYPE_CONSTRUCTOR_OPTIONS = [
      "kind",
      "resolve",
      "construct",
      "instanceOf",
      "predicate",
      "represent",
      "defaultStyle",
      "styleAliases"
    ];
    var YAML_NODE_KINDS = [
      "scalar",
      "sequence",
      "mapping"
    ];
    function compileStyleAliases(map) {
      var result = {};
      if (map !== null) {
        Object.keys(map).forEach(function(style) {
          map[style].forEach(function(alias) {
            result[String(alias)] = style;
          });
        });
      }
      return result;
    }
    function Type(tag, options2) {
      options2 = options2 || {};
      Object.keys(options2).forEach(function(name) {
        if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
          throw new YAMLException('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
        }
      });
      this.tag = tag;
      this.kind = options2["kind"] || null;
      this.resolve = options2["resolve"] || function() {
        return true;
      };
      this.construct = options2["construct"] || function(data) {
        return data;
      };
      this.instanceOf = options2["instanceOf"] || null;
      this.predicate = options2["predicate"] || null;
      this.represent = options2["represent"] || null;
      this.defaultStyle = options2["defaultStyle"] || null;
      this.styleAliases = compileStyleAliases(options2["styleAliases"] || null);
      if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
        throw new YAMLException('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
      }
    }
    module2.exports = Type;
  }
});

// node_modules/js-yaml/lib/js-yaml/schema.js
var require_schema = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema.js"(exports2, module2) {
    init_shims();
    "use strict";
    var common = require_common();
    var YAMLException = require_exception();
    var Type = require_type();
    function compileList(schema, name, result) {
      var exclude2 = [];
      schema.include.forEach(function(includedSchema) {
        result = compileList(includedSchema, name, result);
      });
      schema[name].forEach(function(currentType) {
        result.forEach(function(previousType, previousIndex) {
          if (previousType.tag === currentType.tag && previousType.kind === currentType.kind) {
            exclude2.push(previousIndex);
          }
        });
        result.push(currentType);
      });
      return result.filter(function(type, index2) {
        return exclude2.indexOf(index2) === -1;
      });
    }
    function compileMap() {
      var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {}
      }, index2, length;
      function collectType(type) {
        result[type.kind][type.tag] = result["fallback"][type.tag] = type;
      }
      for (index2 = 0, length = arguments.length; index2 < length; index2 += 1) {
        arguments[index2].forEach(collectType);
      }
      return result;
    }
    function Schema(definition) {
      this.include = definition.include || [];
      this.implicit = definition.implicit || [];
      this.explicit = definition.explicit || [];
      this.implicit.forEach(function(type) {
        if (type.loadKind && type.loadKind !== "scalar") {
          throw new YAMLException("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
        }
      });
      this.compiledImplicit = compileList(this, "implicit", []);
      this.compiledExplicit = compileList(this, "explicit", []);
      this.compiledTypeMap = compileMap(this.compiledImplicit, this.compiledExplicit);
    }
    Schema.DEFAULT = null;
    Schema.create = function createSchema() {
      var schemas, types2;
      switch (arguments.length) {
        case 1:
          schemas = Schema.DEFAULT;
          types2 = arguments[0];
          break;
        case 2:
          schemas = arguments[0];
          types2 = arguments[1];
          break;
        default:
          throw new YAMLException("Wrong number of arguments for Schema.create function");
      }
      schemas = common.toArray(schemas);
      types2 = common.toArray(types2);
      if (!schemas.every(function(schema) {
        return schema instanceof Schema;
      })) {
        throw new YAMLException("Specified list of super schemas (or a single Schema object) contains a non-Schema object.");
      }
      if (!types2.every(function(type) {
        return type instanceof Type;
      })) {
        throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      return new Schema({
        include: schemas,
        explicit: types2
      });
    };
    module2.exports = Schema;
  }
});

// node_modules/js-yaml/lib/js-yaml/type/str.js
var require_str = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/str.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:str", {
      kind: "scalar",
      construct: function(data) {
        return data !== null ? data : "";
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/seq.js
var require_seq = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/seq.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:seq", {
      kind: "sequence",
      construct: function(data) {
        return data !== null ? data : [];
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/map.js
var require_map = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/map.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:map", {
      kind: "mapping",
      construct: function(data) {
        return data !== null ? data : {};
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/failsafe.js
var require_failsafe = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/failsafe.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      explicit: [
        require_str(),
        require_seq(),
        require_map()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/null.js
var require_null = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/null.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    function resolveYamlNull(data) {
      if (data === null)
        return true;
      var max = data.length;
      return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
    }
    function constructYamlNull() {
      return null;
    }
    function isNull(object) {
      return object === null;
    }
    module2.exports = new Type("tag:yaml.org,2002:null", {
      kind: "scalar",
      resolve: resolveYamlNull,
      construct: constructYamlNull,
      predicate: isNull,
      represent: {
        canonical: function() {
          return "~";
        },
        lowercase: function() {
          return "null";
        },
        uppercase: function() {
          return "NULL";
        },
        camelcase: function() {
          return "Null";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/bool.js
var require_bool = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/bool.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    function resolveYamlBoolean(data) {
      if (data === null)
        return false;
      var max = data.length;
      return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
    }
    function constructYamlBoolean(data) {
      return data === "true" || data === "True" || data === "TRUE";
    }
    function isBoolean(object) {
      return Object.prototype.toString.call(object) === "[object Boolean]";
    }
    module2.exports = new Type("tag:yaml.org,2002:bool", {
      kind: "scalar",
      resolve: resolveYamlBoolean,
      construct: constructYamlBoolean,
      predicate: isBoolean,
      represent: {
        lowercase: function(object) {
          return object ? "true" : "false";
        },
        uppercase: function(object) {
          return object ? "TRUE" : "FALSE";
        },
        camelcase: function(object) {
          return object ? "True" : "False";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/int.js
var require_int = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/int.js"(exports2, module2) {
    init_shims();
    "use strict";
    var common = require_common();
    var Type = require_type();
    function isHexCode(c) {
      return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
    }
    function isOctCode(c) {
      return 48 <= c && c <= 55;
    }
    function isDecCode(c) {
      return 48 <= c && c <= 57;
    }
    function resolveYamlInteger(data) {
      if (data === null)
        return false;
      var max = data.length, index2 = 0, hasDigits = false, ch;
      if (!max)
        return false;
      ch = data[index2];
      if (ch === "-" || ch === "+") {
        ch = data[++index2];
      }
      if (ch === "0") {
        if (index2 + 1 === max)
          return true;
        ch = data[++index2];
        if (ch === "b") {
          index2++;
          for (; index2 < max; index2++) {
            ch = data[index2];
            if (ch === "_")
              continue;
            if (ch !== "0" && ch !== "1")
              return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
        if (ch === "x") {
          index2++;
          for (; index2 < max; index2++) {
            ch = data[index2];
            if (ch === "_")
              continue;
            if (!isHexCode(data.charCodeAt(index2)))
              return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
        for (; index2 < max; index2++) {
          ch = data[index2];
          if (ch === "_")
            continue;
          if (!isOctCode(data.charCodeAt(index2)))
            return false;
          hasDigits = true;
        }
        return hasDigits && ch !== "_";
      }
      if (ch === "_")
        return false;
      for (; index2 < max; index2++) {
        ch = data[index2];
        if (ch === "_")
          continue;
        if (ch === ":")
          break;
        if (!isDecCode(data.charCodeAt(index2))) {
          return false;
        }
        hasDigits = true;
      }
      if (!hasDigits || ch === "_")
        return false;
      if (ch !== ":")
        return true;
      return /^(:[0-5]?[0-9])+$/.test(data.slice(index2));
    }
    function constructYamlInteger(data) {
      var value = data, sign = 1, ch, base2, digits = [];
      if (value.indexOf("_") !== -1) {
        value = value.replace(/_/g, "");
      }
      ch = value[0];
      if (ch === "-" || ch === "+") {
        if (ch === "-")
          sign = -1;
        value = value.slice(1);
        ch = value[0];
      }
      if (value === "0")
        return 0;
      if (ch === "0") {
        if (value[1] === "b")
          return sign * parseInt(value.slice(2), 2);
        if (value[1] === "x")
          return sign * parseInt(value, 16);
        return sign * parseInt(value, 8);
      }
      if (value.indexOf(":") !== -1) {
        value.split(":").forEach(function(v) {
          digits.unshift(parseInt(v, 10));
        });
        value = 0;
        base2 = 1;
        digits.forEach(function(d2) {
          value += d2 * base2;
          base2 *= 60;
        });
        return sign * value;
      }
      return sign * parseInt(value, 10);
    }
    function isInteger(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
    }
    module2.exports = new Type("tag:yaml.org,2002:int", {
      kind: "scalar",
      resolve: resolveYamlInteger,
      construct: constructYamlInteger,
      predicate: isInteger,
      represent: {
        binary: function(obj) {
          return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
        },
        octal: function(obj) {
          return obj >= 0 ? "0" + obj.toString(8) : "-0" + obj.toString(8).slice(1);
        },
        decimal: function(obj) {
          return obj.toString(10);
        },
        hexadecimal: function(obj) {
          return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
        }
      },
      defaultStyle: "decimal",
      styleAliases: {
        binary: [2, "bin"],
        octal: [8, "oct"],
        decimal: [10, "dec"],
        hexadecimal: [16, "hex"]
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/float.js
var require_float = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/float.js"(exports2, module2) {
    init_shims();
    "use strict";
    var common = require_common();
    var Type = require_type();
    var YAML_FLOAT_PATTERN = new RegExp("^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
    function resolveYamlFloat(data) {
      if (data === null)
        return false;
      if (!YAML_FLOAT_PATTERN.test(data) || data[data.length - 1] === "_") {
        return false;
      }
      return true;
    }
    function constructYamlFloat(data) {
      var value, sign, base2, digits;
      value = data.replace(/_/g, "").toLowerCase();
      sign = value[0] === "-" ? -1 : 1;
      digits = [];
      if ("+-".indexOf(value[0]) >= 0) {
        value = value.slice(1);
      }
      if (value === ".inf") {
        return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      } else if (value === ".nan") {
        return NaN;
      } else if (value.indexOf(":") >= 0) {
        value.split(":").forEach(function(v) {
          digits.unshift(parseFloat(v, 10));
        });
        value = 0;
        base2 = 1;
        digits.forEach(function(d2) {
          value += d2 * base2;
          base2 *= 60;
        });
        return sign * value;
      }
      return sign * parseFloat(value, 10);
    }
    var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
    function representYamlFloat(object, style) {
      var res2;
      if (isNaN(object)) {
        switch (style) {
          case "lowercase":
            return ".nan";
          case "uppercase":
            return ".NAN";
          case "camelcase":
            return ".NaN";
        }
      } else if (Number.POSITIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return ".inf";
          case "uppercase":
            return ".INF";
          case "camelcase":
            return ".Inf";
        }
      } else if (Number.NEGATIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return "-.inf";
          case "uppercase":
            return "-.INF";
          case "camelcase":
            return "-.Inf";
        }
      } else if (common.isNegativeZero(object)) {
        return "-0.0";
      }
      res2 = object.toString(10);
      return SCIENTIFIC_WITHOUT_DOT.test(res2) ? res2.replace("e", ".e") : res2;
    }
    function isFloat(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
    }
    module2.exports = new Type("tag:yaml.org,2002:float", {
      kind: "scalar",
      resolve: resolveYamlFloat,
      construct: constructYamlFloat,
      predicate: isFloat,
      represent: representYamlFloat,
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/json.js
var require_json = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/json.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      include: [
        require_failsafe()
      ],
      implicit: [
        require_null(),
        require_bool(),
        require_int(),
        require_float()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/core.js
var require_core = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/core.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      include: [
        require_json()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/timestamp.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    var YAML_DATE_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
    var YAML_TIMESTAMP_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
    function resolveYamlTimestamp(data) {
      if (data === null)
        return false;
      if (YAML_DATE_REGEXP.exec(data) !== null)
        return true;
      if (YAML_TIMESTAMP_REGEXP.exec(data) !== null)
        return true;
      return false;
    }
    function constructYamlTimestamp(data) {
      var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
      match = YAML_DATE_REGEXP.exec(data);
      if (match === null)
        match = YAML_TIMESTAMP_REGEXP.exec(data);
      if (match === null)
        throw new Error("Date resolve error");
      year = +match[1];
      month = +match[2] - 1;
      day = +match[3];
      if (!match[4]) {
        return new Date(Date.UTC(year, month, day));
      }
      hour = +match[4];
      minute = +match[5];
      second = +match[6];
      if (match[7]) {
        fraction = match[7].slice(0, 3);
        while (fraction.length < 3) {
          fraction += "0";
        }
        fraction = +fraction;
      }
      if (match[9]) {
        tz_hour = +match[10];
        tz_minute = +(match[11] || 0);
        delta = (tz_hour * 60 + tz_minute) * 6e4;
        if (match[9] === "-")
          delta = -delta;
      }
      date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
      if (delta)
        date.setTime(date.getTime() - delta);
      return date;
    }
    function representYamlTimestamp(object) {
      return object.toISOString();
    }
    module2.exports = new Type("tag:yaml.org,2002:timestamp", {
      kind: "scalar",
      resolve: resolveYamlTimestamp,
      construct: constructYamlTimestamp,
      instanceOf: Date,
      represent: representYamlTimestamp
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/merge.js
var require_merge = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/merge.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    function resolveYamlMerge(data) {
      return data === "<<" || data === null;
    }
    module2.exports = new Type("tag:yaml.org,2002:merge", {
      kind: "scalar",
      resolve: resolveYamlMerge
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/binary.js
var require_binary = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/binary.js"(exports2, module2) {
    init_shims();
    "use strict";
    var NodeBuffer;
    try {
      _require = require;
      NodeBuffer = _require("buffer").Buffer;
    } catch (__) {
    }
    var _require;
    var Type = require_type();
    var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
    function resolveYamlBinary(data) {
      if (data === null)
        return false;
      var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;
      for (idx = 0; idx < max; idx++) {
        code = map.indexOf(data.charAt(idx));
        if (code > 64)
          continue;
        if (code < 0)
          return false;
        bitlen += 6;
      }
      return bitlen % 8 === 0;
    }
    function constructYamlBinary(data) {
      var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map = BASE64_MAP, bits = 0, result = [];
      for (idx = 0; idx < max; idx++) {
        if (idx % 4 === 0 && idx) {
          result.push(bits >> 16 & 255);
          result.push(bits >> 8 & 255);
          result.push(bits & 255);
        }
        bits = bits << 6 | map.indexOf(input.charAt(idx));
      }
      tailbits = max % 4 * 6;
      if (tailbits === 0) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      } else if (tailbits === 18) {
        result.push(bits >> 10 & 255);
        result.push(bits >> 2 & 255);
      } else if (tailbits === 12) {
        result.push(bits >> 4 & 255);
      }
      if (NodeBuffer) {
        return NodeBuffer.from ? NodeBuffer.from(result) : new NodeBuffer(result);
      }
      return result;
    }
    function representYamlBinary(object) {
      var result = "", bits = 0, idx, tail, max = object.length, map = BASE64_MAP;
      for (idx = 0; idx < max; idx++) {
        if (idx % 3 === 0 && idx) {
          result += map[bits >> 18 & 63];
          result += map[bits >> 12 & 63];
          result += map[bits >> 6 & 63];
          result += map[bits & 63];
        }
        bits = (bits << 8) + object[idx];
      }
      tail = max % 3;
      if (tail === 0) {
        result += map[bits >> 18 & 63];
        result += map[bits >> 12 & 63];
        result += map[bits >> 6 & 63];
        result += map[bits & 63];
      } else if (tail === 2) {
        result += map[bits >> 10 & 63];
        result += map[bits >> 4 & 63];
        result += map[bits << 2 & 63];
        result += map[64];
      } else if (tail === 1) {
        result += map[bits >> 2 & 63];
        result += map[bits << 4 & 63];
        result += map[64];
        result += map[64];
      }
      return result;
    }
    function isBinary(object) {
      return NodeBuffer && NodeBuffer.isBuffer(object);
    }
    module2.exports = new Type("tag:yaml.org,2002:binary", {
      kind: "scalar",
      resolve: resolveYamlBinary,
      construct: constructYamlBinary,
      predicate: isBinary,
      represent: representYamlBinary
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/omap.js
var require_omap = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/omap.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var _toString = Object.prototype.toString;
    function resolveYamlOmap(data) {
      if (data === null)
        return true;
      var objectKeys = [], index2, length, pair, pairKey, pairHasKey, object = data;
      for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
        pair = object[index2];
        pairHasKey = false;
        if (_toString.call(pair) !== "[object Object]")
          return false;
        for (pairKey in pair) {
          if (_hasOwnProperty.call(pair, pairKey)) {
            if (!pairHasKey)
              pairHasKey = true;
            else
              return false;
          }
        }
        if (!pairHasKey)
          return false;
        if (objectKeys.indexOf(pairKey) === -1)
          objectKeys.push(pairKey);
        else
          return false;
      }
      return true;
    }
    function constructYamlOmap(data) {
      return data !== null ? data : [];
    }
    module2.exports = new Type("tag:yaml.org,2002:omap", {
      kind: "sequence",
      resolve: resolveYamlOmap,
      construct: constructYamlOmap
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/pairs.js
var require_pairs = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/pairs.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    var _toString = Object.prototype.toString;
    function resolveYamlPairs(data) {
      if (data === null)
        return true;
      var index2, length, pair, keys, result, object = data;
      result = new Array(object.length);
      for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
        pair = object[index2];
        if (_toString.call(pair) !== "[object Object]")
          return false;
        keys = Object.keys(pair);
        if (keys.length !== 1)
          return false;
        result[index2] = [keys[0], pair[keys[0]]];
      }
      return true;
    }
    function constructYamlPairs(data) {
      if (data === null)
        return [];
      var index2, length, pair, keys, result, object = data;
      result = new Array(object.length);
      for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
        pair = object[index2];
        keys = Object.keys(pair);
        result[index2] = [keys[0], pair[keys[0]]];
      }
      return result;
    }
    module2.exports = new Type("tag:yaml.org,2002:pairs", {
      kind: "sequence",
      resolve: resolveYamlPairs,
      construct: constructYamlPairs
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/set.js
var require_set = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/set.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    function resolveYamlSet(data) {
      if (data === null)
        return true;
      var key, object = data;
      for (key in object) {
        if (_hasOwnProperty.call(object, key)) {
          if (object[key] !== null)
            return false;
        }
      }
      return true;
    }
    function constructYamlSet(data) {
      return data !== null ? data : {};
    }
    module2.exports = new Type("tag:yaml.org,2002:set", {
      kind: "mapping",
      resolve: resolveYamlSet,
      construct: constructYamlSet
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/default_safe.js
var require_default_safe = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/default_safe.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      include: [
        require_core()
      ],
      implicit: [
        require_timestamp(),
        require_merge()
      ],
      explicit: [
        require_binary(),
        require_omap(),
        require_pairs(),
        require_set()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/js/undefined.js
var require_undefined = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/js/undefined.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    function resolveJavascriptUndefined() {
      return true;
    }
    function constructJavascriptUndefined() {
      return void 0;
    }
    function representJavascriptUndefined() {
      return "";
    }
    function isUndefined(object) {
      return typeof object === "undefined";
    }
    module2.exports = new Type("tag:yaml.org,2002:js/undefined", {
      kind: "scalar",
      resolve: resolveJavascriptUndefined,
      construct: constructJavascriptUndefined,
      predicate: isUndefined,
      represent: representJavascriptUndefined
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/js/regexp.js
var require_regexp = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/js/regexp.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Type = require_type();
    function resolveJavascriptRegExp(data) {
      if (data === null)
        return false;
      if (data.length === 0)
        return false;
      var regexp = data, tail = /\/([gim]*)$/.exec(data), modifiers = "";
      if (regexp[0] === "/") {
        if (tail)
          modifiers = tail[1];
        if (modifiers.length > 3)
          return false;
        if (regexp[regexp.length - modifiers.length - 1] !== "/")
          return false;
      }
      return true;
    }
    function constructJavascriptRegExp(data) {
      var regexp = data, tail = /\/([gim]*)$/.exec(data), modifiers = "";
      if (regexp[0] === "/") {
        if (tail)
          modifiers = tail[1];
        regexp = regexp.slice(1, regexp.length - modifiers.length - 1);
      }
      return new RegExp(regexp, modifiers);
    }
    function representJavascriptRegExp(object) {
      var result = "/" + object.source + "/";
      if (object.global)
        result += "g";
      if (object.multiline)
        result += "m";
      if (object.ignoreCase)
        result += "i";
      return result;
    }
    function isRegExp(object) {
      return Object.prototype.toString.call(object) === "[object RegExp]";
    }
    module2.exports = new Type("tag:yaml.org,2002:js/regexp", {
      kind: "scalar",
      resolve: resolveJavascriptRegExp,
      construct: constructJavascriptRegExp,
      predicate: isRegExp,
      represent: representJavascriptRegExp
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/js/function.js
var require_function = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/js/function.js"(exports2, module2) {
    init_shims();
    "use strict";
    var esprima;
    try {
      _require = require;
      esprima = _require("esprima");
    } catch (_) {
      if (typeof window !== "undefined")
        esprima = window.esprima;
    }
    var _require;
    var Type = require_type();
    function resolveJavascriptFunction(data) {
      if (data === null)
        return false;
      try {
        var source = "(" + data + ")", ast = esprima.parse(source, { range: true });
        if (ast.type !== "Program" || ast.body.length !== 1 || ast.body[0].type !== "ExpressionStatement" || ast.body[0].expression.type !== "ArrowFunctionExpression" && ast.body[0].expression.type !== "FunctionExpression") {
          return false;
        }
        return true;
      } catch (err) {
        return false;
      }
    }
    function constructJavascriptFunction(data) {
      var source = "(" + data + ")", ast = esprima.parse(source, { range: true }), params = [], body;
      if (ast.type !== "Program" || ast.body.length !== 1 || ast.body[0].type !== "ExpressionStatement" || ast.body[0].expression.type !== "ArrowFunctionExpression" && ast.body[0].expression.type !== "FunctionExpression") {
        throw new Error("Failed to resolve function");
      }
      ast.body[0].expression.params.forEach(function(param) {
        params.push(param.name);
      });
      body = ast.body[0].expression.body.range;
      if (ast.body[0].expression.body.type === "BlockStatement") {
        return new Function(params, source.slice(body[0] + 1, body[1] - 1));
      }
      return new Function(params, "return " + source.slice(body[0], body[1]));
    }
    function representJavascriptFunction(object) {
      return object.toString();
    }
    function isFunction(object) {
      return Object.prototype.toString.call(object) === "[object Function]";
    }
    module2.exports = new Type("tag:yaml.org,2002:js/function", {
      kind: "scalar",
      resolve: resolveJavascriptFunction,
      construct: constructJavascriptFunction,
      predicate: isFunction,
      represent: representJavascriptFunction
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/default_full.js
var require_default_full = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/default_full.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Schema = require_schema();
    module2.exports = Schema.DEFAULT = new Schema({
      include: [
        require_default_safe()
      ],
      explicit: [
        require_undefined(),
        require_regexp(),
        require_function()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/loader.js
var require_loader = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/loader.js"(exports2, module2) {
    init_shims();
    "use strict";
    var common = require_common();
    var YAMLException = require_exception();
    var Mark = require_mark();
    var DEFAULT_SAFE_SCHEMA = require_default_safe();
    var DEFAULT_FULL_SCHEMA = require_default_full();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CONTEXT_FLOW_IN = 1;
    var CONTEXT_FLOW_OUT = 2;
    var CONTEXT_BLOCK_IN = 3;
    var CONTEXT_BLOCK_OUT = 4;
    var CHOMPING_CLIP = 1;
    var CHOMPING_STRIP = 2;
    var CHOMPING_KEEP = 3;
    var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
    var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
    var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
    var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
    function _class(obj) {
      return Object.prototype.toString.call(obj);
    }
    function is_EOL(c) {
      return c === 10 || c === 13;
    }
    function is_WHITE_SPACE(c) {
      return c === 9 || c === 32;
    }
    function is_WS_OR_EOL(c) {
      return c === 9 || c === 32 || c === 10 || c === 13;
    }
    function is_FLOW_INDICATOR(c) {
      return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
    }
    function fromHexCode(c) {
      var lc;
      if (48 <= c && c <= 57) {
        return c - 48;
      }
      lc = c | 32;
      if (97 <= lc && lc <= 102) {
        return lc - 97 + 10;
      }
      return -1;
    }
    function escapedHexLen(c) {
      if (c === 120) {
        return 2;
      }
      if (c === 117) {
        return 4;
      }
      if (c === 85) {
        return 8;
      }
      return 0;
    }
    function fromDecimalCode(c) {
      if (48 <= c && c <= 57) {
        return c - 48;
      }
      return -1;
    }
    function simpleEscapeSequence(c) {
      return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
    }
    function charFromCodepoint(c) {
      if (c <= 65535) {
        return String.fromCharCode(c);
      }
      return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
    }
    var simpleEscapeCheck = new Array(256);
    var simpleEscapeMap = new Array(256);
    for (var i = 0; i < 256; i++) {
      simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
      simpleEscapeMap[i] = simpleEscapeSequence(i);
    }
    function State(input, options2) {
      this.input = input;
      this.filename = options2["filename"] || null;
      this.schema = options2["schema"] || DEFAULT_FULL_SCHEMA;
      this.onWarning = options2["onWarning"] || null;
      this.legacy = options2["legacy"] || false;
      this.json = options2["json"] || false;
      this.listener = options2["listener"] || null;
      this.implicitTypes = this.schema.compiledImplicit;
      this.typeMap = this.schema.compiledTypeMap;
      this.length = input.length;
      this.position = 0;
      this.line = 0;
      this.lineStart = 0;
      this.lineIndent = 0;
      this.documents = [];
    }
    function generateError(state, message) {
      return new YAMLException(message, new Mark(state.filename, state.input, state.position, state.line, state.position - state.lineStart));
    }
    function throwError(state, message) {
      throw generateError(state, message);
    }
    function throwWarning(state, message) {
      if (state.onWarning) {
        state.onWarning.call(null, generateError(state, message));
      }
    }
    var directiveHandlers = {
      YAML: function handleYamlDirective(state, name, args) {
        var match, major, minor;
        if (state.version !== null) {
          throwError(state, "duplication of %YAML directive");
        }
        if (args.length !== 1) {
          throwError(state, "YAML directive accepts exactly one argument");
        }
        match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
        if (match === null) {
          throwError(state, "ill-formed argument of the YAML directive");
        }
        major = parseInt(match[1], 10);
        minor = parseInt(match[2], 10);
        if (major !== 1) {
          throwError(state, "unacceptable YAML version of the document");
        }
        state.version = args[0];
        state.checkLineBreaks = minor < 2;
        if (minor !== 1 && minor !== 2) {
          throwWarning(state, "unsupported YAML version of the document");
        }
      },
      TAG: function handleTagDirective(state, name, args) {
        var handle2, prefix;
        if (args.length !== 2) {
          throwError(state, "TAG directive accepts exactly two arguments");
        }
        handle2 = args[0];
        prefix = args[1];
        if (!PATTERN_TAG_HANDLE.test(handle2)) {
          throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
        }
        if (_hasOwnProperty.call(state.tagMap, handle2)) {
          throwError(state, 'there is a previously declared suffix for "' + handle2 + '" tag handle');
        }
        if (!PATTERN_TAG_URI.test(prefix)) {
          throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
        }
        state.tagMap[handle2] = prefix;
      }
    };
    function captureSegment(state, start, end, checkJson) {
      var _position, _length, _character, _result;
      if (start < end) {
        _result = state.input.slice(start, end);
        if (checkJson) {
          for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
            _character = _result.charCodeAt(_position);
            if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
              throwError(state, "expected valid JSON character");
            }
          }
        } else if (PATTERN_NON_PRINTABLE.test(_result)) {
          throwError(state, "the stream contains non-printable characters");
        }
        state.result += _result;
      }
    }
    function mergeMappings(state, destination, source, overridableKeys) {
      var sourceKeys, key, index2, quantity;
      if (!common.isObject(source)) {
        throwError(state, "cannot merge mappings; the provided source object is unacceptable");
      }
      sourceKeys = Object.keys(source);
      for (index2 = 0, quantity = sourceKeys.length; index2 < quantity; index2 += 1) {
        key = sourceKeys[index2];
        if (!_hasOwnProperty.call(destination, key)) {
          destination[key] = source[key];
          overridableKeys[key] = true;
        }
      }
    }
    function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
      var index2, quantity;
      if (Array.isArray(keyNode)) {
        keyNode = Array.prototype.slice.call(keyNode);
        for (index2 = 0, quantity = keyNode.length; index2 < quantity; index2 += 1) {
          if (Array.isArray(keyNode[index2])) {
            throwError(state, "nested arrays are not supported inside keys");
          }
          if (typeof keyNode === "object" && _class(keyNode[index2]) === "[object Object]") {
            keyNode[index2] = "[object Object]";
          }
        }
      }
      if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
        keyNode = "[object Object]";
      }
      keyNode = String(keyNode);
      if (_result === null) {
        _result = {};
      }
      if (keyTag === "tag:yaml.org,2002:merge") {
        if (Array.isArray(valueNode)) {
          for (index2 = 0, quantity = valueNode.length; index2 < quantity; index2 += 1) {
            mergeMappings(state, _result, valueNode[index2], overridableKeys);
          }
        } else {
          mergeMappings(state, _result, valueNode, overridableKeys);
        }
      } else {
        if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
          state.line = startLine || state.line;
          state.position = startPos || state.position;
          throwError(state, "duplicated mapping key");
        }
        _result[keyNode] = valueNode;
        delete overridableKeys[keyNode];
      }
      return _result;
    }
    function readLineBreak(state) {
      var ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 10) {
        state.position++;
      } else if (ch === 13) {
        state.position++;
        if (state.input.charCodeAt(state.position) === 10) {
          state.position++;
        }
      } else {
        throwError(state, "a line break is expected");
      }
      state.line += 1;
      state.lineStart = state.position;
    }
    function skipSeparationSpace(state, allowComments, checkIndent) {
      var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (allowComments && ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 10 && ch !== 13 && ch !== 0);
        }
        if (is_EOL(ch)) {
          readLineBreak(state);
          ch = state.input.charCodeAt(state.position);
          lineBreaks++;
          state.lineIndent = 0;
          while (ch === 32) {
            state.lineIndent++;
            ch = state.input.charCodeAt(++state.position);
          }
        } else {
          break;
        }
      }
      if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
        throwWarning(state, "deficient indentation");
      }
      return lineBreaks;
    }
    function testDocumentSeparator(state) {
      var _position = state.position, ch;
      ch = state.input.charCodeAt(_position);
      if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
        _position += 3;
        ch = state.input.charCodeAt(_position);
        if (ch === 0 || is_WS_OR_EOL(ch)) {
          return true;
        }
      }
      return false;
    }
    function writeFoldedLines(state, count) {
      if (count === 1) {
        state.result += " ";
      } else if (count > 1) {
        state.result += common.repeat("\n", count - 1);
      }
    }
    function readPlainScalar(state, nodeIndent, withinFlowCollection) {
      var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
      ch = state.input.charCodeAt(state.position);
      if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
        return false;
      }
      if (ch === 63 || ch === 45) {
        following = state.input.charCodeAt(state.position + 1);
        if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
          return false;
        }
      }
      state.kind = "scalar";
      state.result = "";
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
      while (ch !== 0) {
        if (ch === 58) {
          following = state.input.charCodeAt(state.position + 1);
          if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
            break;
          }
        } else if (ch === 35) {
          preceding = state.input.charCodeAt(state.position - 1);
          if (is_WS_OR_EOL(preceding)) {
            break;
          }
        } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
          break;
        } else if (is_EOL(ch)) {
          _line = state.line;
          _lineStart = state.lineStart;
          _lineIndent = state.lineIndent;
          skipSeparationSpace(state, false, -1);
          if (state.lineIndent >= nodeIndent) {
            hasPendingContent = true;
            ch = state.input.charCodeAt(state.position);
            continue;
          } else {
            state.position = captureEnd;
            state.line = _line;
            state.lineStart = _lineStart;
            state.lineIndent = _lineIndent;
            break;
          }
        }
        if (hasPendingContent) {
          captureSegment(state, captureStart, captureEnd, false);
          writeFoldedLines(state, state.line - _line);
          captureStart = captureEnd = state.position;
          hasPendingContent = false;
        }
        if (!is_WHITE_SPACE(ch)) {
          captureEnd = state.position + 1;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, captureEnd, false);
      if (state.result) {
        return true;
      }
      state.kind = _kind;
      state.result = _result;
      return false;
    }
    function readSingleQuotedScalar(state, nodeIndent) {
      var ch, captureStart, captureEnd;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 39) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 39) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (ch === 39) {
            captureStart = state.position;
            state.position++;
            captureEnd = state.position;
          } else {
            return true;
          }
        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a single quoted scalar");
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }
      throwError(state, "unexpected end of the stream within a single quoted scalar");
    }
    function readDoubleQuotedScalar(state, nodeIndent) {
      var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 34) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 34) {
          captureSegment(state, captureStart, state.position, true);
          state.position++;
          return true;
        } else if (ch === 92) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (is_EOL(ch)) {
            skipSeparationSpace(state, false, nodeIndent);
          } else if (ch < 256 && simpleEscapeCheck[ch]) {
            state.result += simpleEscapeMap[ch];
            state.position++;
          } else if ((tmp = escapedHexLen(ch)) > 0) {
            hexLength = tmp;
            hexResult = 0;
            for (; hexLength > 0; hexLength--) {
              ch = state.input.charCodeAt(++state.position);
              if ((tmp = fromHexCode(ch)) >= 0) {
                hexResult = (hexResult << 4) + tmp;
              } else {
                throwError(state, "expected hexadecimal character");
              }
            }
            state.result += charFromCodepoint(hexResult);
            state.position++;
          } else {
            throwError(state, "unknown escape sequence");
          }
          captureStart = captureEnd = state.position;
        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a double quoted scalar");
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }
      throwError(state, "unexpected end of the stream within a double quoted scalar");
    }
    function readFlowCollection(state, nodeIndent) {
      var readNext = true, _line, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = {}, keyNode, keyTag, valueNode, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 91) {
        terminator = 93;
        isMapping = false;
        _result = [];
      } else if (ch === 123) {
        terminator = 125;
        isMapping = true;
        _result = {};
      } else {
        return false;
      }
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(++state.position);
      while (ch !== 0) {
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === terminator) {
          state.position++;
          state.tag = _tag;
          state.anchor = _anchor;
          state.kind = isMapping ? "mapping" : "sequence";
          state.result = _result;
          return true;
        } else if (!readNext) {
          throwError(state, "missed comma between flow collection entries");
        }
        keyTag = keyNode = valueNode = null;
        isPair = isExplicitPair = false;
        if (ch === 63) {
          following = state.input.charCodeAt(state.position + 1);
          if (is_WS_OR_EOL(following)) {
            isPair = isExplicitPair = true;
            state.position++;
            skipSeparationSpace(state, true, nodeIndent);
          }
        }
        _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        keyTag = state.tag;
        keyNode = state.result;
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if ((isExplicitPair || state.line === _line) && ch === 58) {
          isPair = true;
          ch = state.input.charCodeAt(++state.position);
          skipSeparationSpace(state, true, nodeIndent);
          composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
          valueNode = state.result;
        }
        if (isMapping) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode);
        } else if (isPair) {
          _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode));
        } else {
          _result.push(keyNode);
        }
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === 44) {
          readNext = true;
          ch = state.input.charCodeAt(++state.position);
        } else {
          readNext = false;
        }
      }
      throwError(state, "unexpected end of the stream within a flow collection");
    }
    function readBlockScalar(state, nodeIndent) {
      var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 124) {
        folding = false;
      } else if (ch === 62) {
        folding = true;
      } else {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      while (ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
        if (ch === 43 || ch === 45) {
          if (CHOMPING_CLIP === chomping) {
            chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
          } else {
            throwError(state, "repeat of a chomping mode identifier");
          }
        } else if ((tmp = fromDecimalCode(ch)) >= 0) {
          if (tmp === 0) {
            throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
          } else if (!detectedIndent) {
            textIndent = nodeIndent + tmp - 1;
            detectedIndent = true;
          } else {
            throwError(state, "repeat of an indentation width identifier");
          }
        } else {
          break;
        }
      }
      if (is_WHITE_SPACE(ch)) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (is_WHITE_SPACE(ch));
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (!is_EOL(ch) && ch !== 0);
        }
      }
      while (ch !== 0) {
        readLineBreak(state);
        state.lineIndent = 0;
        ch = state.input.charCodeAt(state.position);
        while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
        if (!detectedIndent && state.lineIndent > textIndent) {
          textIndent = state.lineIndent;
        }
        if (is_EOL(ch)) {
          emptyLines++;
          continue;
        }
        if (state.lineIndent < textIndent) {
          if (chomping === CHOMPING_KEEP) {
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (chomping === CHOMPING_CLIP) {
            if (didReadContent) {
              state.result += "\n";
            }
          }
          break;
        }
        if (folding) {
          if (is_WHITE_SPACE(ch)) {
            atMoreIndented = true;
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (atMoreIndented) {
            atMoreIndented = false;
            state.result += common.repeat("\n", emptyLines + 1);
          } else if (emptyLines === 0) {
            if (didReadContent) {
              state.result += " ";
            }
          } else {
            state.result += common.repeat("\n", emptyLines);
          }
        } else {
          state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        }
        didReadContent = true;
        detectedIndent = true;
        emptyLines = 0;
        captureStart = state.position;
        while (!is_EOL(ch) && ch !== 0) {
          ch = state.input.charCodeAt(++state.position);
        }
        captureSegment(state, captureStart, state.position, false);
      }
      return true;
    }
    function readBlockSequence(state, nodeIndent) {
      var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        if (ch !== 45) {
          break;
        }
        following = state.input.charCodeAt(state.position + 1);
        if (!is_WS_OR_EOL(following)) {
          break;
        }
        detected = true;
        state.position++;
        if (skipSeparationSpace(state, true, -1)) {
          if (state.lineIndent <= nodeIndent) {
            _result.push(null);
            ch = state.input.charCodeAt(state.position);
            continue;
          }
        }
        _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
        _result.push(state.result);
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
          throwError(state, "bad indentation of a sequence entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "sequence";
        state.result = _result;
        return true;
      }
      return false;
    }
    function readBlockMapping(state, nodeIndent, flowIndent) {
      var following, allowCompact, _line, _pos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = {}, keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        following = state.input.charCodeAt(state.position + 1);
        _line = state.line;
        _pos = state.position;
        if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
          if (ch === 63) {
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = true;
            allowCompact = true;
          } else if (atExplicitKey) {
            atExplicitKey = false;
            allowCompact = true;
          } else {
            throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
          }
          state.position += 1;
          ch = following;
        } else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          if (state.line === _line) {
            ch = state.input.charCodeAt(state.position);
            while (is_WHITE_SPACE(ch)) {
              ch = state.input.charCodeAt(++state.position);
            }
            if (ch === 58) {
              ch = state.input.charCodeAt(++state.position);
              if (!is_WS_OR_EOL(ch)) {
                throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
              }
              if (atExplicitKey) {
                storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
                keyTag = keyNode = valueNode = null;
              }
              detected = true;
              atExplicitKey = false;
              allowCompact = false;
              keyTag = state.tag;
              keyNode = state.result;
            } else if (detected) {
              throwError(state, "can not read an implicit mapping pair; a colon is missed");
            } else {
              state.tag = _tag;
              state.anchor = _anchor;
              return true;
            }
          } else if (detected) {
            throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else {
          break;
        }
        if (state.line === _line || state.lineIndent > nodeIndent) {
          if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
            if (atExplicitKey) {
              keyNode = state.result;
            } else {
              valueNode = state.result;
            }
          }
          if (!atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _pos);
            keyTag = keyNode = valueNode = null;
          }
          skipSeparationSpace(state, true, -1);
          ch = state.input.charCodeAt(state.position);
        }
        if (state.lineIndent > nodeIndent && ch !== 0) {
          throwError(state, "bad indentation of a mapping entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "mapping";
        state.result = _result;
      }
      return detected;
    }
    function readTagProperty(state) {
      var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 33)
        return false;
      if (state.tag !== null) {
        throwError(state, "duplication of a tag property");
      }
      ch = state.input.charCodeAt(++state.position);
      if (ch === 60) {
        isVerbatim = true;
        ch = state.input.charCodeAt(++state.position);
      } else if (ch === 33) {
        isNamed = true;
        tagHandle = "!!";
        ch = state.input.charCodeAt(++state.position);
      } else {
        tagHandle = "!";
      }
      _position = state.position;
      if (isVerbatim) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && ch !== 62);
        if (state.position < state.length) {
          tagName = state.input.slice(_position, state.position);
          ch = state.input.charCodeAt(++state.position);
        } else {
          throwError(state, "unexpected end of the stream within a verbatim tag");
        }
      } else {
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          if (ch === 33) {
            if (!isNamed) {
              tagHandle = state.input.slice(_position - 1, state.position + 1);
              if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
                throwError(state, "named tag handle cannot contain such characters");
              }
              isNamed = true;
              _position = state.position + 1;
            } else {
              throwError(state, "tag suffix cannot contain exclamation marks");
            }
          }
          ch = state.input.charCodeAt(++state.position);
        }
        tagName = state.input.slice(_position, state.position);
        if (PATTERN_FLOW_INDICATORS.test(tagName)) {
          throwError(state, "tag suffix cannot contain flow indicator characters");
        }
      }
      if (tagName && !PATTERN_TAG_URI.test(tagName)) {
        throwError(state, "tag name cannot contain such characters: " + tagName);
      }
      if (isVerbatim) {
        state.tag = tagName;
      } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
        state.tag = state.tagMap[tagHandle] + tagName;
      } else if (tagHandle === "!") {
        state.tag = "!" + tagName;
      } else if (tagHandle === "!!") {
        state.tag = "tag:yaml.org,2002:" + tagName;
      } else {
        throwError(state, 'undeclared tag handle "' + tagHandle + '"');
      }
      return true;
    }
    function readAnchorProperty(state) {
      var _position, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 38)
        return false;
      if (state.anchor !== null) {
        throwError(state, "duplication of an anchor property");
      }
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an anchor node must contain at least one character");
      }
      state.anchor = state.input.slice(_position, state.position);
      return true;
    }
    function readAlias(state) {
      var _position, alias, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 42)
        return false;
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an alias node must contain at least one character");
      }
      alias = state.input.slice(_position, state.position);
      if (!_hasOwnProperty.call(state.anchorMap, alias)) {
        throwError(state, 'unidentified alias "' + alias + '"');
      }
      state.result = state.anchorMap[alias];
      skipSeparationSpace(state, true, -1);
      return true;
    }
    function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
      var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, type, flowIndent, blockIndent;
      if (state.listener !== null) {
        state.listener("open", state);
      }
      state.tag = null;
      state.anchor = null;
      state.kind = null;
      state.result = null;
      allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
      if (allowToSeek) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        }
      }
      if (indentStatus === 1) {
        while (readTagProperty(state) || readAnchorProperty(state)) {
          if (skipSeparationSpace(state, true, -1)) {
            atNewLine = true;
            allowBlockCollections = allowBlockStyles;
            if (state.lineIndent > parentIndent) {
              indentStatus = 1;
            } else if (state.lineIndent === parentIndent) {
              indentStatus = 0;
            } else if (state.lineIndent < parentIndent) {
              indentStatus = -1;
            }
          } else {
            allowBlockCollections = false;
          }
        }
      }
      if (allowBlockCollections) {
        allowBlockCollections = atNewLine || allowCompact;
      }
      if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
        if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
          flowIndent = parentIndent;
        } else {
          flowIndent = parentIndent + 1;
        }
        blockIndent = state.position - state.lineStart;
        if (indentStatus === 1) {
          if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
            hasContent = true;
          } else {
            if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
              hasContent = true;
            } else if (readAlias(state)) {
              hasContent = true;
              if (state.tag !== null || state.anchor !== null) {
                throwError(state, "alias node should not have any properties");
              }
            } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
              hasContent = true;
              if (state.tag === null) {
                state.tag = "?";
              }
            }
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
          }
        } else if (indentStatus === 0) {
          hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
        }
      }
      if (state.tag !== null && state.tag !== "!") {
        if (state.tag === "?") {
          if (state.result !== null && state.kind !== "scalar") {
            throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
          }
          for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
            type = state.implicitTypes[typeIndex];
            if (type.resolve(state.result)) {
              state.result = type.construct(state.result);
              state.tag = type.tag;
              if (state.anchor !== null) {
                state.anchorMap[state.anchor] = state.result;
              }
              break;
            }
          }
        } else if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
          type = state.typeMap[state.kind || "fallback"][state.tag];
          if (state.result !== null && type.kind !== state.kind) {
            throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
          }
          if (!type.resolve(state.result)) {
            throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
          } else {
            state.result = type.construct(state.result);
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
          }
        } else {
          throwError(state, "unknown tag !<" + state.tag + ">");
        }
      }
      if (state.listener !== null) {
        state.listener("close", state);
      }
      return state.tag !== null || state.anchor !== null || hasContent;
    }
    function readDocument(state) {
      var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
      state.version = null;
      state.checkLineBreaks = state.legacy;
      state.tagMap = {};
      state.anchorMap = {};
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if (state.lineIndent > 0 || ch !== 37) {
          break;
        }
        hasDirectives = true;
        ch = state.input.charCodeAt(++state.position);
        _position = state.position;
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveName = state.input.slice(_position, state.position);
        directiveArgs = [];
        if (directiveName.length < 1) {
          throwError(state, "directive name must not be less than one character in length");
        }
        while (ch !== 0) {
          while (is_WHITE_SPACE(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 35) {
            do {
              ch = state.input.charCodeAt(++state.position);
            } while (ch !== 0 && !is_EOL(ch));
            break;
          }
          if (is_EOL(ch))
            break;
          _position = state.position;
          while (ch !== 0 && !is_WS_OR_EOL(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          directiveArgs.push(state.input.slice(_position, state.position));
        }
        if (ch !== 0)
          readLineBreak(state);
        if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
          directiveHandlers[directiveName](state, directiveName, directiveArgs);
        } else {
          throwWarning(state, 'unknown document directive "' + directiveName + '"');
        }
      }
      skipSeparationSpace(state, true, -1);
      if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      } else if (hasDirectives) {
        throwError(state, "directives end mark is expected");
      }
      composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
      skipSeparationSpace(state, true, -1);
      if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
        throwWarning(state, "non-ASCII line breaks are interpreted as content");
      }
      state.documents.push(state.result);
      if (state.position === state.lineStart && testDocumentSeparator(state)) {
        if (state.input.charCodeAt(state.position) === 46) {
          state.position += 3;
          skipSeparationSpace(state, true, -1);
        }
        return;
      }
      if (state.position < state.length - 1) {
        throwError(state, "end of the stream or a document separator is expected");
      } else {
        return;
      }
    }
    function loadDocuments(input, options2) {
      input = String(input);
      options2 = options2 || {};
      if (input.length !== 0) {
        if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
          input += "\n";
        }
        if (input.charCodeAt(0) === 65279) {
          input = input.slice(1);
        }
      }
      var state = new State(input, options2);
      var nullpos = input.indexOf("\0");
      if (nullpos !== -1) {
        state.position = nullpos;
        throwError(state, "null byte is not allowed in input");
      }
      state.input += "\0";
      while (state.input.charCodeAt(state.position) === 32) {
        state.lineIndent += 1;
        state.position += 1;
      }
      while (state.position < state.length - 1) {
        readDocument(state);
      }
      return state.documents;
    }
    function loadAll(input, iterator, options2) {
      if (iterator !== null && typeof iterator === "object" && typeof options2 === "undefined") {
        options2 = iterator;
        iterator = null;
      }
      var documents = loadDocuments(input, options2);
      if (typeof iterator !== "function") {
        return documents;
      }
      for (var index2 = 0, length = documents.length; index2 < length; index2 += 1) {
        iterator(documents[index2]);
      }
    }
    function load2(input, options2) {
      var documents = loadDocuments(input, options2);
      if (documents.length === 0) {
        return void 0;
      } else if (documents.length === 1) {
        return documents[0];
      }
      throw new YAMLException("expected a single document in the stream, but found more");
    }
    function safeLoadAll(input, iterator, options2) {
      if (typeof iterator === "object" && iterator !== null && typeof options2 === "undefined") {
        options2 = iterator;
        iterator = null;
      }
      return loadAll(input, iterator, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
    }
    function safeLoad(input, options2) {
      return load2(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
    }
    module2.exports.loadAll = loadAll;
    module2.exports.load = load2;
    module2.exports.safeLoadAll = safeLoadAll;
    module2.exports.safeLoad = safeLoad;
  }
});

// node_modules/js-yaml/lib/js-yaml/dumper.js
var require_dumper = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/dumper.js"(exports2, module2) {
    init_shims();
    "use strict";
    var common = require_common();
    var YAMLException = require_exception();
    var DEFAULT_FULL_SCHEMA = require_default_full();
    var DEFAULT_SAFE_SCHEMA = require_default_safe();
    var _toString = Object.prototype.toString;
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CHAR_TAB = 9;
    var CHAR_LINE_FEED = 10;
    var CHAR_CARRIAGE_RETURN = 13;
    var CHAR_SPACE = 32;
    var CHAR_EXCLAMATION = 33;
    var CHAR_DOUBLE_QUOTE = 34;
    var CHAR_SHARP = 35;
    var CHAR_PERCENT = 37;
    var CHAR_AMPERSAND = 38;
    var CHAR_SINGLE_QUOTE = 39;
    var CHAR_ASTERISK = 42;
    var CHAR_COMMA = 44;
    var CHAR_MINUS = 45;
    var CHAR_COLON = 58;
    var CHAR_EQUALS = 61;
    var CHAR_GREATER_THAN = 62;
    var CHAR_QUESTION = 63;
    var CHAR_COMMERCIAL_AT = 64;
    var CHAR_LEFT_SQUARE_BRACKET = 91;
    var CHAR_RIGHT_SQUARE_BRACKET = 93;
    var CHAR_GRAVE_ACCENT = 96;
    var CHAR_LEFT_CURLY_BRACKET = 123;
    var CHAR_VERTICAL_LINE = 124;
    var CHAR_RIGHT_CURLY_BRACKET = 125;
    var ESCAPE_SEQUENCES = {};
    ESCAPE_SEQUENCES[0] = "\\0";
    ESCAPE_SEQUENCES[7] = "\\a";
    ESCAPE_SEQUENCES[8] = "\\b";
    ESCAPE_SEQUENCES[9] = "\\t";
    ESCAPE_SEQUENCES[10] = "\\n";
    ESCAPE_SEQUENCES[11] = "\\v";
    ESCAPE_SEQUENCES[12] = "\\f";
    ESCAPE_SEQUENCES[13] = "\\r";
    ESCAPE_SEQUENCES[27] = "\\e";
    ESCAPE_SEQUENCES[34] = '\\"';
    ESCAPE_SEQUENCES[92] = "\\\\";
    ESCAPE_SEQUENCES[133] = "\\N";
    ESCAPE_SEQUENCES[160] = "\\_";
    ESCAPE_SEQUENCES[8232] = "\\L";
    ESCAPE_SEQUENCES[8233] = "\\P";
    var DEPRECATED_BOOLEANS_SYNTAX = [
      "y",
      "Y",
      "yes",
      "Yes",
      "YES",
      "on",
      "On",
      "ON",
      "n",
      "N",
      "no",
      "No",
      "NO",
      "off",
      "Off",
      "OFF"
    ];
    function compileStyleMap(schema, map) {
      var result, keys, index2, length, tag, style, type;
      if (map === null)
        return {};
      result = {};
      keys = Object.keys(map);
      for (index2 = 0, length = keys.length; index2 < length; index2 += 1) {
        tag = keys[index2];
        style = String(map[tag]);
        if (tag.slice(0, 2) === "!!") {
          tag = "tag:yaml.org,2002:" + tag.slice(2);
        }
        type = schema.compiledTypeMap["fallback"][tag];
        if (type && _hasOwnProperty.call(type.styleAliases, style)) {
          style = type.styleAliases[style];
        }
        result[tag] = style;
      }
      return result;
    }
    function encodeHex(character) {
      var string, handle2, length;
      string = character.toString(16).toUpperCase();
      if (character <= 255) {
        handle2 = "x";
        length = 2;
      } else if (character <= 65535) {
        handle2 = "u";
        length = 4;
      } else if (character <= 4294967295) {
        handle2 = "U";
        length = 8;
      } else {
        throw new YAMLException("code point within a string may not be greater than 0xFFFFFFFF");
      }
      return "\\" + handle2 + common.repeat("0", length - string.length) + string;
    }
    function State(options2) {
      this.schema = options2["schema"] || DEFAULT_FULL_SCHEMA;
      this.indent = Math.max(1, options2["indent"] || 2);
      this.noArrayIndent = options2["noArrayIndent"] || false;
      this.skipInvalid = options2["skipInvalid"] || false;
      this.flowLevel = common.isNothing(options2["flowLevel"]) ? -1 : options2["flowLevel"];
      this.styleMap = compileStyleMap(this.schema, options2["styles"] || null);
      this.sortKeys = options2["sortKeys"] || false;
      this.lineWidth = options2["lineWidth"] || 80;
      this.noRefs = options2["noRefs"] || false;
      this.noCompatMode = options2["noCompatMode"] || false;
      this.condenseFlow = options2["condenseFlow"] || false;
      this.implicitTypes = this.schema.compiledImplicit;
      this.explicitTypes = this.schema.compiledExplicit;
      this.tag = null;
      this.result = "";
      this.duplicates = [];
      this.usedDuplicates = null;
    }
    function indentString(string, spaces) {
      var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
      while (position < length) {
        next = string.indexOf("\n", position);
        if (next === -1) {
          line = string.slice(position);
          position = length;
        } else {
          line = string.slice(position, next + 1);
          position = next + 1;
        }
        if (line.length && line !== "\n")
          result += ind;
        result += line;
      }
      return result;
    }
    function generateNextLine(state, level) {
      return "\n" + common.repeat(" ", state.indent * level);
    }
    function testImplicitResolving(state, str) {
      var index2, length, type;
      for (index2 = 0, length = state.implicitTypes.length; index2 < length; index2 += 1) {
        type = state.implicitTypes[index2];
        if (type.resolve(str)) {
          return true;
        }
      }
      return false;
    }
    function isWhitespace(c) {
      return c === CHAR_SPACE || c === CHAR_TAB;
    }
    function isPrintable(c) {
      return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== 65279 || 65536 <= c && c <= 1114111;
    }
    function isNsChar(c) {
      return isPrintable(c) && !isWhitespace(c) && c !== 65279 && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
    }
    function isPlainSafe(c, prev) {
      return isPrintable(c) && c !== 65279 && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_COLON && (c !== CHAR_SHARP || prev && isNsChar(prev));
    }
    function isPlainSafeFirst(c) {
      return isPrintable(c) && c !== 65279 && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
    }
    function needIndentIndicator(string) {
      var leadingSpaceRe = /^\n* /;
      return leadingSpaceRe.test(string);
    }
    var STYLE_PLAIN = 1;
    var STYLE_SINGLE = 2;
    var STYLE_LITERAL = 3;
    var STYLE_FOLDED = 4;
    var STYLE_DOUBLE = 5;
    function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
      var i;
      var char, prev_char;
      var hasLineBreak = false;
      var hasFoldableLine = false;
      var shouldTrackWidth = lineWidth !== -1;
      var previousLineBreak = -1;
      var plain = isPlainSafeFirst(string.charCodeAt(0)) && !isWhitespace(string.charCodeAt(string.length - 1));
      if (singleLineOnly) {
        for (i = 0; i < string.length; i++) {
          char = string.charCodeAt(i);
          if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
          plain = plain && isPlainSafe(char, prev_char);
        }
      } else {
        for (i = 0; i < string.length; i++) {
          char = string.charCodeAt(i);
          if (char === CHAR_LINE_FEED) {
            hasLineBreak = true;
            if (shouldTrackWidth) {
              hasFoldableLine = hasFoldableLine || i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
              previousLineBreak = i;
            }
          } else if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
          plain = plain && isPlainSafe(char, prev_char);
        }
        hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
      }
      if (!hasLineBreak && !hasFoldableLine) {
        return plain && !testAmbiguousType(string) ? STYLE_PLAIN : STYLE_SINGLE;
      }
      if (indentPerLevel > 9 && needIndentIndicator(string)) {
        return STYLE_DOUBLE;
      }
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    function writeScalar(state, string, level, iskey) {
      state.dump = function() {
        if (string.length === 0) {
          return "''";
        }
        if (!state.noCompatMode && DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
          return "'" + string + "'";
        }
        var indent = state.indent * Math.max(1, level);
        var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
        var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
        function testAmbiguity(string2) {
          return testImplicitResolving(state, string2);
        }
        switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)) {
          case STYLE_PLAIN:
            return string;
          case STYLE_SINGLE:
            return "'" + string.replace(/'/g, "''") + "'";
          case STYLE_LITERAL:
            return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
          case STYLE_FOLDED:
            return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
          case STYLE_DOUBLE:
            return '"' + escapeString(string, lineWidth) + '"';
          default:
            throw new YAMLException("impossible error: invalid scalar style");
        }
      }();
    }
    function blockHeader(string, indentPerLevel) {
      var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
      var clip = string[string.length - 1] === "\n";
      var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
      var chomp = keep ? "+" : clip ? "" : "-";
      return indentIndicator + chomp + "\n";
    }
    function dropEndingNewline(string) {
      return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
    }
    function foldString(string, width) {
      var lineRe = /(\n+)([^\n]*)/g;
      var result = function() {
        var nextLF = string.indexOf("\n");
        nextLF = nextLF !== -1 ? nextLF : string.length;
        lineRe.lastIndex = nextLF;
        return foldLine(string.slice(0, nextLF), width);
      }();
      var prevMoreIndented = string[0] === "\n" || string[0] === " ";
      var moreIndented;
      var match;
      while (match = lineRe.exec(string)) {
        var prefix = match[1], line = match[2];
        moreIndented = line[0] === " ";
        result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
        prevMoreIndented = moreIndented;
      }
      return result;
    }
    function foldLine(line, width) {
      if (line === "" || line[0] === " ")
        return line;
      var breakRe = / [^ ]/g;
      var match;
      var start = 0, end, curr = 0, next = 0;
      var result = "";
      while (match = breakRe.exec(line)) {
        next = match.index;
        if (next - start > width) {
          end = curr > start ? curr : next;
          result += "\n" + line.slice(start, end);
          start = end + 1;
        }
        curr = next;
      }
      result += "\n";
      if (line.length - start > width && curr > start) {
        result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
      } else {
        result += line.slice(start);
      }
      return result.slice(1);
    }
    function escapeString(string) {
      var result = "";
      var char, nextChar;
      var escapeSeq;
      for (var i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        if (char >= 55296 && char <= 56319) {
          nextChar = string.charCodeAt(i + 1);
          if (nextChar >= 56320 && nextChar <= 57343) {
            result += encodeHex((char - 55296) * 1024 + nextChar - 56320 + 65536);
            i++;
            continue;
          }
        }
        escapeSeq = ESCAPE_SEQUENCES[char];
        result += !escapeSeq && isPrintable(char) ? string[i] : escapeSeq || encodeHex(char);
      }
      return result;
    }
    function writeFlowSequence(state, level, object) {
      var _result = "", _tag = state.tag, index2, length;
      for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
        if (writeNode(state, level, object[index2], false, false)) {
          if (index2 !== 0)
            _result += "," + (!state.condenseFlow ? " " : "");
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = "[" + _result + "]";
    }
    function writeBlockSequence(state, level, object, compact) {
      var _result = "", _tag = state.tag, index2, length;
      for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
        if (writeNode(state, level + 1, object[index2], true, true)) {
          if (!compact || index2 !== 0) {
            _result += generateNextLine(state, level);
          }
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            _result += "-";
          } else {
            _result += "- ";
          }
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = _result || "[]";
    }
    function writeFlowMapping(state, level, object) {
      var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index2, length, objectKey, objectValue, pairBuffer;
      for (index2 = 0, length = objectKeyList.length; index2 < length; index2 += 1) {
        pairBuffer = "";
        if (index2 !== 0)
          pairBuffer += ", ";
        if (state.condenseFlow)
          pairBuffer += '"';
        objectKey = objectKeyList[index2];
        objectValue = object[objectKey];
        if (!writeNode(state, level, objectKey, false, false)) {
          continue;
        }
        if (state.dump.length > 1024)
          pairBuffer += "? ";
        pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
        if (!writeNode(state, level, objectValue, false, false)) {
          continue;
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = "{" + _result + "}";
    }
    function writeBlockMapping(state, level, object, compact) {
      var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index2, length, objectKey, objectValue, explicitPair, pairBuffer;
      if (state.sortKeys === true) {
        objectKeyList.sort();
      } else if (typeof state.sortKeys === "function") {
        objectKeyList.sort(state.sortKeys);
      } else if (state.sortKeys) {
        throw new YAMLException("sortKeys must be a boolean or a function");
      }
      for (index2 = 0, length = objectKeyList.length; index2 < length; index2 += 1) {
        pairBuffer = "";
        if (!compact || index2 !== 0) {
          pairBuffer += generateNextLine(state, level);
        }
        objectKey = objectKeyList[index2];
        objectValue = object[objectKey];
        if (!writeNode(state, level + 1, objectKey, true, true, true)) {
          continue;
        }
        explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
        if (explicitPair) {
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            pairBuffer += "?";
          } else {
            pairBuffer += "? ";
          }
        }
        pairBuffer += state.dump;
        if (explicitPair) {
          pairBuffer += generateNextLine(state, level);
        }
        if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
          continue;
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += ":";
        } else {
          pairBuffer += ": ";
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = _result || "{}";
    }
    function detectType(state, object, explicit) {
      var _result, typeList, index2, length, type, style;
      typeList = explicit ? state.explicitTypes : state.implicitTypes;
      for (index2 = 0, length = typeList.length; index2 < length; index2 += 1) {
        type = typeList[index2];
        if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
          state.tag = explicit ? type.tag : "?";
          if (type.represent) {
            style = state.styleMap[type.tag] || type.defaultStyle;
            if (_toString.call(type.represent) === "[object Function]") {
              _result = type.represent(object, style);
            } else if (_hasOwnProperty.call(type.represent, style)) {
              _result = type.represent[style](object, style);
            } else {
              throw new YAMLException("!<" + type.tag + '> tag resolver accepts not "' + style + '" style');
            }
            state.dump = _result;
          }
          return true;
        }
      }
      return false;
    }
    function writeNode(state, level, object, block, compact, iskey) {
      state.tag = null;
      state.dump = object;
      if (!detectType(state, object, false)) {
        detectType(state, object, true);
      }
      var type = _toString.call(state.dump);
      if (block) {
        block = state.flowLevel < 0 || state.flowLevel > level;
      }
      var objectOrArray = type === "[object Object]" || type === "[object Array]", duplicateIndex, duplicate;
      if (objectOrArray) {
        duplicateIndex = state.duplicates.indexOf(object);
        duplicate = duplicateIndex !== -1;
      }
      if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
        compact = false;
      }
      if (duplicate && state.usedDuplicates[duplicateIndex]) {
        state.dump = "*ref_" + duplicateIndex;
      } else {
        if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
          state.usedDuplicates[duplicateIndex] = true;
        }
        if (type === "[object Object]") {
          if (block && Object.keys(state.dump).length !== 0) {
            writeBlockMapping(state, level, state.dump, compact);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowMapping(state, level, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object Array]") {
          var arrayLevel = state.noArrayIndent && level > 0 ? level - 1 : level;
          if (block && state.dump.length !== 0) {
            writeBlockSequence(state, arrayLevel, state.dump, compact);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowSequence(state, arrayLevel, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object String]") {
          if (state.tag !== "?") {
            writeScalar(state, state.dump, level, iskey);
          }
        } else {
          if (state.skipInvalid)
            return false;
          throw new YAMLException("unacceptable kind of an object to dump " + type);
        }
        if (state.tag !== null && state.tag !== "?") {
          state.dump = "!<" + state.tag + "> " + state.dump;
        }
      }
      return true;
    }
    function getDuplicateReferences(object, state) {
      var objects = [], duplicatesIndexes = [], index2, length;
      inspectNode(object, objects, duplicatesIndexes);
      for (index2 = 0, length = duplicatesIndexes.length; index2 < length; index2 += 1) {
        state.duplicates.push(objects[duplicatesIndexes[index2]]);
      }
      state.usedDuplicates = new Array(length);
    }
    function inspectNode(object, objects, duplicatesIndexes) {
      var objectKeyList, index2, length;
      if (object !== null && typeof object === "object") {
        index2 = objects.indexOf(object);
        if (index2 !== -1) {
          if (duplicatesIndexes.indexOf(index2) === -1) {
            duplicatesIndexes.push(index2);
          }
        } else {
          objects.push(object);
          if (Array.isArray(object)) {
            for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
              inspectNode(object[index2], objects, duplicatesIndexes);
            }
          } else {
            objectKeyList = Object.keys(object);
            for (index2 = 0, length = objectKeyList.length; index2 < length; index2 += 1) {
              inspectNode(object[objectKeyList[index2]], objects, duplicatesIndexes);
            }
          }
        }
      }
    }
    function dump(input, options2) {
      options2 = options2 || {};
      var state = new State(options2);
      if (!state.noRefs)
        getDuplicateReferences(input, state);
      if (writeNode(state, 0, input, true, true))
        return state.dump + "\n";
      return "";
    }
    function safeDump(input, options2) {
      return dump(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
    }
    module2.exports.dump = dump;
    module2.exports.safeDump = safeDump;
  }
});

// node_modules/js-yaml/lib/js-yaml.js
var require_js_yaml = __commonJS({
  "node_modules/js-yaml/lib/js-yaml.js"(exports2, module2) {
    init_shims();
    "use strict";
    var loader = require_loader();
    var dumper = require_dumper();
    function deprecated(name) {
      return function() {
        throw new Error("Function " + name + " is deprecated and cannot be used.");
      };
    }
    module2.exports.Type = require_type();
    module2.exports.Schema = require_schema();
    module2.exports.FAILSAFE_SCHEMA = require_failsafe();
    module2.exports.JSON_SCHEMA = require_json();
    module2.exports.CORE_SCHEMA = require_core();
    module2.exports.DEFAULT_SAFE_SCHEMA = require_default_safe();
    module2.exports.DEFAULT_FULL_SCHEMA = require_default_full();
    module2.exports.load = loader.load;
    module2.exports.loadAll = loader.loadAll;
    module2.exports.safeLoad = loader.safeLoad;
    module2.exports.safeLoadAll = loader.safeLoadAll;
    module2.exports.dump = dumper.dump;
    module2.exports.safeDump = dumper.safeDump;
    module2.exports.YAMLException = require_exception();
    module2.exports.MINIMAL_SCHEMA = require_failsafe();
    module2.exports.SAFE_SCHEMA = require_default_safe();
    module2.exports.DEFAULT_SCHEMA = require_default_full();
    module2.exports.scan = deprecated("scan");
    module2.exports.parse = deprecated("parse");
    module2.exports.compose = deprecated("compose");
    module2.exports.addConstructor = deprecated("addConstructor");
  }
});

// node_modules/js-yaml/index.js
var require_js_yaml2 = __commonJS({
  "node_modules/js-yaml/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    var yaml2 = require_js_yaml();
    module2.exports = yaml2;
  }
});

// node_modules/gray-matter/lib/engines.js
var require_engines = __commonJS({
  "node_modules/gray-matter/lib/engines.js"(exports, module) {
    init_shims();
    "use strict";
    var yaml = require_js_yaml2();
    var engines = exports = module.exports;
    engines.yaml = {
      parse: yaml.safeLoad.bind(yaml),
      stringify: yaml.safeDump.bind(yaml)
    };
    engines.json = {
      parse: JSON.parse.bind(JSON),
      stringify: function(obj, options2) {
        const opts = Object.assign({ replacer: null, space: 2 }, options2);
        return JSON.stringify(obj, opts.replacer, opts.space);
      }
    };
    engines.javascript = {
      parse: function parse(str, options, wrap) {
        try {
          if (wrap !== false) {
            str = "(function() {\nreturn " + str.trim() + ";\n}());";
          }
          return eval(str) || {};
        } catch (err) {
          if (wrap !== false && /(unexpected|identifier)/i.test(err.message)) {
            return parse(str, options, false);
          }
          throw new SyntaxError(err);
        }
      },
      stringify: function() {
        throw new Error("stringifying JavaScript is not supported");
      }
    };
  }
});

// node_modules/strip-bom-string/index.js
var require_strip_bom_string = __commonJS({
  "node_modules/strip-bom-string/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(str) {
      if (typeof str === "string" && str.charAt(0) === "\uFEFF") {
        return str.slice(1);
      }
      return str;
    };
  }
});

// node_modules/gray-matter/lib/utils.js
var require_utils = __commonJS({
  "node_modules/gray-matter/lib/utils.js"(exports2) {
    init_shims();
    "use strict";
    var stripBom = require_strip_bom_string();
    var typeOf = require_kind_of();
    exports2.define = function(obj, key, val) {
      Reflect.defineProperty(obj, key, {
        enumerable: false,
        configurable: true,
        writable: true,
        value: val
      });
    };
    exports2.isBuffer = function(val) {
      return typeOf(val) === "buffer";
    };
    exports2.isObject = function(val) {
      return typeOf(val) === "object";
    };
    exports2.toBuffer = function(input) {
      return typeof input === "string" ? Buffer.from(input) : input;
    };
    exports2.toString = function(input) {
      if (exports2.isBuffer(input))
        return stripBom(String(input));
      if (typeof input !== "string") {
        throw new TypeError("expected input to be a string or buffer");
      }
      return stripBom(input);
    };
    exports2.arrayify = function(val) {
      return val ? Array.isArray(val) ? val : [val] : [];
    };
    exports2.startsWith = function(str, substr, len) {
      if (typeof len !== "number")
        len = substr.length;
      return str.slice(0, len) === substr;
    };
  }
});

// node_modules/gray-matter/lib/defaults.js
var require_defaults2 = __commonJS({
  "node_modules/gray-matter/lib/defaults.js"(exports2, module2) {
    init_shims();
    "use strict";
    var engines2 = require_engines();
    var utils = require_utils();
    module2.exports = function(options2) {
      const opts = Object.assign({}, options2);
      opts.delimiters = utils.arrayify(opts.delims || opts.delimiters || "---");
      if (opts.delimiters.length === 1) {
        opts.delimiters.push(opts.delimiters[0]);
      }
      opts.language = (opts.language || opts.lang || "yaml").toLowerCase();
      opts.engines = Object.assign({}, engines2, opts.parsers, opts.engines);
      return opts;
    };
  }
});

// node_modules/gray-matter/lib/engine.js
var require_engine = __commonJS({
  "node_modules/gray-matter/lib/engine.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(name, options2) {
      let engine = options2.engines[name] || options2.engines[aliase(name)];
      if (typeof engine === "undefined") {
        throw new Error('gray-matter engine "' + name + '" is not registered');
      }
      if (typeof engine === "function") {
        engine = { parse: engine };
      }
      return engine;
    };
    function aliase(name) {
      switch (name.toLowerCase()) {
        case "js":
        case "javascript":
          return "javascript";
        case "coffee":
        case "coffeescript":
        case "cson":
          return "coffee";
        case "yaml":
        case "yml":
          return "yaml";
        default: {
          return name;
        }
      }
    }
  }
});

// node_modules/gray-matter/lib/stringify.js
var require_stringify = __commonJS({
  "node_modules/gray-matter/lib/stringify.js"(exports2, module2) {
    init_shims();
    "use strict";
    var typeOf = require_kind_of();
    var getEngine = require_engine();
    var defaults2 = require_defaults2();
    module2.exports = function(file, data, options2) {
      if (data == null && options2 == null) {
        switch (typeOf(file)) {
          case "object":
            data = file.data;
            options2 = {};
            break;
          case "string":
            return file;
          default: {
            throw new TypeError("expected file to be a string or object");
          }
        }
      }
      const str = file.content;
      const opts = defaults2(options2);
      if (data == null) {
        if (!opts.data)
          return file;
        data = opts.data;
      }
      const language = file.language || opts.language;
      const engine = getEngine(language, opts);
      if (typeof engine.stringify !== "function") {
        throw new TypeError('expected "' + language + '.stringify" to be a function');
      }
      data = Object.assign({}, file.data, data);
      const open2 = opts.delimiters[0];
      const close = opts.delimiters[1];
      const matter = engine.stringify(data, options2).trim();
      let buf = "";
      if (matter !== "{}") {
        buf = newline(open2) + newline(matter) + newline(close);
      }
      if (typeof file.excerpt === "string" && file.excerpt !== "") {
        if (str.indexOf(file.excerpt.trim()) === -1) {
          buf += newline(file.excerpt) + newline(close);
        }
      }
      return buf + newline(str);
    };
    function newline(str) {
      return str.slice(-1) !== "\n" ? str + "\n" : str;
    }
  }
});

// node_modules/gray-matter/lib/excerpt.js
var require_excerpt = __commonJS({
  "node_modules/gray-matter/lib/excerpt.js"(exports2, module2) {
    init_shims();
    "use strict";
    var defaults2 = require_defaults2();
    module2.exports = function(file, options2) {
      const opts = defaults2(options2);
      if (file.data == null) {
        file.data = {};
      }
      if (typeof opts.excerpt === "function") {
        return opts.excerpt(file, opts);
      }
      const sep = file.data.excerpt_separator || opts.excerpt_separator;
      if (sep == null && (opts.excerpt === false || opts.excerpt == null)) {
        return file;
      }
      const delimiter = typeof opts.excerpt === "string" ? opts.excerpt : sep || opts.delimiters[0];
      const idx = file.content.indexOf(delimiter);
      if (idx !== -1) {
        file.excerpt = file.content.slice(0, idx);
      }
      return file;
    };
  }
});

// node_modules/gray-matter/lib/to-file.js
var require_to_file = __commonJS({
  "node_modules/gray-matter/lib/to-file.js"(exports2, module2) {
    init_shims();
    "use strict";
    var typeOf = require_kind_of();
    var stringify = require_stringify();
    var utils = require_utils();
    module2.exports = function(file) {
      if (typeOf(file) !== "object") {
        file = { content: file };
      }
      if (typeOf(file.data) !== "object") {
        file.data = {};
      }
      if (file.contents && file.content == null) {
        file.content = file.contents;
      }
      utils.define(file, "orig", utils.toBuffer(file.content));
      utils.define(file, "language", file.language || "");
      utils.define(file, "matter", file.matter || "");
      utils.define(file, "stringify", function(data, options2) {
        if (options2 && options2.language) {
          file.language = options2.language;
        }
        return stringify(file, data, options2);
      });
      file.content = utils.toString(file.content);
      file.isEmpty = false;
      file.excerpt = "";
      return file;
    };
  }
});

// node_modules/gray-matter/lib/parse.js
var require_parse = __commonJS({
  "node_modules/gray-matter/lib/parse.js"(exports2, module2) {
    init_shims();
    "use strict";
    var getEngine = require_engine();
    var defaults2 = require_defaults2();
    module2.exports = function(language, str, options2) {
      const opts = defaults2(options2);
      const engine = getEngine(language, opts);
      if (typeof engine.parse !== "function") {
        throw new TypeError('expected "' + language + '.parse" to be a function');
      }
      return engine.parse(str, opts);
    };
  }
});

// node_modules/gray-matter/index.js
var require_gray_matter = __commonJS({
  "node_modules/gray-matter/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    var fs2 = require("fs");
    var sections = require_section_matter();
    var defaults2 = require_defaults2();
    var stringify = require_stringify();
    var excerpt = require_excerpt();
    var engines2 = require_engines();
    var toFile = require_to_file();
    var parse = require_parse();
    var utils = require_utils();
    function matter(input, options2) {
      if (input === "") {
        return { data: {}, content: input, excerpt: "", orig: input };
      }
      let file = toFile(input);
      const cached = matter.cache[file.content];
      if (!options2) {
        if (cached) {
          file = Object.assign({}, cached);
          file.orig = cached.orig;
          return file;
        }
        matter.cache[file.content] = file;
      }
      return parseMatter(file, options2);
    }
    function parseMatter(file, options2) {
      const opts = defaults2(options2);
      const open2 = opts.delimiters[0];
      const close = "\n" + opts.delimiters[1];
      let str = file.content;
      if (opts.language) {
        file.language = opts.language;
      }
      const openLen = open2.length;
      if (!utils.startsWith(str, open2, openLen)) {
        excerpt(file, opts);
        return file;
      }
      if (str.charAt(openLen) === open2.slice(-1)) {
        return file;
      }
      str = str.slice(openLen);
      const len = str.length;
      const language = matter.language(str, opts);
      if (language.name) {
        file.language = language.name;
        str = str.slice(language.raw.length);
      }
      let closeIndex = str.indexOf(close);
      if (closeIndex === -1) {
        closeIndex = len;
      }
      file.matter = str.slice(0, closeIndex);
      const block = file.matter.replace(/^\s*#[^\n]+/gm, "").trim();
      if (block === "") {
        file.isEmpty = true;
        file.empty = file.content;
        file.data = {};
      } else {
        file.data = parse(file.language, file.matter, opts);
      }
      if (closeIndex === len) {
        file.content = "";
      } else {
        file.content = str.slice(closeIndex + close.length);
        if (file.content[0] === "\r") {
          file.content = file.content.slice(1);
        }
        if (file.content[0] === "\n") {
          file.content = file.content.slice(1);
        }
      }
      excerpt(file, opts);
      if (opts.sections === true || typeof opts.section === "function") {
        sections(file, opts.section);
      }
      return file;
    }
    matter.engines = engines2;
    matter.stringify = function(file, data, options2) {
      if (typeof file === "string")
        file = matter(file, options2);
      return stringify(file, data, options2);
    };
    matter.read = function(filepath, options2) {
      const str = fs2.readFileSync(filepath, "utf8");
      const file = matter(str, options2);
      file.path = filepath;
      return file;
    };
    matter.test = function(str, options2) {
      return utils.startsWith(str, defaults2(options2).delimiters[0]);
    };
    matter.language = function(str, options2) {
      const opts = defaults2(options2);
      const open2 = opts.delimiters[0];
      if (matter.test(str)) {
        str = str.slice(open2.length);
      }
      const language = str.slice(0, str.search(/\r?\n/));
      return {
        raw: language,
        name: language ? language.trim() : ""
      };
    };
    matter.cache = {};
    matter.clearCache = function() {
      matter.cache = {};
    };
    module2.exports = matter;
  }
});

// node_modules/bluebird/js/release/es5.js
var require_es5 = __commonJS({
  "node_modules/bluebird/js/release/es5.js"(exports2, module2) {
    init_shims();
    var isES5 = function() {
      "use strict";
      return this === void 0;
    }();
    if (isES5) {
      module2.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5,
        propertyIsWritable: function(obj, prop) {
          var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
          return !!(!descriptor || descriptor.writable || descriptor.set);
        }
      };
    } else {
      has = {}.hasOwnProperty;
      str = {}.toString;
      proto = {}.constructor.prototype;
      ObjectKeys = function(o) {
        var ret2 = [];
        for (var key in o) {
          if (has.call(o, key)) {
            ret2.push(key);
          }
        }
        return ret2;
      };
      ObjectGetDescriptor = function(o, key) {
        return { value: o[key] };
      };
      ObjectDefineProperty = function(o, key, desc) {
        o[key] = desc.value;
        return o;
      };
      ObjectFreeze = function(obj) {
        return obj;
      };
      ObjectGetPrototypeOf = function(obj) {
        try {
          return Object(obj).constructor.prototype;
        } catch (e) {
          return proto;
        }
      };
      ArrayIsArray = function(obj) {
        try {
          return str.call(obj) === "[object Array]";
        } catch (e) {
          return false;
        }
      };
      module2.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5,
        propertyIsWritable: function() {
          return true;
        }
      };
    }
    var has;
    var str;
    var proto;
    var ObjectKeys;
    var ObjectGetDescriptor;
    var ObjectDefineProperty;
    var ObjectFreeze;
    var ObjectGetPrototypeOf;
    var ArrayIsArray;
  }
});

// node_modules/bluebird/js/release/util.js
var require_util = __commonJS({
  "node_modules/bluebird/js/release/util.js"(exports, module) {
    init_shims();
    "use strict";
    var es5 = require_es5();
    var canEvaluate = typeof navigator == "undefined";
    var errorObj = { e: {} };
    var tryCatchTarget;
    var globalObject = typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : exports !== void 0 ? exports : null;
    function tryCatcher() {
      try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
      } catch (e) {
        errorObj.e = e;
        return errorObj;
      }
    }
    function tryCatch(fn) {
      tryCatchTarget = fn;
      return tryCatcher;
    }
    var inherits = function(Child, Parent) {
      var hasProp = {}.hasOwnProperty;
      function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
          if (hasProp.call(Parent.prototype, propertyName) && propertyName.charAt(propertyName.length - 1) !== "$") {
            this[propertyName + "$"] = Parent.prototype[propertyName];
          }
        }
      }
      T.prototype = Parent.prototype;
      Child.prototype = new T();
      return Child.prototype;
    };
    function isPrimitive(val) {
      return val == null || val === true || val === false || typeof val === "string" || typeof val === "number";
    }
    function isObject(value) {
      return typeof value === "function" || typeof value === "object" && value !== null;
    }
    function maybeWrapAsError(maybeError) {
      if (!isPrimitive(maybeError))
        return maybeError;
      return new Error(safeToString(maybeError));
    }
    function withAppended(target, appendee) {
      var len = target.length;
      var ret2 = new Array(len + 1);
      var i;
      for (i = 0; i < len; ++i) {
        ret2[i] = target[i];
      }
      ret2[i] = appendee;
      return ret2;
    }
    function getDataPropertyOrDefault(obj, key, defaultValue) {
      if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);
        if (desc != null) {
          return desc.get == null && desc.set == null ? desc.value : defaultValue;
        }
      } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : void 0;
      }
    }
    function notEnumerableProp(obj, name, value) {
      if (isPrimitive(obj))
        return obj;
      var descriptor = {
        value,
        configurable: true,
        enumerable: false,
        writable: true
      };
      es5.defineProperty(obj, name, descriptor);
      return obj;
    }
    function thrower(r) {
      throw r;
    }
    var inheritedDataKeys = function() {
      var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
      ];
      var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
          if (excludedPrototypes[i] === val) {
            return true;
          }
        }
        return false;
      };
      if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
          var ret2 = [];
          var visitedKeys = Object.create(null);
          while (obj != null && !isExcludedProto(obj)) {
            var keys;
            try {
              keys = getKeys(obj);
            } catch (e) {
              return ret2;
            }
            for (var i = 0; i < keys.length; ++i) {
              var key = keys[i];
              if (visitedKeys[key])
                continue;
              visitedKeys[key] = true;
              var desc = Object.getOwnPropertyDescriptor(obj, key);
              if (desc != null && desc.get == null && desc.set == null) {
                ret2.push(key);
              }
            }
            obj = es5.getPrototypeOf(obj);
          }
          return ret2;
        };
      } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
          if (isExcludedProto(obj))
            return [];
          var ret2 = [];
          enumeration:
            for (var key in obj) {
              if (hasProp.call(obj, key)) {
                ret2.push(key);
              } else {
                for (var i = 0; i < excludedPrototypes.length; ++i) {
                  if (hasProp.call(excludedPrototypes[i], key)) {
                    continue enumeration;
                  }
                }
                ret2.push(key);
              }
            }
          return ret2;
        };
      }
    }();
    var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
    function isClass(fn) {
      try {
        if (typeof fn === "function") {
          var keys = es5.names(fn.prototype);
          var hasMethods = es5.isES5 && keys.length > 1;
          var hasMethodsOtherThanConstructor = keys.length > 0 && !(keys.length === 1 && keys[0] === "constructor");
          var hasThisAssignmentAndStaticMethods = thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;
          if (hasMethods || hasMethodsOtherThanConstructor || hasThisAssignmentAndStaticMethods) {
            return true;
          }
        }
        return false;
      } catch (e) {
        return false;
      }
    }
    function toFastProperties(obj) {
      function FakeConstructor() {
      }
      FakeConstructor.prototype = obj;
      var receiver = new FakeConstructor();
      function ic() {
        return typeof receiver.foo;
      }
      ic();
      ic();
      return obj;
      eval(obj);
    }
    var rident = /^[a-z$_][a-z$_0-9]*$/i;
    function isIdentifier(str) {
      return rident.test(str);
    }
    function filledRange(count, prefix, suffix) {
      var ret2 = new Array(count);
      for (var i = 0; i < count; ++i) {
        ret2[i] = prefix + i + suffix;
      }
      return ret2;
    }
    function safeToString(obj) {
      try {
        return obj + "";
      } catch (e) {
        return "[no string representation]";
      }
    }
    function isError(obj) {
      return obj instanceof Error || obj !== null && typeof obj === "object" && typeof obj.message === "string" && typeof obj.name === "string";
    }
    function markAsOriginatingFromRejection(e) {
      try {
        notEnumerableProp(e, "isOperational", true);
      } catch (ignore) {
      }
    }
    function originatesFromRejection(e) {
      if (e == null)
        return false;
      return e instanceof Error["__BluebirdErrorTypes__"].OperationalError || e["isOperational"] === true;
    }
    function canAttachTrace(obj) {
      return isError(obj) && es5.propertyIsWritable(obj, "stack");
    }
    var ensureErrorObject = function() {
      if (!("stack" in new Error())) {
        return function(value) {
          if (canAttachTrace(value))
            return value;
          try {
            throw new Error(safeToString(value));
          } catch (err) {
            return err;
          }
        };
      } else {
        return function(value) {
          if (canAttachTrace(value))
            return value;
          return new Error(safeToString(value));
        };
      }
    }();
    function classString(obj) {
      return {}.toString.call(obj);
    }
    function copyDescriptors(from, to, filter) {
      var keys = es5.names(from);
      for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
          try {
            es5.defineProperty(to, key, es5.getDescriptor(from, key));
          } catch (ignore) {
          }
        }
      }
    }
    var asArray = function(v) {
      if (es5.isArray(v)) {
        return v;
      }
      return null;
    };
    if (typeof Symbol !== "undefined" && Symbol.iterator) {
      ArrayFrom = typeof Array.from === "function" ? function(v) {
        return Array.from(v);
      } : function(v) {
        var ret2 = [];
        var it = v[Symbol.iterator]();
        var itResult;
        while (!(itResult = it.next()).done) {
          ret2.push(itResult.value);
        }
        return ret2;
      };
      asArray = function(v) {
        if (es5.isArray(v)) {
          return v;
        } else if (v != null && typeof v[Symbol.iterator] === "function") {
          return ArrayFrom(v);
        }
        return null;
      };
    }
    var ArrayFrom;
    var isNode = typeof process !== "undefined" && classString(process).toLowerCase() === "[object process]";
    var hasEnvVariables = typeof process !== "undefined" && typeof process.env !== "undefined";
    function env(key) {
      return hasEnvVariables ? process.env[key] : void 0;
    }
    function getNativePromise() {
      if (typeof Promise === "function") {
        try {
          var promise = new Promise(function() {
          });
          if (classString(promise) === "[object Promise]") {
            return Promise;
          }
        } catch (e) {
        }
      }
    }
    var reflectHandler;
    function contextBind(ctx, cb) {
      if (ctx === null || typeof cb !== "function" || cb === reflectHandler) {
        return cb;
      }
      if (ctx.domain !== null) {
        cb = ctx.domain.bind(cb);
      }
      var async = ctx.async;
      if (async !== null) {
        var old = cb;
        cb = function() {
          var $_len = arguments.length + 2;
          var args = new Array($_len);
          for (var $_i = 2; $_i < $_len; ++$_i) {
            args[$_i] = arguments[$_i - 2];
          }
          ;
          args[0] = old;
          args[1] = this;
          return async.runInAsyncScope.apply(async, args);
        };
      }
      return cb;
    }
    var ret = {
      setReflectHandler: function(fn) {
        reflectHandler = fn;
      },
      isClass,
      isIdentifier,
      inheritedDataKeys,
      getDataPropertyOrDefault,
      thrower,
      isArray: es5.isArray,
      asArray,
      notEnumerableProp,
      isPrimitive,
      isObject,
      isError,
      canEvaluate,
      errorObj,
      tryCatch,
      inherits,
      withAppended,
      maybeWrapAsError,
      toFastProperties,
      filledRange,
      toString: safeToString,
      canAttachTrace,
      ensureErrorObject,
      originatesFromRejection,
      markAsOriginatingFromRejection,
      classString,
      copyDescriptors,
      isNode,
      hasEnvVariables,
      env,
      global: globalObject,
      getNativePromise,
      contextBind
    };
    ret.isRecentNode = ret.isNode && function() {
      var version;
      if (process.versions && process.versions.node) {
        version = process.versions.node.split(".").map(Number);
      } else if (process.version) {
        version = process.version.split(".").map(Number);
      }
      return version[0] === 0 && version[1] > 10 || version[0] > 0;
    }();
    ret.nodeSupportsAsyncResource = ret.isNode && function() {
      var supportsAsync = false;
      try {
        var res2 = require("async_hooks").AsyncResource;
        supportsAsync = typeof res2.prototype.runInAsyncScope === "function";
      } catch (e) {
        supportsAsync = false;
      }
      return supportsAsync;
    }();
    if (ret.isNode)
      ret.toFastProperties(process);
    try {
      throw new Error();
    } catch (e) {
      ret.lastLineError = e;
    }
    module.exports = ret;
  }
});

// node_modules/bluebird/js/release/schedule.js
var require_schedule = __commonJS({
  "node_modules/bluebird/js/release/schedule.js"(exports2, module2) {
    init_shims();
    "use strict";
    var util = require_util();
    var schedule;
    var noAsyncScheduler = function() {
      throw new Error("No async scheduler available\n\n    See http://goo.gl/MqrFmX\n");
    };
    var NativePromise = util.getNativePromise();
    if (util.isNode && typeof MutationObserver === "undefined") {
      GlobalSetImmediate = global.setImmediate;
      ProcessNextTick = process.nextTick;
      schedule = util.isRecentNode ? function(fn) {
        GlobalSetImmediate.call(global, fn);
      } : function(fn) {
        ProcessNextTick.call(process, fn);
      };
    } else if (typeof NativePromise === "function" && typeof NativePromise.resolve === "function") {
      nativePromise = NativePromise.resolve();
      schedule = function(fn) {
        nativePromise.then(fn);
      };
    } else if (typeof MutationObserver !== "undefined" && !(typeof window !== "undefined" && window.navigator && (window.navigator.standalone || window.cordova)) && "classList" in document.documentElement) {
      schedule = function() {
        var div = document.createElement("div");
        var opts = { attributes: true };
        var toggleScheduled = false;
        var div2 = document.createElement("div");
        var o2 = new MutationObserver(function() {
          div.classList.toggle("foo");
          toggleScheduled = false;
        });
        o2.observe(div2, opts);
        var scheduleToggle = function() {
          if (toggleScheduled)
            return;
          toggleScheduled = true;
          div2.classList.toggle("foo");
        };
        return function schedule2(fn) {
          var o = new MutationObserver(function() {
            o.disconnect();
            fn();
          });
          o.observe(div, opts);
          scheduleToggle();
        };
      }();
    } else if (typeof setImmediate !== "undefined") {
      schedule = function(fn) {
        setImmediate(fn);
      };
    } else if (typeof setTimeout !== "undefined") {
      schedule = function(fn) {
        setTimeout(fn, 0);
      };
    } else {
      schedule = noAsyncScheduler;
    }
    var GlobalSetImmediate;
    var ProcessNextTick;
    var nativePromise;
    module2.exports = schedule;
  }
});

// node_modules/bluebird/js/release/queue.js
var require_queue = __commonJS({
  "node_modules/bluebird/js/release/queue.js"(exports2, module2) {
    init_shims();
    "use strict";
    function arrayMove(src2, srcIndex, dst, dstIndex, len) {
      for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src2[j + srcIndex];
        src2[j + srcIndex] = void 0;
      }
    }
    function Queue(capacity) {
      this._capacity = capacity;
      this._length = 0;
      this._front = 0;
    }
    Queue.prototype._willBeOverCapacity = function(size) {
      return this._capacity < size;
    };
    Queue.prototype._pushOne = function(arg) {
      var length = this.length();
      this._checkCapacity(length + 1);
      var i = this._front + length & this._capacity - 1;
      this[i] = arg;
      this._length = length + 1;
    };
    Queue.prototype.push = function(fn, receiver, arg) {
      var length = this.length() + 3;
      if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
      }
      var j = this._front + length - 3;
      this._checkCapacity(length);
      var wrapMask = this._capacity - 1;
      this[j + 0 & wrapMask] = fn;
      this[j + 1 & wrapMask] = receiver;
      this[j + 2 & wrapMask] = arg;
      this._length = length;
    };
    Queue.prototype.shift = function() {
      var front = this._front, ret2 = this[front];
      this[front] = void 0;
      this._front = front + 1 & this._capacity - 1;
      this._length--;
      return ret2;
    };
    Queue.prototype.length = function() {
      return this._length;
    };
    Queue.prototype._checkCapacity = function(size) {
      if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
      }
    };
    Queue.prototype._resizeTo = function(capacity) {
      var oldCapacity = this._capacity;
      this._capacity = capacity;
      var front = this._front;
      var length = this._length;
      var moveItemsCount = front + length & oldCapacity - 1;
      arrayMove(this, 0, this, oldCapacity, moveItemsCount);
    };
    module2.exports = Queue;
  }
});

// node_modules/bluebird/js/release/async.js
var require_async = __commonJS({
  "node_modules/bluebird/js/release/async.js"(exports2, module2) {
    init_shims();
    "use strict";
    var firstLineError;
    try {
      throw new Error();
    } catch (e) {
      firstLineError = e;
    }
    var schedule = require_schedule();
    var Queue = require_queue();
    function Async() {
      this._customScheduler = false;
      this._isTickUsed = false;
      this._lateQueue = new Queue(16);
      this._normalQueue = new Queue(16);
      this._haveDrainedQueues = false;
      var self2 = this;
      this.drainQueues = function() {
        self2._drainQueues();
      };
      this._schedule = schedule;
    }
    Async.prototype.setScheduler = function(fn) {
      var prev = this._schedule;
      this._schedule = fn;
      this._customScheduler = true;
      return prev;
    };
    Async.prototype.hasCustomScheduler = function() {
      return this._customScheduler;
    };
    Async.prototype.haveItemsQueued = function() {
      return this._isTickUsed || this._haveDrainedQueues;
    };
    Async.prototype.fatalError = function(e, isNode2) {
      if (isNode2) {
        process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e) + "\n");
        process.exit(2);
      } else {
        this.throwLater(e);
      }
    };
    Async.prototype.throwLater = function(fn, arg) {
      if (arguments.length === 1) {
        arg = fn;
        fn = function() {
          throw arg;
        };
      }
      if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
          fn(arg);
        }, 0);
      } else
        try {
          this._schedule(function() {
            fn(arg);
          });
        } catch (e) {
          throw new Error("No async scheduler available\n\n    See http://goo.gl/MqrFmX\n");
        }
    };
    function AsyncInvokeLater(fn, receiver, arg) {
      this._lateQueue.push(fn, receiver, arg);
      this._queueTick();
    }
    function AsyncInvoke(fn, receiver, arg) {
      this._normalQueue.push(fn, receiver, arg);
      this._queueTick();
    }
    function AsyncSettlePromises(promise) {
      this._normalQueue._pushOne(promise);
      this._queueTick();
    }
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
    function _drainQueue(queue) {
      while (queue.length() > 0) {
        _drainQueueStep(queue);
      }
    }
    function _drainQueueStep(queue) {
      var fn = queue.shift();
      if (typeof fn !== "function") {
        fn._settlePromises();
      } else {
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
      }
    }
    Async.prototype._drainQueues = function() {
      _drainQueue(this._normalQueue);
      this._reset();
      this._haveDrainedQueues = true;
      _drainQueue(this._lateQueue);
    };
    Async.prototype._queueTick = function() {
      if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
      }
    };
    Async.prototype._reset = function() {
      this._isTickUsed = false;
    };
    module2.exports = Async;
    module2.exports.firstLineError = firstLineError;
  }
});

// node_modules/bluebird/js/release/errors.js
var require_errors = __commonJS({
  "node_modules/bluebird/js/release/errors.js"(exports2, module2) {
    init_shims();
    "use strict";
    var es52 = require_es5();
    var Objectfreeze = es52.freeze;
    var util = require_util();
    var inherits2 = util.inherits;
    var notEnumerableProp2 = util.notEnumerableProp;
    function subError(nameProperty, defaultMessage) {
      function SubError(message) {
        if (!(this instanceof SubError))
          return new SubError(message);
        notEnumerableProp2(this, "message", typeof message === "string" ? message : defaultMessage);
        notEnumerableProp2(this, "name", nameProperty);
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, this.constructor);
        } else {
          Error.call(this);
        }
      }
      inherits2(SubError, Error);
      return SubError;
    }
    var _TypeError;
    var _RangeError;
    var Warning = subError("Warning", "warning");
    var CancellationError = subError("CancellationError", "cancellation error");
    var TimeoutError = subError("TimeoutError", "timeout error");
    var AggregateError = subError("AggregateError", "aggregate error");
    try {
      _TypeError = TypeError;
      _RangeError = RangeError;
    } catch (e) {
      _TypeError = subError("TypeError", "type error");
      _RangeError = subError("RangeError", "range error");
    }
    var methods = "join pop push shift unshift slice filter forEach some every map indexOf lastIndexOf reduce reduceRight sort reverse".split(" ");
    for (var i = 0; i < methods.length; ++i) {
      if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
      }
    }
    es52.defineProperty(AggregateError.prototype, "length", {
      value: 0,
      configurable: false,
      writable: true,
      enumerable: true
    });
    AggregateError.prototype["isOperational"] = true;
    var level = 0;
    AggregateError.prototype.toString = function() {
      var indent = Array(level * 4 + 1).join(" ");
      var ret2 = "\n" + indent + "AggregateError of:\n";
      level++;
      indent = Array(level * 4 + 1).join(" ");
      for (var i2 = 0; i2 < this.length; ++i2) {
        var str = this[i2] === this ? "[Circular AggregateError]" : this[i2] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
          lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret2 += str + "\n";
      }
      level--;
      return ret2;
    };
    function OperationalError(message) {
      if (!(this instanceof OperationalError))
        return new OperationalError(message);
      notEnumerableProp2(this, "name", "OperationalError");
      notEnumerableProp2(this, "message", message);
      this.cause = message;
      this["isOperational"] = true;
      if (message instanceof Error) {
        notEnumerableProp2(this, "message", message.message);
        notEnumerableProp2(this, "stack", message.stack);
      } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
    inherits2(OperationalError, Error);
    var errorTypes = Error["__BluebirdErrorTypes__"];
    if (!errorTypes) {
      errorTypes = Objectfreeze({
        CancellationError,
        TimeoutError,
        OperationalError,
        RejectionError: OperationalError,
        AggregateError
      });
      es52.defineProperty(Error, "__BluebirdErrorTypes__", {
        value: errorTypes,
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
    module2.exports = {
      Error,
      TypeError: _TypeError,
      RangeError: _RangeError,
      CancellationError: errorTypes.CancellationError,
      OperationalError: errorTypes.OperationalError,
      TimeoutError: errorTypes.TimeoutError,
      AggregateError: errorTypes.AggregateError,
      Warning
    };
  }
});

// node_modules/bluebird/js/release/thenables.js
var require_thenables = __commonJS({
  "node_modules/bluebird/js/release/thenables.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, INTERNAL) {
      var util = require_util();
      var errorObj2 = util.errorObj;
      var isObject2 = util.isObject;
      function tryConvertToPromise(obj, context) {
        if (isObject2(obj)) {
          if (obj instanceof Promise2)
            return obj;
          var then = getThen(obj);
          if (then === errorObj2) {
            if (context)
              context._pushContext();
            var ret2 = Promise2.reject(then.e);
            if (context)
              context._popContext();
            return ret2;
          } else if (typeof then === "function") {
            if (isAnyBluebirdPromise(obj)) {
              var ret2 = new Promise2(INTERNAL);
              obj._then(ret2._fulfill, ret2._reject, void 0, ret2, null);
              return ret2;
            }
            return doThenable(obj, then, context);
          }
        }
        return obj;
      }
      function doGetThen(obj) {
        return obj.then;
      }
      function getThen(obj) {
        try {
          return doGetThen(obj);
        } catch (e) {
          errorObj2.e = e;
          return errorObj2;
        }
      }
      var hasProp = {}.hasOwnProperty;
      function isAnyBluebirdPromise(obj) {
        try {
          return hasProp.call(obj, "_promise0");
        } catch (e) {
          return false;
        }
      }
      function doThenable(x, then, context) {
        var promise = new Promise2(INTERNAL);
        var ret2 = promise;
        if (context)
          context._pushContext();
        promise._captureStackTrace();
        if (context)
          context._popContext();
        var synchronous = true;
        var result = util.tryCatch(then).call(x, resolve2, reject);
        synchronous = false;
        if (promise && result === errorObj2) {
          promise._rejectCallback(result.e, true, true);
          promise = null;
        }
        function resolve2(value) {
          if (!promise)
            return;
          promise._resolveCallback(value);
          promise = null;
        }
        function reject(reason) {
          if (!promise)
            return;
          promise._rejectCallback(reason, synchronous, true);
          promise = null;
        }
        return ret2;
      }
      return tryConvertToPromise;
    };
  }
});

// node_modules/bluebird/js/release/promise_array.js
var require_promise_array = __commonJS({
  "node_modules/bluebird/js/release/promise_array.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, INTERNAL, tryConvertToPromise, apiRejection, Proxyable) {
      var util = require_util();
      var isArray = util.isArray;
      function toResolutionValue(val) {
        switch (val) {
          case -2:
            return [];
          case -3:
            return {};
          case -6:
            return new Map();
        }
      }
      function PromiseArray(values) {
        var promise = this._promise = new Promise2(INTERNAL);
        if (values instanceof Promise2) {
          promise._propagateFrom(values, 3);
          values.suppressUnhandledRejections();
        }
        promise._setOnCancel(this);
        this._values = values;
        this._length = 0;
        this._totalResolved = 0;
        this._init(void 0, -2);
      }
      util.inherits(PromiseArray, Proxyable);
      PromiseArray.prototype.length = function() {
        return this._length;
      };
      PromiseArray.prototype.promise = function() {
        return this._promise;
      };
      PromiseArray.prototype._init = function init2(_, resolveValueIfEmpty) {
        var values = tryConvertToPromise(this._values, this._promise);
        if (values instanceof Promise2) {
          values = values._target();
          var bitField = values._bitField;
          ;
          this._values = values;
          if ((bitField & 50397184) === 0) {
            this._promise._setAsyncGuaranteed();
            return values._then(init2, this._reject, void 0, this, resolveValueIfEmpty);
          } else if ((bitField & 33554432) !== 0) {
            values = values._value();
          } else if ((bitField & 16777216) !== 0) {
            return this._reject(values._reason());
          } else {
            return this._cancel();
          }
        }
        values = util.asArray(values);
        if (values === null) {
          var err = apiRejection("expecting an array or an iterable object but got " + util.classString(values)).reason();
          this._promise._rejectCallback(err, false);
          return;
        }
        if (values.length === 0) {
          if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
          } else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
          }
          return;
        }
        this._iterate(values);
      };
      PromiseArray.prototype._iterate = function(values) {
        var len = this.getActualLength(values.length);
        this._length = len;
        this._values = this.shouldCopyValues() ? new Array(len) : this._values;
        var result = this._promise;
        var isResolved = false;
        var bitField = null;
        for (var i = 0; i < len; ++i) {
          var maybePromise = tryConvertToPromise(values[i], result);
          if (maybePromise instanceof Promise2) {
            maybePromise = maybePromise._target();
            bitField = maybePromise._bitField;
          } else {
            bitField = null;
          }
          if (isResolved) {
            if (bitField !== null) {
              maybePromise.suppressUnhandledRejections();
            }
          } else if (bitField !== null) {
            if ((bitField & 50397184) === 0) {
              maybePromise._proxy(this, i);
              this._values[i] = maybePromise;
            } else if ((bitField & 33554432) !== 0) {
              isResolved = this._promiseFulfilled(maybePromise._value(), i);
            } else if ((bitField & 16777216) !== 0) {
              isResolved = this._promiseRejected(maybePromise._reason(), i);
            } else {
              isResolved = this._promiseCancelled(i);
            }
          } else {
            isResolved = this._promiseFulfilled(maybePromise, i);
          }
        }
        if (!isResolved)
          result._setAsyncGuaranteed();
      };
      PromiseArray.prototype._isResolved = function() {
        return this._values === null;
      };
      PromiseArray.prototype._resolve = function(value) {
        this._values = null;
        this._promise._fulfill(value);
      };
      PromiseArray.prototype._cancel = function() {
        if (this._isResolved() || !this._promise._isCancellable())
          return;
        this._values = null;
        this._promise._cancel();
      };
      PromiseArray.prototype._reject = function(reason) {
        this._values = null;
        this._promise._rejectCallback(reason, false);
      };
      PromiseArray.prototype._promiseFulfilled = function(value, index2) {
        this._values[index2] = value;
        var totalResolved = ++this._totalResolved;
        if (totalResolved >= this._length) {
          this._resolve(this._values);
          return true;
        }
        return false;
      };
      PromiseArray.prototype._promiseCancelled = function() {
        this._cancel();
        return true;
      };
      PromiseArray.prototype._promiseRejected = function(reason) {
        this._totalResolved++;
        this._reject(reason);
        return true;
      };
      PromiseArray.prototype._resultCancelled = function() {
        if (this._isResolved())
          return;
        var values = this._values;
        this._cancel();
        if (values instanceof Promise2) {
          values.cancel();
        } else {
          for (var i = 0; i < values.length; ++i) {
            if (values[i] instanceof Promise2) {
              values[i].cancel();
            }
          }
        }
      };
      PromiseArray.prototype.shouldCopyValues = function() {
        return true;
      };
      PromiseArray.prototype.getActualLength = function(len) {
        return len;
      };
      return PromiseArray;
    };
  }
});

// node_modules/bluebird/js/release/context.js
var require_context = __commonJS({
  "node_modules/bluebird/js/release/context.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2) {
      var longStackTraces = false;
      var contextStack = [];
      Promise2.prototype._promiseCreated = function() {
      };
      Promise2.prototype._pushContext = function() {
      };
      Promise2.prototype._popContext = function() {
        return null;
      };
      Promise2._peekContext = Promise2.prototype._peekContext = function() {
      };
      function Context() {
        this._trace = new Context.CapturedTrace(peekContext());
      }
      Context.prototype._pushContext = function() {
        if (this._trace !== void 0) {
          this._trace._promiseCreated = null;
          contextStack.push(this._trace);
        }
      };
      Context.prototype._popContext = function() {
        if (this._trace !== void 0) {
          var trace = contextStack.pop();
          var ret2 = trace._promiseCreated;
          trace._promiseCreated = null;
          return ret2;
        }
        return null;
      };
      function createContext() {
        if (longStackTraces)
          return new Context();
      }
      function peekContext() {
        var lastIndex = contextStack.length - 1;
        if (lastIndex >= 0) {
          return contextStack[lastIndex];
        }
        return void 0;
      }
      Context.CapturedTrace = null;
      Context.create = createContext;
      Context.deactivateLongStackTraces = function() {
      };
      Context.activateLongStackTraces = function() {
        var Promise_pushContext = Promise2.prototype._pushContext;
        var Promise_popContext = Promise2.prototype._popContext;
        var Promise_PeekContext = Promise2._peekContext;
        var Promise_peekContext = Promise2.prototype._peekContext;
        var Promise_promiseCreated = Promise2.prototype._promiseCreated;
        Context.deactivateLongStackTraces = function() {
          Promise2.prototype._pushContext = Promise_pushContext;
          Promise2.prototype._popContext = Promise_popContext;
          Promise2._peekContext = Promise_PeekContext;
          Promise2.prototype._peekContext = Promise_peekContext;
          Promise2.prototype._promiseCreated = Promise_promiseCreated;
          longStackTraces = false;
        };
        longStackTraces = true;
        Promise2.prototype._pushContext = Context.prototype._pushContext;
        Promise2.prototype._popContext = Context.prototype._popContext;
        Promise2._peekContext = Promise2.prototype._peekContext = peekContext;
        Promise2.prototype._promiseCreated = function() {
          var ctx = this._peekContext();
          if (ctx && ctx._promiseCreated == null)
            ctx._promiseCreated = this;
        };
      };
      return Context;
    };
  }
});

// node_modules/bluebird/js/release/debuggability.js
var require_debuggability = __commonJS({
  "node_modules/bluebird/js/release/debuggability.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, Context, enableAsyncHooks, disableAsyncHooks) {
      var async = Promise2._async;
      var Warning = require_errors().Warning;
      var util = require_util();
      var es52 = require_es5();
      var canAttachTrace2 = util.canAttachTrace;
      var unhandledRejectionHandled;
      var possiblyUnhandledRejection;
      var bluebirdFramePattern = /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;
      var nodeFramePattern = /\((?:timers\.js):\d+:\d+\)/;
      var parseLinePattern = /[\/<\(](.+?):(\d+):(\d+)\)?\s*$/;
      var stackFramePattern = null;
      var formatStack = null;
      var indentStackFrames = false;
      var printWarning;
      var debugging = !!(util.env("BLUEBIRD_DEBUG") != 0 && (util.env("BLUEBIRD_DEBUG") || util.env("NODE_ENV") === "development"));
      var warnings = !!(util.env("BLUEBIRD_WARNINGS") != 0 && (debugging || util.env("BLUEBIRD_WARNINGS")));
      var longStackTraces = !!(util.env("BLUEBIRD_LONG_STACK_TRACES") != 0 && (debugging || util.env("BLUEBIRD_LONG_STACK_TRACES")));
      var wForgottenReturn = util.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 && (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));
      var deferUnhandledRejectionCheck;
      (function() {
        var promises = [];
        function unhandledRejectionCheck() {
          for (var i = 0; i < promises.length; ++i) {
            promises[i]._notifyUnhandledRejection();
          }
          unhandledRejectionClear();
        }
        function unhandledRejectionClear() {
          promises.length = 0;
        }
        deferUnhandledRejectionCheck = function(promise) {
          promises.push(promise);
          setTimeout(unhandledRejectionCheck, 1);
        };
        es52.defineProperty(Promise2, "_unhandledRejectionCheck", {
          value: unhandledRejectionCheck
        });
        es52.defineProperty(Promise2, "_unhandledRejectionClear", {
          value: unhandledRejectionClear
        });
      })();
      Promise2.prototype.suppressUnhandledRejections = function() {
        var target = this._target();
        target._bitField = target._bitField & ~1048576 | 524288;
      };
      Promise2.prototype._ensurePossibleRejectionHandled = function() {
        if ((this._bitField & 524288) !== 0)
          return;
        this._setRejectionIsUnhandled();
        deferUnhandledRejectionCheck(this);
      };
      Promise2.prototype._notifyUnhandledRejectionIsHandled = function() {
        fireRejectionEvent("rejectionHandled", unhandledRejectionHandled, void 0, this);
      };
      Promise2.prototype._setReturnedNonUndefined = function() {
        this._bitField = this._bitField | 268435456;
      };
      Promise2.prototype._returnedNonUndefined = function() {
        return (this._bitField & 268435456) !== 0;
      };
      Promise2.prototype._notifyUnhandledRejection = function() {
        if (this._isRejectionUnhandled()) {
          var reason = this._settledValue();
          this._setUnhandledRejectionIsNotified();
          fireRejectionEvent("unhandledRejection", possiblyUnhandledRejection, reason, this);
        }
      };
      Promise2.prototype._setUnhandledRejectionIsNotified = function() {
        this._bitField = this._bitField | 262144;
      };
      Promise2.prototype._unsetUnhandledRejectionIsNotified = function() {
        this._bitField = this._bitField & ~262144;
      };
      Promise2.prototype._isUnhandledRejectionNotified = function() {
        return (this._bitField & 262144) > 0;
      };
      Promise2.prototype._setRejectionIsUnhandled = function() {
        this._bitField = this._bitField | 1048576;
      };
      Promise2.prototype._unsetRejectionIsUnhandled = function() {
        this._bitField = this._bitField & ~1048576;
        if (this._isUnhandledRejectionNotified()) {
          this._unsetUnhandledRejectionIsNotified();
          this._notifyUnhandledRejectionIsHandled();
        }
      };
      Promise2.prototype._isRejectionUnhandled = function() {
        return (this._bitField & 1048576) > 0;
      };
      Promise2.prototype._warn = function(message, shouldUseOwnTrace, promise) {
        return warn(message, shouldUseOwnTrace, promise || this);
      };
      Promise2.onPossiblyUnhandledRejection = function(fn) {
        var context = Promise2._getContext();
        possiblyUnhandledRejection = util.contextBind(context, fn);
      };
      Promise2.onUnhandledRejectionHandled = function(fn) {
        var context = Promise2._getContext();
        unhandledRejectionHandled = util.contextBind(context, fn);
      };
      var disableLongStackTraces = function() {
      };
      Promise2.longStackTraces = function() {
        if (async.haveItemsQueued() && !config.longStackTraces) {
          throw new Error("cannot enable long stack traces after promises have been created\n\n    See http://goo.gl/MqrFmX\n");
        }
        if (!config.longStackTraces && longStackTracesIsSupported()) {
          var Promise_captureStackTrace = Promise2.prototype._captureStackTrace;
          var Promise_attachExtraTrace = Promise2.prototype._attachExtraTrace;
          var Promise_dereferenceTrace = Promise2.prototype._dereferenceTrace;
          config.longStackTraces = true;
          disableLongStackTraces = function() {
            if (async.haveItemsQueued() && !config.longStackTraces) {
              throw new Error("cannot enable long stack traces after promises have been created\n\n    See http://goo.gl/MqrFmX\n");
            }
            Promise2.prototype._captureStackTrace = Promise_captureStackTrace;
            Promise2.prototype._attachExtraTrace = Promise_attachExtraTrace;
            Promise2.prototype._dereferenceTrace = Promise_dereferenceTrace;
            Context.deactivateLongStackTraces();
            config.longStackTraces = false;
          };
          Promise2.prototype._captureStackTrace = longStackTracesCaptureStackTrace;
          Promise2.prototype._attachExtraTrace = longStackTracesAttachExtraTrace;
          Promise2.prototype._dereferenceTrace = longStackTracesDereferenceTrace;
          Context.activateLongStackTraces();
        }
      };
      Promise2.hasLongStackTraces = function() {
        return config.longStackTraces && longStackTracesIsSupported();
      };
      var legacyHandlers = {
        unhandledrejection: {
          before: function() {
            var ret2 = util.global.onunhandledrejection;
            util.global.onunhandledrejection = null;
            return ret2;
          },
          after: function(fn) {
            util.global.onunhandledrejection = fn;
          }
        },
        rejectionhandled: {
          before: function() {
            var ret2 = util.global.onrejectionhandled;
            util.global.onrejectionhandled = null;
            return ret2;
          },
          after: function(fn) {
            util.global.onrejectionhandled = fn;
          }
        }
      };
      var fireDomEvent = function() {
        var dispatch = function(legacy, e) {
          if (legacy) {
            var fn;
            try {
              fn = legacy.before();
              return !util.global.dispatchEvent(e);
            } finally {
              legacy.after(fn);
            }
          } else {
            return !util.global.dispatchEvent(e);
          }
        };
        try {
          if (typeof CustomEvent === "function") {
            var event = new CustomEvent("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event2) {
              name = name.toLowerCase();
              var eventData = {
                detail: event2,
                cancelable: true
              };
              var domEvent = new CustomEvent(name, eventData);
              es52.defineProperty(domEvent, "promise", { value: event2.promise });
              es52.defineProperty(domEvent, "reason", { value: event2.reason });
              return dispatch(legacyHandlers[name], domEvent);
            };
          } else if (typeof Event === "function") {
            var event = new Event("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event2) {
              name = name.toLowerCase();
              var domEvent = new Event(name, {
                cancelable: true
              });
              domEvent.detail = event2;
              es52.defineProperty(domEvent, "promise", { value: event2.promise });
              es52.defineProperty(domEvent, "reason", { value: event2.reason });
              return dispatch(legacyHandlers[name], domEvent);
            };
          } else {
            var event = document.createEvent("CustomEvent");
            event.initCustomEvent("testingtheevent", false, true, {});
            util.global.dispatchEvent(event);
            return function(name, event2) {
              name = name.toLowerCase();
              var domEvent = document.createEvent("CustomEvent");
              domEvent.initCustomEvent(name, false, true, event2);
              return dispatch(legacyHandlers[name], domEvent);
            };
          }
        } catch (e) {
        }
        return function() {
          return false;
        };
      }();
      var fireGlobalEvent = function() {
        if (util.isNode) {
          return function() {
            return process.emit.apply(process, arguments);
          };
        } else {
          if (!util.global) {
            return function() {
              return false;
            };
          }
          return function(name) {
            var methodName = "on" + name.toLowerCase();
            var method = util.global[methodName];
            if (!method)
              return false;
            method.apply(util.global, [].slice.call(arguments, 1));
            return true;
          };
        }
      }();
      function generatePromiseLifecycleEventObject(name, promise) {
        return { promise };
      }
      var eventToObjectGenerator = {
        promiseCreated: generatePromiseLifecycleEventObject,
        promiseFulfilled: generatePromiseLifecycleEventObject,
        promiseRejected: generatePromiseLifecycleEventObject,
        promiseResolved: generatePromiseLifecycleEventObject,
        promiseCancelled: generatePromiseLifecycleEventObject,
        promiseChained: function(name, promise, child) {
          return { promise, child };
        },
        warning: function(name, warning) {
          return { warning };
        },
        unhandledRejection: function(name, reason, promise) {
          return { reason, promise };
        },
        rejectionHandled: generatePromiseLifecycleEventObject
      };
      var activeFireEvent = function(name) {
        var globalEventFired = false;
        try {
          globalEventFired = fireGlobalEvent.apply(null, arguments);
        } catch (e) {
          async.throwLater(e);
          globalEventFired = true;
        }
        var domEventFired = false;
        try {
          domEventFired = fireDomEvent(name, eventToObjectGenerator[name].apply(null, arguments));
        } catch (e) {
          async.throwLater(e);
          domEventFired = true;
        }
        return domEventFired || globalEventFired;
      };
      Promise2.config = function(opts) {
        opts = Object(opts);
        if ("longStackTraces" in opts) {
          if (opts.longStackTraces) {
            Promise2.longStackTraces();
          } else if (!opts.longStackTraces && Promise2.hasLongStackTraces()) {
            disableLongStackTraces();
          }
        }
        if ("warnings" in opts) {
          var warningsOption = opts.warnings;
          config.warnings = !!warningsOption;
          wForgottenReturn = config.warnings;
          if (util.isObject(warningsOption)) {
            if ("wForgottenReturn" in warningsOption) {
              wForgottenReturn = !!warningsOption.wForgottenReturn;
            }
          }
        }
        if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
          if (async.haveItemsQueued()) {
            throw new Error("cannot enable cancellation after promises are in use");
          }
          Promise2.prototype._clearCancellationData = cancellationClearCancellationData;
          Promise2.prototype._propagateFrom = cancellationPropagateFrom;
          Promise2.prototype._onCancel = cancellationOnCancel;
          Promise2.prototype._setOnCancel = cancellationSetOnCancel;
          Promise2.prototype._attachCancellationCallback = cancellationAttachCancellationCallback;
          Promise2.prototype._execute = cancellationExecute;
          propagateFromFunction = cancellationPropagateFrom;
          config.cancellation = true;
        }
        if ("monitoring" in opts) {
          if (opts.monitoring && !config.monitoring) {
            config.monitoring = true;
            Promise2.prototype._fireEvent = activeFireEvent;
          } else if (!opts.monitoring && config.monitoring) {
            config.monitoring = false;
            Promise2.prototype._fireEvent = defaultFireEvent;
          }
        }
        if ("asyncHooks" in opts && util.nodeSupportsAsyncResource) {
          var prev = config.asyncHooks;
          var cur = !!opts.asyncHooks;
          if (prev !== cur) {
            config.asyncHooks = cur;
            if (cur) {
              enableAsyncHooks();
            } else {
              disableAsyncHooks();
            }
          }
        }
        return Promise2;
      };
      function defaultFireEvent() {
        return false;
      }
      Promise2.prototype._fireEvent = defaultFireEvent;
      Promise2.prototype._execute = function(executor, resolve2, reject) {
        try {
          executor(resolve2, reject);
        } catch (e) {
          return e;
        }
      };
      Promise2.prototype._onCancel = function() {
      };
      Promise2.prototype._setOnCancel = function(handler2) {
        ;
      };
      Promise2.prototype._attachCancellationCallback = function(onCancel) {
        ;
      };
      Promise2.prototype._captureStackTrace = function() {
      };
      Promise2.prototype._attachExtraTrace = function() {
      };
      Promise2.prototype._dereferenceTrace = function() {
      };
      Promise2.prototype._clearCancellationData = function() {
      };
      Promise2.prototype._propagateFrom = function(parent, flags) {
        ;
        ;
      };
      function cancellationExecute(executor, resolve2, reject) {
        var promise = this;
        try {
          executor(resolve2, reject, function(onCancel) {
            if (typeof onCancel !== "function") {
              throw new TypeError("onCancel must be a function, got: " + util.toString(onCancel));
            }
            promise._attachCancellationCallback(onCancel);
          });
        } catch (e) {
          return e;
        }
      }
      function cancellationAttachCancellationCallback(onCancel) {
        if (!this._isCancellable())
          return this;
        var previousOnCancel = this._onCancel();
        if (previousOnCancel !== void 0) {
          if (util.isArray(previousOnCancel)) {
            previousOnCancel.push(onCancel);
          } else {
            this._setOnCancel([previousOnCancel, onCancel]);
          }
        } else {
          this._setOnCancel(onCancel);
        }
      }
      function cancellationOnCancel() {
        return this._onCancelField;
      }
      function cancellationSetOnCancel(onCancel) {
        this._onCancelField = onCancel;
      }
      function cancellationClearCancellationData() {
        this._cancellationParent = void 0;
        this._onCancelField = void 0;
      }
      function cancellationPropagateFrom(parent, flags) {
        if ((flags & 1) !== 0) {
          this._cancellationParent = parent;
          var branchesRemainingToCancel = parent._branchesRemainingToCancel;
          if (branchesRemainingToCancel === void 0) {
            branchesRemainingToCancel = 0;
          }
          parent._branchesRemainingToCancel = branchesRemainingToCancel + 1;
        }
        if ((flags & 2) !== 0 && parent._isBound()) {
          this._setBoundTo(parent._boundTo);
        }
      }
      function bindingPropagateFrom(parent, flags) {
        if ((flags & 2) !== 0 && parent._isBound()) {
          this._setBoundTo(parent._boundTo);
        }
      }
      var propagateFromFunction = bindingPropagateFrom;
      function boundValueFunction() {
        var ret2 = this._boundTo;
        if (ret2 !== void 0) {
          if (ret2 instanceof Promise2) {
            if (ret2.isFulfilled()) {
              return ret2.value();
            } else {
              return void 0;
            }
          }
        }
        return ret2;
      }
      function longStackTracesCaptureStackTrace() {
        this._trace = new CapturedTrace(this._peekContext());
      }
      function longStackTracesAttachExtraTrace(error3, ignoreSelf) {
        if (canAttachTrace2(error3)) {
          var trace = this._trace;
          if (trace !== void 0) {
            if (ignoreSelf)
              trace = trace._parent;
          }
          if (trace !== void 0) {
            trace.attachExtraTrace(error3);
          } else if (!error3.__stackCleaned__) {
            var parsed = parseStackAndMessage(error3);
            util.notEnumerableProp(error3, "stack", parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error3, "__stackCleaned__", true);
          }
        }
      }
      function longStackTracesDereferenceTrace() {
        this._trace = void 0;
      }
      function checkForgottenReturns(returnValue, promiseCreated, name, promise, parent) {
        if (returnValue === void 0 && promiseCreated !== null && wForgottenReturn) {
          if (parent !== void 0 && parent._returnedNonUndefined())
            return;
          if ((promise._bitField & 65535) === 0)
            return;
          if (name)
            name = name + " ";
          var handlerLine = "";
          var creatorLine = "";
          if (promiseCreated._trace) {
            var traceLines = promiseCreated._trace.stack.split("\n");
            var stack = cleanStack(traceLines);
            for (var i = stack.length - 1; i >= 0; --i) {
              var line = stack[i];
              if (!nodeFramePattern.test(line)) {
                var lineMatches = line.match(parseLinePattern);
                if (lineMatches) {
                  handlerLine = "at " + lineMatches[1] + ":" + lineMatches[2] + ":" + lineMatches[3] + " ";
                }
                break;
              }
            }
            if (stack.length > 0) {
              var firstUserLine = stack[0];
              for (var i = 0; i < traceLines.length; ++i) {
                if (traceLines[i] === firstUserLine) {
                  if (i > 0) {
                    creatorLine = "\n" + traceLines[i - 1];
                  }
                  break;
                }
              }
            }
          }
          var msg = "a promise was created in a " + name + "handler " + handlerLine + "but was not returned from it, see http://goo.gl/rRqMUw" + creatorLine;
          promise._warn(msg, true, promiseCreated);
        }
      }
      function deprecated(name, replacement) {
        var message = name + " is deprecated and will be removed in a future version.";
        if (replacement)
          message += " Use " + replacement + " instead.";
        return warn(message);
      }
      function warn(message, shouldUseOwnTrace, promise) {
        if (!config.warnings)
          return;
        var warning = new Warning(message);
        var ctx;
        if (shouldUseOwnTrace) {
          promise._attachExtraTrace(warning);
        } else if (config.longStackTraces && (ctx = Promise2._peekContext())) {
          ctx.attachExtraTrace(warning);
        } else {
          var parsed = parseStackAndMessage(warning);
          warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
        }
        if (!activeFireEvent("warning", warning)) {
          formatAndLogError(warning, "", true);
        }
      }
      function reconstructStack(message, stacks) {
        for (var i = 0; i < stacks.length - 1; ++i) {
          stacks[i].push("From previous event:");
          stacks[i] = stacks[i].join("\n");
        }
        if (i < stacks.length) {
          stacks[i] = stacks[i].join("\n");
        }
        return message + "\n" + stacks.join("\n");
      }
      function removeDuplicateOrEmptyJumps(stacks) {
        for (var i = 0; i < stacks.length; ++i) {
          if (stacks[i].length === 0 || i + 1 < stacks.length && stacks[i][0] === stacks[i + 1][0]) {
            stacks.splice(i, 1);
            i--;
          }
        }
      }
      function removeCommonRoots(stacks) {
        var current = stacks[0];
        for (var i = 1; i < stacks.length; ++i) {
          var prev = stacks[i];
          var currentLastIndex = current.length - 1;
          var currentLastLine = current[currentLastIndex];
          var commonRootMeetPoint = -1;
          for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
              commonRootMeetPoint = j;
              break;
            }
          }
          for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
              current.pop();
              currentLastIndex--;
            } else {
              break;
            }
          }
          current = prev;
        }
      }
      function cleanStack(stack) {
        var ret2 = [];
        for (var i = 0; i < stack.length; ++i) {
          var line = stack[i];
          var isTraceLine = line === "    (No stack trace)" || stackFramePattern.test(line);
          var isInternalFrame = isTraceLine && shouldIgnore(line);
          if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
              line = "    " + line;
            }
            ret2.push(line);
          }
        }
        return ret2;
      }
      function stackFramesAsArray(error3) {
        var stack = error3.stack.replace(/\s+$/g, "").split("\n");
        for (var i = 0; i < stack.length; ++i) {
          var line = stack[i];
          if (line === "    (No stack trace)" || stackFramePattern.test(line)) {
            break;
          }
        }
        if (i > 0 && error3.name != "SyntaxError") {
          stack = stack.slice(i);
        }
        return stack;
      }
      function parseStackAndMessage(error3) {
        var stack = error3.stack;
        var message = error3.toString();
        stack = typeof stack === "string" && stack.length > 0 ? stackFramesAsArray(error3) : ["    (No stack trace)"];
        return {
          message,
          stack: error3.name == "SyntaxError" ? stack : cleanStack(stack)
        };
      }
      function formatAndLogError(error3, title, isSoft) {
        if (typeof console !== "undefined") {
          var message;
          if (util.isObject(error3)) {
            var stack = error3.stack;
            message = title + formatStack(stack, error3);
          } else {
            message = title + String(error3);
          }
          if (typeof printWarning === "function") {
            printWarning(message, isSoft);
          } else if (typeof console.log === "function" || typeof console.log === "object") {
            console.log(message);
          }
        }
      }
      function fireRejectionEvent(name, localHandler, reason, promise) {
        var localEventFired = false;
        try {
          if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
              localHandler(promise);
            } else {
              localHandler(reason, promise);
            }
          }
        } catch (e) {
          async.throwLater(e);
        }
        if (name === "unhandledRejection") {
          if (!activeFireEvent(name, reason, promise) && !localEventFired) {
            formatAndLogError(reason, "Unhandled rejection ");
          }
        } else {
          activeFireEvent(name, promise);
        }
      }
      function formatNonError(obj) {
        var str;
        if (typeof obj === "function") {
          str = "[function " + (obj.name || "anonymous") + "]";
        } else {
          str = obj && typeof obj.toString === "function" ? obj.toString() : util.toString(obj);
          var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
          if (ruselessToString.test(str)) {
            try {
              var newStr = JSON.stringify(obj);
              str = newStr;
            } catch (e) {
            }
          }
          if (str.length === 0) {
            str = "(empty array)";
          }
        }
        return "(<" + snip(str) + ">, no stack trace)";
      }
      function snip(str) {
        var maxChars = 41;
        if (str.length < maxChars) {
          return str;
        }
        return str.substr(0, maxChars - 3) + "...";
      }
      function longStackTracesIsSupported() {
        return typeof captureStackTrace === "function";
      }
      var shouldIgnore = function() {
        return false;
      };
      var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
      function parseLineInfo(line) {
        var matches = line.match(parseLineInfoRegex);
        if (matches) {
          return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
          };
        }
      }
      function setBounds(firstLineError, lastLineError) {
        if (!longStackTracesIsSupported())
          return;
        var firstStackLines = (firstLineError.stack || "").split("\n");
        var lastStackLines = (lastLineError.stack || "").split("\n");
        var firstIndex = -1;
        var lastIndex = -1;
        var firstFileName;
        var lastFileName;
        for (var i = 0; i < firstStackLines.length; ++i) {
          var result = parseLineInfo(firstStackLines[i]);
          if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
          }
        }
        for (var i = 0; i < lastStackLines.length; ++i) {
          var result = parseLineInfo(lastStackLines[i]);
          if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
          }
        }
        if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName || firstFileName !== lastFileName || firstIndex >= lastIndex) {
          return;
        }
        shouldIgnore = function(line) {
          if (bluebirdFramePattern.test(line))
            return true;
          var info = parseLineInfo(line);
          if (info) {
            if (info.fileName === firstFileName && (firstIndex <= info.line && info.line <= lastIndex)) {
              return true;
            }
          }
          return false;
        };
      }
      function CapturedTrace(parent) {
        this._parent = parent;
        this._promisesCreated = 0;
        var length = this._length = 1 + (parent === void 0 ? 0 : parent._length);
        captureStackTrace(this, CapturedTrace);
        if (length > 32)
          this.uncycle();
      }
      util.inherits(CapturedTrace, Error);
      Context.CapturedTrace = CapturedTrace;
      CapturedTrace.prototype.uncycle = function() {
        var length = this._length;
        if (length < 2)
          return;
        var nodes = [];
        var stackToIndex = {};
        for (var i = 0, node = this; node !== void 0; ++i) {
          nodes.push(node);
          node = node._parent;
        }
        length = this._length = i;
        for (var i = length - 1; i >= 0; --i) {
          var stack = nodes[i].stack;
          if (stackToIndex[stack] === void 0) {
            stackToIndex[stack] = i;
          }
        }
        for (var i = 0; i < length; ++i) {
          var currentStack = nodes[i].stack;
          var index2 = stackToIndex[currentStack];
          if (index2 !== void 0 && index2 !== i) {
            if (index2 > 0) {
              nodes[index2 - 1]._parent = void 0;
              nodes[index2 - 1]._length = 1;
            }
            nodes[i]._parent = void 0;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;
            if (index2 < length - 1) {
              cycleEdgeNode._parent = nodes[index2 + 1];
              cycleEdgeNode._parent.uncycle();
              cycleEdgeNode._length = cycleEdgeNode._parent._length + 1;
            } else {
              cycleEdgeNode._parent = void 0;
              cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
              nodes[j]._length = currentChildLength;
              currentChildLength++;
            }
            return;
          }
        }
      };
      CapturedTrace.prototype.attachExtraTrace = function(error3) {
        if (error3.__stackCleaned__)
          return;
        this.uncycle();
        var parsed = parseStackAndMessage(error3);
        var message = parsed.message;
        var stacks = [parsed.stack];
        var trace = this;
        while (trace !== void 0) {
          stacks.push(cleanStack(trace.stack.split("\n")));
          trace = trace._parent;
        }
        removeCommonRoots(stacks);
        removeDuplicateOrEmptyJumps(stacks);
        util.notEnumerableProp(error3, "stack", reconstructStack(message, stacks));
        util.notEnumerableProp(error3, "__stackCleaned__", true);
      };
      var captureStackTrace = function stackDetection() {
        var v8stackFramePattern = /^\s*at\s*/;
        var v8stackFormatter = function(stack, error3) {
          if (typeof stack === "string")
            return stack;
          if (error3.name !== void 0 && error3.message !== void 0) {
            return error3.toString();
          }
          return formatNonError(error3);
        };
        if (typeof Error.stackTraceLimit === "number" && typeof Error.captureStackTrace === "function") {
          Error.stackTraceLimit += 6;
          stackFramePattern = v8stackFramePattern;
          formatStack = v8stackFormatter;
          var captureStackTrace2 = Error.captureStackTrace;
          shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
          };
          return function(receiver, ignoreUntil) {
            Error.stackTraceLimit += 6;
            captureStackTrace2(receiver, ignoreUntil);
            Error.stackTraceLimit -= 6;
          };
        }
        var err = new Error();
        if (typeof err.stack === "string" && err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
          stackFramePattern = /@/;
          formatStack = v8stackFormatter;
          indentStackFrames = true;
          return function captureStackTrace3(o) {
            o.stack = new Error().stack;
          };
        }
        var hasStackAfterThrow;
        try {
          throw new Error();
        } catch (e) {
          hasStackAfterThrow = "stack" in e;
        }
        if (!("stack" in err) && hasStackAfterThrow && typeof Error.stackTraceLimit === "number") {
          stackFramePattern = v8stackFramePattern;
          formatStack = v8stackFormatter;
          return function captureStackTrace3(o) {
            Error.stackTraceLimit += 6;
            try {
              throw new Error();
            } catch (e) {
              o.stack = e.stack;
            }
            Error.stackTraceLimit -= 6;
          };
        }
        formatStack = function(stack, error3) {
          if (typeof stack === "string")
            return stack;
          if ((typeof error3 === "object" || typeof error3 === "function") && error3.name !== void 0 && error3.message !== void 0) {
            return error3.toString();
          }
          return formatNonError(error3);
        };
        return null;
      }([]);
      if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
        printWarning = function(message) {
          console.warn(message);
        };
        if (util.isNode && process.stderr.isTTY) {
          printWarning = function(message, isSoft) {
            var color = isSoft ? "[33m" : "[31m";
            console.warn(color + message + "[0m\n");
          };
        } else if (!util.isNode && typeof new Error().stack === "string") {
          printWarning = function(message, isSoft) {
            console.warn("%c" + message, isSoft ? "color: darkorange" : "color: red");
          };
        }
      }
      var config = {
        warnings,
        longStackTraces: false,
        cancellation: false,
        monitoring: false,
        asyncHooks: false
      };
      if (longStackTraces)
        Promise2.longStackTraces();
      return {
        asyncHooks: function() {
          return config.asyncHooks;
        },
        longStackTraces: function() {
          return config.longStackTraces;
        },
        warnings: function() {
          return config.warnings;
        },
        cancellation: function() {
          return config.cancellation;
        },
        monitoring: function() {
          return config.monitoring;
        },
        propagateFromFunction: function() {
          return propagateFromFunction;
        },
        boundValueFunction: function() {
          return boundValueFunction;
        },
        checkForgottenReturns,
        setBounds,
        warn,
        deprecated,
        CapturedTrace,
        fireDomEvent,
        fireGlobalEvent
      };
    };
  }
});

// node_modules/bluebird/js/release/catch_filter.js
var require_catch_filter = __commonJS({
  "node_modules/bluebird/js/release/catch_filter.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(NEXT_FILTER) {
      var util = require_util();
      var getKeys = require_es5().keys;
      var tryCatch2 = util.tryCatch;
      var errorObj2 = util.errorObj;
      function catchFilter(instances, cb, promise) {
        return function(e) {
          var boundTo = promise._boundValue();
          predicateLoop:
            for (var i = 0; i < instances.length; ++i) {
              var item = instances[i];
              if (item === Error || item != null && item.prototype instanceof Error) {
                if (e instanceof item) {
                  return tryCatch2(cb).call(boundTo, e);
                }
              } else if (typeof item === "function") {
                var matchesPredicate = tryCatch2(item).call(boundTo, e);
                if (matchesPredicate === errorObj2) {
                  return matchesPredicate;
                } else if (matchesPredicate) {
                  return tryCatch2(cb).call(boundTo, e);
                }
              } else if (util.isObject(e)) {
                var keys = getKeys(item);
                for (var j = 0; j < keys.length; ++j) {
                  var key = keys[j];
                  if (item[key] != e[key]) {
                    continue predicateLoop;
                  }
                }
                return tryCatch2(cb).call(boundTo, e);
              }
            }
          return NEXT_FILTER;
        };
      }
      return catchFilter;
    };
  }
});

// node_modules/bluebird/js/release/finally.js
var require_finally = __commonJS({
  "node_modules/bluebird/js/release/finally.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, tryConvertToPromise, NEXT_FILTER) {
      var util = require_util();
      var CancellationError = Promise2.CancellationError;
      var errorObj2 = util.errorObj;
      var catchFilter = require_catch_filter()(NEXT_FILTER);
      function PassThroughHandlerContext(promise, type, handler2) {
        this.promise = promise;
        this.type = type;
        this.handler = handler2;
        this.called = false;
        this.cancelPromise = null;
      }
      PassThroughHandlerContext.prototype.isFinallyHandler = function() {
        return this.type === 0;
      };
      function FinallyHandlerCancelReaction(finallyHandler2) {
        this.finallyHandler = finallyHandler2;
      }
      FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
        checkCancel(this.finallyHandler);
      };
      function checkCancel(ctx, reason) {
        if (ctx.cancelPromise != null) {
          if (arguments.length > 1) {
            ctx.cancelPromise._reject(reason);
          } else {
            ctx.cancelPromise._cancel();
          }
          ctx.cancelPromise = null;
          return true;
        }
        return false;
      }
      function succeed() {
        return finallyHandler.call(this, this.promise._target()._settledValue());
      }
      function fail(reason) {
        if (checkCancel(this, reason))
          return;
        errorObj2.e = reason;
        return errorObj2;
      }
      function finallyHandler(reasonOrValue) {
        var promise = this.promise;
        var handler2 = this.handler;
        if (!this.called) {
          this.called = true;
          var ret2 = this.isFinallyHandler() ? handler2.call(promise._boundValue()) : handler2.call(promise._boundValue(), reasonOrValue);
          if (ret2 === NEXT_FILTER) {
            return ret2;
          } else if (ret2 !== void 0) {
            promise._setReturnedNonUndefined();
            var maybePromise = tryConvertToPromise(ret2, promise);
            if (maybePromise instanceof Promise2) {
              if (this.cancelPromise != null) {
                if (maybePromise._isCancelled()) {
                  var reason = new CancellationError("late cancellation observer");
                  promise._attachExtraTrace(reason);
                  errorObj2.e = reason;
                  return errorObj2;
                } else if (maybePromise.isPending()) {
                  maybePromise._attachCancellationCallback(new FinallyHandlerCancelReaction(this));
                }
              }
              return maybePromise._then(succeed, fail, void 0, this, void 0);
            }
          }
        }
        if (promise.isRejected()) {
          checkCancel(this);
          errorObj2.e = reasonOrValue;
          return errorObj2;
        } else {
          checkCancel(this);
          return reasonOrValue;
        }
      }
      Promise2.prototype._passThrough = function(handler2, type, success, fail2) {
        if (typeof handler2 !== "function")
          return this.then();
        return this._then(success, fail2, void 0, new PassThroughHandlerContext(this, type, handler2), void 0);
      };
      Promise2.prototype.lastly = Promise2.prototype["finally"] = function(handler2) {
        return this._passThrough(handler2, 0, finallyHandler, finallyHandler);
      };
      Promise2.prototype.tap = function(handler2) {
        return this._passThrough(handler2, 1, finallyHandler);
      };
      Promise2.prototype.tapCatch = function(handlerOrPredicate) {
        var len = arguments.length;
        if (len === 1) {
          return this._passThrough(handlerOrPredicate, 1, void 0, finallyHandler);
        } else {
          var catchInstances = new Array(len - 1), j = 0, i;
          for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
              catchInstances[j++] = item;
            } else {
              return Promise2.reject(new TypeError("tapCatch statement predicate: expecting an object but got " + util.classString(item)));
            }
          }
          catchInstances.length = j;
          var handler2 = arguments[i];
          return this._passThrough(catchFilter(catchInstances, handler2, this), 1, void 0, finallyHandler);
        }
      };
      return PassThroughHandlerContext;
    };
  }
});

// node_modules/bluebird/js/release/nodeback.js
var require_nodeback = __commonJS({
  "node_modules/bluebird/js/release/nodeback.js"(exports2, module2) {
    init_shims();
    "use strict";
    var util = require_util();
    var maybeWrapAsError2 = util.maybeWrapAsError;
    var errors = require_errors();
    var OperationalError = errors.OperationalError;
    var es52 = require_es5();
    function isUntypedError(obj) {
      return obj instanceof Error && es52.getPrototypeOf(obj) === Error.prototype;
    }
    var rErrorKey = /^(?:name|message|stack|cause)$/;
    function wrapAsOperationalError(obj) {
      var ret2;
      if (isUntypedError(obj)) {
        ret2 = new OperationalError(obj);
        ret2.name = obj.name;
        ret2.message = obj.message;
        ret2.stack = obj.stack;
        var keys = es52.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
          var key = keys[i];
          if (!rErrorKey.test(key)) {
            ret2[key] = obj[key];
          }
        }
        return ret2;
      }
      util.markAsOriginatingFromRejection(obj);
      return obj;
    }
    function nodebackForPromise(promise, multiArgs) {
      return function(err, value) {
        if (promise === null)
          return;
        if (err) {
          var wrapped = wrapAsOperationalError(maybeWrapAsError2(err));
          promise._attachExtraTrace(wrapped);
          promise._reject(wrapped);
        } else if (!multiArgs) {
          promise._fulfill(value);
        } else {
          var $_len = arguments.length;
          var args = new Array(Math.max($_len - 1, 0));
          for (var $_i = 1; $_i < $_len; ++$_i) {
            args[$_i - 1] = arguments[$_i];
          }
          ;
          promise._fulfill(args);
        }
        promise = null;
      };
    }
    module2.exports = nodebackForPromise;
  }
});

// node_modules/bluebird/js/release/method.js
var require_method = __commonJS({
  "node_modules/bluebird/js/release/method.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, INTERNAL, tryConvertToPromise, apiRejection, debug) {
      var util = require_util();
      var tryCatch2 = util.tryCatch;
      Promise2.method = function(fn) {
        if (typeof fn !== "function") {
          throw new Promise2.TypeError("expecting a function but got " + util.classString(fn));
        }
        return function() {
          var ret2 = new Promise2(INTERNAL);
          ret2._captureStackTrace();
          ret2._pushContext();
          var value = tryCatch2(fn).apply(this, arguments);
          var promiseCreated = ret2._popContext();
          debug.checkForgottenReturns(value, promiseCreated, "Promise.method", ret2);
          ret2._resolveFromSyncValue(value);
          return ret2;
        };
      };
      Promise2.attempt = Promise2["try"] = function(fn) {
        if (typeof fn !== "function") {
          return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var ret2 = new Promise2(INTERNAL);
        ret2._captureStackTrace();
        ret2._pushContext();
        var value;
        if (arguments.length > 1) {
          debug.deprecated("calling Promise.try with more than 1 argument");
          var arg = arguments[1];
          var ctx = arguments[2];
          value = util.isArray(arg) ? tryCatch2(fn).apply(ctx, arg) : tryCatch2(fn).call(ctx, arg);
        } else {
          value = tryCatch2(fn)();
        }
        var promiseCreated = ret2._popContext();
        debug.checkForgottenReturns(value, promiseCreated, "Promise.try", ret2);
        ret2._resolveFromSyncValue(value);
        return ret2;
      };
      Promise2.prototype._resolveFromSyncValue = function(value) {
        if (value === util.errorObj) {
          this._rejectCallback(value.e, false);
        } else {
          this._resolveCallback(value, true);
        }
      };
    };
  }
});

// node_modules/bluebird/js/release/bind.js
var require_bind = __commonJS({
  "node_modules/bluebird/js/release/bind.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, INTERNAL, tryConvertToPromise, debug) {
      var calledBind = false;
      var rejectThis = function(_, e) {
        this._reject(e);
      };
      var targetRejected = function(e, context) {
        context.promiseRejectionQueued = true;
        context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
      };
      var bindingResolved = function(thisArg, context) {
        if ((this._bitField & 50397184) === 0) {
          this._resolveCallback(context.target);
        }
      };
      var bindingRejected = function(e, context) {
        if (!context.promiseRejectionQueued)
          this._reject(e);
      };
      Promise2.prototype.bind = function(thisArg) {
        if (!calledBind) {
          calledBind = true;
          Promise2.prototype._propagateFrom = debug.propagateFromFunction();
          Promise2.prototype._boundValue = debug.boundValueFunction();
        }
        var maybePromise = tryConvertToPromise(thisArg);
        var ret2 = new Promise2(INTERNAL);
        ret2._propagateFrom(this, 1);
        var target = this._target();
        ret2._setBoundTo(maybePromise);
        if (maybePromise instanceof Promise2) {
          var context = {
            promiseRejectionQueued: false,
            promise: ret2,
            target,
            bindingPromise: maybePromise
          };
          target._then(INTERNAL, targetRejected, void 0, ret2, context);
          maybePromise._then(bindingResolved, bindingRejected, void 0, ret2, context);
          ret2._setOnCancel(maybePromise);
        } else {
          ret2._resolveCallback(target);
        }
        return ret2;
      };
      Promise2.prototype._setBoundTo = function(obj) {
        if (obj !== void 0) {
          this._bitField = this._bitField | 2097152;
          this._boundTo = obj;
        } else {
          this._bitField = this._bitField & ~2097152;
        }
      };
      Promise2.prototype._isBound = function() {
        return (this._bitField & 2097152) === 2097152;
      };
      Promise2.bind = function(thisArg, value) {
        return Promise2.resolve(value).bind(thisArg);
      };
    };
  }
});

// node_modules/bluebird/js/release/cancel.js
var require_cancel = __commonJS({
  "node_modules/bluebird/js/release/cancel.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, PromiseArray, apiRejection, debug) {
      var util = require_util();
      var tryCatch2 = util.tryCatch;
      var errorObj2 = util.errorObj;
      var async = Promise2._async;
      Promise2.prototype["break"] = Promise2.prototype.cancel = function() {
        if (!debug.cancellation())
          return this._warn("cancellation is disabled");
        var promise = this;
        var child = promise;
        while (promise._isCancellable()) {
          if (!promise._cancelBy(child)) {
            if (child._isFollowing()) {
              child._followee().cancel();
            } else {
              child._cancelBranched();
            }
            break;
          }
          var parent = promise._cancellationParent;
          if (parent == null || !parent._isCancellable()) {
            if (promise._isFollowing()) {
              promise._followee().cancel();
            } else {
              promise._cancelBranched();
            }
            break;
          } else {
            if (promise._isFollowing())
              promise._followee().cancel();
            promise._setWillBeCancelled();
            child = promise;
            promise = parent;
          }
        }
      };
      Promise2.prototype._branchHasCancelled = function() {
        this._branchesRemainingToCancel--;
      };
      Promise2.prototype._enoughBranchesHaveCancelled = function() {
        return this._branchesRemainingToCancel === void 0 || this._branchesRemainingToCancel <= 0;
      };
      Promise2.prototype._cancelBy = function(canceller) {
        if (canceller === this) {
          this._branchesRemainingToCancel = 0;
          this._invokeOnCancel();
          return true;
        } else {
          this._branchHasCancelled();
          if (this._enoughBranchesHaveCancelled()) {
            this._invokeOnCancel();
            return true;
          }
        }
        return false;
      };
      Promise2.prototype._cancelBranched = function() {
        if (this._enoughBranchesHaveCancelled()) {
          this._cancel();
        }
      };
      Promise2.prototype._cancel = function() {
        if (!this._isCancellable())
          return;
        this._setCancelled();
        async.invoke(this._cancelPromises, this, void 0);
      };
      Promise2.prototype._cancelPromises = function() {
        if (this._length() > 0)
          this._settlePromises();
      };
      Promise2.prototype._unsetOnCancel = function() {
        this._onCancelField = void 0;
      };
      Promise2.prototype._isCancellable = function() {
        return this.isPending() && !this._isCancelled();
      };
      Promise2.prototype.isCancellable = function() {
        return this.isPending() && !this.isCancelled();
      };
      Promise2.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
        if (util.isArray(onCancelCallback)) {
          for (var i = 0; i < onCancelCallback.length; ++i) {
            this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
          }
        } else if (onCancelCallback !== void 0) {
          if (typeof onCancelCallback === "function") {
            if (!internalOnly) {
              var e = tryCatch2(onCancelCallback).call(this._boundValue());
              if (e === errorObj2) {
                this._attachExtraTrace(e.e);
                async.throwLater(e.e);
              }
            }
          } else {
            onCancelCallback._resultCancelled(this);
          }
        }
      };
      Promise2.prototype._invokeOnCancel = function() {
        var onCancelCallback = this._onCancel();
        this._unsetOnCancel();
        async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
      };
      Promise2.prototype._invokeInternalOnCancel = function() {
        if (this._isCancellable()) {
          this._doInvokeOnCancel(this._onCancel(), true);
          this._unsetOnCancel();
        }
      };
      Promise2.prototype._resultCancelled = function() {
        this.cancel();
      };
    };
  }
});

// node_modules/bluebird/js/release/direct_resolve.js
var require_direct_resolve = __commonJS({
  "node_modules/bluebird/js/release/direct_resolve.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2) {
      function returner() {
        return this.value;
      }
      function thrower2() {
        throw this.reason;
      }
      Promise2.prototype["return"] = Promise2.prototype.thenReturn = function(value) {
        if (value instanceof Promise2)
          value.suppressUnhandledRejections();
        return this._then(returner, void 0, void 0, { value }, void 0);
      };
      Promise2.prototype["throw"] = Promise2.prototype.thenThrow = function(reason) {
        return this._then(thrower2, void 0, void 0, { reason }, void 0);
      };
      Promise2.prototype.catchThrow = function(reason) {
        if (arguments.length <= 1) {
          return this._then(void 0, thrower2, void 0, { reason }, void 0);
        } else {
          var _reason = arguments[1];
          var handler2 = function() {
            throw _reason;
          };
          return this.caught(reason, handler2);
        }
      };
      Promise2.prototype.catchReturn = function(value) {
        if (arguments.length <= 1) {
          if (value instanceof Promise2)
            value.suppressUnhandledRejections();
          return this._then(void 0, returner, void 0, { value }, void 0);
        } else {
          var _value = arguments[1];
          if (_value instanceof Promise2)
            _value.suppressUnhandledRejections();
          var handler2 = function() {
            return _value;
          };
          return this.caught(value, handler2);
        }
      };
    };
  }
});

// node_modules/bluebird/js/release/synchronous_inspection.js
var require_synchronous_inspection = __commonJS({
  "node_modules/bluebird/js/release/synchronous_inspection.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2) {
      function PromiseInspection(promise) {
        if (promise !== void 0) {
          promise = promise._target();
          this._bitField = promise._bitField;
          this._settledValueField = promise._isFateSealed() ? promise._settledValue() : void 0;
        } else {
          this._bitField = 0;
          this._settledValueField = void 0;
        }
      }
      PromiseInspection.prototype._settledValue = function() {
        return this._settledValueField;
      };
      var value = PromiseInspection.prototype.value = function() {
        if (!this.isFulfilled()) {
          throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\n\n    See http://goo.gl/MqrFmX\n");
        }
        return this._settledValue();
      };
      var reason = PromiseInspection.prototype.error = PromiseInspection.prototype.reason = function() {
        if (!this.isRejected()) {
          throw new TypeError("cannot get rejection reason of a non-rejected promise\n\n    See http://goo.gl/MqrFmX\n");
        }
        return this._settledValue();
      };
      var isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
        return (this._bitField & 33554432) !== 0;
      };
      var isRejected = PromiseInspection.prototype.isRejected = function() {
        return (this._bitField & 16777216) !== 0;
      };
      var isPending = PromiseInspection.prototype.isPending = function() {
        return (this._bitField & 50397184) === 0;
      };
      var isResolved = PromiseInspection.prototype.isResolved = function() {
        return (this._bitField & 50331648) !== 0;
      };
      PromiseInspection.prototype.isCancelled = function() {
        return (this._bitField & 8454144) !== 0;
      };
      Promise2.prototype.__isCancelled = function() {
        return (this._bitField & 65536) === 65536;
      };
      Promise2.prototype._isCancelled = function() {
        return this._target().__isCancelled();
      };
      Promise2.prototype.isCancelled = function() {
        return (this._target()._bitField & 8454144) !== 0;
      };
      Promise2.prototype.isPending = function() {
        return isPending.call(this._target());
      };
      Promise2.prototype.isRejected = function() {
        return isRejected.call(this._target());
      };
      Promise2.prototype.isFulfilled = function() {
        return isFulfilled.call(this._target());
      };
      Promise2.prototype.isResolved = function() {
        return isResolved.call(this._target());
      };
      Promise2.prototype.value = function() {
        return value.call(this._target());
      };
      Promise2.prototype.reason = function() {
        var target = this._target();
        target._unsetRejectionIsUnhandled();
        return reason.call(target);
      };
      Promise2.prototype._value = function() {
        return this._settledValue();
      };
      Promise2.prototype._reason = function() {
        this._unsetRejectionIsUnhandled();
        return this._settledValue();
      };
      Promise2.PromiseInspection = PromiseInspection;
    };
  }
});

// node_modules/bluebird/js/release/join.js
var require_join = __commonJS({
  "node_modules/bluebird/js/release/join.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, PromiseArray, tryConvertToPromise, INTERNAL, async) {
      var util = require_util();
      var canEvaluate2 = util.canEvaluate;
      var tryCatch2 = util.tryCatch;
      var errorObj2 = util.errorObj;
      var reject;
      if (true) {
        if (canEvaluate2) {
          var thenCallback = function(i2) {
            return new Function("value", "holder", "                             \n            'use strict';                                                    \n            holder.pIndex = value;                                           \n            holder.checkFulfillment(this);                                   \n            ".replace(/Index/g, i2));
          };
          var promiseSetter = function(i2) {
            return new Function("promise", "holder", "                           \n            'use strict';                                                    \n            holder.pIndex = promise;                                         \n            ".replace(/Index/g, i2));
          };
          var generateHolderClass = function(total) {
            var props = new Array(total);
            for (var i2 = 0; i2 < props.length; ++i2) {
              props[i2] = "this.p" + (i2 + 1);
            }
            var assignment = props.join(" = ") + " = null;";
            var cancellationCode = "var promise;\n" + props.map(function(prop) {
              return "                                                         \n                promise = " + prop + ";                                      \n                if (promise instanceof Promise) {                            \n                    promise.cancel();                                        \n                }                                                            \n            ";
            }).join("\n");
            var passedArguments = props.join(", ");
            var name = "Holder$" + total;
            var code = "return function(tryCatch, errorObj, Promise, async) {    \n            'use strict';                                                    \n            function [TheName](fn) {                                         \n                [TheProperties]                                              \n                this.fn = fn;                                                \n                this.asyncNeeded = true;                                     \n                this.now = 0;                                                \n            }                                                                \n                                                                             \n            [TheName].prototype._callFunction = function(promise) {          \n                promise._pushContext();                                      \n                var ret = tryCatch(this.fn)([ThePassedArguments]);           \n                promise._popContext();                                       \n                if (ret === errorObj) {                                      \n                    promise._rejectCallback(ret.e, false);                   \n                } else {                                                     \n                    promise._resolveCallback(ret);                           \n                }                                                            \n            };                                                               \n                                                                             \n            [TheName].prototype.checkFulfillment = function(promise) {       \n                var now = ++this.now;                                        \n                if (now === [TheTotal]) {                                    \n                    if (this.asyncNeeded) {                                  \n                        async.invoke(this._callFunction, this, promise);     \n                    } else {                                                 \n                        this._callFunction(promise);                         \n                    }                                                        \n                                                                             \n                }                                                            \n            };                                                               \n                                                                             \n            [TheName].prototype._resultCancelled = function() {              \n                [CancellationCode]                                           \n            };                                                               \n                                                                             \n            return [TheName];                                                \n        }(tryCatch, errorObj, Promise, async);                               \n        ";
            code = code.replace(/\[TheName\]/g, name).replace(/\[TheTotal\]/g, total).replace(/\[ThePassedArguments\]/g, passedArguments).replace(/\[TheProperties\]/g, assignment).replace(/\[CancellationCode\]/g, cancellationCode);
            return new Function("tryCatch", "errorObj", "Promise", "async", code)(tryCatch2, errorObj2, Promise2, async);
          };
          var holderClasses = [];
          var thenCallbacks = [];
          var promiseSetters = [];
          for (var i = 0; i < 8; ++i) {
            holderClasses.push(generateHolderClass(i + 1));
            thenCallbacks.push(thenCallback(i + 1));
            promiseSetters.push(promiseSetter(i + 1));
          }
          reject = function(reason) {
            this._reject(reason);
          };
        }
      }
      Promise2.join = function() {
        var last = arguments.length - 1;
        var fn;
        if (last > 0 && typeof arguments[last] === "function") {
          fn = arguments[last];
          if (true) {
            if (last <= 8 && canEvaluate2) {
              var ret2 = new Promise2(INTERNAL);
              ret2._captureStackTrace();
              var HolderClass = holderClasses[last - 1];
              var holder = new HolderClass(fn);
              var callbacks = thenCallbacks;
              for (var i2 = 0; i2 < last; ++i2) {
                var maybePromise = tryConvertToPromise(arguments[i2], ret2);
                if (maybePromise instanceof Promise2) {
                  maybePromise = maybePromise._target();
                  var bitField = maybePromise._bitField;
                  ;
                  if ((bitField & 50397184) === 0) {
                    maybePromise._then(callbacks[i2], reject, void 0, ret2, holder);
                    promiseSetters[i2](maybePromise, holder);
                    holder.asyncNeeded = false;
                  } else if ((bitField & 33554432) !== 0) {
                    callbacks[i2].call(ret2, maybePromise._value(), holder);
                  } else if ((bitField & 16777216) !== 0) {
                    ret2._reject(maybePromise._reason());
                  } else {
                    ret2._cancel();
                  }
                } else {
                  callbacks[i2].call(ret2, maybePromise, holder);
                }
              }
              if (!ret2._isFateSealed()) {
                if (holder.asyncNeeded) {
                  var context = Promise2._getContext();
                  holder.fn = util.contextBind(context, holder.fn);
                }
                ret2._setAsyncGuaranteed();
                ret2._setOnCancel(holder);
              }
              return ret2;
            }
          }
        }
        var $_len = arguments.length;
        var args = new Array($_len);
        for (var $_i = 0; $_i < $_len; ++$_i) {
          args[$_i] = arguments[$_i];
        }
        ;
        if (fn)
          args.pop();
        var ret2 = new PromiseArray(args).promise();
        return fn !== void 0 ? ret2.spread(fn) : ret2;
      };
    };
  }
});

// node_modules/bluebird/js/release/call_get.js
var require_call_get = __commonJS({
  "node_modules/bluebird/js/release/call_get.js"(exports2, module2) {
    init_shims();
    "use strict";
    var cr = Object.create;
    if (cr) {
      callerCache = cr(null);
      getterCache = cr(null);
      callerCache[" size"] = getterCache[" size"] = 0;
    }
    var callerCache;
    var getterCache;
    module2.exports = function(Promise2) {
      var util = require_util();
      var canEvaluate2 = util.canEvaluate;
      var isIdentifier2 = util.isIdentifier;
      var getMethodCaller;
      var getGetter;
      if (true) {
        var makeMethodCaller = function(methodName) {
          return new Function("ensureMethod", "                                    \n        return function(obj) {                                               \n            'use strict'                                                     \n            var len = this.length;                                           \n            ensureMethod(obj, 'methodName');                                 \n            switch(len) {                                                    \n                case 1: return obj.methodName(this[0]);                      \n                case 2: return obj.methodName(this[0], this[1]);             \n                case 3: return obj.methodName(this[0], this[1], this[2]);    \n                case 0: return obj.methodName();                             \n                default:                                                     \n                    return obj.methodName.apply(obj, this);                  \n            }                                                                \n        };                                                                   \n        ".replace(/methodName/g, methodName))(ensureMethod);
        };
        var makeGetter = function(propertyName) {
          return new Function("obj", "                                             \n        'use strict';                                                        \n        return obj.propertyName;                                             \n        ".replace("propertyName", propertyName));
        };
        var getCompiled = function(name, compiler, cache) {
          var ret2 = cache[name];
          if (typeof ret2 !== "function") {
            if (!isIdentifier2(name)) {
              return null;
            }
            ret2 = compiler(name);
            cache[name] = ret2;
            cache[" size"]++;
            if (cache[" size"] > 512) {
              var keys = Object.keys(cache);
              for (var i = 0; i < 256; ++i)
                delete cache[keys[i]];
              cache[" size"] = keys.length - 256;
            }
          }
          return ret2;
        };
        getMethodCaller = function(name) {
          return getCompiled(name, makeMethodCaller, callerCache);
        };
        getGetter = function(name) {
          return getCompiled(name, makeGetter, getterCache);
        };
      }
      function ensureMethod(obj, methodName) {
        var fn;
        if (obj != null)
          fn = obj[methodName];
        if (typeof fn !== "function") {
          var message = "Object " + util.classString(obj) + " has no method '" + util.toString(methodName) + "'";
          throw new Promise2.TypeError(message);
        }
        return fn;
      }
      function caller(obj) {
        var methodName = this.pop();
        var fn = ensureMethod(obj, methodName);
        return fn.apply(obj, this);
      }
      Promise2.prototype.call = function(methodName) {
        var $_len = arguments.length;
        var args = new Array(Math.max($_len - 1, 0));
        for (var $_i = 1; $_i < $_len; ++$_i) {
          args[$_i - 1] = arguments[$_i];
        }
        ;
        if (true) {
          if (canEvaluate2) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
              return this._then(maybeCaller, void 0, void 0, args, void 0);
            }
          }
        }
        args.push(methodName);
        return this._then(caller, void 0, void 0, args, void 0);
      };
      function namedGetter(obj) {
        return obj[this];
      }
      function indexedGetter(obj) {
        var index2 = +this;
        if (index2 < 0)
          index2 = Math.max(0, index2 + obj.length);
        return obj[index2];
      }
      Promise2.prototype.get = function(propertyName) {
        var isIndex = typeof propertyName === "number";
        var getter;
        if (!isIndex) {
          if (canEvaluate2) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
          } else {
            getter = namedGetter;
          }
        } else {
          getter = indexedGetter;
        }
        return this._then(getter, void 0, void 0, propertyName, void 0);
      };
    };
  }
});

// node_modules/bluebird/js/release/generators.js
var require_generators = __commonJS({
  "node_modules/bluebird/js/release/generators.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug) {
      var errors = require_errors();
      var TypeError2 = errors.TypeError;
      var util = require_util();
      var errorObj2 = util.errorObj;
      var tryCatch2 = util.tryCatch;
      var yieldHandlers = [];
      function promiseFromYieldHandler(value, yieldHandlers2, traceParent) {
        for (var i = 0; i < yieldHandlers2.length; ++i) {
          traceParent._pushContext();
          var result = tryCatch2(yieldHandlers2[i])(value);
          traceParent._popContext();
          if (result === errorObj2) {
            traceParent._pushContext();
            var ret2 = Promise2.reject(errorObj2.e);
            traceParent._popContext();
            return ret2;
          }
          var maybePromise = tryConvertToPromise(result, traceParent);
          if (maybePromise instanceof Promise2)
            return maybePromise;
        }
        return null;
      }
      function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
        if (debug.cancellation()) {
          var internal = new Promise2(INTERNAL);
          var _finallyPromise = this._finallyPromise = new Promise2(INTERNAL);
          this._promise = internal.lastly(function() {
            return _finallyPromise;
          });
          internal._captureStackTrace();
          internal._setOnCancel(this);
        } else {
          var promise = this._promise = new Promise2(INTERNAL);
          promise._captureStackTrace();
        }
        this._stack = stack;
        this._generatorFunction = generatorFunction;
        this._receiver = receiver;
        this._generator = void 0;
        this._yieldHandlers = typeof yieldHandler === "function" ? [yieldHandler].concat(yieldHandlers) : yieldHandlers;
        this._yieldedPromise = null;
        this._cancellationPhase = false;
      }
      util.inherits(PromiseSpawn, Proxyable);
      PromiseSpawn.prototype._isResolved = function() {
        return this._promise === null;
      };
      PromiseSpawn.prototype._cleanup = function() {
        this._promise = this._generator = null;
        if (debug.cancellation() && this._finallyPromise !== null) {
          this._finallyPromise._fulfill();
          this._finallyPromise = null;
        }
      };
      PromiseSpawn.prototype._promiseCancelled = function() {
        if (this._isResolved())
          return;
        var implementsReturn = typeof this._generator["return"] !== "undefined";
        var result;
        if (!implementsReturn) {
          var reason = new Promise2.CancellationError("generator .return() sentinel");
          Promise2.coroutine.returnSentinel = reason;
          this._promise._attachExtraTrace(reason);
          this._promise._pushContext();
          result = tryCatch2(this._generator["throw"]).call(this._generator, reason);
          this._promise._popContext();
        } else {
          this._promise._pushContext();
          result = tryCatch2(this._generator["return"]).call(this._generator, void 0);
          this._promise._popContext();
        }
        this._cancellationPhase = true;
        this._yieldedPromise = null;
        this._continue(result);
      };
      PromiseSpawn.prototype._promiseFulfilled = function(value) {
        this._yieldedPromise = null;
        this._promise._pushContext();
        var result = tryCatch2(this._generator.next).call(this._generator, value);
        this._promise._popContext();
        this._continue(result);
      };
      PromiseSpawn.prototype._promiseRejected = function(reason) {
        this._yieldedPromise = null;
        this._promise._attachExtraTrace(reason);
        this._promise._pushContext();
        var result = tryCatch2(this._generator["throw"]).call(this._generator, reason);
        this._promise._popContext();
        this._continue(result);
      };
      PromiseSpawn.prototype._resultCancelled = function() {
        if (this._yieldedPromise instanceof Promise2) {
          var promise = this._yieldedPromise;
          this._yieldedPromise = null;
          promise.cancel();
        }
      };
      PromiseSpawn.prototype.promise = function() {
        return this._promise;
      };
      PromiseSpawn.prototype._run = function() {
        this._generator = this._generatorFunction.call(this._receiver);
        this._receiver = this._generatorFunction = void 0;
        this._promiseFulfilled(void 0);
      };
      PromiseSpawn.prototype._continue = function(result) {
        var promise = this._promise;
        if (result === errorObj2) {
          this._cleanup();
          if (this._cancellationPhase) {
            return promise.cancel();
          } else {
            return promise._rejectCallback(result.e, false);
          }
        }
        var value = result.value;
        if (result.done === true) {
          this._cleanup();
          if (this._cancellationPhase) {
            return promise.cancel();
          } else {
            return promise._resolveCallback(value);
          }
        } else {
          var maybePromise = tryConvertToPromise(value, this._promise);
          if (!(maybePromise instanceof Promise2)) {
            maybePromise = promiseFromYieldHandler(maybePromise, this._yieldHandlers, this._promise);
            if (maybePromise === null) {
              this._promiseRejected(new TypeError2("A value %s was yielded that could not be treated as a promise\n\n    See http://goo.gl/MqrFmX\n\n".replace("%s", String(value)) + "From coroutine:\n" + this._stack.split("\n").slice(1, -7).join("\n")));
              return;
            }
          }
          maybePromise = maybePromise._target();
          var bitField = maybePromise._bitField;
          ;
          if ((bitField & 50397184) === 0) {
            this._yieldedPromise = maybePromise;
            maybePromise._proxy(this, null);
          } else if ((bitField & 33554432) !== 0) {
            Promise2._async.invoke(this._promiseFulfilled, this, maybePromise._value());
          } else if ((bitField & 16777216) !== 0) {
            Promise2._async.invoke(this._promiseRejected, this, maybePromise._reason());
          } else {
            this._promiseCancelled();
          }
        }
      };
      Promise2.coroutine = function(generatorFunction, options2) {
        if (typeof generatorFunction !== "function") {
          throw new TypeError2("generatorFunction must be a function\n\n    See http://goo.gl/MqrFmX\n");
        }
        var yieldHandler = Object(options2).yieldHandler;
        var PromiseSpawn$ = PromiseSpawn;
        var stack = new Error().stack;
        return function() {
          var generator = generatorFunction.apply(this, arguments);
          var spawn = new PromiseSpawn$(void 0, void 0, yieldHandler, stack);
          var ret2 = spawn.promise();
          spawn._generator = generator;
          spawn._promiseFulfilled(void 0);
          return ret2;
        };
      };
      Promise2.coroutine.addYieldHandler = function(fn) {
        if (typeof fn !== "function") {
          throw new TypeError2("expecting a function but got " + util.classString(fn));
        }
        yieldHandlers.push(fn);
      };
      Promise2.spawn = function(generatorFunction) {
        debug.deprecated("Promise.spawn()", "Promise.coroutine()");
        if (typeof generatorFunction !== "function") {
          return apiRejection("generatorFunction must be a function\n\n    See http://goo.gl/MqrFmX\n");
        }
        var spawn = new PromiseSpawn(generatorFunction, this);
        var ret2 = spawn.promise();
        spawn._run(Promise2.spawn);
        return ret2;
      };
    };
  }
});

// node_modules/bluebird/js/release/map.js
var require_map2 = __commonJS({
  "node_modules/bluebird/js/release/map.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug) {
      var util = require_util();
      var tryCatch2 = util.tryCatch;
      var errorObj2 = util.errorObj;
      var async = Promise2._async;
      function MappingPromiseArray(promises, fn, limit, _filter) {
        this.constructor$(promises);
        this._promise._captureStackTrace();
        var context = Promise2._getContext();
        this._callback = util.contextBind(context, fn);
        this._preservedValues = _filter === INTERNAL ? new Array(this.length()) : null;
        this._limit = limit;
        this._inFlight = 0;
        this._queue = [];
        async.invoke(this._asyncInit, this, void 0);
        if (util.isArray(promises)) {
          for (var i = 0; i < promises.length; ++i) {
            var maybePromise = promises[i];
            if (maybePromise instanceof Promise2) {
              maybePromise.suppressUnhandledRejections();
            }
          }
        }
      }
      util.inherits(MappingPromiseArray, PromiseArray);
      MappingPromiseArray.prototype._asyncInit = function() {
        this._init$(void 0, -2);
      };
      MappingPromiseArray.prototype._init = function() {
      };
      MappingPromiseArray.prototype._promiseFulfilled = function(value, index2) {
        var values = this._values;
        var length = this.length();
        var preservedValues = this._preservedValues;
        var limit = this._limit;
        if (index2 < 0) {
          index2 = index2 * -1 - 1;
          values[index2] = value;
          if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved())
              return true;
          }
        } else {
          if (limit >= 1 && this._inFlight >= limit) {
            values[index2] = value;
            this._queue.push(index2);
            return false;
          }
          if (preservedValues !== null)
            preservedValues[index2] = value;
          var promise = this._promise;
          var callback = this._callback;
          var receiver = promise._boundValue();
          promise._pushContext();
          var ret2 = tryCatch2(callback).call(receiver, value, index2, length);
          var promiseCreated = promise._popContext();
          debug.checkForgottenReturns(ret2, promiseCreated, preservedValues !== null ? "Promise.filter" : "Promise.map", promise);
          if (ret2 === errorObj2) {
            this._reject(ret2.e);
            return true;
          }
          var maybePromise = tryConvertToPromise(ret2, this._promise);
          if (maybePromise instanceof Promise2) {
            maybePromise = maybePromise._target();
            var bitField = maybePromise._bitField;
            ;
            if ((bitField & 50397184) === 0) {
              if (limit >= 1)
                this._inFlight++;
              values[index2] = maybePromise;
              maybePromise._proxy(this, (index2 + 1) * -1);
              return false;
            } else if ((bitField & 33554432) !== 0) {
              ret2 = maybePromise._value();
            } else if ((bitField & 16777216) !== 0) {
              this._reject(maybePromise._reason());
              return true;
            } else {
              this._cancel();
              return true;
            }
          }
          values[index2] = ret2;
        }
        var totalResolved = ++this._totalResolved;
        if (totalResolved >= length) {
          if (preservedValues !== null) {
            this._filter(values, preservedValues);
          } else {
            this._resolve(values);
          }
          return true;
        }
        return false;
      };
      MappingPromiseArray.prototype._drainQueue = function() {
        var queue = this._queue;
        var limit = this._limit;
        var values = this._values;
        while (queue.length > 0 && this._inFlight < limit) {
          if (this._isResolved())
            return;
          var index2 = queue.pop();
          this._promiseFulfilled(values[index2], index2);
        }
      };
      MappingPromiseArray.prototype._filter = function(booleans, values) {
        var len = values.length;
        var ret2 = new Array(len);
        var j = 0;
        for (var i = 0; i < len; ++i) {
          if (booleans[i])
            ret2[j++] = values[i];
        }
        ret2.length = j;
        this._resolve(ret2);
      };
      MappingPromiseArray.prototype.preservedValues = function() {
        return this._preservedValues;
      };
      function map(promises, fn, options2, _filter) {
        if (typeof fn !== "function") {
          return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var limit = 0;
        if (options2 !== void 0) {
          if (typeof options2 === "object" && options2 !== null) {
            if (typeof options2.concurrency !== "number") {
              return Promise2.reject(new TypeError("'concurrency' must be a number but it is " + util.classString(options2.concurrency)));
            }
            limit = options2.concurrency;
          } else {
            return Promise2.reject(new TypeError("options argument must be an object but it is " + util.classString(options2)));
          }
        }
        limit = typeof limit === "number" && isFinite(limit) && limit >= 1 ? limit : 0;
        return new MappingPromiseArray(promises, fn, limit, _filter).promise();
      }
      Promise2.prototype.map = function(fn, options2) {
        return map(this, fn, options2, null);
      };
      Promise2.map = function(promises, fn, options2, _filter) {
        return map(promises, fn, options2, _filter);
      };
    };
  }
});

// node_modules/bluebird/js/release/nodeify.js
var require_nodeify = __commonJS({
  "node_modules/bluebird/js/release/nodeify.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2) {
      var util = require_util();
      var async = Promise2._async;
      var tryCatch2 = util.tryCatch;
      var errorObj2 = util.errorObj;
      function spreadAdapter(val, nodeback) {
        var promise = this;
        if (!util.isArray(val))
          return successAdapter.call(promise, val, nodeback);
        var ret2 = tryCatch2(nodeback).apply(promise._boundValue(), [null].concat(val));
        if (ret2 === errorObj2) {
          async.throwLater(ret2.e);
        }
      }
      function successAdapter(val, nodeback) {
        var promise = this;
        var receiver = promise._boundValue();
        var ret2 = val === void 0 ? tryCatch2(nodeback).call(receiver, null) : tryCatch2(nodeback).call(receiver, null, val);
        if (ret2 === errorObj2) {
          async.throwLater(ret2.e);
        }
      }
      function errorAdapter(reason, nodeback) {
        var promise = this;
        if (!reason) {
          var newReason = new Error(reason + "");
          newReason.cause = reason;
          reason = newReason;
        }
        var ret2 = tryCatch2(nodeback).call(promise._boundValue(), reason);
        if (ret2 === errorObj2) {
          async.throwLater(ret2.e);
        }
      }
      Promise2.prototype.asCallback = Promise2.prototype.nodeify = function(nodeback, options2) {
        if (typeof nodeback == "function") {
          var adapter = successAdapter;
          if (options2 !== void 0 && Object(options2).spread) {
            adapter = spreadAdapter;
          }
          this._then(adapter, errorAdapter, void 0, this, nodeback);
        }
        return this;
      };
    };
  }
});

// node_modules/bluebird/js/release/promisify.js
var require_promisify = __commonJS({
  "node_modules/bluebird/js/release/promisify.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, INTERNAL) {
      var THIS = {};
      var util = require_util();
      var nodebackForPromise = require_nodeback();
      var withAppended2 = util.withAppended;
      var maybeWrapAsError2 = util.maybeWrapAsError;
      var canEvaluate2 = util.canEvaluate;
      var TypeError2 = require_errors().TypeError;
      var defaultSuffix = "Async";
      var defaultPromisified = { __isPromisified__: true };
      var noCopyProps = [
        "arity",
        "length",
        "name",
        "arguments",
        "caller",
        "callee",
        "prototype",
        "__isPromisified__"
      ];
      var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");
      var defaultFilter = function(name) {
        return util.isIdentifier(name) && name.charAt(0) !== "_" && name !== "constructor";
      };
      function propsFilter(key) {
        return !noCopyPropsPattern.test(key);
      }
      function isPromisified(fn) {
        try {
          return fn.__isPromisified__ === true;
        } catch (e) {
          return false;
        }
      }
      function hasPromisified(obj, key, suffix) {
        var val = util.getDataPropertyOrDefault(obj, key + suffix, defaultPromisified);
        return val ? isPromisified(val) : false;
      }
      function checkValid(ret2, suffix, suffixRegexp) {
        for (var i = 0; i < ret2.length; i += 2) {
          var key = ret2[i];
          if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret2.length; j += 2) {
              if (ret2[j] === keyWithoutAsyncSuffix) {
                throw new TypeError2("Cannot promisify an API that has normal methods with '%s'-suffix\n\n    See http://goo.gl/MqrFmX\n".replace("%s", suffix));
              }
            }
          }
        }
      }
      function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
        var keys = util.inheritedDataKeys(obj);
        var ret2 = [];
        for (var i = 0; i < keys.length; ++i) {
          var key = keys[i];
          var value = obj[key];
          var passesDefaultFilter = filter === defaultFilter ? true : defaultFilter(key, value, obj);
          if (typeof value === "function" && !isPromisified(value) && !hasPromisified(obj, key, suffix) && filter(key, value, obj, passesDefaultFilter)) {
            ret2.push(key, value);
          }
        }
        checkValid(ret2, suffix, suffixRegexp);
        return ret2;
      }
      var escapeIdentRegex = function(str) {
        return str.replace(/([$])/, "\\$");
      };
      var makeNodePromisifiedEval;
      if (true) {
        var switchCaseArgumentOrder = function(likelyArgumentCount) {
          var ret2 = [likelyArgumentCount];
          var min = Math.max(0, likelyArgumentCount - 1 - 3);
          for (var i = likelyArgumentCount - 1; i >= min; --i) {
            ret2.push(i);
          }
          for (var i = likelyArgumentCount + 1; i <= 3; ++i) {
            ret2.push(i);
          }
          return ret2;
        };
        var argumentSequence = function(argumentCount) {
          return util.filledRange(argumentCount, "_arg", "");
        };
        var parameterDeclaration = function(parameterCount2) {
          return util.filledRange(Math.max(parameterCount2, 3), "_arg", "");
        };
        var parameterCount = function(fn) {
          if (typeof fn.length === "number") {
            return Math.max(Math.min(fn.length, 1023 + 1), 0);
          }
          return 0;
        };
        makeNodePromisifiedEval = function(callback, receiver, originalName, fn, _, multiArgs) {
          var newParameterCount = Math.max(0, parameterCount(fn) - 1);
          var argumentOrder = switchCaseArgumentOrder(newParameterCount);
          var shouldProxyThis = typeof callback === "string" || receiver === THIS;
          function generateCallForArgumentCount(count) {
            var args = argumentSequence(count).join(", ");
            var comma = count > 0 ? ", " : "";
            var ret2;
            if (shouldProxyThis) {
              ret2 = "ret = callback.call(this, {{args}}, nodeback); break;\n";
            } else {
              ret2 = receiver === void 0 ? "ret = callback({{args}}, nodeback); break;\n" : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
            }
            return ret2.replace("{{args}}", args).replace(", ", comma);
          }
          function generateArgumentSwitchCase() {
            var ret2 = "";
            for (var i = 0; i < argumentOrder.length; ++i) {
              ret2 += "case " + argumentOrder[i] + ":" + generateCallForArgumentCount(argumentOrder[i]);
            }
            ret2 += "                                                             \n        default:                                                             \n            var args = new Array(len + 1);                                   \n            var i = 0;                                                       \n            for (var i = 0; i < len; ++i) {                                  \n               args[i] = arguments[i];                                       \n            }                                                                \n            args[i] = nodeback;                                              \n            [CodeForCall]                                                    \n            break;                                                           \n        ".replace("[CodeForCall]", shouldProxyThis ? "ret = callback.apply(this, args);\n" : "ret = callback.apply(receiver, args);\n");
            return ret2;
          }
          var getFunctionCode = typeof callback === "string" ? "this != null ? this['" + callback + "'] : fn" : "fn";
          var body = "'use strict';                                                \n        var ret = function (Parameters) {                                    \n            'use strict';                                                    \n            var len = arguments.length;                                      \n            var promise = new Promise(INTERNAL);                             \n            promise._captureStackTrace();                                    \n            var nodeback = nodebackForPromise(promise, " + multiArgs + ");   \n            var ret;                                                         \n            var callback = tryCatch([GetFunctionCode]);                      \n            switch(len) {                                                    \n                [CodeForSwitchCase]                                          \n            }                                                                \n            if (ret === errorObj) {                                          \n                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n            }                                                                \n            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n            return promise;                                                  \n        };                                                                   \n        notEnumerableProp(ret, '__isPromisified__', true);                   \n        return ret;                                                          \n    ".replace("[CodeForSwitchCase]", generateArgumentSwitchCase()).replace("[GetFunctionCode]", getFunctionCode);
          body = body.replace("Parameters", parameterDeclaration(newParameterCount));
          return new Function("Promise", "fn", "receiver", "withAppended", "maybeWrapAsError", "nodebackForPromise", "tryCatch", "errorObj", "notEnumerableProp", "INTERNAL", body)(Promise2, fn, receiver, withAppended2, maybeWrapAsError2, nodebackForPromise, util.tryCatch, util.errorObj, util.notEnumerableProp, INTERNAL);
        };
      }
      function makeNodePromisifiedClosure(callback, receiver, _, fn, __, multiArgs) {
        var defaultThis = function() {
          return this;
        }();
        var method = callback;
        if (typeof method === "string") {
          callback = fn;
        }
        function promisified() {
          var _receiver = receiver;
          if (receiver === THIS)
            _receiver = this;
          var promise = new Promise2(INTERNAL);
          promise._captureStackTrace();
          var cb = typeof method === "string" && this !== defaultThis ? this[method] : callback;
          var fn2 = nodebackForPromise(promise, multiArgs);
          try {
            cb.apply(_receiver, withAppended2(arguments, fn2));
          } catch (e) {
            promise._rejectCallback(maybeWrapAsError2(e), true, true);
          }
          if (!promise._isFateSealed())
            promise._setAsyncGuaranteed();
          return promise;
        }
        util.notEnumerableProp(promisified, "__isPromisified__", true);
        return promisified;
      }
      var makeNodePromisified = canEvaluate2 ? makeNodePromisifiedEval : makeNodePromisifiedClosure;
      function promisifyAll(obj, suffix, filter, promisifier, multiArgs) {
        var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
        var methods = promisifiableMethods(obj, suffix, suffixRegexp, filter);
        for (var i = 0, len = methods.length; i < len; i += 2) {
          var key = methods[i];
          var fn = methods[i + 1];
          var promisifiedKey = key + suffix;
          if (promisifier === makeNodePromisified) {
            obj[promisifiedKey] = makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
          } else {
            var promisified = promisifier(fn, function() {
              return makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
            });
            util.notEnumerableProp(promisified, "__isPromisified__", true);
            obj[promisifiedKey] = promisified;
          }
        }
        util.toFastProperties(obj);
        return obj;
      }
      function promisify(callback, receiver, multiArgs) {
        return makeNodePromisified(callback, receiver, void 0, callback, null, multiArgs);
      }
      Promise2.promisify = function(fn, options2) {
        if (typeof fn !== "function") {
          throw new TypeError2("expecting a function but got " + util.classString(fn));
        }
        if (isPromisified(fn)) {
          return fn;
        }
        options2 = Object(options2);
        var receiver = options2.context === void 0 ? THIS : options2.context;
        var multiArgs = !!options2.multiArgs;
        var ret2 = promisify(fn, receiver, multiArgs);
        util.copyDescriptors(fn, ret2, propsFilter);
        return ret2;
      };
      Promise2.promisifyAll = function(target, options2) {
        if (typeof target !== "function" && typeof target !== "object") {
          throw new TypeError2("the target of promisifyAll must be an object or a function\n\n    See http://goo.gl/MqrFmX\n");
        }
        options2 = Object(options2);
        var multiArgs = !!options2.multiArgs;
        var suffix = options2.suffix;
        if (typeof suffix !== "string")
          suffix = defaultSuffix;
        var filter = options2.filter;
        if (typeof filter !== "function")
          filter = defaultFilter;
        var promisifier = options2.promisifier;
        if (typeof promisifier !== "function")
          promisifier = makeNodePromisified;
        if (!util.isIdentifier(suffix)) {
          throw new RangeError("suffix must be a valid identifier\n\n    See http://goo.gl/MqrFmX\n");
        }
        var keys = util.inheritedDataKeys(target);
        for (var i = 0; i < keys.length; ++i) {
          var value = target[keys[i]];
          if (keys[i] !== "constructor" && util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier, multiArgs);
            promisifyAll(value, suffix, filter, promisifier, multiArgs);
          }
        }
        return promisifyAll(target, suffix, filter, promisifier, multiArgs);
      };
    };
  }
});

// node_modules/bluebird/js/release/props.js
var require_props = __commonJS({
  "node_modules/bluebird/js/release/props.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, PromiseArray, tryConvertToPromise, apiRejection) {
      var util = require_util();
      var isObject2 = util.isObject;
      var es52 = require_es5();
      var Es6Map;
      if (typeof Map === "function")
        Es6Map = Map;
      var mapToEntries = function() {
        var index2 = 0;
        var size = 0;
        function extractEntry(value, key) {
          this[index2] = value;
          this[index2 + size] = key;
          index2++;
        }
        return function mapToEntries2(map) {
          size = map.size;
          index2 = 0;
          var ret2 = new Array(map.size * 2);
          map.forEach(extractEntry, ret2);
          return ret2;
        };
      }();
      var entriesToMap = function(entries) {
        var ret2 = new Es6Map();
        var length = entries.length / 2 | 0;
        for (var i = 0; i < length; ++i) {
          var key = entries[length + i];
          var value = entries[i];
          ret2.set(key, value);
        }
        return ret2;
      };
      function PropertiesPromiseArray(obj) {
        var isMap = false;
        var entries;
        if (Es6Map !== void 0 && obj instanceof Es6Map) {
          entries = mapToEntries(obj);
          isMap = true;
        } else {
          var keys = es52.keys(obj);
          var len = keys.length;
          entries = new Array(len * 2);
          for (var i = 0; i < len; ++i) {
            var key = keys[i];
            entries[i] = obj[key];
            entries[i + len] = key;
          }
        }
        this.constructor$(entries);
        this._isMap = isMap;
        this._init$(void 0, isMap ? -6 : -3);
      }
      util.inherits(PropertiesPromiseArray, PromiseArray);
      PropertiesPromiseArray.prototype._init = function() {
      };
      PropertiesPromiseArray.prototype._promiseFulfilled = function(value, index2) {
        this._values[index2] = value;
        var totalResolved = ++this._totalResolved;
        if (totalResolved >= this._length) {
          var val;
          if (this._isMap) {
            val = entriesToMap(this._values);
          } else {
            val = {};
            var keyOffset = this.length();
            for (var i = 0, len = this.length(); i < len; ++i) {
              val[this._values[i + keyOffset]] = this._values[i];
            }
          }
          this._resolve(val);
          return true;
        }
        return false;
      };
      PropertiesPromiseArray.prototype.shouldCopyValues = function() {
        return false;
      };
      PropertiesPromiseArray.prototype.getActualLength = function(len) {
        return len >> 1;
      };
      function props(promises) {
        var ret2;
        var castValue = tryConvertToPromise(promises);
        if (!isObject2(castValue)) {
          return apiRejection("cannot await properties of a non-object\n\n    See http://goo.gl/MqrFmX\n");
        } else if (castValue instanceof Promise2) {
          ret2 = castValue._then(Promise2.props, void 0, void 0, void 0, void 0);
        } else {
          ret2 = new PropertiesPromiseArray(castValue).promise();
        }
        if (castValue instanceof Promise2) {
          ret2._propagateFrom(castValue, 2);
        }
        return ret2;
      }
      Promise2.prototype.props = function() {
        return props(this);
      };
      Promise2.props = function(promises) {
        return props(promises);
      };
    };
  }
});

// node_modules/bluebird/js/release/race.js
var require_race = __commonJS({
  "node_modules/bluebird/js/release/race.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, INTERNAL, tryConvertToPromise, apiRejection) {
      var util = require_util();
      var raceLater = function(promise) {
        return promise.then(function(array) {
          return race(array, promise);
        });
      };
      function race(promises, parent) {
        var maybePromise = tryConvertToPromise(promises);
        if (maybePromise instanceof Promise2) {
          return raceLater(maybePromise);
        } else {
          promises = util.asArray(promises);
          if (promises === null)
            return apiRejection("expecting an array or an iterable object but got " + util.classString(promises));
        }
        var ret2 = new Promise2(INTERNAL);
        if (parent !== void 0) {
          ret2._propagateFrom(parent, 3);
        }
        var fulfill = ret2._fulfill;
        var reject = ret2._reject;
        for (var i = 0, len = promises.length; i < len; ++i) {
          var val = promises[i];
          if (val === void 0 && !(i in promises)) {
            continue;
          }
          Promise2.cast(val)._then(fulfill, reject, void 0, ret2, null);
        }
        return ret2;
      }
      Promise2.race = function(promises) {
        return race(promises, void 0);
      };
      Promise2.prototype.race = function() {
        return race(this, void 0);
      };
    };
  }
});

// node_modules/bluebird/js/release/reduce.js
var require_reduce = __commonJS({
  "node_modules/bluebird/js/release/reduce.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug) {
      var util = require_util();
      var tryCatch2 = util.tryCatch;
      function ReductionPromiseArray(promises, fn, initialValue, _each) {
        this.constructor$(promises);
        var context = Promise2._getContext();
        this._fn = util.contextBind(context, fn);
        if (initialValue !== void 0) {
          initialValue = Promise2.resolve(initialValue);
          initialValue._attachCancellationCallback(this);
        }
        this._initialValue = initialValue;
        this._currentCancellable = null;
        if (_each === INTERNAL) {
          this._eachValues = Array(this._length);
        } else if (_each === 0) {
          this._eachValues = null;
        } else {
          this._eachValues = void 0;
        }
        this._promise._captureStackTrace();
        this._init$(void 0, -5);
      }
      util.inherits(ReductionPromiseArray, PromiseArray);
      ReductionPromiseArray.prototype._gotAccum = function(accum) {
        if (this._eachValues !== void 0 && this._eachValues !== null && accum !== INTERNAL) {
          this._eachValues.push(accum);
        }
      };
      ReductionPromiseArray.prototype._eachComplete = function(value) {
        if (this._eachValues !== null) {
          this._eachValues.push(value);
        }
        return this._eachValues;
      };
      ReductionPromiseArray.prototype._init = function() {
      };
      ReductionPromiseArray.prototype._resolveEmptyArray = function() {
        this._resolve(this._eachValues !== void 0 ? this._eachValues : this._initialValue);
      };
      ReductionPromiseArray.prototype.shouldCopyValues = function() {
        return false;
      };
      ReductionPromiseArray.prototype._resolve = function(value) {
        this._promise._resolveCallback(value);
        this._values = null;
      };
      ReductionPromiseArray.prototype._resultCancelled = function(sender) {
        if (sender === this._initialValue)
          return this._cancel();
        if (this._isResolved())
          return;
        this._resultCancelled$();
        if (this._currentCancellable instanceof Promise2) {
          this._currentCancellable.cancel();
        }
        if (this._initialValue instanceof Promise2) {
          this._initialValue.cancel();
        }
      };
      ReductionPromiseArray.prototype._iterate = function(values) {
        this._values = values;
        var value;
        var i;
        var length = values.length;
        if (this._initialValue !== void 0) {
          value = this._initialValue;
          i = 0;
        } else {
          value = Promise2.resolve(values[0]);
          i = 1;
        }
        this._currentCancellable = value;
        for (var j = i; j < length; ++j) {
          var maybePromise = values[j];
          if (maybePromise instanceof Promise2) {
            maybePromise.suppressUnhandledRejections();
          }
        }
        if (!value.isRejected()) {
          for (; i < length; ++i) {
            var ctx = {
              accum: null,
              value: values[i],
              index: i,
              length,
              array: this
            };
            value = value._then(gotAccum, void 0, void 0, ctx, void 0);
            if ((i & 127) === 0) {
              value._setNoAsyncGuarantee();
            }
          }
        }
        if (this._eachValues !== void 0) {
          value = value._then(this._eachComplete, void 0, void 0, this, void 0);
        }
        value._then(completed, completed, void 0, value, this);
      };
      Promise2.prototype.reduce = function(fn, initialValue) {
        return reduce(this, fn, initialValue, null);
      };
      Promise2.reduce = function(promises, fn, initialValue, _each) {
        return reduce(promises, fn, initialValue, _each);
      };
      function completed(valueOrReason, array) {
        if (this.isFulfilled()) {
          array._resolve(valueOrReason);
        } else {
          array._reject(valueOrReason);
        }
      }
      function reduce(promises, fn, initialValue, _each) {
        if (typeof fn !== "function") {
          return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
        return array.promise();
      }
      function gotAccum(accum) {
        this.accum = accum;
        this.array._gotAccum(accum);
        var value = tryConvertToPromise(this.value, this.array._promise);
        if (value instanceof Promise2) {
          this.array._currentCancellable = value;
          return value._then(gotValue, void 0, void 0, this, void 0);
        } else {
          return gotValue.call(this, value);
        }
      }
      function gotValue(value) {
        var array = this.array;
        var promise = array._promise;
        var fn = tryCatch2(array._fn);
        promise._pushContext();
        var ret2;
        if (array._eachValues !== void 0) {
          ret2 = fn.call(promise._boundValue(), value, this.index, this.length);
        } else {
          ret2 = fn.call(promise._boundValue(), this.accum, value, this.index, this.length);
        }
        if (ret2 instanceof Promise2) {
          array._currentCancellable = ret2;
        }
        var promiseCreated = promise._popContext();
        debug.checkForgottenReturns(ret2, promiseCreated, array._eachValues !== void 0 ? "Promise.each" : "Promise.reduce", promise);
        return ret2;
      }
    };
  }
});

// node_modules/bluebird/js/release/settle.js
var require_settle = __commonJS({
  "node_modules/bluebird/js/release/settle.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, PromiseArray, debug) {
      var PromiseInspection = Promise2.PromiseInspection;
      var util = require_util();
      function SettledPromiseArray(values) {
        this.constructor$(values);
      }
      util.inherits(SettledPromiseArray, PromiseArray);
      SettledPromiseArray.prototype._promiseResolved = function(index2, inspection) {
        this._values[index2] = inspection;
        var totalResolved = ++this._totalResolved;
        if (totalResolved >= this._length) {
          this._resolve(this._values);
          return true;
        }
        return false;
      };
      SettledPromiseArray.prototype._promiseFulfilled = function(value, index2) {
        var ret2 = new PromiseInspection();
        ret2._bitField = 33554432;
        ret2._settledValueField = value;
        return this._promiseResolved(index2, ret2);
      };
      SettledPromiseArray.prototype._promiseRejected = function(reason, index2) {
        var ret2 = new PromiseInspection();
        ret2._bitField = 16777216;
        ret2._settledValueField = reason;
        return this._promiseResolved(index2, ret2);
      };
      Promise2.settle = function(promises) {
        debug.deprecated(".settle()", ".reflect()");
        return new SettledPromiseArray(promises).promise();
      };
      Promise2.allSettled = function(promises) {
        return new SettledPromiseArray(promises).promise();
      };
      Promise2.prototype.settle = function() {
        return Promise2.settle(this);
      };
    };
  }
});

// node_modules/bluebird/js/release/some.js
var require_some = __commonJS({
  "node_modules/bluebird/js/release/some.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, PromiseArray, apiRejection) {
      var util = require_util();
      var RangeError2 = require_errors().RangeError;
      var AggregateError = require_errors().AggregateError;
      var isArray = util.isArray;
      var CANCELLATION = {};
      function SomePromiseArray(values) {
        this.constructor$(values);
        this._howMany = 0;
        this._unwrap = false;
        this._initialized = false;
      }
      util.inherits(SomePromiseArray, PromiseArray);
      SomePromiseArray.prototype._init = function() {
        if (!this._initialized) {
          return;
        }
        if (this._howMany === 0) {
          this._resolve([]);
          return;
        }
        this._init$(void 0, -5);
        var isArrayResolved = isArray(this._values);
        if (!this._isResolved() && isArrayResolved && this._howMany > this._canPossiblyFulfill()) {
          this._reject(this._getRangeError(this.length()));
        }
      };
      SomePromiseArray.prototype.init = function() {
        this._initialized = true;
        this._init();
      };
      SomePromiseArray.prototype.setUnwrap = function() {
        this._unwrap = true;
      };
      SomePromiseArray.prototype.howMany = function() {
        return this._howMany;
      };
      SomePromiseArray.prototype.setHowMany = function(count) {
        this._howMany = count;
      };
      SomePromiseArray.prototype._promiseFulfilled = function(value) {
        this._addFulfilled(value);
        if (this._fulfilled() === this.howMany()) {
          this._values.length = this.howMany();
          if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
          } else {
            this._resolve(this._values);
          }
          return true;
        }
        return false;
      };
      SomePromiseArray.prototype._promiseRejected = function(reason) {
        this._addRejected(reason);
        return this._checkOutcome();
      };
      SomePromiseArray.prototype._promiseCancelled = function() {
        if (this._values instanceof Promise2 || this._values == null) {
          return this._cancel();
        }
        this._addRejected(CANCELLATION);
        return this._checkOutcome();
      };
      SomePromiseArray.prototype._checkOutcome = function() {
        if (this.howMany() > this._canPossiblyFulfill()) {
          var e = new AggregateError();
          for (var i = this.length(); i < this._values.length; ++i) {
            if (this._values[i] !== CANCELLATION) {
              e.push(this._values[i]);
            }
          }
          if (e.length > 0) {
            this._reject(e);
          } else {
            this._cancel();
          }
          return true;
        }
        return false;
      };
      SomePromiseArray.prototype._fulfilled = function() {
        return this._totalResolved;
      };
      SomePromiseArray.prototype._rejected = function() {
        return this._values.length - this.length();
      };
      SomePromiseArray.prototype._addRejected = function(reason) {
        this._values.push(reason);
      };
      SomePromiseArray.prototype._addFulfilled = function(value) {
        this._values[this._totalResolved++] = value;
      };
      SomePromiseArray.prototype._canPossiblyFulfill = function() {
        return this.length() - this._rejected();
      };
      SomePromiseArray.prototype._getRangeError = function(count) {
        var message = "Input array must contain at least " + this._howMany + " items but contains only " + count + " items";
        return new RangeError2(message);
      };
      SomePromiseArray.prototype._resolveEmptyArray = function() {
        this._reject(this._getRangeError(0));
      };
      function some(promises, howMany) {
        if ((howMany | 0) !== howMany || howMany < 0) {
          return apiRejection("expecting a positive integer\n\n    See http://goo.gl/MqrFmX\n");
        }
        var ret2 = new SomePromiseArray(promises);
        var promise = ret2.promise();
        ret2.setHowMany(howMany);
        ret2.init();
        return promise;
      }
      Promise2.some = function(promises, howMany) {
        return some(promises, howMany);
      };
      Promise2.prototype.some = function(howMany) {
        return some(this, howMany);
      };
      Promise2._SomePromiseArray = SomePromiseArray;
    };
  }
});

// node_modules/bluebird/js/release/timers.js
var require_timers = __commonJS({
  "node_modules/bluebird/js/release/timers.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, INTERNAL, debug) {
      var util = require_util();
      var TimeoutError = Promise2.TimeoutError;
      function HandleWrapper(handle2) {
        this.handle = handle2;
      }
      HandleWrapper.prototype._resultCancelled = function() {
        clearTimeout(this.handle);
      };
      var afterValue = function(value) {
        return delay(+this).thenReturn(value);
      };
      var delay = Promise2.delay = function(ms, value) {
        var ret2;
        var handle2;
        if (value !== void 0) {
          ret2 = Promise2.resolve(value)._then(afterValue, null, null, ms, void 0);
          if (debug.cancellation() && value instanceof Promise2) {
            ret2._setOnCancel(value);
          }
        } else {
          ret2 = new Promise2(INTERNAL);
          handle2 = setTimeout(function() {
            ret2._fulfill();
          }, +ms);
          if (debug.cancellation()) {
            ret2._setOnCancel(new HandleWrapper(handle2));
          }
          ret2._captureStackTrace();
        }
        ret2._setAsyncGuaranteed();
        return ret2;
      };
      Promise2.prototype.delay = function(ms) {
        return delay(ms, this);
      };
      var afterTimeout = function(promise, message, parent) {
        var err;
        if (typeof message !== "string") {
          if (message instanceof Error) {
            err = message;
          } else {
            err = new TimeoutError("operation timed out");
          }
        } else {
          err = new TimeoutError(message);
        }
        util.markAsOriginatingFromRejection(err);
        promise._attachExtraTrace(err);
        promise._reject(err);
        if (parent != null) {
          parent.cancel();
        }
      };
      function successClear(value) {
        clearTimeout(this.handle);
        return value;
      }
      function failureClear(reason) {
        clearTimeout(this.handle);
        throw reason;
      }
      Promise2.prototype.timeout = function(ms, message) {
        ms = +ms;
        var ret2, parent;
        var handleWrapper = new HandleWrapper(setTimeout(function timeoutTimeout() {
          if (ret2.isPending()) {
            afterTimeout(ret2, message, parent);
          }
        }, ms));
        if (debug.cancellation()) {
          parent = this.then();
          ret2 = parent._then(successClear, failureClear, void 0, handleWrapper, void 0);
          ret2._setOnCancel(handleWrapper);
        } else {
          ret2 = this._then(successClear, failureClear, void 0, handleWrapper, void 0);
        }
        return ret2;
      };
    };
  }
});

// node_modules/bluebird/js/release/using.js
var require_using = __commonJS({
  "node_modules/bluebird/js/release/using.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug) {
      var util = require_util();
      var TypeError2 = require_errors().TypeError;
      var inherits2 = require_util().inherits;
      var errorObj2 = util.errorObj;
      var tryCatch2 = util.tryCatch;
      var NULL = {};
      function thrower2(e) {
        setTimeout(function() {
          throw e;
        }, 0);
      }
      function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable && typeof thenable._isDisposable === "function" && typeof thenable._getDisposer === "function" && thenable._isDisposable()) {
          maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
      }
      function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret2 = new Promise2(INTERNAL);
        function iterator() {
          if (i >= len)
            return ret2._fulfill();
          var maybePromise = castPreservingDisposable(resources[i++]);
          if (maybePromise instanceof Promise2 && maybePromise._isDisposable()) {
            try {
              maybePromise = tryConvertToPromise(maybePromise._getDisposer().tryDispose(inspection), resources.promise);
            } catch (e) {
              return thrower2(e);
            }
            if (maybePromise instanceof Promise2) {
              return maybePromise._then(iterator, thrower2, null, null, null);
            }
          }
          iterator();
        }
        iterator();
        return ret2;
      }
      function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
      }
      Disposer.prototype.data = function() {
        return this._data;
      };
      Disposer.prototype.promise = function() {
        return this._promise;
      };
      Disposer.prototype.resource = function() {
        if (this.promise().isFulfilled()) {
          return this.promise().value();
        }
        return NULL;
      };
      Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== void 0)
          context._pushContext();
        var ret2 = resource !== NULL ? this.doDispose(resource, inspection) : null;
        if (context !== void 0)
          context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret2;
      };
      Disposer.isDisposer = function(d2) {
        return d2 != null && typeof d2.resource === "function" && typeof d2.tryDispose === "function";
      };
      function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
      }
      inherits2(FunctionDisposer, Disposer);
      FunctionDisposer.prototype.doDispose = function(resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
      };
      function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
          this.resources[this.index]._setDisposable(value);
          return value.promise();
        }
        return value;
      }
      function ResourceList(length) {
        this.length = length;
        this.promise = null;
        this[length - 1] = null;
      }
      ResourceList.prototype._resultCancelled = function() {
        var len = this.length;
        for (var i = 0; i < len; ++i) {
          var item = this[i];
          if (item instanceof Promise2) {
            item.cancel();
          }
        }
      };
      Promise2.using = function() {
        var len = arguments.length;
        if (len < 2)
          return apiRejection("you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") {
          return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var input;
        var spreadArgs = true;
        if (len === 2 && Array.isArray(arguments[0])) {
          input = arguments[0];
          len = input.length;
          spreadArgs = false;
        } else {
          input = arguments;
          len--;
        }
        var resources = new ResourceList(len);
        for (var i = 0; i < len; ++i) {
          var resource = input[i];
          if (Disposer.isDisposer(resource)) {
            var disposer = resource;
            resource = resource.promise();
            resource._setDisposable(disposer);
          } else {
            var maybePromise = tryConvertToPromise(resource);
            if (maybePromise instanceof Promise2) {
              resource = maybePromise._then(maybeUnwrapDisposer, null, null, {
                resources,
                index: i
              }, void 0);
            }
          }
          resources[i] = resource;
        }
        var reflectedResources = new Array(resources.length);
        for (var i = 0; i < reflectedResources.length; ++i) {
          reflectedResources[i] = Promise2.resolve(resources[i]).reflect();
        }
        var resultPromise = Promise2.all(reflectedResources).then(function(inspections) {
          for (var i2 = 0; i2 < inspections.length; ++i2) {
            var inspection = inspections[i2];
            if (inspection.isRejected()) {
              errorObj2.e = inspection.error();
              return errorObj2;
            } else if (!inspection.isFulfilled()) {
              resultPromise.cancel();
              return;
            }
            inspections[i2] = inspection.value();
          }
          promise._pushContext();
          fn = tryCatch2(fn);
          var ret2 = spreadArgs ? fn.apply(void 0, inspections) : fn(inspections);
          var promiseCreated = promise._popContext();
          debug.checkForgottenReturns(ret2, promiseCreated, "Promise.using", promise);
          return ret2;
        });
        var promise = resultPromise.lastly(function() {
          var inspection = new Promise2.PromiseInspection(resultPromise);
          return dispose(resources, inspection);
        });
        resources.promise = promise;
        promise._setOnCancel(resources);
        return promise;
      };
      Promise2.prototype._setDisposable = function(disposer) {
        this._bitField = this._bitField | 131072;
        this._disposer = disposer;
      };
      Promise2.prototype._isDisposable = function() {
        return (this._bitField & 131072) > 0;
      };
      Promise2.prototype._getDisposer = function() {
        return this._disposer;
      };
      Promise2.prototype._unsetDisposable = function() {
        this._bitField = this._bitField & ~131072;
        this._disposer = void 0;
      };
      Promise2.prototype.disposer = function(fn) {
        if (typeof fn === "function") {
          return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError2();
      };
    };
  }
});

// node_modules/bluebird/js/release/any.js
var require_any = __commonJS({
  "node_modules/bluebird/js/release/any.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2) {
      var SomePromiseArray = Promise2._SomePromiseArray;
      function any(promises) {
        var ret2 = new SomePromiseArray(promises);
        var promise = ret2.promise();
        ret2.setHowMany(1);
        ret2.setUnwrap();
        ret2.init();
        return promise;
      }
      Promise2.any = function(promises) {
        return any(promises);
      };
      Promise2.prototype.any = function() {
        return any(this);
      };
    };
  }
});

// node_modules/bluebird/js/release/each.js
var require_each = __commonJS({
  "node_modules/bluebird/js/release/each.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, INTERNAL) {
      var PromiseReduce = Promise2.reduce;
      var PromiseAll = Promise2.all;
      function promiseAllThis() {
        return PromiseAll(this);
      }
      function PromiseMapSeries(promises, fn) {
        return PromiseReduce(promises, fn, INTERNAL, INTERNAL);
      }
      Promise2.prototype.each = function(fn) {
        return PromiseReduce(this, fn, INTERNAL, 0)._then(promiseAllThis, void 0, void 0, this, void 0);
      };
      Promise2.prototype.mapSeries = function(fn) {
        return PromiseReduce(this, fn, INTERNAL, INTERNAL);
      };
      Promise2.each = function(promises, fn) {
        return PromiseReduce(promises, fn, INTERNAL, 0)._then(promiseAllThis, void 0, void 0, promises, void 0);
      };
      Promise2.mapSeries = PromiseMapSeries;
    };
  }
});

// node_modules/bluebird/js/release/filter.js
var require_filter = __commonJS({
  "node_modules/bluebird/js/release/filter.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function(Promise2, INTERNAL) {
      var PromiseMap = Promise2.map;
      Promise2.prototype.filter = function(fn, options2) {
        return PromiseMap(this, fn, options2, INTERNAL);
      };
      Promise2.filter = function(promises, fn, options2) {
        return PromiseMap(promises, fn, options2, INTERNAL);
      };
    };
  }
});

// node_modules/bluebird/js/release/promise.js
var require_promise = __commonJS({
  "node_modules/bluebird/js/release/promise.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = function() {
      var makeSelfResolutionError = function() {
        return new TypeError2("circular promise resolution chain\n\n    See http://goo.gl/MqrFmX\n");
      };
      var reflectHandler2 = function() {
        return new Promise2.PromiseInspection(this._target());
      };
      var apiRejection = function(msg) {
        return Promise2.reject(new TypeError2(msg));
      };
      function Proxyable() {
      }
      var UNDEFINED_BINDING = {};
      var util = require_util();
      util.setReflectHandler(reflectHandler2);
      var getDomain = function() {
        var domain = process.domain;
        if (domain === void 0) {
          return null;
        }
        return domain;
      };
      var getContextDefault = function() {
        return null;
      };
      var getContextDomain = function() {
        return {
          domain: getDomain(),
          async: null
        };
      };
      var AsyncResource = util.isNode && util.nodeSupportsAsyncResource ? require("async_hooks").AsyncResource : null;
      var getContextAsyncHooks = function() {
        return {
          domain: getDomain(),
          async: new AsyncResource("Bluebird::Promise")
        };
      };
      var getContext = util.isNode ? getContextDomain : getContextDefault;
      util.notEnumerableProp(Promise2, "_getContext", getContext);
      var enableAsyncHooks = function() {
        getContext = getContextAsyncHooks;
        util.notEnumerableProp(Promise2, "_getContext", getContextAsyncHooks);
      };
      var disableAsyncHooks = function() {
        getContext = getContextDomain;
        util.notEnumerableProp(Promise2, "_getContext", getContextDomain);
      };
      var es52 = require_es5();
      var Async = require_async();
      var async = new Async();
      es52.defineProperty(Promise2, "_async", { value: async });
      var errors = require_errors();
      var TypeError2 = Promise2.TypeError = errors.TypeError;
      Promise2.RangeError = errors.RangeError;
      var CancellationError = Promise2.CancellationError = errors.CancellationError;
      Promise2.TimeoutError = errors.TimeoutError;
      Promise2.OperationalError = errors.OperationalError;
      Promise2.RejectionError = errors.OperationalError;
      Promise2.AggregateError = errors.AggregateError;
      var INTERNAL = function() {
      };
      var APPLY = {};
      var NEXT_FILTER = {};
      var tryConvertToPromise = require_thenables()(Promise2, INTERNAL);
      var PromiseArray = require_promise_array()(Promise2, INTERNAL, tryConvertToPromise, apiRejection, Proxyable);
      var Context = require_context()(Promise2);
      var createContext = Context.create;
      var debug = require_debuggability()(Promise2, Context, enableAsyncHooks, disableAsyncHooks);
      var CapturedTrace = debug.CapturedTrace;
      var PassThroughHandlerContext = require_finally()(Promise2, tryConvertToPromise, NEXT_FILTER);
      var catchFilter = require_catch_filter()(NEXT_FILTER);
      var nodebackForPromise = require_nodeback();
      var errorObj2 = util.errorObj;
      var tryCatch2 = util.tryCatch;
      function check(self2, executor) {
        if (self2 == null || self2.constructor !== Promise2) {
          throw new TypeError2("the promise constructor cannot be invoked directly\n\n    See http://goo.gl/MqrFmX\n");
        }
        if (typeof executor !== "function") {
          throw new TypeError2("expecting a function but got " + util.classString(executor));
        }
      }
      function Promise2(executor) {
        if (executor !== INTERNAL) {
          check(this, executor);
        }
        this._bitField = 0;
        this._fulfillmentHandler0 = void 0;
        this._rejectionHandler0 = void 0;
        this._promise0 = void 0;
        this._receiver0 = void 0;
        this._resolveFromExecutor(executor);
        this._promiseCreated();
        this._fireEvent("promiseCreated", this);
      }
      Promise2.prototype.toString = function() {
        return "[object Promise]";
      };
      Promise2.prototype.caught = Promise2.prototype["catch"] = function(fn) {
        var len = arguments.length;
        if (len > 1) {
          var catchInstances = new Array(len - 1), j = 0, i;
          for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
              catchInstances[j++] = item;
            } else {
              return apiRejection("Catch statement predicate: expecting an object but got " + util.classString(item));
            }
          }
          catchInstances.length = j;
          fn = arguments[i];
          if (typeof fn !== "function") {
            throw new TypeError2("The last argument to .catch() must be a function, got " + util.toString(fn));
          }
          return this.then(void 0, catchFilter(catchInstances, fn, this));
        }
        return this.then(void 0, fn);
      };
      Promise2.prototype.reflect = function() {
        return this._then(reflectHandler2, reflectHandler2, void 0, this, void 0);
      };
      Promise2.prototype.then = function(didFulfill, didReject) {
        if (debug.warnings() && arguments.length > 0 && typeof didFulfill !== "function" && typeof didReject !== "function") {
          var msg = ".then() only accepts functions but was passed: " + util.classString(didFulfill);
          if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
          }
          this._warn(msg);
        }
        return this._then(didFulfill, didReject, void 0, void 0, void 0);
      };
      Promise2.prototype.done = function(didFulfill, didReject) {
        var promise = this._then(didFulfill, didReject, void 0, void 0, void 0);
        promise._setIsFinal();
      };
      Promise2.prototype.spread = function(fn) {
        if (typeof fn !== "function") {
          return apiRejection("expecting a function but got " + util.classString(fn));
        }
        return this.all()._then(fn, void 0, void 0, APPLY, void 0);
      };
      Promise2.prototype.toJSON = function() {
        var ret2 = {
          isFulfilled: false,
          isRejected: false,
          fulfillmentValue: void 0,
          rejectionReason: void 0
        };
        if (this.isFulfilled()) {
          ret2.fulfillmentValue = this.value();
          ret2.isFulfilled = true;
        } else if (this.isRejected()) {
          ret2.rejectionReason = this.reason();
          ret2.isRejected = true;
        }
        return ret2;
      };
      Promise2.prototype.all = function() {
        if (arguments.length > 0) {
          this._warn(".all() was passed arguments but it does not take any");
        }
        return new PromiseArray(this).promise();
      };
      Promise2.prototype.error = function(fn) {
        return this.caught(util.originatesFromRejection, fn);
      };
      Promise2.getNewLibraryCopy = module2.exports;
      Promise2.is = function(val) {
        return val instanceof Promise2;
      };
      Promise2.fromNode = Promise2.fromCallback = function(fn) {
        var ret2 = new Promise2(INTERNAL);
        ret2._captureStackTrace();
        var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs : false;
        var result = tryCatch2(fn)(nodebackForPromise(ret2, multiArgs));
        if (result === errorObj2) {
          ret2._rejectCallback(result.e, true);
        }
        if (!ret2._isFateSealed())
          ret2._setAsyncGuaranteed();
        return ret2;
      };
      Promise2.all = function(promises) {
        return new PromiseArray(promises).promise();
      };
      Promise2.cast = function(obj) {
        var ret2 = tryConvertToPromise(obj);
        if (!(ret2 instanceof Promise2)) {
          ret2 = new Promise2(INTERNAL);
          ret2._captureStackTrace();
          ret2._setFulfilled();
          ret2._rejectionHandler0 = obj;
        }
        return ret2;
      };
      Promise2.resolve = Promise2.fulfilled = Promise2.cast;
      Promise2.reject = Promise2.rejected = function(reason) {
        var ret2 = new Promise2(INTERNAL);
        ret2._captureStackTrace();
        ret2._rejectCallback(reason, true);
        return ret2;
      };
      Promise2.setScheduler = function(fn) {
        if (typeof fn !== "function") {
          throw new TypeError2("expecting a function but got " + util.classString(fn));
        }
        return async.setScheduler(fn);
      };
      Promise2.prototype._then = function(didFulfill, didReject, _, receiver, internalData) {
        var haveInternalData = internalData !== void 0;
        var promise = haveInternalData ? internalData : new Promise2(INTERNAL);
        var target = this._target();
        var bitField = target._bitField;
        if (!haveInternalData) {
          promise._propagateFrom(this, 3);
          promise._captureStackTrace();
          if (receiver === void 0 && (this._bitField & 2097152) !== 0) {
            if (!((bitField & 50397184) === 0)) {
              receiver = this._boundValue();
            } else {
              receiver = target === this ? void 0 : this._boundTo;
            }
          }
          this._fireEvent("promiseChained", this, promise);
        }
        var context = getContext();
        if (!((bitField & 50397184) === 0)) {
          var handler2, value, settler = target._settlePromiseCtx;
          if ((bitField & 33554432) !== 0) {
            value = target._rejectionHandler0;
            handler2 = didFulfill;
          } else if ((bitField & 16777216) !== 0) {
            value = target._fulfillmentHandler0;
            handler2 = didReject;
            target._unsetRejectionIsUnhandled();
          } else {
            settler = target._settlePromiseLateCancellationObserver;
            value = new CancellationError("late cancellation observer");
            target._attachExtraTrace(value);
            handler2 = didReject;
          }
          async.invoke(settler, target, {
            handler: util.contextBind(context, handler2),
            promise,
            receiver,
            value
          });
        } else {
          target._addCallbacks(didFulfill, didReject, promise, receiver, context);
        }
        return promise;
      };
      Promise2.prototype._length = function() {
        return this._bitField & 65535;
      };
      Promise2.prototype._isFateSealed = function() {
        return (this._bitField & 117506048) !== 0;
      };
      Promise2.prototype._isFollowing = function() {
        return (this._bitField & 67108864) === 67108864;
      };
      Promise2.prototype._setLength = function(len) {
        this._bitField = this._bitField & -65536 | len & 65535;
      };
      Promise2.prototype._setFulfilled = function() {
        this._bitField = this._bitField | 33554432;
        this._fireEvent("promiseFulfilled", this);
      };
      Promise2.prototype._setRejected = function() {
        this._bitField = this._bitField | 16777216;
        this._fireEvent("promiseRejected", this);
      };
      Promise2.prototype._setFollowing = function() {
        this._bitField = this._bitField | 67108864;
        this._fireEvent("promiseResolved", this);
      };
      Promise2.prototype._setIsFinal = function() {
        this._bitField = this._bitField | 4194304;
      };
      Promise2.prototype._isFinal = function() {
        return (this._bitField & 4194304) > 0;
      };
      Promise2.prototype._unsetCancelled = function() {
        this._bitField = this._bitField & ~65536;
      };
      Promise2.prototype._setCancelled = function() {
        this._bitField = this._bitField | 65536;
        this._fireEvent("promiseCancelled", this);
      };
      Promise2.prototype._setWillBeCancelled = function() {
        this._bitField = this._bitField | 8388608;
      };
      Promise2.prototype._setAsyncGuaranteed = function() {
        if (async.hasCustomScheduler())
          return;
        var bitField = this._bitField;
        this._bitField = bitField | (bitField & 536870912) >> 2 ^ 134217728;
      };
      Promise2.prototype._setNoAsyncGuarantee = function() {
        this._bitField = (this._bitField | 536870912) & ~134217728;
      };
      Promise2.prototype._receiverAt = function(index2) {
        var ret2 = index2 === 0 ? this._receiver0 : this[index2 * 4 - 4 + 3];
        if (ret2 === UNDEFINED_BINDING) {
          return void 0;
        } else if (ret2 === void 0 && this._isBound()) {
          return this._boundValue();
        }
        return ret2;
      };
      Promise2.prototype._promiseAt = function(index2) {
        return this[index2 * 4 - 4 + 2];
      };
      Promise2.prototype._fulfillmentHandlerAt = function(index2) {
        return this[index2 * 4 - 4 + 0];
      };
      Promise2.prototype._rejectionHandlerAt = function(index2) {
        return this[index2 * 4 - 4 + 1];
      };
      Promise2.prototype._boundValue = function() {
      };
      Promise2.prototype._migrateCallback0 = function(follower) {
        var bitField = follower._bitField;
        var fulfill = follower._fulfillmentHandler0;
        var reject = follower._rejectionHandler0;
        var promise = follower._promise0;
        var receiver = follower._receiverAt(0);
        if (receiver === void 0)
          receiver = UNDEFINED_BINDING;
        this._addCallbacks(fulfill, reject, promise, receiver, null);
      };
      Promise2.prototype._migrateCallbackAt = function(follower, index2) {
        var fulfill = follower._fulfillmentHandlerAt(index2);
        var reject = follower._rejectionHandlerAt(index2);
        var promise = follower._promiseAt(index2);
        var receiver = follower._receiverAt(index2);
        if (receiver === void 0)
          receiver = UNDEFINED_BINDING;
        this._addCallbacks(fulfill, reject, promise, receiver, null);
      };
      Promise2.prototype._addCallbacks = function(fulfill, reject, promise, receiver, context) {
        var index2 = this._length();
        if (index2 >= 65535 - 4) {
          index2 = 0;
          this._setLength(0);
        }
        if (index2 === 0) {
          this._promise0 = promise;
          this._receiver0 = receiver;
          if (typeof fulfill === "function") {
            this._fulfillmentHandler0 = util.contextBind(context, fulfill);
          }
          if (typeof reject === "function") {
            this._rejectionHandler0 = util.contextBind(context, reject);
          }
        } else {
          var base2 = index2 * 4 - 4;
          this[base2 + 2] = promise;
          this[base2 + 3] = receiver;
          if (typeof fulfill === "function") {
            this[base2 + 0] = util.contextBind(context, fulfill);
          }
          if (typeof reject === "function") {
            this[base2 + 1] = util.contextBind(context, reject);
          }
        }
        this._setLength(index2 + 1);
        return index2;
      };
      Promise2.prototype._proxy = function(proxyable, arg) {
        this._addCallbacks(void 0, void 0, arg, proxyable, null);
      };
      Promise2.prototype._resolveCallback = function(value, shouldBind) {
        if ((this._bitField & 117506048) !== 0)
          return;
        if (value === this)
          return this._rejectCallback(makeSelfResolutionError(), false);
        var maybePromise = tryConvertToPromise(value, this);
        if (!(maybePromise instanceof Promise2))
          return this._fulfill(value);
        if (shouldBind)
          this._propagateFrom(maybePromise, 2);
        var promise = maybePromise._target();
        if (promise === this) {
          this._reject(makeSelfResolutionError());
          return;
        }
        var bitField = promise._bitField;
        if ((bitField & 50397184) === 0) {
          var len = this._length();
          if (len > 0)
            promise._migrateCallback0(this);
          for (var i = 1; i < len; ++i) {
            promise._migrateCallbackAt(this, i);
          }
          this._setFollowing();
          this._setLength(0);
          this._setFollowee(maybePromise);
        } else if ((bitField & 33554432) !== 0) {
          this._fulfill(promise._value());
        } else if ((bitField & 16777216) !== 0) {
          this._reject(promise._reason());
        } else {
          var reason = new CancellationError("late cancellation observer");
          promise._attachExtraTrace(reason);
          this._reject(reason);
        }
      };
      Promise2.prototype._rejectCallback = function(reason, synchronous, ignoreNonErrorWarnings) {
        var trace = util.ensureErrorObject(reason);
        var hasStack = trace === reason;
        if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
          var message = "a promise was rejected with a non-error: " + util.classString(reason);
          this._warn(message, true);
        }
        this._attachExtraTrace(trace, synchronous ? hasStack : false);
        this._reject(reason);
      };
      Promise2.prototype._resolveFromExecutor = function(executor) {
        if (executor === INTERNAL)
          return;
        var promise = this;
        this._captureStackTrace();
        this._pushContext();
        var synchronous = true;
        var r = this._execute(executor, function(value) {
          promise._resolveCallback(value);
        }, function(reason) {
          promise._rejectCallback(reason, synchronous);
        });
        synchronous = false;
        this._popContext();
        if (r !== void 0) {
          promise._rejectCallback(r, true);
        }
      };
      Promise2.prototype._settlePromiseFromHandler = function(handler2, receiver, value, promise) {
        var bitField = promise._bitField;
        if ((bitField & 65536) !== 0)
          return;
        promise._pushContext();
        var x;
        if (receiver === APPLY) {
          if (!value || typeof value.length !== "number") {
            x = errorObj2;
            x.e = new TypeError2("cannot .spread() a non-array: " + util.classString(value));
          } else {
            x = tryCatch2(handler2).apply(this._boundValue(), value);
          }
        } else {
          x = tryCatch2(handler2).call(receiver, value);
        }
        var promiseCreated = promise._popContext();
        bitField = promise._bitField;
        if ((bitField & 65536) !== 0)
          return;
        if (x === NEXT_FILTER) {
          promise._reject(value);
        } else if (x === errorObj2) {
          promise._rejectCallback(x.e, false);
        } else {
          debug.checkForgottenReturns(x, promiseCreated, "", promise, this);
          promise._resolveCallback(x);
        }
      };
      Promise2.prototype._target = function() {
        var ret2 = this;
        while (ret2._isFollowing())
          ret2 = ret2._followee();
        return ret2;
      };
      Promise2.prototype._followee = function() {
        return this._rejectionHandler0;
      };
      Promise2.prototype._setFollowee = function(promise) {
        this._rejectionHandler0 = promise;
      };
      Promise2.prototype._settlePromise = function(promise, handler2, receiver, value) {
        var isPromise = promise instanceof Promise2;
        var bitField = this._bitField;
        var asyncGuaranteed = (bitField & 134217728) !== 0;
        if ((bitField & 65536) !== 0) {
          if (isPromise)
            promise._invokeInternalOnCancel();
          if (receiver instanceof PassThroughHandlerContext && receiver.isFinallyHandler()) {
            receiver.cancelPromise = promise;
            if (tryCatch2(handler2).call(receiver, value) === errorObj2) {
              promise._reject(errorObj2.e);
            }
          } else if (handler2 === reflectHandler2) {
            promise._fulfill(reflectHandler2.call(receiver));
          } else if (receiver instanceof Proxyable) {
            receiver._promiseCancelled(promise);
          } else if (isPromise || promise instanceof PromiseArray) {
            promise._cancel();
          } else {
            receiver.cancel();
          }
        } else if (typeof handler2 === "function") {
          if (!isPromise) {
            handler2.call(receiver, value, promise);
          } else {
            if (asyncGuaranteed)
              promise._setAsyncGuaranteed();
            this._settlePromiseFromHandler(handler2, receiver, value, promise);
          }
        } else if (receiver instanceof Proxyable) {
          if (!receiver._isResolved()) {
            if ((bitField & 33554432) !== 0) {
              receiver._promiseFulfilled(value, promise);
            } else {
              receiver._promiseRejected(value, promise);
            }
          }
        } else if (isPromise) {
          if (asyncGuaranteed)
            promise._setAsyncGuaranteed();
          if ((bitField & 33554432) !== 0) {
            promise._fulfill(value);
          } else {
            promise._reject(value);
          }
        }
      };
      Promise2.prototype._settlePromiseLateCancellationObserver = function(ctx) {
        var handler2 = ctx.handler;
        var promise = ctx.promise;
        var receiver = ctx.receiver;
        var value = ctx.value;
        if (typeof handler2 === "function") {
          if (!(promise instanceof Promise2)) {
            handler2.call(receiver, value, promise);
          } else {
            this._settlePromiseFromHandler(handler2, receiver, value, promise);
          }
        } else if (promise instanceof Promise2) {
          promise._reject(value);
        }
      };
      Promise2.prototype._settlePromiseCtx = function(ctx) {
        this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value);
      };
      Promise2.prototype._settlePromise0 = function(handler2, value, bitField) {
        var promise = this._promise0;
        var receiver = this._receiverAt(0);
        this._promise0 = void 0;
        this._receiver0 = void 0;
        this._settlePromise(promise, handler2, receiver, value);
      };
      Promise2.prototype._clearCallbackDataAtIndex = function(index2) {
        var base2 = index2 * 4 - 4;
        this[base2 + 2] = this[base2 + 3] = this[base2 + 0] = this[base2 + 1] = void 0;
      };
      Promise2.prototype._fulfill = function(value) {
        var bitField = this._bitField;
        if ((bitField & 117506048) >>> 16)
          return;
        if (value === this) {
          var err = makeSelfResolutionError();
          this._attachExtraTrace(err);
          return this._reject(err);
        }
        this._setFulfilled();
        this._rejectionHandler0 = value;
        if ((bitField & 65535) > 0) {
          if ((bitField & 134217728) !== 0) {
            this._settlePromises();
          } else {
            async.settlePromises(this);
          }
          this._dereferenceTrace();
        }
      };
      Promise2.prototype._reject = function(reason) {
        var bitField = this._bitField;
        if ((bitField & 117506048) >>> 16)
          return;
        this._setRejected();
        this._fulfillmentHandler0 = reason;
        if (this._isFinal()) {
          return async.fatalError(reason, util.isNode);
        }
        if ((bitField & 65535) > 0) {
          async.settlePromises(this);
        } else {
          this._ensurePossibleRejectionHandled();
        }
      };
      Promise2.prototype._fulfillPromises = function(len, value) {
        for (var i = 1; i < len; i++) {
          var handler2 = this._fulfillmentHandlerAt(i);
          var promise = this._promiseAt(i);
          var receiver = this._receiverAt(i);
          this._clearCallbackDataAtIndex(i);
          this._settlePromise(promise, handler2, receiver, value);
        }
      };
      Promise2.prototype._rejectPromises = function(len, reason) {
        for (var i = 1; i < len; i++) {
          var handler2 = this._rejectionHandlerAt(i);
          var promise = this._promiseAt(i);
          var receiver = this._receiverAt(i);
          this._clearCallbackDataAtIndex(i);
          this._settlePromise(promise, handler2, receiver, reason);
        }
      };
      Promise2.prototype._settlePromises = function() {
        var bitField = this._bitField;
        var len = bitField & 65535;
        if (len > 0) {
          if ((bitField & 16842752) !== 0) {
            var reason = this._fulfillmentHandler0;
            this._settlePromise0(this._rejectionHandler0, reason, bitField);
            this._rejectPromises(len, reason);
          } else {
            var value = this._rejectionHandler0;
            this._settlePromise0(this._fulfillmentHandler0, value, bitField);
            this._fulfillPromises(len, value);
          }
          this._setLength(0);
        }
        this._clearCancellationData();
      };
      Promise2.prototype._settledValue = function() {
        var bitField = this._bitField;
        if ((bitField & 33554432) !== 0) {
          return this._rejectionHandler0;
        } else if ((bitField & 16777216) !== 0) {
          return this._fulfillmentHandler0;
        }
      };
      if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
        es52.defineProperty(Promise2.prototype, Symbol.toStringTag, {
          get: function() {
            return "Object";
          }
        });
      }
      function deferResolve(v) {
        this.promise._resolveCallback(v);
      }
      function deferReject(v) {
        this.promise._rejectCallback(v, false);
      }
      Promise2.defer = Promise2.pending = function() {
        debug.deprecated("Promise.defer", "new Promise");
        var promise = new Promise2(INTERNAL);
        return {
          promise,
          resolve: deferResolve,
          reject: deferReject
        };
      };
      util.notEnumerableProp(Promise2, "_makeSelfResolutionError", makeSelfResolutionError);
      require_method()(Promise2, INTERNAL, tryConvertToPromise, apiRejection, debug);
      require_bind()(Promise2, INTERNAL, tryConvertToPromise, debug);
      require_cancel()(Promise2, PromiseArray, apiRejection, debug);
      require_direct_resolve()(Promise2);
      require_synchronous_inspection()(Promise2);
      require_join()(Promise2, PromiseArray, tryConvertToPromise, INTERNAL, async);
      Promise2.Promise = Promise2;
      Promise2.version = "3.7.2";
      require_call_get()(Promise2);
      require_generators()(Promise2, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug);
      require_map2()(Promise2, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
      require_nodeify()(Promise2);
      require_promisify()(Promise2, INTERNAL);
      require_props()(Promise2, PromiseArray, tryConvertToPromise, apiRejection);
      require_race()(Promise2, INTERNAL, tryConvertToPromise, apiRejection);
      require_reduce()(Promise2, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
      require_settle()(Promise2, PromiseArray, debug);
      require_some()(Promise2, PromiseArray, apiRejection);
      require_timers()(Promise2, INTERNAL, debug);
      require_using()(Promise2, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug);
      require_any()(Promise2);
      require_each()(Promise2, INTERNAL);
      require_filter()(Promise2, INTERNAL);
      util.toFastProperties(Promise2);
      util.toFastProperties(Promise2.prototype);
      function fillTypes(value) {
        var p = new Promise2(INTERNAL);
        p._fulfillmentHandler0 = value;
        p._rejectionHandler0 = value;
        p._promise0 = value;
        p._receiver0 = value;
      }
      fillTypes({ a: 1 });
      fillTypes({ b: 2 });
      fillTypes({ c: 3 });
      fillTypes(1);
      fillTypes(function() {
      });
      fillTypes(void 0);
      fillTypes(false);
      fillTypes(new Promise2(INTERNAL));
      debug.setBounds(Async.firstLineError, util.lastLineError);
      return Promise2;
    };
  }
});

// node_modules/bluebird/js/release/bluebird.js
var require_bluebird = __commonJS({
  "node_modules/bluebird/js/release/bluebird.js"(exports2, module2) {
    init_shims();
    "use strict";
    var old;
    if (typeof Promise !== "undefined")
      old = Promise;
    function noConflict() {
      try {
        if (Promise === bluebird)
          Promise = old;
      } catch (e) {
      }
      return bluebird;
    }
    var bluebird = require_promise()();
    bluebird.noConflict = noConflict;
    module2.exports = bluebird;
  }
});

// node_modules/process-nextick-args/index.js
var require_process_nextick_args = __commonJS({
  "node_modules/process-nextick-args/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    if (typeof process === "undefined" || !process.version || process.version.indexOf("v0.") === 0 || process.version.indexOf("v1.") === 0 && process.version.indexOf("v1.8.") !== 0) {
      module2.exports = { nextTick };
    } else {
      module2.exports = process;
    }
    function nextTick(fn, arg1, arg2, arg3) {
      if (typeof fn !== "function") {
        throw new TypeError('"callback" argument must be a function');
      }
      var len = arguments.length;
      var args, i;
      switch (len) {
        case 0:
        case 1:
          return process.nextTick(fn);
        case 2:
          return process.nextTick(function afterTickOne() {
            fn.call(null, arg1);
          });
        case 3:
          return process.nextTick(function afterTickTwo() {
            fn.call(null, arg1, arg2);
          });
        case 4:
          return process.nextTick(function afterTickThree() {
            fn.call(null, arg1, arg2, arg3);
          });
        default:
          args = new Array(len - 1);
          i = 0;
          while (i < args.length) {
            args[i++] = arguments[i];
          }
          return process.nextTick(function afterTick() {
            fn.apply(null, args);
          });
      }
    }
  }
});

// node_modules/isarray/index.js
var require_isarray = __commonJS({
  "node_modules/isarray/index.js"(exports2, module2) {
    init_shims();
    var toString = {}.toString;
    module2.exports = Array.isArray || function(arr) {
      return toString.call(arr) == "[object Array]";
    };
  }
});

// node_modules/readable-stream/lib/internal/streams/stream.js
var require_stream = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/stream.js"(exports2, module2) {
    init_shims();
    module2.exports = require("stream");
  }
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports2, module2) {
    init_shims();
    var buffer = require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src2, dst) {
      for (var key in src2) {
        dst[key] = src2[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module2.exports = buffer;
    } else {
      copyProps(buffer, exports2);
      exports2.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/core-util-is/lib/util.js
var require_util2 = __commonJS({
  "node_modules/core-util-is/lib/util.js"(exports2) {
    init_shims();
    function isArray(arg) {
      if (Array.isArray) {
        return Array.isArray(arg);
      }
      return objectToString(arg) === "[object Array]";
    }
    exports2.isArray = isArray;
    function isBoolean(arg) {
      return typeof arg === "boolean";
    }
    exports2.isBoolean = isBoolean;
    function isNull(arg) {
      return arg === null;
    }
    exports2.isNull = isNull;
    function isNullOrUndefined(arg) {
      return arg == null;
    }
    exports2.isNullOrUndefined = isNullOrUndefined;
    function isNumber(arg) {
      return typeof arg === "number";
    }
    exports2.isNumber = isNumber;
    function isString(arg) {
      return typeof arg === "string";
    }
    exports2.isString = isString;
    function isSymbol(arg) {
      return typeof arg === "symbol";
    }
    exports2.isSymbol = isSymbol;
    function isUndefined(arg) {
      return arg === void 0;
    }
    exports2.isUndefined = isUndefined;
    function isRegExp(re) {
      return objectToString(re) === "[object RegExp]";
    }
    exports2.isRegExp = isRegExp;
    function isObject2(arg) {
      return typeof arg === "object" && arg !== null;
    }
    exports2.isObject = isObject2;
    function isDate(d2) {
      return objectToString(d2) === "[object Date]";
    }
    exports2.isDate = isDate;
    function isError2(e) {
      return objectToString(e) === "[object Error]" || e instanceof Error;
    }
    exports2.isError = isError2;
    function isFunction(arg) {
      return typeof arg === "function";
    }
    exports2.isFunction = isFunction;
    function isPrimitive3(arg) {
      return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
    }
    exports2.isPrimitive = isPrimitive3;
    exports2.isBuffer = Buffer.isBuffer;
    function objectToString(o) {
      return Object.prototype.toString.call(o);
    }
  }
});

// node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS({
  "node_modules/inherits/inherits_browser.js"(exports2, module2) {
    init_shims();
    if (typeof Object.create === "function") {
      module2.exports = function inherits2(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      };
    } else {
      module2.exports = function inherits2(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {
          };
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
  }
});

// node_modules/inherits/inherits.js
var require_inherits = __commonJS({
  "node_modules/inherits/inherits.js"(exports2, module2) {
    init_shims();
    try {
      util = require("util");
      if (typeof util.inherits !== "function")
        throw "";
      module2.exports = util.inherits;
    } catch (e) {
      module2.exports = require_inherits_browser();
    }
    var util;
  }
});

// node_modules/readable-stream/lib/internal/streams/BufferList.js
var require_BufferList = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/BufferList.js"(exports2, module2) {
    init_shims();
    "use strict";
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    var Buffer2 = require_safe_buffer().Buffer;
    var util = require("util");
    function copyBuffer(src2, target, offset) {
      src2.copy(target, offset);
    }
    module2.exports = function() {
      function BufferList() {
        _classCallCheck(this, BufferList);
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      BufferList.prototype.push = function push(v) {
        var entry = { data: v, next: null };
        if (this.length > 0)
          this.tail.next = entry;
        else
          this.head = entry;
        this.tail = entry;
        ++this.length;
      };
      BufferList.prototype.unshift = function unshift(v) {
        var entry = { data: v, next: this.head };
        if (this.length === 0)
          this.tail = entry;
        this.head = entry;
        ++this.length;
      };
      BufferList.prototype.shift = function shift() {
        if (this.length === 0)
          return;
        var ret2 = this.head.data;
        if (this.length === 1)
          this.head = this.tail = null;
        else
          this.head = this.head.next;
        --this.length;
        return ret2;
      };
      BufferList.prototype.clear = function clear() {
        this.head = this.tail = null;
        this.length = 0;
      };
      BufferList.prototype.join = function join(s2) {
        if (this.length === 0)
          return "";
        var p = this.head;
        var ret2 = "" + p.data;
        while (p = p.next) {
          ret2 += s2 + p.data;
        }
        return ret2;
      };
      BufferList.prototype.concat = function concat(n) {
        if (this.length === 0)
          return Buffer2.alloc(0);
        if (this.length === 1)
          return this.head.data;
        var ret2 = Buffer2.allocUnsafe(n >>> 0);
        var p = this.head;
        var i = 0;
        while (p) {
          copyBuffer(p.data, ret2, i);
          i += p.data.length;
          p = p.next;
        }
        return ret2;
      };
      return BufferList;
    }();
    if (util && util.inspect && util.inspect.custom) {
      module2.exports.prototype[util.inspect.custom] = function() {
        var obj = util.inspect({ length: this.length });
        return this.constructor.name + " " + obj;
      };
    }
  }
});

// node_modules/readable-stream/lib/internal/streams/destroy.js
var require_destroy = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/destroy.js"(exports2, module2) {
    init_shims();
    "use strict";
    var pna = require_process_nextick_args();
    function destroy(err, cb) {
      var _this = this;
      var readableDestroyed = this._readableState && this._readableState.destroyed;
      var writableDestroyed = this._writableState && this._writableState.destroyed;
      if (readableDestroyed || writableDestroyed) {
        if (cb) {
          cb(err);
        } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
          pna.nextTick(emitErrorNT, this, err);
        }
        return this;
      }
      if (this._readableState) {
        this._readableState.destroyed = true;
      }
      if (this._writableState) {
        this._writableState.destroyed = true;
      }
      this._destroy(err || null, function(err2) {
        if (!cb && err2) {
          pna.nextTick(emitErrorNT, _this, err2);
          if (_this._writableState) {
            _this._writableState.errorEmitted = true;
          }
        } else if (cb) {
          cb(err2);
        }
      });
      return this;
    }
    function undestroy() {
      if (this._readableState) {
        this._readableState.destroyed = false;
        this._readableState.reading = false;
        this._readableState.ended = false;
        this._readableState.endEmitted = false;
      }
      if (this._writableState) {
        this._writableState.destroyed = false;
        this._writableState.ended = false;
        this._writableState.ending = false;
        this._writableState.finished = false;
        this._writableState.errorEmitted = false;
      }
    }
    function emitErrorNT(self2, err) {
      self2.emit("error", err);
    }
    module2.exports = {
      destroy,
      undestroy
    };
  }
});

// node_modules/util-deprecate/node.js
var require_node = __commonJS({
  "node_modules/util-deprecate/node.js"(exports2, module2) {
    init_shims();
    module2.exports = require("util").deprecate;
  }
});

// node_modules/readable-stream/lib/_stream_writable.js
var require_stream_writable = __commonJS({
  "node_modules/readable-stream/lib/_stream_writable.js"(exports2, module2) {
    init_shims();
    "use strict";
    var pna = require_process_nextick_args();
    module2.exports = Writable;
    function CorkedRequest(state) {
      var _this = this;
      this.next = null;
      this.entry = null;
      this.finish = function() {
        onCorkedFinish(_this, state);
      };
    }
    var asyncWrite = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
    var Duplex;
    Writable.WritableState = WritableState;
    var util = Object.create(require_util2());
    util.inherits = require_inherits();
    var internalUtil = {
      deprecate: require_node()
    };
    var Stream2 = require_stream();
    var Buffer2 = require_safe_buffer().Buffer;
    var OurUint8Array = global.Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    var destroyImpl = require_destroy();
    util.inherits(Writable, Stream2);
    function nop() {
    }
    function WritableState(options2, stream) {
      Duplex = Duplex || require_stream_duplex();
      options2 = options2 || {};
      var isDuplex = stream instanceof Duplex;
      this.objectMode = !!options2.objectMode;
      if (isDuplex)
        this.objectMode = this.objectMode || !!options2.writableObjectMode;
      var hwm = options2.highWaterMark;
      var writableHwm = options2.writableHighWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;
      if (hwm || hwm === 0)
        this.highWaterMark = hwm;
      else if (isDuplex && (writableHwm || writableHwm === 0))
        this.highWaterMark = writableHwm;
      else
        this.highWaterMark = defaultHwm;
      this.highWaterMark = Math.floor(this.highWaterMark);
      this.finalCalled = false;
      this.needDrain = false;
      this.ending = false;
      this.ended = false;
      this.finished = false;
      this.destroyed = false;
      var noDecode = options2.decodeStrings === false;
      this.decodeStrings = !noDecode;
      this.defaultEncoding = options2.defaultEncoding || "utf8";
      this.length = 0;
      this.writing = false;
      this.corked = 0;
      this.sync = true;
      this.bufferProcessing = false;
      this.onwrite = function(er) {
        onwrite(stream, er);
      };
      this.writecb = null;
      this.writelen = 0;
      this.bufferedRequest = null;
      this.lastBufferedRequest = null;
      this.pendingcb = 0;
      this.prefinished = false;
      this.errorEmitted = false;
      this.bufferedRequestCount = 0;
      this.corkedRequestsFree = new CorkedRequest(this);
    }
    WritableState.prototype.getBuffer = function getBuffer() {
      var current = this.bufferedRequest;
      var out = [];
      while (current) {
        out.push(current);
        current = current.next;
      }
      return out;
    };
    (function() {
      try {
        Object.defineProperty(WritableState.prototype, "buffer", {
          get: internalUtil.deprecate(function() {
            return this.getBuffer();
          }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
        });
      } catch (_) {
      }
    })();
    var realHasInstance;
    if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
      realHasInstance = Function.prototype[Symbol.hasInstance];
      Object.defineProperty(Writable, Symbol.hasInstance, {
        value: function(object) {
          if (realHasInstance.call(this, object))
            return true;
          if (this !== Writable)
            return false;
          return object && object._writableState instanceof WritableState;
        }
      });
    } else {
      realHasInstance = function(object) {
        return object instanceof this;
      };
    }
    function Writable(options2) {
      Duplex = Duplex || require_stream_duplex();
      if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
        return new Writable(options2);
      }
      this._writableState = new WritableState(options2, this);
      this.writable = true;
      if (options2) {
        if (typeof options2.write === "function")
          this._write = options2.write;
        if (typeof options2.writev === "function")
          this._writev = options2.writev;
        if (typeof options2.destroy === "function")
          this._destroy = options2.destroy;
        if (typeof options2.final === "function")
          this._final = options2.final;
      }
      Stream2.call(this);
    }
    Writable.prototype.pipe = function() {
      this.emit("error", new Error("Cannot pipe, not readable"));
    };
    function writeAfterEnd(stream, cb) {
      var er = new Error("write after end");
      stream.emit("error", er);
      pna.nextTick(cb, er);
    }
    function validChunk(stream, state, chunk, cb) {
      var valid = true;
      var er = false;
      if (chunk === null) {
        er = new TypeError("May not write null values to stream");
      } else if (typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) {
        er = new TypeError("Invalid non-string/buffer chunk");
      }
      if (er) {
        stream.emit("error", er);
        pna.nextTick(cb, er);
        valid = false;
      }
      return valid;
    }
    Writable.prototype.write = function(chunk, encoding, cb) {
      var state = this._writableState;
      var ret2 = false;
      var isBuf = !state.objectMode && _isUint8Array(chunk);
      if (isBuf && !Buffer2.isBuffer(chunk)) {
        chunk = _uint8ArrayToBuffer(chunk);
      }
      if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (isBuf)
        encoding = "buffer";
      else if (!encoding)
        encoding = state.defaultEncoding;
      if (typeof cb !== "function")
        cb = nop;
      if (state.ended)
        writeAfterEnd(this, cb);
      else if (isBuf || validChunk(this, state, chunk, cb)) {
        state.pendingcb++;
        ret2 = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
      }
      return ret2;
    };
    Writable.prototype.cork = function() {
      var state = this._writableState;
      state.corked++;
    };
    Writable.prototype.uncork = function() {
      var state = this._writableState;
      if (state.corked) {
        state.corked--;
        if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest)
          clearBuffer(this, state);
      }
    };
    Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
      if (typeof encoding === "string")
        encoding = encoding.toLowerCase();
      if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1))
        throw new TypeError("Unknown encoding: " + encoding);
      this._writableState.defaultEncoding = encoding;
      return this;
    };
    function decodeChunk(state, chunk, encoding) {
      if (!state.objectMode && state.decodeStrings !== false && typeof chunk === "string") {
        chunk = Buffer2.from(chunk, encoding);
      }
      return chunk;
    }
    Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
      enumerable: false,
      get: function() {
        return this._writableState.highWaterMark;
      }
    });
    function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
      if (!isBuf) {
        var newChunk = decodeChunk(state, chunk, encoding);
        if (chunk !== newChunk) {
          isBuf = true;
          encoding = "buffer";
          chunk = newChunk;
        }
      }
      var len = state.objectMode ? 1 : chunk.length;
      state.length += len;
      var ret2 = state.length < state.highWaterMark;
      if (!ret2)
        state.needDrain = true;
      if (state.writing || state.corked) {
        var last = state.lastBufferedRequest;
        state.lastBufferedRequest = {
          chunk,
          encoding,
          isBuf,
          callback: cb,
          next: null
        };
        if (last) {
          last.next = state.lastBufferedRequest;
        } else {
          state.bufferedRequest = state.lastBufferedRequest;
        }
        state.bufferedRequestCount += 1;
      } else {
        doWrite(stream, state, false, len, chunk, encoding, cb);
      }
      return ret2;
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      state.writelen = len;
      state.writecb = cb;
      state.writing = true;
      state.sync = true;
      if (writev)
        stream._writev(chunk, state.onwrite);
      else
        stream._write(chunk, encoding, state.onwrite);
      state.sync = false;
    }
    function onwriteError(stream, state, sync, er, cb) {
      --state.pendingcb;
      if (sync) {
        pna.nextTick(cb, er);
        pna.nextTick(finishMaybe, stream, state);
        stream._writableState.errorEmitted = true;
        stream.emit("error", er);
      } else {
        cb(er);
        stream._writableState.errorEmitted = true;
        stream.emit("error", er);
        finishMaybe(stream, state);
      }
    }
    function onwriteStateUpdate(state) {
      state.writing = false;
      state.writecb = null;
      state.length -= state.writelen;
      state.writelen = 0;
    }
    function onwrite(stream, er) {
      var state = stream._writableState;
      var sync = state.sync;
      var cb = state.writecb;
      onwriteStateUpdate(state);
      if (er)
        onwriteError(stream, state, sync, er, cb);
      else {
        var finished = needFinish(state);
        if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
          clearBuffer(stream, state);
        }
        if (sync) {
          asyncWrite(afterWrite, stream, state, finished, cb);
        } else {
          afterWrite(stream, state, finished, cb);
        }
      }
    }
    function afterWrite(stream, state, finished, cb) {
      if (!finished)
        onwriteDrain(stream, state);
      state.pendingcb--;
      cb();
      finishMaybe(stream, state);
    }
    function onwriteDrain(stream, state) {
      if (state.length === 0 && state.needDrain) {
        state.needDrain = false;
        stream.emit("drain");
      }
    }
    function clearBuffer(stream, state) {
      state.bufferProcessing = true;
      var entry = state.bufferedRequest;
      if (stream._writev && entry && entry.next) {
        var l = state.bufferedRequestCount;
        var buffer = new Array(l);
        var holder = state.corkedRequestsFree;
        holder.entry = entry;
        var count = 0;
        var allBuffers = true;
        while (entry) {
          buffer[count] = entry;
          if (!entry.isBuf)
            allBuffers = false;
          entry = entry.next;
          count += 1;
        }
        buffer.allBuffers = allBuffers;
        doWrite(stream, state, true, state.length, buffer, "", holder.finish);
        state.pendingcb++;
        state.lastBufferedRequest = null;
        if (holder.next) {
          state.corkedRequestsFree = holder.next;
          holder.next = null;
        } else {
          state.corkedRequestsFree = new CorkedRequest(state);
        }
        state.bufferedRequestCount = 0;
      } else {
        while (entry) {
          var chunk = entry.chunk;
          var encoding = entry.encoding;
          var cb = entry.callback;
          var len = state.objectMode ? 1 : chunk.length;
          doWrite(stream, state, false, len, chunk, encoding, cb);
          entry = entry.next;
          state.bufferedRequestCount--;
          if (state.writing) {
            break;
          }
        }
        if (entry === null)
          state.lastBufferedRequest = null;
      }
      state.bufferedRequest = entry;
      state.bufferProcessing = false;
    }
    Writable.prototype._write = function(chunk, encoding, cb) {
      cb(new Error("_write() is not implemented"));
    };
    Writable.prototype._writev = null;
    Writable.prototype.end = function(chunk, encoding, cb) {
      var state = this._writableState;
      if (typeof chunk === "function") {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (chunk !== null && chunk !== void 0)
        this.write(chunk, encoding);
      if (state.corked) {
        state.corked = 1;
        this.uncork();
      }
      if (!state.ending && !state.finished)
        endWritable(this, state, cb);
    };
    function needFinish(state) {
      return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
    }
    function callFinal(stream, state) {
      stream._final(function(err) {
        state.pendingcb--;
        if (err) {
          stream.emit("error", err);
        }
        state.prefinished = true;
        stream.emit("prefinish");
        finishMaybe(stream, state);
      });
    }
    function prefinish(stream, state) {
      if (!state.prefinished && !state.finalCalled) {
        if (typeof stream._final === "function") {
          state.pendingcb++;
          state.finalCalled = true;
          pna.nextTick(callFinal, stream, state);
        } else {
          state.prefinished = true;
          stream.emit("prefinish");
        }
      }
    }
    function finishMaybe(stream, state) {
      var need = needFinish(state);
      if (need) {
        prefinish(stream, state);
        if (state.pendingcb === 0) {
          state.finished = true;
          stream.emit("finish");
        }
      }
      return need;
    }
    function endWritable(stream, state, cb) {
      state.ending = true;
      finishMaybe(stream, state);
      if (cb) {
        if (state.finished)
          pna.nextTick(cb);
        else
          stream.once("finish", cb);
      }
      state.ended = true;
      stream.writable = false;
    }
    function onCorkedFinish(corkReq, state, err) {
      var entry = corkReq.entry;
      corkReq.entry = null;
      while (entry) {
        var cb = entry.callback;
        state.pendingcb--;
        cb(err);
        entry = entry.next;
      }
      if (state.corkedRequestsFree) {
        state.corkedRequestsFree.next = corkReq;
      } else {
        state.corkedRequestsFree = corkReq;
      }
    }
    Object.defineProperty(Writable.prototype, "destroyed", {
      get: function() {
        if (this._writableState === void 0) {
          return false;
        }
        return this._writableState.destroyed;
      },
      set: function(value) {
        if (!this._writableState) {
          return;
        }
        this._writableState.destroyed = value;
      }
    });
    Writable.prototype.destroy = destroyImpl.destroy;
    Writable.prototype._undestroy = destroyImpl.undestroy;
    Writable.prototype._destroy = function(err, cb) {
      this.end();
      cb(err);
    };
  }
});

// node_modules/readable-stream/lib/_stream_duplex.js
var require_stream_duplex = __commonJS({
  "node_modules/readable-stream/lib/_stream_duplex.js"(exports2, module2) {
    init_shims();
    "use strict";
    var pna = require_process_nextick_args();
    var objectKeys = Object.keys || function(obj) {
      var keys2 = [];
      for (var key in obj) {
        keys2.push(key);
      }
      return keys2;
    };
    module2.exports = Duplex;
    var util = Object.create(require_util2());
    util.inherits = require_inherits();
    var Readable2 = require_stream_readable();
    var Writable = require_stream_writable();
    util.inherits(Duplex, Readable2);
    {
      keys = objectKeys(Writable.prototype);
      for (v = 0; v < keys.length; v++) {
        method = keys[v];
        if (!Duplex.prototype[method])
          Duplex.prototype[method] = Writable.prototype[method];
      }
    }
    var keys;
    var method;
    var v;
    function Duplex(options2) {
      if (!(this instanceof Duplex))
        return new Duplex(options2);
      Readable2.call(this, options2);
      Writable.call(this, options2);
      if (options2 && options2.readable === false)
        this.readable = false;
      if (options2 && options2.writable === false)
        this.writable = false;
      this.allowHalfOpen = true;
      if (options2 && options2.allowHalfOpen === false)
        this.allowHalfOpen = false;
      this.once("end", onend);
    }
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      enumerable: false,
      get: function() {
        return this._writableState.highWaterMark;
      }
    });
    function onend() {
      if (this.allowHalfOpen || this._writableState.ended)
        return;
      pna.nextTick(onEndNT, this);
    }
    function onEndNT(self2) {
      self2.end();
    }
    Object.defineProperty(Duplex.prototype, "destroyed", {
      get: function() {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
      },
      set: function(value) {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return;
        }
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }
    });
    Duplex.prototype._destroy = function(err, cb) {
      this.push(null);
      this.end();
      pna.nextTick(cb, err);
    };
  }
});

// node_modules/readable-stream/lib/_stream_readable.js
var require_stream_readable = __commonJS({
  "node_modules/readable-stream/lib/_stream_readable.js"(exports2, module2) {
    init_shims();
    "use strict";
    var pna = require_process_nextick_args();
    module2.exports = Readable2;
    var isArray = require_isarray();
    var Duplex;
    Readable2.ReadableState = ReadableState;
    var EE = require("events").EventEmitter;
    var EElistenerCount = function(emitter, type) {
      return emitter.listeners(type).length;
    };
    var Stream2 = require_stream();
    var Buffer2 = require_safe_buffer().Buffer;
    var OurUint8Array = global.Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    var util = Object.create(require_util2());
    util.inherits = require_inherits();
    var debugUtil = require("util");
    var debug = void 0;
    if (debugUtil && debugUtil.debuglog) {
      debug = debugUtil.debuglog("stream");
    } else {
      debug = function() {
      };
    }
    var BufferList = require_BufferList();
    var destroyImpl = require_destroy();
    var StringDecoder;
    util.inherits(Readable2, Stream2);
    var kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
    function prependListener(emitter, event, fn) {
      if (typeof emitter.prependListener === "function")
        return emitter.prependListener(event, fn);
      if (!emitter._events || !emitter._events[event])
        emitter.on(event, fn);
      else if (isArray(emitter._events[event]))
        emitter._events[event].unshift(fn);
      else
        emitter._events[event] = [fn, emitter._events[event]];
    }
    function ReadableState(options2, stream) {
      Duplex = Duplex || require_stream_duplex();
      options2 = options2 || {};
      var isDuplex = stream instanceof Duplex;
      this.objectMode = !!options2.objectMode;
      if (isDuplex)
        this.objectMode = this.objectMode || !!options2.readableObjectMode;
      var hwm = options2.highWaterMark;
      var readableHwm = options2.readableHighWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;
      if (hwm || hwm === 0)
        this.highWaterMark = hwm;
      else if (isDuplex && (readableHwm || readableHwm === 0))
        this.highWaterMark = readableHwm;
      else
        this.highWaterMark = defaultHwm;
      this.highWaterMark = Math.floor(this.highWaterMark);
      this.buffer = new BufferList();
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;
      this.sync = true;
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.resumeScheduled = false;
      this.destroyed = false;
      this.defaultEncoding = options2.defaultEncoding || "utf8";
      this.awaitDrain = 0;
      this.readingMore = false;
      this.decoder = null;
      this.encoding = null;
      if (options2.encoding) {
        if (!StringDecoder)
          StringDecoder = require("string_decoder/").StringDecoder;
        this.decoder = new StringDecoder(options2.encoding);
        this.encoding = options2.encoding;
      }
    }
    function Readable2(options2) {
      Duplex = Duplex || require_stream_duplex();
      if (!(this instanceof Readable2))
        return new Readable2(options2);
      this._readableState = new ReadableState(options2, this);
      this.readable = true;
      if (options2) {
        if (typeof options2.read === "function")
          this._read = options2.read;
        if (typeof options2.destroy === "function")
          this._destroy = options2.destroy;
      }
      Stream2.call(this);
    }
    Object.defineProperty(Readable2.prototype, "destroyed", {
      get: function() {
        if (this._readableState === void 0) {
          return false;
        }
        return this._readableState.destroyed;
      },
      set: function(value) {
        if (!this._readableState) {
          return;
        }
        this._readableState.destroyed = value;
      }
    });
    Readable2.prototype.destroy = destroyImpl.destroy;
    Readable2.prototype._undestroy = destroyImpl.undestroy;
    Readable2.prototype._destroy = function(err, cb) {
      this.push(null);
      cb(err);
    };
    Readable2.prototype.push = function(chunk, encoding) {
      var state = this._readableState;
      var skipChunkCheck;
      if (!state.objectMode) {
        if (typeof chunk === "string") {
          encoding = encoding || state.defaultEncoding;
          if (encoding !== state.encoding) {
            chunk = Buffer2.from(chunk, encoding);
            encoding = "";
          }
          skipChunkCheck = true;
        }
      } else {
        skipChunkCheck = true;
      }
      return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
    };
    Readable2.prototype.unshift = function(chunk) {
      return readableAddChunk(this, chunk, null, true, false);
    };
    function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
      var state = stream._readableState;
      if (chunk === null) {
        state.reading = false;
        onEofChunk(stream, state);
      } else {
        var er;
        if (!skipChunkCheck)
          er = chunkInvalid(state, chunk);
        if (er) {
          stream.emit("error", er);
        } else if (state.objectMode || chunk && chunk.length > 0) {
          if (typeof chunk !== "string" && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer2.prototype) {
            chunk = _uint8ArrayToBuffer(chunk);
          }
          if (addToFront) {
            if (state.endEmitted)
              stream.emit("error", new Error("stream.unshift() after end event"));
            else
              addChunk(stream, state, chunk, true);
          } else if (state.ended) {
            stream.emit("error", new Error("stream.push() after EOF"));
          } else {
            state.reading = false;
            if (state.decoder && !encoding) {
              chunk = state.decoder.write(chunk);
              if (state.objectMode || chunk.length !== 0)
                addChunk(stream, state, chunk, false);
              else
                maybeReadMore(stream, state);
            } else {
              addChunk(stream, state, chunk, false);
            }
          }
        } else if (!addToFront) {
          state.reading = false;
        }
      }
      return needMoreData(state);
    }
    function addChunk(stream, state, chunk, addToFront) {
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit("data", chunk);
        stream.read(0);
      } else {
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront)
          state.buffer.unshift(chunk);
        else
          state.buffer.push(chunk);
        if (state.needReadable)
          emitReadable(stream);
      }
      maybeReadMore(stream, state);
    }
    function chunkInvalid(state, chunk) {
      var er;
      if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) {
        er = new TypeError("Invalid non-string/buffer chunk");
      }
      return er;
    }
    function needMoreData(state) {
      return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
    }
    Readable2.prototype.isPaused = function() {
      return this._readableState.flowing === false;
    };
    Readable2.prototype.setEncoding = function(enc) {
      if (!StringDecoder)
        StringDecoder = require("string_decoder/").StringDecoder;
      this._readableState.decoder = new StringDecoder(enc);
      this._readableState.encoding = enc;
      return this;
    };
    var MAX_HWM = 8388608;
    function computeNewHighWaterMark(n) {
      if (n >= MAX_HWM) {
        n = MAX_HWM;
      } else {
        n--;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        n++;
      }
      return n;
    }
    function howMuchToRead(n, state) {
      if (n <= 0 || state.length === 0 && state.ended)
        return 0;
      if (state.objectMode)
        return 1;
      if (n !== n) {
        if (state.flowing && state.length)
          return state.buffer.head.data.length;
        else
          return state.length;
      }
      if (n > state.highWaterMark)
        state.highWaterMark = computeNewHighWaterMark(n);
      if (n <= state.length)
        return n;
      if (!state.ended) {
        state.needReadable = true;
        return 0;
      }
      return state.length;
    }
    Readable2.prototype.read = function(n) {
      debug("read", n);
      n = parseInt(n, 10);
      var state = this._readableState;
      var nOrig = n;
      if (n !== 0)
        state.emittedReadable = false;
      if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
        debug("read: emitReadable", state.length, state.ended);
        if (state.length === 0 && state.ended)
          endReadable(this);
        else
          emitReadable(this);
        return null;
      }
      n = howMuchToRead(n, state);
      if (n === 0 && state.ended) {
        if (state.length === 0)
          endReadable(this);
        return null;
      }
      var doRead = state.needReadable;
      debug("need readable", doRead);
      if (state.length === 0 || state.length - n < state.highWaterMark) {
        doRead = true;
        debug("length less than watermark", doRead);
      }
      if (state.ended || state.reading) {
        doRead = false;
        debug("reading or ended", doRead);
      } else if (doRead) {
        debug("do read");
        state.reading = true;
        state.sync = true;
        if (state.length === 0)
          state.needReadable = true;
        this._read(state.highWaterMark);
        state.sync = false;
        if (!state.reading)
          n = howMuchToRead(nOrig, state);
      }
      var ret2;
      if (n > 0)
        ret2 = fromList(n, state);
      else
        ret2 = null;
      if (ret2 === null) {
        state.needReadable = true;
        n = 0;
      } else {
        state.length -= n;
      }
      if (state.length === 0) {
        if (!state.ended)
          state.needReadable = true;
        if (nOrig !== n && state.ended)
          endReadable(this);
      }
      if (ret2 !== null)
        this.emit("data", ret2);
      return ret2;
    };
    function onEofChunk(stream, state) {
      if (state.ended)
        return;
      if (state.decoder) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) {
          state.buffer.push(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
        }
      }
      state.ended = true;
      emitReadable(stream);
    }
    function emitReadable(stream) {
      var state = stream._readableState;
      state.needReadable = false;
      if (!state.emittedReadable) {
        debug("emitReadable", state.flowing);
        state.emittedReadable = true;
        if (state.sync)
          pna.nextTick(emitReadable_, stream);
        else
          emitReadable_(stream);
      }
    }
    function emitReadable_(stream) {
      debug("emit readable");
      stream.emit("readable");
      flow(stream);
    }
    function maybeReadMore(stream, state) {
      if (!state.readingMore) {
        state.readingMore = true;
        pna.nextTick(maybeReadMore_, stream, state);
      }
    }
    function maybeReadMore_(stream, state) {
      var len = state.length;
      while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
        debug("maybeReadMore read 0");
        stream.read(0);
        if (len === state.length)
          break;
        else
          len = state.length;
      }
      state.readingMore = false;
    }
    Readable2.prototype._read = function(n) {
      this.emit("error", new Error("_read() is not implemented"));
    };
    Readable2.prototype.pipe = function(dest, pipeOpts) {
      var src2 = this;
      var state = this._readableState;
      switch (state.pipesCount) {
        case 0:
          state.pipes = dest;
          break;
        case 1:
          state.pipes = [state.pipes, dest];
          break;
        default:
          state.pipes.push(dest);
          break;
      }
      state.pipesCount += 1;
      debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
      var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
      var endFn = doEnd ? onend : unpipe;
      if (state.endEmitted)
        pna.nextTick(endFn);
      else
        src2.once("end", endFn);
      dest.on("unpipe", onunpipe);
      function onunpipe(readable, unpipeInfo) {
        debug("onunpipe");
        if (readable === src2) {
          if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
            unpipeInfo.hasUnpiped = true;
            cleanup();
          }
        }
      }
      function onend() {
        debug("onend");
        dest.end();
      }
      var ondrain = pipeOnDrain(src2);
      dest.on("drain", ondrain);
      var cleanedUp = false;
      function cleanup() {
        debug("cleanup");
        dest.removeListener("close", onclose);
        dest.removeListener("finish", onfinish);
        dest.removeListener("drain", ondrain);
        dest.removeListener("error", onerror);
        dest.removeListener("unpipe", onunpipe);
        src2.removeListener("end", onend);
        src2.removeListener("end", unpipe);
        src2.removeListener("data", ondata);
        cleanedUp = true;
        if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain))
          ondrain();
      }
      var increasedAwaitDrain = false;
      src2.on("data", ondata);
      function ondata(chunk) {
        debug("ondata");
        increasedAwaitDrain = false;
        var ret2 = dest.write(chunk);
        if (ret2 === false && !increasedAwaitDrain) {
          if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
            debug("false write response, pause", src2._readableState.awaitDrain);
            src2._readableState.awaitDrain++;
            increasedAwaitDrain = true;
          }
          src2.pause();
        }
      }
      function onerror(er) {
        debug("onerror", er);
        unpipe();
        dest.removeListener("error", onerror);
        if (EElistenerCount(dest, "error") === 0)
          dest.emit("error", er);
      }
      prependListener(dest, "error", onerror);
      function onclose() {
        dest.removeListener("finish", onfinish);
        unpipe();
      }
      dest.once("close", onclose);
      function onfinish() {
        debug("onfinish");
        dest.removeListener("close", onclose);
        unpipe();
      }
      dest.once("finish", onfinish);
      function unpipe() {
        debug("unpipe");
        src2.unpipe(dest);
      }
      dest.emit("pipe", src2);
      if (!state.flowing) {
        debug("pipe resume");
        src2.resume();
      }
      return dest;
    };
    function pipeOnDrain(src2) {
      return function() {
        var state = src2._readableState;
        debug("pipeOnDrain", state.awaitDrain);
        if (state.awaitDrain)
          state.awaitDrain--;
        if (state.awaitDrain === 0 && EElistenerCount(src2, "data")) {
          state.flowing = true;
          flow(src2);
        }
      };
    }
    Readable2.prototype.unpipe = function(dest) {
      var state = this._readableState;
      var unpipeInfo = { hasUnpiped: false };
      if (state.pipesCount === 0)
        return this;
      if (state.pipesCount === 1) {
        if (dest && dest !== state.pipes)
          return this;
        if (!dest)
          dest = state.pipes;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        if (dest)
          dest.emit("unpipe", this, unpipeInfo);
        return this;
      }
      if (!dest) {
        var dests = state.pipes;
        var len = state.pipesCount;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        for (var i = 0; i < len; i++) {
          dests[i].emit("unpipe", this, unpipeInfo);
        }
        return this;
      }
      var index2 = indexOf(state.pipes, dest);
      if (index2 === -1)
        return this;
      state.pipes.splice(index2, 1);
      state.pipesCount -= 1;
      if (state.pipesCount === 1)
        state.pipes = state.pipes[0];
      dest.emit("unpipe", this, unpipeInfo);
      return this;
    };
    Readable2.prototype.on = function(ev, fn) {
      var res2 = Stream2.prototype.on.call(this, ev, fn);
      if (ev === "data") {
        if (this._readableState.flowing !== false)
          this.resume();
      } else if (ev === "readable") {
        var state = this._readableState;
        if (!state.endEmitted && !state.readableListening) {
          state.readableListening = state.needReadable = true;
          state.emittedReadable = false;
          if (!state.reading) {
            pna.nextTick(nReadingNextTick, this);
          } else if (state.length) {
            emitReadable(this);
          }
        }
      }
      return res2;
    };
    Readable2.prototype.addListener = Readable2.prototype.on;
    function nReadingNextTick(self2) {
      debug("readable nexttick read 0");
      self2.read(0);
    }
    Readable2.prototype.resume = function() {
      var state = this._readableState;
      if (!state.flowing) {
        debug("resume");
        state.flowing = true;
        resume(this, state);
      }
      return this;
    };
    function resume(stream, state) {
      if (!state.resumeScheduled) {
        state.resumeScheduled = true;
        pna.nextTick(resume_, stream, state);
      }
    }
    function resume_(stream, state) {
      if (!state.reading) {
        debug("resume read 0");
        stream.read(0);
      }
      state.resumeScheduled = false;
      state.awaitDrain = 0;
      stream.emit("resume");
      flow(stream);
      if (state.flowing && !state.reading)
        stream.read(0);
    }
    Readable2.prototype.pause = function() {
      debug("call pause flowing=%j", this._readableState.flowing);
      if (this._readableState.flowing !== false) {
        debug("pause");
        this._readableState.flowing = false;
        this.emit("pause");
      }
      return this;
    };
    function flow(stream) {
      var state = stream._readableState;
      debug("flow", state.flowing);
      while (state.flowing && stream.read() !== null) {
      }
    }
    Readable2.prototype.wrap = function(stream) {
      var _this = this;
      var state = this._readableState;
      var paused = false;
      stream.on("end", function() {
        debug("wrapped end");
        if (state.decoder && !state.ended) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length)
            _this.push(chunk);
        }
        _this.push(null);
      });
      stream.on("data", function(chunk) {
        debug("wrapped data");
        if (state.decoder)
          chunk = state.decoder.write(chunk);
        if (state.objectMode && (chunk === null || chunk === void 0))
          return;
        else if (!state.objectMode && (!chunk || !chunk.length))
          return;
        var ret2 = _this.push(chunk);
        if (!ret2) {
          paused = true;
          stream.pause();
        }
      });
      for (var i in stream) {
        if (this[i] === void 0 && typeof stream[i] === "function") {
          this[i] = function(method) {
            return function() {
              return stream[method].apply(stream, arguments);
            };
          }(i);
        }
      }
      for (var n = 0; n < kProxyEvents.length; n++) {
        stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
      }
      this._read = function(n2) {
        debug("wrapped _read", n2);
        if (paused) {
          paused = false;
          stream.resume();
        }
      };
      return this;
    };
    Object.defineProperty(Readable2.prototype, "readableHighWaterMark", {
      enumerable: false,
      get: function() {
        return this._readableState.highWaterMark;
      }
    });
    Readable2._fromList = fromList;
    function fromList(n, state) {
      if (state.length === 0)
        return null;
      var ret2;
      if (state.objectMode)
        ret2 = state.buffer.shift();
      else if (!n || n >= state.length) {
        if (state.decoder)
          ret2 = state.buffer.join("");
        else if (state.buffer.length === 1)
          ret2 = state.buffer.head.data;
        else
          ret2 = state.buffer.concat(state.length);
        state.buffer.clear();
      } else {
        ret2 = fromListPartial(n, state.buffer, state.decoder);
      }
      return ret2;
    }
    function fromListPartial(n, list, hasStrings) {
      var ret2;
      if (n < list.head.data.length) {
        ret2 = list.head.data.slice(0, n);
        list.head.data = list.head.data.slice(n);
      } else if (n === list.head.data.length) {
        ret2 = list.shift();
      } else {
        ret2 = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
      }
      return ret2;
    }
    function copyFromBufferString(n, list) {
      var p = list.head;
      var c = 1;
      var ret2 = p.data;
      n -= ret2.length;
      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length)
          ret2 += str;
        else
          ret2 += str.slice(0, n);
        n -= nb;
        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next)
              list.head = p.next;
            else
              list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = str.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret2;
    }
    function copyFromBuffer(n, list) {
      var ret2 = Buffer2.allocUnsafe(n);
      var p = list.head;
      var c = 1;
      p.data.copy(ret2);
      n -= p.data.length;
      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret2, ret2.length - n, 0, nb);
        n -= nb;
        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next)
              list.head = p.next;
            else
              list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = buf.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret2;
    }
    function endReadable(stream) {
      var state = stream._readableState;
      if (state.length > 0)
        throw new Error('"endReadable()" called on non-empty stream');
      if (!state.endEmitted) {
        state.ended = true;
        pna.nextTick(endReadableNT, state, stream);
      }
    }
    function endReadableNT(state, stream) {
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit("end");
      }
    }
    function indexOf(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x)
          return i;
      }
      return -1;
    }
  }
});

// node_modules/readable-stream/lib/_stream_transform.js
var require_stream_transform = __commonJS({
  "node_modules/readable-stream/lib/_stream_transform.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = Transform;
    var Duplex = require_stream_duplex();
    var util = Object.create(require_util2());
    util.inherits = require_inherits();
    util.inherits(Transform, Duplex);
    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = false;
      var cb = ts.writecb;
      if (!cb) {
        return this.emit("error", new Error("write callback called multiple times"));
      }
      ts.writechunk = null;
      ts.writecb = null;
      if (data != null)
        this.push(data);
      cb(er);
      var rs = this._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        this._read(rs.highWaterMark);
      }
    }
    function Transform(options2) {
      if (!(this instanceof Transform))
        return new Transform(options2);
      Duplex.call(this, options2);
      this._transformState = {
        afterTransform: afterTransform.bind(this),
        needTransform: false,
        transforming: false,
        writecb: null,
        writechunk: null,
        writeencoding: null
      };
      this._readableState.needReadable = true;
      this._readableState.sync = false;
      if (options2) {
        if (typeof options2.transform === "function")
          this._transform = options2.transform;
        if (typeof options2.flush === "function")
          this._flush = options2.flush;
      }
      this.on("prefinish", prefinish);
    }
    function prefinish() {
      var _this = this;
      if (typeof this._flush === "function") {
        this._flush(function(er, data) {
          done(_this, er, data);
        });
      } else {
        done(this, null, null);
      }
    }
    Transform.prototype.push = function(chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };
    Transform.prototype._transform = function(chunk, encoding, cb) {
      throw new Error("_transform() is not implemented");
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark)
          this._read(rs.highWaterMark);
      }
    };
    Transform.prototype._read = function(n) {
      var ts = this._transformState;
      if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        ts.needTransform = true;
      }
    };
    Transform.prototype._destroy = function(err, cb) {
      var _this2 = this;
      Duplex.prototype._destroy.call(this, err, function(err2) {
        cb(err2);
        _this2.emit("close");
      });
    };
    function done(stream, er, data) {
      if (er)
        return stream.emit("error", er);
      if (data != null)
        stream.push(data);
      if (stream._writableState.length)
        throw new Error("Calling transform done when ws.length != 0");
      if (stream._transformState.transforming)
        throw new Error("Calling transform done when still transforming");
      return stream.push(null);
    }
  }
});

// node_modules/readable-stream/lib/_stream_passthrough.js
var require_stream_passthrough = __commonJS({
  "node_modules/readable-stream/lib/_stream_passthrough.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = PassThrough2;
    var Transform = require_stream_transform();
    var util = Object.create(require_util2());
    util.inherits = require_inherits();
    util.inherits(PassThrough2, Transform);
    function PassThrough2(options2) {
      if (!(this instanceof PassThrough2))
        return new PassThrough2(options2);
      Transform.call(this, options2);
    }
    PassThrough2.prototype._transform = function(chunk, encoding, cb) {
      cb(null, chunk);
    };
  }
});

// node_modules/readable-stream/readable.js
var require_readable = __commonJS({
  "node_modules/readable-stream/readable.js"(exports2, module2) {
    init_shims();
    var Stream2 = require("stream");
    if (process.env.READABLE_STREAM === "disable" && Stream2) {
      module2.exports = Stream2;
      exports2 = module2.exports = Stream2.Readable;
      exports2.Readable = Stream2.Readable;
      exports2.Writable = Stream2.Writable;
      exports2.Duplex = Stream2.Duplex;
      exports2.Transform = Stream2.Transform;
      exports2.PassThrough = Stream2.PassThrough;
      exports2.Stream = Stream2;
    } else {
      exports2 = module2.exports = require_stream_readable();
      exports2.Stream = Stream2 || exports2;
      exports2.Readable = exports2;
      exports2.Writable = require_stream_writable();
      exports2.Duplex = require_stream_duplex();
      exports2.Transform = require_stream_transform();
      exports2.PassThrough = require_stream_passthrough();
    }
  }
});

// node_modules/jszip/lib/support.js
var require_support = __commonJS({
  "node_modules/jszip/lib/support.js"(exports2) {
    init_shims();
    "use strict";
    exports2.base64 = true;
    exports2.array = true;
    exports2.string = true;
    exports2.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
    exports2.nodebuffer = typeof Buffer !== "undefined";
    exports2.uint8array = typeof Uint8Array !== "undefined";
    if (typeof ArrayBuffer === "undefined") {
      exports2.blob = false;
    } else {
      buffer = new ArrayBuffer(0);
      try {
        exports2.blob = new Blob([buffer], {
          type: "application/zip"
        }).size === 0;
      } catch (e) {
        try {
          Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
          builder = new Builder();
          builder.append(buffer);
          exports2.blob = builder.getBlob("application/zip").size === 0;
        } catch (e2) {
          exports2.blob = false;
        }
      }
    }
    var buffer;
    var Builder;
    var builder;
    try {
      exports2.nodestream = !!require_readable().Readable;
    } catch (e) {
      exports2.nodestream = false;
    }
  }
});

// node_modules/jszip/lib/base64.js
var require_base64 = __commonJS({
  "node_modules/jszip/lib/base64.js"(exports2) {
    init_shims();
    "use strict";
    var utils = require_utils2();
    var support = require_support();
    var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    exports2.encode = function(input) {
      var output = [];
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0, len = input.length, remainingBytes = len;
      var isArray = utils.getTypeOf(input) !== "string";
      while (i < input.length) {
        remainingBytes = len - i;
        if (!isArray) {
          chr1 = input.charCodeAt(i++);
          chr2 = i < len ? input.charCodeAt(i++) : 0;
          chr3 = i < len ? input.charCodeAt(i++) : 0;
        } else {
          chr1 = input[i++];
          chr2 = i < len ? input[i++] : 0;
          chr3 = i < len ? input[i++] : 0;
        }
        enc1 = chr1 >> 2;
        enc2 = (chr1 & 3) << 4 | chr2 >> 4;
        enc3 = remainingBytes > 1 ? (chr2 & 15) << 2 | chr3 >> 6 : 64;
        enc4 = remainingBytes > 2 ? chr3 & 63 : 64;
        output.push(_keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4));
      }
      return output.join("");
    };
    exports2.decode = function(input) {
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0, resultIndex = 0;
      var dataUrlPrefix = "data:";
      if (input.substr(0, dataUrlPrefix.length) === dataUrlPrefix) {
        throw new Error("Invalid base64 input, it looks like a data url.");
      }
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      var totalLength = input.length * 3 / 4;
      if (input.charAt(input.length - 1) === _keyStr.charAt(64)) {
        totalLength--;
      }
      if (input.charAt(input.length - 2) === _keyStr.charAt(64)) {
        totalLength--;
      }
      if (totalLength % 1 !== 0) {
        throw new Error("Invalid base64 input, bad content length.");
      }
      var output;
      if (support.uint8array) {
        output = new Uint8Array(totalLength | 0);
      } else {
        output = new Array(totalLength | 0);
      }
      while (i < input.length) {
        enc1 = _keyStr.indexOf(input.charAt(i++));
        enc2 = _keyStr.indexOf(input.charAt(i++));
        enc3 = _keyStr.indexOf(input.charAt(i++));
        enc4 = _keyStr.indexOf(input.charAt(i++));
        chr1 = enc1 << 2 | enc2 >> 4;
        chr2 = (enc2 & 15) << 4 | enc3 >> 2;
        chr3 = (enc3 & 3) << 6 | enc4;
        output[resultIndex++] = chr1;
        if (enc3 !== 64) {
          output[resultIndex++] = chr2;
        }
        if (enc4 !== 64) {
          output[resultIndex++] = chr3;
        }
      }
      return output;
    };
  }
});

// node_modules/jszip/lib/nodejsUtils.js
var require_nodejsUtils = __commonJS({
  "node_modules/jszip/lib/nodejsUtils.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = {
      isNode: typeof Buffer !== "undefined",
      newBufferFrom: function(data, encoding) {
        if (Buffer.from && Buffer.from !== Uint8Array.from) {
          return Buffer.from(data, encoding);
        } else {
          if (typeof data === "number") {
            throw new Error('The "data" argument must not be a number');
          }
          return new Buffer(data, encoding);
        }
      },
      allocBuffer: function(size) {
        if (Buffer.alloc) {
          return Buffer.alloc(size);
        } else {
          var buf = new Buffer(size);
          buf.fill(0);
          return buf;
        }
      },
      isBuffer: function(b) {
        return Buffer.isBuffer(b);
      },
      isStream: function(obj) {
        return obj && typeof obj.on === "function" && typeof obj.pause === "function" && typeof obj.resume === "function";
      }
    };
  }
});

// node_modules/set-immediate-shim/index.js
var require_set_immediate_shim = __commonJS({
  "node_modules/set-immediate-shim/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = typeof setImmediate === "function" ? setImmediate : function setImmediate2() {
      var args = [].slice.apply(arguments);
      args.splice(1, 0, 0);
      setTimeout.apply(null, args);
    };
  }
});

// node_modules/immediate/lib/index.js
var require_lib = __commonJS({
  "node_modules/immediate/lib/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Mutation = global.MutationObserver || global.WebKitMutationObserver;
    var scheduleDrain;
    if (process.browser) {
      if (Mutation) {
        called = 0;
        observer = new Mutation(nextTick);
        element = global.document.createTextNode("");
        observer.observe(element, {
          characterData: true
        });
        scheduleDrain = function() {
          element.data = called = ++called % 2;
        };
      } else if (!global.setImmediate && typeof global.MessageChannel !== "undefined") {
        channel = new global.MessageChannel();
        channel.port1.onmessage = nextTick;
        scheduleDrain = function() {
          channel.port2.postMessage(0);
        };
      } else if ("document" in global && "onreadystatechange" in global.document.createElement("script")) {
        scheduleDrain = function() {
          var scriptEl = global.document.createElement("script");
          scriptEl.onreadystatechange = function() {
            nextTick();
            scriptEl.onreadystatechange = null;
            scriptEl.parentNode.removeChild(scriptEl);
            scriptEl = null;
          };
          global.document.documentElement.appendChild(scriptEl);
        };
      } else {
        scheduleDrain = function() {
          setTimeout(nextTick, 0);
        };
      }
    } else {
      scheduleDrain = function() {
        process.nextTick(nextTick);
      };
    }
    var called;
    var observer;
    var element;
    var channel;
    var draining;
    var queue = [];
    function nextTick() {
      draining = true;
      var i, oldQueue;
      var len = queue.length;
      while (len) {
        oldQueue = queue;
        queue = [];
        i = -1;
        while (++i < len) {
          oldQueue[i]();
        }
        len = queue.length;
      }
      draining = false;
    }
    module2.exports = immediate;
    function immediate(task) {
      if (queue.push(task) === 1 && !draining) {
        scheduleDrain();
      }
    }
  }
});

// node_modules/lie/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/lie/lib/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    var immediate = require_lib();
    function INTERNAL() {
    }
    var handlers = {};
    var REJECTED = ["REJECTED"];
    var FULFILLED = ["FULFILLED"];
    var PENDING = ["PENDING"];
    if (!process.browser) {
      UNHANDLED = ["UNHANDLED"];
    }
    var UNHANDLED;
    module2.exports = Promise2;
    function Promise2(resolver) {
      if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function");
      }
      this.state = PENDING;
      this.queue = [];
      this.outcome = void 0;
      if (!process.browser) {
        this.handled = UNHANDLED;
      }
      if (resolver !== INTERNAL) {
        safelyResolveThenable(this, resolver);
      }
    }
    Promise2.prototype.finally = function(callback) {
      if (typeof callback !== "function") {
        return this;
      }
      var p = this.constructor;
      return this.then(resolve3, reject2);
      function resolve3(value) {
        function yes() {
          return value;
        }
        return p.resolve(callback()).then(yes);
      }
      function reject2(reason) {
        function no() {
          throw reason;
        }
        return p.resolve(callback()).then(no);
      }
    };
    Promise2.prototype.catch = function(onRejected) {
      return this.then(null, onRejected);
    };
    Promise2.prototype.then = function(onFulfilled, onRejected) {
      if (typeof onFulfilled !== "function" && this.state === FULFILLED || typeof onRejected !== "function" && this.state === REJECTED) {
        return this;
      }
      var promise = new this.constructor(INTERNAL);
      if (!process.browser) {
        if (this.handled === UNHANDLED) {
          this.handled = null;
        }
      }
      if (this.state !== PENDING) {
        var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
        unwrap(promise, resolver, this.outcome);
      } else {
        this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
      }
      return promise;
    };
    function QueueItem(promise, onFulfilled, onRejected) {
      this.promise = promise;
      if (typeof onFulfilled === "function") {
        this.onFulfilled = onFulfilled;
        this.callFulfilled = this.otherCallFulfilled;
      }
      if (typeof onRejected === "function") {
        this.onRejected = onRejected;
        this.callRejected = this.otherCallRejected;
      }
    }
    QueueItem.prototype.callFulfilled = function(value) {
      handlers.resolve(this.promise, value);
    };
    QueueItem.prototype.otherCallFulfilled = function(value) {
      unwrap(this.promise, this.onFulfilled, value);
    };
    QueueItem.prototype.callRejected = function(value) {
      handlers.reject(this.promise, value);
    };
    QueueItem.prototype.otherCallRejected = function(value) {
      unwrap(this.promise, this.onRejected, value);
    };
    function unwrap(promise, func, value) {
      immediate(function() {
        var returnValue;
        try {
          returnValue = func(value);
        } catch (e) {
          return handlers.reject(promise, e);
        }
        if (returnValue === promise) {
          handlers.reject(promise, new TypeError("Cannot resolve promise with itself"));
        } else {
          handlers.resolve(promise, returnValue);
        }
      });
    }
    handlers.resolve = function(self2, value) {
      var result = tryCatch2(getThen, value);
      if (result.status === "error") {
        return handlers.reject(self2, result.value);
      }
      var thenable = result.value;
      if (thenable) {
        safelyResolveThenable(self2, thenable);
      } else {
        self2.state = FULFILLED;
        self2.outcome = value;
        var i = -1;
        var len = self2.queue.length;
        while (++i < len) {
          self2.queue[i].callFulfilled(value);
        }
      }
      return self2;
    };
    handlers.reject = function(self2, error3) {
      self2.state = REJECTED;
      self2.outcome = error3;
      if (!process.browser) {
        if (self2.handled === UNHANDLED) {
          immediate(function() {
            if (self2.handled === UNHANDLED) {
              process.emit("unhandledRejection", error3, self2);
            }
          });
        }
      }
      var i = -1;
      var len = self2.queue.length;
      while (++i < len) {
        self2.queue[i].callRejected(error3);
      }
      return self2;
    };
    function getThen(obj) {
      var then = obj && obj.then;
      if (obj && (typeof obj === "object" || typeof obj === "function") && typeof then === "function") {
        return function appyThen() {
          then.apply(obj, arguments);
        };
      }
    }
    function safelyResolveThenable(self2, thenable) {
      var called = false;
      function onError(value) {
        if (called) {
          return;
        }
        called = true;
        handlers.reject(self2, value);
      }
      function onSuccess(value) {
        if (called) {
          return;
        }
        called = true;
        handlers.resolve(self2, value);
      }
      function tryToUnwrap() {
        thenable(onSuccess, onError);
      }
      var result = tryCatch2(tryToUnwrap);
      if (result.status === "error") {
        onError(result.value);
      }
    }
    function tryCatch2(func, value) {
      var out = {};
      try {
        out.value = func(value);
        out.status = "success";
      } catch (e) {
        out.status = "error";
        out.value = e;
      }
      return out;
    }
    Promise2.resolve = resolve2;
    function resolve2(value) {
      if (value instanceof this) {
        return value;
      }
      return handlers.resolve(new this(INTERNAL), value);
    }
    Promise2.reject = reject;
    function reject(reason) {
      var promise = new this(INTERNAL);
      return handlers.reject(promise, reason);
    }
    Promise2.all = all;
    function all(iterable) {
      var self2 = this;
      if (Object.prototype.toString.call(iterable) !== "[object Array]") {
        return this.reject(new TypeError("must be an array"));
      }
      var len = iterable.length;
      var called = false;
      if (!len) {
        return this.resolve([]);
      }
      var values = new Array(len);
      var resolved = 0;
      var i = -1;
      var promise = new this(INTERNAL);
      while (++i < len) {
        allResolver(iterable[i], i);
      }
      return promise;
      function allResolver(value, i2) {
        self2.resolve(value).then(resolveFromAll, function(error3) {
          if (!called) {
            called = true;
            handlers.reject(promise, error3);
          }
        });
        function resolveFromAll(outValue) {
          values[i2] = outValue;
          if (++resolved === len && !called) {
            called = true;
            handlers.resolve(promise, values);
          }
        }
      }
    }
    Promise2.race = race;
    function race(iterable) {
      var self2 = this;
      if (Object.prototype.toString.call(iterable) !== "[object Array]") {
        return this.reject(new TypeError("must be an array"));
      }
      var len = iterable.length;
      var called = false;
      if (!len) {
        return this.resolve([]);
      }
      var i = -1;
      var promise = new this(INTERNAL);
      while (++i < len) {
        resolver(iterable[i]);
      }
      return promise;
      function resolver(value) {
        self2.resolve(value).then(function(response) {
          if (!called) {
            called = true;
            handlers.resolve(promise, response);
          }
        }, function(error3) {
          if (!called) {
            called = true;
            handlers.reject(promise, error3);
          }
        });
      }
    }
  }
});

// node_modules/jszip/lib/external.js
var require_external = __commonJS({
  "node_modules/jszip/lib/external.js"(exports2, module2) {
    init_shims();
    "use strict";
    var ES6Promise = null;
    if (typeof Promise !== "undefined") {
      ES6Promise = Promise;
    } else {
      ES6Promise = require_lib2();
    }
    module2.exports = {
      Promise: ES6Promise
    };
  }
});

// node_modules/jszip/lib/utils.js
var require_utils2 = __commonJS({
  "node_modules/jszip/lib/utils.js"(exports2) {
    init_shims();
    "use strict";
    var support = require_support();
    var base64 = require_base64();
    var nodejsUtils = require_nodejsUtils();
    var setImmediate2 = require_set_immediate_shim();
    var external = require_external();
    function string2binary(str) {
      var result = null;
      if (support.uint8array) {
        result = new Uint8Array(str.length);
      } else {
        result = new Array(str.length);
      }
      return stringToArrayLike(str, result);
    }
    exports2.newBlob = function(part, type) {
      exports2.checkSupport("blob");
      try {
        return new Blob([part], {
          type
        });
      } catch (e) {
        try {
          var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
          var builder = new Builder();
          builder.append(part);
          return builder.getBlob(type);
        } catch (e2) {
          throw new Error("Bug : can't construct the Blob.");
        }
      }
    };
    function identity2(input) {
      return input;
    }
    function stringToArrayLike(str, array) {
      for (var i = 0; i < str.length; ++i) {
        array[i] = str.charCodeAt(i) & 255;
      }
      return array;
    }
    var arrayToStringHelper = {
      stringifyByChunk: function(array, type, chunk) {
        var result = [], k = 0, len = array.length;
        if (len <= chunk) {
          return String.fromCharCode.apply(null, array);
        }
        while (k < len) {
          if (type === "array" || type === "nodebuffer") {
            result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
          } else {
            result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
          }
          k += chunk;
        }
        return result.join("");
      },
      stringifyByChar: function(array) {
        var resultStr = "";
        for (var i = 0; i < array.length; i++) {
          resultStr += String.fromCharCode(array[i]);
        }
        return resultStr;
      },
      applyCanBeUsed: {
        uint8array: function() {
          try {
            return support.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
          } catch (e) {
            return false;
          }
        }(),
        nodebuffer: function() {
          try {
            return support.nodebuffer && String.fromCharCode.apply(null, nodejsUtils.allocBuffer(1)).length === 1;
          } catch (e) {
            return false;
          }
        }()
      }
    };
    function arrayLikeToString(array) {
      var chunk = 65536, type = exports2.getTypeOf(array), canUseApply = true;
      if (type === "uint8array") {
        canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
      } else if (type === "nodebuffer") {
        canUseApply = arrayToStringHelper.applyCanBeUsed.nodebuffer;
      }
      if (canUseApply) {
        while (chunk > 1) {
          try {
            return arrayToStringHelper.stringifyByChunk(array, type, chunk);
          } catch (e) {
            chunk = Math.floor(chunk / 2);
          }
        }
      }
      return arrayToStringHelper.stringifyByChar(array);
    }
    exports2.applyFromCharCode = arrayLikeToString;
    function arrayLikeToArrayLike(arrayFrom, arrayTo) {
      for (var i = 0; i < arrayFrom.length; i++) {
        arrayTo[i] = arrayFrom[i];
      }
      return arrayTo;
    }
    var transform = {};
    transform["string"] = {
      "string": identity2,
      "array": function(input) {
        return stringToArrayLike(input, new Array(input.length));
      },
      "arraybuffer": function(input) {
        return transform["string"]["uint8array"](input).buffer;
      },
      "uint8array": function(input) {
        return stringToArrayLike(input, new Uint8Array(input.length));
      },
      "nodebuffer": function(input) {
        return stringToArrayLike(input, nodejsUtils.allocBuffer(input.length));
      }
    };
    transform["array"] = {
      "string": arrayLikeToString,
      "array": identity2,
      "arraybuffer": function(input) {
        return new Uint8Array(input).buffer;
      },
      "uint8array": function(input) {
        return new Uint8Array(input);
      },
      "nodebuffer": function(input) {
        return nodejsUtils.newBufferFrom(input);
      }
    };
    transform["arraybuffer"] = {
      "string": function(input) {
        return arrayLikeToString(new Uint8Array(input));
      },
      "array": function(input) {
        return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
      },
      "arraybuffer": identity2,
      "uint8array": function(input) {
        return new Uint8Array(input);
      },
      "nodebuffer": function(input) {
        return nodejsUtils.newBufferFrom(new Uint8Array(input));
      }
    };
    transform["uint8array"] = {
      "string": arrayLikeToString,
      "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
      },
      "arraybuffer": function(input) {
        return input.buffer;
      },
      "uint8array": identity2,
      "nodebuffer": function(input) {
        return nodejsUtils.newBufferFrom(input);
      }
    };
    transform["nodebuffer"] = {
      "string": arrayLikeToString,
      "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
      },
      "arraybuffer": function(input) {
        return transform["nodebuffer"]["uint8array"](input).buffer;
      },
      "uint8array": function(input) {
        return arrayLikeToArrayLike(input, new Uint8Array(input.length));
      },
      "nodebuffer": identity2
    };
    exports2.transformTo = function(outputType, input) {
      if (!input) {
        input = "";
      }
      if (!outputType) {
        return input;
      }
      exports2.checkSupport(outputType);
      var inputType = exports2.getTypeOf(input);
      var result = transform[inputType][outputType](input);
      return result;
    };
    exports2.getTypeOf = function(input) {
      if (typeof input === "string") {
        return "string";
      }
      if (Object.prototype.toString.call(input) === "[object Array]") {
        return "array";
      }
      if (support.nodebuffer && nodejsUtils.isBuffer(input)) {
        return "nodebuffer";
      }
      if (support.uint8array && input instanceof Uint8Array) {
        return "uint8array";
      }
      if (support.arraybuffer && input instanceof ArrayBuffer) {
        return "arraybuffer";
      }
    };
    exports2.checkSupport = function(type) {
      var supported = support[type.toLowerCase()];
      if (!supported) {
        throw new Error(type + " is not supported by this platform");
      }
    };
    exports2.MAX_VALUE_16BITS = 65535;
    exports2.MAX_VALUE_32BITS = -1;
    exports2.pretty = function(str) {
      var res2 = "", code, i;
      for (i = 0; i < (str || "").length; i++) {
        code = str.charCodeAt(i);
        res2 += "\\x" + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
      }
      return res2;
    };
    exports2.delay = function(callback, args, self2) {
      setImmediate2(function() {
        callback.apply(self2 || null, args || []);
      });
    };
    exports2.inherits = function(ctor, superCtor) {
      var Obj = function() {
      };
      Obj.prototype = superCtor.prototype;
      ctor.prototype = new Obj();
    };
    exports2.extend = function() {
      var result = {}, i, attr;
      for (i = 0; i < arguments.length; i++) {
        for (attr in arguments[i]) {
          if (arguments[i].hasOwnProperty(attr) && typeof result[attr] === "undefined") {
            result[attr] = arguments[i][attr];
          }
        }
      }
      return result;
    };
    exports2.prepareContent = function(name, inputData, isBinary, isOptimizedBinaryString, isBase64) {
      var promise = external.Promise.resolve(inputData).then(function(data) {
        var isBlob2 = support.blob && (data instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(data)) !== -1);
        if (isBlob2 && typeof FileReader !== "undefined") {
          return new external.Promise(function(resolve2, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
              resolve2(e.target.result);
            };
            reader.onerror = function(e) {
              reject(e.target.error);
            };
            reader.readAsArrayBuffer(data);
          });
        } else {
          return data;
        }
      });
      return promise.then(function(data) {
        var dataType = exports2.getTypeOf(data);
        if (!dataType) {
          return external.Promise.reject(new Error("Can't read the data of '" + name + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
        }
        if (dataType === "arraybuffer") {
          data = exports2.transformTo("uint8array", data);
        } else if (dataType === "string") {
          if (isBase64) {
            data = base64.decode(data);
          } else if (isBinary) {
            if (isOptimizedBinaryString !== true) {
              data = string2binary(data);
            }
          }
        }
        return data;
      });
    };
  }
});

// node_modules/jszip/lib/stream/GenericWorker.js
var require_GenericWorker = __commonJS({
  "node_modules/jszip/lib/stream/GenericWorker.js"(exports2, module2) {
    init_shims();
    "use strict";
    function GenericWorker(name) {
      this.name = name || "default";
      this.streamInfo = {};
      this.generatedError = null;
      this.extraStreamInfo = {};
      this.isPaused = true;
      this.isFinished = false;
      this.isLocked = false;
      this._listeners = {
        "data": [],
        "end": [],
        "error": []
      };
      this.previous = null;
    }
    GenericWorker.prototype = {
      push: function(chunk) {
        this.emit("data", chunk);
      },
      end: function() {
        if (this.isFinished) {
          return false;
        }
        this.flush();
        try {
          this.emit("end");
          this.cleanUp();
          this.isFinished = true;
        } catch (e) {
          this.emit("error", e);
        }
        return true;
      },
      error: function(e) {
        if (this.isFinished) {
          return false;
        }
        if (this.isPaused) {
          this.generatedError = e;
        } else {
          this.isFinished = true;
          this.emit("error", e);
          if (this.previous) {
            this.previous.error(e);
          }
          this.cleanUp();
        }
        return true;
      },
      on: function(name, listener) {
        this._listeners[name].push(listener);
        return this;
      },
      cleanUp: function() {
        this.streamInfo = this.generatedError = this.extraStreamInfo = null;
        this._listeners = [];
      },
      emit: function(name, arg) {
        if (this._listeners[name]) {
          for (var i = 0; i < this._listeners[name].length; i++) {
            this._listeners[name][i].call(this, arg);
          }
        }
      },
      pipe: function(next) {
        return next.registerPrevious(this);
      },
      registerPrevious: function(previous) {
        if (this.isLocked) {
          throw new Error("The stream '" + this + "' has already been used.");
        }
        this.streamInfo = previous.streamInfo;
        this.mergeStreamInfo();
        this.previous = previous;
        var self2 = this;
        previous.on("data", function(chunk) {
          self2.processChunk(chunk);
        });
        previous.on("end", function() {
          self2.end();
        });
        previous.on("error", function(e) {
          self2.error(e);
        });
        return this;
      },
      pause: function() {
        if (this.isPaused || this.isFinished) {
          return false;
        }
        this.isPaused = true;
        if (this.previous) {
          this.previous.pause();
        }
        return true;
      },
      resume: function() {
        if (!this.isPaused || this.isFinished) {
          return false;
        }
        this.isPaused = false;
        var withError = false;
        if (this.generatedError) {
          this.error(this.generatedError);
          withError = true;
        }
        if (this.previous) {
          this.previous.resume();
        }
        return !withError;
      },
      flush: function() {
      },
      processChunk: function(chunk) {
        this.push(chunk);
      },
      withStreamInfo: function(key, value) {
        this.extraStreamInfo[key] = value;
        this.mergeStreamInfo();
        return this;
      },
      mergeStreamInfo: function() {
        for (var key in this.extraStreamInfo) {
          if (!this.extraStreamInfo.hasOwnProperty(key)) {
            continue;
          }
          this.streamInfo[key] = this.extraStreamInfo[key];
        }
      },
      lock: function() {
        if (this.isLocked) {
          throw new Error("The stream '" + this + "' has already been used.");
        }
        this.isLocked = true;
        if (this.previous) {
          this.previous.lock();
        }
      },
      toString: function() {
        var me = "Worker " + this.name;
        if (this.previous) {
          return this.previous + " -> " + me;
        } else {
          return me;
        }
      }
    };
    module2.exports = GenericWorker;
  }
});

// node_modules/jszip/lib/utf8.js
var require_utf8 = __commonJS({
  "node_modules/jszip/lib/utf8.js"(exports2) {
    init_shims();
    "use strict";
    var utils = require_utils2();
    var support = require_support();
    var nodejsUtils = require_nodejsUtils();
    var GenericWorker = require_GenericWorker();
    var _utf8len = new Array(256);
    for (var i = 0; i < 256; i++) {
      _utf8len[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
    }
    _utf8len[254] = _utf8len[254] = 1;
    var string2buf = function(str) {
      var buf, c, c2, m_pos, i2, str_len = str.length, buf_len = 0;
      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
      }
      if (support.uint8array) {
        buf = new Uint8Array(buf_len);
      } else {
        buf = new Array(buf_len);
      }
      for (i2 = 0, m_pos = 0; i2 < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        if (c < 128) {
          buf[i2++] = c;
        } else if (c < 2048) {
          buf[i2++] = 192 | c >>> 6;
          buf[i2++] = 128 | c & 63;
        } else if (c < 65536) {
          buf[i2++] = 224 | c >>> 12;
          buf[i2++] = 128 | c >>> 6 & 63;
          buf[i2++] = 128 | c & 63;
        } else {
          buf[i2++] = 240 | c >>> 18;
          buf[i2++] = 128 | c >>> 12 & 63;
          buf[i2++] = 128 | c >>> 6 & 63;
          buf[i2++] = 128 | c & 63;
        }
      }
      return buf;
    };
    var utf8border = function(buf, max) {
      var pos;
      max = max || buf.length;
      if (max > buf.length) {
        max = buf.length;
      }
      pos = max - 1;
      while (pos >= 0 && (buf[pos] & 192) === 128) {
        pos--;
      }
      if (pos < 0) {
        return max;
      }
      if (pos === 0) {
        return max;
      }
      return pos + _utf8len[buf[pos]] > max ? pos : max;
    };
    var buf2string = function(buf) {
      var str, i2, out, c, c_len;
      var len = buf.length;
      var utf16buf = new Array(len * 2);
      for (out = 0, i2 = 0; i2 < len; ) {
        c = buf[i2++];
        if (c < 128) {
          utf16buf[out++] = c;
          continue;
        }
        c_len = _utf8len[c];
        if (c_len > 4) {
          utf16buf[out++] = 65533;
          i2 += c_len - 1;
          continue;
        }
        c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
        while (c_len > 1 && i2 < len) {
          c = c << 6 | buf[i2++] & 63;
          c_len--;
        }
        if (c_len > 1) {
          utf16buf[out++] = 65533;
          continue;
        }
        if (c < 65536) {
          utf16buf[out++] = c;
        } else {
          c -= 65536;
          utf16buf[out++] = 55296 | c >> 10 & 1023;
          utf16buf[out++] = 56320 | c & 1023;
        }
      }
      if (utf16buf.length !== out) {
        if (utf16buf.subarray) {
          utf16buf = utf16buf.subarray(0, out);
        } else {
          utf16buf.length = out;
        }
      }
      return utils.applyFromCharCode(utf16buf);
    };
    exports2.utf8encode = function utf8encode(str) {
      if (support.nodebuffer) {
        return nodejsUtils.newBufferFrom(str, "utf-8");
      }
      return string2buf(str);
    };
    exports2.utf8decode = function utf8decode(buf) {
      if (support.nodebuffer) {
        return utils.transformTo("nodebuffer", buf).toString("utf-8");
      }
      buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);
      return buf2string(buf);
    };
    function Utf8DecodeWorker() {
      GenericWorker.call(this, "utf-8 decode");
      this.leftOver = null;
    }
    utils.inherits(Utf8DecodeWorker, GenericWorker);
    Utf8DecodeWorker.prototype.processChunk = function(chunk) {
      var data = utils.transformTo(support.uint8array ? "uint8array" : "array", chunk.data);
      if (this.leftOver && this.leftOver.length) {
        if (support.uint8array) {
          var previousData = data;
          data = new Uint8Array(previousData.length + this.leftOver.length);
          data.set(this.leftOver, 0);
          data.set(previousData, this.leftOver.length);
        } else {
          data = this.leftOver.concat(data);
        }
        this.leftOver = null;
      }
      var nextBoundary = utf8border(data);
      var usableData = data;
      if (nextBoundary !== data.length) {
        if (support.uint8array) {
          usableData = data.subarray(0, nextBoundary);
          this.leftOver = data.subarray(nextBoundary, data.length);
        } else {
          usableData = data.slice(0, nextBoundary);
          this.leftOver = data.slice(nextBoundary, data.length);
        }
      }
      this.push({
        data: exports2.utf8decode(usableData),
        meta: chunk.meta
      });
    };
    Utf8DecodeWorker.prototype.flush = function() {
      if (this.leftOver && this.leftOver.length) {
        this.push({
          data: exports2.utf8decode(this.leftOver),
          meta: {}
        });
        this.leftOver = null;
      }
    };
    exports2.Utf8DecodeWorker = Utf8DecodeWorker;
    function Utf8EncodeWorker() {
      GenericWorker.call(this, "utf-8 encode");
    }
    utils.inherits(Utf8EncodeWorker, GenericWorker);
    Utf8EncodeWorker.prototype.processChunk = function(chunk) {
      this.push({
        data: exports2.utf8encode(chunk.data),
        meta: chunk.meta
      });
    };
    exports2.Utf8EncodeWorker = Utf8EncodeWorker;
  }
});

// node_modules/jszip/lib/stream/ConvertWorker.js
var require_ConvertWorker = __commonJS({
  "node_modules/jszip/lib/stream/ConvertWorker.js"(exports2, module2) {
    init_shims();
    "use strict";
    var GenericWorker = require_GenericWorker();
    var utils = require_utils2();
    function ConvertWorker(destType) {
      GenericWorker.call(this, "ConvertWorker to " + destType);
      this.destType = destType;
    }
    utils.inherits(ConvertWorker, GenericWorker);
    ConvertWorker.prototype.processChunk = function(chunk) {
      this.push({
        data: utils.transformTo(this.destType, chunk.data),
        meta: chunk.meta
      });
    };
    module2.exports = ConvertWorker;
  }
});

// node_modules/jszip/lib/nodejs/NodejsStreamOutputAdapter.js
var require_NodejsStreamOutputAdapter = __commonJS({
  "node_modules/jszip/lib/nodejs/NodejsStreamOutputAdapter.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Readable2 = require_readable().Readable;
    var utils = require_utils2();
    utils.inherits(NodejsStreamOutputAdapter, Readable2);
    function NodejsStreamOutputAdapter(helper, options2, updateCb) {
      Readable2.call(this, options2);
      this._helper = helper;
      var self2 = this;
      helper.on("data", function(data, meta) {
        if (!self2.push(data)) {
          self2._helper.pause();
        }
        if (updateCb) {
          updateCb(meta);
        }
      }).on("error", function(e) {
        self2.emit("error", e);
      }).on("end", function() {
        self2.push(null);
      });
    }
    NodejsStreamOutputAdapter.prototype._read = function() {
      this._helper.resume();
    };
    module2.exports = NodejsStreamOutputAdapter;
  }
});

// node_modules/jszip/lib/stream/StreamHelper.js
var require_StreamHelper = __commonJS({
  "node_modules/jszip/lib/stream/StreamHelper.js"(exports2, module2) {
    init_shims();
    "use strict";
    var utils = require_utils2();
    var ConvertWorker = require_ConvertWorker();
    var GenericWorker = require_GenericWorker();
    var base64 = require_base64();
    var support = require_support();
    var external = require_external();
    var NodejsStreamOutputAdapter = null;
    if (support.nodestream) {
      try {
        NodejsStreamOutputAdapter = require_NodejsStreamOutputAdapter();
      } catch (e) {
      }
    }
    function transformZipOutput(type, content, mimeType) {
      switch (type) {
        case "blob":
          return utils.newBlob(utils.transformTo("arraybuffer", content), mimeType);
        case "base64":
          return base64.encode(content);
        default:
          return utils.transformTo(type, content);
      }
    }
    function concat(type, dataArray) {
      var i, index2 = 0, res2 = null, totalLength = 0;
      for (i = 0; i < dataArray.length; i++) {
        totalLength += dataArray[i].length;
      }
      switch (type) {
        case "string":
          return dataArray.join("");
        case "array":
          return Array.prototype.concat.apply([], dataArray);
        case "uint8array":
          res2 = new Uint8Array(totalLength);
          for (i = 0; i < dataArray.length; i++) {
            res2.set(dataArray[i], index2);
            index2 += dataArray[i].length;
          }
          return res2;
        case "nodebuffer":
          return Buffer.concat(dataArray);
        default:
          throw new Error("concat : unsupported type '" + type + "'");
      }
    }
    function accumulate(helper, updateCallback) {
      return new external.Promise(function(resolve2, reject) {
        var dataArray = [];
        var chunkType = helper._internalType, resultType = helper._outputType, mimeType = helper._mimeType;
        helper.on("data", function(data, meta) {
          dataArray.push(data);
          if (updateCallback) {
            updateCallback(meta);
          }
        }).on("error", function(err) {
          dataArray = [];
          reject(err);
        }).on("end", function() {
          try {
            var result = transformZipOutput(resultType, concat(chunkType, dataArray), mimeType);
            resolve2(result);
          } catch (e) {
            reject(e);
          }
          dataArray = [];
        }).resume();
      });
    }
    function StreamHelper(worker, outputType, mimeType) {
      var internalType = outputType;
      switch (outputType) {
        case "blob":
        case "arraybuffer":
          internalType = "uint8array";
          break;
        case "base64":
          internalType = "string";
          break;
      }
      try {
        this._internalType = internalType;
        this._outputType = outputType;
        this._mimeType = mimeType;
        utils.checkSupport(internalType);
        this._worker = worker.pipe(new ConvertWorker(internalType));
        worker.lock();
      } catch (e) {
        this._worker = new GenericWorker("error");
        this._worker.error(e);
      }
    }
    StreamHelper.prototype = {
      accumulate: function(updateCb) {
        return accumulate(this, updateCb);
      },
      on: function(evt, fn) {
        var self2 = this;
        if (evt === "data") {
          this._worker.on(evt, function(chunk) {
            fn.call(self2, chunk.data, chunk.meta);
          });
        } else {
          this._worker.on(evt, function() {
            utils.delay(fn, arguments, self2);
          });
        }
        return this;
      },
      resume: function() {
        utils.delay(this._worker.resume, [], this._worker);
        return this;
      },
      pause: function() {
        this._worker.pause();
        return this;
      },
      toNodejsStream: function(updateCb) {
        utils.checkSupport("nodestream");
        if (this._outputType !== "nodebuffer") {
          throw new Error(this._outputType + " is not supported by this method");
        }
        return new NodejsStreamOutputAdapter(this, {
          objectMode: this._outputType !== "nodebuffer"
        }, updateCb);
      }
    };
    module2.exports = StreamHelper;
  }
});

// node_modules/jszip/lib/defaults.js
var require_defaults3 = __commonJS({
  "node_modules/jszip/lib/defaults.js"(exports2) {
    init_shims();
    "use strict";
    exports2.base64 = false;
    exports2.binary = false;
    exports2.dir = false;
    exports2.createFolders = true;
    exports2.date = null;
    exports2.compression = null;
    exports2.compressionOptions = null;
    exports2.comment = null;
    exports2.unixPermissions = null;
    exports2.dosPermissions = null;
  }
});

// node_modules/jszip/lib/stream/DataWorker.js
var require_DataWorker = __commonJS({
  "node_modules/jszip/lib/stream/DataWorker.js"(exports2, module2) {
    init_shims();
    "use strict";
    var utils = require_utils2();
    var GenericWorker = require_GenericWorker();
    var DEFAULT_BLOCK_SIZE = 16 * 1024;
    function DataWorker(dataP) {
      GenericWorker.call(this, "DataWorker");
      var self2 = this;
      this.dataIsReady = false;
      this.index = 0;
      this.max = 0;
      this.data = null;
      this.type = "";
      this._tickScheduled = false;
      dataP.then(function(data) {
        self2.dataIsReady = true;
        self2.data = data;
        self2.max = data && data.length || 0;
        self2.type = utils.getTypeOf(data);
        if (!self2.isPaused) {
          self2._tickAndRepeat();
        }
      }, function(e) {
        self2.error(e);
      });
    }
    utils.inherits(DataWorker, GenericWorker);
    DataWorker.prototype.cleanUp = function() {
      GenericWorker.prototype.cleanUp.call(this);
      this.data = null;
    };
    DataWorker.prototype.resume = function() {
      if (!GenericWorker.prototype.resume.call(this)) {
        return false;
      }
      if (!this._tickScheduled && this.dataIsReady) {
        this._tickScheduled = true;
        utils.delay(this._tickAndRepeat, [], this);
      }
      return true;
    };
    DataWorker.prototype._tickAndRepeat = function() {
      this._tickScheduled = false;
      if (this.isPaused || this.isFinished) {
        return;
      }
      this._tick();
      if (!this.isFinished) {
        utils.delay(this._tickAndRepeat, [], this);
        this._tickScheduled = true;
      }
    };
    DataWorker.prototype._tick = function() {
      if (this.isPaused || this.isFinished) {
        return false;
      }
      var size = DEFAULT_BLOCK_SIZE;
      var data = null, nextIndex = Math.min(this.max, this.index + size);
      if (this.index >= this.max) {
        return this.end();
      } else {
        switch (this.type) {
          case "string":
            data = this.data.substring(this.index, nextIndex);
            break;
          case "uint8array":
            data = this.data.subarray(this.index, nextIndex);
            break;
          case "array":
          case "nodebuffer":
            data = this.data.slice(this.index, nextIndex);
            break;
        }
        this.index = nextIndex;
        return this.push({
          data,
          meta: {
            percent: this.max ? this.index / this.max * 100 : 0
          }
        });
      }
    };
    module2.exports = DataWorker;
  }
});

// node_modules/jszip/lib/crc32.js
var require_crc32 = __commonJS({
  "node_modules/jszip/lib/crc32.js"(exports2, module2) {
    init_shims();
    "use strict";
    var utils = require_utils2();
    function makeTable() {
      var c, table = [];
      for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
          c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
        }
        table[n] = c;
      }
      return table;
    }
    var crcTable = makeTable();
    function crc32(crc, buf, len, pos) {
      var t = crcTable, end = pos + len;
      crc = crc ^ -1;
      for (var i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
      }
      return crc ^ -1;
    }
    function crc32str(crc, str, len, pos) {
      var t = crcTable, end = pos + len;
      crc = crc ^ -1;
      for (var i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ str.charCodeAt(i)) & 255];
      }
      return crc ^ -1;
    }
    module2.exports = function crc32wrapper(input, crc) {
      if (typeof input === "undefined" || !input.length) {
        return 0;
      }
      var isArray = utils.getTypeOf(input) !== "string";
      if (isArray) {
        return crc32(crc | 0, input, input.length, 0);
      } else {
        return crc32str(crc | 0, input, input.length, 0);
      }
    };
  }
});

// node_modules/jszip/lib/stream/Crc32Probe.js
var require_Crc32Probe = __commonJS({
  "node_modules/jszip/lib/stream/Crc32Probe.js"(exports2, module2) {
    init_shims();
    "use strict";
    var GenericWorker = require_GenericWorker();
    var crc32 = require_crc32();
    var utils = require_utils2();
    function Crc32Probe() {
      GenericWorker.call(this, "Crc32Probe");
      this.withStreamInfo("crc32", 0);
    }
    utils.inherits(Crc32Probe, GenericWorker);
    Crc32Probe.prototype.processChunk = function(chunk) {
      this.streamInfo.crc32 = crc32(chunk.data, this.streamInfo.crc32 || 0);
      this.push(chunk);
    };
    module2.exports = Crc32Probe;
  }
});

// node_modules/jszip/lib/stream/DataLengthProbe.js
var require_DataLengthProbe = __commonJS({
  "node_modules/jszip/lib/stream/DataLengthProbe.js"(exports2, module2) {
    init_shims();
    "use strict";
    var utils = require_utils2();
    var GenericWorker = require_GenericWorker();
    function DataLengthProbe(propName) {
      GenericWorker.call(this, "DataLengthProbe for " + propName);
      this.propName = propName;
      this.withStreamInfo(propName, 0);
    }
    utils.inherits(DataLengthProbe, GenericWorker);
    DataLengthProbe.prototype.processChunk = function(chunk) {
      if (chunk) {
        var length = this.streamInfo[this.propName] || 0;
        this.streamInfo[this.propName] = length + chunk.data.length;
      }
      GenericWorker.prototype.processChunk.call(this, chunk);
    };
    module2.exports = DataLengthProbe;
  }
});

// node_modules/jszip/lib/compressedObject.js
var require_compressedObject = __commonJS({
  "node_modules/jszip/lib/compressedObject.js"(exports2, module2) {
    init_shims();
    "use strict";
    var external = require_external();
    var DataWorker = require_DataWorker();
    var Crc32Probe = require_Crc32Probe();
    var DataLengthProbe = require_DataLengthProbe();
    function CompressedObject(compressedSize, uncompressedSize, crc32, compression, data) {
      this.compressedSize = compressedSize;
      this.uncompressedSize = uncompressedSize;
      this.crc32 = crc32;
      this.compression = compression;
      this.compressedContent = data;
    }
    CompressedObject.prototype = {
      getContentWorker: function() {
        var worker = new DataWorker(external.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new DataLengthProbe("data_length"));
        var that = this;
        worker.on("end", function() {
          if (this.streamInfo["data_length"] !== that.uncompressedSize) {
            throw new Error("Bug : uncompressed data size mismatch");
          }
        });
        return worker;
      },
      getCompressedWorker: function() {
        return new DataWorker(external.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
      }
    };
    CompressedObject.createWorkerFrom = function(uncompressedWorker, compression, compressionOptions) {
      return uncompressedWorker.pipe(new Crc32Probe()).pipe(new DataLengthProbe("uncompressedSize")).pipe(compression.compressWorker(compressionOptions)).pipe(new DataLengthProbe("compressedSize")).withStreamInfo("compression", compression);
    };
    module2.exports = CompressedObject;
  }
});

// node_modules/jszip/lib/zipObject.js
var require_zipObject = __commonJS({
  "node_modules/jszip/lib/zipObject.js"(exports2, module2) {
    init_shims();
    "use strict";
    var StreamHelper = require_StreamHelper();
    var DataWorker = require_DataWorker();
    var utf8 = require_utf8();
    var CompressedObject = require_compressedObject();
    var GenericWorker = require_GenericWorker();
    var ZipObject = function(name, data, options2) {
      this.name = name;
      this.dir = options2.dir;
      this.date = options2.date;
      this.comment = options2.comment;
      this.unixPermissions = options2.unixPermissions;
      this.dosPermissions = options2.dosPermissions;
      this._data = data;
      this._dataBinary = options2.binary;
      this.options = {
        compression: options2.compression,
        compressionOptions: options2.compressionOptions
      };
    };
    ZipObject.prototype = {
      internalStream: function(type) {
        var result = null, outputType = "string";
        try {
          if (!type) {
            throw new Error("No output type specified.");
          }
          outputType = type.toLowerCase();
          var askUnicodeString = outputType === "string" || outputType === "text";
          if (outputType === "binarystring" || outputType === "text") {
            outputType = "string";
          }
          result = this._decompressWorker();
          var isUnicodeString = !this._dataBinary;
          if (isUnicodeString && !askUnicodeString) {
            result = result.pipe(new utf8.Utf8EncodeWorker());
          }
          if (!isUnicodeString && askUnicodeString) {
            result = result.pipe(new utf8.Utf8DecodeWorker());
          }
        } catch (e) {
          result = new GenericWorker("error");
          result.error(e);
        }
        return new StreamHelper(result, outputType, "");
      },
      async: function(type, onUpdate) {
        return this.internalStream(type).accumulate(onUpdate);
      },
      nodeStream: function(type, onUpdate) {
        return this.internalStream(type || "nodebuffer").toNodejsStream(onUpdate);
      },
      _compressWorker: function(compression, compressionOptions) {
        if (this._data instanceof CompressedObject && this._data.compression.magic === compression.magic) {
          return this._data.getCompressedWorker();
        } else {
          var result = this._decompressWorker();
          if (!this._dataBinary) {
            result = result.pipe(new utf8.Utf8EncodeWorker());
          }
          return CompressedObject.createWorkerFrom(result, compression, compressionOptions);
        }
      },
      _decompressWorker: function() {
        if (this._data instanceof CompressedObject) {
          return this._data.getContentWorker();
        } else if (this._data instanceof GenericWorker) {
          return this._data;
        } else {
          return new DataWorker(this._data);
        }
      }
    };
    var removedMethods = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"];
    var removedFn = function() {
      throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
    };
    for (var i = 0; i < removedMethods.length; i++) {
      ZipObject.prototype[removedMethods[i]] = removedFn;
    }
    module2.exports = ZipObject;
  }
});

// node_modules/pako/lib/utils/common.js
var require_common2 = __commonJS({
  "node_modules/pako/lib/utils/common.js"(exports2) {
    init_shims();
    "use strict";
    var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
    function _has(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }
    exports2.assign = function(obj) {
      var sources = Array.prototype.slice.call(arguments, 1);
      while (sources.length) {
        var source = sources.shift();
        if (!source) {
          continue;
        }
        if (typeof source !== "object") {
          throw new TypeError(source + "must be non-object");
        }
        for (var p in source) {
          if (_has(source, p)) {
            obj[p] = source[p];
          }
        }
      }
      return obj;
    };
    exports2.shrinkBuf = function(buf, size) {
      if (buf.length === size) {
        return buf;
      }
      if (buf.subarray) {
        return buf.subarray(0, size);
      }
      buf.length = size;
      return buf;
    };
    var fnTyped = {
      arraySet: function(dest, src2, src_offs, len, dest_offs) {
        if (src2.subarray && dest.subarray) {
          dest.set(src2.subarray(src_offs, src_offs + len), dest_offs);
          return;
        }
        for (var i = 0; i < len; i++) {
          dest[dest_offs + i] = src2[src_offs + i];
        }
      },
      flattenChunks: function(chunks) {
        var i, l, len, pos, chunk, result;
        len = 0;
        for (i = 0, l = chunks.length; i < l; i++) {
          len += chunks[i].length;
        }
        result = new Uint8Array(len);
        pos = 0;
        for (i = 0, l = chunks.length; i < l; i++) {
          chunk = chunks[i];
          result.set(chunk, pos);
          pos += chunk.length;
        }
        return result;
      }
    };
    var fnUntyped = {
      arraySet: function(dest, src2, src_offs, len, dest_offs) {
        for (var i = 0; i < len; i++) {
          dest[dest_offs + i] = src2[src_offs + i];
        }
      },
      flattenChunks: function(chunks) {
        return [].concat.apply([], chunks);
      }
    };
    exports2.setTyped = function(on) {
      if (on) {
        exports2.Buf8 = Uint8Array;
        exports2.Buf16 = Uint16Array;
        exports2.Buf32 = Int32Array;
        exports2.assign(exports2, fnTyped);
      } else {
        exports2.Buf8 = Array;
        exports2.Buf16 = Array;
        exports2.Buf32 = Array;
        exports2.assign(exports2, fnUntyped);
      }
    };
    exports2.setTyped(TYPED_OK);
  }
});

// node_modules/pako/lib/zlib/trees.js
var require_trees = __commonJS({
  "node_modules/pako/lib/zlib/trees.js"(exports2) {
    init_shims();
    "use strict";
    var utils = require_common2();
    var Z_FIXED = 4;
    var Z_BINARY = 0;
    var Z_TEXT = 1;
    var Z_UNKNOWN = 2;
    function zero(buf) {
      var len = buf.length;
      while (--len >= 0) {
        buf[len] = 0;
      }
    }
    var STORED_BLOCK = 0;
    var STATIC_TREES = 1;
    var DYN_TREES = 2;
    var MIN_MATCH = 3;
    var MAX_MATCH = 258;
    var LENGTH_CODES = 29;
    var LITERALS = 256;
    var L_CODES = LITERALS + 1 + LENGTH_CODES;
    var D_CODES = 30;
    var BL_CODES = 19;
    var HEAP_SIZE = 2 * L_CODES + 1;
    var MAX_BITS = 15;
    var Buf_size = 16;
    var MAX_BL_BITS = 7;
    var END_BLOCK = 256;
    var REP_3_6 = 16;
    var REPZ_3_10 = 17;
    var REPZ_11_138 = 18;
    var extra_lbits = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
    var extra_dbits = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
    var extra_blbits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7];
    var bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
    var DIST_CODE_LEN = 512;
    var static_ltree = new Array((L_CODES + 2) * 2);
    zero(static_ltree);
    var static_dtree = new Array(D_CODES * 2);
    zero(static_dtree);
    var _dist_code = new Array(DIST_CODE_LEN);
    zero(_dist_code);
    var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
    zero(_length_code);
    var base_length = new Array(LENGTH_CODES);
    zero(base_length);
    var base_dist = new Array(D_CODES);
    zero(base_dist);
    function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
      this.static_tree = static_tree;
      this.extra_bits = extra_bits;
      this.extra_base = extra_base;
      this.elems = elems;
      this.max_length = max_length;
      this.has_stree = static_tree && static_tree.length;
    }
    var static_l_desc;
    var static_d_desc;
    var static_bl_desc;
    function TreeDesc(dyn_tree, stat_desc) {
      this.dyn_tree = dyn_tree;
      this.max_code = 0;
      this.stat_desc = stat_desc;
    }
    function d_code(dist) {
      return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
    }
    function put_short(s2, w) {
      s2.pending_buf[s2.pending++] = w & 255;
      s2.pending_buf[s2.pending++] = w >>> 8 & 255;
    }
    function send_bits(s2, value, length) {
      if (s2.bi_valid > Buf_size - length) {
        s2.bi_buf |= value << s2.bi_valid & 65535;
        put_short(s2, s2.bi_buf);
        s2.bi_buf = value >> Buf_size - s2.bi_valid;
        s2.bi_valid += length - Buf_size;
      } else {
        s2.bi_buf |= value << s2.bi_valid & 65535;
        s2.bi_valid += length;
      }
    }
    function send_code(s2, c, tree) {
      send_bits(s2, tree[c * 2], tree[c * 2 + 1]);
    }
    function bi_reverse(code, len) {
      var res2 = 0;
      do {
        res2 |= code & 1;
        code >>>= 1;
        res2 <<= 1;
      } while (--len > 0);
      return res2 >>> 1;
    }
    function bi_flush(s2) {
      if (s2.bi_valid === 16) {
        put_short(s2, s2.bi_buf);
        s2.bi_buf = 0;
        s2.bi_valid = 0;
      } else if (s2.bi_valid >= 8) {
        s2.pending_buf[s2.pending++] = s2.bi_buf & 255;
        s2.bi_buf >>= 8;
        s2.bi_valid -= 8;
      }
    }
    function gen_bitlen(s2, desc) {
      var tree = desc.dyn_tree;
      var max_code = desc.max_code;
      var stree = desc.stat_desc.static_tree;
      var has_stree = desc.stat_desc.has_stree;
      var extra = desc.stat_desc.extra_bits;
      var base2 = desc.stat_desc.extra_base;
      var max_length = desc.stat_desc.max_length;
      var h;
      var n, m;
      var bits;
      var xbits;
      var f;
      var overflow = 0;
      for (bits = 0; bits <= MAX_BITS; bits++) {
        s2.bl_count[bits] = 0;
      }
      tree[s2.heap[s2.heap_max] * 2 + 1] = 0;
      for (h = s2.heap_max + 1; h < HEAP_SIZE; h++) {
        n = s2.heap[h];
        bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
        if (bits > max_length) {
          bits = max_length;
          overflow++;
        }
        tree[n * 2 + 1] = bits;
        if (n > max_code) {
          continue;
        }
        s2.bl_count[bits]++;
        xbits = 0;
        if (n >= base2) {
          xbits = extra[n - base2];
        }
        f = tree[n * 2];
        s2.opt_len += f * (bits + xbits);
        if (has_stree) {
          s2.static_len += f * (stree[n * 2 + 1] + xbits);
        }
      }
      if (overflow === 0) {
        return;
      }
      do {
        bits = max_length - 1;
        while (s2.bl_count[bits] === 0) {
          bits--;
        }
        s2.bl_count[bits]--;
        s2.bl_count[bits + 1] += 2;
        s2.bl_count[max_length]--;
        overflow -= 2;
      } while (overflow > 0);
      for (bits = max_length; bits !== 0; bits--) {
        n = s2.bl_count[bits];
        while (n !== 0) {
          m = s2.heap[--h];
          if (m > max_code) {
            continue;
          }
          if (tree[m * 2 + 1] !== bits) {
            s2.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
            tree[m * 2 + 1] = bits;
          }
          n--;
        }
      }
    }
    function gen_codes(tree, max_code, bl_count) {
      var next_code = new Array(MAX_BITS + 1);
      var code = 0;
      var bits;
      var n;
      for (bits = 1; bits <= MAX_BITS; bits++) {
        next_code[bits] = code = code + bl_count[bits - 1] << 1;
      }
      for (n = 0; n <= max_code; n++) {
        var len = tree[n * 2 + 1];
        if (len === 0) {
          continue;
        }
        tree[n * 2] = bi_reverse(next_code[len]++, len);
      }
    }
    function tr_static_init() {
      var n;
      var bits;
      var length;
      var code;
      var dist;
      var bl_count = new Array(MAX_BITS + 1);
      length = 0;
      for (code = 0; code < LENGTH_CODES - 1; code++) {
        base_length[code] = length;
        for (n = 0; n < 1 << extra_lbits[code]; n++) {
          _length_code[length++] = code;
        }
      }
      _length_code[length - 1] = code;
      dist = 0;
      for (code = 0; code < 16; code++) {
        base_dist[code] = dist;
        for (n = 0; n < 1 << extra_dbits[code]; n++) {
          _dist_code[dist++] = code;
        }
      }
      dist >>= 7;
      for (; code < D_CODES; code++) {
        base_dist[code] = dist << 7;
        for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
          _dist_code[256 + dist++] = code;
        }
      }
      for (bits = 0; bits <= MAX_BITS; bits++) {
        bl_count[bits] = 0;
      }
      n = 0;
      while (n <= 143) {
        static_ltree[n * 2 + 1] = 8;
        n++;
        bl_count[8]++;
      }
      while (n <= 255) {
        static_ltree[n * 2 + 1] = 9;
        n++;
        bl_count[9]++;
      }
      while (n <= 279) {
        static_ltree[n * 2 + 1] = 7;
        n++;
        bl_count[7]++;
      }
      while (n <= 287) {
        static_ltree[n * 2 + 1] = 8;
        n++;
        bl_count[8]++;
      }
      gen_codes(static_ltree, L_CODES + 1, bl_count);
      for (n = 0; n < D_CODES; n++) {
        static_dtree[n * 2 + 1] = 5;
        static_dtree[n * 2] = bi_reverse(n, 5);
      }
      static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
      static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
      static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
    }
    function init_block(s2) {
      var n;
      for (n = 0; n < L_CODES; n++) {
        s2.dyn_ltree[n * 2] = 0;
      }
      for (n = 0; n < D_CODES; n++) {
        s2.dyn_dtree[n * 2] = 0;
      }
      for (n = 0; n < BL_CODES; n++) {
        s2.bl_tree[n * 2] = 0;
      }
      s2.dyn_ltree[END_BLOCK * 2] = 1;
      s2.opt_len = s2.static_len = 0;
      s2.last_lit = s2.matches = 0;
    }
    function bi_windup(s2) {
      if (s2.bi_valid > 8) {
        put_short(s2, s2.bi_buf);
      } else if (s2.bi_valid > 0) {
        s2.pending_buf[s2.pending++] = s2.bi_buf;
      }
      s2.bi_buf = 0;
      s2.bi_valid = 0;
    }
    function copy_block(s2, buf, len, header) {
      bi_windup(s2);
      if (header) {
        put_short(s2, len);
        put_short(s2, ~len);
      }
      utils.arraySet(s2.pending_buf, s2.window, buf, len, s2.pending);
      s2.pending += len;
    }
    function smaller(tree, n, m, depth) {
      var _n2 = n * 2;
      var _m2 = m * 2;
      return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
    }
    function pqdownheap(s2, tree, k) {
      var v = s2.heap[k];
      var j = k << 1;
      while (j <= s2.heap_len) {
        if (j < s2.heap_len && smaller(tree, s2.heap[j + 1], s2.heap[j], s2.depth)) {
          j++;
        }
        if (smaller(tree, v, s2.heap[j], s2.depth)) {
          break;
        }
        s2.heap[k] = s2.heap[j];
        k = j;
        j <<= 1;
      }
      s2.heap[k] = v;
    }
    function compress_block(s2, ltree, dtree) {
      var dist;
      var lc;
      var lx = 0;
      var code;
      var extra;
      if (s2.last_lit !== 0) {
        do {
          dist = s2.pending_buf[s2.d_buf + lx * 2] << 8 | s2.pending_buf[s2.d_buf + lx * 2 + 1];
          lc = s2.pending_buf[s2.l_buf + lx];
          lx++;
          if (dist === 0) {
            send_code(s2, lc, ltree);
          } else {
            code = _length_code[lc];
            send_code(s2, code + LITERALS + 1, ltree);
            extra = extra_lbits[code];
            if (extra !== 0) {
              lc -= base_length[code];
              send_bits(s2, lc, extra);
            }
            dist--;
            code = d_code(dist);
            send_code(s2, code, dtree);
            extra = extra_dbits[code];
            if (extra !== 0) {
              dist -= base_dist[code];
              send_bits(s2, dist, extra);
            }
          }
        } while (lx < s2.last_lit);
      }
      send_code(s2, END_BLOCK, ltree);
    }
    function build_tree(s2, desc) {
      var tree = desc.dyn_tree;
      var stree = desc.stat_desc.static_tree;
      var has_stree = desc.stat_desc.has_stree;
      var elems = desc.stat_desc.elems;
      var n, m;
      var max_code = -1;
      var node;
      s2.heap_len = 0;
      s2.heap_max = HEAP_SIZE;
      for (n = 0; n < elems; n++) {
        if (tree[n * 2] !== 0) {
          s2.heap[++s2.heap_len] = max_code = n;
          s2.depth[n] = 0;
        } else {
          tree[n * 2 + 1] = 0;
        }
      }
      while (s2.heap_len < 2) {
        node = s2.heap[++s2.heap_len] = max_code < 2 ? ++max_code : 0;
        tree[node * 2] = 1;
        s2.depth[node] = 0;
        s2.opt_len--;
        if (has_stree) {
          s2.static_len -= stree[node * 2 + 1];
        }
      }
      desc.max_code = max_code;
      for (n = s2.heap_len >> 1; n >= 1; n--) {
        pqdownheap(s2, tree, n);
      }
      node = elems;
      do {
        n = s2.heap[1];
        s2.heap[1] = s2.heap[s2.heap_len--];
        pqdownheap(s2, tree, 1);
        m = s2.heap[1];
        s2.heap[--s2.heap_max] = n;
        s2.heap[--s2.heap_max] = m;
        tree[node * 2] = tree[n * 2] + tree[m * 2];
        s2.depth[node] = (s2.depth[n] >= s2.depth[m] ? s2.depth[n] : s2.depth[m]) + 1;
        tree[n * 2 + 1] = tree[m * 2 + 1] = node;
        s2.heap[1] = node++;
        pqdownheap(s2, tree, 1);
      } while (s2.heap_len >= 2);
      s2.heap[--s2.heap_max] = s2.heap[1];
      gen_bitlen(s2, desc);
      gen_codes(tree, max_code, s2.bl_count);
    }
    function scan_tree(s2, tree, max_code) {
      var n;
      var prevlen = -1;
      var curlen;
      var nextlen = tree[0 * 2 + 1];
      var count = 0;
      var max_count = 7;
      var min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      tree[(max_code + 1) * 2 + 1] = 65535;
      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          s2.bl_tree[curlen * 2] += count;
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            s2.bl_tree[curlen * 2]++;
          }
          s2.bl_tree[REP_3_6 * 2]++;
        } else if (count <= 10) {
          s2.bl_tree[REPZ_3_10 * 2]++;
        } else {
          s2.bl_tree[REPZ_11_138 * 2]++;
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }
    function send_tree(s2, tree, max_code) {
      var n;
      var prevlen = -1;
      var curlen;
      var nextlen = tree[0 * 2 + 1];
      var count = 0;
      var max_count = 7;
      var min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          do {
            send_code(s2, curlen, s2.bl_tree);
          } while (--count !== 0);
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            send_code(s2, curlen, s2.bl_tree);
            count--;
          }
          send_code(s2, REP_3_6, s2.bl_tree);
          send_bits(s2, count - 3, 2);
        } else if (count <= 10) {
          send_code(s2, REPZ_3_10, s2.bl_tree);
          send_bits(s2, count - 3, 3);
        } else {
          send_code(s2, REPZ_11_138, s2.bl_tree);
          send_bits(s2, count - 11, 7);
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }
    function build_bl_tree(s2) {
      var max_blindex;
      scan_tree(s2, s2.dyn_ltree, s2.l_desc.max_code);
      scan_tree(s2, s2.dyn_dtree, s2.d_desc.max_code);
      build_tree(s2, s2.bl_desc);
      for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
        if (s2.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
          break;
        }
      }
      s2.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
      return max_blindex;
    }
    function send_all_trees(s2, lcodes, dcodes, blcodes) {
      var rank;
      send_bits(s2, lcodes - 257, 5);
      send_bits(s2, dcodes - 1, 5);
      send_bits(s2, blcodes - 4, 4);
      for (rank = 0; rank < blcodes; rank++) {
        send_bits(s2, s2.bl_tree[bl_order[rank] * 2 + 1], 3);
      }
      send_tree(s2, s2.dyn_ltree, lcodes - 1);
      send_tree(s2, s2.dyn_dtree, dcodes - 1);
    }
    function detect_data_type(s2) {
      var black_mask = 4093624447;
      var n;
      for (n = 0; n <= 31; n++, black_mask >>>= 1) {
        if (black_mask & 1 && s2.dyn_ltree[n * 2] !== 0) {
          return Z_BINARY;
        }
      }
      if (s2.dyn_ltree[9 * 2] !== 0 || s2.dyn_ltree[10 * 2] !== 0 || s2.dyn_ltree[13 * 2] !== 0) {
        return Z_TEXT;
      }
      for (n = 32; n < LITERALS; n++) {
        if (s2.dyn_ltree[n * 2] !== 0) {
          return Z_TEXT;
        }
      }
      return Z_BINARY;
    }
    var static_init_done = false;
    function _tr_init(s2) {
      if (!static_init_done) {
        tr_static_init();
        static_init_done = true;
      }
      s2.l_desc = new TreeDesc(s2.dyn_ltree, static_l_desc);
      s2.d_desc = new TreeDesc(s2.dyn_dtree, static_d_desc);
      s2.bl_desc = new TreeDesc(s2.bl_tree, static_bl_desc);
      s2.bi_buf = 0;
      s2.bi_valid = 0;
      init_block(s2);
    }
    function _tr_stored_block(s2, buf, stored_len, last) {
      send_bits(s2, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
      copy_block(s2, buf, stored_len, true);
    }
    function _tr_align(s2) {
      send_bits(s2, STATIC_TREES << 1, 3);
      send_code(s2, END_BLOCK, static_ltree);
      bi_flush(s2);
    }
    function _tr_flush_block(s2, buf, stored_len, last) {
      var opt_lenb, static_lenb;
      var max_blindex = 0;
      if (s2.level > 0) {
        if (s2.strm.data_type === Z_UNKNOWN) {
          s2.strm.data_type = detect_data_type(s2);
        }
        build_tree(s2, s2.l_desc);
        build_tree(s2, s2.d_desc);
        max_blindex = build_bl_tree(s2);
        opt_lenb = s2.opt_len + 3 + 7 >>> 3;
        static_lenb = s2.static_len + 3 + 7 >>> 3;
        if (static_lenb <= opt_lenb) {
          opt_lenb = static_lenb;
        }
      } else {
        opt_lenb = static_lenb = stored_len + 5;
      }
      if (stored_len + 4 <= opt_lenb && buf !== -1) {
        _tr_stored_block(s2, buf, stored_len, last);
      } else if (s2.strategy === Z_FIXED || static_lenb === opt_lenb) {
        send_bits(s2, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
        compress_block(s2, static_ltree, static_dtree);
      } else {
        send_bits(s2, (DYN_TREES << 1) + (last ? 1 : 0), 3);
        send_all_trees(s2, s2.l_desc.max_code + 1, s2.d_desc.max_code + 1, max_blindex + 1);
        compress_block(s2, s2.dyn_ltree, s2.dyn_dtree);
      }
      init_block(s2);
      if (last) {
        bi_windup(s2);
      }
    }
    function _tr_tally(s2, dist, lc) {
      s2.pending_buf[s2.d_buf + s2.last_lit * 2] = dist >>> 8 & 255;
      s2.pending_buf[s2.d_buf + s2.last_lit * 2 + 1] = dist & 255;
      s2.pending_buf[s2.l_buf + s2.last_lit] = lc & 255;
      s2.last_lit++;
      if (dist === 0) {
        s2.dyn_ltree[lc * 2]++;
      } else {
        s2.matches++;
        dist--;
        s2.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
        s2.dyn_dtree[d_code(dist) * 2]++;
      }
      return s2.last_lit === s2.lit_bufsize - 1;
    }
    exports2._tr_init = _tr_init;
    exports2._tr_stored_block = _tr_stored_block;
    exports2._tr_flush_block = _tr_flush_block;
    exports2._tr_tally = _tr_tally;
    exports2._tr_align = _tr_align;
  }
});

// node_modules/pako/lib/zlib/adler32.js
var require_adler32 = __commonJS({
  "node_modules/pako/lib/zlib/adler32.js"(exports2, module2) {
    init_shims();
    "use strict";
    function adler32(adler, buf, len, pos) {
      var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
      while (len !== 0) {
        n = len > 2e3 ? 2e3 : len;
        len -= n;
        do {
          s1 = s1 + buf[pos++] | 0;
          s2 = s2 + s1 | 0;
        } while (--n);
        s1 %= 65521;
        s2 %= 65521;
      }
      return s1 | s2 << 16 | 0;
    }
    module2.exports = adler32;
  }
});

// node_modules/pako/lib/zlib/crc32.js
var require_crc322 = __commonJS({
  "node_modules/pako/lib/zlib/crc32.js"(exports2, module2) {
    init_shims();
    "use strict";
    function makeTable() {
      var c, table = [];
      for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
          c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
        }
        table[n] = c;
      }
      return table;
    }
    var crcTable = makeTable();
    function crc32(crc, buf, len, pos) {
      var t = crcTable, end = pos + len;
      crc ^= -1;
      for (var i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
      }
      return crc ^ -1;
    }
    module2.exports = crc32;
  }
});

// node_modules/pako/lib/zlib/messages.js
var require_messages = __commonJS({
  "node_modules/pako/lib/zlib/messages.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = {
      2: "need dictionary",
      1: "stream end",
      0: "",
      "-1": "file error",
      "-2": "stream error",
      "-3": "data error",
      "-4": "insufficient memory",
      "-5": "buffer error",
      "-6": "incompatible version"
    };
  }
});

// node_modules/pako/lib/zlib/deflate.js
var require_deflate = __commonJS({
  "node_modules/pako/lib/zlib/deflate.js"(exports2) {
    init_shims();
    "use strict";
    var utils = require_common2();
    var trees = require_trees();
    var adler32 = require_adler32();
    var crc32 = require_crc322();
    var msg = require_messages();
    var Z_NO_FLUSH = 0;
    var Z_PARTIAL_FLUSH = 1;
    var Z_FULL_FLUSH = 3;
    var Z_FINISH = 4;
    var Z_BLOCK = 5;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_STREAM_ERROR = -2;
    var Z_DATA_ERROR = -3;
    var Z_BUF_ERROR = -5;
    var Z_DEFAULT_COMPRESSION = -1;
    var Z_FILTERED = 1;
    var Z_HUFFMAN_ONLY = 2;
    var Z_RLE = 3;
    var Z_FIXED = 4;
    var Z_DEFAULT_STRATEGY = 0;
    var Z_UNKNOWN = 2;
    var Z_DEFLATED = 8;
    var MAX_MEM_LEVEL = 9;
    var MAX_WBITS = 15;
    var DEF_MEM_LEVEL = 8;
    var LENGTH_CODES = 29;
    var LITERALS = 256;
    var L_CODES = LITERALS + 1 + LENGTH_CODES;
    var D_CODES = 30;
    var BL_CODES = 19;
    var HEAP_SIZE = 2 * L_CODES + 1;
    var MAX_BITS = 15;
    var MIN_MATCH = 3;
    var MAX_MATCH = 258;
    var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
    var PRESET_DICT = 32;
    var INIT_STATE = 42;
    var EXTRA_STATE = 69;
    var NAME_STATE = 73;
    var COMMENT_STATE = 91;
    var HCRC_STATE = 103;
    var BUSY_STATE = 113;
    var FINISH_STATE = 666;
    var BS_NEED_MORE = 1;
    var BS_BLOCK_DONE = 2;
    var BS_FINISH_STARTED = 3;
    var BS_FINISH_DONE = 4;
    var OS_CODE = 3;
    function err(strm, errorCode) {
      strm.msg = msg[errorCode];
      return errorCode;
    }
    function rank(f) {
      return (f << 1) - (f > 4 ? 9 : 0);
    }
    function zero(buf) {
      var len = buf.length;
      while (--len >= 0) {
        buf[len] = 0;
      }
    }
    function flush_pending(strm) {
      var s2 = strm.state;
      var len = s2.pending;
      if (len > strm.avail_out) {
        len = strm.avail_out;
      }
      if (len === 0) {
        return;
      }
      utils.arraySet(strm.output, s2.pending_buf, s2.pending_out, len, strm.next_out);
      strm.next_out += len;
      s2.pending_out += len;
      strm.total_out += len;
      strm.avail_out -= len;
      s2.pending -= len;
      if (s2.pending === 0) {
        s2.pending_out = 0;
      }
    }
    function flush_block_only(s2, last) {
      trees._tr_flush_block(s2, s2.block_start >= 0 ? s2.block_start : -1, s2.strstart - s2.block_start, last);
      s2.block_start = s2.strstart;
      flush_pending(s2.strm);
    }
    function put_byte(s2, b) {
      s2.pending_buf[s2.pending++] = b;
    }
    function putShortMSB(s2, b) {
      s2.pending_buf[s2.pending++] = b >>> 8 & 255;
      s2.pending_buf[s2.pending++] = b & 255;
    }
    function read_buf(strm, buf, start, size) {
      var len = strm.avail_in;
      if (len > size) {
        len = size;
      }
      if (len === 0) {
        return 0;
      }
      strm.avail_in -= len;
      utils.arraySet(buf, strm.input, strm.next_in, len, start);
      if (strm.state.wrap === 1) {
        strm.adler = adler32(strm.adler, buf, len, start);
      } else if (strm.state.wrap === 2) {
        strm.adler = crc32(strm.adler, buf, len, start);
      }
      strm.next_in += len;
      strm.total_in += len;
      return len;
    }
    function longest_match(s2, cur_match) {
      var chain_length = s2.max_chain_length;
      var scan = s2.strstart;
      var match;
      var len;
      var best_len = s2.prev_length;
      var nice_match = s2.nice_match;
      var limit = s2.strstart > s2.w_size - MIN_LOOKAHEAD ? s2.strstart - (s2.w_size - MIN_LOOKAHEAD) : 0;
      var _win = s2.window;
      var wmask = s2.w_mask;
      var prev = s2.prev;
      var strend = s2.strstart + MAX_MATCH;
      var scan_end1 = _win[scan + best_len - 1];
      var scan_end = _win[scan + best_len];
      if (s2.prev_length >= s2.good_match) {
        chain_length >>= 2;
      }
      if (nice_match > s2.lookahead) {
        nice_match = s2.lookahead;
      }
      do {
        match = cur_match;
        if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
          continue;
        }
        scan += 2;
        match++;
        do {
        } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
        len = MAX_MATCH - (strend - scan);
        scan = strend - MAX_MATCH;
        if (len > best_len) {
          s2.match_start = cur_match;
          best_len = len;
          if (len >= nice_match) {
            break;
          }
          scan_end1 = _win[scan + best_len - 1];
          scan_end = _win[scan + best_len];
        }
      } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
      if (best_len <= s2.lookahead) {
        return best_len;
      }
      return s2.lookahead;
    }
    function fill_window(s2) {
      var _w_size = s2.w_size;
      var p, n, m, more, str;
      do {
        more = s2.window_size - s2.lookahead - s2.strstart;
        if (s2.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
          utils.arraySet(s2.window, s2.window, _w_size, _w_size, 0);
          s2.match_start -= _w_size;
          s2.strstart -= _w_size;
          s2.block_start -= _w_size;
          n = s2.hash_size;
          p = n;
          do {
            m = s2.head[--p];
            s2.head[p] = m >= _w_size ? m - _w_size : 0;
          } while (--n);
          n = _w_size;
          p = n;
          do {
            m = s2.prev[--p];
            s2.prev[p] = m >= _w_size ? m - _w_size : 0;
          } while (--n);
          more += _w_size;
        }
        if (s2.strm.avail_in === 0) {
          break;
        }
        n = read_buf(s2.strm, s2.window, s2.strstart + s2.lookahead, more);
        s2.lookahead += n;
        if (s2.lookahead + s2.insert >= MIN_MATCH) {
          str = s2.strstart - s2.insert;
          s2.ins_h = s2.window[str];
          s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[str + 1]) & s2.hash_mask;
          while (s2.insert) {
            s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[str + MIN_MATCH - 1]) & s2.hash_mask;
            s2.prev[str & s2.w_mask] = s2.head[s2.ins_h];
            s2.head[s2.ins_h] = str;
            str++;
            s2.insert--;
            if (s2.lookahead + s2.insert < MIN_MATCH) {
              break;
            }
          }
        }
      } while (s2.lookahead < MIN_LOOKAHEAD && s2.strm.avail_in !== 0);
    }
    function deflate_stored(s2, flush) {
      var max_block_size = 65535;
      if (max_block_size > s2.pending_buf_size - 5) {
        max_block_size = s2.pending_buf_size - 5;
      }
      for (; ; ) {
        if (s2.lookahead <= 1) {
          fill_window(s2);
          if (s2.lookahead === 0 && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s2.lookahead === 0) {
            break;
          }
        }
        s2.strstart += s2.lookahead;
        s2.lookahead = 0;
        var max_start = s2.block_start + max_block_size;
        if (s2.strstart === 0 || s2.strstart >= max_start) {
          s2.lookahead = s2.strstart - max_start;
          s2.strstart = max_start;
          flush_block_only(s2, false);
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        if (s2.strstart - s2.block_start >= s2.w_size - MIN_LOOKAHEAD) {
          flush_block_only(s2, false);
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s2.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only(s2, true);
        if (s2.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s2.strstart > s2.block_start) {
        flush_block_only(s2, false);
        if (s2.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_NEED_MORE;
    }
    function deflate_fast(s2, flush) {
      var hash_head;
      var bflush;
      for (; ; ) {
        if (s2.lookahead < MIN_LOOKAHEAD) {
          fill_window(s2);
          if (s2.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s2.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s2.lookahead >= MIN_MATCH) {
          s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[s2.strstart + MIN_MATCH - 1]) & s2.hash_mask;
          hash_head = s2.prev[s2.strstart & s2.w_mask] = s2.head[s2.ins_h];
          s2.head[s2.ins_h] = s2.strstart;
        }
        if (hash_head !== 0 && s2.strstart - hash_head <= s2.w_size - MIN_LOOKAHEAD) {
          s2.match_length = longest_match(s2, hash_head);
        }
        if (s2.match_length >= MIN_MATCH) {
          bflush = trees._tr_tally(s2, s2.strstart - s2.match_start, s2.match_length - MIN_MATCH);
          s2.lookahead -= s2.match_length;
          if (s2.match_length <= s2.max_lazy_match && s2.lookahead >= MIN_MATCH) {
            s2.match_length--;
            do {
              s2.strstart++;
              s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[s2.strstart + MIN_MATCH - 1]) & s2.hash_mask;
              hash_head = s2.prev[s2.strstart & s2.w_mask] = s2.head[s2.ins_h];
              s2.head[s2.ins_h] = s2.strstart;
            } while (--s2.match_length !== 0);
            s2.strstart++;
          } else {
            s2.strstart += s2.match_length;
            s2.match_length = 0;
            s2.ins_h = s2.window[s2.strstart];
            s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[s2.strstart + 1]) & s2.hash_mask;
          }
        } else {
          bflush = trees._tr_tally(s2, 0, s2.window[s2.strstart]);
          s2.lookahead--;
          s2.strstart++;
        }
        if (bflush) {
          flush_block_only(s2, false);
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s2.insert = s2.strstart < MIN_MATCH - 1 ? s2.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH) {
        flush_block_only(s2, true);
        if (s2.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s2.last_lit) {
        flush_block_only(s2, false);
        if (s2.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function deflate_slow(s2, flush) {
      var hash_head;
      var bflush;
      var max_insert;
      for (; ; ) {
        if (s2.lookahead < MIN_LOOKAHEAD) {
          fill_window(s2);
          if (s2.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s2.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s2.lookahead >= MIN_MATCH) {
          s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[s2.strstart + MIN_MATCH - 1]) & s2.hash_mask;
          hash_head = s2.prev[s2.strstart & s2.w_mask] = s2.head[s2.ins_h];
          s2.head[s2.ins_h] = s2.strstart;
        }
        s2.prev_length = s2.match_length;
        s2.prev_match = s2.match_start;
        s2.match_length = MIN_MATCH - 1;
        if (hash_head !== 0 && s2.prev_length < s2.max_lazy_match && s2.strstart - hash_head <= s2.w_size - MIN_LOOKAHEAD) {
          s2.match_length = longest_match(s2, hash_head);
          if (s2.match_length <= 5 && (s2.strategy === Z_FILTERED || s2.match_length === MIN_MATCH && s2.strstart - s2.match_start > 4096)) {
            s2.match_length = MIN_MATCH - 1;
          }
        }
        if (s2.prev_length >= MIN_MATCH && s2.match_length <= s2.prev_length) {
          max_insert = s2.strstart + s2.lookahead - MIN_MATCH;
          bflush = trees._tr_tally(s2, s2.strstart - 1 - s2.prev_match, s2.prev_length - MIN_MATCH);
          s2.lookahead -= s2.prev_length - 1;
          s2.prev_length -= 2;
          do {
            if (++s2.strstart <= max_insert) {
              s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[s2.strstart + MIN_MATCH - 1]) & s2.hash_mask;
              hash_head = s2.prev[s2.strstart & s2.w_mask] = s2.head[s2.ins_h];
              s2.head[s2.ins_h] = s2.strstart;
            }
          } while (--s2.prev_length !== 0);
          s2.match_available = 0;
          s2.match_length = MIN_MATCH - 1;
          s2.strstart++;
          if (bflush) {
            flush_block_only(s2, false);
            if (s2.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        } else if (s2.match_available) {
          bflush = trees._tr_tally(s2, 0, s2.window[s2.strstart - 1]);
          if (bflush) {
            flush_block_only(s2, false);
          }
          s2.strstart++;
          s2.lookahead--;
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        } else {
          s2.match_available = 1;
          s2.strstart++;
          s2.lookahead--;
        }
      }
      if (s2.match_available) {
        bflush = trees._tr_tally(s2, 0, s2.window[s2.strstart - 1]);
        s2.match_available = 0;
      }
      s2.insert = s2.strstart < MIN_MATCH - 1 ? s2.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH) {
        flush_block_only(s2, true);
        if (s2.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s2.last_lit) {
        flush_block_only(s2, false);
        if (s2.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function deflate_rle(s2, flush) {
      var bflush;
      var prev;
      var scan, strend;
      var _win = s2.window;
      for (; ; ) {
        if (s2.lookahead <= MAX_MATCH) {
          fill_window(s2);
          if (s2.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s2.lookahead === 0) {
            break;
          }
        }
        s2.match_length = 0;
        if (s2.lookahead >= MIN_MATCH && s2.strstart > 0) {
          scan = s2.strstart - 1;
          prev = _win[scan];
          if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
            strend = s2.strstart + MAX_MATCH;
            do {
            } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
            s2.match_length = MAX_MATCH - (strend - scan);
            if (s2.match_length > s2.lookahead) {
              s2.match_length = s2.lookahead;
            }
          }
        }
        if (s2.match_length >= MIN_MATCH) {
          bflush = trees._tr_tally(s2, 1, s2.match_length - MIN_MATCH);
          s2.lookahead -= s2.match_length;
          s2.strstart += s2.match_length;
          s2.match_length = 0;
        } else {
          bflush = trees._tr_tally(s2, 0, s2.window[s2.strstart]);
          s2.lookahead--;
          s2.strstart++;
        }
        if (bflush) {
          flush_block_only(s2, false);
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s2.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only(s2, true);
        if (s2.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s2.last_lit) {
        flush_block_only(s2, false);
        if (s2.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function deflate_huff(s2, flush) {
      var bflush;
      for (; ; ) {
        if (s2.lookahead === 0) {
          fill_window(s2);
          if (s2.lookahead === 0) {
            if (flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            break;
          }
        }
        s2.match_length = 0;
        bflush = trees._tr_tally(s2, 0, s2.window[s2.strstart]);
        s2.lookahead--;
        s2.strstart++;
        if (bflush) {
          flush_block_only(s2, false);
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s2.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only(s2, true);
        if (s2.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s2.last_lit) {
        flush_block_only(s2, false);
        if (s2.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function Config(good_length, max_lazy, nice_length, max_chain, func) {
      this.good_length = good_length;
      this.max_lazy = max_lazy;
      this.nice_length = nice_length;
      this.max_chain = max_chain;
      this.func = func;
    }
    var configuration_table;
    configuration_table = [
      new Config(0, 0, 0, 0, deflate_stored),
      new Config(4, 4, 8, 4, deflate_fast),
      new Config(4, 5, 16, 8, deflate_fast),
      new Config(4, 6, 32, 32, deflate_fast),
      new Config(4, 4, 16, 16, deflate_slow),
      new Config(8, 16, 32, 32, deflate_slow),
      new Config(8, 16, 128, 128, deflate_slow),
      new Config(8, 32, 128, 256, deflate_slow),
      new Config(32, 128, 258, 1024, deflate_slow),
      new Config(32, 258, 258, 4096, deflate_slow)
    ];
    function lm_init(s2) {
      s2.window_size = 2 * s2.w_size;
      zero(s2.head);
      s2.max_lazy_match = configuration_table[s2.level].max_lazy;
      s2.good_match = configuration_table[s2.level].good_length;
      s2.nice_match = configuration_table[s2.level].nice_length;
      s2.max_chain_length = configuration_table[s2.level].max_chain;
      s2.strstart = 0;
      s2.block_start = 0;
      s2.lookahead = 0;
      s2.insert = 0;
      s2.match_length = s2.prev_length = MIN_MATCH - 1;
      s2.match_available = 0;
      s2.ins_h = 0;
    }
    function DeflateState() {
      this.strm = null;
      this.status = 0;
      this.pending_buf = null;
      this.pending_buf_size = 0;
      this.pending_out = 0;
      this.pending = 0;
      this.wrap = 0;
      this.gzhead = null;
      this.gzindex = 0;
      this.method = Z_DEFLATED;
      this.last_flush = -1;
      this.w_size = 0;
      this.w_bits = 0;
      this.w_mask = 0;
      this.window = null;
      this.window_size = 0;
      this.prev = null;
      this.head = null;
      this.ins_h = 0;
      this.hash_size = 0;
      this.hash_bits = 0;
      this.hash_mask = 0;
      this.hash_shift = 0;
      this.block_start = 0;
      this.match_length = 0;
      this.prev_match = 0;
      this.match_available = 0;
      this.strstart = 0;
      this.match_start = 0;
      this.lookahead = 0;
      this.prev_length = 0;
      this.max_chain_length = 0;
      this.max_lazy_match = 0;
      this.level = 0;
      this.strategy = 0;
      this.good_match = 0;
      this.nice_match = 0;
      this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
      this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
      this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
      zero(this.dyn_ltree);
      zero(this.dyn_dtree);
      zero(this.bl_tree);
      this.l_desc = null;
      this.d_desc = null;
      this.bl_desc = null;
      this.bl_count = new utils.Buf16(MAX_BITS + 1);
      this.heap = new utils.Buf16(2 * L_CODES + 1);
      zero(this.heap);
      this.heap_len = 0;
      this.heap_max = 0;
      this.depth = new utils.Buf16(2 * L_CODES + 1);
      zero(this.depth);
      this.l_buf = 0;
      this.lit_bufsize = 0;
      this.last_lit = 0;
      this.d_buf = 0;
      this.opt_len = 0;
      this.static_len = 0;
      this.matches = 0;
      this.insert = 0;
      this.bi_buf = 0;
      this.bi_valid = 0;
    }
    function deflateResetKeep(strm) {
      var s2;
      if (!strm || !strm.state) {
        return err(strm, Z_STREAM_ERROR);
      }
      strm.total_in = strm.total_out = 0;
      strm.data_type = Z_UNKNOWN;
      s2 = strm.state;
      s2.pending = 0;
      s2.pending_out = 0;
      if (s2.wrap < 0) {
        s2.wrap = -s2.wrap;
      }
      s2.status = s2.wrap ? INIT_STATE : BUSY_STATE;
      strm.adler = s2.wrap === 2 ? 0 : 1;
      s2.last_flush = Z_NO_FLUSH;
      trees._tr_init(s2);
      return Z_OK;
    }
    function deflateReset(strm) {
      var ret2 = deflateResetKeep(strm);
      if (ret2 === Z_OK) {
        lm_init(strm.state);
      }
      return ret2;
    }
    function deflateSetHeader(strm, head) {
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      if (strm.state.wrap !== 2) {
        return Z_STREAM_ERROR;
      }
      strm.state.gzhead = head;
      return Z_OK;
    }
    function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
      if (!strm) {
        return Z_STREAM_ERROR;
      }
      var wrap = 1;
      if (level === Z_DEFAULT_COMPRESSION) {
        level = 6;
      }
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else if (windowBits > 15) {
        wrap = 2;
        windowBits -= 16;
      }
      if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
        return err(strm, Z_STREAM_ERROR);
      }
      if (windowBits === 8) {
        windowBits = 9;
      }
      var s2 = new DeflateState();
      strm.state = s2;
      s2.strm = strm;
      s2.wrap = wrap;
      s2.gzhead = null;
      s2.w_bits = windowBits;
      s2.w_size = 1 << s2.w_bits;
      s2.w_mask = s2.w_size - 1;
      s2.hash_bits = memLevel + 7;
      s2.hash_size = 1 << s2.hash_bits;
      s2.hash_mask = s2.hash_size - 1;
      s2.hash_shift = ~~((s2.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
      s2.window = new utils.Buf8(s2.w_size * 2);
      s2.head = new utils.Buf16(s2.hash_size);
      s2.prev = new utils.Buf16(s2.w_size);
      s2.lit_bufsize = 1 << memLevel + 6;
      s2.pending_buf_size = s2.lit_bufsize * 4;
      s2.pending_buf = new utils.Buf8(s2.pending_buf_size);
      s2.d_buf = 1 * s2.lit_bufsize;
      s2.l_buf = (1 + 2) * s2.lit_bufsize;
      s2.level = level;
      s2.strategy = strategy;
      s2.method = method;
      return deflateReset(strm);
    }
    function deflateInit(strm, level) {
      return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
    }
    function deflate(strm, flush) {
      var old_flush, s2;
      var beg, val;
      if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) {
        return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
      }
      s2 = strm.state;
      if (!strm.output || !strm.input && strm.avail_in !== 0 || s2.status === FINISH_STATE && flush !== Z_FINISH) {
        return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
      }
      s2.strm = strm;
      old_flush = s2.last_flush;
      s2.last_flush = flush;
      if (s2.status === INIT_STATE) {
        if (s2.wrap === 2) {
          strm.adler = 0;
          put_byte(s2, 31);
          put_byte(s2, 139);
          put_byte(s2, 8);
          if (!s2.gzhead) {
            put_byte(s2, 0);
            put_byte(s2, 0);
            put_byte(s2, 0);
            put_byte(s2, 0);
            put_byte(s2, 0);
            put_byte(s2, s2.level === 9 ? 2 : s2.strategy >= Z_HUFFMAN_ONLY || s2.level < 2 ? 4 : 0);
            put_byte(s2, OS_CODE);
            s2.status = BUSY_STATE;
          } else {
            put_byte(s2, (s2.gzhead.text ? 1 : 0) + (s2.gzhead.hcrc ? 2 : 0) + (!s2.gzhead.extra ? 0 : 4) + (!s2.gzhead.name ? 0 : 8) + (!s2.gzhead.comment ? 0 : 16));
            put_byte(s2, s2.gzhead.time & 255);
            put_byte(s2, s2.gzhead.time >> 8 & 255);
            put_byte(s2, s2.gzhead.time >> 16 & 255);
            put_byte(s2, s2.gzhead.time >> 24 & 255);
            put_byte(s2, s2.level === 9 ? 2 : s2.strategy >= Z_HUFFMAN_ONLY || s2.level < 2 ? 4 : 0);
            put_byte(s2, s2.gzhead.os & 255);
            if (s2.gzhead.extra && s2.gzhead.extra.length) {
              put_byte(s2, s2.gzhead.extra.length & 255);
              put_byte(s2, s2.gzhead.extra.length >> 8 & 255);
            }
            if (s2.gzhead.hcrc) {
              strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending, 0);
            }
            s2.gzindex = 0;
            s2.status = EXTRA_STATE;
          }
        } else {
          var header = Z_DEFLATED + (s2.w_bits - 8 << 4) << 8;
          var level_flags = -1;
          if (s2.strategy >= Z_HUFFMAN_ONLY || s2.level < 2) {
            level_flags = 0;
          } else if (s2.level < 6) {
            level_flags = 1;
          } else if (s2.level === 6) {
            level_flags = 2;
          } else {
            level_flags = 3;
          }
          header |= level_flags << 6;
          if (s2.strstart !== 0) {
            header |= PRESET_DICT;
          }
          header += 31 - header % 31;
          s2.status = BUSY_STATE;
          putShortMSB(s2, header);
          if (s2.strstart !== 0) {
            putShortMSB(s2, strm.adler >>> 16);
            putShortMSB(s2, strm.adler & 65535);
          }
          strm.adler = 1;
        }
      }
      if (s2.status === EXTRA_STATE) {
        if (s2.gzhead.extra) {
          beg = s2.pending;
          while (s2.gzindex < (s2.gzhead.extra.length & 65535)) {
            if (s2.pending === s2.pending_buf_size) {
              if (s2.gzhead.hcrc && s2.pending > beg) {
                strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s2.pending;
              if (s2.pending === s2.pending_buf_size) {
                break;
              }
            }
            put_byte(s2, s2.gzhead.extra[s2.gzindex] & 255);
            s2.gzindex++;
          }
          if (s2.gzhead.hcrc && s2.pending > beg) {
            strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
          }
          if (s2.gzindex === s2.gzhead.extra.length) {
            s2.gzindex = 0;
            s2.status = NAME_STATE;
          }
        } else {
          s2.status = NAME_STATE;
        }
      }
      if (s2.status === NAME_STATE) {
        if (s2.gzhead.name) {
          beg = s2.pending;
          do {
            if (s2.pending === s2.pending_buf_size) {
              if (s2.gzhead.hcrc && s2.pending > beg) {
                strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s2.pending;
              if (s2.pending === s2.pending_buf_size) {
                val = 1;
                break;
              }
            }
            if (s2.gzindex < s2.gzhead.name.length) {
              val = s2.gzhead.name.charCodeAt(s2.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s2, val);
          } while (val !== 0);
          if (s2.gzhead.hcrc && s2.pending > beg) {
            strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
          }
          if (val === 0) {
            s2.gzindex = 0;
            s2.status = COMMENT_STATE;
          }
        } else {
          s2.status = COMMENT_STATE;
        }
      }
      if (s2.status === COMMENT_STATE) {
        if (s2.gzhead.comment) {
          beg = s2.pending;
          do {
            if (s2.pending === s2.pending_buf_size) {
              if (s2.gzhead.hcrc && s2.pending > beg) {
                strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s2.pending;
              if (s2.pending === s2.pending_buf_size) {
                val = 1;
                break;
              }
            }
            if (s2.gzindex < s2.gzhead.comment.length) {
              val = s2.gzhead.comment.charCodeAt(s2.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s2, val);
          } while (val !== 0);
          if (s2.gzhead.hcrc && s2.pending > beg) {
            strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
          }
          if (val === 0) {
            s2.status = HCRC_STATE;
          }
        } else {
          s2.status = HCRC_STATE;
        }
      }
      if (s2.status === HCRC_STATE) {
        if (s2.gzhead.hcrc) {
          if (s2.pending + 2 > s2.pending_buf_size) {
            flush_pending(strm);
          }
          if (s2.pending + 2 <= s2.pending_buf_size) {
            put_byte(s2, strm.adler & 255);
            put_byte(s2, strm.adler >> 8 & 255);
            strm.adler = 0;
            s2.status = BUSY_STATE;
          }
        } else {
          s2.status = BUSY_STATE;
        }
      }
      if (s2.pending !== 0) {
        flush_pending(strm);
        if (strm.avail_out === 0) {
          s2.last_flush = -1;
          return Z_OK;
        }
      } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
        return err(strm, Z_BUF_ERROR);
      }
      if (s2.status === FINISH_STATE && strm.avail_in !== 0) {
        return err(strm, Z_BUF_ERROR);
      }
      if (strm.avail_in !== 0 || s2.lookahead !== 0 || flush !== Z_NO_FLUSH && s2.status !== FINISH_STATE) {
        var bstate = s2.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s2, flush) : s2.strategy === Z_RLE ? deflate_rle(s2, flush) : configuration_table[s2.level].func(s2, flush);
        if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
          s2.status = FINISH_STATE;
        }
        if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
          if (strm.avail_out === 0) {
            s2.last_flush = -1;
          }
          return Z_OK;
        }
        if (bstate === BS_BLOCK_DONE) {
          if (flush === Z_PARTIAL_FLUSH) {
            trees._tr_align(s2);
          } else if (flush !== Z_BLOCK) {
            trees._tr_stored_block(s2, 0, 0, false);
            if (flush === Z_FULL_FLUSH) {
              zero(s2.head);
              if (s2.lookahead === 0) {
                s2.strstart = 0;
                s2.block_start = 0;
                s2.insert = 0;
              }
            }
          }
          flush_pending(strm);
          if (strm.avail_out === 0) {
            s2.last_flush = -1;
            return Z_OK;
          }
        }
      }
      if (flush !== Z_FINISH) {
        return Z_OK;
      }
      if (s2.wrap <= 0) {
        return Z_STREAM_END;
      }
      if (s2.wrap === 2) {
        put_byte(s2, strm.adler & 255);
        put_byte(s2, strm.adler >> 8 & 255);
        put_byte(s2, strm.adler >> 16 & 255);
        put_byte(s2, strm.adler >> 24 & 255);
        put_byte(s2, strm.total_in & 255);
        put_byte(s2, strm.total_in >> 8 & 255);
        put_byte(s2, strm.total_in >> 16 & 255);
        put_byte(s2, strm.total_in >> 24 & 255);
      } else {
        putShortMSB(s2, strm.adler >>> 16);
        putShortMSB(s2, strm.adler & 65535);
      }
      flush_pending(strm);
      if (s2.wrap > 0) {
        s2.wrap = -s2.wrap;
      }
      return s2.pending !== 0 ? Z_OK : Z_STREAM_END;
    }
    function deflateEnd(strm) {
      var status;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      status = strm.state.status;
      if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
        return err(strm, Z_STREAM_ERROR);
      }
      strm.state = null;
      return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
    }
    function deflateSetDictionary(strm, dictionary) {
      var dictLength = dictionary.length;
      var s2;
      var str, n;
      var wrap;
      var avail;
      var next;
      var input;
      var tmpDict;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      s2 = strm.state;
      wrap = s2.wrap;
      if (wrap === 2 || wrap === 1 && s2.status !== INIT_STATE || s2.lookahead) {
        return Z_STREAM_ERROR;
      }
      if (wrap === 1) {
        strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
      }
      s2.wrap = 0;
      if (dictLength >= s2.w_size) {
        if (wrap === 0) {
          zero(s2.head);
          s2.strstart = 0;
          s2.block_start = 0;
          s2.insert = 0;
        }
        tmpDict = new utils.Buf8(s2.w_size);
        utils.arraySet(tmpDict, dictionary, dictLength - s2.w_size, s2.w_size, 0);
        dictionary = tmpDict;
        dictLength = s2.w_size;
      }
      avail = strm.avail_in;
      next = strm.next_in;
      input = strm.input;
      strm.avail_in = dictLength;
      strm.next_in = 0;
      strm.input = dictionary;
      fill_window(s2);
      while (s2.lookahead >= MIN_MATCH) {
        str = s2.strstart;
        n = s2.lookahead - (MIN_MATCH - 1);
        do {
          s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[str + MIN_MATCH - 1]) & s2.hash_mask;
          s2.prev[str & s2.w_mask] = s2.head[s2.ins_h];
          s2.head[s2.ins_h] = str;
          str++;
        } while (--n);
        s2.strstart = str;
        s2.lookahead = MIN_MATCH - 1;
        fill_window(s2);
      }
      s2.strstart += s2.lookahead;
      s2.block_start = s2.strstart;
      s2.insert = s2.lookahead;
      s2.lookahead = 0;
      s2.match_length = s2.prev_length = MIN_MATCH - 1;
      s2.match_available = 0;
      strm.next_in = next;
      strm.input = input;
      strm.avail_in = avail;
      s2.wrap = wrap;
      return Z_OK;
    }
    exports2.deflateInit = deflateInit;
    exports2.deflateInit2 = deflateInit2;
    exports2.deflateReset = deflateReset;
    exports2.deflateResetKeep = deflateResetKeep;
    exports2.deflateSetHeader = deflateSetHeader;
    exports2.deflate = deflate;
    exports2.deflateEnd = deflateEnd;
    exports2.deflateSetDictionary = deflateSetDictionary;
    exports2.deflateInfo = "pako deflate (from Nodeca project)";
  }
});

// node_modules/pako/lib/utils/strings.js
var require_strings = __commonJS({
  "node_modules/pako/lib/utils/strings.js"(exports2) {
    init_shims();
    "use strict";
    var utils = require_common2();
    var STR_APPLY_OK = true;
    var STR_APPLY_UIA_OK = true;
    try {
      String.fromCharCode.apply(null, [0]);
    } catch (__) {
      STR_APPLY_OK = false;
    }
    try {
      String.fromCharCode.apply(null, new Uint8Array(1));
    } catch (__) {
      STR_APPLY_UIA_OK = false;
    }
    var _utf8len = new utils.Buf8(256);
    for (var q = 0; q < 256; q++) {
      _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
    }
    _utf8len[254] = _utf8len[254] = 1;
    exports2.string2buf = function(str) {
      var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
      }
      buf = new utils.Buf8(buf_len);
      for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        if (c < 128) {
          buf[i++] = c;
        } else if (c < 2048) {
          buf[i++] = 192 | c >>> 6;
          buf[i++] = 128 | c & 63;
        } else if (c < 65536) {
          buf[i++] = 224 | c >>> 12;
          buf[i++] = 128 | c >>> 6 & 63;
          buf[i++] = 128 | c & 63;
        } else {
          buf[i++] = 240 | c >>> 18;
          buf[i++] = 128 | c >>> 12 & 63;
          buf[i++] = 128 | c >>> 6 & 63;
          buf[i++] = 128 | c & 63;
        }
      }
      return buf;
    };
    function buf2binstring(buf, len) {
      if (len < 65534) {
        if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) {
          return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
        }
      }
      var result = "";
      for (var i = 0; i < len; i++) {
        result += String.fromCharCode(buf[i]);
      }
      return result;
    }
    exports2.buf2binstring = function(buf) {
      return buf2binstring(buf, buf.length);
    };
    exports2.binstring2buf = function(str) {
      var buf = new utils.Buf8(str.length);
      for (var i = 0, len = buf.length; i < len; i++) {
        buf[i] = str.charCodeAt(i);
      }
      return buf;
    };
    exports2.buf2string = function(buf, max) {
      var i, out, c, c_len;
      var len = max || buf.length;
      var utf16buf = new Array(len * 2);
      for (out = 0, i = 0; i < len; ) {
        c = buf[i++];
        if (c < 128) {
          utf16buf[out++] = c;
          continue;
        }
        c_len = _utf8len[c];
        if (c_len > 4) {
          utf16buf[out++] = 65533;
          i += c_len - 1;
          continue;
        }
        c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
        while (c_len > 1 && i < len) {
          c = c << 6 | buf[i++] & 63;
          c_len--;
        }
        if (c_len > 1) {
          utf16buf[out++] = 65533;
          continue;
        }
        if (c < 65536) {
          utf16buf[out++] = c;
        } else {
          c -= 65536;
          utf16buf[out++] = 55296 | c >> 10 & 1023;
          utf16buf[out++] = 56320 | c & 1023;
        }
      }
      return buf2binstring(utf16buf, out);
    };
    exports2.utf8border = function(buf, max) {
      var pos;
      max = max || buf.length;
      if (max > buf.length) {
        max = buf.length;
      }
      pos = max - 1;
      while (pos >= 0 && (buf[pos] & 192) === 128) {
        pos--;
      }
      if (pos < 0) {
        return max;
      }
      if (pos === 0) {
        return max;
      }
      return pos + _utf8len[buf[pos]] > max ? pos : max;
    };
  }
});

// node_modules/pako/lib/zlib/zstream.js
var require_zstream = __commonJS({
  "node_modules/pako/lib/zlib/zstream.js"(exports2, module2) {
    init_shims();
    "use strict";
    function ZStream() {
      this.input = null;
      this.next_in = 0;
      this.avail_in = 0;
      this.total_in = 0;
      this.output = null;
      this.next_out = 0;
      this.avail_out = 0;
      this.total_out = 0;
      this.msg = "";
      this.state = null;
      this.data_type = 2;
      this.adler = 0;
    }
    module2.exports = ZStream;
  }
});

// node_modules/pako/lib/deflate.js
var require_deflate2 = __commonJS({
  "node_modules/pako/lib/deflate.js"(exports2) {
    init_shims();
    "use strict";
    var zlib_deflate = require_deflate();
    var utils = require_common2();
    var strings = require_strings();
    var msg = require_messages();
    var ZStream = require_zstream();
    var toString = Object.prototype.toString;
    var Z_NO_FLUSH = 0;
    var Z_FINISH = 4;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_SYNC_FLUSH = 2;
    var Z_DEFAULT_COMPRESSION = -1;
    var Z_DEFAULT_STRATEGY = 0;
    var Z_DEFLATED = 8;
    function Deflate(options2) {
      if (!(this instanceof Deflate))
        return new Deflate(options2);
      this.options = utils.assign({
        level: Z_DEFAULT_COMPRESSION,
        method: Z_DEFLATED,
        chunkSize: 16384,
        windowBits: 15,
        memLevel: 8,
        strategy: Z_DEFAULT_STRATEGY,
        to: ""
      }, options2 || {});
      var opt = this.options;
      if (opt.raw && opt.windowBits > 0) {
        opt.windowBits = -opt.windowBits;
      } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
        opt.windowBits += 16;
      }
      this.err = 0;
      this.msg = "";
      this.ended = false;
      this.chunks = [];
      this.strm = new ZStream();
      this.strm.avail_out = 0;
      var status = zlib_deflate.deflateInit2(this.strm, opt.level, opt.method, opt.windowBits, opt.memLevel, opt.strategy);
      if (status !== Z_OK) {
        throw new Error(msg[status]);
      }
      if (opt.header) {
        zlib_deflate.deflateSetHeader(this.strm, opt.header);
      }
      if (opt.dictionary) {
        var dict;
        if (typeof opt.dictionary === "string") {
          dict = strings.string2buf(opt.dictionary);
        } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
          dict = new Uint8Array(opt.dictionary);
        } else {
          dict = opt.dictionary;
        }
        status = zlib_deflate.deflateSetDictionary(this.strm, dict);
        if (status !== Z_OK) {
          throw new Error(msg[status]);
        }
        this._dict_set = true;
      }
    }
    Deflate.prototype.push = function(data, mode) {
      var strm = this.strm;
      var chunkSize = this.options.chunkSize;
      var status, _mode;
      if (this.ended) {
        return false;
      }
      _mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
      if (typeof data === "string") {
        strm.input = strings.string2buf(data);
      } else if (toString.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      do {
        if (strm.avail_out === 0) {
          strm.output = new utils.Buf8(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = zlib_deflate.deflate(strm, _mode);
        if (status !== Z_STREAM_END && status !== Z_OK) {
          this.onEnd(status);
          this.ended = true;
          return false;
        }
        if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) {
          if (this.options.to === "string") {
            this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
          } else {
            this.onData(utils.shrinkBuf(strm.output, strm.next_out));
          }
        }
      } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
      if (_mode === Z_FINISH) {
        status = zlib_deflate.deflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === Z_OK;
      }
      if (_mode === Z_SYNC_FLUSH) {
        this.onEnd(Z_OK);
        strm.avail_out = 0;
        return true;
      }
      return true;
    };
    Deflate.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Deflate.prototype.onEnd = function(status) {
      if (status === Z_OK) {
        if (this.options.to === "string") {
          this.result = this.chunks.join("");
        } else {
          this.result = utils.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    function deflate(input, options2) {
      var deflator = new Deflate(options2);
      deflator.push(input, true);
      if (deflator.err) {
        throw deflator.msg || msg[deflator.err];
      }
      return deflator.result;
    }
    function deflateRaw(input, options2) {
      options2 = options2 || {};
      options2.raw = true;
      return deflate(input, options2);
    }
    function gzip(input, options2) {
      options2 = options2 || {};
      options2.gzip = true;
      return deflate(input, options2);
    }
    exports2.Deflate = Deflate;
    exports2.deflate = deflate;
    exports2.deflateRaw = deflateRaw;
    exports2.gzip = gzip;
  }
});

// node_modules/pako/lib/zlib/inffast.js
var require_inffast = __commonJS({
  "node_modules/pako/lib/zlib/inffast.js"(exports2, module2) {
    init_shims();
    "use strict";
    var BAD = 30;
    var TYPE = 12;
    module2.exports = function inflate_fast(strm, start) {
      var state;
      var _in;
      var last;
      var _out;
      var beg;
      var end;
      var dmax;
      var wsize;
      var whave;
      var wnext;
      var s_window;
      var hold;
      var bits;
      var lcode;
      var dcode;
      var lmask;
      var dmask;
      var here;
      var op;
      var len;
      var dist;
      var from;
      var from_source;
      var input, output;
      state = strm.state;
      _in = strm.next_in;
      input = strm.input;
      last = _in + (strm.avail_in - 5);
      _out = strm.next_out;
      output = strm.output;
      beg = _out - (start - strm.avail_out);
      end = _out + (strm.avail_out - 257);
      dmax = state.dmax;
      wsize = state.wsize;
      whave = state.whave;
      wnext = state.wnext;
      s_window = state.window;
      hold = state.hold;
      bits = state.bits;
      lcode = state.lencode;
      dcode = state.distcode;
      lmask = (1 << state.lenbits) - 1;
      dmask = (1 << state.distbits) - 1;
      top:
        do {
          if (bits < 15) {
            hold += input[_in++] << bits;
            bits += 8;
            hold += input[_in++] << bits;
            bits += 8;
          }
          here = lcode[hold & lmask];
          dolen:
            for (; ; ) {
              op = here >>> 24;
              hold >>>= op;
              bits -= op;
              op = here >>> 16 & 255;
              if (op === 0) {
                output[_out++] = here & 65535;
              } else if (op & 16) {
                len = here & 65535;
                op &= 15;
                if (op) {
                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                  len += hold & (1 << op) - 1;
                  hold >>>= op;
                  bits -= op;
                }
                if (bits < 15) {
                  hold += input[_in++] << bits;
                  bits += 8;
                  hold += input[_in++] << bits;
                  bits += 8;
                }
                here = dcode[hold & dmask];
                dodist:
                  for (; ; ) {
                    op = here >>> 24;
                    hold >>>= op;
                    bits -= op;
                    op = here >>> 16 & 255;
                    if (op & 16) {
                      dist = here & 65535;
                      op &= 15;
                      if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                        if (bits < op) {
                          hold += input[_in++] << bits;
                          bits += 8;
                        }
                      }
                      dist += hold & (1 << op) - 1;
                      if (dist > dmax) {
                        strm.msg = "invalid distance too far back";
                        state.mode = BAD;
                        break top;
                      }
                      hold >>>= op;
                      bits -= op;
                      op = _out - beg;
                      if (dist > op) {
                        op = dist - op;
                        if (op > whave) {
                          if (state.sane) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD;
                            break top;
                          }
                        }
                        from = 0;
                        from_source = s_window;
                        if (wnext === 0) {
                          from += wsize - op;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist;
                            from_source = output;
                          }
                        } else if (wnext < op) {
                          from += wsize + wnext - op;
                          op -= wnext;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = 0;
                            if (wnext < len) {
                              op = wnext;
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          }
                        } else {
                          from += wnext - op;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist;
                            from_source = output;
                          }
                        }
                        while (len > 2) {
                          output[_out++] = from_source[from++];
                          output[_out++] = from_source[from++];
                          output[_out++] = from_source[from++];
                          len -= 3;
                        }
                        if (len) {
                          output[_out++] = from_source[from++];
                          if (len > 1) {
                            output[_out++] = from_source[from++];
                          }
                        }
                      } else {
                        from = _out - dist;
                        do {
                          output[_out++] = output[from++];
                          output[_out++] = output[from++];
                          output[_out++] = output[from++];
                          len -= 3;
                        } while (len > 2);
                        if (len) {
                          output[_out++] = output[from++];
                          if (len > 1) {
                            output[_out++] = output[from++];
                          }
                        }
                      }
                    } else if ((op & 64) === 0) {
                      here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                      continue dodist;
                    } else {
                      strm.msg = "invalid distance code";
                      state.mode = BAD;
                      break top;
                    }
                    break;
                  }
              } else if ((op & 64) === 0) {
                here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                continue dolen;
              } else if (op & 32) {
                state.mode = TYPE;
                break top;
              } else {
                strm.msg = "invalid literal/length code";
                state.mode = BAD;
                break top;
              }
              break;
            }
        } while (_in < last && _out < end);
      len = bits >> 3;
      _in -= len;
      bits -= len << 3;
      hold &= (1 << bits) - 1;
      strm.next_in = _in;
      strm.next_out = _out;
      strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
      strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
      state.hold = hold;
      state.bits = bits;
      return;
    };
  }
});

// node_modules/pako/lib/zlib/inftrees.js
var require_inftrees = __commonJS({
  "node_modules/pako/lib/zlib/inftrees.js"(exports2, module2) {
    init_shims();
    "use strict";
    var utils = require_common2();
    var MAXBITS = 15;
    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;
    var lbase = [
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      13,
      15,
      17,
      19,
      23,
      27,
      31,
      35,
      43,
      51,
      59,
      67,
      83,
      99,
      115,
      131,
      163,
      195,
      227,
      258,
      0,
      0
    ];
    var lext = [
      16,
      16,
      16,
      16,
      16,
      16,
      16,
      16,
      17,
      17,
      17,
      17,
      18,
      18,
      18,
      18,
      19,
      19,
      19,
      19,
      20,
      20,
      20,
      20,
      21,
      21,
      21,
      21,
      16,
      72,
      78
    ];
    var dbase = [
      1,
      2,
      3,
      4,
      5,
      7,
      9,
      13,
      17,
      25,
      33,
      49,
      65,
      97,
      129,
      193,
      257,
      385,
      513,
      769,
      1025,
      1537,
      2049,
      3073,
      4097,
      6145,
      8193,
      12289,
      16385,
      24577,
      0,
      0
    ];
    var dext = [
      16,
      16,
      16,
      16,
      17,
      17,
      18,
      18,
      19,
      19,
      20,
      20,
      21,
      21,
      22,
      22,
      23,
      23,
      24,
      24,
      25,
      25,
      26,
      26,
      27,
      27,
      28,
      28,
      29,
      29,
      64,
      64
    ];
    module2.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
      var bits = opts.bits;
      var len = 0;
      var sym = 0;
      var min = 0, max = 0;
      var root = 0;
      var curr = 0;
      var drop = 0;
      var left = 0;
      var used = 0;
      var huff = 0;
      var incr;
      var fill;
      var low;
      var mask;
      var next;
      var base2 = null;
      var base_index = 0;
      var end;
      var count = new utils.Buf16(MAXBITS + 1);
      var offs = new utils.Buf16(MAXBITS + 1);
      var extra = null;
      var extra_index = 0;
      var here_bits, here_op, here_val;
      for (len = 0; len <= MAXBITS; len++) {
        count[len] = 0;
      }
      for (sym = 0; sym < codes; sym++) {
        count[lens[lens_index + sym]]++;
      }
      root = bits;
      for (max = MAXBITS; max >= 1; max--) {
        if (count[max] !== 0) {
          break;
        }
      }
      if (root > max) {
        root = max;
      }
      if (max === 0) {
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        opts.bits = 1;
        return 0;
      }
      for (min = 1; min < max; min++) {
        if (count[min] !== 0) {
          break;
        }
      }
      if (root < min) {
        root = min;
      }
      left = 1;
      for (len = 1; len <= MAXBITS; len++) {
        left <<= 1;
        left -= count[len];
        if (left < 0) {
          return -1;
        }
      }
      if (left > 0 && (type === CODES || max !== 1)) {
        return -1;
      }
      offs[1] = 0;
      for (len = 1; len < MAXBITS; len++) {
        offs[len + 1] = offs[len] + count[len];
      }
      for (sym = 0; sym < codes; sym++) {
        if (lens[lens_index + sym] !== 0) {
          work[offs[lens[lens_index + sym]]++] = sym;
        }
      }
      if (type === CODES) {
        base2 = extra = work;
        end = 19;
      } else if (type === LENS) {
        base2 = lbase;
        base_index -= 257;
        extra = lext;
        extra_index -= 257;
        end = 256;
      } else {
        base2 = dbase;
        extra = dext;
        end = -1;
      }
      huff = 0;
      sym = 0;
      len = min;
      next = table_index;
      curr = root;
      drop = 0;
      low = -1;
      used = 1 << root;
      mask = used - 1;
      if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
        return 1;
      }
      for (; ; ) {
        here_bits = len - drop;
        if (work[sym] < end) {
          here_op = 0;
          here_val = work[sym];
        } else if (work[sym] > end) {
          here_op = extra[extra_index + work[sym]];
          here_val = base2[base_index + work[sym]];
        } else {
          here_op = 32 + 64;
          here_val = 0;
        }
        incr = 1 << len - drop;
        fill = 1 << curr;
        min = fill;
        do {
          fill -= incr;
          table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
        } while (fill !== 0);
        incr = 1 << len - 1;
        while (huff & incr) {
          incr >>= 1;
        }
        if (incr !== 0) {
          huff &= incr - 1;
          huff += incr;
        } else {
          huff = 0;
        }
        sym++;
        if (--count[len] === 0) {
          if (len === max) {
            break;
          }
          len = lens[lens_index + work[sym]];
        }
        if (len > root && (huff & mask) !== low) {
          if (drop === 0) {
            drop = root;
          }
          next += min;
          curr = len - drop;
          left = 1 << curr;
          while (curr + drop < max) {
            left -= count[curr + drop];
            if (left <= 0) {
              break;
            }
            curr++;
            left <<= 1;
          }
          used += 1 << curr;
          if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
            return 1;
          }
          low = huff & mask;
          table[low] = root << 24 | curr << 16 | next - table_index | 0;
        }
      }
      if (huff !== 0) {
        table[next + huff] = len - drop << 24 | 64 << 16 | 0;
      }
      opts.bits = root;
      return 0;
    };
  }
});

// node_modules/pako/lib/zlib/inflate.js
var require_inflate = __commonJS({
  "node_modules/pako/lib/zlib/inflate.js"(exports2) {
    init_shims();
    "use strict";
    var utils = require_common2();
    var adler32 = require_adler32();
    var crc32 = require_crc322();
    var inflate_fast = require_inffast();
    var inflate_table = require_inftrees();
    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;
    var Z_FINISH = 4;
    var Z_BLOCK = 5;
    var Z_TREES = 6;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_NEED_DICT = 2;
    var Z_STREAM_ERROR = -2;
    var Z_DATA_ERROR = -3;
    var Z_MEM_ERROR = -4;
    var Z_BUF_ERROR = -5;
    var Z_DEFLATED = 8;
    var HEAD = 1;
    var FLAGS = 2;
    var TIME = 3;
    var OS = 4;
    var EXLEN = 5;
    var EXTRA = 6;
    var NAME2 = 7;
    var COMMENT = 8;
    var HCRC = 9;
    var DICTID = 10;
    var DICT = 11;
    var TYPE = 12;
    var TYPEDO = 13;
    var STORED = 14;
    var COPY_ = 15;
    var COPY = 16;
    var TABLE = 17;
    var LENLENS = 18;
    var CODELENS = 19;
    var LEN_ = 20;
    var LEN = 21;
    var LENEXT = 22;
    var DIST = 23;
    var DISTEXT = 24;
    var MATCH = 25;
    var LIT = 26;
    var CHECK = 27;
    var LENGTH = 28;
    var DONE = 29;
    var BAD = 30;
    var MEM = 31;
    var SYNC = 32;
    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
    var MAX_WBITS = 15;
    var DEF_WBITS = MAX_WBITS;
    function zswap32(q) {
      return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
    }
    function InflateState() {
      this.mode = 0;
      this.last = false;
      this.wrap = 0;
      this.havedict = false;
      this.flags = 0;
      this.dmax = 0;
      this.check = 0;
      this.total = 0;
      this.head = null;
      this.wbits = 0;
      this.wsize = 0;
      this.whave = 0;
      this.wnext = 0;
      this.window = null;
      this.hold = 0;
      this.bits = 0;
      this.length = 0;
      this.offset = 0;
      this.extra = 0;
      this.lencode = null;
      this.distcode = null;
      this.lenbits = 0;
      this.distbits = 0;
      this.ncode = 0;
      this.nlen = 0;
      this.ndist = 0;
      this.have = 0;
      this.next = null;
      this.lens = new utils.Buf16(320);
      this.work = new utils.Buf16(288);
      this.lendyn = null;
      this.distdyn = null;
      this.sane = 0;
      this.back = 0;
      this.was = 0;
    }
    function inflateResetKeep(strm) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      strm.total_in = strm.total_out = state.total = 0;
      strm.msg = "";
      if (state.wrap) {
        strm.adler = state.wrap & 1;
      }
      state.mode = HEAD;
      state.last = 0;
      state.havedict = 0;
      state.dmax = 32768;
      state.head = null;
      state.hold = 0;
      state.bits = 0;
      state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
      state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
      state.sane = 1;
      state.back = -1;
      return Z_OK;
    }
    function inflateReset(strm) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      state.wsize = 0;
      state.whave = 0;
      state.wnext = 0;
      return inflateResetKeep(strm);
    }
    function inflateReset2(strm, windowBits) {
      var wrap;
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else {
        wrap = (windowBits >> 4) + 1;
        if (windowBits < 48) {
          windowBits &= 15;
        }
      }
      if (windowBits && (windowBits < 8 || windowBits > 15)) {
        return Z_STREAM_ERROR;
      }
      if (state.window !== null && state.wbits !== windowBits) {
        state.window = null;
      }
      state.wrap = wrap;
      state.wbits = windowBits;
      return inflateReset(strm);
    }
    function inflateInit2(strm, windowBits) {
      var ret2;
      var state;
      if (!strm) {
        return Z_STREAM_ERROR;
      }
      state = new InflateState();
      strm.state = state;
      state.window = null;
      ret2 = inflateReset2(strm, windowBits);
      if (ret2 !== Z_OK) {
        strm.state = null;
      }
      return ret2;
    }
    function inflateInit(strm) {
      return inflateInit2(strm, DEF_WBITS);
    }
    var virgin = true;
    var lenfix;
    var distfix;
    function fixedtables(state) {
      if (virgin) {
        var sym;
        lenfix = new utils.Buf32(512);
        distfix = new utils.Buf32(32);
        sym = 0;
        while (sym < 144) {
          state.lens[sym++] = 8;
        }
        while (sym < 256) {
          state.lens[sym++] = 9;
        }
        while (sym < 280) {
          state.lens[sym++] = 7;
        }
        while (sym < 288) {
          state.lens[sym++] = 8;
        }
        inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
        sym = 0;
        while (sym < 32) {
          state.lens[sym++] = 5;
        }
        inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
        virgin = false;
      }
      state.lencode = lenfix;
      state.lenbits = 9;
      state.distcode = distfix;
      state.distbits = 5;
    }
    function updatewindow(strm, src2, end, copy) {
      var dist;
      var state = strm.state;
      if (state.window === null) {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;
        state.window = new utils.Buf8(state.wsize);
      }
      if (copy >= state.wsize) {
        utils.arraySet(state.window, src2, end - state.wsize, state.wsize, 0);
        state.wnext = 0;
        state.whave = state.wsize;
      } else {
        dist = state.wsize - state.wnext;
        if (dist > copy) {
          dist = copy;
        }
        utils.arraySet(state.window, src2, end - copy, dist, state.wnext);
        copy -= dist;
        if (copy) {
          utils.arraySet(state.window, src2, end - copy, copy, 0);
          state.wnext = copy;
          state.whave = state.wsize;
        } else {
          state.wnext += dist;
          if (state.wnext === state.wsize) {
            state.wnext = 0;
          }
          if (state.whave < state.wsize) {
            state.whave += dist;
          }
        }
      }
      return 0;
    }
    function inflate(strm, flush) {
      var state;
      var input, output;
      var next;
      var put;
      var have, left;
      var hold;
      var bits;
      var _in, _out;
      var copy;
      var from;
      var from_source;
      var here = 0;
      var here_bits, here_op, here_val;
      var last_bits, last_op, last_val;
      var len;
      var ret2;
      var hbuf = new utils.Buf8(4);
      var opts;
      var n;
      var order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
      if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (state.mode === TYPE) {
        state.mode = TYPEDO;
      }
      put = strm.next_out;
      output = strm.output;
      left = strm.avail_out;
      next = strm.next_in;
      input = strm.input;
      have = strm.avail_in;
      hold = state.hold;
      bits = state.bits;
      _in = have;
      _out = left;
      ret2 = Z_OK;
      inf_leave:
        for (; ; ) {
          switch (state.mode) {
            case HEAD:
              if (state.wrap === 0) {
                state.mode = TYPEDO;
                break;
              }
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.wrap & 2 && hold === 35615) {
                state.check = 0;
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
                hold = 0;
                bits = 0;
                state.mode = FLAGS;
                break;
              }
              state.flags = 0;
              if (state.head) {
                state.head.done = false;
              }
              if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
                strm.msg = "incorrect header check";
                state.mode = BAD;
                break;
              }
              if ((hold & 15) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD;
                break;
              }
              hold >>>= 4;
              bits -= 4;
              len = (hold & 15) + 8;
              if (state.wbits === 0) {
                state.wbits = len;
              } else if (len > state.wbits) {
                strm.msg = "invalid window size";
                state.mode = BAD;
                break;
              }
              state.dmax = 1 << len;
              strm.adler = state.check = 1;
              state.mode = hold & 512 ? DICTID : TYPE;
              hold = 0;
              bits = 0;
              break;
            case FLAGS:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.flags = hold;
              if ((state.flags & 255) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD;
                break;
              }
              if (state.flags & 57344) {
                strm.msg = "unknown header flags set";
                state.mode = BAD;
                break;
              }
              if (state.head) {
                state.head.text = hold >> 8 & 1;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = TIME;
            case TIME:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.time = hold;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                hbuf[2] = hold >>> 16 & 255;
                hbuf[3] = hold >>> 24 & 255;
                state.check = crc32(state.check, hbuf, 4, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = OS;
            case OS:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.xflags = hold & 255;
                state.head.os = hold >> 8;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = EXLEN;
            case EXLEN:
              if (state.flags & 1024) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.length = hold;
                if (state.head) {
                  state.head.extra_len = hold;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
              } else if (state.head) {
                state.head.extra = null;
              }
              state.mode = EXTRA;
            case EXTRA:
              if (state.flags & 1024) {
                copy = state.length;
                if (copy > have) {
                  copy = have;
                }
                if (copy) {
                  if (state.head) {
                    len = state.head.extra_len - state.length;
                    if (!state.head.extra) {
                      state.head.extra = new Array(state.head.extra_len);
                    }
                    utils.arraySet(state.head.extra, input, next, copy, len);
                  }
                  if (state.flags & 512) {
                    state.check = crc32(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  state.length -= copy;
                }
                if (state.length) {
                  break inf_leave;
                }
              }
              state.length = 0;
              state.mode = NAME2;
            case NAME2:
              if (state.flags & 2048) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.name += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512) {
                  state.check = crc32(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.name = null;
              }
              state.length = 0;
              state.mode = COMMENT;
            case COMMENT:
              if (state.flags & 4096) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.comment += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512) {
                  state.check = crc32(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.comment = null;
              }
              state.mode = HCRC;
            case HCRC:
              if (state.flags & 512) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (hold !== (state.check & 65535)) {
                  strm.msg = "header crc mismatch";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              if (state.head) {
                state.head.hcrc = state.flags >> 9 & 1;
                state.head.done = true;
              }
              strm.adler = state.check = 0;
              state.mode = TYPE;
              break;
            case DICTID:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              strm.adler = state.check = zswap32(hold);
              hold = 0;
              bits = 0;
              state.mode = DICT;
            case DICT:
              if (state.havedict === 0) {
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                return Z_NEED_DICT;
              }
              strm.adler = state.check = 1;
              state.mode = TYPE;
            case TYPE:
              if (flush === Z_BLOCK || flush === Z_TREES) {
                break inf_leave;
              }
            case TYPEDO:
              if (state.last) {
                hold >>>= bits & 7;
                bits -= bits & 7;
                state.mode = CHECK;
                break;
              }
              while (bits < 3) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.last = hold & 1;
              hold >>>= 1;
              bits -= 1;
              switch (hold & 3) {
                case 0:
                  state.mode = STORED;
                  break;
                case 1:
                  fixedtables(state);
                  state.mode = LEN_;
                  if (flush === Z_TREES) {
                    hold >>>= 2;
                    bits -= 2;
                    break inf_leave;
                  }
                  break;
                case 2:
                  state.mode = TABLE;
                  break;
                case 3:
                  strm.msg = "invalid block type";
                  state.mode = BAD;
              }
              hold >>>= 2;
              bits -= 2;
              break;
            case STORED:
              hold >>>= bits & 7;
              bits -= bits & 7;
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                strm.msg = "invalid stored block lengths";
                state.mode = BAD;
                break;
              }
              state.length = hold & 65535;
              hold = 0;
              bits = 0;
              state.mode = COPY_;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            case COPY_:
              state.mode = COPY;
            case COPY:
              copy = state.length;
              if (copy) {
                if (copy > have) {
                  copy = have;
                }
                if (copy > left) {
                  copy = left;
                }
                if (copy === 0) {
                  break inf_leave;
                }
                utils.arraySet(output, input, next, copy, put);
                have -= copy;
                next += copy;
                left -= copy;
                put += copy;
                state.length -= copy;
                break;
              }
              state.mode = TYPE;
              break;
            case TABLE:
              while (bits < 14) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.nlen = (hold & 31) + 257;
              hold >>>= 5;
              bits -= 5;
              state.ndist = (hold & 31) + 1;
              hold >>>= 5;
              bits -= 5;
              state.ncode = (hold & 15) + 4;
              hold >>>= 4;
              bits -= 4;
              if (state.nlen > 286 || state.ndist > 30) {
                strm.msg = "too many length or distance symbols";
                state.mode = BAD;
                break;
              }
              state.have = 0;
              state.mode = LENLENS;
            case LENLENS:
              while (state.have < state.ncode) {
                while (bits < 3) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.lens[order[state.have++]] = hold & 7;
                hold >>>= 3;
                bits -= 3;
              }
              while (state.have < 19) {
                state.lens[order[state.have++]] = 0;
              }
              state.lencode = state.lendyn;
              state.lenbits = 7;
              opts = { bits: state.lenbits };
              ret2 = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret2) {
                strm.msg = "invalid code lengths set";
                state.mode = BAD;
                break;
              }
              state.have = 0;
              state.mode = CODELENS;
            case CODELENS:
              while (state.have < state.nlen + state.ndist) {
                for (; ; ) {
                  here = state.lencode[hold & (1 << state.lenbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (here_val < 16) {
                  hold >>>= here_bits;
                  bits -= here_bits;
                  state.lens[state.have++] = here_val;
                } else {
                  if (here_val === 16) {
                    n = here_bits + 2;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    if (state.have === 0) {
                      strm.msg = "invalid bit length repeat";
                      state.mode = BAD;
                      break;
                    }
                    len = state.lens[state.have - 1];
                    copy = 3 + (hold & 3);
                    hold >>>= 2;
                    bits -= 2;
                  } else if (here_val === 17) {
                    n = here_bits + 3;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    len = 0;
                    copy = 3 + (hold & 7);
                    hold >>>= 3;
                    bits -= 3;
                  } else {
                    n = here_bits + 7;
                    while (bits < n) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    len = 0;
                    copy = 11 + (hold & 127);
                    hold >>>= 7;
                    bits -= 7;
                  }
                  if (state.have + copy > state.nlen + state.ndist) {
                    strm.msg = "invalid bit length repeat";
                    state.mode = BAD;
                    break;
                  }
                  while (copy--) {
                    state.lens[state.have++] = len;
                  }
                }
              }
              if (state.mode === BAD) {
                break;
              }
              if (state.lens[256] === 0) {
                strm.msg = "invalid code -- missing end-of-block";
                state.mode = BAD;
                break;
              }
              state.lenbits = 9;
              opts = { bits: state.lenbits };
              ret2 = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret2) {
                strm.msg = "invalid literal/lengths set";
                state.mode = BAD;
                break;
              }
              state.distbits = 6;
              state.distcode = state.distdyn;
              opts = { bits: state.distbits };
              ret2 = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
              state.distbits = opts.bits;
              if (ret2) {
                strm.msg = "invalid distances set";
                state.mode = BAD;
                break;
              }
              state.mode = LEN_;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            case LEN_:
              state.mode = LEN;
            case LEN:
              if (have >= 6 && left >= 258) {
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                inflate_fast(strm, _out);
                put = strm.next_out;
                output = strm.output;
                left = strm.avail_out;
                next = strm.next_in;
                input = strm.input;
                have = strm.avail_in;
                hold = state.hold;
                bits = state.bits;
                if (state.mode === TYPE) {
                  state.back = -1;
                }
                break;
              }
              state.back = 0;
              for (; ; ) {
                here = state.lencode[hold & (1 << state.lenbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (here_op && (here_op & 240) === 0) {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (; ; ) {
                  here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= last_bits;
                bits -= last_bits;
                state.back += last_bits;
              }
              hold >>>= here_bits;
              bits -= here_bits;
              state.back += here_bits;
              state.length = here_val;
              if (here_op === 0) {
                state.mode = LIT;
                break;
              }
              if (here_op & 32) {
                state.back = -1;
                state.mode = TYPE;
                break;
              }
              if (here_op & 64) {
                strm.msg = "invalid literal/length code";
                state.mode = BAD;
                break;
              }
              state.extra = here_op & 15;
              state.mode = LENEXT;
            case LENEXT:
              if (state.extra) {
                n = state.extra;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.length += hold & (1 << state.extra) - 1;
                hold >>>= state.extra;
                bits -= state.extra;
                state.back += state.extra;
              }
              state.was = state.length;
              state.mode = DIST;
            case DIST:
              for (; ; ) {
                here = state.distcode[hold & (1 << state.distbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if ((here_op & 240) === 0) {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (; ; ) {
                  here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= last_bits;
                bits -= last_bits;
                state.back += last_bits;
              }
              hold >>>= here_bits;
              bits -= here_bits;
              state.back += here_bits;
              if (here_op & 64) {
                strm.msg = "invalid distance code";
                state.mode = BAD;
                break;
              }
              state.offset = here_val;
              state.extra = here_op & 15;
              state.mode = DISTEXT;
            case DISTEXT:
              if (state.extra) {
                n = state.extra;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.offset += hold & (1 << state.extra) - 1;
                hold >>>= state.extra;
                bits -= state.extra;
                state.back += state.extra;
              }
              if (state.offset > state.dmax) {
                strm.msg = "invalid distance too far back";
                state.mode = BAD;
                break;
              }
              state.mode = MATCH;
            case MATCH:
              if (left === 0) {
                break inf_leave;
              }
              copy = _out - left;
              if (state.offset > copy) {
                copy = state.offset - copy;
                if (copy > state.whave) {
                  if (state.sane) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD;
                    break;
                  }
                }
                if (copy > state.wnext) {
                  copy -= state.wnext;
                  from = state.wsize - copy;
                } else {
                  from = state.wnext - copy;
                }
                if (copy > state.length) {
                  copy = state.length;
                }
                from_source = state.window;
              } else {
                from_source = output;
                from = put - state.offset;
                copy = state.length;
              }
              if (copy > left) {
                copy = left;
              }
              left -= copy;
              state.length -= copy;
              do {
                output[put++] = from_source[from++];
              } while (--copy);
              if (state.length === 0) {
                state.mode = LEN;
              }
              break;
            case LIT:
              if (left === 0) {
                break inf_leave;
              }
              output[put++] = state.length;
              left--;
              state.mode = LEN;
              break;
            case CHECK:
              if (state.wrap) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold |= input[next++] << bits;
                  bits += 8;
                }
                _out -= left;
                strm.total_out += _out;
                state.total += _out;
                if (_out) {
                  strm.adler = state.check = state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
                }
                _out = left;
                if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                  strm.msg = "incorrect data check";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = LENGTH;
            case LENGTH:
              if (state.wrap && state.flags) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (hold !== (state.total & 4294967295)) {
                  strm.msg = "incorrect length check";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = DONE;
            case DONE:
              ret2 = Z_STREAM_END;
              break inf_leave;
            case BAD:
              ret2 = Z_DATA_ERROR;
              break inf_leave;
            case MEM:
              return Z_MEM_ERROR;
            case SYNC:
            default:
              return Z_STREAM_ERROR;
          }
        }
      strm.next_out = put;
      strm.avail_out = left;
      strm.next_in = next;
      strm.avail_in = have;
      state.hold = hold;
      state.bits = bits;
      if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
        if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
          state.mode = MEM;
          return Z_MEM_ERROR;
        }
      }
      _in -= strm.avail_in;
      _out -= strm.avail_out;
      strm.total_in += _in;
      strm.total_out += _out;
      state.total += _out;
      if (state.wrap && _out) {
        strm.adler = state.check = state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
      }
      strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
      if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret2 === Z_OK) {
        ret2 = Z_BUF_ERROR;
      }
      return ret2;
    }
    function inflateEnd(strm) {
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      var state = strm.state;
      if (state.window) {
        state.window = null;
      }
      strm.state = null;
      return Z_OK;
    }
    function inflateGetHeader(strm, head) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if ((state.wrap & 2) === 0) {
        return Z_STREAM_ERROR;
      }
      state.head = head;
      head.done = false;
      return Z_OK;
    }
    function inflateSetDictionary(strm, dictionary) {
      var dictLength = dictionary.length;
      var state;
      var dictid;
      var ret2;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (state.wrap !== 0 && state.mode !== DICT) {
        return Z_STREAM_ERROR;
      }
      if (state.mode === DICT) {
        dictid = 1;
        dictid = adler32(dictid, dictionary, dictLength, 0);
        if (dictid !== state.check) {
          return Z_DATA_ERROR;
        }
      }
      ret2 = updatewindow(strm, dictionary, dictLength, dictLength);
      if (ret2) {
        state.mode = MEM;
        return Z_MEM_ERROR;
      }
      state.havedict = 1;
      return Z_OK;
    }
    exports2.inflateReset = inflateReset;
    exports2.inflateReset2 = inflateReset2;
    exports2.inflateResetKeep = inflateResetKeep;
    exports2.inflateInit = inflateInit;
    exports2.inflateInit2 = inflateInit2;
    exports2.inflate = inflate;
    exports2.inflateEnd = inflateEnd;
    exports2.inflateGetHeader = inflateGetHeader;
    exports2.inflateSetDictionary = inflateSetDictionary;
    exports2.inflateInfo = "pako inflate (from Nodeca project)";
  }
});

// node_modules/pako/lib/zlib/constants.js
var require_constants = __commonJS({
  "node_modules/pako/lib/zlib/constants.js"(exports2, module2) {
    init_shims();
    "use strict";
    module2.exports = {
      Z_NO_FLUSH: 0,
      Z_PARTIAL_FLUSH: 1,
      Z_SYNC_FLUSH: 2,
      Z_FULL_FLUSH: 3,
      Z_FINISH: 4,
      Z_BLOCK: 5,
      Z_TREES: 6,
      Z_OK: 0,
      Z_STREAM_END: 1,
      Z_NEED_DICT: 2,
      Z_ERRNO: -1,
      Z_STREAM_ERROR: -2,
      Z_DATA_ERROR: -3,
      Z_BUF_ERROR: -5,
      Z_NO_COMPRESSION: 0,
      Z_BEST_SPEED: 1,
      Z_BEST_COMPRESSION: 9,
      Z_DEFAULT_COMPRESSION: -1,
      Z_FILTERED: 1,
      Z_HUFFMAN_ONLY: 2,
      Z_RLE: 3,
      Z_FIXED: 4,
      Z_DEFAULT_STRATEGY: 0,
      Z_BINARY: 0,
      Z_TEXT: 1,
      Z_UNKNOWN: 2,
      Z_DEFLATED: 8
    };
  }
});

// node_modules/pako/lib/zlib/gzheader.js
var require_gzheader = __commonJS({
  "node_modules/pako/lib/zlib/gzheader.js"(exports2, module2) {
    init_shims();
    "use strict";
    function GZheader() {
      this.text = 0;
      this.time = 0;
      this.xflags = 0;
      this.os = 0;
      this.extra = null;
      this.extra_len = 0;
      this.name = "";
      this.comment = "";
      this.hcrc = 0;
      this.done = false;
    }
    module2.exports = GZheader;
  }
});

// node_modules/pako/lib/inflate.js
var require_inflate2 = __commonJS({
  "node_modules/pako/lib/inflate.js"(exports2) {
    init_shims();
    "use strict";
    var zlib_inflate = require_inflate();
    var utils = require_common2();
    var strings = require_strings();
    var c = require_constants();
    var msg = require_messages();
    var ZStream = require_zstream();
    var GZheader = require_gzheader();
    var toString = Object.prototype.toString;
    function Inflate(options2) {
      if (!(this instanceof Inflate))
        return new Inflate(options2);
      this.options = utils.assign({
        chunkSize: 16384,
        windowBits: 0,
        to: ""
      }, options2 || {});
      var opt = this.options;
      if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
        opt.windowBits = -opt.windowBits;
        if (opt.windowBits === 0) {
          opt.windowBits = -15;
        }
      }
      if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options2 && options2.windowBits)) {
        opt.windowBits += 32;
      }
      if (opt.windowBits > 15 && opt.windowBits < 48) {
        if ((opt.windowBits & 15) === 0) {
          opt.windowBits |= 15;
        }
      }
      this.err = 0;
      this.msg = "";
      this.ended = false;
      this.chunks = [];
      this.strm = new ZStream();
      this.strm.avail_out = 0;
      var status = zlib_inflate.inflateInit2(this.strm, opt.windowBits);
      if (status !== c.Z_OK) {
        throw new Error(msg[status]);
      }
      this.header = new GZheader();
      zlib_inflate.inflateGetHeader(this.strm, this.header);
      if (opt.dictionary) {
        if (typeof opt.dictionary === "string") {
          opt.dictionary = strings.string2buf(opt.dictionary);
        } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
          opt.dictionary = new Uint8Array(opt.dictionary);
        }
        if (opt.raw) {
          status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
          if (status !== c.Z_OK) {
            throw new Error(msg[status]);
          }
        }
      }
    }
    Inflate.prototype.push = function(data, mode) {
      var strm = this.strm;
      var chunkSize = this.options.chunkSize;
      var dictionary = this.options.dictionary;
      var status, _mode;
      var next_out_utf8, tail, utf8str;
      var allowBufError = false;
      if (this.ended) {
        return false;
      }
      _mode = mode === ~~mode ? mode : mode === true ? c.Z_FINISH : c.Z_NO_FLUSH;
      if (typeof data === "string") {
        strm.input = strings.binstring2buf(data);
      } else if (toString.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      do {
        if (strm.avail_out === 0) {
          strm.output = new utils.Buf8(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);
        if (status === c.Z_NEED_DICT && dictionary) {
          status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
        }
        if (status === c.Z_BUF_ERROR && allowBufError === true) {
          status = c.Z_OK;
          allowBufError = false;
        }
        if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
          this.onEnd(status);
          this.ended = true;
          return false;
        }
        if (strm.next_out) {
          if (strm.avail_out === 0 || status === c.Z_STREAM_END || strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) {
            if (this.options.to === "string") {
              next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
              tail = strm.next_out - next_out_utf8;
              utf8str = strings.buf2string(strm.output, next_out_utf8);
              strm.next_out = tail;
              strm.avail_out = chunkSize - tail;
              if (tail) {
                utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
              }
              this.onData(utf8str);
            } else {
              this.onData(utils.shrinkBuf(strm.output, strm.next_out));
            }
          }
        }
        if (strm.avail_in === 0 && strm.avail_out === 0) {
          allowBufError = true;
        }
      } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
      if (status === c.Z_STREAM_END) {
        _mode = c.Z_FINISH;
      }
      if (_mode === c.Z_FINISH) {
        status = zlib_inflate.inflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === c.Z_OK;
      }
      if (_mode === c.Z_SYNC_FLUSH) {
        this.onEnd(c.Z_OK);
        strm.avail_out = 0;
        return true;
      }
      return true;
    };
    Inflate.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Inflate.prototype.onEnd = function(status) {
      if (status === c.Z_OK) {
        if (this.options.to === "string") {
          this.result = this.chunks.join("");
        } else {
          this.result = utils.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    function inflate(input, options2) {
      var inflator = new Inflate(options2);
      inflator.push(input, true);
      if (inflator.err) {
        throw inflator.msg || msg[inflator.err];
      }
      return inflator.result;
    }
    function inflateRaw(input, options2) {
      options2 = options2 || {};
      options2.raw = true;
      return inflate(input, options2);
    }
    exports2.Inflate = Inflate;
    exports2.inflate = inflate;
    exports2.inflateRaw = inflateRaw;
    exports2.ungzip = inflate;
  }
});

// node_modules/pako/index.js
var require_pako = __commonJS({
  "node_modules/pako/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    var assign2 = require_common2().assign;
    var deflate = require_deflate2();
    var inflate = require_inflate2();
    var constants = require_constants();
    var pako = {};
    assign2(pako, deflate, inflate, constants);
    module2.exports = pako;
  }
});

// node_modules/jszip/lib/flate.js
var require_flate = __commonJS({
  "node_modules/jszip/lib/flate.js"(exports2) {
    init_shims();
    "use strict";
    var USE_TYPEDARRAY = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Uint32Array !== "undefined";
    var pako = require_pako();
    var utils = require_utils2();
    var GenericWorker = require_GenericWorker();
    var ARRAY_TYPE = USE_TYPEDARRAY ? "uint8array" : "array";
    exports2.magic = "\b\0";
    function FlateWorker(action, options2) {
      GenericWorker.call(this, "FlateWorker/" + action);
      this._pako = null;
      this._pakoAction = action;
      this._pakoOptions = options2;
      this.meta = {};
    }
    utils.inherits(FlateWorker, GenericWorker);
    FlateWorker.prototype.processChunk = function(chunk) {
      this.meta = chunk.meta;
      if (this._pako === null) {
        this._createPako();
      }
      this._pako.push(utils.transformTo(ARRAY_TYPE, chunk.data), false);
    };
    FlateWorker.prototype.flush = function() {
      GenericWorker.prototype.flush.call(this);
      if (this._pako === null) {
        this._createPako();
      }
      this._pako.push([], true);
    };
    FlateWorker.prototype.cleanUp = function() {
      GenericWorker.prototype.cleanUp.call(this);
      this._pako = null;
    };
    FlateWorker.prototype._createPako = function() {
      this._pako = new pako[this._pakoAction]({
        raw: true,
        level: this._pakoOptions.level || -1
      });
      var self2 = this;
      this._pako.onData = function(data) {
        self2.push({
          data,
          meta: self2.meta
        });
      };
    };
    exports2.compressWorker = function(compressionOptions) {
      return new FlateWorker("Deflate", compressionOptions);
    };
    exports2.uncompressWorker = function() {
      return new FlateWorker("Inflate", {});
    };
  }
});

// node_modules/jszip/lib/compressions.js
var require_compressions = __commonJS({
  "node_modules/jszip/lib/compressions.js"(exports2) {
    init_shims();
    "use strict";
    var GenericWorker = require_GenericWorker();
    exports2.STORE = {
      magic: "\0\0",
      compressWorker: function(compressionOptions) {
        return new GenericWorker("STORE compression");
      },
      uncompressWorker: function() {
        return new GenericWorker("STORE decompression");
      }
    };
    exports2.DEFLATE = require_flate();
  }
});

// node_modules/jszip/lib/signature.js
var require_signature = __commonJS({
  "node_modules/jszip/lib/signature.js"(exports2) {
    init_shims();
    "use strict";
    exports2.LOCAL_FILE_HEADER = "PK";
    exports2.CENTRAL_FILE_HEADER = "PK";
    exports2.CENTRAL_DIRECTORY_END = "PK";
    exports2.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07";
    exports2.ZIP64_CENTRAL_DIRECTORY_END = "PK";
    exports2.DATA_DESCRIPTOR = "PK\x07\b";
  }
});

// node_modules/jszip/lib/generate/ZipFileWorker.js
var require_ZipFileWorker = __commonJS({
  "node_modules/jszip/lib/generate/ZipFileWorker.js"(exports2, module2) {
    init_shims();
    "use strict";
    var utils = require_utils2();
    var GenericWorker = require_GenericWorker();
    var utf8 = require_utf8();
    var crc32 = require_crc32();
    var signature = require_signature();
    var decToHex = function(dec, bytes) {
      var hex = "", i;
      for (i = 0; i < bytes; i++) {
        hex += String.fromCharCode(dec & 255);
        dec = dec >>> 8;
      }
      return hex;
    };
    var generateUnixExternalFileAttr = function(unixPermissions, isDir) {
      var result = unixPermissions;
      if (!unixPermissions) {
        result = isDir ? 16893 : 33204;
      }
      return (result & 65535) << 16;
    };
    var generateDosExternalFileAttr = function(dosPermissions, isDir) {
      return (dosPermissions || 0) & 63;
    };
    var generateZipParts = function(streamInfo, streamedContent, streamingEnded, offset, platform, encodeFileName) {
      var file = streamInfo["file"], compression = streamInfo["compression"], useCustomEncoding = encodeFileName !== utf8.utf8encode, encodedFileName = utils.transformTo("string", encodeFileName(file.name)), utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)), comment = file.comment, encodedComment = utils.transformTo("string", encodeFileName(comment)), utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)), useUTF8ForFileName = utfEncodedFileName.length !== file.name.length, useUTF8ForComment = utfEncodedComment.length !== comment.length, dosTime, dosDate, extraFields = "", unicodePathExtraField = "", unicodeCommentExtraField = "", dir = file.dir, date = file.date;
      var dataInfo = {
        crc32: 0,
        compressedSize: 0,
        uncompressedSize: 0
      };
      if (!streamedContent || streamingEnded) {
        dataInfo.crc32 = streamInfo["crc32"];
        dataInfo.compressedSize = streamInfo["compressedSize"];
        dataInfo.uncompressedSize = streamInfo["uncompressedSize"];
      }
      var bitflag = 0;
      if (streamedContent) {
        bitflag |= 8;
      }
      if (!useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment)) {
        bitflag |= 2048;
      }
      var extFileAttr = 0;
      var versionMadeBy = 0;
      if (dir) {
        extFileAttr |= 16;
      }
      if (platform === "UNIX") {
        versionMadeBy = 798;
        extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
      } else {
        versionMadeBy = 20;
        extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
      }
      dosTime = date.getUTCHours();
      dosTime = dosTime << 6;
      dosTime = dosTime | date.getUTCMinutes();
      dosTime = dosTime << 5;
      dosTime = dosTime | date.getUTCSeconds() / 2;
      dosDate = date.getUTCFullYear() - 1980;
      dosDate = dosDate << 4;
      dosDate = dosDate | date.getUTCMonth() + 1;
      dosDate = dosDate << 5;
      dosDate = dosDate | date.getUTCDate();
      if (useUTF8ForFileName) {
        unicodePathExtraField = decToHex(1, 1) + decToHex(crc32(encodedFileName), 4) + utfEncodedFileName;
        extraFields += "up" + decToHex(unicodePathExtraField.length, 2) + unicodePathExtraField;
      }
      if (useUTF8ForComment) {
        unicodeCommentExtraField = decToHex(1, 1) + decToHex(crc32(encodedComment), 4) + utfEncodedComment;
        extraFields += "uc" + decToHex(unicodeCommentExtraField.length, 2) + unicodeCommentExtraField;
      }
      var header = "";
      header += "\n\0";
      header += decToHex(bitflag, 2);
      header += compression.magic;
      header += decToHex(dosTime, 2);
      header += decToHex(dosDate, 2);
      header += decToHex(dataInfo.crc32, 4);
      header += decToHex(dataInfo.compressedSize, 4);
      header += decToHex(dataInfo.uncompressedSize, 4);
      header += decToHex(encodedFileName.length, 2);
      header += decToHex(extraFields.length, 2);
      var fileRecord = signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields;
      var dirRecord = signature.CENTRAL_FILE_HEADER + decToHex(versionMadeBy, 2) + header + decToHex(encodedComment.length, 2) + "\0\0\0\0" + decToHex(extFileAttr, 4) + decToHex(offset, 4) + encodedFileName + extraFields + encodedComment;
      return {
        fileRecord,
        dirRecord
      };
    };
    var generateCentralDirectoryEnd = function(entriesCount, centralDirLength, localDirLength, comment, encodeFileName) {
      var dirEnd = "";
      var encodedComment = utils.transformTo("string", encodeFileName(comment));
      dirEnd = signature.CENTRAL_DIRECTORY_END + "\0\0\0\0" + decToHex(entriesCount, 2) + decToHex(entriesCount, 2) + decToHex(centralDirLength, 4) + decToHex(localDirLength, 4) + decToHex(encodedComment.length, 2) + encodedComment;
      return dirEnd;
    };
    var generateDataDescriptors = function(streamInfo) {
      var descriptor = "";
      descriptor = signature.DATA_DESCRIPTOR + decToHex(streamInfo["crc32"], 4) + decToHex(streamInfo["compressedSize"], 4) + decToHex(streamInfo["uncompressedSize"], 4);
      return descriptor;
    };
    function ZipFileWorker(streamFiles, comment, platform, encodeFileName) {
      GenericWorker.call(this, "ZipFileWorker");
      this.bytesWritten = 0;
      this.zipComment = comment;
      this.zipPlatform = platform;
      this.encodeFileName = encodeFileName;
      this.streamFiles = streamFiles;
      this.accumulate = false;
      this.contentBuffer = [];
      this.dirRecords = [];
      this.currentSourceOffset = 0;
      this.entriesCount = 0;
      this.currentFile = null;
      this._sources = [];
    }
    utils.inherits(ZipFileWorker, GenericWorker);
    ZipFileWorker.prototype.push = function(chunk) {
      var currentFilePercent = chunk.meta.percent || 0;
      var entriesCount = this.entriesCount;
      var remainingFiles = this._sources.length;
      if (this.accumulate) {
        this.contentBuffer.push(chunk);
      } else {
        this.bytesWritten += chunk.data.length;
        GenericWorker.prototype.push.call(this, {
          data: chunk.data,
          meta: {
            currentFile: this.currentFile,
            percent: entriesCount ? (currentFilePercent + 100 * (entriesCount - remainingFiles - 1)) / entriesCount : 100
          }
        });
      }
    };
    ZipFileWorker.prototype.openedSource = function(streamInfo) {
      this.currentSourceOffset = this.bytesWritten;
      this.currentFile = streamInfo["file"].name;
      var streamedContent = this.streamFiles && !streamInfo["file"].dir;
      if (streamedContent) {
        var record = generateZipParts(streamInfo, streamedContent, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
        this.push({
          data: record.fileRecord,
          meta: { percent: 0 }
        });
      } else {
        this.accumulate = true;
      }
    };
    ZipFileWorker.prototype.closedSource = function(streamInfo) {
      this.accumulate = false;
      var streamedContent = this.streamFiles && !streamInfo["file"].dir;
      var record = generateZipParts(streamInfo, streamedContent, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
      this.dirRecords.push(record.dirRecord);
      if (streamedContent) {
        this.push({
          data: generateDataDescriptors(streamInfo),
          meta: { percent: 100 }
        });
      } else {
        this.push({
          data: record.fileRecord,
          meta: { percent: 0 }
        });
        while (this.contentBuffer.length) {
          this.push(this.contentBuffer.shift());
        }
      }
      this.currentFile = null;
    };
    ZipFileWorker.prototype.flush = function() {
      var localDirLength = this.bytesWritten;
      for (var i = 0; i < this.dirRecords.length; i++) {
        this.push({
          data: this.dirRecords[i],
          meta: { percent: 100 }
        });
      }
      var centralDirLength = this.bytesWritten - localDirLength;
      var dirEnd = generateCentralDirectoryEnd(this.dirRecords.length, centralDirLength, localDirLength, this.zipComment, this.encodeFileName);
      this.push({
        data: dirEnd,
        meta: { percent: 100 }
      });
    };
    ZipFileWorker.prototype.prepareNextSource = function() {
      this.previous = this._sources.shift();
      this.openedSource(this.previous.streamInfo);
      if (this.isPaused) {
        this.previous.pause();
      } else {
        this.previous.resume();
      }
    };
    ZipFileWorker.prototype.registerPrevious = function(previous) {
      this._sources.push(previous);
      var self2 = this;
      previous.on("data", function(chunk) {
        self2.processChunk(chunk);
      });
      previous.on("end", function() {
        self2.closedSource(self2.previous.streamInfo);
        if (self2._sources.length) {
          self2.prepareNextSource();
        } else {
          self2.end();
        }
      });
      previous.on("error", function(e) {
        self2.error(e);
      });
      return this;
    };
    ZipFileWorker.prototype.resume = function() {
      if (!GenericWorker.prototype.resume.call(this)) {
        return false;
      }
      if (!this.previous && this._sources.length) {
        this.prepareNextSource();
        return true;
      }
      if (!this.previous && !this._sources.length && !this.generatedError) {
        this.end();
        return true;
      }
    };
    ZipFileWorker.prototype.error = function(e) {
      var sources = this._sources;
      if (!GenericWorker.prototype.error.call(this, e)) {
        return false;
      }
      for (var i = 0; i < sources.length; i++) {
        try {
          sources[i].error(e);
        } catch (e2) {
        }
      }
      return true;
    };
    ZipFileWorker.prototype.lock = function() {
      GenericWorker.prototype.lock.call(this);
      var sources = this._sources;
      for (var i = 0; i < sources.length; i++) {
        sources[i].lock();
      }
    };
    module2.exports = ZipFileWorker;
  }
});

// node_modules/jszip/lib/generate/index.js
var require_generate = __commonJS({
  "node_modules/jszip/lib/generate/index.js"(exports2) {
    init_shims();
    "use strict";
    var compressions = require_compressions();
    var ZipFileWorker = require_ZipFileWorker();
    var getCompression = function(fileCompression, zipCompression) {
      var compressionName = fileCompression || zipCompression;
      var compression = compressions[compressionName];
      if (!compression) {
        throw new Error(compressionName + " is not a valid compression method !");
      }
      return compression;
    };
    exports2.generateWorker = function(zip, options2, comment) {
      var zipFileWorker = new ZipFileWorker(options2.streamFiles, comment, options2.platform, options2.encodeFileName);
      var entriesCount = 0;
      try {
        zip.forEach(function(relativePath, file) {
          entriesCount++;
          var compression = getCompression(file.options.compression, options2.compression);
          var compressionOptions = file.options.compressionOptions || options2.compressionOptions || {};
          var dir = file.dir, date = file.date;
          file._compressWorker(compression, compressionOptions).withStreamInfo("file", {
            name: relativePath,
            dir,
            date,
            comment: file.comment || "",
            unixPermissions: file.unixPermissions,
            dosPermissions: file.dosPermissions
          }).pipe(zipFileWorker);
        });
        zipFileWorker.entriesCount = entriesCount;
      } catch (e) {
        zipFileWorker.error(e);
      }
      return zipFileWorker;
    };
  }
});

// node_modules/jszip/lib/nodejs/NodejsStreamInputAdapter.js
var require_NodejsStreamInputAdapter = __commonJS({
  "node_modules/jszip/lib/nodejs/NodejsStreamInputAdapter.js"(exports2, module2) {
    init_shims();
    "use strict";
    var utils = require_utils2();
    var GenericWorker = require_GenericWorker();
    function NodejsStreamInputAdapter(filename, stream) {
      GenericWorker.call(this, "Nodejs stream input adapter for " + filename);
      this._upstreamEnded = false;
      this._bindStream(stream);
    }
    utils.inherits(NodejsStreamInputAdapter, GenericWorker);
    NodejsStreamInputAdapter.prototype._bindStream = function(stream) {
      var self2 = this;
      this._stream = stream;
      stream.pause();
      stream.on("data", function(chunk) {
        self2.push({
          data: chunk,
          meta: {
            percent: 0
          }
        });
      }).on("error", function(e) {
        if (self2.isPaused) {
          this.generatedError = e;
        } else {
          self2.error(e);
        }
      }).on("end", function() {
        if (self2.isPaused) {
          self2._upstreamEnded = true;
        } else {
          self2.end();
        }
      });
    };
    NodejsStreamInputAdapter.prototype.pause = function() {
      if (!GenericWorker.prototype.pause.call(this)) {
        return false;
      }
      this._stream.pause();
      return true;
    };
    NodejsStreamInputAdapter.prototype.resume = function() {
      if (!GenericWorker.prototype.resume.call(this)) {
        return false;
      }
      if (this._upstreamEnded) {
        this.end();
      } else {
        this._stream.resume();
      }
      return true;
    };
    module2.exports = NodejsStreamInputAdapter;
  }
});

// node_modules/jszip/lib/object.js
var require_object = __commonJS({
  "node_modules/jszip/lib/object.js"(exports2, module2) {
    init_shims();
    "use strict";
    var utf8 = require_utf8();
    var utils = require_utils2();
    var GenericWorker = require_GenericWorker();
    var StreamHelper = require_StreamHelper();
    var defaults2 = require_defaults3();
    var CompressedObject = require_compressedObject();
    var ZipObject = require_zipObject();
    var generate = require_generate();
    var nodejsUtils = require_nodejsUtils();
    var NodejsStreamInputAdapter = require_NodejsStreamInputAdapter();
    var fileAdd = function(name, data, originalOptions) {
      var dataType = utils.getTypeOf(data), parent;
      var o = utils.extend(originalOptions || {}, defaults2);
      o.date = o.date || new Date();
      if (o.compression !== null) {
        o.compression = o.compression.toUpperCase();
      }
      if (typeof o.unixPermissions === "string") {
        o.unixPermissions = parseInt(o.unixPermissions, 8);
      }
      if (o.unixPermissions && o.unixPermissions & 16384) {
        o.dir = true;
      }
      if (o.dosPermissions && o.dosPermissions & 16) {
        o.dir = true;
      }
      if (o.dir) {
        name = forceTrailingSlash(name);
      }
      if (o.createFolders && (parent = parentFolder(name))) {
        folderAdd.call(this, parent, true);
      }
      var isUnicodeString = dataType === "string" && o.binary === false && o.base64 === false;
      if (!originalOptions || typeof originalOptions.binary === "undefined") {
        o.binary = !isUnicodeString;
      }
      var isCompressedEmpty = data instanceof CompressedObject && data.uncompressedSize === 0;
      if (isCompressedEmpty || o.dir || !data || data.length === 0) {
        o.base64 = false;
        o.binary = true;
        data = "";
        o.compression = "STORE";
        dataType = "string";
      }
      var zipObjectContent = null;
      if (data instanceof CompressedObject || data instanceof GenericWorker) {
        zipObjectContent = data;
      } else if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
        zipObjectContent = new NodejsStreamInputAdapter(name, data);
      } else {
        zipObjectContent = utils.prepareContent(name, data, o.binary, o.optimizedBinaryString, o.base64);
      }
      var object = new ZipObject(name, zipObjectContent, o);
      this.files[name] = object;
    };
    var parentFolder = function(path2) {
      if (path2.slice(-1) === "/") {
        path2 = path2.substring(0, path2.length - 1);
      }
      var lastSlash = path2.lastIndexOf("/");
      return lastSlash > 0 ? path2.substring(0, lastSlash) : "";
    };
    var forceTrailingSlash = function(path2) {
      if (path2.slice(-1) !== "/") {
        path2 += "/";
      }
      return path2;
    };
    var folderAdd = function(name, createFolders) {
      createFolders = typeof createFolders !== "undefined" ? createFolders : defaults2.createFolders;
      name = forceTrailingSlash(name);
      if (!this.files[name]) {
        fileAdd.call(this, name, null, {
          dir: true,
          createFolders
        });
      }
      return this.files[name];
    };
    function isRegExp(object) {
      return Object.prototype.toString.call(object) === "[object RegExp]";
    }
    var out = {
      load: function() {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
      },
      forEach: function(cb) {
        var filename, relativePath, file;
        for (filename in this.files) {
          file = this.files[filename];
          relativePath = filename.slice(this.root.length, filename.length);
          if (relativePath && filename.slice(0, this.root.length) === this.root) {
            cb(relativePath, file);
          }
        }
      },
      filter: function(search) {
        var result = [];
        this.forEach(function(relativePath, entry) {
          if (search(relativePath, entry)) {
            result.push(entry);
          }
        });
        return result;
      },
      file: function(name, data, o) {
        if (arguments.length === 1) {
          if (isRegExp(name)) {
            var regexp = name;
            return this.filter(function(relativePath, file) {
              return !file.dir && regexp.test(relativePath);
            });
          } else {
            var obj = this.files[this.root + name];
            if (obj && !obj.dir) {
              return obj;
            } else {
              return null;
            }
          }
        } else {
          name = this.root + name;
          fileAdd.call(this, name, data, o);
        }
        return this;
      },
      folder: function(arg) {
        if (!arg) {
          return this;
        }
        if (isRegExp(arg)) {
          return this.filter(function(relativePath, file) {
            return file.dir && arg.test(relativePath);
          });
        }
        var name = this.root + arg;
        var newFolder = folderAdd.call(this, name);
        var ret2 = this.clone();
        ret2.root = newFolder.name;
        return ret2;
      },
      remove: function(name) {
        name = this.root + name;
        var file = this.files[name];
        if (!file) {
          if (name.slice(-1) !== "/") {
            name += "/";
          }
          file = this.files[name];
        }
        if (file && !file.dir) {
          delete this.files[name];
        } else {
          var kids = this.filter(function(relativePath, file2) {
            return file2.name.slice(0, name.length) === name;
          });
          for (var i = 0; i < kids.length; i++) {
            delete this.files[kids[i].name];
          }
        }
        return this;
      },
      generate: function(options2) {
        throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
      },
      generateInternalStream: function(options2) {
        var worker, opts = {};
        try {
          opts = utils.extend(options2 || {}, {
            streamFiles: false,
            compression: "STORE",
            compressionOptions: null,
            type: "",
            platform: "DOS",
            comment: null,
            mimeType: "application/zip",
            encodeFileName: utf8.utf8encode
          });
          opts.type = opts.type.toLowerCase();
          opts.compression = opts.compression.toUpperCase();
          if (opts.type === "binarystring") {
            opts.type = "string";
          }
          if (!opts.type) {
            throw new Error("No output type specified.");
          }
          utils.checkSupport(opts.type);
          if (opts.platform === "darwin" || opts.platform === "freebsd" || opts.platform === "linux" || opts.platform === "sunos") {
            opts.platform = "UNIX";
          }
          if (opts.platform === "win32") {
            opts.platform = "DOS";
          }
          var comment = opts.comment || this.comment || "";
          worker = generate.generateWorker(this, opts, comment);
        } catch (e) {
          worker = new GenericWorker("error");
          worker.error(e);
        }
        return new StreamHelper(worker, opts.type || "string", opts.mimeType);
      },
      generateAsync: function(options2, onUpdate) {
        return this.generateInternalStream(options2).accumulate(onUpdate);
      },
      generateNodeStream: function(options2, onUpdate) {
        options2 = options2 || {};
        if (!options2.type) {
          options2.type = "nodebuffer";
        }
        return this.generateInternalStream(options2).toNodejsStream(onUpdate);
      }
    };
    module2.exports = out;
  }
});

// node_modules/jszip/lib/reader/DataReader.js
var require_DataReader = __commonJS({
  "node_modules/jszip/lib/reader/DataReader.js"(exports2, module2) {
    init_shims();
    "use strict";
    var utils = require_utils2();
    function DataReader(data) {
      this.data = data;
      this.length = data.length;
      this.index = 0;
      this.zero = 0;
    }
    DataReader.prototype = {
      checkOffset: function(offset) {
        this.checkIndex(this.index + offset);
      },
      checkIndex: function(newIndex) {
        if (this.length < this.zero + newIndex || newIndex < 0) {
          throw new Error("End of data reached (data length = " + this.length + ", asked index = " + newIndex + "). Corrupted zip ?");
        }
      },
      setIndex: function(newIndex) {
        this.checkIndex(newIndex);
        this.index = newIndex;
      },
      skip: function(n) {
        this.setIndex(this.index + n);
      },
      byteAt: function(i) {
      },
      readInt: function(size) {
        var result = 0, i;
        this.checkOffset(size);
        for (i = this.index + size - 1; i >= this.index; i--) {
          result = (result << 8) + this.byteAt(i);
        }
        this.index += size;
        return result;
      },
      readString: function(size) {
        return utils.transformTo("string", this.readData(size));
      },
      readData: function(size) {
      },
      lastIndexOfSignature: function(sig) {
      },
      readAndCheckSignature: function(sig) {
      },
      readDate: function() {
        var dostime = this.readInt(4);
        return new Date(Date.UTC((dostime >> 25 & 127) + 1980, (dostime >> 21 & 15) - 1, dostime >> 16 & 31, dostime >> 11 & 31, dostime >> 5 & 63, (dostime & 31) << 1));
      }
    };
    module2.exports = DataReader;
  }
});

// node_modules/jszip/lib/reader/ArrayReader.js
var require_ArrayReader = __commonJS({
  "node_modules/jszip/lib/reader/ArrayReader.js"(exports2, module2) {
    init_shims();
    "use strict";
    var DataReader = require_DataReader();
    var utils = require_utils2();
    function ArrayReader(data) {
      DataReader.call(this, data);
      for (var i = 0; i < this.data.length; i++) {
        data[i] = data[i] & 255;
      }
    }
    utils.inherits(ArrayReader, DataReader);
    ArrayReader.prototype.byteAt = function(i) {
      return this.data[this.zero + i];
    };
    ArrayReader.prototype.lastIndexOfSignature = function(sig) {
      var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3);
      for (var i = this.length - 4; i >= 0; --i) {
        if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
          return i - this.zero;
        }
      }
      return -1;
    };
    ArrayReader.prototype.readAndCheckSignature = function(sig) {
      var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3), data = this.readData(4);
      return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
    };
    ArrayReader.prototype.readData = function(size) {
      this.checkOffset(size);
      if (size === 0) {
        return [];
      }
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module2.exports = ArrayReader;
  }
});

// node_modules/jszip/lib/reader/StringReader.js
var require_StringReader = __commonJS({
  "node_modules/jszip/lib/reader/StringReader.js"(exports2, module2) {
    init_shims();
    "use strict";
    var DataReader = require_DataReader();
    var utils = require_utils2();
    function StringReader(data) {
      DataReader.call(this, data);
    }
    utils.inherits(StringReader, DataReader);
    StringReader.prototype.byteAt = function(i) {
      return this.data.charCodeAt(this.zero + i);
    };
    StringReader.prototype.lastIndexOfSignature = function(sig) {
      return this.data.lastIndexOf(sig) - this.zero;
    };
    StringReader.prototype.readAndCheckSignature = function(sig) {
      var data = this.readData(4);
      return sig === data;
    };
    StringReader.prototype.readData = function(size) {
      this.checkOffset(size);
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module2.exports = StringReader;
  }
});

// node_modules/jszip/lib/reader/Uint8ArrayReader.js
var require_Uint8ArrayReader = __commonJS({
  "node_modules/jszip/lib/reader/Uint8ArrayReader.js"(exports2, module2) {
    init_shims();
    "use strict";
    var ArrayReader = require_ArrayReader();
    var utils = require_utils2();
    function Uint8ArrayReader(data) {
      ArrayReader.call(this, data);
    }
    utils.inherits(Uint8ArrayReader, ArrayReader);
    Uint8ArrayReader.prototype.readData = function(size) {
      this.checkOffset(size);
      if (size === 0) {
        return new Uint8Array(0);
      }
      var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module2.exports = Uint8ArrayReader;
  }
});

// node_modules/jszip/lib/reader/NodeBufferReader.js
var require_NodeBufferReader = __commonJS({
  "node_modules/jszip/lib/reader/NodeBufferReader.js"(exports2, module2) {
    init_shims();
    "use strict";
    var Uint8ArrayReader = require_Uint8ArrayReader();
    var utils = require_utils2();
    function NodeBufferReader(data) {
      Uint8ArrayReader.call(this, data);
    }
    utils.inherits(NodeBufferReader, Uint8ArrayReader);
    NodeBufferReader.prototype.readData = function(size) {
      this.checkOffset(size);
      var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
      this.index += size;
      return result;
    };
    module2.exports = NodeBufferReader;
  }
});

// node_modules/jszip/lib/reader/readerFor.js
var require_readerFor = __commonJS({
  "node_modules/jszip/lib/reader/readerFor.js"(exports2, module2) {
    init_shims();
    "use strict";
    var utils = require_utils2();
    var support = require_support();
    var ArrayReader = require_ArrayReader();
    var StringReader = require_StringReader();
    var NodeBufferReader = require_NodeBufferReader();
    var Uint8ArrayReader = require_Uint8ArrayReader();
    module2.exports = function(data) {
      var type = utils.getTypeOf(data);
      utils.checkSupport(type);
      if (type === "string" && !support.uint8array) {
        return new StringReader(data);
      }
      if (type === "nodebuffer") {
        return new NodeBufferReader(data);
      }
      if (support.uint8array) {
        return new Uint8ArrayReader(utils.transformTo("uint8array", data));
      }
      return new ArrayReader(utils.transformTo("array", data));
    };
  }
});

// node_modules/jszip/lib/zipEntry.js
var require_zipEntry = __commonJS({
  "node_modules/jszip/lib/zipEntry.js"(exports2, module2) {
    init_shims();
    "use strict";
    var readerFor = require_readerFor();
    var utils = require_utils2();
    var CompressedObject = require_compressedObject();
    var crc32fn = require_crc32();
    var utf8 = require_utf8();
    var compressions = require_compressions();
    var support = require_support();
    var MADE_BY_DOS = 0;
    var MADE_BY_UNIX = 3;
    var findCompression = function(compressionMethod) {
      for (var method in compressions) {
        if (!compressions.hasOwnProperty(method)) {
          continue;
        }
        if (compressions[method].magic === compressionMethod) {
          return compressions[method];
        }
      }
      return null;
    };
    function ZipEntry(options2, loadOptions) {
      this.options = options2;
      this.loadOptions = loadOptions;
    }
    ZipEntry.prototype = {
      isEncrypted: function() {
        return (this.bitFlag & 1) === 1;
      },
      useUTF8: function() {
        return (this.bitFlag & 2048) === 2048;
      },
      readLocalPart: function(reader) {
        var compression, localExtraFieldsLength;
        reader.skip(22);
        this.fileNameLength = reader.readInt(2);
        localExtraFieldsLength = reader.readInt(2);
        this.fileName = reader.readData(this.fileNameLength);
        reader.skip(localExtraFieldsLength);
        if (this.compressedSize === -1 || this.uncompressedSize === -1) {
          throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
        }
        compression = findCompression(this.compressionMethod);
        if (compression === null) {
          throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + utils.transformTo("string", this.fileName) + ")");
        }
        this.decompressed = new CompressedObject(this.compressedSize, this.uncompressedSize, this.crc32, compression, reader.readData(this.compressedSize));
      },
      readCentralPart: function(reader) {
        this.versionMadeBy = reader.readInt(2);
        reader.skip(2);
        this.bitFlag = reader.readInt(2);
        this.compressionMethod = reader.readString(2);
        this.date = reader.readDate();
        this.crc32 = reader.readInt(4);
        this.compressedSize = reader.readInt(4);
        this.uncompressedSize = reader.readInt(4);
        var fileNameLength = reader.readInt(2);
        this.extraFieldsLength = reader.readInt(2);
        this.fileCommentLength = reader.readInt(2);
        this.diskNumberStart = reader.readInt(2);
        this.internalFileAttributes = reader.readInt(2);
        this.externalFileAttributes = reader.readInt(4);
        this.localHeaderOffset = reader.readInt(4);
        if (this.isEncrypted()) {
          throw new Error("Encrypted zip are not supported");
        }
        reader.skip(fileNameLength);
        this.readExtraFields(reader);
        this.parseZIP64ExtraField(reader);
        this.fileComment = reader.readData(this.fileCommentLength);
      },
      processAttributes: function() {
        this.unixPermissions = null;
        this.dosPermissions = null;
        var madeBy = this.versionMadeBy >> 8;
        this.dir = this.externalFileAttributes & 16 ? true : false;
        if (madeBy === MADE_BY_DOS) {
          this.dosPermissions = this.externalFileAttributes & 63;
        }
        if (madeBy === MADE_BY_UNIX) {
          this.unixPermissions = this.externalFileAttributes >> 16 & 65535;
        }
        if (!this.dir && this.fileNameStr.slice(-1) === "/") {
          this.dir = true;
        }
      },
      parseZIP64ExtraField: function(reader) {
        if (!this.extraFields[1]) {
          return;
        }
        var extraReader = readerFor(this.extraFields[1].value);
        if (this.uncompressedSize === utils.MAX_VALUE_32BITS) {
          this.uncompressedSize = extraReader.readInt(8);
        }
        if (this.compressedSize === utils.MAX_VALUE_32BITS) {
          this.compressedSize = extraReader.readInt(8);
        }
        if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) {
          this.localHeaderOffset = extraReader.readInt(8);
        }
        if (this.diskNumberStart === utils.MAX_VALUE_32BITS) {
          this.diskNumberStart = extraReader.readInt(4);
        }
      },
      readExtraFields: function(reader) {
        var end = reader.index + this.extraFieldsLength, extraFieldId, extraFieldLength, extraFieldValue;
        if (!this.extraFields) {
          this.extraFields = {};
        }
        while (reader.index + 4 < end) {
          extraFieldId = reader.readInt(2);
          extraFieldLength = reader.readInt(2);
          extraFieldValue = reader.readData(extraFieldLength);
          this.extraFields[extraFieldId] = {
            id: extraFieldId,
            length: extraFieldLength,
            value: extraFieldValue
          };
        }
        reader.setIndex(end);
      },
      handleUTF8: function() {
        var decodeParamType = support.uint8array ? "uint8array" : "array";
        if (this.useUTF8()) {
          this.fileNameStr = utf8.utf8decode(this.fileName);
          this.fileCommentStr = utf8.utf8decode(this.fileComment);
        } else {
          var upath = this.findExtraFieldUnicodePath();
          if (upath !== null) {
            this.fileNameStr = upath;
          } else {
            var fileNameByteArray = utils.transformTo(decodeParamType, this.fileName);
            this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
          }
          var ucomment = this.findExtraFieldUnicodeComment();
          if (ucomment !== null) {
            this.fileCommentStr = ucomment;
          } else {
            var commentByteArray = utils.transformTo(decodeParamType, this.fileComment);
            this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
          }
        }
      },
      findExtraFieldUnicodePath: function() {
        var upathField = this.extraFields[28789];
        if (upathField) {
          var extraReader = readerFor(upathField.value);
          if (extraReader.readInt(1) !== 1) {
            return null;
          }
          if (crc32fn(this.fileName) !== extraReader.readInt(4)) {
            return null;
          }
          return utf8.utf8decode(extraReader.readData(upathField.length - 5));
        }
        return null;
      },
      findExtraFieldUnicodeComment: function() {
        var ucommentField = this.extraFields[25461];
        if (ucommentField) {
          var extraReader = readerFor(ucommentField.value);
          if (extraReader.readInt(1) !== 1) {
            return null;
          }
          if (crc32fn(this.fileComment) !== extraReader.readInt(4)) {
            return null;
          }
          return utf8.utf8decode(extraReader.readData(ucommentField.length - 5));
        }
        return null;
      }
    };
    module2.exports = ZipEntry;
  }
});

// node_modules/jszip/lib/zipEntries.js
var require_zipEntries = __commonJS({
  "node_modules/jszip/lib/zipEntries.js"(exports2, module2) {
    init_shims();
    "use strict";
    var readerFor = require_readerFor();
    var utils = require_utils2();
    var sig = require_signature();
    var ZipEntry = require_zipEntry();
    var utf8 = require_utf8();
    var support = require_support();
    function ZipEntries(loadOptions) {
      this.files = [];
      this.loadOptions = loadOptions;
    }
    ZipEntries.prototype = {
      checkSignature: function(expectedSignature) {
        if (!this.reader.readAndCheckSignature(expectedSignature)) {
          this.reader.index -= 4;
          var signature = this.reader.readString(4);
          throw new Error("Corrupted zip or bug: unexpected signature (" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
        }
      },
      isSignature: function(askedIndex, expectedSignature) {
        var currentIndex = this.reader.index;
        this.reader.setIndex(askedIndex);
        var signature = this.reader.readString(4);
        var result = signature === expectedSignature;
        this.reader.setIndex(currentIndex);
        return result;
      },
      readBlockEndOfCentral: function() {
        this.diskNumber = this.reader.readInt(2);
        this.diskWithCentralDirStart = this.reader.readInt(2);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
        this.centralDirRecords = this.reader.readInt(2);
        this.centralDirSize = this.reader.readInt(4);
        this.centralDirOffset = this.reader.readInt(4);
        this.zipCommentLength = this.reader.readInt(2);
        var zipComment = this.reader.readData(this.zipCommentLength);
        var decodeParamType = support.uint8array ? "uint8array" : "array";
        var decodeContent = utils.transformTo(decodeParamType, zipComment);
        this.zipComment = this.loadOptions.decodeFileName(decodeContent);
      },
      readBlockZip64EndOfCentral: function() {
        this.zip64EndOfCentralSize = this.reader.readInt(8);
        this.reader.skip(4);
        this.diskNumber = this.reader.readInt(4);
        this.diskWithCentralDirStart = this.reader.readInt(4);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
        this.centralDirRecords = this.reader.readInt(8);
        this.centralDirSize = this.reader.readInt(8);
        this.centralDirOffset = this.reader.readInt(8);
        this.zip64ExtensibleData = {};
        var extraDataSize = this.zip64EndOfCentralSize - 44, index2 = 0, extraFieldId, extraFieldLength, extraFieldValue;
        while (index2 < extraDataSize) {
          extraFieldId = this.reader.readInt(2);
          extraFieldLength = this.reader.readInt(4);
          extraFieldValue = this.reader.readData(extraFieldLength);
          this.zip64ExtensibleData[extraFieldId] = {
            id: extraFieldId,
            length: extraFieldLength,
            value: extraFieldValue
          };
        }
      },
      readBlockZip64EndOfCentralLocator: function() {
        this.diskWithZip64CentralDirStart = this.reader.readInt(4);
        this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
        this.disksCount = this.reader.readInt(4);
        if (this.disksCount > 1) {
          throw new Error("Multi-volumes zip are not supported");
        }
      },
      readLocalFiles: function() {
        var i, file;
        for (i = 0; i < this.files.length; i++) {
          file = this.files[i];
          this.reader.setIndex(file.localHeaderOffset);
          this.checkSignature(sig.LOCAL_FILE_HEADER);
          file.readLocalPart(this.reader);
          file.handleUTF8();
          file.processAttributes();
        }
      },
      readCentralDir: function() {
        var file;
        this.reader.setIndex(this.centralDirOffset);
        while (this.reader.readAndCheckSignature(sig.CENTRAL_FILE_HEADER)) {
          file = new ZipEntry({
            zip64: this.zip64
          }, this.loadOptions);
          file.readCentralPart(this.reader);
          this.files.push(file);
        }
        if (this.centralDirRecords !== this.files.length) {
          if (this.centralDirRecords !== 0 && this.files.length === 0) {
            throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
          } else {
          }
        }
      },
      readEndOfCentral: function() {
        var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
        if (offset < 0) {
          var isGarbage = !this.isSignature(0, sig.LOCAL_FILE_HEADER);
          if (isGarbage) {
            throw new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
          } else {
            throw new Error("Corrupted zip: can't find end of central directory");
          }
        }
        this.reader.setIndex(offset);
        var endOfCentralDirOffset = offset;
        this.checkSignature(sig.CENTRAL_DIRECTORY_END);
        this.readBlockEndOfCentral();
        if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
          this.zip64 = true;
          offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
          if (offset < 0) {
            throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
          }
          this.reader.setIndex(offset);
          this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
          this.readBlockZip64EndOfCentralLocator();
          if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
            this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
            if (this.relativeOffsetEndOfZip64CentralDir < 0) {
              throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            }
          }
          this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
          this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
          this.readBlockZip64EndOfCentral();
        }
        var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
        if (this.zip64) {
          expectedEndOfCentralDirOffset += 20;
          expectedEndOfCentralDirOffset += 12 + this.zip64EndOfCentralSize;
        }
        var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;
        if (extraBytes > 0) {
          if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER)) {
          } else {
            this.reader.zero = extraBytes;
          }
        } else if (extraBytes < 0) {
          throw new Error("Corrupted zip: missing " + Math.abs(extraBytes) + " bytes.");
        }
      },
      prepareReader: function(data) {
        this.reader = readerFor(data);
      },
      load: function(data) {
        this.prepareReader(data);
        this.readEndOfCentral();
        this.readCentralDir();
        this.readLocalFiles();
      }
    };
    module2.exports = ZipEntries;
  }
});

// node_modules/jszip/lib/load.js
var require_load = __commonJS({
  "node_modules/jszip/lib/load.js"(exports2, module2) {
    init_shims();
    "use strict";
    var utils = require_utils2();
    var external = require_external();
    var utf8 = require_utf8();
    var ZipEntries = require_zipEntries();
    var Crc32Probe = require_Crc32Probe();
    var nodejsUtils = require_nodejsUtils();
    function checkEntryCRC32(zipEntry) {
      return new external.Promise(function(resolve2, reject) {
        var worker = zipEntry.decompressed.getContentWorker().pipe(new Crc32Probe());
        worker.on("error", function(e) {
          reject(e);
        }).on("end", function() {
          if (worker.streamInfo.crc32 !== zipEntry.decompressed.crc32) {
            reject(new Error("Corrupted zip : CRC32 mismatch"));
          } else {
            resolve2();
          }
        }).resume();
      });
    }
    module2.exports = function(data, options2) {
      var zip = this;
      options2 = utils.extend(options2 || {}, {
        base64: false,
        checkCRC32: false,
        optimizedBinaryString: false,
        createFolders: false,
        decodeFileName: utf8.utf8decode
      });
      if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
        return external.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file."));
      }
      return utils.prepareContent("the loaded zip file", data, true, options2.optimizedBinaryString, options2.base64).then(function(data2) {
        var zipEntries = new ZipEntries(options2);
        zipEntries.load(data2);
        return zipEntries;
      }).then(function checkCRC32(zipEntries) {
        var promises = [external.Promise.resolve(zipEntries)];
        var files = zipEntries.files;
        if (options2.checkCRC32) {
          for (var i = 0; i < files.length; i++) {
            promises.push(checkEntryCRC32(files[i]));
          }
        }
        return external.Promise.all(promises);
      }).then(function addFiles(results) {
        var zipEntries = results.shift();
        var files = zipEntries.files;
        for (var i = 0; i < files.length; i++) {
          var input = files[i];
          zip.file(input.fileNameStr, input.decompressed, {
            binary: true,
            optimizedBinaryString: true,
            date: input.date,
            dir: input.dir,
            comment: input.fileCommentStr.length ? input.fileCommentStr : null,
            unixPermissions: input.unixPermissions,
            dosPermissions: input.dosPermissions,
            createFolders: options2.createFolders
          });
        }
        if (zipEntries.zipComment.length) {
          zip.comment = zipEntries.zipComment;
        }
        return zip;
      });
    };
  }
});

// node_modules/jszip/lib/index.js
var require_lib3 = __commonJS({
  "node_modules/jszip/lib/index.js"(exports2, module2) {
    init_shims();
    "use strict";
    function JSZip() {
      if (!(this instanceof JSZip)) {
        return new JSZip();
      }
      if (arguments.length) {
        throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
      }
      this.files = Object.create(null);
      this.comment = null;
      this.root = "";
      this.clone = function() {
        var newObj = new JSZip();
        for (var i in this) {
          if (typeof this[i] !== "function") {
            newObj[i] = this[i];
          }
        }
        return newObj;
      };
    }
    JSZip.prototype = require_object();
    JSZip.prototype.loadAsync = require_load();
    JSZip.support = require_support();
    JSZip.defaults = require_defaults3();
    JSZip.version = "3.7.1";
    JSZip.loadAsync = function(content, options2) {
      return new JSZip().loadAsync(content, options2);
    };
    JSZip.external = require_external();
    module2.exports = JSZip;
  }
});

// node_modules/file-saver/dist/FileSaver.min.js
var require_FileSaver_min = __commonJS({
  "node_modules/file-saver/dist/FileSaver.min.js"(exports2, module2) {
    init_shims();
    (function(a, b) {
      if (typeof define == "function" && define.amd)
        define([], b);
      else if (typeof exports2 != "undefined")
        b();
      else {
        b(), a.FileSaver = { exports: {} }.exports;
      }
    })(exports2, function() {
      "use strict";
      function b(a2, b2) {
        return typeof b2 == "undefined" ? b2 = { autoBom: false } : typeof b2 != "object" && (console.warn("Deprecated: Expected third argument to be a object"), b2 = { autoBom: !b2 }), b2.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a2.type) ? new Blob(["\uFEFF", a2], { type: a2.type }) : a2;
      }
      function c(a2, b2, c2) {
        var d3 = new XMLHttpRequest();
        d3.open("GET", a2), d3.responseType = "blob", d3.onload = function() {
          g(d3.response, b2, c2);
        }, d3.onerror = function() {
          console.error("could not download file");
        }, d3.send();
      }
      function d2(a2) {
        var b2 = new XMLHttpRequest();
        b2.open("HEAD", a2, false);
        try {
          b2.send();
        } catch (a3) {
        }
        return 200 <= b2.status && 299 >= b2.status;
      }
      function e(a2) {
        try {
          a2.dispatchEvent(new MouseEvent("click"));
        } catch (c2) {
          var b2 = document.createEvent("MouseEvents");
          b2.initMouseEvent("click", true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null), a2.dispatchEvent(b2);
        }
      }
      var f = typeof window == "object" && window.window === window ? window : typeof self == "object" && self.self === self ? self : typeof global == "object" && global.global === global ? global : void 0, a = f.navigator && /Macintosh/.test(navigator.userAgent) && /AppleWebKit/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent), g = f.saveAs || (typeof window != "object" || window !== f ? function() {
      } : "download" in HTMLAnchorElement.prototype && !a ? function(b2, g2, h) {
        var i = f.URL || f.webkitURL, j = document.createElement("a");
        g2 = g2 || b2.name || "download", j.download = g2, j.rel = "noopener", typeof b2 == "string" ? (j.href = b2, j.origin === location.origin ? e(j) : d2(j.href) ? c(b2, g2, h) : e(j, j.target = "_blank")) : (j.href = i.createObjectURL(b2), setTimeout(function() {
          i.revokeObjectURL(j.href);
        }, 4e4), setTimeout(function() {
          e(j);
        }, 0));
      } : "msSaveOrOpenBlob" in navigator ? function(f2, g2, h) {
        if (g2 = g2 || f2.name || "download", typeof f2 != "string")
          navigator.msSaveOrOpenBlob(b(f2, h), g2);
        else if (d2(f2))
          c(f2, g2, h);
        else {
          var i = document.createElement("a");
          i.href = f2, i.target = "_blank", setTimeout(function() {
            e(i);
          });
        }
      } : function(b2, d3, e2, g2) {
        if (g2 = g2 || open("", "_blank"), g2 && (g2.document.title = g2.document.body.innerText = "downloading..."), typeof b2 == "string")
          return c(b2, d3, e2);
        var h = b2.type === "application/octet-stream", i = /constructor/i.test(f.HTMLElement) || f.safari, j = /CriOS\/[\d]+/.test(navigator.userAgent);
        if ((j || h && i || a) && typeof FileReader != "undefined") {
          var k = new FileReader();
          k.onloadend = function() {
            var a2 = k.result;
            a2 = j ? a2 : a2.replace(/^data:[^;]*;/, "data:attachment/file;"), g2 ? g2.location.href = a2 : location = a2, g2 = null;
          }, k.readAsDataURL(b2);
        } else {
          var l = f.URL || f.webkitURL, m = l.createObjectURL(b2);
          g2 ? g2.location = m : location.href = m, g2 = null, setTimeout(function() {
            l.revokeObjectURL(m);
          }, 4e4);
        }
      });
      f.saveAs = g.saveAs = g, typeof module2 != "undefined" && (module2.exports = g);
    });
  }
});

// .svelte-kit/netlify/entry.js
__export(exports, {
  handler: () => handler
});
init_shims();

// .svelte-kit/output/server/app.js
init_shims();

// node_modules/@sveltejs/kit/dist/ssr.js
init_shims();

// node_modules/@sveltejs/kit/dist/adapter-utils.js
init_shims();
function isContentTypeTextual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}

// node_modules/@sveltejs/kit/dist/ssr.js
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive2(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive2(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive2(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive2(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  options: options2,
  $session,
  page_config,
  status,
  error: error3,
  branch,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error3) {
    error3.stack = options2.get_stack(error3);
  }
  if (branch) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error4) => {
      throw new Error(`Failed to serialize session data: ${error4.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error3)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page && page.path)},
						query: new URLSearchParams(${page ? s$1(page.query.toString()) : ""}),
						params: ${page && s$1(page.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error3) {
  if (!error3)
    return null;
  let serialized = try_serialize(error3);
  if (!serialized) {
    const { name, message, stack } = error3;
    serialized = try_serialize({ ...error3, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error3 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error3 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error3}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error3 };
    }
    return { status, error: error3 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
var absolute = /^([a-z]+:)?\/?\//;
function resolve(base2, path2) {
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path2);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path2.slice(path_match[0].length).split("/") : path2.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error: error3
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module2.load) {
    const load_input = {
      page,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const filename = resolved.replace(options2.paths.assets, "").slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? {
              "content-type": asset.type
            } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (resolved.startsWith(options2.paths.base || "/")) {
          const relative = resolved.replace(options2.paths.base, "");
          const headers = { ...opts.headers };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body,
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.serverFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error3;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function coalesce_to_error(err) {
  return err instanceof Error ? err : new Error(JSON.stringify(err));
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error3 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded ? loaded.context : {},
      is_leaf: false,
      is_error: true,
      status,
      error: error3
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error3,
      branch,
      page
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4);
    return {
      status: 500,
      headers: {},
      body: error4.stack
    };
  }
}
async function respond$1({ request, options: options2, state, $session, route }) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => options2.load_component(id)));
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  const page_config = {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: ""
    };
  }
  let branch;
  let status = 200;
  let error3;
  ssr:
    if (page_config.ssr) {
      let context = {};
      branch = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options: options2,
              state,
              route,
              page,
              node,
              $session,
              context,
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error3 } = loaded.loaded);
            } else {
              branch.push(loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e);
            status = 500;
            error3 = e;
          }
          if (error3) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let error_loaded;
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options: options2,
                    state,
                    route,
                    page,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error3
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error3
            });
          }
        }
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      options: options2,
      $session,
      page_config,
      status,
      error: error3,
      branch: branch && branch.filter(Boolean),
      page
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
}
async function render_page(request, route, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options2.hooks.getSession(request);
  if (route) {
    const response = await respond$1({
      request,
      options: options2,
      state,
      $session,
      route
    });
    if (response) {
      return response;
    }
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  } else {
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
function error2(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler2 = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler2) {
    return error2("no handler");
  }
  const match = route.pattern.exec(request.path);
  if (!match) {
    return error2("could not parse parameters from request path");
  }
  const params = route.params(match);
  const response = await handler2({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return error2("no response");
  }
  if (typeof response !== "object") {
    return error2(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = headers["content-type"];
  const is_type_textual = isContentTypeTextual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error2(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  #map;
  constructor(map) {
    this.#map = map;
  }
  get(key) {
    const value = this.#map.get(key);
    return value && value[0];
  }
  getAll(key) {
    return this.#map.get(key);
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of this.#map)
      yield key;
  }
  *values() {
    for (const [, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
};
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  if (typeof raw === "string") {
    const [type, ...directives] = headers["content-type"].split(/;\s*/);
    switch (type) {
      case "text/plain":
        return raw;
      case "application/json":
        return JSON.parse(raw);
      case "application/x-www-form-urlencoded":
        return get_urlencoded(raw);
      case "multipart/form-data": {
        const boundary = directives.find((directive) => directive.startsWith("boundary="));
        if (!boundary)
          throw new Error("Missing boundary");
        return get_multipart(raw, boundary.slice("boundary=".length));
      }
      default:
        throw new Error(`Invalid Content-Type ${type}`);
    }
  }
  return raw;
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path2 = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: encodeURI(path2 + (q ? `?${q}` : ""))
        }
      };
    }
  }
  try {
    const headers = lowercase_keys(incoming.headers);
    return await options2.hooks.handle({
      request: {
        ...incoming,
        headers,
        body: parse_body(incoming.rawBody, headers),
        params: {},
        locals: {}
      },
      resolve: async (request) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        for (const route of options2.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body || "")}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: ""
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options2, state);
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}

// .svelte-kit/output/server/app.js
var import_cookie = __toModule(require_cookie());

// node_modules/@lukeed/uuid/dist/index.mjs
init_shims();
var IDX = 256;
var HEX = [];
var BUFFER;
while (IDX--)
  HEX[IDX] = (IDX + 256).toString(16).substring(1);
function v4() {
  var i = 0, num, out = "";
  if (!BUFFER || IDX + 16 > 256) {
    BUFFER = Array(i = 256);
    while (i--)
      BUFFER[i] = 256 * Math.random() | 0;
    i = IDX = 0;
  }
  for (; i < 16; i++) {
    num = BUFFER[IDX + i];
    if (i == 6)
      out += HEX[num & 15 | 64];
    else if (i == 8)
      out += HEX[num & 63 | 128];
    else
      out += HEX[num];
    if (i & 1 && i > 1 && i < 11)
      out += "-";
  }
  IDX++;
  return out;
}

// .svelte-kit/output/server/app.js
var import_fs = __toModule(require("fs"));
var import_path = __toModule(require("path"));
var import_marked = __toModule(require_marked());
var import_gray_matter = __toModule(require_gray_matter());
var import_bluebird = __toModule(require_bluebird());
var import_jszip = __toModule(require_lib3());
var import_file_saver = __toModule(require_FileSaver_min());
function noop2() {
}
var identity = (x) => x;
function assign(tar, src2) {
  for (const k in src2)
    tar[k] = src2[k];
  return tar;
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function safe_not_equal2(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop2;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
var is_client = typeof window !== "undefined";
var now = is_client ? () => window.performance.now() : () => Date.now();
var raf = is_client ? (cb) => requestAnimationFrame(cb) : noop2;
var tasks = new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
function custom_event(type, detail, bubbles = false) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, false, detail);
  return e;
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
Promise.resolve();
var boolean_attributes = new Set([
  "allowfullscreen",
  "allowpaymentrequest",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
]);
var invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
function spread(args, classes_to_add) {
  const attributes = Object.assign({}, ...args);
  if (classes_to_add) {
    if (attributes.class == null) {
      attributes.class = classes_to_add;
    } else {
      attributes.class += " " + classes_to_add;
    }
  }
  let str = "";
  Object.keys(attributes).forEach((name) => {
    if (invalid_attribute_name_character.test(name))
      return;
    const value = attributes[name];
    if (value === true)
      str += " " + name;
    else if (boolean_attributes.has(name.toLowerCase())) {
      if (value)
        str += " " + name;
    } else if (value != null) {
      str += ` ${name}="${value}"`;
    }
  });
  return str;
}
var escaped2 = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
function escape_attribute_value(value) {
  return typeof value === "string" ? escape2(value) : value;
}
function escape_object(obj) {
  const result = {};
  for (const key in obj) {
    result[key] = escape_attribute_value(obj[key]);
  }
  return result;
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
var css$k = {
  code: "#svelte-announcer.svelte-1pdgbjn{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>#svelte-announcer{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}</style>"],"names":[],"mappings":"AAqDO,gCAAiB,CAAC,KAAK,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,kBAAkB,MAAM,GAAG,CAAC,CAAC,UAAU,MAAM,GAAG,CAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,CAAC,SAAS,MAAM,CAAC,SAAS,QAAQ,CAAC,IAAI,CAAC,CAAC,YAAY,MAAM,CAAC,MAAM,GAAG,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$k);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${``}`;
});
var base = "";
var assets = "/.";
function set_paths(paths) {
  ({ base, assets } = paths);
}
function set_prerendering(value) {
}
var handle = async ({ request, resolve: resolve2 }) => {
  const cookies = import_cookie.default.parse(request.headers.cookie || "");
  request.locals.userid = cookies.userid || v4();
  if (request.query.has("_method")) {
    request.method = request.query.get("_method").toUpperCase();
  }
  const response = await resolve2(request);
  if (!cookies.userid) {
    response.headers["set-cookie"] = `userid=${request.locals.userid}; Path=/; HttpOnly`;
  }
  return response;
};
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  handle
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.ico" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
var options = null;
var default_settings = { paths: { "base": "", "assets": "/." } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: "/./_app/start-5eb1681a.js",
      css: ["/./_app/assets/start-0826e215.css", "/./_app/assets/vendor-643d5fdc.css"],
      js: ["/./_app/start-5eb1681a.js", "/./_app/chunks/vendor-60544b80.js", "/./_app/chunks/singletons-12a22614.js", "/./_app/chunks/paths-45dac81d.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22) => {
      if (error22.frame) {
        console.error(error22.frame);
      }
      console.error(error22.stack);
      error22.stack = options.get_stack(error22);
    },
    hooks: get_hooks(user_hooks),
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var d = decodeURIComponent;
var empty = () => ({});
var manifest = {
  assets: [{ "file": "_redirects", "size": 0, "type": null }, { "file": "favicon.ico", "size": 15406, "type": "image/vnd.microsoft.icon" }, { "file": "font/noway-bold-webfont.eot", "size": 32874, "type": "application/vnd.ms-fontobject" }, { "file": "font/noway-bold-webfont.svg", "size": 204331, "type": "image/svg+xml" }, { "file": "font/noway-bold-webfont.ttf", "size": 84344, "type": "font/ttf" }, { "file": "font/noway-bold-webfont.woff", "size": 41268, "type": "font/woff" }, { "file": "font/noway-bold-webfont.woff2", "size": 28788, "type": "font/woff2" }, { "file": "font/noway-medium-webfont.eot", "size": 33427, "type": "application/vnd.ms-fontobject" }, { "file": "font/noway-medium-webfont.svg", "size": 193061, "type": "image/svg+xml" }, { "file": "font/noway-medium-webfont.ttf", "size": 85324, "type": "font/ttf" }, { "file": "font/noway-medium-webfont.woff", "size": 41976, "type": "font/woff" }, { "file": "font/noway-medium-webfont.woff2", "size": 29248, "type": "font/woff2" }, { "file": "font/noway-regular-webfont.eot", "size": 32974, "type": "application/vnd.ms-fontobject" }, { "file": "font/noway-regular-webfont.svg", "size": 194898, "type": "image/svg+xml" }, { "file": "font/noway-regular-webfont.ttf", "size": 86820, "type": "font/ttf" }, { "file": "font/noway-regular-webfont.woff", "size": 41672, "type": "font/woff" }, { "file": "font/noway-regular-webfont.woff2", "size": 28772, "type": "font/woff2" }, { "file": "font/noway_regular_italic-webfont.eot", "size": 103360, "type": "application/vnd.ms-fontobject" }, { "file": "font/noway_regular_italic-webfont.svg", "size": 205941, "type": "image/svg+xml" }, { "file": "font/noway_regular_italic-webfont.ttf", "size": 103176, "type": "font/ttf" }, { "file": "font/noway_regular_italic-webfont.woff", "size": 48380, "type": "font/woff" }, { "file": "font/noway_regular_italic-webfont.woff2", "size": 33152, "type": "font/woff2" }, { "file": "img/calendar.png", "size": 411, "type": "image/png" }, { "file": "img/calendar.svg", "size": 410, "type": "image/svg+xml" }, { "file": "img/city.jpg", "size": 52339, "type": "image/jpeg" }, { "file": "img/earth.jpg", "size": 124388, "type": "image/jpeg" }, { "file": "img/forest.jpg", "size": 139788, "type": "image/jpeg" }, { "file": "img/fund/BMBF_gefoerdert_2017_en.svg", "size": 44777, "type": "image/svg+xml" }, { "file": "img/fund/PrototypeFund-P-Logo.svg", "size": 3976, "type": "image/svg+xml" }, { "file": "img/fund/okfn.svg", "size": 79292, "type": "image/svg+xml" }, { "file": "img/iceland.jpg", "size": 115302, "type": "image/jpeg" }, { "file": "img/navigation.svg", "size": 277, "type": "image/svg+xml" }, { "file": "img/ndvi-2-start-project.png", "size": 39983, "type": "image/png" }, { "file": "img/ndvi-3-open-data.mp4", "size": 300425, "type": "video/mp4" }, { "file": "img/ndvi-4-add-basemap.mp4", "size": 351200, "type": "video/mp4" }, { "file": "img/ndvi-4-order-layers.mp4", "size": 598072, "type": "video/mp4" }, { "file": "img/ndvi-5-raster-data.png", "size": 74152, "type": "image/png" }, { "file": "img/ndvi-6-calculate-ndvi.mp4", "size": 1060082, "type": "video/mp4" }, { "file": "img/ndvi-7-colorize-data.mp4", "size": 741965, "type": "video/mp4" }, { "file": "img/ndvi-8-export-map.mp4", "size": 665706, "type": "video/mp4" }, { "file": "img/ndvi-8-identify-features.mp4", "size": 1312465, "type": "video/mp4" }, { "file": "img/ndvi-8-layer-display.mp4", "size": 820780, "type": "video/mp4" }, { "file": "img/ndvi-8-layer-opacity.mp4", "size": 2166852, "type": "video/mp4" }, { "file": "img/ndvi-legend.png", "size": 47719, "type": "image/png" }, { "file": "img/ndwi-3-open-data.mp4", "size": 358262, "type": "video/mp4" }, { "file": "img/ndwi-4-add-basemap.mp4", "size": 342223, "type": "video/mp4" }, { "file": "img/ndwi-4-order-layers.mp4", "size": 353825, "type": "video/mp4" }, { "file": "img/ndwi-6-calculate-ndwi.mp4", "size": 1575191, "type": "video/mp4" }, { "file": "img/ndwi-7-colorize-data.mp4", "size": 1510041, "type": "video/mp4" }, { "file": "img/ndwi-8-export-map.mp4", "size": 1020083, "type": "video/mp4" }, { "file": "img/ndwi-8-layer-display.mp4", "size": 982815, "type": "video/mp4" }, { "file": "img/ndwi-8-layer-opacity.mp4", "size": 3730781, "type": "video/mp4" }, { "file": "img/ndwi-legend.png", "size": 37157, "type": "image/png" }, { "file": "img/openspacedata-logo.png", "size": 41408, "type": "image/png" }, { "file": "img/wave.jpg", "size": 48492, "type": "image/jpeg" }, { "file": "img/wildfire.jpg", "size": 55609, "type": "image/jpeg" }, { "file": "robots.txt", "size": 67, "type": "text/plain" }, { "file": "sample/api-respond.json", "size": 4304, "type": "application/json" }],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/categories\.json$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return categories_json;
      })
    },
    {
      type: "endpoint",
      pattern: /^\/guides\.json$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return guides_json;
      })
    },
    {
      type: "endpoint",
      pattern: /^\/cases\.json$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return cases_json;
      })
    },
    {
      type: "page",
      pattern: /^\/about\/?$/,
      params: empty,
      a: ["src/routes/about/__layout.reset.svelte", "src/routes/about/index.svx"],
      b: []
    },
    {
      type: "endpoint",
      pattern: /^\/guide\/([^/]+?)\.json$/,
      params: (m) => ({ slug: d(m[1]) }),
      load: () => Promise.resolve().then(function() {
        return _slug__json;
      })
    },
    {
      type: "page",
      pattern: /^\/guide\/([^/]+?)\/?$/,
      params: (m) => ({ slug: d(m[1]) }),
      a: ["src/routes/__layout.svelte", "src/routes/guide/[slug].svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/guide\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/guide.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/help\/?$/,
      params: empty,
      a: ["src/routes/help/__layout.reset.svelte", "src/routes/help/index.svx"],
      b: []
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  serverFetch: hooks.serverFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error$1;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index$2;
  }),
  "src/routes/about/__layout.reset.svelte": () => Promise.resolve().then(function() {
    return __layout_reset$1;
  }),
  "src/routes/about/index.svx": () => Promise.resolve().then(function() {
    return index$1;
  }),
  "src/routes/guide/[slug].svelte": () => Promise.resolve().then(function() {
    return _slug_;
  }),
  "src/routes/guide.svelte": () => Promise.resolve().then(function() {
    return guide;
  }),
  "src/routes/help/__layout.reset.svelte": () => Promise.resolve().then(function() {
    return __layout_reset;
  }),
  "src/routes/help/index.svx": () => Promise.resolve().then(function() {
    return index;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "/./_app/pages/__layout.svelte-6710fe3a.js", "css": ["/./_app/assets/pages/__layout.svelte-5283f7ab.css", "/./_app/assets/vendor-643d5fdc.css", "/./_app/assets/app-bd6a0dfa.css"], "js": ["/./_app/pages/__layout.svelte-6710fe3a.js", "/./_app/chunks/vendor-60544b80.js", "/./_app/chunks/app-08bd2623.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "/./_app/error.svelte-ab6b3196.js", "css": ["/./_app/assets/vendor-643d5fdc.css"], "js": ["/./_app/error.svelte-ab6b3196.js", "/./_app/chunks/vendor-60544b80.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "/./_app/pages/index.svelte-affbb3fc.js", "css": ["/./_app/assets/pages/index.svelte-daf997df.css", "/./_app/assets/vendor-643d5fdc.css", "/./_app/assets/NumberedHeading-3d6873ba.css"], "js": ["/./_app/pages/index.svelte-affbb3fc.js", "/./_app/chunks/vendor-60544b80.js", "/./_app/chunks/NumberedHeading-2d34afc9.js", "/./_app/chunks/singletons-12a22614.js"], "styles": [] }, "src/routes/about/__layout.reset.svelte": { "entry": "/./_app/pages/about/__layout.reset.svelte-3211bbac.js", "css": ["/./_app/assets/pages/about/__layout.reset.svelte-17142a42.css", "/./_app/assets/vendor-643d5fdc.css", "/./_app/assets/app-bd6a0dfa.css"], "js": ["/./_app/pages/about/__layout.reset.svelte-3211bbac.js", "/./_app/chunks/vendor-60544b80.js", "/./_app/chunks/app-08bd2623.js"], "styles": [] }, "src/routes/about/index.svx": { "entry": "/./_app/pages/about/index.svx-aa08c614.js", "css": ["/./_app/assets/pages/about/index.svx-f7df0b77.css", "/./_app/assets/vendor-643d5fdc.css"], "js": ["/./_app/pages/about/index.svx-aa08c614.js", "/./_app/chunks/vendor-60544b80.js"], "styles": [] }, "src/routes/guide/[slug].svelte": { "entry": "/./_app/pages/guide/[slug].svelte-fa8e379d.js", "css": ["/./_app/assets/pages/guide/[slug].svelte-7710ee10.css", "/./_app/assets/vendor-643d5fdc.css", "/./_app/assets/NumberedHeading-3d6873ba.css"], "js": ["/./_app/pages/guide/[slug].svelte-fa8e379d.js", "/./_app/chunks/vendor-60544b80.js", "/./_app/chunks/paths-45dac81d.js", "/./_app/chunks/NumberedHeading-2d34afc9.js", "/./_app/chunks/satellite-cc9d1c51.js"], "styles": [] }, "src/routes/guide.svelte": { "entry": "/./_app/pages/guide.svelte-c4f9021f.js", "css": ["/./_app/assets/pages/guide/[slug].svelte-7710ee10.css", "/./_app/assets/vendor-643d5fdc.css", "/./_app/assets/NumberedHeading-3d6873ba.css"], "js": ["/./_app/pages/guide.svelte-c4f9021f.js", "/./_app/chunks/vendor-60544b80.js", "/./_app/chunks/NumberedHeading-2d34afc9.js", "/./_app/chunks/satellite-cc9d1c51.js"], "styles": [] }, "src/routes/help/__layout.reset.svelte": { "entry": "/./_app/pages/help/__layout.reset.svelte-ad8d1133.js", "css": ["/./_app/assets/pages/about/__layout.reset.svelte-17142a42.css", "/./_app/assets/vendor-643d5fdc.css", "/./_app/assets/app-bd6a0dfa.css"], "js": ["/./_app/pages/help/__layout.reset.svelte-ad8d1133.js", "/./_app/chunks/vendor-60544b80.js", "/./_app/chunks/app-08bd2623.js"], "styles": [] }, "src/routes/help/index.svx": { "entry": "/./_app/pages/help/index.svx-63719662.js", "css": ["/./_app/assets/vendor-643d5fdc.css"], "js": ["/./_app/pages/help/index.svx-63719662.js", "/./_app/chunks/vendor-60544b80.js"], "styles": [] } };
async function load_component(file) {
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
function render(request, {
  prerender: prerender2
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender2 });
}
var __dirname$1 = import_path.default.resolve(import_path.default.dirname(""));
async function get$3({
  params
}) {
  const modules = { "/src/guides/floods/category.md": () => Promise.resolve().then(function() {
    return category$5;
  }), "/src/guides/snow/category.md": () => Promise.resolve().then(function() {
    return category$4;
  }), "/src/guides/urban/category.md": () => Promise.resolve().then(function() {
    return category$3;
  }), "/src/guides/vegetation/category.md": () => Promise.resolve().then(function() {
    return category$2;
  }), "/src/guides/water/category.md": () => Promise.resolve().then(function() {
    return category$1;
  }), "/src/guides/wildfire/category.md": () => Promise.resolve().then(function() {
    return category;
  }) };
  let categories = [];
  for (const [filePath, resolver] of Object.entries(modules)) {
    const pathArray = filePath.split("/");
    const parentFolder = pathArray[pathArray.length - 2];
    const category2 = import_fs.default.readFileSync(import_path.default.join(__dirname$1, filePath), "utf-8");
    const {
      data
    } = (0, import_gray_matter.default)(category2);
    categories.push({
      ...data,
      parentFolder
    });
  }
  return {
    body: categories
  };
}
var categories_json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get: get$3
});
import_path.default.resolve(import_path.default.dirname(""));
var guidesPath$1 = "/opt/build/repo";
var groupBy = (key) => (array) => array.reduce((objectsByKeyValue, obj) => {
  const value = obj[key];
  objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
  return objectsByKeyValue;
}, {});
async function get$2({
  params
}) {
  const modules = { "/src/guides/floods/category.md": () => Promise.resolve().then(function() {
    return category$5;
  }), "/src/guides/snow/category.md": () => Promise.resolve().then(function() {
    return category$4;
  }), "/src/guides/urban/category.md": () => Promise.resolve().then(function() {
    return category$3;
  }), "/src/guides/vegetation/category.md": () => Promise.resolve().then(function() {
    return category$2;
  }), "/src/guides/water/category.md": () => Promise.resolve().then(function() {
    return category$1;
  }), "/src/guides/wildfire/category.md": () => Promise.resolve().then(function() {
    return category;
  }), "/src/guides/floods/cases/detect-water/case.md": () => Promise.resolve().then(function() {
    return _case$7;
  }), "/src/guides/floods/cases/detect-water/interpret.md": () => Promise.resolve().then(function() {
    return interpret$3;
  }), "/src/guides/floods/cases/detect-water/introduction.md": () => Promise.resolve().then(function() {
    return introduction$3;
  }), "/src/guides/floods/cases/detect-water/process.md": () => Promise.resolve().then(function() {
    return process$3;
  }), "/src/guides/snow/cases/detect-snow-cover/case.md": () => Promise.resolve().then(function() {
    return _case$6;
  }), "/src/guides/urban/cases/true-color-image/case.md": () => Promise.resolve().then(function() {
    return _case$5;
  }), "/src/guides/urban/cases/visualize-urban-areas/case.md": () => Promise.resolve().then(function() {
    return _case$4;
  }), "/src/guides/vegetation/cases/barren-soil/case.md": () => Promise.resolve().then(function() {
    return _case$3;
  }), "/src/guides/vegetation/cases/barren-soil/interpret.md": () => Promise.resolve().then(function() {
    return interpret$2;
  }), "/src/guides/vegetation/cases/barren-soil/introduction.md": () => Promise.resolve().then(function() {
    return introduction$2;
  }), "/src/guides/vegetation/cases/barren-soil/process.md": () => Promise.resolve().then(function() {
    return process$2;
  }), "/src/guides/vegetation/cases/vegetation-health/case.md": () => Promise.resolve().then(function() {
    return _case$2;
  }), "/src/guides/vegetation/cases/vegetation-health/interpret.md": () => Promise.resolve().then(function() {
    return interpret$1;
  }), "/src/guides/vegetation/cases/vegetation-health/introduction.md": () => Promise.resolve().then(function() {
    return introduction$1;
  }), "/src/guides/vegetation/cases/vegetation-health/process.md": () => Promise.resolve().then(function() {
    return process$1;
  }), "/src/guides/water/cases/detect-water/case.md": () => Promise.resolve().then(function() {
    return _case$1;
  }), "/src/guides/water/cases/detect-water/interpret.md": () => Promise.resolve().then(function() {
    return interpret;
  }), "/src/guides/water/cases/detect-water/introduction.md": () => Promise.resolve().then(function() {
    return introduction;
  }), "/src/guides/water/cases/detect-water/process.md": () => Promise.resolve().then(function() {
    return process2;
  }), "/src/guides/wildfire/cases/detect-burned-areas/case.md": () => Promise.resolve().then(function() {
    return _case;
  }) };
  let guides = [];
  for (const [filePath, resolver] of Object.entries(modules)) {
    const guide2 = import_fs.default.readFileSync(import_path.default.join(guidesPath$1, filePath), "utf-8");
    const {
      data,
      content
    } = (0, import_gray_matter.default)(guide2);
    const renderer = new import_marked.default.Renderer();
    const html = (0, import_marked.default)(content, {
      renderer
    });
    guides.push({
      case: data.case,
      content: data.content,
      html
    });
  }
  const groupByCase = groupBy("case");
  const cases = Object.keys(groupByCase(guides));
  const merged = cases.map((value) => {
    const relatedCases = guides.filter((guide2) => guide2.case === value);
    const content = relatedCases.reduce((acc, key) => ({
      ...acc,
      [key.content]: [key.html]
    }), {});
    return {
      value,
      content
    };
  });
  return {
    body: merged
  };
}
var guides_json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get: get$2
});
var __dirname = import_path.default.resolve(import_path.default.dirname(""));
async function get$1({
  params
}) {
  const modules = { "/src/guides/floods/cases/detect-water/case.md": () => Promise.resolve().then(function() {
    return _case$7;
  }), "/src/guides/snow/cases/detect-snow-cover/case.md": () => Promise.resolve().then(function() {
    return _case$6;
  }), "/src/guides/urban/cases/true-color-image/case.md": () => Promise.resolve().then(function() {
    return _case$5;
  }), "/src/guides/urban/cases/visualize-urban-areas/case.md": () => Promise.resolve().then(function() {
    return _case$4;
  }), "/src/guides/vegetation/cases/barren-soil/case.md": () => Promise.resolve().then(function() {
    return _case$3;
  }), "/src/guides/vegetation/cases/vegetation-health/case.md": () => Promise.resolve().then(function() {
    return _case$2;
  }), "/src/guides/water/cases/detect-water/case.md": () => Promise.resolve().then(function() {
    return _case$1;
  }), "/src/guides/wildfire/cases/detect-burned-areas/case.md": () => Promise.resolve().then(function() {
    return _case;
  }) };
  let cases = [];
  for (const [filePath, resolver] of Object.entries(modules)) {
    const pathArray = filePath.split("/");
    const parentFolder = pathArray[pathArray.length - 4];
    const caseFolder = pathArray[pathArray.length - 2];
    const c = import_fs.default.readFileSync(import_path.default.join(__dirname, filePath), "utf-8");
    const {
      data
    } = (0, import_gray_matter.default)(c);
    cases.push({
      ...data,
      parentFolder,
      caseFolder
    });
  }
  return {
    body: cases
  };
}
var cases_json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get: get$1
});
var guidesPath = "https://openspacedata.netlify.app/guides.json";
async function get({
  params
}) {
  const {
    slug
  } = params;
  const guides = await fetch(guidesPath).then((res2) => res2.json());
  const content = guides.filter((guide2) => guide2.value === slug);
  const guideContent = {
    ...content[0]
  };
  return {
    body: guideContent
  };
}
var _slug__json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get
});
var github = "/_app/assets/github-logo.54352ab1.svg";
function exclude(obj, exclude2) {
  Object.keys(obj).filter((key) => exclude2.includes(key)).forEach((key) => delete obj[key]);
  return obj;
}
var Inline_svg = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  createEventDispatcher();
  let { src: src2 } = $$props;
  let { transformSrc = (svg) => svg } = $$props;
  let svgAttrs = {};
  let svgContent;
  if ($$props.src === void 0 && $$bindings.src && src2 !== void 0)
    $$bindings.src(src2);
  if ($$props.transformSrc === void 0 && $$bindings.transformSrc && transformSrc !== void 0)
    $$bindings.transformSrc(transformSrc);
  return `<svg${spread([
    { xmlns: "http://www.w3.org/2000/svg" },
    escape_object(svgAttrs),
    escape_object(exclude($$props, ["src", "transformSrc"])),
    { contenteditable: "true" }
  ])}>${(($$value) => $$value === void 0 ? `` : $$value)(svgContent)}</svg>`;
});
var css$j = {
  code: "header.svelte-10xatuh.svelte-10xatuh.svelte-10xatuh{background-color:var(--color-black);color:var(--light-text-color);font-size:var(--size-500);margin-bottom:var(--size-600);max-height:8rem;min-height:4rem;padding:var(--size-300) 0}header.svelte-10xatuh .logo.svelte-10xatuh.svelte-10xatuh{max-height:4rem;text-align:center;width:100%}.logo.svelte-10xatuh a.svelte-10xatuh.svelte-10xatuh{background-image:none;text-decoration:none;text-shadow:none}header.svelte-10xatuh .logo img.svelte-10xatuh.svelte-10xatuh{aspect-ratio:140/64;max-height:4rem}header.svelte-10xatuh nav ul.svelte-10xatuh.svelte-10xatuh{--gap:var(--size-400);display:flex;flex-wrap:wrap;justify-content:center;list-style:none;margin:calc(var(--gap)*-1) 0 0 calc(var(--gap)*-1);width:calc(100% + var(--gap))}header.svelte-10xatuh nav ul.svelte-10xatuh>.svelte-10xatuh{margin:var(--gap)}header.svelte-10xatuh nav ul a.svg.svelte-10xatuh.svelte-10xatuh{background:none;display:inline-grid;height:100%;place-items:center;text-shadow:none}header nav ul a.svg svg{fill:currentColor}header nav ul a.svg:hover svg{fill:var(--color-accent)}header.svelte-10xatuh nav.svelte-10xatuh.svelte-10xatuh{padding:var(--size-300) 0;width:100vw}@media(min-width:36rem){header.svelte-10xatuh.svelte-10xatuh.svelte-10xatuh{padding:var(--size-500) 0}header.svelte-10xatuh .logo.svelte-10xatuh.svelte-10xatuh{margin-bottom:0}}@media(min-width:48rem){header.svelte-10xatuh .logo.svelte-10xatuh.svelte-10xatuh{text-align:left;width:auto}header.svelte-10xatuh nav.svelte-10xatuh.svelte-10xatuh{width:auto}}",
  map: `{"version":3,"file":"Header.svelte","sources":["Header.svelte"],"sourcesContent":["<script>\\n  import {page} from '$app/stores'\\n  import github from '$lib/svg/github-logo.svg'\\n  import InlineSVG from 'svelte-inline-svg'\\n<\/script>\\n\\n<header>\\n  <div class=\\"wrapper\\">\\n    <div class=\\"logo\\">\\n      <a href=\\"/\\"><img src=\\"/img/openspacedata-logo.png\\" alt=\\"\\" height=\\"64\\" width=\\"140\\" /></a>\\n    </div>\\n    <nav>\\n      <ul>\\n        <li><a href=\\"/about\\">About</a></li>\\n        <li><a href=\\"/help\\">Help</a></li>\\n        <li>\\n          <a href=\\"https://github.com/OpenSpaceData\\" class=\\"svg\\"><InlineSVG src={github} /></a>\\n        </li>\\n      </ul>\\n    </nav>\\n  </div>\\n</header>\\n\\n<style>header{background-color:var(--color-black);color:var(--light-text-color);font-size:var(--size-500);margin-bottom:var(--size-600);max-height:8rem;min-height:4rem;padding:var(--size-300) 0}header .logo{max-height:4rem;text-align:center;width:100%}.logo a{background-image:none;text-decoration:none;text-shadow:none}header .logo img{aspect-ratio:140/64;max-height:4rem}header nav ul{--gap:var(--size-400);display:flex;flex-wrap:wrap;justify-content:center;list-style:none;margin:calc(var(--gap)*-1) 0 0 calc(var(--gap)*-1);width:calc(100% + var(--gap))}header nav ul>*{margin:var(--gap)}header nav ul a.svg{background:none;display:inline-grid;height:100%;place-items:center;text-shadow:none}:global(header nav ul a.svg svg){fill:currentColor}:global(header nav ul a.svg:hover svg){fill:var(--color-accent)}header nav{padding:var(--size-300) 0;width:100vw}@media (min-width:36rem){header{padding:var(--size-500) 0}header .logo{margin-bottom:0}}@media (min-width:48rem){header .logo{text-align:left;width:auto}header nav{width:auto}}</style>\\n"],"names":[],"mappings":"AAuBO,mDAAM,CAAC,iBAAiB,IAAI,aAAa,CAAC,CAAC,MAAM,IAAI,kBAAkB,CAAC,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,cAAc,IAAI,UAAU,CAAC,CAAC,WAAW,IAAI,CAAC,WAAW,IAAI,CAAC,QAAQ,IAAI,UAAU,CAAC,CAAC,CAAC,CAAC,qBAAM,CAAC,mCAAK,CAAC,WAAW,IAAI,CAAC,WAAW,MAAM,CAAC,MAAM,IAAI,CAAC,oBAAK,CAAC,+BAAC,CAAC,iBAAiB,IAAI,CAAC,gBAAgB,IAAI,CAAC,YAAY,IAAI,CAAC,qBAAM,CAAC,KAAK,CAAC,iCAAG,CAAC,aAAa,GAAG,CAAC,EAAE,CAAC,WAAW,IAAI,CAAC,qBAAM,CAAC,GAAG,CAAC,gCAAE,CAAC,MAAM,eAAe,CAAC,QAAQ,IAAI,CAAC,UAAU,IAAI,CAAC,gBAAgB,MAAM,CAAC,WAAW,IAAI,CAAC,OAAO,KAAK,IAAI,KAAK,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,KAAK,IAAI,KAAK,CAAC,CAAC,EAAE,CAAC,CAAC,MAAM,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,KAAK,CAAC,CAAC,CAAC,qBAAM,CAAC,GAAG,CAAC,iBAAE,CAAC,eAAC,CAAC,OAAO,IAAI,KAAK,CAAC,CAAC,qBAAM,CAAC,GAAG,CAAC,EAAE,CAAC,CAAC,kCAAI,CAAC,WAAW,IAAI,CAAC,QAAQ,WAAW,CAAC,OAAO,IAAI,CAAC,YAAY,MAAM,CAAC,YAAY,IAAI,CAAC,AAAQ,uBAAuB,AAAC,CAAC,KAAK,YAAY,CAAC,AAAQ,6BAA6B,AAAC,CAAC,KAAK,IAAI,cAAc,CAAC,CAAC,qBAAM,CAAC,iCAAG,CAAC,QAAQ,IAAI,UAAU,CAAC,CAAC,CAAC,CAAC,MAAM,KAAK,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,mDAAM,CAAC,QAAQ,IAAI,UAAU,CAAC,CAAC,CAAC,CAAC,qBAAM,CAAC,mCAAK,CAAC,cAAc,CAAC,CAAC,CAAC,MAAM,AAAC,WAAW,KAAK,CAAC,CAAC,qBAAM,CAAC,mCAAK,CAAC,WAAW,IAAI,CAAC,MAAM,IAAI,CAAC,qBAAM,CAAC,iCAAG,CAAC,MAAM,IAAI,CAAC,CAAC"}`
};
var Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$j);
  return `<header class="${"svelte-10xatuh"}"><div class="${"wrapper"}"><div class="${"logo svelte-10xatuh"}"><a href="${"/"}" class="${"svelte-10xatuh"}"><img src="${"/img/openspacedata-logo.png"}" alt="${""}" height="${"64"}" width="${"140"}" class="${"svelte-10xatuh"}"></a></div>
    <nav class="${"svelte-10xatuh"}"><ul class="${"svelte-10xatuh"}"><li class="${"svelte-10xatuh"}"><a href="${"/about"}">About</a></li>
        <li class="${"svelte-10xatuh"}"><a href="${"/help"}">Help</a></li>
        <li class="${"svelte-10xatuh"}"><a href="${"https://github.com/OpenSpaceData"}" class="${"svg svelte-10xatuh"}">${validate_component(Inline_svg, "InlineSVG").$$render($$result, { src: github }, {}, {})}</a></li></ul></nav></div>
</header>`;
});
var css$i = {
  code: "footer.svelte-igsor9{background-color:var(--color-black);color:var(--light-text-color);font-size:var(--size-400);padding:var(--size-400) 0}p.svelte-igsor9{margin:0}",
  map: '{"version":3,"file":"Footer.svelte","sources":["Footer.svelte"],"sourcesContent":["<script>\\n<\/script>\\n\\n<footer>\\n  <div class=\\"wrapper\\">\\n    <p>\\n      <a href=\\"https://www.niklasjordan.com/privacy\\">Privacy statement</a> |\\n      <a href=\\"https://www.niklasjordan.com/imprint\\">Imprint</a>\\n    </p>\\n  </div>\\n</footer>\\n\\n<style>footer{background-color:var(--color-black);color:var(--light-text-color);font-size:var(--size-400);padding:var(--size-400) 0}p{margin:0}</style>\\n"],"names":[],"mappings":"AAYO,oBAAM,CAAC,iBAAiB,IAAI,aAAa,CAAC,CAAC,MAAM,IAAI,kBAAkB,CAAC,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,QAAQ,IAAI,UAAU,CAAC,CAAC,CAAC,CAAC,eAAC,CAAC,OAAO,CAAC,CAAC"}'
};
var Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$i);
  return `<footer class="${"svelte-igsor9"}"><div class="${"wrapper"}"><p class="${"svelte-igsor9"}"><a href="${"https://www.niklasjordan.com/privacy"}">Privacy statement</a> |
      <a href="${"https://www.niklasjordan.com/imprint"}">Imprint</a></p></div>
</footer>`;
});
var subscriber_queue2 = [];
function writable2(value, start = noop2) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal2(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue2.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue2.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue2.length; i += 2) {
            subscriber_queue2[i][0](subscriber_queue2[i + 1]);
          }
          subscriber_queue2.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop2) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop2;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
var defaults = {
  duration: 4e3,
  initial: 1,
  next: 0,
  dismissable: true,
  pausable: false,
  reversed: false,
  intro: { x: 256 },
  theme: {}
};
var createToast = () => {
  const { subscribe: subscribe2, update } = writable2([]);
  let count = 0;
  const options2 = {};
  const _obj = (obj) => obj instanceof Object;
  const push = (msg, opts = {}) => {
    const param = { target: "default", ..._obj(msg) ? msg : { ...opts, msg } };
    const conf = options2[param.target] || {};
    const entry = { ...defaults, ...conf, ...param, theme: { ...conf.theme, ...param.theme }, id: ++count };
    update((n) => entry.reversed ? [...n, entry] : [entry, ...n]);
    return count;
  };
  const pop = (id) => {
    update((n) => {
      if (!n.length || id === 0)
        return [];
      if (_obj(id))
        return n.filter((i) => id(i));
      const target = id || Math.max(...n.map((i) => i.id));
      return n.filter((i) => i.id !== target);
    });
  };
  const set = (id, opts = {}) => {
    const param = _obj(id) ? { ...id } : { ...opts, id };
    update((n) => {
      const idx = n.findIndex((i) => i.id === param.id);
      if (idx > -1) {
        n[idx] = { ...n[idx], ...param };
      }
      return n;
    });
  };
  const _init = (target = "default", opts = {}) => {
    options2[target] = opts;
    return options2;
  };
  return { subscribe: subscribe2, push, pop, set, _init };
};
var toast = createToast();
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function get_interpolator(a, b) {
  if (a === b || a !== a)
    return () => a;
  const type = typeof a;
  if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    throw new Error("Cannot interpolate values of different type");
  }
  if (Array.isArray(a)) {
    const arr = b.map((bi, i) => {
      return get_interpolator(a[i], bi);
    });
    return (t) => arr.map((fn) => fn(t));
  }
  if (type === "object") {
    if (!a || !b)
      throw new Error("Object cannot be null");
    if (is_date(a) && is_date(b)) {
      a = a.getTime();
      b = b.getTime();
      const delta = b - a;
      return (t) => new Date(a + t * delta);
    }
    const keys = Object.keys(b);
    const interpolators = {};
    keys.forEach((key) => {
      interpolators[key] = get_interpolator(a[key], b[key]);
    });
    return (t) => {
      const result = {};
      keys.forEach((key) => {
        result[key] = interpolators[key](t);
      });
      return result;
    };
  }
  if (type === "number") {
    const delta = b - a;
    return (t) => a + t * delta;
  }
  throw new Error(`Cannot interpolate ${type} values`);
}
function tweened(value, defaults2 = {}) {
  const store = writable2(value);
  let task;
  let target_value = value;
  function set(new_value, opts) {
    if (value == null) {
      store.set(value = new_value);
      return Promise.resolve();
    }
    target_value = new_value;
    let previous_task = task;
    let started = false;
    let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults2), opts);
    if (duration === 0) {
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      store.set(value = target_value);
      return Promise.resolve();
    }
    const start = now() + delay;
    let fn;
    task = loop((now2) => {
      if (now2 < start)
        return true;
      if (!started) {
        fn = interpolate(value, new_value);
        if (typeof duration === "function")
          duration = duration(value, new_value);
        started = true;
      }
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      const elapsed = now2 - start;
      if (elapsed > duration) {
        store.set(value = new_value);
        return false;
      }
      store.set(value = fn(easing(elapsed / duration)));
      return true;
    });
    return task.promise;
  }
  return {
    set,
    update: (fn, opts) => set(fn(target_value, value), opts),
    subscribe: store.subscribe
  };
}
var css$h = {
  code: "._toastItem.svelte-23qy1f{-webkit-tap-highlight-color:transparent;align-items:center;background:var(--toastBackground,rgba(66,66,66,.9));border-radius:var(--toastBorderRadius,.125rem);box-shadow:var(--toastBoxShadow,0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -1px rgba(0,0,0,.06));color:var(--toastColor,#fff);display:flex;flex-direction:row;height:var(--toastHeight,auto);margin:var(--toastMargin,0 0 .5rem 0);min-height:var(--toastMinHeight,3.5rem);position:relative;width:var(--toastWidth,16rem);will-change:transform,opacity}._toastMsg.svelte-23qy1f{flex:1 1 0%;padding:var(--toastMsgPadding,.75rem .5rem)}._toastMsg.svelte-23qy1f a,.pe.svelte-23qy1f{pointer-events:auto}._toastBtn.svelte-23qy1f{align-items:center;cursor:pointer;display:flex;font:1rem sans-serif;height:100%;justify-content:center;outline:none;width:2rem}._toastBar.svelte-23qy1f{-webkit-appearance:none;-moz-appearance:none;appearance:none;background:transparent;border:none;bottom:0;display:block;height:6px;position:absolute;width:100%}._toastBar.svelte-23qy1f::-webkit-progress-bar{background:transparent}._toastBar.svelte-23qy1f::-webkit-progress-value{background:var(--toastProgressBackground,rgba(33,150,243,.75))}._toastBar.svelte-23qy1f::-moz-progress-bar{background:var(--toastProgressBackground,rgba(33,150,243,.75))}",
  map: `{"version":3,"file":"ToastItem.svelte","sources":["ToastItem.svelte"],"sourcesContent":["<script>\\nimport { tweened } from 'svelte/motion'\\nimport { linear } from 'svelte/easing'\\nimport { toast } from './stores.js'\\n\\nexport let item\\n\\nconst progress = tweened(item.initial, { duration: item.duration, easing: linear })\\nconst autoclose = () => {\\n  if ($progress === 1 || $progress === 0) {\\n    toast.pop(item.id)\\n  }\\n}\\nlet prev = item.initial\\n\\n$: if (prev !== item.next) {\\n  progress.set(item.next).then(autoclose)\\n  prev = item.next\\n}\\n\\nconst pause = () => {\\n  if (item.pausable) {\\n    progress.set($progress, { duration: 0 })\\n  }\\n}\\n\\nconst play = () => {\\n  if (item.pausable) {\\n    const pct = ($progress - item.initial) / (item.next - item.initial)\\n    const remaining = item.duration - (item.duration * pct)\\n    progress.set(item.next, { duration: remaining }).then(autoclose)\\n  }\\n}\\n\\nconst getProps = () => {\\n  const { props = {}, sendIdTo } = item.component\\n  if (sendIdTo) {\\n    props[sendIdTo] = item.id\\n  }\\n  return props\\n}\\n\\n// \`progress\` has been renamed to \`next\`; shim included for backward compatibility, to remove in next major\\n$: if (typeof item.progress !== 'undefined') {\\n  item.next = item.progress\\n}\\n<\/script>\\n\\n<style>._toastItem{-webkit-tap-highlight-color:transparent;align-items:center;background:var(--toastBackground,rgba(66,66,66,.9));border-radius:var(--toastBorderRadius,.125rem);box-shadow:var(--toastBoxShadow,0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -1px rgba(0,0,0,.06));color:var(--toastColor,#fff);display:flex;flex-direction:row;height:var(--toastHeight,auto);margin:var(--toastMargin,0 0 .5rem 0);min-height:var(--toastMinHeight,3.5rem);position:relative;width:var(--toastWidth,16rem);will-change:transform,opacity}._toastMsg{flex:1 1 0%;padding:var(--toastMsgPadding,.75rem .5rem)}._toastMsg :global(a),.pe{pointer-events:auto}._toastBtn{align-items:center;cursor:pointer;display:flex;font:1rem sans-serif;height:100%;justify-content:center;outline:none;width:2rem}._toastBar{-webkit-appearance:none;-moz-appearance:none;appearance:none;background:transparent;border:none;bottom:0;display:block;height:6px;position:absolute;width:100%}._toastBar::-webkit-progress-bar{background:transparent}._toastBar::-webkit-progress-value{background:var(--toastProgressBackground,rgba(33,150,243,.75))}._toastBar::-moz-progress-bar{background:var(--toastProgressBackground,rgba(33,150,243,.75))}</style>\\n\\n<div class=\\"_toastItem\\" class:pe={item.pausable} on:mouseenter={pause} on:mouseleave={play}>\\n  <div class=\\"_toastMsg\\" class:pe={item.component}>\\n    {#if item.component}\\n    <svelte:component this={item.component.src} {...getProps()} />\\n    {:else}\\n    {@html item.msg}\\n    {/if}\\n  </div>\\n  {#if item.dismissable}\\n  <div class=\\"_toastBtn pe\\" role=\\"button\\" tabindex=\\"-1\\" on:click={() => toast.pop(item.id)}>\u2715</div>\\n  {/if}\\n  <progress class=\\"_toastBar\\" value={$progress}></progress>\\n</div>\\n"],"names":[],"mappings":"AAgDO,yBAAW,CAAC,4BAA4B,WAAW,CAAC,YAAY,MAAM,CAAC,WAAW,IAAI,iBAAiB,CAAC,iBAAiB,CAAC,CAAC,cAAc,IAAI,mBAAmB,CAAC,OAAO,CAAC,CAAC,WAAW,IAAI,gBAAgB,CAAC,4DAA4D,CAAC,CAAC,MAAM,IAAI,YAAY,CAAC,IAAI,CAAC,CAAC,QAAQ,IAAI,CAAC,eAAe,GAAG,CAAC,OAAO,IAAI,aAAa,CAAC,IAAI,CAAC,CAAC,OAAO,IAAI,aAAa,CAAC,WAAW,CAAC,CAAC,WAAW,IAAI,gBAAgB,CAAC,MAAM,CAAC,CAAC,SAAS,QAAQ,CAAC,MAAM,IAAI,YAAY,CAAC,KAAK,CAAC,CAAC,YAAY,SAAS,CAAC,OAAO,CAAC,wBAAU,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,QAAQ,IAAI,iBAAiB,CAAC,YAAY,CAAC,CAAC,wBAAU,CAAC,AAAQ,CAAC,AAAC,CAAC,iBAAG,CAAC,eAAe,IAAI,CAAC,wBAAU,CAAC,YAAY,MAAM,CAAC,OAAO,OAAO,CAAC,QAAQ,IAAI,CAAC,KAAK,IAAI,CAAC,UAAU,CAAC,OAAO,IAAI,CAAC,gBAAgB,MAAM,CAAC,QAAQ,IAAI,CAAC,MAAM,IAAI,CAAC,wBAAU,CAAC,mBAAmB,IAAI,CAAC,gBAAgB,IAAI,CAAC,WAAW,IAAI,CAAC,WAAW,WAAW,CAAC,OAAO,IAAI,CAAC,OAAO,CAAC,CAAC,QAAQ,KAAK,CAAC,OAAO,GAAG,CAAC,SAAS,QAAQ,CAAC,MAAM,IAAI,CAAC,wBAAU,sBAAsB,CAAC,WAAW,WAAW,CAAC,wBAAU,wBAAwB,CAAC,WAAW,IAAI,yBAAyB,CAAC,oBAAoB,CAAC,CAAC,wBAAU,mBAAmB,CAAC,WAAW,IAAI,yBAAyB,CAAC,oBAAoB,CAAC,CAAC"}`
};
var ToastItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $progress, $$unsubscribe_progress;
  let { item } = $$props;
  const progress = tweened(item.initial, { duration: item.duration, easing: identity });
  $$unsubscribe_progress = subscribe(progress, (value) => $progress = value);
  const autoclose = () => {
    if ($progress === 1 || $progress === 0) {
      toast.pop(item.id);
    }
  };
  let prev = item.initial;
  const getProps = () => {
    const { props = {}, sendIdTo } = item.component;
    if (sendIdTo) {
      props[sendIdTo] = item.id;
    }
    return props;
  };
  if ($$props.item === void 0 && $$bindings.item && item !== void 0)
    $$bindings.item(item);
  $$result.css.add(css$h);
  {
    if (typeof item.progress !== "undefined") {
      item.next = item.progress;
    }
  }
  {
    if (prev !== item.next) {
      progress.set(item.next).then(autoclose);
      prev = item.next;
    }
  }
  $$unsubscribe_progress();
  return `<div class="${["_toastItem svelte-23qy1f", item.pausable ? "pe" : ""].join(" ").trim()}"><div class="${["_toastMsg svelte-23qy1f", item.component ? "pe" : ""].join(" ").trim()}">${item.component ? `${validate_component(item.component.src || missing_component, "svelte:component").$$render($$result, Object.assign(getProps()), {}, {})}` : `<!-- HTML_TAG_START -->${item.msg}<!-- HTML_TAG_END -->`}</div>
  ${item.dismissable ? `<div class="${"_toastBtn pe svelte-23qy1f"}" role="${"button"}" tabindex="${"-1"}">\u2715</div>` : ``}
  <progress class="${"_toastBar svelte-23qy1f"}"${add_attribute("value", $progress, 0)}></progress></div>`;
});
var css$g = {
  code: "ul.svelte-17xpf3u{bottom:var(--toastContainerBottom,auto);left:var(--toastContainerLeft,auto);list-style-type:none;margin:0;padding:0;pointer-events:none;position:fixed;right:var(--toastContainerRight,2rem);top:var(--toastContainerTop,1.5rem);z-index:9999}",
  map: `{"version":3,"file":"SvelteToast.svelte","sources":["SvelteToast.svelte"],"sourcesContent":["<script>\\nimport { fade, fly } from 'svelte/transition'\\nimport { flip } from 'svelte/animate'\\nimport { toast } from './stores.js'\\nimport ToastItem from './ToastItem.svelte'\\n\\nexport let options = {}\\nexport let target = 'default'\\n\\n$: toast._init(target, options)\\n\\nlet items\\n$: items = $toast.filter(i => i.target === target)\\n\\nconst getCss = theme => Object.keys(theme).reduce((a, c) => \`\${a}\${c}:\${theme[c]};\`, '')\\n<\/script>\\n\\n<style>ul{bottom:var(--toastContainerBottom,auto);left:var(--toastContainerLeft,auto);list-style-type:none;margin:0;padding:0;pointer-events:none;position:fixed;right:var(--toastContainerRight,2rem);top:var(--toastContainerTop,1.5rem);z-index:9999}</style>\\n\\n<ul>\\n  {#each items as item (item.id)}\\n  <li in:fly={item.intro} out:fade animate:flip={{ duration: 200 }} style={getCss(item.theme)}>\\n    <ToastItem {item} />\\n  </li>\\n  {/each}\\n</ul>\\n"],"names":[],"mappings":"AAiBO,iBAAE,CAAC,OAAO,IAAI,sBAAsB,CAAC,IAAI,CAAC,CAAC,KAAK,IAAI,oBAAoB,CAAC,IAAI,CAAC,CAAC,gBAAgB,IAAI,CAAC,OAAO,CAAC,CAAC,QAAQ,CAAC,CAAC,eAAe,IAAI,CAAC,SAAS,KAAK,CAAC,MAAM,IAAI,qBAAqB,CAAC,IAAI,CAAC,CAAC,IAAI,IAAI,mBAAmB,CAAC,MAAM,CAAC,CAAC,QAAQ,IAAI,CAAC"}`
};
var SvelteToast = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $toast, $$unsubscribe_toast;
  $$unsubscribe_toast = subscribe(toast, (value) => $toast = value);
  let { options: options2 = {} } = $$props;
  let { target = "default" } = $$props;
  let items;
  const getCss = (theme) => Object.keys(theme).reduce((a, c) => `${a}${c}:${theme[c]};`, "");
  if ($$props.options === void 0 && $$bindings.options && options2 !== void 0)
    $$bindings.options(options2);
  if ($$props.target === void 0 && $$bindings.target && target !== void 0)
    $$bindings.target(target);
  $$result.css.add(css$g);
  {
    toast._init(target, options2);
  }
  items = $toast.filter((i) => i.target === target);
  $$unsubscribe_toast();
  return `<ul class="${"svelte-17xpf3u"}">${each(items, (item) => `<li${add_attribute("style", getCss(item.theme), 0)}>${validate_component(ToastItem, "ToastItem").$$render($$result, { item }, {}, {})}
  </li>`)}</ul>`;
});
var css$f = {
  code: "main.flow.svelte-u6zckm{--flow-space:var(--size-900)}",
  map: `{"version":3,"file":"__layout.svelte","sources":["__layout.svelte"],"sourcesContent":["<script>\\n  import Header from '$lib/Header.svelte'\\n  import Footer from '$lib/Footer.svelte'\\n  import {SvelteToast} from '@zerodevx/svelte-toast'\\n  import '../app.css'\\n<\/script>\\n\\n<svelte:head>\\n  <title>OpenSpaceData</title>\\n  <link\\n    rel=\\"preload\\"\\n    href=\\"/font/noway-regular-webfont.woff2\\"\\n    as=\\"font\\"\\n    type=\\"font/woff2\\"\\n    crossorigin=\\"anonymous\\" />\\n  <link\\n    rel=\\"preload\\"\\n    href=\\"/font/noway-bold-webfont.woff2\\"\\n    as=\\"font\\"\\n    type=\\"font/woff2\\"\\n    crossorigin=\\"anonymous\\" />\\n</svelte:head>\\n\\n<Header />\\n<SvelteToast options={{reversed: true, intro: {y: 192}}} />\\n<main class=\\"flow\\">\\n  <slot />\\n</main>\\n<Footer />\\n\\n<style>main.flow{--flow-space:var(--size-900)}</style>\\n"],"names":[],"mappings":"AA8BO,IAAI,mBAAK,CAAC,aAAa,eAAe,CAAC"}`
};
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$f);
  return `${$$result.head += `${$$result.title = `<title>OpenSpaceData</title>`, ""}<link rel="${"preload"}" href="${"/font/noway-regular-webfont.woff2"}" as="${"font"}" type="${"font/woff2"}" crossorigin="${"anonymous"}" data-svelte="svelte-1y9u1hs"><link rel="${"preload"}" href="${"/font/noway-bold-webfont.woff2"}" as="${"font"}" type="${"font/woff2"}" crossorigin="${"anonymous"}" data-svelte="svelte-1y9u1hs">`, ""}

${validate_component(Header, "Header").$$render($$result, {}, {}, {})}
${validate_component(SvelteToast, "SvelteToast").$$render($$result, {
    options: { reversed: true, intro: { y: 192 } }
  }, {}, {})}
<main class="${"flow svelte-u6zckm"}">${slots.default ? slots.default({}) : ``}</main>
${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
function load$3({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape2(status)}</h1>

<pre>${escape2(error22.message)}</pre>



${error22.frame ? `<pre>${escape2(error22.frame)}</pre>` : ``}
${error22.stack ? `<pre>${escape2(error22.stack)}</pre>` : ``}`;
});
var error$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load: load$3
});
var category$6 = writable2();
var choice = writable2();
var location2 = writable2();
var range = writable2({
  type: "latest"
});
var css$e = {
  code: ".heading.svelte-1m4ioec.svelte-1m4ioec{align-items:center;display:grid;gap:var(--size-400);grid-template-columns:120px 1fr;justify-content:center}.step.svelte-1m4ioec.svelte-1m4ioec{aspect-ratio:1;background:var(--color-black);border-radius:100%;color:var(--color-white);display:inline-grid;font-family:var(--heading-font);font-size:var(--size-900);height:100px;margin:auto;place-items:center;text-align:center;width:100px}.heading.svelte-1m4ioec .title.svelte-1m4ioec{padding:var(--size-400) 0}h2.svelte-1m4ioec.svelte-1m4ioec{font-size:var(--size-800);margin:0}.step.svelte-1m4ioec span.svelte-1m4ioec{line-height:1}span.details.svelte-1m4ioec.svelte-1m4ioec{font-style:italic}",
  map: '{"version":3,"file":"NumberedHeading.svelte","sources":["NumberedHeading.svelte"],"sourcesContent":["<script>\\n  export let step\\n  export let text\\n  export let details\\n<\/script>\\n\\n<div class=\\"heading\\">\\n  <div class=\\"step\\"><span>{step}</span></div>\\n  <div class=\\"title\\">\\n    <h2>{text}</h2>\\n    {#if details}\\n      <!-- content here -->\\n      <span class=\\"details\\">{details}</span>\\n    {/if}\\n  </div>\\n</div>\\n\\n<style>.heading{align-items:center;display:grid;gap:var(--size-400);grid-template-columns:120px 1fr;justify-content:center}.step{aspect-ratio:1;background:var(--color-black);border-radius:100%;color:var(--color-white);display:inline-grid;font-family:var(--heading-font);font-size:var(--size-900);height:100px;margin:auto;place-items:center;text-align:center;width:100px}.heading .title{padding:var(--size-400) 0}.heading p{margin-bottom:0}h2{font-size:var(--size-800);margin:0}.step span{line-height:1}span.details{font-style:italic}</style>\\n"],"names":[],"mappings":"AAiBO,sCAAQ,CAAC,YAAY,MAAM,CAAC,QAAQ,IAAI,CAAC,IAAI,IAAI,UAAU,CAAC,CAAC,sBAAsB,KAAK,CAAC,GAAG,CAAC,gBAAgB,MAAM,CAAC,mCAAK,CAAC,aAAa,CAAC,CAAC,WAAW,IAAI,aAAa,CAAC,CAAC,cAAc,IAAI,CAAC,MAAM,IAAI,aAAa,CAAC,CAAC,QAAQ,WAAW,CAAC,YAAY,IAAI,cAAc,CAAC,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,OAAO,KAAK,CAAC,OAAO,IAAI,CAAC,YAAY,MAAM,CAAC,WAAW,MAAM,CAAC,MAAM,KAAK,CAAC,uBAAQ,CAAC,qBAAM,CAAC,QAAQ,IAAI,UAAU,CAAC,CAAC,CAAC,CAAC,AAA2B,gCAAE,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,OAAO,CAAC,CAAC,oBAAK,CAAC,mBAAI,CAAC,YAAY,CAAC,CAAC,IAAI,sCAAQ,CAAC,WAAW,MAAM,CAAC"}'
};
var NumberedHeading = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { step } = $$props;
  let { text } = $$props;
  let { details } = $$props;
  if ($$props.step === void 0 && $$bindings.step && step !== void 0)
    $$bindings.step(step);
  if ($$props.text === void 0 && $$bindings.text && text !== void 0)
    $$bindings.text(text);
  if ($$props.details === void 0 && $$bindings.details && details !== void 0)
    $$bindings.details(details);
  $$result.css.add(css$e);
  return `<div class="${"heading svelte-1m4ioec"}"><div class="${"step svelte-1m4ioec"}"><span class="${"svelte-1m4ioec"}">${escape2(step)}</span></div>
  <div class="${"title svelte-1m4ioec"}"><h2 class="${"svelte-1m4ioec"}">${escape2(text)}</h2>
    ${details ? `
      <span class="${"details svelte-1m4ioec"}">${escape2(details)}</span>` : ``}</div>
</div>`;
});
var css$d = {
  code: "button.svelte-15xzp9t.svelte-15xzp9t{background:none;border:none;color:var(--color-primary);cursor:pointer;display:inline;font-family:var(--heading-font);font-size:var(--size-300);font-size:var(--size-500);padding:0;text-decoration:underline;vertical-align:top}button.svelte-15xzp9t.svelte-15xzp9t:hover{color:var(--color-accent);text-decoration:none}.heading.svelte-15xzp9t.svelte-15xzp9t{align-content:center;display:grid;gap:var(--size-400);grid-template-columns:120px 1fr;justify-content:center}.step.svelte-15xzp9t.svelte-15xzp9t{aspect-ratio:1;background:var(--color-black);border-radius:100%;color:var(--color-white);display:inline-grid;font-family:var(--heading-font);font-size:var(--size-800);height:100px;margin:auto;place-items:center;text-align:center;width:100px}.heading.svelte-15xzp9t .title.svelte-15xzp9t{padding:var(--size-400) 0}h2.svelte-15xzp9t.svelte-15xzp9t{font-size:var(--size-800);margin:0}#map.svelte-15xzp9t.svelte-15xzp9t{border-radius:100%;height:100px;width:100px}#vegetation.svelte-15xzp9t.svelte-15xzp9t{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/forest.jpg)}#floods.svelte-15xzp9t.svelte-15xzp9t,#vegetation.svelte-15xzp9t.svelte-15xzp9t{background-position:50%;background-size:cover;height:100px;width:100px}#floods.svelte-15xzp9t.svelte-15xzp9t{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/earth.jpg)}#wildfire.svelte-15xzp9t.svelte-15xzp9t{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/wildfire.jpg)}#water.svelte-15xzp9t.svelte-15xzp9t,#wildfire.svelte-15xzp9t.svelte-15xzp9t{background-position:50%;background-size:cover;height:100px;width:100px}#water.svelte-15xzp9t.svelte-15xzp9t{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/wave.jpg)}#urban.svelte-15xzp9t.svelte-15xzp9t{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/city.jpg)}#snow.svelte-15xzp9t.svelte-15xzp9t,#urban.svelte-15xzp9t.svelte-15xzp9t{background-position:50%;background-size:cover;height:100px;width:100px}#snow.svelte-15xzp9t.svelte-15xzp9t{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/iceland.jpg)}#time.svelte-15xzp9t.svelte-15xzp9t{background-image:url(/img/calendar.png);background-position:50%;background-repeat:no-repeat;background-size:contain;height:100px;width:100px}",
  map: `{"version":3,"file":"ProgressHeading.svelte","sources":["ProgressHeading.svelte"],"sourcesContent":["<script>\\n  import {choice as selected, location, range} from '$lib/store'\\n  export let section\\n  import edit from '$lib/svg/edit.svg'\\n  import InlineSVG from 'svelte-inline-svg'\\n\\n  const goBack = step => {\\n    if (step === 1) {\\n      selected.set(null)\\n    }\\n\\n    if (step === 2) {\\n      location.set(null)\\n    }\\n\\n    if (step === 3) {\\n      range.set(null)\\n    }\\n  }\\n<\/script>\\n\\n<div class=\\"heading\\">\\n  {#if section === 'category'}\\n    <div id={$selected.parentFolder} class=\\"step\\" />\\n  {/if}\\n  {#if section === 'location'}\\n    <div id=\\"location\\" class=\\"step\\">\\n      <!-- pin-s+555555($location.center) -->\\n      <img src=\\"https://osd-static-map.fershad.workers.dev/?bbox={$location.bbox}\\" alt=\\"\\" id=\\"map\\" />\\n    </div>\\n  {/if}\\n  <div class=\\"title\\">\\n    {#if section === 'category'}\\n      <h2>{$selected.heading}</h2>\\n      <button on:click={() => goBack(1)}>Edit</button>\\n    {/if}\\n    {#if section === 'location'}\\n      <!-- content here -->\\n      <h2>{$location.place_name}</h2>\\n      <button on:click={() => goBack(2)}>Edit</button>\\n    {/if}\\n    <!-- content here -->\\n  </div>\\n</div>\\n\\n<style>button{background:none;border:none;color:var(--color-primary);cursor:pointer;display:inline;font-family:var(--heading-font);font-size:var(--size-300);font-size:var(--size-500);padding:0;text-decoration:underline;vertical-align:top}button:hover{color:var(--color-accent);text-decoration:none}.heading{align-content:center;display:grid;gap:var(--size-400);grid-template-columns:120px 1fr;justify-content:center}.step{aspect-ratio:1;background:var(--color-black);border-radius:100%;color:var(--color-white);display:inline-grid;font-family:var(--heading-font);font-size:var(--size-800);height:100px;margin:auto;place-items:center;text-align:center;width:100px}.heading .title{padding:var(--size-400) 0}.heading p{margin-bottom:0}h2{font-size:var(--size-800);margin:0}#map{border-radius:100%;height:100px;width:100px}#vegetation{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/forest.jpg)}#floods,#vegetation{background-position:50%;background-size:cover;height:100px;width:100px}#floods{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/earth.jpg)}#wildfire{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/wildfire.jpg)}#water,#wildfire{background-position:50%;background-size:cover;height:100px;width:100px}#water{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/wave.jpg)}#urban{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/city.jpg)}#snow,#urban{background-position:50%;background-size:cover;height:100px;width:100px}#snow{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/iceland.jpg)}#time{background-image:url(/img/calendar.png);background-position:50%;background-repeat:no-repeat;background-size:contain;height:100px;width:100px}</style>\\n"],"names":[],"mappings":"AA6CO,oCAAM,CAAC,WAAW,IAAI,CAAC,OAAO,IAAI,CAAC,MAAM,IAAI,eAAe,CAAC,CAAC,OAAO,OAAO,CAAC,QAAQ,MAAM,CAAC,YAAY,IAAI,cAAc,CAAC,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,QAAQ,CAAC,CAAC,gBAAgB,SAAS,CAAC,eAAe,GAAG,CAAC,oCAAM,MAAM,CAAC,MAAM,IAAI,cAAc,CAAC,CAAC,gBAAgB,IAAI,CAAC,sCAAQ,CAAC,cAAc,MAAM,CAAC,QAAQ,IAAI,CAAC,IAAI,IAAI,UAAU,CAAC,CAAC,sBAAsB,KAAK,CAAC,GAAG,CAAC,gBAAgB,MAAM,CAAC,mCAAK,CAAC,aAAa,CAAC,CAAC,WAAW,IAAI,aAAa,CAAC,CAAC,cAAc,IAAI,CAAC,MAAM,IAAI,aAAa,CAAC,CAAC,QAAQ,WAAW,CAAC,YAAY,IAAI,cAAc,CAAC,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,OAAO,KAAK,CAAC,OAAO,IAAI,CAAC,YAAY,MAAM,CAAC,WAAW,MAAM,CAAC,MAAM,KAAK,CAAC,uBAAQ,CAAC,qBAAM,CAAC,QAAQ,IAAI,UAAU,CAAC,CAAC,CAAC,CAAC,AAA2B,gCAAE,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,OAAO,CAAC,CAAC,kCAAI,CAAC,cAAc,IAAI,CAAC,OAAO,KAAK,CAAC,MAAM,KAAK,CAAC,yCAAW,CAAC,iBAAiB,gBAAgB,MAAM,CAAC,WAAW,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,IAAI,eAAe,CAAC,CAAC,qCAAO,CAAC,yCAAW,CAAC,oBAAoB,GAAG,CAAC,gBAAgB,KAAK,CAAC,OAAO,KAAK,CAAC,MAAM,KAAK,CAAC,qCAAO,CAAC,iBAAiB,gBAAgB,MAAM,CAAC,WAAW,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,IAAI,cAAc,CAAC,CAAC,uCAAS,CAAC,iBAAiB,gBAAgB,MAAM,CAAC,WAAW,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,IAAI,iBAAiB,CAAC,CAAC,oCAAM,CAAC,uCAAS,CAAC,oBAAoB,GAAG,CAAC,gBAAgB,KAAK,CAAC,OAAO,KAAK,CAAC,MAAM,KAAK,CAAC,oCAAM,CAAC,iBAAiB,gBAAgB,MAAM,CAAC,WAAW,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,oCAAM,CAAC,iBAAiB,gBAAgB,MAAM,CAAC,WAAW,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,mCAAK,CAAC,oCAAM,CAAC,oBAAoB,GAAG,CAAC,gBAAgB,KAAK,CAAC,OAAO,KAAK,CAAC,MAAM,KAAK,CAAC,mCAAK,CAAC,iBAAiB,gBAAgB,MAAM,CAAC,WAAW,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,mCAAK,CAAC,iBAAiB,IAAI,iBAAiB,CAAC,CAAC,oBAAoB,GAAG,CAAC,kBAAkB,SAAS,CAAC,gBAAgB,OAAO,CAAC,OAAO,KAAK,CAAC,MAAM,KAAK,CAAC"}`
};
var ProgressHeading = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $selected, $$unsubscribe_selected;
  let $location, $$unsubscribe_location;
  $$unsubscribe_selected = subscribe(choice, (value) => $selected = value);
  $$unsubscribe_location = subscribe(location2, (value) => $location = value);
  let { section } = $$props;
  if ($$props.section === void 0 && $$bindings.section && section !== void 0)
    $$bindings.section(section);
  $$result.css.add(css$d);
  $$unsubscribe_selected();
  $$unsubscribe_location();
  return `<div class="${"heading svelte-15xzp9t"}">${section === "category" ? `<div${add_attribute("id", $selected.parentFolder, 0)} class="${"step svelte-15xzp9t"}"></div>` : ``}
  ${section === "location" ? `<div id="${"location"}" class="${"step svelte-15xzp9t"}">
      <img src="${"https://osd-static-map.fershad.workers.dev/?bbox=" + escape2($location.bbox)}" alt="${""}" id="${"map"}" class="${"svelte-15xzp9t"}"></div>` : ``}
  <div class="${"title svelte-15xzp9t"}">${section === "category" ? `<h2 class="${"svelte-15xzp9t"}">${escape2($selected.heading)}</h2>
      <button class="${"svelte-15xzp9t"}">Edit</button>` : ``}
    ${section === "location" ? `
      <h2 class="${"svelte-15xzp9t"}">${escape2($location.place_name)}</h2>
      <button class="${"svelte-15xzp9t"}">Edit</button>` : ``}
    </div>
</div>`;
});
var css$c = {
  code: "ul.indices.svelte-1mz5k0x.svelte-1mz5k0x.svelte-1mz5k0x{margin:0;padding:0}ul.indices.svelte-1mz5k0x li.svelte-1mz5k0x.svelte-1mz5k0x{align-items:center;border:2px solid #000;border-radius:15px;display:flex;height:auto;justify-content:space-between;list-style:none;margin:15px 0;padding:20px 16px;width:100%}.task.svelte-1mz5k0x.svelte-1mz5k0x.svelte-1mz5k0x,.task.svelte-1mz5k0x>span.svelte-1mz5k0x.svelte-1mz5k0x{transition:all .15s}.task.svelte-1mz5k0x>span.svelte-1mz5k0x.svelte-1mz5k0x{color:var(--color-dark-grey)}.selected.svelte-1mz5k0x>.task.svelte-1mz5k0x.svelte-1mz5k0x,.selected.svelte-1mz5k0x>.task.svelte-1mz5k0x>span.svelte-1mz5k0x{color:var(--color-black)}.action.svelte-1mz5k0x.svelte-1mz5k0x.svelte-1mz5k0x{align-items:center;display:flex;gap:1rem}.action.svelte-1mz5k0x>svg.svelte-1mz5k0x.svelte-1mz5k0x{height:3rem;width:5.5rem}button.svelte-1mz5k0x.svelte-1mz5k0x.svelte-1mz5k0x{border:2px solid #000;font-size:16px;padding:10px}button.take-indice.svelte-1mz5k0x.svelte-1mz5k0x.svelte-1mz5k0x{background:var(--color-primary);border-radius:12px;color:var(--light-text-color);cursor:pointer;font-family:nowayregular,-apple-system,BlinkMacSystemFont,sans-serif;padding:10px 12px}.selected.svelte-1mz5k0x.svelte-1mz5k0x.svelte-1mz5k0x{background:var(--color-accent);transition:all .3s}",
  map: `{"version":3,"file":"Case.svelte","sources":["Case.svelte"],"sourcesContent":["<script>\\n  import {choice, category} from './store'\\n  import {fade, fly} from 'svelte/transition'\\n  // const choices = $category.cases.options;\\n\\n  let selected\\n\\n  const capitalize = str => {\\n    return str.charAt(0).toUpperCase() + str.slice(1)\\n  }\\n\\n  const setChoice = option => {\\n    choice.set(option)\\n  }\\n\\n  export let choices\\n  const cases = choices.filter(d => d.parentFolder === $category.parentFolder)\\n<\/script>\\n\\n<div class=\\"container\\">\\n  <div class=\\"content\\">\\n    <!-- <p>{$category.cases.intro}</p> -->\\n    {#if cases}\\n      <!-- content here -->\\n      {#each cases as choice, index}\\n        <ul class=\\"indices\\">\\n          <li data-shadow class:selected={selected === index}>\\n            <div class=\\"task\\">\\n              <h2>{choice.heading}</h2>\\n              <span>Difficulty: {capitalize(choice.difficulty)}</span>\\n            </div>\\n            <div class=\\"action\\">\\n              <!-- <button class=\\"help\\" data-shadow=\\"\\">\\n\\t\\t\\t\\t\\t\\t\\t\\t<svg\\n\\t\\t\\t\\t\\t\\t\\t\\t\\txmlns=\\"http://www.w3.org/2000/svg\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t\\twidth=\\"24\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t\\theight=\\"24\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tviewBox=\\"0 0 24 24\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tfill=\\"none\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t><path\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tfill=\\"currentColor\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\td=\\"M12 4C9.243 4 7 6.243 7 9h2c0-1.654 1.346-3 3-3s3 1.346 3 3c0 1.069-.454 1.465-1.481 2.255-.382.294-.813.626-1.226 1.038C10.981 13.604 10.995 14.897 11 15v2h2v-2.009c0-.024.023-.601.707-1.284.32-.32.682-.598 1.031-.867C15.798 12.024 17 11.1 17 9 17 6.243 14.757 4 12 4zM11 18H13V20H11z\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/></svg\\n\\t\\t\\t\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t\\t</button> -->\\n              {#if !(selected === index)}\\n                <button\\n                  id={index}\\n                  data-shadow=\\"\\"\\n                  class=\\"take-indice\\"\\n                  on:click={() => {\\n                    selected = index\\n                    setChoice(choice)\\n                  }}>Take this</button>\\n              {:else}\\n                <svg\\n                  xmlns=\\"http://www.w3.org/2000/svg\\"\\n                  viewBox=\\"0 0 24 24\\"\\n                  fill=\\"none\\"\\n                  class=\\"selected\\"\\n                  ><path\\n                    fill=\\"var(--color-primary)\\"\\n                    d=\\"M10 15.586L6.707 12.293 5.293 13.707 10 18.414 19.707 8.707 18.293 7.293z\\" /></svg>\\n              {/if}\\n            </div>\\n          </li>\\n        </ul>\\n      {/each}\\n    {/if}\\n  </div>\\n</div>\\n\\n<style>ul.indices{margin:0;padding:0}ul.indices li{align-items:center;border:2px solid #000;border-radius:15px;display:flex;height:auto;justify-content:space-between;list-style:none;margin:15px 0;padding:20px 16px;width:100%}.task,.task>span{transition:all .15s}.task>span{color:var(--color-dark-grey)}.selected>.task,.selected>.task>span{color:var(--color-black)}.action{align-items:center;display:flex;gap:1rem}.action>svg{height:3rem;width:5.5rem}button{border:2px solid #000;font-size:16px;padding:10px}button.take-indice{background:var(--color-primary);border-radius:12px;color:var(--light-text-color);cursor:pointer;font-family:nowayregular,-apple-system,BlinkMacSystemFont,sans-serif;padding:10px 12px}button.help{align-items:center;border-radius:100%;display:grid;font-family:nowaybold,-apple-system,BlinkMacSystemFont,sans-serif;justify-content:center;place-items:center}.selected{background:var(--color-accent);transition:all .3s}</style>\\n"],"names":[],"mappings":"AAwEO,EAAE,qDAAQ,CAAC,OAAO,CAAC,CAAC,QAAQ,CAAC,CAAC,EAAE,uBAAQ,CAAC,gCAAE,CAAC,YAAY,MAAM,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,IAAI,CAAC,cAAc,IAAI,CAAC,QAAQ,IAAI,CAAC,OAAO,IAAI,CAAC,gBAAgB,aAAa,CAAC,WAAW,IAAI,CAAC,OAAO,IAAI,CAAC,CAAC,CAAC,QAAQ,IAAI,CAAC,IAAI,CAAC,MAAM,IAAI,CAAC,kDAAK,CAAC,oBAAK,CAAC,kCAAI,CAAC,WAAW,GAAG,CAAC,IAAI,CAAC,oBAAK,CAAC,kCAAI,CAAC,MAAM,IAAI,iBAAiB,CAAC,CAAC,wBAAS,CAAC,mCAAK,CAAC,wBAAS,CAAC,oBAAK,CAAC,mBAAI,CAAC,MAAM,IAAI,aAAa,CAAC,CAAC,oDAAO,CAAC,YAAY,MAAM,CAAC,QAAQ,IAAI,CAAC,IAAI,IAAI,CAAC,sBAAO,CAAC,iCAAG,CAAC,OAAO,IAAI,CAAC,MAAM,MAAM,CAAC,mDAAM,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,IAAI,CAAC,UAAU,IAAI,CAAC,QAAQ,IAAI,CAAC,MAAM,yDAAY,CAAC,WAAW,IAAI,eAAe,CAAC,CAAC,cAAc,IAAI,CAAC,MAAM,IAAI,kBAAkB,CAAC,CAAC,OAAO,OAAO,CAAC,YAAY,YAAY,CAAC,aAAa,CAAC,kBAAkB,CAAC,UAAU,CAAC,QAAQ,IAAI,CAAC,IAAI,CAAC,AAA2K,sDAAS,CAAC,WAAW,IAAI,cAAc,CAAC,CAAC,WAAW,GAAG,CAAC,GAAG,CAAC"}`
};
var Case$8 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $category, $$unsubscribe_category;
  $$unsubscribe_category = subscribe(category$6, (value) => $category = value);
  let selected;
  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  let { choices } = $$props;
  const cases = choices.filter((d2) => d2.parentFolder === $category.parentFolder);
  if ($$props.choices === void 0 && $$bindings.choices && choices !== void 0)
    $$bindings.choices(choices);
  $$result.css.add(css$c);
  $$unsubscribe_category();
  return `<div class="${"container"}"><div class="${"content"}">
    ${cases ? `
      ${each(cases, (choice2, index2) => `<ul class="${"indices svelte-1mz5k0x"}"><li data-shadow class="${["svelte-1mz5k0x", selected === index2 ? "selected" : ""].join(" ").trim()}"><div class="${"task svelte-1mz5k0x"}"><h2>${escape2(choice2.heading)}</h2>
              <span class="${"svelte-1mz5k0x"}">Difficulty: ${escape2(capitalize(choice2.difficulty))}</span></div>
            <div class="${"action svelte-1mz5k0x"}">
              ${!(selected === index2) ? `<button${add_attribute("id", index2, 0)} data-shadow="${""}" class="${"take-indice svelte-1mz5k0x"}">Take this</button>` : `<svg xmlns="${"http://www.w3.org/2000/svg"}" viewBox="${"0 0 24 24"}" fill="${"none"}" class="${"selected svelte-1mz5k0x"}"><path fill="${"var(--color-primary)"}" d="${"M10 15.586L6.707 12.293 5.293 13.707 10 18.414 19.707 8.707 18.293 7.293z"}"></path></svg>`}
            </div></li>
        </ul>`)}` : ``}</div>
</div>`;
});
var css$b = {
  code: "div.categories.svelte-1ooicql{--auto-grid-cols:3}button.svelte-1ooicql{align-items:flex-end;background-size:cover;border:2px solid #000;border-radius:15px;box-shadow:1px 2px 0 #000;box-sizing:border-box;cursor:pointer;display:flex;height:210px;list-style:none;margin-bottom:2%;padding:20px;text-decoration:none;transition-duration:.5s;transition-property:box-shadow;width:100%}button.svelte-1ooicql:hover{box-shadow:0 0 30px rgba(0,0,0,.5)}button.svelte-1ooicql{bottom:0;color:var(--light-text-color);font-family:nowaymedium,-apple-system,BlinkMacSystemFont,sans-serif;font-size:var(--size-600);overflow:hidden;padding:0;position:relative;text-align:left;text-shadow:rgba(0,0,0,.5) 0 0 5px}img.svelte-1ooicql{aspect-ratio:640/427;height:100%;left:0;-o-object-fit:cover;object-fit:cover;top:0;z-index:1}img.svelte-1ooicql,span.svelte-1ooicql{position:absolute}span.svelte-1ooicql{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.4),rgba(0,0,0,.7));font-size:var(--size-600);padding:var(--size-300);text-shadow:rgb(0 0 0/50%) 0 0 5px;width:100%;z-index:2}",
  map: `{"version":3,"file":"Category.svelte","sources":["Category.svelte"],"sourcesContent":["<script>\\n  import {category} from './store'\\n  import {fade, fly} from 'svelte/transition'\\n  // import { categories } from './data/categories';\\n  import Case from './Case.svelte'\\n  import Back from './BackToCategories.svelte'\\n\\n  const setChoice = option => {\\n    category.set(option)\\n  }\\n\\n  let choosing = false\\n  export let categories\\n  export let cases\\n<\/script>\\n\\n<div>\\n  {#if !choosing && categories}\\n    <!-- content here -->\\n    <div class=\\"auto-grid categories\\" out:fade|local={{duration: 150}} in:fade|local={{delay: 150}}>\\n      {#each categories as cat}\\n        <button\\n          on:click={() => {\\n            choosing = true\\n            setChoice(cat)\\n          }}>\\n          <img src={cat.image} alt=\\" \\" height=\\"206\\" width=\\"252\\" />\\n          <span>{cat.text}</span>\\n        </button>\\n      {/each}\\n    </div>\\n  {:else}\\n    <div out:fade={{duration: 150}} in:fade={{delay: 150}}>\\n      {#if choosing}\\n        <!-- content here -->\\n        <Back bind:choosing />\\n      {/if}\\n      <!-- else content here -->\\n      <Case choices={cases} />\\n    </div>\\n  {/if}\\n</div>\\n\\n<style>div.categories{--auto-grid-cols:3}button{align-items:flex-end;background-size:cover;border:2px solid #000;border-radius:15px;box-shadow:1px 2px 0 #000;box-sizing:border-box;cursor:pointer;display:flex;height:210px;list-style:none;margin-bottom:2%;padding:20px;text-decoration:none;transition-duration:.5s;transition-property:box-shadow;width:100%}button:hover{box-shadow:0 0 30px rgba(0,0,0,.5)}button{bottom:0;color:var(--light-text-color);font-family:nowaymedium,-apple-system,BlinkMacSystemFont,sans-serif;font-size:var(--size-600);overflow:hidden;padding:0;position:relative;text-align:left;text-shadow:rgba(0,0,0,.5) 0 0 5px}img{aspect-ratio:640/427;height:100%;left:0;-o-object-fit:cover;object-fit:cover;top:0;z-index:1}img,span{position:absolute}span{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.4),rgba(0,0,0,.7));font-size:var(--size-600);padding:var(--size-300);text-shadow:rgb(0 0 0/50%) 0 0 5px;width:100%;z-index:2}#vegetation{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/forest.jpg)}#floods{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/earth.jpg)}#wildfire{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/wildfire.jpg)}#water{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/wave.jpg)}#urban{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/city.jpg)}#snow{background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.7)),url(/img/iceland.jpg)}</style>\\n"],"names":[],"mappings":"AA2CO,GAAG,0BAAW,CAAC,iBAAiB,CAAC,CAAC,qBAAM,CAAC,YAAY,QAAQ,CAAC,gBAAgB,KAAK,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,IAAI,CAAC,cAAc,IAAI,CAAC,WAAW,GAAG,CAAC,GAAG,CAAC,CAAC,CAAC,IAAI,CAAC,WAAW,UAAU,CAAC,OAAO,OAAO,CAAC,QAAQ,IAAI,CAAC,OAAO,KAAK,CAAC,WAAW,IAAI,CAAC,cAAc,EAAE,CAAC,QAAQ,IAAI,CAAC,gBAAgB,IAAI,CAAC,oBAAoB,GAAG,CAAC,oBAAoB,UAAU,CAAC,MAAM,IAAI,CAAC,qBAAM,MAAM,CAAC,WAAW,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,qBAAM,CAAC,OAAO,CAAC,CAAC,MAAM,IAAI,kBAAkB,CAAC,CAAC,YAAY,WAAW,CAAC,aAAa,CAAC,kBAAkB,CAAC,UAAU,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,SAAS,MAAM,CAAC,QAAQ,CAAC,CAAC,SAAS,QAAQ,CAAC,WAAW,IAAI,CAAC,YAAY,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,kBAAG,CAAC,aAAa,GAAG,CAAC,GAAG,CAAC,OAAO,IAAI,CAAC,KAAK,CAAC,CAAC,cAAc,KAAK,CAAC,WAAW,KAAK,CAAC,IAAI,CAAC,CAAC,QAAQ,CAAC,CAAC,kBAAG,CAAC,mBAAI,CAAC,SAAS,QAAQ,CAAC,mBAAI,CAAC,iBAAiB,gBAAgB,MAAM,CAAC,WAAW,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,QAAQ,IAAI,UAAU,CAAC,CAAC,YAAY,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,MAAM,IAAI,CAAC,QAAQ,CAAC,CAAC"}`
};
var Category$6 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { categories } = $$props;
  let { cases } = $$props;
  if ($$props.categories === void 0 && $$bindings.categories && categories !== void 0)
    $$bindings.categories(categories);
  if ($$props.cases === void 0 && $$bindings.cases && cases !== void 0)
    $$bindings.cases(cases);
  $$result.css.add(css$b);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `<div>${categories ? `
    <div class="${"auto-grid categories svelte-1ooicql"}">${each(categories, (cat) => `<button class="${"svelte-1ooicql"}"><img${add_attribute("src", cat.image, 0)} alt="${" "}" height="${"206"}" width="${"252"}" class="${"svelte-1ooicql"}">
          <span class="${"svelte-1ooicql"}">${escape2(cat.text)}</span>
        </button>`)}</div>` : `<div>${``}
      
      ${validate_component(Case$8, "Case").$$render($$result, { choices: cases }, {}, {})}</div>`}
</div>`;
  } while (!$$settled);
  return $$rendered;
});
var MAPBOX_API = "pk.eyJ1Ijoib3BlbnNwYWNlZGF0YSIsImEiOiJja3MxcjF4aHkxZG9rMnBtc2docDFha2YzIn0.2aOlpksFyF1TqpH-YlTLrw";
var css$a = {
  code: "div.svelte-g2x13j{padding:0}",
  map: `{"version":3,"file":"Geocoder.svelte","sources":["Geocoder.svelte"],"sourcesContent":["<div\\n  id={fieldId}\\n  use:action={optionsWithDefaults}\\n  on:ready={init}\\n  on:results\\n  on:result\\n  on:loading\\n  on:error\\n  on:clear\\n  on:load\\n/>\\n\\n<script>\\n  import { createEventDispatcher } from 'svelte'\\n  import action from './geocoder-action.js'\\n\\n  export let accessToken\\n  export let options = {}\\n  export let version = 'v4.5.1'\\n  export let types = [ 'country', 'region', 'postcode', 'district', 'place', 'locality', 'neighborhood', 'address' ]\\n  export let placeholder = 'Search'\\n  export let value = null\\n  export let customStylesheetUrl = false\\n  export let geocoder\\n\\n  const dispatch = createEventDispatcher()\\n  const fieldId = 'bsm-' + Math.random().toString(36).substring(6)\\n\\n  const optionsWithDefaults = Object.assign({\\n    version,\\n    accessToken,\\n    types: types.join(','),\\n    placeholder,\\n    customStylesheetUrl,\\n    value\\n  }, options)\\n\\n  function init ({ detail }) {\\n    geocoder = detail.geocoder\\n    dispatch('ready')\\n  }\\n<\/script>\\n\\n<style>div{padding:0}</style>"],"names":[],"mappings":"AA2CO,iBAAG,CAAC,QAAQ,CAAC,CAAC"}`
};
var Geocoder = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { accessToken } = $$props;
  let { options: options2 = {} } = $$props;
  let { version = "v4.5.1" } = $$props;
  let { types: types2 = [
    "country",
    "region",
    "postcode",
    "district",
    "place",
    "locality",
    "neighborhood",
    "address"
  ] } = $$props;
  let { placeholder = "Search" } = $$props;
  let { value = null } = $$props;
  let { customStylesheetUrl = false } = $$props;
  let { geocoder } = $$props;
  createEventDispatcher();
  const fieldId = "bsm-" + Math.random().toString(36).substring(6);
  Object.assign({
    version,
    accessToken,
    types: types2.join(","),
    placeholder,
    customStylesheetUrl,
    value
  }, options2);
  if ($$props.accessToken === void 0 && $$bindings.accessToken && accessToken !== void 0)
    $$bindings.accessToken(accessToken);
  if ($$props.options === void 0 && $$bindings.options && options2 !== void 0)
    $$bindings.options(options2);
  if ($$props.version === void 0 && $$bindings.version && version !== void 0)
    $$bindings.version(version);
  if ($$props.types === void 0 && $$bindings.types && types2 !== void 0)
    $$bindings.types(types2);
  if ($$props.placeholder === void 0 && $$bindings.placeholder && placeholder !== void 0)
    $$bindings.placeholder(placeholder);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0)
    $$bindings.value(value);
  if ($$props.customStylesheetUrl === void 0 && $$bindings.customStylesheetUrl && customStylesheetUrl !== void 0)
    $$bindings.customStylesheetUrl(customStylesheetUrl);
  if ($$props.geocoder === void 0 && $$bindings.geocoder && geocoder !== void 0)
    $$bindings.geocoder(geocoder);
  $$result.css.add(css$a);
  return `<div${add_attribute("id", fieldId, 0)} class="${"svelte-g2x13j"}"></div>`;
});
var css$9 = {
  code: ".locationSearch.svelte-aj4nt7{padding-left:140px}.mapboxgl-ctrl{max-width:100%!important;width:100%!important}.mapboxgl-ctrl-geocoder{border:2px solid #000!important;box-shadow:1px 2px 0 #000!important;max-width:100%!important;width:100%!important}.mapboxgl-ctrl-geocoder--input{font-family:var(--bold-font)!important;font-size:var(--size-500)!important;height:auto!important}.mapboxgl-ctrl-geocoder .suggestions-wrapper .suggestions li a{background:none;border-bottom:1px solid var(--color-dark-grey);font-family:var(--base-font);font-size:var(--size-400);padding:6px 35px;text-shadow:none}.mapboxgl-ctrl-geocoder .suggestions{border-radius:0!important;box-shadow:none!important;position:relative!important}.mapboxgl-ctrl-geocoder .suggestions li.active{background:var(--color-accent)}",
  map: `{"version":3,"file":"LocationSearch.svelte","sources":["LocationSearch.svelte"],"sourcesContent":["<script>\\n  import {MAPBOX_API} from '$lib/data/mapbox'\\n  import {location} from './store'\\n  import {Geocoder} from '@beyonk/svelte-mapbox'\\n<\/script>\\n\\n<div class=\\"locationSearch\\">\\n  <Geocoder\\n    accessToken={MAPBOX_API}\\n    options={{\\n      types: 'country, region, postcode, district, place, locality, neighborhood, address, poi',\\n    }}\\n    on:result={result => {\\n      location.set(result.detail.result)\\n    }} />\\n</div>\\n\\n<style>.locationSearch{padding-left:140px}:global(.mapboxgl-ctrl){max-width:100%!important;width:100%!important}:global(.mapboxgl-ctrl-geocoder){border:2px solid #000!important;box-shadow:1px 2px 0 #000!important;max-width:100%!important;width:100%!important}:global(.mapboxgl-ctrl-geocoder--input){font-family:var(--bold-font)!important;font-size:var(--size-500)!important;height:auto!important}:global(.mapboxgl-ctrl-geocoder .suggestions-wrapper .suggestions li a){background:none;border-bottom:1px solid var(--color-dark-grey);font-family:var(--base-font);font-size:var(--size-400);padding:6px 35px;text-shadow:none}:global(.mapboxgl-ctrl-geocoder .suggestions){border-radius:0!important;box-shadow:none!important;position:relative!important}:global(.mapboxgl-ctrl-geocoder .suggestions li.active){background:var(--color-accent)}</style>\\n"],"names":[],"mappings":"AAiBO,6BAAe,CAAC,aAAa,KAAK,CAAC,AAAQ,cAAc,AAAC,CAAC,UAAU,IAAI,UAAU,CAAC,MAAM,IAAI,UAAU,CAAC,AAAQ,uBAAuB,AAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,IAAI,UAAU,CAAC,WAAW,GAAG,CAAC,GAAG,CAAC,CAAC,CAAC,IAAI,UAAU,CAAC,UAAU,IAAI,UAAU,CAAC,MAAM,IAAI,UAAU,CAAC,AAAQ,8BAA8B,AAAC,CAAC,YAAY,IAAI,WAAW,CAAC,UAAU,CAAC,UAAU,IAAI,UAAU,CAAC,UAAU,CAAC,OAAO,IAAI,UAAU,CAAC,AAAQ,8DAA8D,AAAC,CAAC,WAAW,IAAI,CAAC,cAAc,GAAG,CAAC,KAAK,CAAC,IAAI,iBAAiB,CAAC,CAAC,YAAY,IAAI,WAAW,CAAC,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,QAAQ,GAAG,CAAC,IAAI,CAAC,YAAY,IAAI,CAAC,AAAQ,oCAAoC,AAAC,CAAC,cAAc,CAAC,UAAU,CAAC,WAAW,IAAI,UAAU,CAAC,SAAS,QAAQ,UAAU,CAAC,AAAQ,8CAA8C,AAAC,CAAC,WAAW,IAAI,cAAc,CAAC,CAAC"}`
};
var LocationSearch = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$9);
  return `<div class="${"locationSearch svelte-aj4nt7"}">${validate_component(Geocoder, "Geocoder").$$render($$result, {
    accessToken: MAPBOX_API,
    options: {
      types: "country, region, postcode, district, place, locality, neighborhood, address, poi"
    }
  }, {}, {})}
</div>`;
});
var css$8 = {
  code: '.timeRange.svelte-pjevj1.svelte-pjevj1.svelte-pjevj1{padding-left:140px}div.horizontal.svelte-pjevj1.svelte-pjevj1.svelte-pjevj1{align-items:center;display:flex;gap:var(--size-700);justify-content:flex-start;margin-bottom:1rem;margin-top:var(--size-800)}div.field.svelte-pjevj1.svelte-pjevj1.svelte-pjevj1{align-items:center;display:flex}div.field.svelte-pjevj1 input.svelte-pjevj1.svelte-pjevj1{border:2px solid #000;border-radius:15px;box-sizing:border-box;font-family:var(--bold-font);font-size:var(--size-400);height:auto;list-style:none;margin:15px 0;padding:20px 50px}label.svelte-pjevj1.svelte-pjevj1.svelte-pjevj1{align-items:center;display:flex;font-size:var(--size-600);gap:1rem;justify-content:flex-start;margin-bottom:1rem}label.datepicker.svelte-pjevj1.svelte-pjevj1.svelte-pjevj1{display:block;position:relative}label.datepicker.svelte-pjevj1>span.svelte-pjevj1.svelte-pjevj1{font-family:var(--heading-font);font-size:var(--size-300);font-weight:700;padding-left:var(--size-400);position:absolute;top:-2ex}label.svelte-pjevj1>.radioInput.svelte-pjevj1.svelte-pjevj1{border:2px solid #000;border-radius:100%;box-shadow:var(--shadow-color,var(--color-black)) 1px 2px 0;height:var(--size-700);position:relative;width:var(--size-700)}label.svelte-pjevj1>input.svelte-pjevj1:checked+.radioInput.svelte-pjevj1{--shadow-color:var(--color-primary);border-color:var(--color-primary)}label.svelte-pjevj1>input.svelte-pjevj1:checked+.radioInput.svelte-pjevj1:before{background:var(--color-primary);border:4px solid #fff;border-radius:100%;content:"";height:var(--size-600);left:0;position:absolute;top:0;width:var(--size-600)}label.svelte-pjevj1>input[type=radio].svelte-pjevj1.svelte-pjevj1{display:none}div.field.svelte-pjevj1 img.svelte-pjevj1.svelte-pjevj1{padding:20px 16px;position:absolute}',
  map: `{"version":3,"file":"TimeRange.svelte","sources":["TimeRange.svelte"],"sourcesContent":["<script>\\n  import {range} from './store'\\n  let startDate = $range.startDate || null\\n  let endDate = $range.endDate || null\\n<\/script>\\n\\n<div class=\\"container\\">\\n  <div class=\\"timeRange\\">\\n    <label>\\n      <input\\n        data-shadow\\n        type=\\"radio\\"\\n        name=\\"timeRange\\"\\n        value=\\"latest\\"\\n        checked={$range.type === 'latest' ? true : false}\\n        on:click={() => range.set({...$range, type: 'latest'})} />\\n      <span class=\\"radioInput\\" />\\n      Gimme the latest imagery with best quality\\n    </label>\\n    <label>\\n      <input\\n        data-shadow\\n        type=\\"radio\\"\\n        checked={$range.type === 'range' ? true : false}\\n        on:click={() => range.set({...$range, type: 'range'})}\\n        name=\\"timeRange\\"\\n        value=\\"range\\" />\\n      <span class=\\"radioInput\\" />\\n      Let me set the time range myself\\n    </label>\\n  </div>\\n  {#if $range.type === 'range'}\\n    <!-- content here -->\\n    <div class=\\"content horizontal timeRange\\">\\n      <div class=\\"field fromDate\\">\\n        <img src=\\"./build/assets/img/calendar.svg\\" alt=\\"\\" />\\n        <label class=\\"datepicker\\" for=\\"start-date\\">\\n          <span>Start date</span>\\n          <input\\n            data-shadow\\n            class=\\"locationSearch shadow\\"\\n            type=\\"date\\"\\n            placeholder=\\"Start date\\"\\n            name=\\"start-date\\"\\n            bind:value={startDate}\\n            on:change={() => range.set({...$range, startDate: startDate})}\\n            on:blur={() => range.set({...$range, startDate: startDate})} />\\n        </label>\\n      </div>\\n      <p>to</p>\\n      <div class=\\"field toDate\\">\\n        <img src=\\"./build/assets/img/calendar.svg\\" alt=\\"\\" />\\n        <label class=\\"datepicker\\" for=\\"end-date\\">\\n          <span>End date</span>\\n          <input\\n            data-shadow\\n            class=\\"locationSearch shadow\\"\\n            type=\\"date\\"\\n            placeholder=\\"End date\\"\\n            name=\\"end-date\\"\\n            bind:value={endDate}\\n            on:change={() => ($range = {...$range, endDate: endDate})}\\n            on:blur={() => ($range = {...$range, endDate: endDate})} />\\n        </label>\\n      </div>\\n    </div>\\n  {/if}\\n</div>\\n\\n<style>.timeRange{padding-left:140px}div.horizontal{align-items:center;display:flex;gap:var(--size-700);justify-content:flex-start;margin-bottom:1rem;margin-top:var(--size-800)}div p.to{padding:0 1rem}div.field{align-items:center;display:flex}div.field input{border:2px solid #000;border-radius:15px;box-sizing:border-box;font-family:var(--bold-font);font-size:var(--size-400);height:auto;list-style:none;margin:15px 0;padding:20px 50px}label{align-items:center;display:flex;font-size:var(--size-600);gap:1rem;justify-content:flex-start;margin-bottom:1rem}label.datepicker{display:block;position:relative}label.datepicker>span{font-family:var(--heading-font);font-size:var(--size-300);font-weight:700;padding-left:var(--size-400);position:absolute;top:-2ex}label>.radioInput{border:2px solid #000;border-radius:100%;box-shadow:var(--shadow-color,var(--color-black)) 1px 2px 0;height:var(--size-700);position:relative;width:var(--size-700)}label>input:checked+.radioInput{--shadow-color:var(--color-primary);border-color:var(--color-primary)}label>input:checked+.radioInput:before{background:var(--color-primary);border:4px solid #fff;border-radius:100%;content:\\"\\";height:var(--size-600);left:0;position:absolute;top:0;width:var(--size-600)}label>input[type=radio]{display:none}div.field img{padding:20px 16px;position:absolute}</style>\\n"],"names":[],"mappings":"AAqEO,oDAAU,CAAC,aAAa,KAAK,CAAC,GAAG,qDAAW,CAAC,YAAY,MAAM,CAAC,QAAQ,IAAI,CAAC,IAAI,IAAI,UAAU,CAAC,CAAC,gBAAgB,UAAU,CAAC,cAAc,IAAI,CAAC,WAAW,IAAI,UAAU,CAAC,CAAC,AAAwB,GAAG,gDAAM,CAAC,YAAY,MAAM,CAAC,QAAQ,IAAI,CAAC,GAAG,oBAAM,CAAC,iCAAK,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,IAAI,CAAC,cAAc,IAAI,CAAC,WAAW,UAAU,CAAC,YAAY,IAAI,WAAW,CAAC,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,OAAO,IAAI,CAAC,WAAW,IAAI,CAAC,OAAO,IAAI,CAAC,CAAC,CAAC,QAAQ,IAAI,CAAC,IAAI,CAAC,+CAAK,CAAC,YAAY,MAAM,CAAC,QAAQ,IAAI,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,IAAI,IAAI,CAAC,gBAAgB,UAAU,CAAC,cAAc,IAAI,CAAC,KAAK,qDAAW,CAAC,QAAQ,KAAK,CAAC,SAAS,QAAQ,CAAC,KAAK,yBAAW,CAAC,gCAAI,CAAC,YAAY,IAAI,cAAc,CAAC,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,YAAY,GAAG,CAAC,aAAa,IAAI,UAAU,CAAC,CAAC,SAAS,QAAQ,CAAC,IAAI,IAAI,CAAC,mBAAK,CAAC,uCAAW,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,IAAI,CAAC,cAAc,IAAI,CAAC,WAAW,IAAI,cAAc,CAAC,kBAAkB,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,CAAC,CAAC,OAAO,IAAI,UAAU,CAAC,CAAC,SAAS,QAAQ,CAAC,MAAM,IAAI,UAAU,CAAC,CAAC,mBAAK,CAAC,mBAAK,QAAQ,CAAC,yBAAW,CAAC,eAAe,oBAAoB,CAAC,aAAa,IAAI,eAAe,CAAC,CAAC,mBAAK,CAAC,mBAAK,QAAQ,CAAC,yBAAW,OAAO,CAAC,WAAW,IAAI,eAAe,CAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,IAAI,CAAC,cAAc,IAAI,CAAC,QAAQ,EAAE,CAAC,OAAO,IAAI,UAAU,CAAC,CAAC,KAAK,CAAC,CAAC,SAAS,QAAQ,CAAC,IAAI,CAAC,CAAC,MAAM,IAAI,UAAU,CAAC,CAAC,mBAAK,CAAC,KAAK,CAAC,IAAI,CAAC,KAAK,6BAAC,CAAC,QAAQ,IAAI,CAAC,GAAG,oBAAM,CAAC,+BAAG,CAAC,QAAQ,IAAI,CAAC,IAAI,CAAC,SAAS,QAAQ,CAAC"}`
};
var TimeRange = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $range, $$unsubscribe_range;
  $$unsubscribe_range = subscribe(range, (value) => $range = value);
  let startDate = $range.startDate || null;
  let endDate = $range.endDate || null;
  $$result.css.add(css$8);
  $$unsubscribe_range();
  return `<div class="${"container"}"><div class="${"timeRange svelte-pjevj1"}"><label class="${"svelte-pjevj1"}"><input data-shadow type="${"radio"}" name="${"timeRange"}" value="${"latest"}" ${($range.type === "latest" ? true : false) ? "checked" : ""} class="${"svelte-pjevj1"}">
      <span class="${"radioInput svelte-pjevj1"}"></span>
      Gimme the latest imagery with best quality
    </label>
    <label class="${"svelte-pjevj1"}"><input data-shadow type="${"radio"}" ${($range.type === "range" ? true : false) ? "checked" : ""} name="${"timeRange"}" value="${"range"}" class="${"svelte-pjevj1"}">
      <span class="${"radioInput svelte-pjevj1"}"></span>
      Let me set the time range myself
    </label></div>
  ${$range.type === "range" ? `
    <div class="${"content horizontal timeRange svelte-pjevj1"}"><div class="${"field fromDate svelte-pjevj1"}"><img src="${"./build/assets/img/calendar.svg"}" alt="${""}" class="${"svelte-pjevj1"}">
        <label class="${"datepicker svelte-pjevj1"}" for="${"start-date"}"><span class="${"svelte-pjevj1"}">Start date</span>
          <input data-shadow class="${"locationSearch shadow svelte-pjevj1"}" type="${"date"}" placeholder="${"Start date"}" name="${"start-date"}"${add_attribute("value", startDate, 0)}></label></div>
      <p>to</p>
      <div class="${"field toDate svelte-pjevj1"}"><img src="${"./build/assets/img/calendar.svg"}" alt="${""}" class="${"svelte-pjevj1"}">
        <label class="${"datepicker svelte-pjevj1"}" for="${"end-date"}"><span class="${"svelte-pjevj1"}">End date</span>
          <input data-shadow class="${"locationSearch shadow svelte-pjevj1"}" type="${"date"}" placeholder="${"End date"}" name="${"end-date"}"${add_attribute("value", endDate, 0)}></label></div></div>` : ``}
</div>`;
});
var css$7 = {
  code: ":root{--toastContainerTop:auto;--toastContainerRight:var(--size-400);--toastContainerBottom:calc(var(--size-900)*2);--toastContainerLeft:auto;--toastBackground:var(--color-accent-light);--toastProgressBackground:var(--color-accent);--toastColor:var(--dark-text-color);--toastWidth:100%}a.submit.svelte-12lk6ex{align-items:center;background:#1947e5;border:none;border-bottom:2px solid #000;border-radius:12px;box-shadow:1px 2px 0 #000;color:#fff;cursor:pointer;display:flex;font-family:nowayregular,-apple-system,BlinkMacSystemFont,sans-serif;font-size:21px;gap:var(--size-500);justify-content:center;margin:2rem auto 2rem 0;padding:20px 16px;text-shadow:none;width:100%}a.submit.disableButton{background:var(--color-dark-grey)!important;color:var(--color-white)!important;cursor:default!important}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script context=\\"module\\">\\n  export const prerender = true\\n  export async function load({page, fetch, session, context}) {\\n    const categoriesURL = \`/categories.json\`\\n    const casesURL = \`/cases.json\`\\n    const guidesURL = \`/guides.json\`\\n    const categories = await fetch(categoriesURL)\\n    const cases = await fetch(casesURL)\\n    const guides = await fetch(guidesURL)\\n\\n    if (categories.ok && cases.ok) {\\n      return {\\n        props: {\\n          categories: await categories.json(),\\n          cases: await cases.json(),\\n          guides: await guides.json(),\\n        },\\n      }\\n    }\\n\\n    return {\\n      status: res.status,\\n      error: new Error(error),\\n    }\\n  }\\n<\/script>\\n\\n<script>\\n  import {fly, slide} from 'svelte/transition'\\n  import {choice as selected, location, range} from '$lib/store'\\n  import NumberedHeading from '$lib/NumberedHeading.svelte'\\n  import ProgressHeading from '$lib/ProgressHeading.svelte'\\n  import Caterogy from '$lib/Category.svelte'\\n  import LocationSearch from '$lib/LocationSearch.svelte'\\n  import TimeRange from '$lib/TimeRange.svelte'\\n  import Progress from '$lib/Progress.svelte'\\n  import {goto} from '$app/navigation'\\n  import {toast} from '@zerodevx/svelte-toast'\\n\\n  export let categories\\n  export let cases\\n\\n  let disableButton = true\\n  $: if ($selected && $location && $range.type === 'latest') {\\n    disableButton = false\\n  }\\n  $: if ($selected && $location && $range.type === 'range') {\\n    if (!$range.startDate || !$range.endDate) {\\n      disableButton = true\\n    } else {\\n      disableButton = false\\n    }\\n  }\\n\\n  let progress = 1\\n  let showProgress = true\\n\\n  $: $selected ? (progress = 2) : (progress = 1)\\n  $: $location ? (progress = 3) : (progress = 2)\\n\\n  const checkForm = () => {\\n    if (!$selected) {\\n      toast.push('Please first select a category')\\n      return\\n    }\\n    if (!$location) {\\n      toast.push('Please choose a location')\\n      return\\n    }\\n    if ($range.type === 'range' && !$range.startDate && !$range.endDate) {\\n      toast.push('Please set a start and end date')\\n      return\\n    }\\n    if ($range.type === 'range' && !$range.startDate) {\\n      toast.push('Please set a start date')\\n      return\\n    }\\n    if ($range.type === 'range' && !$range.endDate) {\\n      toast.push('Please set an end date')\\n      return\\n    }\\n  }\\n<\/script>\\n\\n{#if $selected && showProgress}\\n  <!-- content here -->\\n  <!-- <Progress bind:progress /> -->\\n{/if}\\n\\n<section>\\n  <div class=\\"wrapper\\" data-height=\\"\\">\\n    <div class=\\"flow\\">\\n      {#if !$selected}\\n        <NumberedHeading\\n          text=\\"What do you want to do?\\"\\n          step=\\"1\\"\\n          details=\\"Select a category you want to investigate.\\" />\\n      {:else}\\n        <ProgressHeading section=\\"category\\" />\\n      {/if}\\n    </div>\\n    {#if !$selected}\\n      <div class=\\"full-width\\" transition:slide>\\n        <div class=\\"wrapper\\">\\n          <Caterogy {categories} {cases} />\\n        </div>\\n      </div>\\n    {/if}\\n  </div>\\n</section>\\n\\n<section>\\n  <div class=\\"wrapper flow\\" data-height=\\"\\">\\n    {#if !$location}\\n      <!-- content here -->\\n      <NumberedHeading\\n        text=\\"Where do you want to search?\\"\\n        step=\\"2\\"\\n        details=\\"Type a country, city, or region name into the search box, and select a location.\\" />\\n    {:else}\\n      <ProgressHeading section=\\"location\\" />\\n    {/if}\\n    {#if $selected && !$location}\\n      <div transition:slide>\\n        <LocationSearch />\\n      </div>\\n    {/if}\\n  </div>\\n</section>\\n\\n<section>\\n  <div class=\\"wrapper flow\\" data-height=\\"\\">\\n    <NumberedHeading\\n      text=\\"What time range do you want to investigate?\\"\\n      step=\\"3\\"\\n      details=\\"Get the latest satellite pictures, or search for a particular period.\\" />\\n    <div class=\\"flow\\">\\n      {#if $selected && $location}\\n        <div transition:slide>\\n          <TimeRange />\\n        </div>\\n      {/if}\\n      <a\\n        class=\\"submit\\"\\n        on:click|preventDefault={() => {\\n          checkForm()\\n          !disableButton ? goto(\`/guide/\${$selected.id}\`) : null\\n        }}\\n        href=\\"/guide\\"\\n        class:disableButton\\n        >Alright! Get the data and start analyzing\\n        {#if !disableButton}\\n          <!-- content here -->\\n          <svg\\n            xmlns=\\"http://www.w3.org/2000/svg\\"\\n            width=\\"24\\"\\n            height=\\"24\\"\\n            viewBox=\\"0 0 24 24\\"\\n            fill=\\"none\\"\\n            ><path\\n              fill=\\"currentColor\\"\\n              d=\\"M10.061 19.061L17.121 12 10.061 4.939 7.939 7.061 12.879 12 7.939 16.939z\\" /></svg>\\n        {/if}\\n      </a>\\n    </div>\\n  </div>\\n</section>\\n\\n<style>:global(:root){--toastContainerTop:auto;--toastContainerRight:var(--size-400);--toastContainerBottom:calc(var(--size-900)*2);--toastContainerLeft:auto;--toastBackground:var(--color-accent-light);--toastProgressBackground:var(--color-accent);--toastColor:var(--dark-text-color);--toastWidth:100%}.narrow{align-items:center;display:flex;flex-direction:column;max-width:45rem}.wrapper[data-height=full]{align-items:flex-start;grid-template-rows:auto 1fr;min-height:calc(100vh - 11rem)}section.flow{--flow-space:var(--size-600)}a.submit{align-items:center;background:#1947e5;border:none;border-bottom:2px solid #000;border-radius:12px;box-shadow:1px 2px 0 #000;color:#fff;cursor:pointer;display:flex;font-family:nowayregular,-apple-system,BlinkMacSystemFont,sans-serif;font-size:21px;gap:var(--size-500);justify-content:center;margin:2rem auto 2rem 0;padding:20px 16px;text-shadow:none;width:100%}:global(a.submit.disableButton){background:var(--color-dark-grey)!important;color:var(--color-white)!important;cursor:default!important}</style>\\n"],"names":[],"mappings":"AAwKe,KAAK,AAAC,CAAC,oBAAoB,IAAI,CAAC,sBAAsB,eAAe,CAAC,uBAAuB,uBAAuB,CAAC,qBAAqB,IAAI,CAAC,kBAAkB,yBAAyB,CAAC,0BAA0B,mBAAmB,CAAC,aAAa,sBAAsB,CAAC,aAAa,IAAI,CAAC,AAAqO,CAAC,sBAAO,CAAC,YAAY,MAAM,CAAC,WAAW,OAAO,CAAC,OAAO,IAAI,CAAC,cAAc,GAAG,CAAC,KAAK,CAAC,IAAI,CAAC,cAAc,IAAI,CAAC,WAAW,GAAG,CAAC,GAAG,CAAC,CAAC,CAAC,IAAI,CAAC,MAAM,IAAI,CAAC,OAAO,OAAO,CAAC,QAAQ,IAAI,CAAC,YAAY,YAAY,CAAC,aAAa,CAAC,kBAAkB,CAAC,UAAU,CAAC,UAAU,IAAI,CAAC,IAAI,IAAI,UAAU,CAAC,CAAC,gBAAgB,MAAM,CAAC,OAAO,IAAI,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC,CAAC,QAAQ,IAAI,CAAC,IAAI,CAAC,YAAY,IAAI,CAAC,MAAM,IAAI,CAAC,AAAQ,sBAAsB,AAAC,CAAC,WAAW,IAAI,iBAAiB,CAAC,UAAU,CAAC,MAAM,IAAI,aAAa,CAAC,UAAU,CAAC,OAAO,OAAO,UAAU,CAAC"}`
};
var prerender$2 = true;
async function load$2({ page, fetch: fetch2, session, context }) {
  const categoriesURL = `/categories.json`;
  const casesURL = `/cases.json`;
  const guidesURL = `/guides.json`;
  const categories = await fetch2(categoriesURL);
  const cases = await fetch2(casesURL);
  const guides = await fetch2(guidesURL);
  if (categories.ok && cases.ok) {
    return {
      props: {
        categories: await categories.json(),
        cases: await cases.json(),
        guides: await guides.json()
      }
    };
  }
  return {
    status: res.status,
    error: new Error(error)
  };
}
var showProgress = true;
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $range, $$unsubscribe_range;
  let $location, $$unsubscribe_location;
  let $selected, $$unsubscribe_selected;
  $$unsubscribe_range = subscribe(range, (value) => $range = value);
  $$unsubscribe_location = subscribe(location2, (value) => $location = value);
  $$unsubscribe_selected = subscribe(choice, (value) => $selected = value);
  let { categories } = $$props;
  let { cases } = $$props;
  let disableButton = true;
  if ($$props.categories === void 0 && $$bindings.categories && categories !== void 0)
    $$bindings.categories(categories);
  if ($$props.cases === void 0 && $$bindings.cases && cases !== void 0)
    $$bindings.cases(cases);
  $$result.css.add(css$7);
  {
    if ($selected && $location && $range.type === "latest") {
      disableButton = false;
    }
  }
  {
    if ($selected && $location && $range.type === "range") {
      if (!$range.startDate || !$range.endDate) {
        disableButton = true;
      } else {
        disableButton = false;
      }
    }
  }
  $$unsubscribe_range();
  $$unsubscribe_location();
  $$unsubscribe_selected();
  return `${$selected && showProgress ? `
  ` : ``}

<section><div class="${"wrapper"}" data-height="${""}"><div class="${"flow"}">${!$selected ? `${validate_component(NumberedHeading, "NumberedHeading").$$render($$result, {
    text: "What do you want to do?",
    step: "1",
    details: "Select a category you want to investigate."
  }, {}, {})}` : `${validate_component(ProgressHeading, "ProgressHeading").$$render($$result, { section: "category" }, {}, {})}`}</div>
    ${!$selected ? `<div class="${"full-width"}"><div class="${"wrapper"}">${validate_component(Category$6, "Caterogy").$$render($$result, { categories, cases }, {}, {})}</div></div>` : ``}</div></section>

<section><div class="${"wrapper flow"}" data-height="${""}">${!$location ? `
      ${validate_component(NumberedHeading, "NumberedHeading").$$render($$result, {
    text: "Where do you want to search?",
    step: "2",
    details: "Type a country, city, or region name into the search box, and select a location."
  }, {}, {})}` : `${validate_component(ProgressHeading, "ProgressHeading").$$render($$result, { section: "location" }, {}, {})}`}
    ${$selected && !$location ? `<div>${validate_component(LocationSearch, "LocationSearch").$$render($$result, {}, {}, {})}</div>` : ``}</div></section>

<section><div class="${"wrapper flow"}" data-height="${""}">${validate_component(NumberedHeading, "NumberedHeading").$$render($$result, {
    text: "What time range do you want to investigate?",
    step: "3",
    details: "Get the latest satellite pictures, or search for a particular period."
  }, {}, {})}
    <div class="${"flow"}">${$selected && $location ? `<div>${validate_component(TimeRange, "TimeRange").$$render($$result, {}, {}, {})}</div>` : ``}
      <a class="${["submit svelte-12lk6ex", disableButton ? "disableButton" : ""].join(" ").trim()}" href="${"/guide"}">Alright! Get the data and start analyzing
        ${!disableButton ? `
          <svg xmlns="${"http://www.w3.org/2000/svg"}" width="${"24"}" height="${"24"}" viewBox="${"0 0 24 24"}" fill="${"none"}"><path fill="${"currentColor"}" d="${"M10.061 19.061L17.121 12 10.061 4.939 7.939 7.061 12.879 12 7.939 16.939z"}"></path></svg>` : ``}</a></div></div>
</section>`;
});
var index$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes,
  prerender: prerender$2,
  load: load$2
});
var css$6 = {
  code: "main.flow.svelte-1r8zpyi{--flow-space:var(--size-500)}",
  map: `{"version":3,"file":"__layout.reset.svelte","sources":["__layout.reset.svelte"],"sourcesContent":["<script>\\n  import Header from '$lib/Header.svelte'\\n  import Footer from '$lib/Footer.svelte'\\n  import '../../app.css'\\n<\/script>\\n\\n<svelte:head>\\n  <title>OpenSpaceData</title>\\n</svelte:head>\\n\\n<Header />\\n\\n<main class=\\"flow wrapper\\">\\n  <slot />\\n</main>\\n\\n<Footer />\\n\\n<style>main.flow{--flow-space:var(--size-500)}</style>\\n"],"names":[],"mappings":"AAkBO,IAAI,oBAAK,CAAC,aAAa,eAAe,CAAC"}`
};
var _layout_reset$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$6);
  return `${$$result.head += `${$$result.title = `<title>OpenSpaceData</title>`, ""}`, ""}

${validate_component(Header, "Header").$$render($$result, {}, {}, {})}

<main class="${"flow wrapper svelte-1r8zpyi"}">${slots.default ? slots.default({}) : ``}</main>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});
var __layout_reset$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout_reset$1
});
var css$5 = {
  code: "div.svelte-6rmnz4{background:var(--color-accent);border-radius:2px;color:var(--color-black);font-size:var(--size-600);padding:1rem;text-align:center}a.svelte-6rmnz4,a.svelte-6rmnz4:visited{background-image:linear-gradient(90deg,var(--color-accent),var(--color-accent)),linear-gradient(90deg,var(--color-black),var(--color-black));color:currentColor;text-shadow:-1px -1px 0 var(--color-accent),1px -1px 0 var(--color-accent),-1px 1px 0 var(--color-accent),1px 1px 0 var(--color-accent)}",
  map: '{"version":3,"file":"Follow.svelte","sources":["Follow.svelte"],"sourcesContent":["<div>\\n  For updates follow us on \u{1F680} <a href=\\"https://twitter.com/openspacedata1\\">Twitter</a>, \u{1F4DD}\\n  <a href=\\"https://medium.com/openspacedata\\">Medium</a>\\n  or \u{1F469}\u{1F3FD}\u200D\u{1F4BB} <a href=\\"https://github.com/OpenSpaceData\\">GitHub</a>, or subscribe to our \u{1F4EC}\\n  <a href=\\"https://www.openspacedata.org/mailing-list/\\">mailing list</a>.\\n</div>\\n\\n<style>div{background:var(--color-accent);border-radius:2px;color:var(--color-black);font-size:var(--size-600);padding:1rem;text-align:center}a,a:visited{background-image:linear-gradient(90deg,var(--color-accent),var(--color-accent)),linear-gradient(90deg,var(--color-black),var(--color-black));color:currentColor;text-shadow:-1px -1px 0 var(--color-accent),1px -1px 0 var(--color-accent),-1px 1px 0 var(--color-accent),1px 1px 0 var(--color-accent)}</style>\\n"],"names":[],"mappings":"AAOO,iBAAG,CAAC,WAAW,IAAI,cAAc,CAAC,CAAC,cAAc,GAAG,CAAC,MAAM,IAAI,aAAa,CAAC,CAAC,UAAU,IAAI,UAAU,CAAC,CAAC,QAAQ,IAAI,CAAC,WAAW,MAAM,CAAC,eAAC,CAAC,eAAC,QAAQ,CAAC,iBAAiB,gBAAgB,KAAK,CAAC,IAAI,cAAc,CAAC,CAAC,IAAI,cAAc,CAAC,CAAC,CAAC,gBAAgB,KAAK,CAAC,IAAI,aAAa,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,CAAC,MAAM,YAAY,CAAC,YAAY,IAAI,CAAC,IAAI,CAAC,CAAC,CAAC,IAAI,cAAc,CAAC,CAAC,GAAG,CAAC,IAAI,CAAC,CAAC,CAAC,IAAI,cAAc,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,CAAC,CAAC,IAAI,cAAc,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,CAAC,CAAC,IAAI,cAAc,CAAC,CAAC"}'
};
var Follow = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$5);
  return `<div class="${"svelte-6rmnz4"}">For updates follow us on \u{1F680} <a href="${"https://twitter.com/openspacedata1"}" class="${"svelte-6rmnz4"}">Twitter</a>, \u{1F4DD}
  <a href="${"https://medium.com/openspacedata"}" class="${"svelte-6rmnz4"}">Medium</a>
  or \u{1F469}\u{1F3FD}\u200D\u{1F4BB} <a href="${"https://github.com/OpenSpaceData"}" class="${"svelte-6rmnz4"}">GitHub</a>, or subscribe to our \u{1F4EC}
  <a href="${"https://www.openspacedata.org/mailing-list/"}" class="${"svelte-6rmnz4"}">mailing list</a>.
</div>`;
});
var css$4 = {
  code: ".fluid-grid.three.svelte-2enotn{justify-items:center}a.svelte-2enotn,a.svelte-2enotn:visited{background-image:none;text-shadow:none}img.svelte-2enotn{height:120px}.text-center.svelte-2enotn{text-align:center}",
  map: '{"version":3,"file":"Fund.svelte","sources":["Fund.svelte"],"sourcesContent":["<div class=\\"text-center\\">\\n  <h2>This project is funded by</h2>\\n  <div class=\\"fluid-grid three\\">\\n    <a href=\\"https://bmbf.de/en\\"\\n      ><img\\n        src=\\"/img/fund/BMBF_gefoerdert_2017_en.svg\\"\\n        alt=\\"Logo for German Federal Ministry of Education & Research\\" /></a>\\n    <a href=\\"https://okfn.de/en\\"\\n      ><img src=\\"/img/fund/okfn.svg\\" alt=\\"Logo for Open Knowledge Foundation Deutschland\\" /></a>\\n    <a href=\\"https://prototypefund.de/en\\"\\n      ><img src=\\"/img/fund/PrototypeFund-P-Logo.svg\\" alt=\\"Logo for Prototype Fund\\" /></a>\\n  </div>\\n</div>\\n\\n<style>.fluid-grid.three{justify-items:center}a,a:visited{background-image:none;text-shadow:none}img{height:120px}.text-center{text-align:center}</style>\\n"],"names":[],"mappings":"AAcO,WAAW,oBAAM,CAAC,cAAc,MAAM,CAAC,eAAC,CAAC,eAAC,QAAQ,CAAC,iBAAiB,IAAI,CAAC,YAAY,IAAI,CAAC,iBAAG,CAAC,OAAO,KAAK,CAAC,0BAAY,CAAC,WAAW,MAAM,CAAC"}'
};
var Fund = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$4);
  return `<div class="${"text-center svelte-2enotn"}"><h2>This project is funded by</h2>
  <div class="${"fluid-grid three svelte-2enotn"}"><a href="${"https://bmbf.de/en"}" class="${"svelte-2enotn"}"><img src="${"/img/fund/BMBF_gefoerdert_2017_en.svg"}" alt="${"Logo for German Federal Ministry of Education & Research"}" class="${"svelte-2enotn"}"></a>
    <a href="${"https://okfn.de/en"}" class="${"svelte-2enotn"}"><img src="${"/img/fund/okfn.svg"}" alt="${"Logo for Open Knowledge Foundation Deutschland"}" class="${"svelte-2enotn"}"></a>
    <a href="${"https://prototypefund.de/en"}" class="${"svelte-2enotn"}"><img src="${"/img/fund/PrototypeFund-P-Logo.svg"}" alt="${"Logo for Prototype Fund"}" class="${"svelte-2enotn"}"></a></div>
</div>`;
});
var css$3 = {
  code: "ul.svelte-1jlekyq{margin-left:0}",
  map: `{"version":3,"file":"index.svx","sources":["index.svx"],"sourcesContent":["<script context=\\"module\\">\\n  export const prerender = true\\n<\/script>\\n<script>\\n  import Follow from '$lib/Follow.svelte'\\n  import Fund from '$lib/Fund.svelte'\\n<\/script>\\n<style>ul{margin-left:0}</style>\\n<svelte:head>\\n  <title>About OpenSpaceData</title>\\n</svelte:head>\\n\\n\\n<h1>About OpenSpaceData</h1>\\n<h2>The project</h2>\\n<p>The 12 Copernicus satellites of ESA alone deliver 250 TB of data per day. The problem: Often, technical (APIs) and professional knowledge (determination of sensors, specific parameters, etc.) is needed to retrieve data. OpenSpaceData is intended to provide easy access to this socially relevant information. This ensures that everyone - citizen or NGO - can classify events independently.</p>\\n<p>This community-driven* project aims to provide a search tool that makes it easier for everyone to find data, regardless of technical or professional knowledge. To this end, openly available satellite data, such as those of European Space Agendy (ESA), will be centralized on OpenSpaceData to facilitate access to them via a simple search mask. It translates the user\u2019s need into the appropriate parameters of the satellite program.</p>\\n<p>Get to know more about <a\\n  href=\\"https://www.openspacedata.org/our-approach/\\"\\n  rel=\\"nofollow\\"\\n>our approach</a>.</p>\\n<p>*Everything we do is open-source and free to use and share for everyone.</p>\\n<h2>Our Mission</h2>\\n<blockquote>\\n<blockquote>\\n<blockquote>\\n<p>We believe that open satellite data should be accessible to everyone - without barriers. We want to help people get easy access to open satellite data and empower them to draw the right insights.</p>\\n</blockquote>\\n</blockquote>\\n</blockquote>\\n<p>Read more about the importance of openly available Earth observation data on <a\\n  href=\\"https://en.reset.org/blog/outer-space-all-just-how-accessible-esas-satellite-data-01262021\\"\\n  rel=\\"nofollow\\"\\n>reset.org</a>.</p>\\n<h2>Satellite data is only for experts?</h2>\\n<p>Nope, with this project, we are explicitly not addressing developers or scientists. We want to offer something specifically for non-specialist users. So, many more people can benefit from them.</p>\\n<ul>\\n<li>\u{1F4DA} students & teacher</li>\\n<li>\u270F\uFE0F journalists</li>\\n<li>\u{1F525} climate activists</li>\\n<li>\u26D1 humanitarian helpers</li>\\n<li>\u{1F471}\u200D\u2640\uFE0F all citizens</li>\\n</ul>\\n<p>We will provide examples and libraries with which you can quickly get started without becoming an expert in the analysis of satellite data. More information on how you can use OpenSpaceData.org for you and your cause will follow.</p>\\n<Follow />\\n<Fund />\\n"],"names":[],"mappings":"AAOO,iBAAE,CAAC,YAAY,CAAC,CAAC"}`
};
var prerender$1 = true;
var About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$3);
  return `${$$result.head += `${$$result.title = `<title>About OpenSpaceData</title>`, ""}`, ""}


<h1>About OpenSpaceData</h1>
<h2>The project</h2>
<p>The 12 Copernicus satellites of ESA alone deliver 250 TB of data per day. The problem: Often, technical (APIs) and professional knowledge (determination of sensors, specific parameters, etc.) is needed to retrieve data. OpenSpaceData is intended to provide easy access to this socially relevant information. This ensures that everyone - citizen or NGO - can classify events independently.</p>
<p>This community-driven* project aims to provide a search tool that makes it easier for everyone to find data, regardless of technical or professional knowledge. To this end, openly available satellite data, such as those of European Space Agendy (ESA), will be centralized on OpenSpaceData to facilitate access to them via a simple search mask. It translates the user\u2019s need into the appropriate parameters of the satellite program.</p>
<p>Get to know more about <a href="${"https://www.openspacedata.org/our-approach/"}" rel="${"nofollow"}">our approach</a>.</p>
<p>*Everything we do is open-source and free to use and share for everyone.</p>
<h2>Our Mission</h2>
<blockquote><blockquote><blockquote><p>We believe that open satellite data should be accessible to everyone - without barriers. We want to help people get easy access to open satellite data and empower them to draw the right insights.</p></blockquote></blockquote></blockquote>
<p>Read more about the importance of openly available Earth observation data on <a href="${"https://en.reset.org/blog/outer-space-all-just-how-accessible-esas-satellite-data-01262021"}" rel="${"nofollow"}">reset.org</a>.</p>
<h2>Satellite data is only for experts?</h2>
<p>Nope, with this project, we are explicitly not addressing developers or scientists. We want to offer something specifically for non-specialist users. So, many more people can benefit from them.</p>
<ul class="${"svelte-1jlekyq"}"><li>\u{1F4DA} students &amp; teacher</li>
<li>\u270F\uFE0F journalists</li>
<li>\u{1F525} climate activists</li>
<li>\u26D1 humanitarian helpers</li>
<li>\u{1F471}\u200D\u2640\uFE0F all citizens</li></ul>
<p>We will provide examples and libraries with which you can quickly get started without becoming an expert in the analysis of satellite data. More information on how you can use OpenSpaceData.org for you and your cause will follow.</p>
${validate_component(Follow, "Follow").$$render($$result, {}, {}, {})}
${validate_component(Fund, "Fund").$$render($$result, {}, {}, {})}`;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": About,
  prerender: prerender$1
});
var satellite = "/_app/assets/satellite.e80ee79f.svg";
var css$2 = {
  code: ".loading.svelte-v9zvic{display:grid;height:100%;place-items:center;text-align:center;width:100%}.loading svg{-webkit-animation:svelte-v9zvic-satellite-wobble 1s ease-in-out infinite alternate;animation:svelte-v9zvic-satellite-wobble 1s ease-in-out infinite alternate}@-webkit-keyframes svelte-v9zvic-satellite-wobble{33%{transform:rotate(5deg)}66%{transform:rotate(-5deg)}}@keyframes svelte-v9zvic-satellite-wobble{33%{transform:rotate(5deg)}66%{transform:rotate(-5deg)}}",
  map: `{"version":3,"file":"[slug].svelte","sources":["[slug].svelte"],"sourcesContent":["<script context=\\"module\\">\\n  import {base} from '$app/paths'\\n  export async function load({page, fetch}) {\\n    const slug = page.params.slug\\n    const guide = await fetch(\`\${base}/guide/\${slug}.json\`).then(r => r.json())\\n    return {\\n      props: {guide},\\n    }\\n  }\\n<\/script>\\n\\n<script>\\n  import {onMount} from 'svelte'\\n  import {choice as selected, location, range} from '$lib/store'\\n  import NumberedHeading from '$lib/NumberedHeading.svelte'\\n  import InlineSVG from 'svelte-inline-svg'\\n  import satellite from '$lib/svg/satellite.svg'\\n\\n  export let guide\\n\\n  const rangeType = $range.type\\n  /*\\n    If the rangeType === 'latest' then set a startDate of 2 months ago & an endDate of today.\\n    If it is a 'range' then send through the range dates set by the user.\\n    */\\n\\n  const getFilename = file => {\\n    const url = new URL(file).pathname.split('/')\\n    const filename = \`\${url[url.length - 2]}/\${url[url.length - 1]}\`\\n    return filename\\n  }\\n\\n  let downloads = []\\n  let api = null\\n\\n  function formatDate(date) {\\n    var d = new Date(date),\\n      month = '' + (d.getMonth() + 1),\\n      day = '' + d.getDate(),\\n      year = d.getFullYear()\\n\\n    if (month.length < 2) month = '0' + month\\n    if (day.length < 2) day = '0' + day\\n\\n    return [year, month, day].join('-')\\n  }\\n\\n  onMount(async () => {\\n    // Get the content for the guide\\n\\n    // Could zip files in a function:\\n    // https://gist.github.com/noelvo/4502eea719f83270c8e9\\n\\n    // Or on the browser:\\n    // https://huynvk.dev/blog/download-files-and-zip-them-in-your-browsers-using-javascript\\n\\n    const apiCase = $selected.id\\n    const today = new Date()\\n    const twoMonthsAgo = new Date().setMonth(today.getMonth() - 2)\\n\\n    const rangeStart = rangeType === 'latest' ? formatDate(twoMonthsAgo) : $range.startDate\\n    const rangeEnd = rangeType === 'latest' ? formatDate(today) : $range.endDate\\n\\n    const apiUrl = \`https://osd-fetch.fershad.workers.dev/?case=\${apiCase}&from=\${rangeStart}&to=\${rangeEnd}&location=\${$location.bbox}\`\\n    api = await fetch(apiUrl).then(resp => resp.json())\\n\\n    // console.log(api)\\n    const {files, bands} = api\\n    const filesRegex = /B.{2}/g\\n\\n    const fileArray = Object.entries(files).map(e => e[1])\\n\\n    downloads = await fileArray\\n      .map(file => {\\n        return Object.entries(file).filter(entry => {\\n          if (entry[0].match(filesRegex)) {\\n            return entry\\n          }\\n        })\\n      })\\n      .flat()\\n  })\\n<\/script>\\n\\n<div class=\\"guide\\">\\n  <div class=\\"wrapper flow\\">\\n    {#if api && api.machine_name}\\n      {#if downloads.length > 0}\\n        <h1><strong>Well done! \u{1F389}</strong><br />And now there' s the fun part:</h1>\\n        <section class=\\"flow\\">\\n          <NumberedHeading text=\\"What are we going to do?\\" step=\\"?\\" />\\n          {#if guide}\\n            {@html guide.content.introduction[0]}\\n          {/if}\\n        </section>\\n        <section class=\\"flow\\">\\n          <NumberedHeading\\n            text=\\"Download your satellite imagery\\"\\n            step=\\"1\\"\\n            details={$location ? \`For \${$location.place_name}\` : null} />\\n          <div class=\\"content\\">\\n            <p>\\n              First, you have to download the imagery directly from the European Space Agency.\\n              Sounds really exciting, right? But no problem for you: You just have to click the\\n              download buttons: \u{1F447}\\n            </p>\\n            <ul class=\\"downloads\\">\\n              {#each downloads as download}\\n                <li>\\n                  <a href={download[1]} download=\\"\\" id=\\"download-band-{download[0]}\\"\\n                    >Download file: {getFilename(download[1])}</a>\\n                </li>\\n              {:else}\\n                Loading ....\\n              {/each}\\n            </ul>\\n          </div>\\n          <div class=\\"content\\">\\n            <h3>Why I have to download multiple files?</h3>\\n            <p>Good question! Here comes the answer. Lorem ipsum...</p>\\n          </div>\\n        </section>\\n        <section>\\n          <NumberedHeading step=\\"2\\" text=\\"Process the images\\" />\\n          {#if guide}\\n            {@html guide.content.process[0]}\\n          {/if}\\n        </section>\\n        <section>\\n          <NumberedHeading step=\\"3\\" text=\\"Interpret the data\\" />\\n          {#if guide}\\n            {@html guide.content.interpret[0]}\\n          {/if}\\n        </section>\\n      {:else}\\n        <h2>Data unavailable</h2>\\n        <p>We can't find data that matches you search criteria.</p>\\n        <a href=\\"/\\" class=\\"button\\">Modify criteria</a>\\n      {/if}\\n    {:else if api && api.failed}\\n      <h2>Data unavailable</h2>\\n      <p>We can't find data that matches you search criteria.</p>\\n      <a href=\\"/\\" class=\\"button\\">Modify criteria</a>\\n    {:else}\\n      <div class=\\"loading\\">\\n        <InlineSVG src={satellite} />\\n        <h2>Fetching data ...</h2>\\n      </div>\\n    {/if}\\n  </div>\\n</div>\\n\\n<style>.loading{display:grid;height:100%;place-items:center;text-align:center;width:100%}:global(.loading svg){-webkit-animation:satellite-wobble 1s ease-in-out infinite alternate;animation:satellite-wobble 1s ease-in-out infinite alternate}@-webkit-keyframes satellite-wobble{33%{transform:rotate(5deg)}66%{transform:rotate(-5deg)}}@keyframes satellite-wobble{33%{transform:rotate(5deg)}66%{transform:rotate(-5deg)}}</style>\\n"],"names":[],"mappings":"AAwJO,sBAAQ,CAAC,QAAQ,IAAI,CAAC,OAAO,IAAI,CAAC,YAAY,MAAM,CAAC,WAAW,MAAM,CAAC,MAAM,IAAI,CAAC,AAAQ,YAAY,AAAC,CAAC,kBAAkB,8BAAgB,CAAC,EAAE,CAAC,WAAW,CAAC,QAAQ,CAAC,SAAS,CAAC,UAAU,8BAAgB,CAAC,EAAE,CAAC,WAAW,CAAC,QAAQ,CAAC,SAAS,CAAC,mBAAmB,8BAAgB,CAAC,GAAG,CAAC,UAAU,OAAO,IAAI,CAAC,CAAC,GAAG,CAAC,UAAU,OAAO,KAAK,CAAC,CAAC,CAAC,WAAW,8BAAgB,CAAC,GAAG,CAAC,UAAU,OAAO,IAAI,CAAC,CAAC,GAAG,CAAC,UAAU,OAAO,KAAK,CAAC,CAAC,CAAC"}`
};
async function load$1({ page, fetch: fetch2 }) {
  const slug = page.params.slug;
  const guide2 = await fetch2(`${base}/guide/${slug}.json`).then((r) => r.json());
  return { props: { guide: guide2 } };
}
var U5Bslugu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_location;
  let $range, $$unsubscribe_range;
  let $$unsubscribe_selected;
  $$unsubscribe_location = subscribe(location2, (value) => value);
  $$unsubscribe_range = subscribe(range, (value) => $range = value);
  $$unsubscribe_selected = subscribe(choice, (value) => value);
  let { guide: guide2 } = $$props;
  $range.type;
  if ($$props.guide === void 0 && $$bindings.guide && guide2 !== void 0)
    $$bindings.guide(guide2);
  $$result.css.add(css$2);
  $$unsubscribe_location();
  $$unsubscribe_range();
  $$unsubscribe_selected();
  return `<div class="${"guide"}"><div class="${"wrapper flow"}">${`${`<div class="${"loading svelte-v9zvic"}">${validate_component(Inline_svg, "InlineSVG").$$render($$result, { src: satellite }, {}, {})}
        <h2>Fetching data ...</h2></div>`}`}</div>
</div>`;
});
var _slug_ = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5Bslugu5D,
  load: load$1
});
var css$1 = {
  code: ".loading.svelte-v9zvic{display:grid;height:100%;place-items:center;text-align:center;width:100%}.loading svg{-webkit-animation:svelte-v9zvic-satellite-wobble 1s ease-in-out infinite alternate;animation:svelte-v9zvic-satellite-wobble 1s ease-in-out infinite alternate}@-webkit-keyframes svelte-v9zvic-satellite-wobble{33%{transform:rotate(5deg)}66%{transform:rotate(-5deg)}}@keyframes svelte-v9zvic-satellite-wobble{33%{transform:rotate(5deg)}66%{transform:rotate(-5deg)}}",
  map: `{"version":3,"file":"guide.svelte","sources":["guide.svelte"],"sourcesContent":["<script context=\\"module\\">\\n  export async function load({page, fetch, session, context}) {\\n    const url = \`/guides.json\`\\n    const res = await fetch(url)\\n\\n    if (res.ok) {\\n      return {\\n        props: {\\n          guides: await res.json(),\\n        },\\n      }\\n    }\\n\\n    return {\\n      status: res.status,\\n      error: new Error(error),\\n    }\\n  }\\n<\/script>\\n\\n<script>\\n  import {onMount} from 'svelte'\\n  import {choice as selected, location, range} from '$lib/store'\\n  import NumberedHeading from '$lib/NumberedHeading.svelte'\\n  import InlineSVG from 'svelte-inline-svg'\\n  import satellite from '$lib/svg/satellite.svg'\\n\\n  export let guides\\n  const guide = guides.find(d => d.value === $selected.caseFolder)\\n\\n  const rangeType = $range.type\\n  /*\\n    If the rangeType === 'latest' then set a startDate of 2 months ago & an endDate of today.\\n    If it is a 'range' then send through the range dates set by the user.\\n    */\\n\\n  const getFilename = file => {\\n    const url = new URL(file).pathname.split('/')\\n    const filename = \`\${url[url.length - 2]}/\${url[url.length - 1]}\`\\n    return filename\\n  }\\n\\n  let downloads = []\\n  let api = null\\n\\n  function formatDate(date) {\\n    var d = new Date(date),\\n      month = '' + (d.getMonth() + 1),\\n      day = '' + d.getDate(),\\n      year = d.getFullYear()\\n\\n    if (month.length < 2) month = '0' + month\\n    if (day.length < 2) day = '0' + day\\n\\n    return [year, month, day].join('-')\\n  }\\n\\n  onMount(async () => {\\n    // Get the content for the guide\\n\\n    // Could zip files in a function:\\n    // https://gist.github.com/noelvo/4502eea719f83270c8e9\\n\\n    // Or on the browser:\\n    // https://huynvk.dev/blog/download-files-and-zip-them-in-your-browsers-using-javascript\\n\\n    const apiCase = $selected.id\\n    const today = new Date()\\n    const twoMonthsAgo = new Date().setMonth(today.getMonth() - 2)\\n\\n    const rangeStart = rangeType === 'latest' ? formatDate(twoMonthsAgo) : $range.startDate\\n    const rangeEnd = rangeType === 'latest' ? formatDate(today) : $range.endDate\\n\\n    const apiUrl = \`https://osd-fetch.fershad.workers.dev/?case=\${apiCase}&from=\${rangeStart}&to=\${rangeEnd}&location=\${$location.bbox}\`\\n    api = await fetch(apiUrl).then(resp => resp.json())\\n\\n    const {files, bands} = api\\n    const filesRegex = /B.{2}/g\\n\\n    const fileArray = Object.entries(files).map(e => e[1])\\n\\n    downloads = await fileArray\\n      .map(file => {\\n        return Object.entries(file).filter(entry => {\\n          if (entry[0].match(filesRegex)) {\\n            return entry\\n          }\\n        })\\n      })\\n      .flat()\\n  })\\n\\n  const batchDownload = downloads.filter(download => download[1])\\n\\n  import Promise from 'bluebird'\\n  import JsZip from 'jszip'\\n  import FileSaver from 'file-saver'\\n\\n  const download = url => {\\n    return fetch(url).then(resp => resp.blob())\\n  }\\n\\n  const downloadByGroup = (urls, files_per_group = 5) => {\\n    return Promise.map(\\n      urls,\\n      async url => {\\n        return await download(url)\\n      },\\n      {concurrency: files_per_group}\\n    )\\n  }\\n\\n  const exportZip = blobs => {\\n    const zip = JsZip()\\n    blobs.forEach((blob, i) => {\\n      zip.file(\`file-\${i}.csv\`, blob)\\n    })\\n    zip.generateAsync({type: 'blob'}).then(zipFile => {\\n      const currentDate = new Date().getTime()\\n      const fileName = \`combined-\${currentDate}.zip\`\\n      return FileSaver.saveAs(zipFile, fileName)\\n    })\\n  }\\n\\n  const downloadAndZip = () => {\\n    return downloadByGroup(batchDownload, 5).then(exportZip)\\n  }\\n<\/script>\\n\\n<div class=\\"guide\\">\\n  <div class=\\"wrapper flow\\">\\n    {#if api && api.machine_name}\\n      {#if downloads.length > 0}\\n        <h1><strong>Well done! \u{1F389}</strong><br />And now there' s the fun part:</h1>\\n        <section class=\\"flow\\">\\n          <NumberedHeading text=\\"What are we going to do?\\" step=\\"?\\" />\\n          {#if guide}\\n            {@html guide.content.introduction[0]}\\n          {/if}\\n        </section>\\n        <section class=\\"flow\\">\\n          <NumberedHeading\\n            text=\\"Download your satellite imagery\\"\\n            step=\\"1\\"\\n            details={$location ? \`For \${$location.place_name}\` : null} />\\n          <div class=\\"content\\">\\n            <p>\\n              First, you have to download the imagery directly from the European Space Agency.\\n              Sounds really exciting, right? But no problem for you: You just have to click the\\n              download buttons: \u{1F447}\\n            </p>\\n            <button on:click={() => downloadAndZip()}>Download all files</button>\\n            <ul class=\\"downloads\\">\\n              {#each downloads as download}\\n                <li>\\n                  <a href={download[1]} download=\\"\\" id=\\"download-band-{download[0]}\\"\\n                    >Download file: {getFilename(download[1])}</a>\\n                </li>\\n              {:else}\\n                Loading ....\\n              {/each}\\n            </ul>\\n          </div>\\n          <div class=\\"content\\">\\n            <h3>Why I have to download multiple files?</h3>\\n            <p>Good question! Here comes the answer. Lorem ipsum...</p>\\n          </div>\\n        </section>\\n        <section>\\n          <NumberedHeading step=\\"2\\" text=\\"Process the images\\" />\\n          {#if guide}\\n            {@html guide.content.process[0]}\\n          {/if}\\n        </section>\\n        <section>\\n          <NumberedHeading step=\\"3\\" text=\\"Interpret the data\\" />\\n          {#if guide}\\n            {@html guide.content.interpret[0]}\\n          {/if}\\n        </section>\\n      {:else}\\n        <h2>Data unavailable</h2>\\n        <p>We can't find data that matches you search criteria.</p>\\n        <a href=\\"/\\" class=\\"button\\">Modify criteria</a>\\n      {/if}\\n    {:else if api && api.failed}\\n      <h2>Data unavailable</h2>\\n      <p>We can't find data that matches you search criteria.</p>\\n      <a href=\\"/\\" class=\\"button\\">Modify criteria</a>\\n    {:else}\\n      <div class=\\"loading\\">\\n        <InlineSVG src={satellite} />\\n        <h2>Fetching data ...</h2>\\n      </div>\\n    {/if}\\n  </div>\\n</div>\\n\\n<style>.loading{display:grid;height:100%;place-items:center;text-align:center;width:100%}:global(.loading svg){-webkit-animation:satellite-wobble 1s ease-in-out infinite alternate;animation:satellite-wobble 1s ease-in-out infinite alternate}@-webkit-keyframes satellite-wobble{33%{transform:rotate(5deg)}66%{transform:rotate(-5deg)}}@keyframes satellite-wobble{33%{transform:rotate(5deg)}66%{transform:rotate(-5deg)}}</style>\\n"],"names":[],"mappings":"AAsMO,sBAAQ,CAAC,QAAQ,IAAI,CAAC,OAAO,IAAI,CAAC,YAAY,MAAM,CAAC,WAAW,MAAM,CAAC,MAAM,IAAI,CAAC,AAAQ,YAAY,AAAC,CAAC,kBAAkB,8BAAgB,CAAC,EAAE,CAAC,WAAW,CAAC,QAAQ,CAAC,SAAS,CAAC,UAAU,8BAAgB,CAAC,EAAE,CAAC,WAAW,CAAC,QAAQ,CAAC,SAAS,CAAC,mBAAmB,8BAAgB,CAAC,GAAG,CAAC,UAAU,OAAO,IAAI,CAAC,CAAC,GAAG,CAAC,UAAU,OAAO,KAAK,CAAC,CAAC,CAAC,WAAW,8BAAgB,CAAC,GAAG,CAAC,UAAU,OAAO,IAAI,CAAC,CAAC,GAAG,CAAC,UAAU,OAAO,KAAK,CAAC,CAAC,CAAC"}`
};
async function load({ page, fetch: fetch2, session, context }) {
  const url = `/guides.json`;
  const res2 = await fetch2(url);
  if (res2.ok) {
    return { props: { guides: await res2.json() } };
  }
  return {
    status: res2.status,
    error: new Error(error)
  };
}
var Guide = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_location;
  let $range, $$unsubscribe_range;
  let $selected, $$unsubscribe_selected;
  $$unsubscribe_location = subscribe(location2, (value) => value);
  $$unsubscribe_range = subscribe(range, (value) => $range = value);
  $$unsubscribe_selected = subscribe(choice, (value) => $selected = value);
  let { guides } = $$props;
  guides.find((d2) => d2.value === $selected.caseFolder);
  $range.type;
  let downloads = [];
  downloads.filter((download) => download[1]);
  if ($$props.guides === void 0 && $$bindings.guides && guides !== void 0)
    $$bindings.guides(guides);
  $$result.css.add(css$1);
  $$unsubscribe_location();
  $$unsubscribe_range();
  $$unsubscribe_selected();
  return `<div class="${"guide"}"><div class="${"wrapper flow"}">${`${`<div class="${"loading svelte-v9zvic"}">${validate_component(Inline_svg, "InlineSVG").$$render($$result, { src: satellite }, {}, {})}
        <h2>Fetching data ...</h2></div>`}`}</div>
</div>`;
});
var guide = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Guide,
  load
});
var css = {
  code: "main.flow.svelte-1r8zpyi{--flow-space:var(--size-500)}",
  map: `{"version":3,"file":"__layout.reset.svelte","sources":["__layout.reset.svelte"],"sourcesContent":["<script>\\n  import Header from '$lib/Header.svelte'\\n  import Footer from '$lib/Footer.svelte'\\n  import '../../app.css'\\n<\/script>\\n\\n<svelte:head>\\n  <title>OpenSpaceData</title>\\n</svelte:head>\\n\\n<Header />\\n\\n<main class=\\"flow wrapper\\">\\n  <slot />\\n</main>\\n\\n<Footer />\\n\\n<style>main.flow{--flow-space:var(--size-500)}</style>\\n"],"names":[],"mappings":"AAkBO,IAAI,oBAAK,CAAC,aAAa,eAAe,CAAC"}`
};
var _layout_reset = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `${$$result.head += `${$$result.title = `<title>OpenSpaceData</title>`, ""}`, ""}

${validate_component(Header, "Header").$$render($$result, {}, {}, {})}

<main class="${"flow wrapper svelte-1r8zpyi"}">${slots.default ? slots.default({}) : ``}</main>

${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});
var __layout_reset = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout_reset
});
var prerender = true;
var Help = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `${$$result.title = `<title>Help - OpenSpaceData</title>`, ""}`, ""}


<h1>Help</h1>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Help,
  prerender
});
var Category$5 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
id: &#39;floods&#39;
text: &#39;Study floods and droughts&#39;
image: &#39;/img/earth.jpg&#39;
---`;
});
var category$5 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Category$5
});
var Category$4 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
id: &#39;snow&#39;
text: &#39;Examine snow and glacier&#39;
image: &#39;/img/iceland.jpg&#39;
---`;
});
var category$4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Category$4
});
var Category$3 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
id: &#39;urban&#39;
text: &#39;Check urban development&#39;
image: &#39;/img/city.jpg&#39;
---`;
});
var category$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Category$3
});
var Category$2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
id: &#39;vegetation&#39;
text: &#39;Analyse vegetation and geology&#39;
image: &#39;/img/forest.jpg&#39;
---`;
});
var category$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Category$2
});
var Category$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
id: &#39;water&#39;
text: &#39;Inspect ocean and water bodies&#39;
image: &#39;/img/wave.jpg&#39;
---`;
});
var category$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Category$1
});
var Category = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
id: &#39;wildfire&#39;
text: &#39;Investigate wildfires&#39;
image: &#39;/img/wildfire.jpg&#39;
---`;
});
var category = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Category
});
var Case$7 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
heading: &#39;Detect Water&#39;
difficulty: &#39;easy&#39;
id: &#39;water&#39;
---`;
});
var _case$7 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Case$7
});
var Interpret$3 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;detect-water&#39;
content: &#39;interpret&#39;
---

**How to read the colors:** \\
Yellow to green colored areas correspond to non-water content like rocks, vegetation, buildings or dry soil. Blue areas indicate water.

![](/img/ndwi-legend.png)

**Dive deeper into this topic:** \\
You should never blindly rely on data. They know no context. That means the correct reading and interpretation of the data is up to you. Therefore, you should familiarize yourself with the NDWI, its strengths and weaknesses, before publishing your findings or making decisions based on them.

Here we have some further resources for you:

- Factsheet: [Normalized Difference Water Index](https://edo.jrc.ec.europa.eu/documents/factsheets/factsheet_ndwi.pdf)
- Article: [Applications and limitations (Bikesh Bade)](https://bikeshbade.com.np/tutorials/Detail/?title=All%20you%20need%20to%20know%20about%20NDWI:%20Normalized%20Difference%20Water%20Index&amp;code=22)`;
});
var interpret$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Interpret$3
});
var Introduction$3 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;detect-water&#39;
content: &#39;introduction&#39;
---

In the next 20-30 minutes we will analyze water bodies on a satellite image showing the region you have chosen. For this we will use a scientific indicator - the Normalized Difference Water Index. Or NDWI for short. Don&#39;t worry, it sounds more complicated than it is. We will guide you step-by-step through this process.

At the end you will get a picture where water bodies are colored vibrant blue and non-water content, i.e. soil, vegetation or buildings, are colored yellow to green. This gives you a quick overview of the water in your study area and helps you to monitor changes in water bodies.

Don&#39;t worry, if you get stuck, just use our forum. We and other users are happy to help you.

Sounds good? Then go ahead...`;
});
var introduction$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Introduction$3
});
var Process$3 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;detect-water&#39;
content: &#39;process&#39;
---
### Step 1: Download and install QGis
QGis is a free geographic information system application that supports viewing, editing, and analysis of geospatial data. Although it is free, it is a very professional software that is also used by satellite imagary professionals.

QGis can be installed on all major operating systems. These include Mac OS, Microsoft Windows and also Linux.

Installation instructions and the download for the software itself can be found here: [https://www.qgis.org/en/site/forusers/download.html](https://www.qgis.org/en/site/forusers/download.html)

The installation requires 15-25 minutes. After completion, you can skip to step two.

### Step 2: Open QGis and start a new project
Great, you&#39;ve cleared the first hurdle. Now the fun begins, because we are going to edit the satellite data!

The first thing to do is to start the QGis software you just installed. Now go to Project in the menu and then select \`New\`.

![](/img/ndvi-2-start-project.png)

For the next steps: Depending on which operating system you are using, the display of QGis may be slightly different. However, the corresponding options and fields should still be available.

And one more thing: Of course, I don&#39;t use the same data on the screenshots that you do. In other words, my data may look different. Don&#39;t let this confuse you.

### Step 3: Open the data
It sounds complicated to open satellite data, doesn&#39;t it? But it&#39;s not so bad, QGis does most of the work for us.

It\u2019s pretty easy to open the files: Just go to the directory where your satellite data is saved, probably in the downloads directory, select the files and drag them into the layers panel in QGis. Just take a look on my screen to know exactly where to drag them:

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-3-open-data.mp4"}" type="${"video/mp4"}"></video>

*Note: If you have downloaded the files as a ZIP file, unpack them first.*

No you can see your data in the layers panel and on the right, big panel you can see your data visualized. A bit too grey, isn&#39;t it? We&#39;ll take care of that in a moment...

Make sure that you save your project. Do this by clicking on \`Project\` and then on \`Save as\`. A new window opens and you can choose the right directory on your PC and give your project a suitable name. Then just click on \`Save\`.

### Step 4: Add a map for better orientation
So that we can orient ourselves better on the data, we put a map on top of the data. You can imagine it like Google Maps. So we can see better where we are. In technical language, such maps are called basemaps. That\u2019s, too, super simple. So, let&#39;s add a basemap.

Go to the \`browser panel\` (on top of the layers panel) and look for the entry \`XYZ Tiles\`. Click on the small arrow on the left. Now just double click on \`OpenStreetMap\`. 

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-4-add-basemap.mp4"}" type="${"video/mp4"}"></video>

<details><summary>What is OpenStreetMap?</summary>
    <p>OpenStreetMap, or OSM in short, is an <a href="${"https://www.openstreetmap.org"}">alternative to Google Maps</a>. The cool thing is it is completely free to use and open source. That means everybody can contribute to the maps and you can do whatever you want with the data. But that&#39;s not important for us now. If you are interested in OSM, take a look at <a href="${"https://www.openstreetmap.org/about"}">their website</a>.</p></details>

**Congratulations**, you\u2019ve added a basemap to your project. 

But, what happened there! Sometimes the basemap lays on top of your satellite data and you can&#39;t see it anymore, other times the basemap lays between or under the data and you cant see the basemap anymore. No problem, we will fix this.

Depending on what you want to do, you can change the opacity of the layers, the order or hide specific layers. For now, we will just put the basemap behind our data. To do that, we just can rearrange the order of the layers with simple drag and drop. Select the OpenStreetMap layer and drag it to the bottom of the list.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-4-order-layers.mp4"}" type="${"video/mp4"}"></video>

### Step 5: Learn about your data and how to delineate open water features from it
Well, brace yourself: now comes the magic. What happens now? We will process the data so that we can see from the image where water is blue, non-water content is yellow.

**How do we do that?** \\
We use a method that calculates the different data with a certain formula so that the result is a value between -1 and +1 for each point on the image. -1 stands for &quot;no water&quot; and +1 for, surprise, &quot;water&quot;.

This method is called calculating an index. The index is the result of the formula and the formula we use is called NDWI, the Normalized Difference Water Index.

This all sounds very complicated, doesn&#39;t it? Let&#39;s start from the beginning. What exactly is our satellite data?

*Note: This content is optional. If you are not interested in the theoretical background, just jump to Step 6.*

<details><summary>So, what does &#39;raster data&#39; mean?</summary>
    <img src="${"/img/ndvi-5-raster-data.png"}" alt="${""}">
    <p>Raster data is like a picture that you would take with a digital camera: at the lowest level of abstraction, it is a list of pixels with values. When you \u2018zoom in\u2019 and look closer at raster data, at some point you\u2019ll see these discrete pixels, and it will look pixelated.</p>
    <p>Raster data is used in pictures of the Earth, like those taken by satellites - but that is just the beginning. Pixels don\u2019t need to have colors - instead, each pixel can have a number that represents height and the raster data as a whole stores elevation data. Or pixels can store temperature or reflection data and be useful for environmental work.</p></details>

Cool, we have raster data. But why do you have multiple files of the same location and why do they look different? That\u2019s are different bands. On this project we use Band 3 and Band 8 of the satellite.

<details><summary>What are satellite bands?</summary>
    <p>The pixels in raster data are not necessarily just filled color: we call its contents \u2018bands\u2019. A normal image has three familiar bands: Red, Green, and Blue. Combined, they make a picture we\u2019re familiar with. Some raster data can have fewer bands, like just one for elevation, or some can have a lot more - not just visible colors, but wavelengths we can\u2019t see, like infrared and ultraviolet. When raster data is analyzed and displayed, you can combine and pick different bands to use to suit what you\u2019re looking for.</p></details>

*Sure, raster data, bands, but what the heck is the NDWI?* Great question, my friend. With the specific formula of the NDWI we will combine the Bands 3 and 8. Why? Read on:

<details><summary>How does the NDWI indicator work?</summary>
    <p>The Normalized Difference Water Index (NDWI) is derived from the Near-Infrared and Green bands. This formula highlights the amount of water in water bodies.</p>
    <p>The NDWI is efficient to detect surface water because these surfaces have a very low reflectance in the NIR region of the spectra - in contrast to the vegetation which is characterized by a high reflectance in the NIR.</p>
    <p>The values of the NDWI can lie between -1 and +1. Negative values indicate no water, like buildings or dry soil. The higher the positive NDWI value, more water content is present.</p></details>

Enough dry theory. Now it&#39;s down to the nitty-gritty.

### Step 6: Calculating the NDWI
Let\u2019s get ready to rumble. What we will do now, is calculate the NDWI from the data you\u2019ve downloaded.

The formula for the NDWI is the following: (B03 - B08) / (B03 + B08)

Band 8, or shorter B08, represents the near infrared radiation and Band 3, or B03, the visible green.

To use this formula in QGis and with your data, you have to go the following steps:

1. Click on \`Raster\` in the top menu.
2. Choose the \`raster calculator\`. A new window should open now.
3. Below the field \`Output layer\` is a button with 3 points. Click on it and write \u201CNDWI\u201D in the file name input field. Click \`Save\`.
4. Copy the following formular and paste it into the field named \`Raster Calculator Expression\`: ( &quot;B03@1&quot; - &quot;B08@1&quot; ) / ( &quot;B03@1&quot; + + &quot;B08@1&quot; )
5. Click \`Ok\`.
6. Wait for it\u2026 Voila.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-6-calculate-ndwi.mp4"}" type="${"video/mp4"}"></video>

That\u2019s all. Almost.

### Step 7: Bring colour into the game
To make the data easier to understand, we want that no water is yellow/green and water is black\u2026 joke. Water should be, of course, blue. For that we will colorize the grey image.

1. Double-click the NDWI layer in the layers panel. A new window will appear.
2. Choose \`Symbology\` on the left.
3. Change the \`Render type\` from Singleband gray to Singleband pseudocolor.
4. In the \`Min\` input write -1 and in the \`Max\` input 1.
5. On the right side of the color ramp dropdown is an arrow downwards. Click on it.
6. Then choose \`All color ramps\` and select \`YlGnBu\` (the third option from bottom).
7. Below the table with the colored squares, click on \`classify\`.
8. Click \`Apply\` _and_ \`Ok\`.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-7-colorize-data.mp4"}" type="${"video/mp4"}"></video>

Well done, now it&#39;s looking much nicer, right?

### Step 8: Analyze your data
There are now two ways to take a closer look at the data. Either via QGis itself or you export. Both have their advantages and disadvantages. I will explain them to you in the following:

**Use QGis to move around the data**\\
QGis offers a variety of ways to dive deep into your data. You can zoom in and out of the layers, move freely on the map and make individual layers more transparent to get an even better overview.

To make your NDWI layer more transparent so that you can see the basemap better, you first have to hide the two bands. We don&#39;t need them any more. Just click on the tick in front of the layer. My recommendation: Only tick the layers you really need. That way you keep the overview. In our case it is the NDWI layer and the basemap:

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-8-layer-display.mp4"}" type="${"video/mp4"}"></video>

Then click on the small brush in the layers panel. A new area has opened on the right side. Click on \`Transparency\` to set the transparency for each layer under \`Global Transparency\`. Make sure that you have selected the right layer. I set the transparency a little lower so that I can see the basemap underneath better. This makes it easier for me to orientate myself.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-8-layer-opacity.mp4"}" type="${"video/mp4"}"></video>

**Export the image**\\
To be able to share your data with others or to print them, it is useful to export the data - for example as PDF or JPG. You can then share the files with other people without them having to have QGis installed. Practical, isn&#39;t it?

To do this, simply take the following steps:

1. Go to \`Project\` in the menu.
2. Select \`Import/Export\` and choose \`Export Map to Image\` or \`Export Map to PDF\`.
3. If you have selected PDF: Check the box \`Create Geospatial PDF (GeoPDF)\`.
4. Now click \`Save\`.
5. Select the location where you want to save the file, enter a file name and click \`Save\`.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-8-export-map.mp4"}" type="${"video/mp4"}"></video>`;
});
var process$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Process$3
});
var Case$6 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
heading: &#39;Detect Snow Cover&#39;
difficulty: &#39;easy&#39;
id: &#39;snow-cover&#39;
---`;
});
var _case$6 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Case$6
});
var Case$5 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
heading: &#39;True Color Image&#39;
difficulty: &#39;easy&#39;
id: &#39;true-color&#39;
---`;
});
var _case$5 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Case$5
});
var Case$4 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
heading: &#39;Visualizing Urbanized Areas&#39;
difficulty: &#39;easy&#39;
id: &#39;urban-development&#39;
---`;
});
var _case$4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Case$4
});
var Case$3 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
heading: &#39;Visualizing Barren Soil&#39;
difficulty: &#39;moderate&#39;
id: &#39;barren-soil&#39;
---`;
});
var _case$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Case$3
});
var Interpret$2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;barren-soil&#39;
content: &#39;interpret&#39;
---

How to read the colors: Red colored areas correspond to empty areas of rocks, sand or snow. Moderate values, mostly orange to yellow, represent shrubs and meadows, while bright green areas indicate temperate and tropical forests.

Dive deeper into this topic: You should never blindly rely on data. They know no context. That means the correct reading and interpretation of the data is up to you. Therefore, you should familiarize yourself with the NDVI, its strengths and weaknesses, before publishing your findings or making decisions based on them.

Here we have some further resources for you:

- [Get started with the NDVI (EOS)](https://www.google.com)
- [What is NDVI and how can you benefit (Broadwater Contracting)](https://www.google.com)
- [Performance and limitations (Wikipedia)](https://www.google.com)
- [Measuring Vegetation with NDVI &amp; EVI (NASA Earth Observatory)](https://www.google.com)`;
});
var interpret$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Interpret$2
});
var Introduction$2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;barren-soil&#39;
content: &#39;introduction&#39;
---

In the next 20-30 minutes we will analyze the green vegetation on a satellite image showing the region you have chosen. For this we will use a scientific indicator - the Normalized Difference Vegetation Index. Or NDVI for short. Don&#39;t worry, it sounds more complicated than it is. We will guide you step-by-step through this process.

At the end you will get a picture where healthy vegetation is colored green and unhealthy vegetation, i.e. vegetation with low or no chlorophyll content, is colored orange or red. This gives you a quick overview of the state of the vegetation in your study area.

Don&#39;t worry, if you get stuck, just use our forum. We and other users are happy to help you.

Sounds good? Then go ahead...`;
});
var introduction$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Introduction$2
});
var Process$2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;barren-soil&#39;
content: &#39;process&#39;
---
## Step 1: Downloading &amp; Installing QGis

Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.

## Step 2: Open the image

Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.`;
});
var process$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Process$2
});
var Case$2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
heading: &#39;Analyzing Green Vegetation Health&#39;
difficulty: &#39;easy&#39;
id: &#39;vegetation-health&#39;
---`;
});
var _case$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Case$2
});
var Interpret$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;vegetation-health&#39;
content: &#39;interpret&#39;
---

**How to read the colors:** \\
Brown to white colored areas correspond to empty areas like rocks, sand, buildings or dead plants. Moderate values, mostly light green, represent shrubs and meadows, while bright green areas indicate healthy vegetation.

![](/img/ndvi-legend.png)

**Dive deeper into this topic:** \\
You should never blindly rely on data. They know no context. That means the correct reading and interpretation of the data is up to you. Therefore, you should familiarize yourself with the NDVI, its strengths and weaknesses, before publishing your findings or making decisions based on them.

Here we have some further resources for you:

- [Get started with the NDVI (EOS)](https://eos.com/make-an-analysis/ndvi/)
- [Video: What is NDVI and how can you benefit (Broadwater Contracting)](https://www.youtube.com/watch?v=xgykmNUwRjw)
- [Vegetation indices: instructions for use (Agricolus)](https://www.agricolus.com/en/indici-vegetazione-ndvi-ndmi-istruzioni-luso/)
- [Performance and limitations (Wikipedia)](https://en.wikipedia.org/wiki/Normalized_difference_vegetation_index#Performance_and_limitations)
- [Measuring Vegetation with NDVI &amp; EVI (NASA Earth Observatory)](https://www.earthobservatory.nasa.gov/features/MeasuringVegetation)`;
});
var interpret$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Interpret$1
});
var Introduction$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;vegetation-health&#39;
content: &#39;introduction&#39;
---

In the next 20-30 minutes we will analyze the green vegetation on a satellite image showing the region you have chosen. For this we will use a scientific indicator - the Normalized Difference Vegetation Index. Or NDVI for short. Don&#39;t worry, it sounds more complicated than it is. We will guide you step-by-step through this process.

At the end you will get a picture where healthy vegetation is colored green and unhealthy vegetation, i.e. vegetation with low or no chlorophyll content, is colored orange or red. This gives you a quick overview of the state of the vegetation in your study area.

Don&#39;t worry, if you get stuck, just use our forum. We and other users are happy to help you.

Sounds good? Then go ahead...`;
});
var introduction$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Introduction$1
});
var Process$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;vegetation-health&#39;
content: &#39;process&#39;
---
### Step 1: Download and install QGis
QGis is a free geographic information system application that supports viewing, editing, and analysis of geospatial data. Although it is free, it is a very professional software that is also used by satellite imagary professionals.

QGis can be installed on all major operating systems. These include Mac OS, Microsoft Windows and also Linux.

Installation instructions and the download for the software itself can be found here: [https://www.qgis.org/en/site/forusers/download.html](https://www.qgis.org/en/site/forusers/download.html)

The installation requires 15-25 minutes. After completion, you can skip to step two.

### Step 2: Open QGis and start a new project
Great, you&#39;ve cleared the first hurdle. Now the fun begins, because we are going to edit the satellite data!

The first thing to do is to start the QGis software you just installed. Now go to Project in the menu and then select \`New\`.

![](/img/ndvi-2-start-project.png)

For the next steps: Depending on which operating system you are using, the display of QGis may be slightly different. However, the corresponding options and fields should still be available.

And one more thing: Of course, I don&#39;t use the same data on the screenshots that you do. In other words, my data may look different. Don&#39;t let this confuse you.

### Step 3: Open the data
It sounds complicated to open satellite data, doesn&#39;t it? But it&#39;s not so bad, QGis does most of the work for us.

It\u2019s pretty easy to open the files: Just go to the directory where your satellite data is saved, probably in the downloads directory, select the files and drag them into the layers panel in QGis. Just take a look on my screen to know exactly where to drag them:

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndvi-3-open-data.mp4"}" type="${"video/mp4"}"></video>

*Note: If you have downloaded the files as a ZIP file, unpack them first.*

No you can see your data in the layers panel and on the right, big panel you can see your data visualized. A bit too grey, isn&#39;t it? We&#39;ll take care of that in a moment...

Make sure that you save your project. Do this by clicking on \`Project\` and then on \`Save as\`. A new window opens and you can choose the right directory on your PC and give your project a suitable name. Then just click on \`Save\`.

### Step 4: Add a map for better orientation
So that we can orient ourselves better on the data, we put a map on top of the data. You can imagine it like Google Maps. So we can see better where we are. In technical language, such maps are called basemaps. That\u2019s, too, super simple. So, let&#39;s add a basemap.

Go to the \`browser panel\` (on top of the layers panel) and look for the entry \`XYZ Tiles\`. Click on the small arrow on the left. Now just double click on \`OpenStreetMap\`. 

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndvi-4-add-basemap.mp4"}" type="${"video/mp4"}"></video>

<details><summary>What is OpenStreetMap?</summary>
    <p>OpenStreetMap, or OSM in short, is an <a href="${"https://www.openstreetmap.org"}">alternative to Google Maps</a>. The cool thing is it is completely free to use and open source. That means everybody can contribute to the maps and you can do whatever you want with the data. But that&#39;s not important for us now. If you are interested in OSM, take a look at <a href="${"https://www.openstreetmap.org/about"}">their website</a>.</p></details>

**Congratulations**, you\u2019ve added a basemap to your project. 

But, what happened there! Sometimes the basemap lays on top of your satellite data and you can&#39;t see it anymore, other times the basemap lays between or under the data and you cant see the basemap anymore. No problem, we will fix this.

Depending on what you want to do, you can change the opacity of the layers, the order or hide specific layers. For now, we will just put the basemap behind our data. To do that, we just can rearrange the order of the layers with simple drag and drop. Select the OpenStreetMap layer and drag it to the bottom of the list.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndvi-4-order-layers.mp4"}" type="${"video/mp4"}"></video>

### Step 5: Learn about your data and how to get the vegetation health information from it
Well, brace yourself: now comes the magic. What happens now? We will process the data so that we can see from the image where healthy green plants are, where plants are not healthy and where there are no plants.

**How do we do that?** \\
We use a method that calculates the different data with a certain formula so that the result is a value between -1 and +1 for each point on the image. -1 stands for &quot;no vegetation&quot; and +1 for &quot;healthy vegetation&quot;. For the sake of simplicity, we can also refer to vegetation as plants.

This method is called calculating an index. The index is the result of the formula and the formula we use is called NDVI, the Normalized Difference Vegetation Index.

This all sounds very complicated, doesn&#39;t it? Let&#39;s start from the beginning. What exactly is our satellite data?

*Note: This content is optional. If you are not interested in the theoretical background, just jump to Step 6.*

<details><summary>So, what does &#39;raster data&#39; mean?</summary>
    <img src="${"/img/ndvi-5-raster-data.png"}" alt="${""}">
    <p>Raster data is like a picture that you would take with a digital camera: at the lowest level of abstraction, it is a list of pixels with values. When you \u2018zoom in\u2019 and look closer at raster data, at some point you\u2019ll see these discrete pixels, and it will look pixelated.</p>
    <p>Raster data is used in pictures of the Earth, like those taken by satellites - but that is just the beginning. Pixels don\u2019t need to have colors - instead, each pixel can have a number that represents height and the raster data as a whole stores elevation data. Or pixels can store temperature or reflection data and be useful for environmental work.</p></details>

Cool, we have raster data. But why do you have multiple files of the same location and why do they look different? That\u2019s are different bands. On this project we use Band 4 and Band 8 of the satellite.

<details><summary>What are satellite bands?</summary>
    <p>The pixels in raster data are not necessarily just filled color: we call its contents \u2018bands\u2019. A normal image has three familiar bands: Red, Green, and Blue. Combined, they make a picture we\u2019re familiar with. Some raster data can have fewer bands, like just one for elevation, or some can have a lot more - not just visible colors, but wavelengths we can\u2019t see, like infrared and ultraviolet. When raster data is analyzed and displayed, you can combine and pick different bands to use to suit what you\u2019re looking for.</p></details>

*Sure, raster data, bands, but what the heck is the NDVI?* Great question, my friend. With the specific formula of the NDVI we will combine the Bands 4 and 8. Why? Read on:

<details><summary>How does the NDVI indicator work?</summary>
    <p>Wikipedia says something like, \u201CThe normalized difference vegetation index (NDVI) is a simple graphical indicator that can be used to analyze satellite data, assessing whether or not the target being observed contains live green vegetation.\u201D.</p>
    <p>The NDVI thus takes advantage of the property that healthy vegetation reflects visible red light only weakly but infrared radiation strongly, which is more or less not the case for other surface coverings such as buildings, soil or water, which is why the latter tend to receive a negative vegetation index when calculating the NDVI.</p>
    <p>The values of the NDVI can lie between -1 and +1. Positive values indicate green vegetation. The higher the positive NDVI value, the healthier the vegetation.</p></details>

Enough dry theory. Now it&#39;s down to the nitty-gritty.

### Step 6: Calculating the NDVI
Let\u2019s get ready to rumble. What we will do now, is calculate the NDVI from the data you\u2019ve downloaded.

The formula for the NDVI is the following: (B08 - B04) / (B08 + B04)

Band 8, or shorter B08, represents the near infrared radiation and Band 4, or B04, the visible red.

To use this formula in QGis and with your data, you have to go the following steps:

1. Click on \`Raster\` in the top menu.
2. Choose the \`raster calculator\`. A new window should open now.
3. Below the field \`Output layer\` is a button with 3 points. Click on it and write \u201CNDVI\u201D in the file name input field. Click \`Save\`.
4. Copy the following formular and paste it into the field named \`Raster Calculator Expression\`: ( &quot;B08@1&quot; - &quot;B04@1&quot; ) / ( &quot;B08@1&quot; + + &quot;B04@1&quot; )
5. Click \`Ok\`.
6. Wait for it\u2026 Voila.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndvi-6-calculate-ndvi.mp4"}" type="${"video/mp4"}"></video>

That\u2019s all. Almost.

### Step 7: Bring colour into the game
To make the data easier to understand, we want that no vegetation is brown and healthy vegetation green. For that we will colorize the grey image.

1. Double-click the NDVI layer in the layers panel. A new window will appear.
2. Choose \`Symbology\` on the left.
3. Change the \`Render type\` from Singleband gray to Singleband pseudocolor.
4. In the \`Min\` input write -1 and in the \`Max\` input 1.
5. On the right side of the color ramp dropdown is an arrow downwards. Click on it.
6. Then choose \`All color ramps\` and select \`BrBG\` (the second option from top).
7. Below the table with the colored squares, click on \`classify\`.
8. Click \`Apply\` _and_ \`Ok\`.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndvi-7-colorize-data.mp4"}" type="${"video/mp4"}"></video>

Well done, now it&#39;s looking much nicer, right?

### Step 8: Analyze your data
There are now two ways to take a closer look at the data. Either via QGis itself or you export. Both have their advantages and disadvantages. I will explain them to you in the following:

**Use QGis to move around the data**\\
QGis offers a variety of ways to dive deep into your data. You can zoom in and out of the layers, move freely on the map and make individual layers more transparent to get an even better overview.

To make your NDVI layer more transparent so that you can see the basemap better, you first have to hide the two bands. We don&#39;t need them any more. Just click on the tick in front of the layer. My recommendation: Only tick the layers you really need. That way you keep the overview. In our case it is the NDVI layer and the basemap:

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndvi-8-layer-display.mp4"}" type="${"video/mp4"}"></video>

Then click on the small brush in the layers panel. A new area has opened on the right side. Click on \`Transparency\` to set the transparency for each layer under \`Global Transparency\`. Make sure that you have selected the right layer. I set the transparency a little lower so that I can see the basemap underneath better. This makes it easier for me to orientate myself.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndvi-8-layer-opacity.mp4"}" type="${"video/mp4"}"></video>

Now you can explore the map and look at the different NDVI values, which lie between -1 and 1, for each pixel on your map. To do this, click on the symbol with the i and the mouse pointer in the toolbar. Select the function \`Identify Features\`. Now you can click on a point on the map that you are interested in. As soon as you have done this, a new area will open on the right side and you can read the value. You can read more about the meaning of the values in the Interpret step below.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndvi-8-identify-features.mp4"}" type="${"video/mp4"}"></video>

**Export the image**\\
To be able to share your data with others or to print them, it is useful to export the data - for example as PDF or JPG. You can then share the files with other people without them having to have QGis installed. Practical, isn&#39;t it?

To do this, simply take the following steps:

1. Go to \`Project\` in the menu.
2. Select \`Import/Export\` and choose \`Export Map to Image\` or \`Export Map to PDF\`.
3. If you have selected PDF: Check the box \`Create Geospatial PDF (GeoPDF)\`.
4. Now click \`Save\`.
5. Select the location where you want to save the file, enter a file name and click \`Save\`.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndvi-8-export-map.mp4"}" type="${"video/mp4"}"></video>`;
});
var process$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Process$1
});
var Case$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
heading: &#39;Detect Water&#39;
difficulty: &#39;easy&#39;
id: &#39;water&#39;
---`;
});
var _case$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Case$1
});
var Interpret = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;detect-water&#39;
content: &#39;interpret&#39;
---

**How to read the colors:** \\
Yellow to green colored areas correspond to non-water content like rocks, vegetation, buildings or dry soil. Blue areas indicate water.

![](/img/ndwi-legend.png)

**Dive deeper into this topic:** \\
You should never blindly rely on data. They know no context. That means the correct reading and interpretation of the data is up to you. Therefore, you should familiarize yourself with the NDWI, its strengths and weaknesses, before publishing your findings or making decisions based on them.

Here we have some further resources for you:

- Factsheet: [Normalized Difference Water Index](https://edo.jrc.ec.europa.eu/documents/factsheets/factsheet_ndwi.pdf)
- Article: [Applications and limitations (Bikesh Bade)](https://bikeshbade.com.np/tutorials/Detail/?title=All%20you%20need%20to%20know%20about%20NDWI:%20Normalized%20Difference%20Water%20Index&amp;code=22)`;
});
var interpret = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Interpret
});
var Introduction = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;detect-water&#39;
content: &#39;introduction&#39;
---

In the next 20-30 minutes we will analyze water bodies on a satellite image showing the region you have chosen. For this we will use a scientific indicator - the Normalized Difference Water Index. Or NDWI for short. Don&#39;t worry, it sounds more complicated than it is. We will guide you step-by-step through this process.

At the end you will get a picture where water bodies are colored vibrant blue and non-water content, i.e. soil, vegetation or buildings, are colored yellow to green. This gives you a quick overview of the water in your study area and helps you to monitor changes in water bodies.

Don&#39;t worry, if you get stuck, just use our forum. We and other users are happy to help you.

Sounds good? Then go ahead...`;
});
var introduction = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Introduction
});
var Process = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
case: &#39;detect-water&#39;
content: &#39;process&#39;
---
### Step 1: Download and install QGis
QGis is a free geographic information system application that supports viewing, editing, and analysis of geospatial data. Although it is free, it is a very professional software that is also used by satellite imagary professionals.

QGis can be installed on all major operating systems. These include Mac OS, Microsoft Windows and also Linux.

Installation instructions and the download for the software itself can be found here: [https://www.qgis.org/en/site/forusers/download.html](https://www.qgis.org/en/site/forusers/download.html)

The installation requires 15-25 minutes. After completion, you can skip to step two.

### Step 2: Open QGis and start a new project
Great, you&#39;ve cleared the first hurdle. Now the fun begins, because we are going to edit the satellite data!

The first thing to do is to start the QGis software you just installed. Now go to Project in the menu and then select \`New\`.

![](/img/ndvi-2-start-project.png)

For the next steps: Depending on which operating system you are using, the display of QGis may be slightly different. However, the corresponding options and fields should still be available.

And one more thing: Of course, I don&#39;t use the same data on the screenshots that you do. In other words, my data may look different. Don&#39;t let this confuse you.

### Step 3: Open the data
It sounds complicated to open satellite data, doesn&#39;t it? But it&#39;s not so bad, QGis does most of the work for us.

It\u2019s pretty easy to open the files: Just go to the directory where your satellite data is saved, probably in the downloads directory, select the files and drag them into the layers panel in QGis. Just take a look on my screen to know exactly where to drag them:

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-3-open-data.mp4"}" type="${"video/mp4"}"></video>

*Note: If you have downloaded the files as a ZIP file, unpack them first.*

No you can see your data in the layers panel and on the right, big panel you can see your data visualized. A bit too grey, isn&#39;t it? We&#39;ll take care of that in a moment...

Make sure that you save your project. Do this by clicking on \`Project\` and then on \`Save as\`. A new window opens and you can choose the right directory on your PC and give your project a suitable name. Then just click on \`Save\`.

### Step 4: Add a map for better orientation
So that we can orient ourselves better on the data, we put a map on top of the data. You can imagine it like Google Maps. So we can see better where we are. In technical language, such maps are called basemaps. That\u2019s, too, super simple. So, let&#39;s add a basemap.

Go to the \`browser panel\` (on top of the layers panel) and look for the entry \`XYZ Tiles\`. Click on the small arrow on the left. Now just double click on \`OpenStreetMap\`. 

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-4-add-basemap.mp4"}" type="${"video/mp4"}"></video>

<details><summary>What is OpenStreetMap?</summary>
    <p>OpenStreetMap, or OSM in short, is an <a href="${"https://www.openstreetmap.org"}">alternative to Google Maps</a>. The cool thing is it is completely free to use and open source. That means everybody can contribute to the maps and you can do whatever you want with the data. But that&#39;s not important for us now. If you are interested in OSM, take a look at <a href="${"https://www.openstreetmap.org/about"}">their website</a>.</p></details>

**Congratulations**, you\u2019ve added a basemap to your project. 

But, what happened there! Sometimes the basemap lays on top of your satellite data and you can&#39;t see it anymore, other times the basemap lays between or under the data and you cant see the basemap anymore. No problem, we will fix this.

Depending on what you want to do, you can change the opacity of the layers, the order or hide specific layers. For now, we will just put the basemap behind our data. To do that, we just can rearrange the order of the layers with simple drag and drop. Select the OpenStreetMap layer and drag it to the bottom of the list.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-4-order-layers.mp4"}" type="${"video/mp4"}"></video>

### Step 5: Learn about your data and how to delineate open water features from it
Well, brace yourself: now comes the magic. What happens now? We will process the data so that we can see from the image where water is blue, non-water content is yellow.

**How do we do that?** \\
We use a method that calculates the different data with a certain formula so that the result is a value between -1 and +1 for each point on the image. -1 stands for &quot;no water&quot; and +1 for, surprise, &quot;water&quot;.

This method is called calculating an index. The index is the result of the formula and the formula we use is called NDWI, the Normalized Difference Water Index.

This all sounds very complicated, doesn&#39;t it? Let&#39;s start from the beginning. What exactly is our satellite data?

*Note: This content is optional. If you are not interested in the theoretical background, just jump to Step 6.*

<details><summary>So, what does &#39;raster data&#39; mean?</summary>
    <img src="${"/img/ndvi-5-raster-data.png"}" alt="${""}">
    <p>Raster data is like a picture that you would take with a digital camera: at the lowest level of abstraction, it is a list of pixels with values. When you \u2018zoom in\u2019 and look closer at raster data, at some point you\u2019ll see these discrete pixels, and it will look pixelated.</p>
    <p>Raster data is used in pictures of the Earth, like those taken by satellites - but that is just the beginning. Pixels don\u2019t need to have colors - instead, each pixel can have a number that represents height and the raster data as a whole stores elevation data. Or pixels can store temperature or reflection data and be useful for environmental work.</p></details>

Cool, we have raster data. But why do you have multiple files of the same location and why do they look different? That\u2019s are different bands. On this project we use Band 3 and Band 8 of the satellite.

<details><summary>What are satellite bands?</summary>
    <p>The pixels in raster data are not necessarily just filled color: we call its contents \u2018bands\u2019. A normal image has three familiar bands: Red, Green, and Blue. Combined, they make a picture we\u2019re familiar with. Some raster data can have fewer bands, like just one for elevation, or some can have a lot more - not just visible colors, but wavelengths we can\u2019t see, like infrared and ultraviolet. When raster data is analyzed and displayed, you can combine and pick different bands to use to suit what you\u2019re looking for.</p></details>

*Sure, raster data, bands, but what the heck is the NDWI?* Great question, my friend. With the specific formula of the NDWI we will combine the Bands 3 and 8. Why? Read on:

<details><summary>How does the NDWI indicator work?</summary>
    <p>The Normalized Difference Water Index (NDWI) is derived from the Near-Infrared and Green bands. This formula highlights the amount of water in water bodies.</p>
    <p>The NDWI is efficient to detect surface water because these surfaces have a very low reflectance in the NIR region of the spectra - in contrast to the vegetation which is characterized by a high reflectance in the NIR.</p>
    <p>The values of the NDWI can lie between -1 and +1. Negative values indicate no water, like buildings or dry soil. The higher the positive NDWI value, more water content is present.</p></details>

Enough dry theory. Now it&#39;s down to the nitty-gritty.

### Step 6: Calculating the NDWI
Let\u2019s get ready to rumble. What we will do now, is calculate the NDWI from the data you\u2019ve downloaded.

The formula for the NDWI is the following: (B03 - B08) / (B03 + B08)

Band 8, or shorter B08, represents the near infrared radiation and Band 3, or B03, the visible green.

To use this formula in QGis and with your data, you have to go the following steps:

1. Click on \`Raster\` in the top menu.
2. Choose the \`raster calculator\`. A new window should open now.
3. Below the field \`Output layer\` is a button with 3 points. Click on it and write \u201CNDWI\u201D in the file name input field. Click \`Save\`.
4. Copy the following formular and paste it into the field named \`Raster Calculator Expression\`: ( &quot;B03@1&quot; - &quot;B08@1&quot; ) / ( &quot;B03@1&quot; + + &quot;B08@1&quot; )
5. Click \`Ok\`.
6. Wait for it\u2026 Voila.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-6-calculate-ndwi.mp4"}" type="${"video/mp4"}"></video>

That\u2019s all. Almost.

### Step 7: Bring colour into the game
To make the data easier to understand, we want that no water is yellow/green and water is black\u2026 joke. Water should be, of course, blue. For that we will colorize the grey image.

1. Double-click the NDWI layer in the layers panel. A new window will appear.
2. Choose \`Symbology\` on the left.
3. Change the \`Render type\` from Singleband gray to Singleband pseudocolor.
4. In the \`Min\` input write -1 and in the \`Max\` input 1.
5. On the right side of the color ramp dropdown is an arrow downwards. Click on it.
6. Then choose \`All color ramps\` and select \`YlGnBu\` (the third option from bottom).
7. Below the table with the colored squares, click on \`classify\`.
8. Click \`Apply\` _and_ \`Ok\`.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-7-colorize-data.mp4"}" type="${"video/mp4"}"></video>

Well done, now it&#39;s looking much nicer, right?

### Step 8: Analyze your data
There are now two ways to take a closer look at the data. Either via QGis itself or you export. Both have their advantages and disadvantages. I will explain them to you in the following:

**Use QGis to move around the data**\\
QGis offers a variety of ways to dive deep into your data. You can zoom in and out of the layers, move freely on the map and make individual layers more transparent to get an even better overview.

To make your NDWI layer more transparent so that you can see the basemap better, you first have to hide the two bands. We don&#39;t need them any more. Just click on the tick in front of the layer. My recommendation: Only tick the layers you really need. That way you keep the overview. In our case it is the NDWI layer and the basemap:

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-8-layer-display.mp4"}" type="${"video/mp4"}"></video>

Then click on the small brush in the layers panel. A new area has opened on the right side. Click on \`Transparency\` to set the transparency for each layer under \`Global Transparency\`. Make sure that you have selected the right layer. I set the transparency a little lower so that I can see the basemap underneath better. This makes it easier for me to orientate myself.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-8-layer-opacity.mp4"}" type="${"video/mp4"}"></video>

**Export the image**\\
To be able to share your data with others or to print them, it is useful to export the data - for example as PDF or JPG. You can then share the files with other people without them having to have QGis installed. Practical, isn&#39;t it?

To do this, simply take the following steps:

1. Go to \`Project\` in the menu.
2. Select \`Import/Export\` and choose \`Export Map to Image\` or \`Export Map to PDF\`.
3. If you have selected PDF: Check the box \`Create Geospatial PDF (GeoPDF)\`.
4. Now click \`Save\`.
5. Select the location where you want to save the file, enter a file name and click \`Save\`.

<video width="${"100%"}" height="${"auto"}" controls><source src="${"/img/ndwi-8-export-map.mp4"}" type="${"video/mp4"}"></video>`;
});
var process2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Process
});
var Case = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `---
heading: &#39;Detect Burned Areas&#39;
difficulty: &#39;easy&#39;
id: &#39;burned-areas&#39;
---`;
});
var _case = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Case
});

// .svelte-kit/netlify/entry.js
init();
async function handler(event) {
  const { path: path2, httpMethod, headers, rawQuery, body, isBase64Encoded } = event;
  const query = new URLSearchParams(rawQuery);
  const type = headers["content-type"];
  const rawBody = type && isContentTypeTextual(type) ? isBase64Encoded ? Buffer.from(body, "base64").toString() : body : new TextEncoder("base64").encode(body);
  const rendered = await render({
    method: httpMethod,
    headers,
    path: path2,
    query,
    rawBody
  });
  if (rendered) {
    return {
      isBase64Encoded: false,
      statusCode: rendered.status,
      ...splitHeaders(rendered.headers),
      body: rendered.body
    };
  }
  return {
    statusCode: 404,
    body: "Not found"
  };
}
function splitHeaders(headers) {
  const h = {};
  const m = {};
  for (const key in headers) {
    const value = headers[key];
    const target = Array.isArray(value) ? m : h;
    target[key] = value;
  }
  return {
    headers: h,
    multiValueHeaders: m
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
/*!
 * is-extendable <https://github.com/jonschlinkert/is-extendable>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */
/*!
 * strip-bom-string <https://github.com/jonschlinkert/strip-bom-string>
 *
 * Copyright (c) 2015, 2017, Jon Schlinkert.
 * Released under the MIT License.
 */
