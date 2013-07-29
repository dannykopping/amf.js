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