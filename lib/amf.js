/* ((dataview.js)) */
(function(namespace) {
  "use strict";
  if (!namespace.DataView) {

    var _littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

    var DataView = function DataView(buffer/*,byteOffset,byteLength*/) {
      var byteOffset = 0;
      var byteLength = buffer.byteLength;

      switch (arguments.length) {
        case 3:
          byteLength = arguments[2];
        case 2:
          byteOffset = arguments[1];
        case 1:
          // nop
          break;
        default:
          throw new TypeError();
      }

      Object.defineProperties(this, {
        _binary: {
          value: new Uint8Array(buffer, byteOffset, byteLength)
        }
      });
    }

    var _getX = function(f) {
      return function(offset, littleEndian) {
        var b = new Uint8Array(this._binary.subarray(offset, offset + f.BYTES_PER_ELEMENT));

        if ((littleEndian || false) === _littleEndian) {
          return new f(b.buffer)[0];

        } else {
          Array.prototype.reverse.call(b);
          return new f(b.buffer)[0];
        }
      }
    }
    var _setX = function(f) {
      return function(offset, value, littleEndian) {
        var b = this._binary.subarray(offset, offset + f.BYTES_PER_ELEMENT);

        if ((littleEndian || false) === _littleEndian) {
          b.set(new Uint8Array(new f([value]).buffer));

        } else {
          b.set(new Uint8Array(new f([value]).buffer));
          Array.prototype.reverse.call(b);
        }
      }
    }

    Object.defineProperties(DataView.prototype, {
      buffer: { get: function() { return this._binary.buffer; }, enumerable: true },
      byteLength: { get: function() { return this._binary.byteLength; }, enumerable: true },
      byteOffset: { get: function() { return this._binary.byteOffset; }, enumerable: true },
      getInt8: {value: _getX(Int8Array), enumerable: true },
      setInt8: {value: _setX(Int8Array), enumerable: true },
      getUint8: {value: _getX(Uint8Array), enumerable: true },
      setUint8: {value: _setX(Uint8Array), enumerable: true },
      getInt16: {value: _getX(Int16Array), enumerable: true },
      setInt16: {value: _setX(Int16Array), enumerable: true },
      getUint16: {value: _getX(Uint16Array), enumerable: true },
      setUint16: {value: _setX(Uint16Array), enumerable: true },
      getInt32: {value: _getX(Int32Array), enumerable: true },
      setInt32: {value: _setX(Int32Array), enumerable: true },
      getUint32: {value: _getX(Uint32Array), enumerable: true },
      setUint32: {value: _setX(Uint32Array), enumerable: true },
      getFloat32: {value: _getX(Float32Array), enumerable: true },
      setFloat32: {value: _setX(Float32Array), enumerable: true },
      getFloat64: {value: _getX(Float64Array), enumerable: true },
      setFloat64: {value: _setX(Float64Array), enumerable: true }
    })

    Object.defineProperty(namespace, "DataView", {
      value: DataView,
      enumerable: true
    });
  }
})(this);

