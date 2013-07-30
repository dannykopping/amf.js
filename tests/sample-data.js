;(function (exports) {
  exports = exports || this;

  var guy = {name: 'Danny'};
  var bro = {name: 'Brad'};
  var siblings = [guy, bro];
  guy.siblings = siblings;

  var StrictType = Class.extend({
    $alias: "com.flowsa.bob"
  });

  var typedObj = new StrictType();
  typedObj.data = {swearWord: "Mugabe"};

  var sample = [
    // strings
    ['empty string', ' '],
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
    ['Number.POSITIVE_INFINITY', Number.POSITIVE_INFINITY ],
    ['Number.NEGATIVE_INFINITY', Number.NEGATIVE_INFINITY ],
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
    ['circular object', guy ],
    ['class mapping', typedObj ]
  ];

// 512k string
  var rand = '';
  for (var i = 0; i < 1024 * 512; i++) {
    rand += String.fromCharCode(65);
  }

//  sample.push(['large string', rand]);
  if(exports) exports.data = sample;

  return sample;
})(exports || this);