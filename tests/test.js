var guy = {name: 'Danny'};
var bro = {name: 'Brad'};
var siblings = [guy, bro];
guy.siblings = siblings;

var tests = [
  // strings
  ['empty string', ''],
  ['ascii string', 'Hello World'],
  ['unicode string', '£今\u4ECA"\u65E5日'],
  // numbers
  ['zero', 0 ],
  ['integer in 1 byte u29 range', 0x7F ],
  ['integer in 2 byte u29 range', 0x00003FFF ],
  ['integer in 3 byte u29 range', 0x001FFFFF ],
  ['integer in 4 byte u29 range', 0x1FFFFFFF ],
  ['large integer', 4294967296 ],
  ['large negative integer', -4294967296 ],
  ['small negative integer', -1 ],
  ['medium negative integer', -1956 ],
  ['small floating point', 0.123456789 ],
  ['small negative floating point', -0.987654321 ],
  ['Number.MIN_VALUE', Number.MIN_VALUE ],
  ['Number.MAX_VALUE', Number.MAX_VALUE ],
  ['Number.NaN', Number.NaN],
  // other scalars
  ['Boolean false', false],
  ['Boolean true', true ],
  ['undefined', undefined ],
  ['null', null],
  // Arrays
  ['empty array', [] ],
  ['sparse array', [undefined, undefined, undefined, undefined, undefined, undefined] ],
  ['multi-dimensional array', [
    [
      [],
      []
    ],
    []
  ] ],
  // special objects
  ['date object (epoch)', new Date(0) ],
  ['date object (now)', new Date() ],
  // plain objects
  ['empty object', {} ],
  ['keyed object', { foo: 'bar', 'foo bar': 'baz' } ],
  ['circular object', guy ]
];

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