/* ((amf-base.js)) */
(function(namespace) {
  "use strict";

  if (namespace.amf) {
    throw Error(namespace.amf);
  }

  var _marker = {
    amf0: {
      NUMBER: 0x00,
      BOOLEAN: 0x01,
      STRING: 0x02,
      OBJECT: 0x03,
      MOVIE_CLIP: 0x04,
      NULL: 0x05,
      UNDEFINED: 0x06,
      REFERENCE: 0x07,
      ECMA_ARRAY: 0x08,
      OBJECT_END: 0x09,
      STRICT_ARRAY: 0x0A,
      DATE: 0x0B,
      LONG_STRING: 0x0C,
      UNSUPPORTED: 0x0D,
      RECORDSET: 0x0E,
      XML_OBJECT: 0x0F,
      TYPED_OBJECT: 0x10,
      AVM_PLUS_OBJECT: 0x11
    },
    amf3: {
      UNDEFINED: 0x00,
      NULL: 0x01,
      FALSE: 0x02,
      TRUE: 0x03,
      INTEGER: 0x04,
      DOUBLE: 0x05,
      STRING: 0x06,
      XML_DOC: 0x07,
      DATE: 0x08,
      ARRAY: 0x09,
      OBJECT: 0x0A,
      XML: 0x0B,
      BYTE_ARRAY: 0x0C
    }
  }
  Object.freeze(_marker);
  Object.freeze(_marker.amf0);
  Object.freeze(_marker.amf3);


  function toUtf8Array(str) {
    var a = [];
    Array.prototype.forEach.call(str, function(e) {
      var c = e.charCodeAt(0);
      if (c <= 0x007F) {
        a.push(c);
      } else if (c > 0x07FF) {
        a.push(
          (0xE0 | ((c >> 12) & 0x0F)),
          (0x80 | ((c >> 6) & 0x3F)),
          (0x80 | ((c >> 0) & 0x3F)));
      } else {
        a.push(
          (0xC0 | ((c >> 6) & 0x1F)),
          (0x80 | ((c >> 0) & 0x3F)))
      }
    });
    return a;
  }

  function fromUtf8Array(array) {
    var r = [];
    var cnt = 0;
    var len = array.length;

    while (cnt < len) {
      var c = array[cnt++];
      switch (c >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          r.push(c);
          break;

        case 12:
        case 13:
          var c2 = array[cnt++];
          if (c2 == undefined || (c2 & 0xC0) != 0x80) {
            throw new Error("illegal utf format");
          }
          r.push(((c & 0x1F) << 6) | (c2 & 0x3F));
          break;

        case 14:
          var c2 = array[cnt++];
          var c3 = array[cnt++];
          if (c2 == undefined || c3 == undefined ||
            ((c2 & 0xC0) != 0x80) || ((c3 & 0xC0) != 0x80)) {
            throw new Error("illegal utf format");
          }
          r.push(((c & 0x0F) << 12)
            | ((c2 & 0x3F) << 6)
            | ((c3 & 0x3F) << 0));
          break;

        default:
          throw new Error("illegal utf format");
      }
    }

    var chunked = '';
    for(var i = 0; i < r.length; i+= 1000) {
      chunked += String.fromCharCode.apply(this, r.slice(i, i + 1000));
    }

    return chunked;
  }

  var amf = Object.create(Object.prototype, {
    _marker: { value: _marker },
    _INT28_MAX_VALUE: { value: 268435455 },
    _INT28_MIN_VALUE: { value: -268435456},
    _toUtf8Array: { value: toUtf8Array },
    _fromUtf8Array: { value: fromUtf8Array }
  });

  Object.defineProperty(namespace, "amf", {
    value: amf,
    enumerable: true
  });

})(this);
/* ((amf-events.js)) */
(function(namespace) {
  "use strict";

  function EventManager() { };
  Object.defineProperties(EventManager.prototype, {
    _eventTypes: {
      value: { Event: Event }
    },
    createEvent: {
      enumerable: true,
      value: function(type) {
        var c = this._eventTypes[type];
        if (!c) {
          throw new Error(type);
        }
        return new c();
      }
    },
    registerEventType: {
      value: function(name, proto) {
        var c = function() {};
        c.prototype = Object.create(Event.prototype, proto);
        this._eventTypes[name] = c;
      }
    },
    _addEventListener: {
      value: function(node, type, listener, useCapture) {
        if (!type || !listener) {
          return;
        }

        this._removeEventListener(node, type, listener, useCapture);

        this._getEventListeners(node).push(
          [type, listener, useCapture]);
      }
    },
    _removeEventListener: {
      value: function(node, type, listener, useCapture) {
        if (!type || !listener) {
          return;
        }

        var listeners = this._getEventListeners(node);
        for (var i = listeners.length - 1; i >= 0; --i) {
          var l = listeners[i];
          if (l[2] == useCapture && l[1] == listener && l[0] == type) {
            delete listeners[i];
            break;
          }
        }
      }
    },
    _dispatchEvent: {
      value: function(node, event) {
        if (!event._initialized || !event.type) {
          throw Error();
        }

        event._target = node;
        event._stopPropagation = false;
        event._preventDefault = false;

        var pv = (function() {
          var r = [];
          var p = node;
          var n = p._parent;
          while (n) {
            r.push(n);
            p = n;
            n = p._parent;
          }
          return r;
        })();

        // CAPTURING_PHASE
        event._eventPhase = Event.prototype.CAPTURING_PHASE;
        for (var i = pv.length - 1; i >= 0; --i) {
          if (event._stopPropagation) {
            break;
          }

          var nn = pv[i];
          event._currentTarget = nn;

          this._getEventListeners(nn).slice().forEach(function(le) {
            if (le[2] && le[0] == event.type) {
              this._handleEvent(le[1], event);
            }
          }, this);
        }

        // AT_TARGET
        event._eventPhase = Event.prototype.AT_TARGET;
        event._currentTarget = node;
        if (!event._stopPropagation) {
          this._getEventListeners(node).slice().forEach(function(le) {
            if (!le[2] && le[0] == event.type) {
              this._handleEvent(le[1], event);
            }
          }, this);
        }

        // BUBBLING_PHASE
        if (event.bubbles) {
          event._eventPhase = Event.prototype.BUBBLING_PHASE;
          for (var i = pv.length - 1; i >= 0; --i) {
            if (event._stopPropagation) {
              break;
            }

            var nn = pv[i];
            event._currentTarget = nn;

            this._getEventListeners(nn).slice().forEach(function(le) {
              if (!le[2] && le[0] == event.type) {
                this._handleEvent(le[1], event);
              }
            }, this);
          }
        }
        return event._preventDefault;
      }
    },
    _getEventListeners: {
      value: function(node) {
        if (!node.hasOwnProperty("_eventListeners")) {
          Object.defineProperty(node, "_eventListeners", {
            value: []
          });
        }
        return node._eventListeners;
      }
    },
    _handleEvent: {
      value: function(listener, event) {
        try {
          if (!listener.handleEvent) {
            listener.call(null, event);
          } else {
            listener.handleEvent.call(listener, event);
          }
        } catch (e) {
          // ignore
          if (console) {
            console.error(e);
          }
        }
      }
    }
  });



  function Event() { };
  Object.defineProperties(Event.prototype, {
    CAPTURING_PHASE: { value: 1, enumerable: true },
    AT_TARGET: { value: 2, enumerable: true },
    BUBBLING_PHASE: { value: 3, enumerable: true },

    type: {
      enumerable: true,
      get: function() {
        return this._type;
      }
    },
    target: {
      enumerable: true,
      get: function() {
        return this._target;
      }
    },
    currentTarget: {
      enumerable: true,
      get: function() {
        return this._currentTarget;
      }
    },
    eventPhase: {
      enumerable: true,
      get: function() {
        return this._eventPhase;
      }
    },
    bubbles: {
      enumerable: true,
      get: function() {
        return this._bubbles;
      }
    },
    cancelable: {
      enumerable: true,
      get: function() {
        return this._cancelable;
      }
    },
    timeStamp: {
      enumerable: true,
      get: function() {
        return this._timeStamp;
      }
    },

    stopPropagation: {
      enumerable: true,
      value: function() {
        this._stopPropagation = true;
      }
    },
    preventDefault: {
      enumerable: true,
      value: function() {
        this._preventDefault = true;
      }
    },
    initEvent: {
      enumerable: true,
      value: function(eventTypeArg, canBubbleArg, cancelableArg) {
        Object.defineProperties(this, {
          _initialized: { value: true },
          _type: { value: eventTypeArg },
          _bubbles: { value: Boolean(canBubbleArg) },
          _cancelable: { value: Boolean(cancelableArg) },
          _timestamp: { value: Date.now() },
          _target: { writable: true },
          _currentTarget: { writable: true },
          _stopPropagation: { writable: true },
          _preventDefault: { writable: true },
          _eventPhase: { writable: true }
        });
      }
    }
  });



  function EventTarget(manager, parent) {
    Object.defineProperties(this, {
      _manager: {
        value: manager
      },
      _parent: {
        value: parent
      }
    });
  };
  Object.defineProperties(EventTarget.prototype, {
    addEventListener: {
      enumerable: true,
      value: function(type, listener, useCapture) {
        this._manager._addEventListener(this, type, listener, useCapture);
      }
    },
    removeEventListener: {
      enumerable: true,
      value: function(type, listener, useCapture) {
        this._manager._removeEventListener(this, type, listener, useCapture);
      }
    },
    dispatchEvent: {
      enumerable: true,
      value: function(evt) {
        return this._manager._dispatchEvent(this, evt);
      }
    }
  });



  Object.defineProperties(namespace, {
    EventManager: { value: EventManager },
    EventTarget: { value: EventTarget }
  });

})(this.amf);
/* ((amf-bufferstream.js)) */
(function(namespace) {
  "use strict";

  if (!namespace || !DataView) {
    throw Error();
  }

  function BufferOutputStream() {
    var buffer = new ArrayBuffer(2);
    Object.defineProperties(this, {
      _buffers: { value: [] },
      _tmp: { value: new DataView(new ArrayBuffer(8)) },
      _current: { value: new Uint8Array(buffer), writable: true },
      _position: { value: 0, writable: true },
      _size: { value: 0, writable: true },
    });
  }
  Object.defineProperties(BufferOutputStream.prototype, {
    writeTo: {
      value: function(b) {
        if (!(b instanceof ArrayBuffer)) {
          throw new Error(String(b));
        }
        if (this._size > b.byteLength) {
          throw new Error(this._size + " > " + b.byteLength);
        }

        b = new Uint8Array(b);
        var p = 0;
        this._buffers.forEach(function(e) {
          b.set(new Uint8Array(e), p);
          p += e.byteLength;
        });
        b.set(this._current.subarray(0, this._position), p);
        return b.buffer;
      }
    },

    write: {
      value: function(b) {
        this.writeBytes([b]);
      }
    },
    writeBytes: {
      value: function(b, off, len) {
        if (Array.isArray(b)) {
          len = (len != null)? len: b.length;
          off = off || 0;
          b = new Uint8Array(b.slice(off, off + len));

        } else if (b instanceof ArrayBuffer) {
          len = (len != null)? len: b.byteLength;
          off = off || 0;
          b = new Uint8Array(b, off, len);

        } else if (b instanceof Uint8Array) {
          len = (len != null)? len: b.length;
          off = off || 0;
          b = b.subarray(off, off + len);

        } else {
          throw new Error(String(b));

        }

        b = this._w(b);
        while (b.length) {
          this._grow();
          b = this._w(b);
        }
      }
    },
    writeInt8: { value: writeX(DataView.prototype.setInt8, 1) },
    writeUint8: { value: writeX(DataView.prototype.setUint8, 1) },
    writeInt16: { value: writeX(DataView.prototype.setInt16, 2) },
    writeUint16: { value: writeX(DataView.prototype.setUint16, 2) },
    writeInt32: { value: writeX(DataView.prototype.setInt32, 4) },
    writeUint32: { value: writeX(DataView.prototype.setUint32, 4) },
    writeFloat32: { value: writeX(DataView.prototype.setFloat32, 4) },
    writeFloat64: { value: writeX(DataView.prototype.setFloat64, 8) },

    size: {
      get: function() {
        return this._size;
      }
    },
    _w: {
      value: function(b) {
        var n = Math.min(this._remaining, b.length);
        this._current.set(b.subarray(0, n), this._position);
        this._position += n;
        this._size += n;
        return b.subarray(n);
      }
    },
    _grow: {
      value: function() {
        this._buffers.push(this._current.buffer);
        this._position = 0;

        this._current = new Uint8Array(this._current.buffer.byteLength);
      }
    },

    _remaining: {
      get: function() {
        return this._current.byteLength - this._position;
      }
    }
  });

  function writeX(f, l) {
    return function(v) {
      f.call(this._tmp, 0, v);
      this.writeBytes(new Uint8Array(this._tmp.buffer, 0, l));
    }
  }

  function BufferInputStream(buffer) {
    Object.defineProperties(this, {
      _buffer: {
        value: new Uint8Array(buffer)
      },
      _position: {
        value: 0,
        writable: true
      }
    })
  }
  Object.defineProperties(BufferInputStream.prototype, {
    read: {
      value: function() {
        return this.readBytes(1)[0];
      }
    },
    readBytes: {
      value: function(len) {
        if ((this._position + (len - 1)) > this._buffer.length) {
          throw Error();
        }

        var r = new Uint8Array(
          this._buffer.subarray(this._position, this._position + len));
        this._position += len;
        return r;
      }
    },
    readInt8: { value: readX(DataView.prototype.getInt8, 1) },
    readUint8: { value: readX(DataView.prototype.getUint8, 1) },
    readInt16: { value: readX(DataView.prototype.getInt16, 2) },
    readUint16: { value: readX(DataView.prototype.getUint16, 2) },
    readInt32: { value: readX(DataView.prototype.getInt32, 4) },
    readUint32: { value: readX(DataView.prototype.getUint32, 4) },
    readFloat32: { value: readX(DataView.prototype.getFloat32, 4) },
    readFloat64: { value: readX(DataView.prototype.getFloat64, 8) }
  });

  function readX(f, l) {
    return function() {
      var v = new DataView(this.readBytes(l).buffer);
      return f.call(v, 0);
    }
  }



  Object.defineProperties(namespace, {
    _BufferInputStream: {
      value: BufferInputStream
    },
    _BufferOutputStream: {
      value: BufferOutputStream
    }
  });

})(this.amf);

