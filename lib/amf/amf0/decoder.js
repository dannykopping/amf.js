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
