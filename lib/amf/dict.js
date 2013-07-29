(function(namespace) {
  "use strict";

  function _hash(h) {
    return h ^ (h >>> 20) ^ (h >>> 12) ^ (h >>> 7) ^ (h >>>4);
  }
  function _indexFor(h, len) {
    return h & (len - 1);
  }

  function Entry(hash, key, value, next) {
    Object.defineProperties(this, {
      hash: { value: hash },
      key: { value: key },
      value: { writable:true, value: value},
      next: { value: next }
    });
  }

  function Dict(/*capacity, loadFactor*/) {
    var _capacity = 16;
    var _loadFactor = 0.75;

    switch (arguments.length) {
      case 2:
        _loadFactor = arguments[1];
      case 1:
        _capacity = arguments[0];
    }

    Object.defineProperties(this, {
      _loadFactor: {
        value: _loadFactor
      },
      _capacity: {
        writable: true,
        value: _capacity
      },
      _size: {
        writable: true,
        value: 0
      },
      _table: {
        value: []
      },
      _map: {
        value: new HashMap()
      },
      _hash: {
        value: function(key) {
          switch (this._map.type(key)) {
            case 'undefined':
            case 'null':
            case 'boolean':
            case 'number':
            case 'regexp':
              return key + '';

            case 'date':
              return ':' + key.getTime();

            case 'string':
              return '"' + key;

            case 'object':
            default:
              if (!key._hmuid_) {
                key._hmuid_ = ++HashMap.uid;
                this.hide(key, '_hmuid_');
              }

              return '{' + key._hmuid_;
          }
        }
      },
      hide: {
        value: function(obj, prop) {
          // Make non iterable if supported
          if (Object.defineProperty) {
            Object.defineProperty(obj, prop, {enumerable:false});
          }
        }
      }
    });
  }
  Object.defineProperties(Dict.prototype, {
    size: {
      enumerable: true,
      get: function() {
        return this._map.count();
      }
    },
    get: {
      enumerable: true,
      value: function(key) {
//        var h = _hash(this._hashCode(key));
        var h = this._hash(key);

        var value = this._map.get(h);
        if(typeof value === 'undefined') {
          return null;
        }

        return value;
      }
    },
    put: {
      enumerable: true,
      value: function(key, value) {
        var h = this._hash(key);
        this._map.set(h, value);
        return null;
      }
    },
    iterate: {
      value: function(callback) {
        this._table.forEach(function(e) {
          var entry = e;
          while (entry) {
            callback(entry.key, entry.value);
            entry = entry.next;
          }
        })
      }
    },
    toString: {
      value: function() {
        var r = "{";
        this.iterate(function(key, value) {
          r += (key + "=" + value + ", ");
        });
        r += "}";
        return r;
      }
    },

    _hashCode: {
      value: namespace._objects.hashCode
    },
    _equals: {
      value: namespace._objects.equals
    }
  });

  function IdentityDict(/*capacity, loadFactor*/) {
    Dict.apply(this, Array.prototype.slice.call(arguments));
  }
  IdentityDict.prototype = Object.create(Dict.prototype, {
    _hashCode: {
      value: namespace._objects.identity
    },
    _equals: {
      value: function(a, b) {
        return a === b;
      }
    }
  });

  Object.defineProperties(namespace, {
    Dict: {
      value: Dict
    },
    IdentityDict: {
      value: IdentityDict
    }
  });

})(this.amf);