/* ((amf-objects.js)) */
(function(namespace) {
  "use strict";
  var _numInstances = 0;

  var objects = Object.create(Object.prototype, {
    identity: {
      value: function(object) {
        if (!(self instanceof Object)) {
          throw new TypeError(typeof(self));
        }

        if (!self.hasOwnProperty("__$identity__")) {
          Object.defineProperty(self, "__$identity__", {
            value: _numInstances++,
            configurable: true
          });
        }
        return self.__$identity__;
      }
    },

    equals: {
      value: function(self, other) {
        self = Object(self);
        other = Object(other);
        var f = self["__eq__"];
        if (f && typeof(f) == "function") {
          return Boolean(f.call(self, other));
        }
        return objects.identity(self) === objects.identity(other);
      }
    },

    hashCode: {
      value: function(self) {
        self = Object(self);
        var f = self["__hash__"];
        if (f && typeof(f) == "function") {
          return Number(f.call(self));
        }
        return objects.identity(self);
      }
    }

  });

  Object.defineProperties(String.prototype, {
    __eq__: {
      value: function(o) {
        return (o instanceof String) && this.valueOf() == o.valueOf();
      }
    },

    __hash__: {
      value: function() {
        function mapper(x) {
          return x.charCodeAt(0);
        }
        function reducer(p, c) {
          return ((p * 31) + c) & 0xFFFFFFFF;
        }
        return Array.prototype.map.call(this, mapper).reduce(reducer, 0);
      }
    }
  });

  Object.defineProperty(namespace, "_objects", { value: objects });

})(this.amf);

