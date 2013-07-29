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