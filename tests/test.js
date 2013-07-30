//
var tape = require('tape');

//
var classExt = require('../lib/class.js');
var sample = require('./sample-data.js');
var lib = require('../lib/amf.js');
lib.HashMap = require('../vendor/hashmap/hashmap.js').HashMap;
console.log(lib);
return;

var inspect = require('inspect');

var roundtrip = function (data) {
  var serialized = serialize(data);
  var deserialized = deserialize(serialized);

  console.log("Before", inspect(data));
  console.log("After", inspect(deserialized));

  return inspect(deserialized) === inspect(data);
};

var serialize = function (data) {
  var o = new lib.amf._BufferOutputStream();
  new lib.amf.AMF3Encoder(o, true).encode(data);

  var buf = new ArrayBuffer(o.size);
  o.writeTo(buf);
  return buf;
};

var deserialize = function (data) {
  var input = new lib.amf._BufferInputStream(data);

  var data = new lib.amf.AMF3Decoder(input).decode();
  return data;
};

for (var i = 0; i < sample.data.length; i++) (function (i) {
  var testData = sample.data[i];
  var description = testData[0];
  var value = testData[1];

//  test(description, function () {
//    console.log(i, description, value);

//    if(i == tests.length - 1) {
//    var s = serialize(value);
//      return;
//    }
  console.log(">>", value, serialize(value));
  return 1;
//    roundtrip(value);
//  });
})(i);