/* ((amf-dict.js)) */
(function(namespace) {
  "use strict";

  function _hash(h) {
    return h ^ (h >>> 20) ^ (h >>> 12) ^ (h >>> 7) ^ (h >>>4);
  }
  function _indexFor(h, len) {
    return h & (len - 1);
  }

  function Entry(hash, key, value, next) {
    Object.defineProperties(this, {
      hash: { value: hash },
      key: { value: key },
      value: { writable:true, value: value},
      next: { value: next }
    });
  }

  function Dict(/*capacity, loadFactor*/) {
    var _capacity = 16;
    var _loadFactor = 0.75;

    switch (arguments.length) {
      case 2:
        _loadFactor = arguments[1];
      case 1:
        _capacity = arguments[0];
    }

    Object.defineProperties(this, {
      _loadFactor: {
        value: _loadFactor
      },
      _capacity: {
        writable: true,
        value: _capacity
      },
      _size: {
        writable: true,
        value: 0
      },
      _table: {
        value: []
      },
      _map: {
        value: new HashMap()
      },
      _hash: {
        value: function(key) {
          switch (this._map.type(key)) {
            case 'undefined':
            case 'null':
            case 'boolean':
            case 'number':
            case 'regexp':
              return key + '';

            case 'date':
              return ':' + key.getTime();

            case 'string':
              return '"' + key;

            case 'object':
            default:
              if (!key._hmuid_) {
                key._hmuid_ = ++HashMap.uid;
                this.hide(key, '_hmuid_');
              }

              return '{' + key._hmuid_;
          }
        }
      },
      hide: {
        value: function(obj, prop) {
        // Make non iterable if supported
        if (Object.defineProperty) {
            Object.defineProperty(obj, prop, {enumerable:false});
          }
        }
      }
    });
  }
  Object.defineProperties(Dict.prototype, {
    size: {
      enumerable: true,
      get: function() {
        return this._map.count();
      }
    },
    get: {
      enumerable: true,
      value: function(key) {
//        var h = _hash(this._hashCode(key));
        var h = this._hash(key);

        var value = this._map.get(h);
        if(typeof value === 'undefined') {
          return null;
        }

        return value;
      }
    },
    put: {
      enumerable: true,
      value: function(key, value) {
        var h = this._hash(key);
        this._map.set(h, value);
        return null;
      }
    },
    iterate: {
      value: function(callback) {
        this._table.forEach(function(e) {
          var entry = e;
          while (entry) {
            callback(entry.key, entry.value);
            entry = entry.next;
          }
        })
      }
    },
    toString: {
      value: function() {
        var r = "{";
        this.iterate(function(key, value) {
          r += (key + "=" + value + ", ");
        });
        r += "}";
        return r;
      }
    },

    _hashCode: {
      value: namespace._objects.hashCode
    },
    _equals: {
      value: namespace._objects.equals
    }
  });

  function IdentityDict(/*capacity, loadFactor*/) {
    Dict.apply(this, Array.prototype.slice.call(arguments));
  }
  IdentityDict.prototype = Object.create(Dict.prototype, {
    _hashCode: {
      value: namespace._objects.identity
    },
    _equals: {
      value: function(a, b) {
        return a === b;
      }
    }
  });

  Object.defineProperties(namespace, {
    Dict: {
      value: Dict
    },
    IdentityDict: {
      value: IdentityDict
    }
  });

})(this.amf);

