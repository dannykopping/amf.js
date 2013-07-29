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