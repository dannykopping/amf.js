var amf = {},
  bin = {},
  traits = {},
  packet = {},
  message = {},
  deserializer = {},
  serializer = {},
  utf8 = {},
  utils = {};

/**
 * Traits
 */

function AMFTraits() {
  this.clss = 'Object'; // object class
  this.dyn = false;    // whether object is dynamic (i.e. non strict about members)
  this.props = [];       // class members
}

AMFTraits.prototype.toString = function () {
  return '[Object AMFTraits]';
};

/**
 * Packet
 */

function AMFPacket(v) {
  if (v == null) {
    v = amf.AMF3;
  }
  this.version = v;
  this.headers = {};
  this.nheaders = 0;
  this.messages = [];
}

AMFPacket.prototype.toString = function () {
  return '[Object AMFPacket]';
};

AMFPacket.prototype.addHeader = function (header, value) {
  if (typeof header === 'string') {
    header = amf.header(header, value);
  }
  if (this.headers[header.name]) {
    // @todo multiple headers of same name? currently replaces
  }
  else {
    this.nheaders++;
  }
  this.headers[header.name] = header;
  return header;
};

AMFPacket.prototype.addMessage = function (value, requestURI, responseURI) {
  var message = amf.message(value, requestURI, responseURI);
  this.messages.push(message);
  return message;
};

AMFPacket.prototype.serialize = function () {
  var s = amf.serializer();
  // write version flag
  s.writeU16(this.version);
  // write packet headers
  s.writeU16(this.nheaders);
  for (var h in this.headers) {
    s.writeHeader(this.headers[h]);
  }
  // write packet messages
  s.writeU16(this.messages.length);
  for (var i = 0; i < this.messages.length; i++) {
    s.writeMessage(this.messages[i], this.version);
  }
  // return serialized string
  return s.toString();
};

/**
 * @static
 */
AMFPacket.deserialize = function (src) {
  var Packet = new AMFPacket();
  var d = amf.deserializer(src);
  var v = d.readU16();
  if (v !== amf.AMF0 && v !== amf.AMF3) {
    throw new Error('Invalid AMF packet');
  }
  // read headers
  var nheaders = d.readU16();
  while (0 < nheaders--) {
    Packet.addHeader(d.readHeader());
  }
  // read messages
  var nmessages = d.readU16();
  while (0 < nmessages--) {
    Packet.messages.push(d.readMessage());
  }
  return Packet;
};

/**
 * Message
 */
function AMFMessage(value, requestURI, responseURI) {
  this.value = value;
  this.requestURI = requestURI || '';
  this.responseURI = responseURI || '';
}

AMFMessage.prototype.toString = function () {
  return '[Object AMFMessage]';
};

/**
 * Utils
 */
utils.leftPad = function (s, n, c) {
  while (s.length < n) {
    s = c + s;
  }
  return s;
};

utils.reverseString = function (s) {
  var r = '', i = 0, n = -s.length;
  while (i > n) {
    r += s.substr(--i, 1);
  }
  return r;
};

utils.toHex = function (d, n) {
  var h = d.toString(16).toUpperCase();
  return utils.leftPad(h, 2, '0');
};

utils.hex = function (bin, cols) {
  //bin = expandUTF8( bin );
  cols || ( cols = 24 );
  var s = '', line = [];
  var c, d, i = 0;
  while (bin) {
    c = bin.charAt(0);
    d = bin.charCodeAt(0);
    bin = bin.substr(1);
    // print hex
    s += utils.toHex(d, 2) + ' ';
    // add printable to line
    if (d === 9) {
      line.push(' '); // <- tab
    }
    else if (d < 32 || d > 126) {
      line.push('.'); // <- unprintable // well, non-ascii
    }
    else {
      line.push(c); // <- printable
    }
    // wrap at cols, and print plain text
    if (++i === cols) {
      s += ' ' + line.join('') + '\n';
      line = [];
      i = 0;
    }
    else if (i % 8 === 0) {
      s += ' ';
    }
  }
  // pick up remainder
  if (line.length) {
    while (i++ < cols) {
      s += '   ';
    }
    s += ' ' + line.join('') + '\n';
  }
  return s;
};

/**
 * Binary
 */
var BinaryParser;

bin.parser = function (bigEndian, allowExceptions) {
  return new BinaryParser(bigEndian, allowExceptions);
};