/* ((amf-traitsInfo.js)) */
(function(namespace) {
  "use strict";

  function TraitsInfo(className, dynamic, externalizable, properties) {
    Object.defineProperties(this, {
      className: { value: className },
      dynamic: { value: dynamic },
      externalizable: { value: externalizable },
      properties: { value: properties }
    });
  }
  Object.defineProperties(TraitsInfo.prototype, {
    length: {
      get: function() {
        return this.properties.length;
      }
    },
    __eq__: {
      value: function(obj) {
        if (this.className != obj.className) {
          return false;
        } else if (this.dynamic != obj.dynamic) {
          return false;
        } else {
          if (this.length != obj.length) {
            return false;
          }
          var len = this.length;
          for (var i=0; i<len; i++) {
            if (this.properties[i] != obj.properties[i]) {
              return false;
            }
          }
          return true;
        }
      }
    },
    __hash__: {
      value: function() {
        var c = namespace._objects.hashCode(this.className);
        c = this.dynamic? c << 2: c << 1;
        c = c | (this.length << 24);
        return c;
      }
    }
  });

  Object.defineProperty(namespace, "_TraitsInfo", {
    value: TraitsInfo
  });
})(this.amf);

/* ((amf-amf0Encoder.js)) */
(function(namespace) {
  "use strict";

  var _marker = namespace._marker.amf0;

  function _normalize(obj) {
    if (obj instanceof Date) {
      return obj;
    } else if (obj != null) {
      return obj.valueOf();
    }
    return obj;
  }

  function AMF0Encoder(output) {
    var avmPlus = Boolean(arguments[1]);

    Object.defineProperties(this, {
      _output: { value: output },
      _avmPlus: { value: avmPlus },
      _refObj: { value: new namespace.IdentityDict() }
    });
  }
  Object.defineProperties(AMF0Encoder.prototype, {
    encode: {
      value: function(obj) {
        obj = _normalize(obj);

        if (obj === undefined) {
          this._output.write(_marker.UNDEFINED);

        } else if (obj === null) {
          this._output.write(_marker.NULL);

        } else if (typeof obj === "string") {
          this._writeUTF(obj, false, true);

        } else if (typeof obj === "boolean") {
          this._output.write(_marker.BOOLEAN);
          this._output.write(obj? 1: 0);

        } else if (typeof obj === "number") {
          this._output.write(_marker.NUMBER);
          if (isFinite(obj)) {
            this._output.writeFloat64(obj);

          } else if (isNaN(obj)) {
            this._output.writeBytes([0x7F, 0xF8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

          } else if (obj == Number.POSITIVE_INFINITY) {
            this._output.writeBytes([0x7F, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

          } else if (obj == Number.NEGATIVE_INFINITY) {
            this._output.writeBytes([0xFF, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

          } else {
            throw new Error("BUG");

          }

        } else if (obj instanceof Date) {
          this._output.write(_marker.DATE);
          this._output.writeFloat64(obj.getTime());
          this._output.writeInt16(obj.getTimezoneOffset());

        } else if (this._avmPlus) {
          this._output.write(_marker.AVM_PLUS_OBJECT);
          new namespace.AMF3Encoder(this._output).encode(obj);

        } else if (Array.isArray(obj)) {
          if (!this._byReferenceObj(obj)) {
            this._output.write(_marker.STRICT_ARRAY);
            this._output.writeInt32(obj.length);
            obj.forEach(this.encode, this);
          }

        } else if (typeof obj === "object") {
          if (!this._byReferenceObj(obj)) {
            var propertyNames = Object.keys(obj).filter(function(e) {
              return e != "$alias";
            });
            var alias = obj["$alias"] || "";
            var traitsInfo = new namespace._TraitsInfo(alias, false, false, propertyNames);
            this._output.write(_marker.TYPED_OBJECT);
            this._writeUTF(alias, false, false);

            traitsInfo.properties.forEach(function(e) {
              this._writeUTF(e, false, false);
              this.encode(obj[e]);
            }, this);

            this._output.writeBytes([0, 0, _marker.OBJECT_END]);
          }

        } else {
          throw Error(obj);

        }
      }
    },

    _writeUTF: {
      value: function(str, forceLong, writeType) {
        var utf = namespace._toUtf8Array(str);
        var type = forceLong? _marker.LONG_STRING: (utf.length <= 65535? _marker.STRING: _marker.LONG_STRING);
        if (writeType) {
          this._output.write(type);
        }
        if (type == _marker.LONG_STRING) {
          this._output.writeInt32(utf.length);
        } else {
          this._output.writeInt16(utf.length);
        }
        this._output.writeBytes(utf);
      }
    },
    _byReferenceObj: {
      value: function(obj) {
        var refNum = this._refObj.get(obj);
        if (refNum !== null) {
          this._output.write(_marker.REFERENCE);
          this._output.writeInt16(refNum);
          return true;

        } else {
          this._refObj.put(obj, this._refObj.size);
          return false;
        }
      }
    }
  });

  Object.defineProperty(namespace, "AMF0Encoder", {
    value: AMF0Encoder
  });

})(this.amf);

/* ((amf-amf0Decoder.js)) */
(function(namespace) {
  "use strict";

  var _marker = namespace._marker.amf0;
  var _endObject = {};

  function AMF0Decoder(input) {
    Object.defineProperties(this, {
      _input: { value: input },
      _objRef: { value: [] }
    })
  }
  Object.defineProperties(AMF0Decoder.prototype, {
    decode: {
      value: function() {
        var c = this._input.read();
        switch (c) {
          case _marker.NUMBER:
            return this._input.readFloat64();

          case _marker.BOOLEAN:
            return this._input.read()? true: false;

          case _marker.STRING:
            return this._readString();

          case _marker.AVM_PLUS_OBJECT:
            return new namespace.AMF3Decoder(this._input).decode();

          case _marker.STRICT_ARRAY:
            var size = this._input.readUint32();
            var array = new Array(size);
            this._objRef.push(array);
            for (var i=0; i<size; i++) {
              array[i] = this.decode();
            }
            return array;

          case _marker.TYPED_OBJECT:
            var typeName = this._readString();
            var obj = {};
            if (typeName && typeName.length) {
              Object.defineProperty(obj, "$alias", {
                writable: true,
                configurable: true,
                value: typeName
              });
            }
            this._objRef.push(obj);

            var propertyName = this._readString();
            var value = this.decode();
            while (value != _endObject) {
              obj[propertyName] = value;

              propertyName = this._readString();
              value = this.decode();
            }
            if (obj.$alias == "flex.messaging.io.ArrayCollection") {
              return obj.source;
            }
            return obj;

          case _marker.OBJECT:
            var obj = {};
            this._objRef.push(obj);

            var propertyName = this._readString();
            var value = this.decode();
            while (value != _endObject) {
              obj[propertyName] = value;

              propertyName = this._readString();
              value = this.decode();
            }
            return obj;

          case _marker.OBJECT_END:
            return _endObject;

          case _marker.UNDEFINED:
            return undefined;

          case _marker.NULL:
            return null;

          case _marker.DATE:
            var d = new Date(this._input.readFloat64());
            this._input.readBytes(2);
            return d;

          case _marker.ECMA_ARRAY:
            this._input.readBytes(4);
            var obj = {};
            this._objRef.push(obj);

            var propertyName = this._readString();
            var value = this.decode();
            while (value != _endObject) {
              obj[propertyName] = value;

              propertyName = this._readString();
              value = this.decode();
            }
            return obj;

          case _marker.REFERENCE:
            var refNum = this._input.readUint16();
            return this._objRef[refNum];

          case _marker.UNSUPPORTED:
            throw new Error("unsupported");

          default:
            throw new Error("not implemented[" + c + "]");
        }
      }
    },

    _readString: {
      value: function() {
        var len = this._input.readUint16();
        var array = this._input.readBytes(len);
        return namespace._fromUtf8Array(array);
      }
    }
  });

  Object.defineProperty(namespace, "AMF0Decoder", {
    value: AMF0Decoder
  });

})(this.amf);

/* ((amf-amf3Encoder.js)) */
(function(namespace) {
  "use strict";

  var _marker = namespace._marker.amf3;

  function _normalize(obj) {
    if (obj instanceof Date) {
      return obj;
    } else if (obj != null) {
      return obj.valueOf();
    }
    return obj;
  }

  function _byReferenceOf(dictGetter) {
    return function(obj) {
      var dict = dictGetter.apply(this);

      var refNum = dict.get(obj);
      if (refNum !== null) {
        this._writeUInt29(refNum << 1);
        return true;

      } else {
        dict.put(obj, dict.size);
        return false;
      }
    }
  }

  function AMF3Encoder(output) {
    Object.defineProperties(this, {
      _output: { value: output },
      _refObj: { value: new namespace.IdentityDict() },
      _refStr: { value: new namespace.Dict() },
      _refTi: { value: new namespace.Dict() },
    });
  }
  Object.defineProperties(AMF3Encoder.prototype, {
    encode: {
      value: function(obj) {
        obj = _normalize(obj);

        var type = this._typeof(obj);
        var fun = this._encoders[type];
        if (!fun) {
          throw new Error(type);
        }
        this._output.write(type)
        fun.call(this, obj);
      }
    },
    _typeof: {
      value: function(obj) {
        switch (typeof obj) {
          case "undefined":
            return _marker.UNDEFINED;

          case "boolean":
            return obj? _marker.TRUE: _marker.FALSE;

          case "string":
            return _marker.STRING;

          case "number":

            // serialization of integers is buggy
//            if (obj >= namespace._INT28_MIN_VALUE && obj <= namespace._INT28_MAX_VALUE
//              && Math.floor(obj) == obj) {
//
//              return _marker.INTEGER;
//
//            } else {
              return _marker.DOUBLE;

//            }

          case "object":
            if (obj === null) {
              return _marker.NULL;

            } else if (Array.isArray(obj)) {
              return _marker.ARRAY;

            } else if (obj instanceof Date) {
              return _marker.DATE;

            } else if (obj instanceof ArrayBuffer) {
              return _marker.BYTE_ARRAY;

            } else {
              return _marker.OBJECT;

            }
        }
      }
    },
    _encoders: {
      value: (function() {
        var r = [];
        function add(mark, fun) {
          r[mark] = fun;
        }

        function nop(obj) { };
        add(_marker.UNDEFINED, nop);
        add(_marker.NULL, nop);
        add(_marker.FALSE, nop);
        add(_marker.TRUE, nop);
        add(_marker.STRING, function(obj) {
          this._writeStringWithoutType(obj);
        });
        add(_marker.INTEGER, function(obj) {
          this._writeUInt29(obj);
        });
        add(_marker.DOUBLE, function(obj) {
          if (isFinite(obj)) {
            this._output.writeFloat64(obj);

          } else if (isNaN(obj)) {
            this._output.writeBytes([0x7F, 0xF8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

          } else if (obj == Number.POSITIVE_INFINITY) {
            this._output.writeBytes([0x7F, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

          } else if (obj == Number.NEGATIVE_INFINITY) {
            this._output.writeBytes([0xFF, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

          } else {
            throw new Error("BUG");
          }
        });
        add(_marker.DATE, function(obj) {
          if (!this._byReferenceObj(obj)) {
            this._writeUInt29(1);
            this._output.writeFloat64(obj.getTime());
          }
        });
        add(_marker.BYTE_ARRAY, function(obj) {
          if (!this._byReferenceObj(obj)) {
            this._writeUInt29((obj.byteLength << 1) | 1);
            this._output.writeBytes(obj);
          }
        });
        add(_marker.ARRAY, function(obj) {
          if (!this._byReferenceObj(obj)) {
            this._writeUInt29((obj.length << 1) | 1);
            this._writeStringWithoutType("");
            obj.forEach(this.encode, this);
          }
        });
        add(_marker.OBJECT, function(obj) {
          if (!this._byReferenceObj(obj)) {
            var propertyNames = Object.keys(obj).filter(function(e) {
              return e != "$alias";
            });
            var alias = obj["$alias"] || "";
            var traitsInfo = new namespace._TraitsInfo(alias, false, false, propertyNames);
            if (!this._byReferenceTi(traitsInfo)) {
              this._writeUInt29(3 | (traitsInfo.externalizable? 4: 0)
                | (traitsInfo.dynamic? 8: 0)
                | (traitsInfo.externalizable? 0: (traitsInfo.length << 4)));
              this._writeStringWithoutType(traitsInfo.className);
              if (!traitsInfo.externalizable) {
                traitsInfo.properties.forEach(this._writeStringWithoutType, this);
              }
            }
            traitsInfo.properties.forEach(function(e) {
              this.encode(obj[e]);
            }, this);
          }
        });
        return r;
      })()
    },
    _writeUInt29: {
      value: function(b) {
        if (b < 0x80) {
          this._output.write(b);

        } else if (b < 0x4000) {
          this._output.writeBytes([((b >> 7) & 0x7F | 0x80), (b & 0x7F)]);

        } else if (b < 0x200000) {
          this._output.writeBytes([((b >> 14) & 0x7F | 0x80), ((b >> 7) & 0x7F | 0x80), (b & 0x7F)]);

        } else if (b < 0x40000000) {
          this._output.writeBytes([((b >> 22) & 0x7F | 0x80), ((b >> 15) & 0x7F | 0x80), ((b >> 8) & 0x7F | 0x80), (b & 0xFF)]);

        } else {
          throw new RangeError("Out of range");
        }
      }
    },
    _writeAMFUTF: {
      value: function(str) {
        var utf = namespace._toUtf8Array(str);
        this._writeUInt29(utf.length << 1 | 1);
        this._output.writeBytes(utf);
      }
    },
    _writeStringWithoutType: {
      value: function(str) {
        if (!str.length) {
          this._writeUInt29(1);

        } else {
          if (!this._byReferenceStr(str)) {
            this._writeAMFUTF(str);
          }
        }
      }
    },
    _byReferenceObj: {
      value: _byReferenceOf(function() {
        return this._refObj;
      })
    },
    _byReferenceStr: {
      value: _byReferenceOf(function() {
        return this._refStr;
      })
    },
    _byReferenceTi: {
      value: _byReferenceOf(function() {
        return this._refTi;
      })
    },
  });

  Object.defineProperty(namespace, "AMF3Encoder", {
    value: AMF3Encoder
  });

})(this.amf);

/* ((amf-amf3Decoder.js)) */
(function(namespace) {
  "use strict";

  var _marker = namespace._marker.amf3;

  function AMF3Decoder(input) {
    Object.defineProperties(this, {
      _input: { value: input },
      _objRef: { value: [] },
      _strRef: { value: [] },
      _tiRef: { value: [] }
    })
  }
  Object.defineProperties(AMF3Decoder.prototype, {
    decode: {
      value: function() {
        var c = this._input.read();
        var fun = this._decoders[c];
        if (!fun) {
          throw new Error(c);
        }
        return fun.call(this);
      }
    },

    _decoders: {
      value: (function() {
        var r = [];
        function add(type, fun) {
          r[type] = fun;
        }

        add(_marker.STRING, function() {
          return this._readString();
        });
        add(_marker.UNDEFINED, function() {
          return undefined;
        });
        add(_marker.NULL, function() {
          return null;
        });
        add(_marker.FALSE, function() {
          return false;
        });
        add(_marker.TRUE, function() {
          return true;
        });
        add(_marker.INTEGER, function() {
          return this._readUInt29();
        });
        add(_marker.DOUBLE, function() {
          return this._input.readFloat64();
        });
        add(_marker.DATE, function() {
          var ref = this._readUInt29();
          if ((ref & 1) == 0) {
            return this._objRef[ref >> 1];
          }

          var time = this._input.readFloat64();
          var date = new Date(time);
          this._objRef.push(date);
          return date;

        });
        add(_marker.BYTE_ARRAY, function() {
          var ref = this._readUInt29();
          if ((ref & 1) == 0) {
            return this._objRef[ref >> 1];
          }

          var len = (ref >> 1);
          var ba = this._input.readBytes(len).buffer;
          this._objRef.push(ba);
          return ba;
        });
        add(_marker.ARRAY, function() {
          var ref = this._readUInt29();
          if ((ref & 1) == 0) {
            return this._objRef[ref >> 1];
          }

          var len = (ref >> 1);
          var map = null;
          while (true) {
            var name = this._readString();
            if (!name) {
              break;
            }

            if (!map) {
              map = {};
              this._objRef.push(map);
            }
            var value = this.decode();
            map[name] = value;
          }

          if (!map) {
            var array = new Array(len);
            this._objRef.push(array);
            for (var i=0; i<len; i++) {
              var value = this.decode();
              array[i] = value;
            }
            return array;

          } else {
            for (var i=0; i<len; i++) {
              var value = this.decode();
              map[i] = value;
            }
            return map;
          }
        });
        add(_marker.OBJECT, function() {
          var ref = this._readUInt29();
          if ((ref & 1) == 0) {
            return this._objRef[ref >> 1];
          }

          var ti;
          if ((ref & 3) == 1) {
            ti = this._tiRef[ref >> 2];
          } else {
            var externalizable = ((ref & 4) == 4);
            var dynamic = ((ref & 8) == 8);
            var count = (ref >> 4);
            var alias = this._readString();
            var properties = [];
            for (var i=0; i<count; i++) {
              var name = this._readString();
              properties.push(name);
            }
            ti = new namespace._TraitsInfo(alias, dynamic, externalizable, properties);
            this._tiRef.push(ti);
          }

          var obj = {};
          if (ti.className) {
            Object.defineProperty(obj, "$alias", {
              writable: true,
              configurable: true,
              value: ti.className
            });
          }
          this._objRef.push(obj);

          if (ti.externalizable) {
            if (ti.className == "flex.messaging.io.ArrayCollection") {
              obj = this.decode();
            } else {
              throw new Error("Not implemented");
            }
          } else {
            ti.properties.forEach(function(e) {
              var value = this.decode();
              obj[e] = value;
            }, this);
          }
          if (ti.dynamic) {
            while (true) {
              var name = this._readString();
              if (!name) {
                break;
              }
              var value = this.decode();
              obj[name] = value;
            }
          }
          return obj;

        });
        return r;
      })()
    },
    _readUInt29: {
      value: function() {
        var b = this._input.read();
        if (b < 128) {
          return b;
        }

        var v = (b & 0x7F) << 7;
        b = this._input.read();
        if (b < 128) {
          return (v | b);
        }

        v = (v | (b & 0x7F)) << 7;
        b = this._input.read();
        if (b < 128) {
          return (v | b);
        }

        v = (v | (b & 0x7F)) << 8;
        b = this._input.read();
        return (v | b);
      }
    },
    _readUTF: {
      value: function(len) {
        var array = this._input.readBytes(len);
        return namespace._fromUtf8Array(array);
      }
    },
    _readString: {
      value: function() {
        var ref = this._readUInt29();
        if ((ref & 1) == 0) {
          return this._strRef[ref >> 1];
        }

        var len = (ref >> 1);
        if (!len) {
          return "";
        }
        var str = this._readUTF(len);
        this._strRef.push(str);
        return str;
      }
    }
  });

  Object.defineProperty(namespace, "AMF3Decoder", {
    value: AMF3Decoder
  });

})(this.amf);

/* ((amf-amfconnection.js)) */
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
