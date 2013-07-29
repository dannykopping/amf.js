(function(namespace) {
  "use strict";

  function ActionMessage(version, headers, bodies) {
    this.version = arguments[0] || 0;
    this.headers = headers || [];
    this.bodies = bodies || [];
    Object.freeze(this);
  }

  function MessageHeader(name, mustUnderstand, data) {
    this.name = undefined;
    this.mustUnderstand = mustUnderstand || false;
    this.data = undefined;
    Object.freeze(this);
  }

  function MessageBody(targetURI, responseURI, data) {
    this.targetURI = targetURI || "";
    this.responseURI = responseURI || "";
    this.data = data;
    Object.freeze(this);
  }

  function encodeMessage(message) {
    var o = new namespace._BufferOutputStream();
    o.writeUint16(message.version);

    o.writeUint16(message.headers.length);
    message.headers.forEach(function(x) {
      var nameUTF = namespace._toUtf8Array(x.name);
      o.writeUint16(nameUTF.length);
      o.writeBytes(nameUTF);
      o.write(x.mustUnderstand? 1: 0);
      o.writeUint32(0xFFFFFFFF);

      new namespace.AMF0Encoder(o, message.version == 3).encode(x.data);
    });

    o.writeUint16(message.bodies.length);
    message.bodies.forEach(function(x) {
      var targetURIUTF = namespace._toUtf8Array(x.targetURI);
      o.writeUint16(targetURIUTF.length);
      o.writeBytes(targetURIUTF);

      var responseURIUTF = namespace._toUtf8Array(x.responseURI);
      o.writeUint16(responseURIUTF.length);
      o.writeBytes(responseURIUTF);

      o.writeUint32(0xFFFFFFFF);

      new namespace.AMF0Encoder(o, message.version == 3).encode(x.data);
    });

    var buf = new ArrayBuffer(o.size);
    o.writeTo(buf);
    return buf;
  }

  function decodeMessage(input) {
    var version = input.readUint16();

    var headerLen = input.readUint16();
    var header = [];
    for (var i=0; i<headerLen; i++) {
      var name = input.readBytes(input.readUint16());
      name = namespace._fromUtf8Array(name);
      var mustUnderstand = Boolean(input.read());
      input.readBytes(4);
      var data = new namespace.AMF0Decoder(input).decode();

      header.push(new MessageHeader(name, mustUnderstand, data));
    }

    var bodiesLen = input.readUint16();
    var bodies = [];
    for (var i=0; i<bodiesLen; i++) {
      var targetURI = input.readBytes(input.readUint16());
      targetURI = namespace._fromUtf8Array(targetURI);

      var responseURI = input.readBytes(input.readUint16());
      responseURI = namespace._fromUtf8Array(responseURI);

      input.readBytes(4);
      var data = new namespace.AMF0Decoder(input).decode();

      bodies.push(new MessageBody(targetURI, responseURI, data));
    }

    return new ActionMessage(version, header, bodies);
  }

  function readBufferFromXHR(xhr) {
    if (xhr.response) {
      return xhr.response;

    } else if (xhr.mozResponseArrayBuffer){
      return xhr.mozResponseArrayBuffer;

    } else {
      var buf = new Uint8Array(Array.prototype.map.call(xhr.responseText, function(x) {
        return x.charCodeAt(0) & 0xFF;
      }));
      return buf.buffer;
    }
  }

  namespace.readBufferFromXHR = readBufferFromXHR;



  function onhandler(type) {
    return {
      enumerable: true,
      get: function() {
        return this["_on" + type];
      },
      set: function(v) {
        var old = this["_on" + type];
        if (old) {
          this.removeEventListener(type, old, false);
        }
        this["_on" + type] = v;
        this.addEventListener(type, v, false);
      }
    }
  }

  function Future(amfconnection) {
    namespace.EventTarget.call(this, amfconnection._manager, amfconnection);
  }
  Object.defineProperties(Future.prototype, {
    onresult: onhandler("result"),
    onfault: onhandler("fault"),
    onerror: onhandler("error"),
    handleEvent: {
      value: function(event) {
        var handler = this["_handle_" + event.type];
        if (handler) {
          handler.call(this, event);
        }
      }
    },
    _handle_load: {
      value: function(event) {
        if (event.target.status != 200) {
          var e = this._manager.createEvent("ErrorEvent");
          e.initErrorEvent(event.target.status);
          this.dispatchEvent(e);

        } else {
          var input = new namespace._BufferInputStream(readBufferFromXHR(event.target));
          var message = decodeMessage(input);
          var body = message.bodies[0];

          if (!body) {
            var e = this._manager.createEvent("ErrorEvent");
            e.initErrorEvent("empty body");
            this.dispatchEvent(e);

          } else if (/onStatus$/.test(body.targetURI)) {
            var e = this._manager.createEvent("FaultEvent");
            e.initFaultEvent(body.data);
            this.dispatchEvent(e);

          } else {
            var e = this._manager.createEvent("ResultEvent");
            e.initResultEvent(body.data);
            this.dispatchEvent(e);

          }
        }
      }
    },
    _handle_error: {
      value: function(event) {
        var e = this._manager.createEvent("ErrorEvent");
        e.initErrorEvent("error");
        this.dispatchEvent(e);
      }
    }
  });
  Object.keys(namespace.EventTarget.prototype).forEach(function(e) {
    Object.defineProperty(Future.prototype, e,
      Object.getOwnPropertyDescriptor(namespace.EventTarget.prototype, e));
  });

  function AMFConnection(url) {
    var version = arguments[1] || 0;

    var manager = new namespace.EventManager();
    namespace.EventTarget.call(this, manager);
    manager.registerEventType("ResultEvent", {
      initResultEvent: {
        value: function(result) {
          this.initEvent("result", true);
          Object.defineProperties(this, {
            result: {
              enumerable: true,
              value: result
            }
          })
        }
      }
    });
    manager.registerEventType("FaultEvent", {
      initFaultEvent: {
        value: function(cause) {
          this.initEvent("fault", true);
          Object.defineProperties(this, {
            cause: {
              enumerable: true,
              value: cause
            }
          })
        }
      }
    });
    manager.registerEventType("ErrorEvent", {
      initErrorEvent: {
        value: function(cause) {
          this.initEvent("error", true);
          Object.defineProperties(this, {
            cause: {
              enumerable: true,
              value: cause
            }
          })
        }
      }
    });

    Object.defineProperties(this, {
      url: { value: url, enumerable: true },
      version: { value: version, enumerable: true }
    })
  }
  Object.defineProperties(AMFConnection.prototype, {
    execute: {
      enumerable: true,
      value: function(destination, args) {
        var data = encodeMessage(new ActionMessage(
          this.version, [], [new MessageBody(destination, "/result", args)]));

        var future = new Future(this);

        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", future, false);
        xhr.addEventListener("error", future, false);

        xhr.open("POST", this.url, true);
        xhr.setRequestHeader("Content-Type", "application/x-amf");
        xhr.overrideMimeType("text/plain; charset=x-user-defined");
        xhr.responseType = "arraybuffer";

        if (xhr.sendAsBinary) {
          xhr.sendAsBinary(String.fromCharCode.apply(null, new Uint8Array(data)));
        } else {
          xhr.send(data);
        }

        return future;
      }
    },
    onresult: onhandler("result"),
    onfault: onhandler("fault"),
    onerror: onhandler("error"),
  });
  Object.keys(namespace.EventTarget.prototype).forEach(function(e) {
    Object.defineProperty(AMFConnection.prototype, e,
      Object.getOwnPropertyDescriptor(namespace.EventTarget.prototype, e));
  });



  Object.defineProperty(namespace, "AMFConnection", {
    enumerable: true,
    value: AMFConnection
  });

})(this.amf);