// code below copied asis from http://jsfromhell.com/

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/classes/binary-parser [rev. #1]

BinaryParser = function (bigEndian, allowExceptions) {
  this.bigEndian = bigEndian, this.allowExceptions = allowExceptions;
};
with ({p: BinaryParser.prototype}) {
  p.encodeFloat = function (number, precisionBits, exponentBits) {
    var bias = Math.pow(2, exponentBits - 1) - 1, minExp = -bias + 1, maxExp = bias, minUnnormExp = minExp - precisionBits,
      status = isNaN(n = parseFloat(number)) || n == -Infinity || n == +Infinity ? n : 0,
      exp = 0, len = 2 * bias + 1 + precisionBits + 3, bin = new Array(len),
      signal = (n = status !== 0 ? 0 : n) < 0, n = Math.abs(n), intPart = Math.floor(n), floatPart = n - intPart,
      i, lastBit, rounded, j, result;
    for (i = len; i; bin[--i] = 0);
    for (i = bias + 2; intPart && i; bin[--i] = intPart % 2, intPart = Math.floor(intPart / 2));
    for (i = bias + 1; floatPart > 0 && i; (bin[++i] = ((floatPart *= 2) >= 1) - 0) && --floatPart);
    for (i = -1; ++i < len && !bin[i];);
    if (bin[(lastBit = precisionBits - 1 + (i = (exp = bias + 1 - i) >= minExp && exp <= maxExp ? i + 1 : bias + 1 - (exp = minExp - 1))) + 1]) {
      if (!(rounded = bin[lastBit]))
        for (j = lastBit + 2; !rounded && j < len; rounded = bin[j++]);
      for (j = lastBit + 1; rounded && --j >= 0; (bin[j] = !bin[j] - 0) && (rounded = 0));
    }
    for (i = i - 2 < 0 ? -1 : i - 3; ++i < len && !bin[i];);

    (exp = bias + 1 - i) >= minExp && exp <= maxExp ? ++i : exp < minExp &&
      (exp != bias + 1 - len && exp < minUnnormExp && this.warn("encodeFloat::float underflow"), i = bias + 1 - (exp = minExp - 1));
    (intPart || status !== 0) && (this.warn(intPart ? "encodeFloat::float overflow" : "encodeFloat::" + status),
      exp = maxExp + 1, i = bias + 2, status == -Infinity ? signal = 1 : isNaN(status) && (bin[i] = 1));
    for (n = Math.abs(exp + bias), j = exponentBits + 1, result = ""; --j; result = (n % 2) + result, n = n >>= 1);
    var r;
    for (n = 0, j = 0, i = (result = (signal ? "1" : "0") + result + bin.slice(i, i + precisionBits).join("")).length, r = [];
         i; n += (1 << j) * result.charAt(--i), j == 7 && (r[r.length] = String.fromCharCode(n), n = 0), j = (j + 1) % 8);
    r[r.length] = n ? String.fromCharCode(n) : "";
    return (this.bigEndian ? r.reverse() : r).join("");
  };
  p.encodeInt = function (number, bits, signed) {
    var max = Math.pow(2, bits), r = [];
    (number >= max || number < -(max >> 1)) && this.warn("encodeInt::overflow") && (number = 0);
    number < 0 && (number += max);
    for (; number; r[r.length] = String.fromCharCode(number % 256), number = Math.floor(number / 256));
    for (bits = -(-bits >> 3) - r.length; bits--; r[r.length] = "\0");
    return (this.bigEndian ? r.reverse() : r).join("");
  };
  p.decodeFloat = function (data, precisionBits, exponentBits) {
    var b = ((b = new this.Buffer(this.bigEndian, data)).checkBuffer(precisionBits + exponentBits + 1), b),
      bias = Math.pow(2, exponentBits - 1) - 1, signal = b.readBits(precisionBits + exponentBits, 1),
      exponent = b.readBits(precisionBits, exponentBits), significand = 0,
      divisor = 2, curByte = b.buffer.length + (-precisionBits >> 3) - 1,
      byteValue, startBit, mask;
    do
      for (byteValue = b.buffer[ ++curByte ], startBit = precisionBits % 8 || 8, mask = 1 << startBit;
           mask >>= 1; (byteValue & mask) && (significand += 1 / divisor), divisor *= 2);
    while (precisionBits -= startBit);
    return exponent == (bias << 1) + 1 ? significand ? NaN : signal ? -Infinity : +Infinity
      : (1 + signal * -2) * (exponent || significand ? !exponent ? Math.pow(2, -bias + 1) * significand
      : Math.pow(2, exponent - bias) * (1 + significand) : 0);
  };
  p.decodeInt = function (data, bits, signed) {
    var b = new this.Buffer(this.bigEndian, data), x = b.readBits(0, bits), max = Math.pow(2, bits);
    return signed && x >= max / 2 ? x - max : x;
  };
  with ({p: (p.Buffer = function (bigEndian, buffer) {
    this.bigEndian = bigEndian || 0, this.buffer = [], this.setBuffer(buffer);
  }).prototype}) {
    p.readBits = function (start, length) {
      //shl fix: Henri Torgemane ~1996 (compressed by Jonas Raoni)
      function shl(a, b) {
        for (++b; --b; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1);
        return a;
      }

      if (start < 0 || length <= 0)
        return 0;
      this.checkBuffer(start + length);
      for (var offsetLeft, offsetRight = start % 8, curByte = this.buffer.length - (start >> 3) - 1,
             lastByte = this.buffer.length + (-(start + length) >> 3), diff = curByte - lastByte,
             sum = ((this.buffer[ curByte ] >> offsetRight) & ((1 << (diff ? 8 - offsetRight : length)) - 1))
               + (diff && (offsetLeft = (start + length) % 8) ? (this.buffer[ lastByte++ ] & ((1 << offsetLeft) - 1))
               << (diff-- << 3) - offsetRight : 0); diff; sum += shl(this.buffer[ lastByte++ ], (diff-- << 3) - offsetRight)
        );
      return sum;
    };
    p.setBuffer = function (data) {
      if (data) {
        for (var l, i = l = data.length, b = this.buffer = new Array(l); i; b[l - i] = data.charCodeAt(--i));
        this.bigEndian && b.reverse();
      }
    };
    p.hasNeededBits = function (neededBits) {
      return this.buffer.length >= -(-neededBits >> 3);
    };
    p.checkBuffer = function (neededBits) {
      if (!this.hasNeededBits(neededBits))
        throw new Error("checkBuffer::missing bytes");
    };
  }
  p.warn = function (msg) {
    if (this.allowExceptions)
      throw new Error(msg);
    return 1;
  };
  p.toSmall = function (data) {
    return this.decodeInt(data, 8, true);
  };
  p.fromSmall = function (number) {
    return this.encodeInt(number, 8, true);
  };
  p.toByte = function (data) {
    return this.decodeInt(data, 8, false);
  };
  p.fromByte = function (number) {
    return this.encodeInt(number, 8, false);
  };
  p.toShort = function (data) {
    return this.decodeInt(data, 16, true);
  };
  p.fromShort = function (number) {
    return this.encodeInt(number, 16, true);
  };
  p.toWord = function (data) {
    return this.decodeInt(data, 16, false);
  };
  p.fromWord = function (number) {
    return this.encodeInt(number, 16, false);
  };
  p.toInt = function (data) {
    return this.decodeInt(data, 32, true);
  };
  p.fromInt = function (number) {
    return this.encodeInt(number, 32, true);
  };
  p.toDWord = function (data) {
    return this.decodeInt(data, 32, false);
  };
  p.fromDWord = function (number) {
    return this.encodeInt(number, 32, false);
  };
  p.toFloat = function (data) {
    return this.decodeFloat(data, 23, 8);
  };
  p.fromFloat = function (number) {
    return this.encodeFloat(number, 23, 8);
  };
  p.toDouble = function (data) {
    return this.decodeFloat(data, 52, 11);
  };
  p.fromDouble = function (number) {
    return this.encodeFloat(number, 52, 11);
  };
}

/**
 * UTF-8
 */
/**
 * Decode native AS string to string of single byte characters.
 * @link http://en.wikipedia.org/wiki/UTF-8
 * @param String native UTF-8 string
 * @return String decoded string
 */
utf8.expand = function (u) {
  var s = '';
  for (var i = 0; i < u.length; i++) {
    var n = u.charCodeAt(i);
    s += utf8.chr(n);
  }
  return s;
};

/**
 * Convert UTF-8 codepoint to multi-byte sequence
 * @param integer utf-8 code point
 * @return string sequence of [one to four] single byte characters
 */
utf8.chr = function chr(n) {
  // 7 bit ASCII character - transparent to Unicode
  if (n < 0x80) {
    return String.fromCharCode(n);
  }
  // compile 1-4 byte string depending on size of code point.
  // this could be more compact but shows the algorithms nicely ;)
  var w = null;
  var x = null;
  var y = null;
  var z = null;
  // Double byte sequence
  // 00000yyy yyzzzzzz ==> 110yyyyy 10zzzzzz
  if (n < 0x800) {
    z = n & 63; // get z bits
    y = n >> 6; // get y bits
    y |= 192; // "110yyyyy"
    z |= 128; // "10zzzzzz"
  }
  // Triple byte sequence
  // xxxxyyyy yyzzzzzz ==> 1110xxxx 10yyyyyy 10zzzzzz
  else if (n < 0x10000) {
    z = n & 63; // get z bits
    y = ( n >>= 6 ) & 63; // get y bits
    x = ( n >>= 6 ) & 15; // get x bits
    z |= 128; // prefix "10zzzzzz"
    y |= 128; // prefix "10yyyyyy"
    x |= 224; // prefix "1110xxxx"
  }
  // Four byte sequence
  // 000wwwxx xxxxyyyy yyzzzzzz ==>	11110www 10xxxxxx 10yyyyyy 10zzzzzz
  else if (n <= 0x10FFFF) {
    z = n & 63; // get z bits
    y = ( n >>= 6 ) & 63; // get y bits
    x = ( n >>= 6 ) & 63; // get x bits
    w = ( n >>= 6 ) & 7;  // get w bits
    z |= 128; // prefix "10zzzzzz"
    y |= 128; // prefix "10yyyyyy"
    x |= 128; // prefix "10xxxxxx"
    w |= 240; // prefix "11110www"
  }
  else {
    // UTF allows up to 1114111
    trace('UTF8 code points cannot be greater than 0x10FFFF [0x' + n.toString(16) + ']');
    return '?';
  }
  // compile multi byte sequence
  var s = '';
  ( w == null ) || ( s += String.fromCharCode(w) );
  ( x == null ) || ( s += String.fromCharCode(x) );
  ( y == null ) || ( s += String.fromCharCode(y) );
  ( z == null ) || ( s += String.fromCharCode(z) );
  return s;
};

/**
 * Collapse a multibyte sequence to native UTF-8
 * @param String
 * @return String
 */
utf8.collapse = function (s) {

  // inner peeking function for skipping over multi-byte sequence
  function peek() {
    var n = s.charCodeAt(++i);
    if (isNaN(n)) {
      throw new Error("Unexpected end of string, offset " + i);
    }
    return n;
  }

  // make a code point from a leading byte and aribitrary number of following bytes
  function make(t, num) {
    for (var j = 0; j < num; j++) {
      // get trailing 10xxxxxx byte
      var m = peek();
      if (( m & 192 ) !== 128) {
        throw new Error('Invalid byte 0x' + m.toString(16).toUpperCase() + ' "' + String.fromCharCode(m) + '" at offset ' + i);
      }
      t <<= 6;
      t |= ( m & 63 );
    }
    return String.fromCharCode(t);
  }

  // start iteration, skipping multibyte sequences wwhen leading byte found
  var u = '';
  for (var i = 0; i < s.length; i++) {
    var n = s.charCodeAt(i);
    // 7-bit ASCII is transparent to Unicode
    if (( n & 128 ) === 0) {
      u += String.fromCharCode(n);
      continue;
    }
    // check for leading byte in UTF8 sequence, most likely first for speed
    if (( n & 224 ) === 192) {
      // is leading char in 2 byte sequence "110xxxxx"
      u += make(n & 31, 1);
    }
    else if (( n & 192 ) === 128) {
      // is a solitary 10xxxxxx character - technically invalid, but common!
      // - todo - map Windows-1252 special cases in range 128-159
      u += String.fromCharCode(n);
    }
    else if (( n & 240 ) === 224) {
      // is leading char in 3 byte sequence "1110xxxx"
      u += make(n & 15, 2);
    }
    else if (( n & 248 ) === 240) {
      // is leading char in 4 byte sequence "11110xxx"
      u += make(n & 7, 3);
    }
    else {
      throw new Error('Invalid character "' + String.fromCharCode(n) + '" at offset ' + i);
      u += '?';
    }
  }
  return u;
};

/**
 * Calculate real byte size of multibyte character string
 * @param String
 * @return Number
 */
utf8.size = function (s) {
  var b = 0;
  for (var i = 0; i < s.length; i++) {
    var n = s.charCodeAt(i);
    if (n < 0x80) {
      b += 1;
    }
    else if (n < 0x800) {
      b += 2;
    }
    else if (n < 0x10000) {
      b += 3;
    }
    else if (n <= 0x10FFFF) {
      b += 4;
    }
  }
  return b;
};

/**
 * Deserialize
 */
function AMFDeserializer(src) {
  this.s = src || '';
  this.i = 0;
  this.resetRefs();
  this.beParser = bin.parser(true, true);  // <- big endian binary unpacker
  this.leParser = bin.parser(false, true); // <- little endian binary unpacker
}

AMFDeserializer.prototype.resetRefs = function () {
  this.refObj = []; // object references
  this.refStr = []; // string references
  this.refTra = []; // trait references
};

AMFDeserializer.prototype.shiftBytes = function (n) {
  if (n === 0) {
    return '';
  }
  var s = this.s.slice(0, n);
  if (s.length !== n) {
    throw new Error("Not enough input to read " + n + " bytes, got " + s.length + ", offset " + this.i);
  }
  this.s = this.s.slice(n);
  this.i += n;
  return s;
};

AMFDeserializer.prototype.readU8 = function () {
  var s = this.shiftBytes(1);
  return s.charCodeAt(0);
};

AMFDeserializer.prototype.readU16 = function () {
  var s = this.shiftBytes(2);
  return this.beParser.toWord(s);
};

AMFDeserializer.prototype.readU32 = function () {
  var s = this.shiftBytes(4);
  return this.beParser.toDWord(s);
};

AMFDeserializer.prototype.readDouble = function () {
  var s = this.shiftBytes(8);
  if ('\0\0\0\0\0\0\xF8\x7F' === s) {
    return Number.NaN;
  }
  return this.beParser.toDouble(s);
};

AMFDeserializer.prototype.readU29 = function () {
  var i;
  var n = 0;
  var t = 0;
  while (true) {
    if (++t === 5) {
      throw new Error("U29 range error, offset " + this.i);
    }
    i = this.readU8();
    // final whole byte if fourth bit
    if (4 === t) {
      n = i | ( n << 1 );
      break;
    }
    // else take just 7 bits
    n |= ( i & 0x7F );
    // next byte is part of the sequence if high bit is set
    if (i & 0x80) {
      n <<= 7;
      continue;
    }
    // else is final byte
    else {
      break;
    }
  }
  return n;
};

/**
 * @return int signed integer
 */
AMFDeserializer.prototype.readInteger = function (version) {
  if (version === amf.AMF0) {
    return this.readDouble();
  }
  // else AMF3 U29
  return this.readU29();
};

AMFDeserializer.prototype.readUTF8 = function (version) {
  var str, len;
  // AMF3 supports string references
  if (version === amf.AMF3 || version == null) {
    var n = this.readU29();
    if (n & 1) {
      len = n >> 1;
      // index string unless empty
      if (len === 0) {
        return '';
      }
      str = this.shiftBytes(len);
      this.refStr.push(str);
    }
    else {
      var idx = n >> 1;
      if (this.refStr[idx] == null) {
        throw new Error("No string reference at index " + idx + ", offset " + this.i);
      }
      str = this.refStr[idx];
    }
  }
  // else simple AMF0 string
  else {
    len = this.readU16();
    str = this.shiftBytes(len);
  }
  return utf8.collapse(str);
};

AMFDeserializer.prototype.readValue = function (version) {
  var marker = this.readU8();
  // support AMV+ switch
  if (version === amf.AMF0 && marker === amf.AMF0_AMV_PLUS) {
    version = amf.AMF3;
    marker = this.readU8();
  }
  switch (version) {
    // AMF 3 types
    case amf.AMF3:
      switch (marker) {
        case amf.AMF3_UNDEFINED:
          return undefined;
        case amf.AMF3_NULL:
          return null;
        case amf.AMF3_FALSE:
          return false;
        case amf.AMF3_TRUE:
          return true;
        case amf.AMF3_INTEGER:
          return this.readInteger();
        case amf.AMF3_DOUBLE:
          return this.readDouble();
        case amf.AMF3_STRING:
          return this.readUTF8(amf.AMF3);
        case amf.AMF3_ARRAY:
          return this.readArray();
        case amf.AMF3_OBJECT:
          return this.readObject(amf.AMF3);
        case amf.AMF3_DATE:
          return this.readDate();
        case amf.AMF3_BYTE_ARRAY:
          throw new Error('ByteArrays not yet supported, sorry');
        //return this.readByteArray();
        default:
          throw new Error('Type error, unsupported AMF3 marker: 0x' + utils.leftPad(marker.toString(16), 2, '0') + ', offset ' + this.i);
      }
    // default to AMF0
    default:
      switch (marker) {
        case amf.AMF0_NUMBER:
          return this.readDouble();
        case amf.AMF0_STRING:
          return this.readUTF8(amf.AMF0);
        case amf.AMF0_UNDEFINED:
          return undefined;
        case amf.AMF0_NULL:
          return null;
        case amf.AMF0_BOOLEAN:
          return this.readBoolean();
        case amf.AMF0_STRICT_ARRAY:
          return this.readStrictArray();
        case amf.AMF0_DATE:
          return this.readDate();
        case amf.AMF0_OBJECT:
          return this.readObject(amf.AMF0);
        default:
          throw new Error('Type error, unsupported AMF0 marker: 0x' + utils.leftPad(marker.toString(16), 2, '0') + ', offset ' + this.i);
      }
  }
};

AMFDeserializer.prototype.readBoolean = function () {
  return Boolean(this.readU8());
};

AMFDeserializer.prototype.readStrictArray = function () {
  var a = [];
  var n = this.readU32();
  for (var i = 0; i < n; i++) {
    a.push(this.readValue(amf.AMF0));
  }
  return a;
};

AMFDeserializer.prototype.readArray = function () {
  var a = [];
  var n = this.readU29();
  // reference or value
  if (n & 1) {
    this.refObj.push(a);
    // count dense portion
    var len = n >> 1;
    // iterate over over associative portion, until empty string terminates
    var key;
    while (key = this.readUTF8(amf.AMF3)) {
      a[key] = this.readValue(amf.AMF3);
    }
    // append dense values
    for (var i = 0; i < len; i++) {
      a.push(this.readValue(amf.AMF3));
    }
  }
  // else is reference index
  else {
    var idx = n >> 1;
    if (this.refObj[idx] == null) {
      throw new Error("No array reference at index " + idx + ", offset " + this.i);
    }
    a = this.refObj[idx];
  }
  return a;
};

AMFDeserializer.prototype.readObject = function (version) {
  var prop, Obj = {};
  // support AMF0 objects
  if (version === amf.AMF0) {
    while (prop = this.readUTF8(amf.AMF0)) {
      Obj[prop] = this.readValue(amf.AMF0);
    }
    // next must be object end marker
    var end = this.readU8();
    if (end !== amf.AMF0_OBJECT_END) {
      throw new Error('Expected object end marker, got 0x' + end.toString(16));
    }
    return Obj;
  }
  // else assume AMF3
  var Traits;
  // check if instance follows (U29O-traits)
  var n = this.readU29();
  if (n & 1) {
    // check if trait data follows
    if (n & 2) {
      Traits = amf.traits();
      this.refTra.push(Traits);
      // check if traits externalizable follows (U29O-traits-ext)
      if (n & 4) {
        Traits.clss = this.readUTF8(amf.AMF3);
        // follows an indeterminable number of bytes
        // Extenalizable server-side class must perform custom deserialization
        // @todo Externalizable class deserializing
        throw new Error('Externalizable classes not yet supported, sorry');
      }
      else {
        Traits.dyn = Boolean(n & 8);
        Traits.clss = this.readUTF8(amf.AMF3);
        // iterate over declared member names
        var proplen = n >> 4;
        for (var i = 0, prop; i < proplen; i++) {
          prop = this.readUTF8(amf.AMF3);
          Traits.props.push(prop);
        }
      }
    }
    // else trait reference (U29O-traits-ref)
    else {
      var idx = n >> 2;
      if (this.refTra[idx] == null) {
        throw new Error("No traits reference at index " + idx + ", offset " + this.i);
      }
      Traits = this.refTra[idx];
    }
    // Have traits - Construct instance
    // @todo support class mapping somehow?
    this.refObj.push(Obj);
    for (var i = 0; i < Traits.props.length; i++) {
      prop = Traits.props[i];
      Obj[prop] = this.readValue(amf.AMF3);
    }
    // adding type to JSON object so we can remember it and pass back to server
    if (Traits.clss) {
      Obj["type"] = Traits.clss;
    }

    // iterate over dynamic properties until empty string
    if (Traits.dyn) {
      while (prop = this.readUTF8(amf.AMF3)) {
        Obj[prop] = this.readValue(amf.AMF3);
      }
    }
  }
  // else object reference ( U29O-ref )
  else {
    var idx = n >> 1;
    if (this.refObj[idx] == null) {
      throw new Error("No object reference at index " + idx + ", offset " + this.i);
    }
    Obj = this.refObj[idx];
  }
  return Obj;
};

AMFDeserializer.prototype.readDate = function () {
  var u, d;
  // check if instance follows (U29O-ref)
  var n = this.readU29();
  if (n & 1) {
    // create and index a new date object
    u = this.readDouble();
    d = new Date(u);
    this.refObj.push(d);
  }
  else {
    var idx = n >> 1;
    if (this.refObj[idx] == null || !this.refObj[idx] instanceof Date) {
      throw new Error("No date object reference at index " + idx + ", offset " + this.i);
    }
    d = this.refObj[idx];
  }
  return d;
};

/**
 * @return AMFHeader
 */
AMFDeserializer.prototype.readHeader = function () {
  this.resetRefs();
  var name = this.readUTF8(amf.AMF0);
  var Header = amf.header(name, '');
  Header.mustunderstand = Boolean(this.readU8());
  var len = this.readU32(); // we won't actually use the length
  // @todo lazy creation of header by storing known header byte length
  Header.value = this.readValue(amf.AMF0);
  return Header;
};

/**
 * @return AMFMessage
 */
AMFDeserializer.prototype.readMessage = function () {
  this.resetRefs();
  var Msg = amf.message('', '', '');
  // request URI - AMF0 UTF-8
  Msg.requestURI = this.readUTF8(amf.AMF0);
  // response URI - AMF0 UTF-8
  Msg.responseURI = this.readUTF8(amf.AMF0);
  // message length, which may be -1, shall be ignored
  var len = this.readU32(); // we won't actually use the length
  // message value always AMF0 even in AMF3
  Msg.value = this.readValue(amf.AMF0);
  return Msg;
};

/**
 * Serialize
 */
function AMFSerializer(v) {
  this.version = v;
  this.s = '';
  this.resetRefs();
  this.beParser = bin.parser(true, true);  // <- big endian binary packer
  this.leParser = bin.parser(false, true); // <- little endian binary packer
}

AMFSerializer.prototype.toString = function () {
  return this.s;
};

AMFSerializer.prototype.resetRefs = function () {
  this.refObj = []; // object references
  this.refStr = []; // string references
  this.refTra = []; // trait references
};

AMFSerializer.prototype.writeHeader = function (Header) {
  this.resetRefs();
  // header must be AMF0
  var v = this.version;
  this.version = amf.AMF0;
  this.writeUTF8(Header.name);
  this.writeU8(Header.mustunderstand ? 1 : 0);
  // header of unknown length until serialized (U32)-1
  this.s += '\xFF\xFF\xFF\xFF';
  var s = this.writeValue(Header.value);
  // reinstate version if it wasn't AMF0
  this.version = v;
  return s;
};

AMFSerializer.prototype.writeMessage = function (Message, v) {
  this.resetRefs();
  // message wrappers must be AMF0
  var vv = this.version;
  this.version = amf.AMF0;
  this.writeUTF8(Message.requestURI);
  this.writeUTF8(Message.responseURI);
  // message of unknown length until serialized (U32)-1
  this.s += '\xFF\xFF\xFF\xFF';
  // switch version if AMF3
  if (v === amf.AMF3) {
    this.writeU8(amf.AMF0_AMV_PLUS);
  }
  this.version = v;
  this.writeValue(Message.value);
  this.version = vv;
  return this.s;
};

/**
 * Write any JavaScript value, automatically chooses which data type to use
 * @param mixed
 * @return string
 */
AMFSerializer.prototype.writeValue = function (value) {
  // undefined
  if (value === undefined) {
    return this.writeUndefined();
  }
  // null
  if (value === null) {
    return this.writeNull();
  }
  // strings
  if ('string' === typeof value) {
    return this.writeUTF8(value, true);
  }
  // numbers
  if ('number' === typeof value) {
    return this.writeNumber(value, true);
  }
  // booleans
  if ('boolean' === typeof value) {
    return this.writeBool(value);
  }
  // arrays
  if ('function' === typeof value.push) {
    return this.writeArray(value);
  }
  // special object types
  if (value instanceof Date) {
    return this.writeDate(value);
  }
  // else write vanilla Object
  return this.writeObject(value);
};

AMFSerializer.prototype.writeUndefined = function () {
  var marker = this.version === amf.AMF3 ? amf.AMF3_UNDEFINED : amf.AMF0_UNDEFINED;
  return this.writeU8(marker);
};

AMFSerializer.prototype.writeNull = function () {
  var marker = this.version === amf.AMF3 ? amf.AMF3_NULL : amf.AMF0_NULL;
  return this.writeU8(marker);
};

AMFSerializer.prototype.writeBool = function (value) {
  // AMF3
  if (this.version === amf.AMF3) {
    var marker = value ? amf.AMF3_TRUE : amf.AMF3_FALSE;
    return this.writeU8(marker);
  }
  // AMF0
  else {
    this.writeU8(amf.AMF0_BOOLEAN);
    return this.writeU8(value ? 1 : 0);
  }
};

AMFSerializer.prototype.writeUTF8 = function (value, writeMarker) {
  if (typeof value !== 'string') {
    value = '';
  }

  var binary = utf8.expand(value);
  var len = binary.length;
  // AMF3
  if (this.version === amf.AMF3) {
    if (writeMarker) {
      this.writeU8(amf.AMF3_STRING);
    }
    var flag = ( len << 1 ) | 1;
    this.writeU29(flag);
  }
  // AMF0
  else {
    if (writeMarker) {
      this.writeU8(amf.AMF0_STRING);
    }
    this.writeU16(len);
  }
  // append string as-is
  return this.s += binary;
};

AMFSerializer.prototype.writeArray = function (value) {
  var len = value.length;
  // AMF3
  if (this.version === amf.AMF3) {
    this.writeU8(amf.AMF3_ARRAY);
    // support object references
    var n = this.refObj.indexOf(value);
    if (n !== -1) {
      return this.writeU29(n << 1);
    }
    // else index object reference
    this.refObj.push(value);
    // flag with XXXXXXX1 indicating length of dense portion with instance
    var flag = ( len << 1 ) | 1;
    this.writeU29(flag);
    // no assoc values in JavaScript - end with empty string
    this.writeUTF8('');
  }
  // AMF0 strict array
  else {
    this.writeU8(amf.AMF0_STRICT_ARRAY);
    this.writeU32(len);
  }
  // write members (the dense portion - all we need in JS)
  for (var i = 0; i < len; i++) {
    this.writeValue(value[i]);
  }
  return this.s;
};

AMFSerializer.prototype.writeObject = function (value) {
  if (this.version !== amf.AMF3) {
    throw new Error("This library doesn't support AMF0 objects, use AMF3");
  }
  this.writeU8(amf.AMF3_OBJECT);
  // support object references
  var n = this.refObj.indexOf(value);
  if (n !== -1) {
    return this.writeU29(n << 1);
  }
  // else index object reference
  this.refObj.push(value);
  // flag with instance, no traits, no externalizable
  this.writeU29(11);

  // Override object type if present
  /*if (value['type'] != null) {
    this.writeUTF8(value['type']);
  } else {
    this.writeUTF8('Object');
  }*/

  // Don't write object type
  this.writeUTF8(null);

  // write serializable properties
  for (var s in value) {
    if (typeof value[s] !== 'function') {
      this.writeUTF8(s);
      this.writeValue(value[s]);
    }
  }
  // terminate dynamic props with empty string
  return this.writeUTF8('');
};

AMFSerializer.prototype.writeDate = function (d) {
  if (this.version !== amf.AMF3) {
    throw new Error("This library doesn't support AMF0 objects, use AMF3");
  }
  this.writeU8(amf.AMF3_DATE);
  this.writeU29(1);
  return this.writeDouble(d.getTime());
};

AMFSerializer.prototype.writeNumber = function (value, writeMarker) {
  // serialize as integers if possible
  var n = parseInt(value);
  if (n === value && n >= 0 && n < 0x20000000) {
    return this.writeU29(value, writeMarker);
  }
  return this.writeDouble(value, writeMarker);
};

AMFSerializer.prototype.writeDouble = function (value, writeMarker) {
  if (writeMarker) {
    var marker = this.version === amf.AMF3 ? amf.AMF3_DOUBLE : amf.AMF0_NUMBER;
    this.writeU8(marker);
  }
  // support for NaN as double "00 00 00 00 00 00 F8 7F"
  if (isNaN(value)) {
    this.s += '\0\0\0\0\0\0\xF8\x7F';
  }
  else {
    this.s += this.beParser.fromDouble(value);
  }
  return this.s;
};

AMFSerializer.prototype.writeU8 = function (n) {
  return this.s += this.beParser.fromByte(n);
};

AMFSerializer.prototype.writeU16 = function (n) {
  return this.s += this.beParser.fromWord(n);
};

AMFSerializer.prototype.writeU32 = function (n) {
  return this.s += this.beParser.fromDWord(n);
};

/** AMF3 only */
AMFSerializer.prototype.writeU29 = function (n, writeMarker) {
  // unsigned range: 0 -> pow(2,29)-1; 0 -> 0x1FFFFFFF
  // signed range: -pow(2,28) -> pow(2,28)-1; -0x10000000 -> 0x0FFFFFFF
  if (n < 0) {
    throw new Error('U29 range error, ' + n + ' < 0');
    //n += 0x20000000;
  }
  var a, b, c, d;
  if (n < 0x00000080) {
    // 0AAAAAAA
    a = n;
  }
  else if (n < 0x00004000) {
    //                      0x80-FF  0x00-7F
    // 00AAAAAA ABBBBBBB -> 1AAAAAAA 0BBBBBBB
    b = n & 0x7F;
    a = 0x80 | ( n >> 7 & 0x7F );
  }
  else if (n < 0x00200000) {
    //                               0x80-FF  0x80-FF  0x00-7F
    // 000AAAAA AABBBBBB BCCCCCCC -> 1AAAAAAA 1BBBBBBB 0CCCCCCC
    c = n & 0x7F;
    b = 0x80 | ( (n >>= 7) & 0x7F );
    a = 0x80 | ( (n >>= 7) & 0x7F );
  }
  else if (n < 0x20000000) {
    //                                        0x80-FF  0x80-FF  0x80-FF  0x00-FF
    // 000AAAAA AABBBBBB BCCCCCCC DDDDDDDD -> 1AAAAAAA 1BBBBBBB 1CCCCCCC DDDDDDDD
    d = n & 0xFF;
    c = 0x80 | ( (n >>= 8) & 0x7F );
    b = 0x80 | ( (n >>= 7) & 0x7F );
    a = 0x80 | ( (n >>= 7) & 0x7F );
  }
  else {
    throw new Error('U29 range error, ' + n + ' > 0x1FFFFFFF');
  }
  if (writeMarker) {
    this.writeU8(amf.AMF3_INTEGER);
  }
  this.writeU8(a);
  if (b != null) {
    this.writeU8(b);
    if (c != null) {
      this.writeU8(c);
      if (d != null) {
        this.writeU8(d);
      }
    }
  }
  return this.s;
};

/**
 * AMF
 */

/**
 * @return AMFPacket
 */
amf.packet = function (src) {
  var Packet;
  if (src) {
    Packet = AMFPacket.deserialize(src);
  }
  if (!Packet) {
    Packet = new AMFPacket;
  }
  return Packet;
};

/**
 * @return AMFMessage
 */
amf.message = function (value, requestURI, responseURI) {
  return new AMFMessage(value, requestURI, responseURI);
};

/**
 * @return AMFHeader
 */
amf.header = function (value, requestURI, responseURI) {
  return new AMFMessage(value, requestURI, responseURI);
};

/**
 * @return AMFDeserializer
 */
amf.deserializer = function (src) {
  return new AMFDeserializer(src);
};

/**
 * @return AMFSerializer
 */
amf.serializer = function () {
  return new AMFSerializer(3);
};

/**
 * @return AMFTraits
 */
amf.traits = function () {
  return new AMFTraits;
};

/**
 * pseudo constants
 */
amf.AMF0 = 0;
amf.AMF3 = 3;
// AMF0 markers
amf.AMF0_NUMBER = 0;
amf.AMF0_BOOLEAN = 1;
amf.AMF0_STRING = 2;
amf.AMF0_OBJECT = 3;
amf.AMF0_MOVIECLIP = 4;
amf.AMF0_NULL = 5;
amf.AMF0_UNDEFINED = 6;
amf.AMF0_REFERENCE = 7;
amf.AMF0_ECMA_ARRAY = 8;
amf.AMF0_OBJECT_END = 9;
amf.AMF0_STRICT_ARRAY = 0x0A;
amf.AMF0_DATE = 0x0B;
amf.AMF0_LONG_STRING = 0x0C;
amf.AMF0_UNSUPPORTED = 0x0D;
amf.AMF0_RECORDSET = 0x0E;
amf.AMF0_XML_DOC = 0x0F;
amf.AMF0_TYPED_OBJECT = 0x10;
amf.AMF0_AMV_PLUS = 0x11;
// AMF3 markers
amf.AMF3_UNDEFINED = 0;
amf.AMF3_NULL = 1;
amf.AMF3_FALSE = 2;
amf.AMF3_TRUE = 3;
amf.AMF3_INTEGER = 4;
amf.AMF3_DOUBLE = 5;
amf.AMF3_STRING = 6;
amf.AMF3_XML_DOC = 7;
amf.AMF3_DATE = 8;
amf.AMF3_ARRAY = 9;
amf.AMF3_OBJECT = 0x0A;
amf.AMF3_XML = 0x0B;
amf.AMF3_BYTE_ARRAY = 0x0C;