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