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