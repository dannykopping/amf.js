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