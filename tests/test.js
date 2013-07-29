for (var i = 0; i < tests.length; i++) (function (i) {
  var testData = tests[i];
  var description = testData[0];
  var value = testData[1];

  test(description, function () {
    console.log(i, description, value);

//    if(i == tests.length - 1) {
//    var s = serialize(value);
//      return;
//    }
    ok(roundtrip(value));
  });
})(i);

var roundtrip = function (data) {
  var serialized = serialize(data);
  var deserialized = deserialize(serialized);

  console.log("Before", inspect(data));
  console.log("After", inspect(deserialized));

  return inspect(deserialized) === inspect(data);
};

var serialize = function (data) {
  var o = new amf._BufferOutputStream();
  new amf.AMF3Encoder(o, true).encode(data);

  var buf = new ArrayBuffer(o.size);
  o.writeTo(buf);
  return buf;
};

var deserialize = function (data) {
  var input = new amf._BufferInputStream(data);

  var data = new amf.AMF3Decoder(input).decode();
  return data;
};