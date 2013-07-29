(function(namespace) {
  "use strict";
  var _numInstances = 0;

  var objects = Object.create(Object.prototype, {
    identity: {
      value: function(object) {
        if (!(self instanceof Object)) {
          throw new TypeError(typeof(self));
        }

        if (!self.hasOwnProperty("__$identity__")) {
          Object.defineProperty(self, "__$identity__", {
            value: _numInstances++,
            configurable: true
          });
        }
        return self.__$identity__;
      }
    },

    equals: {
      value: function(self, other) {
        self = Object(self);
        other = Object(other);
        var f = self["__eq__"];
        if (f && typeof(f) == "function") {
          return Boolean(f.call(self, other));
        }
        return objects.identity(self) === objects.identity(other);
      }
    },

    hashCode: {
      value: function(self) {
        self = Object(self);
        var f = self["__hash__"];
        if (f && typeof(f) == "function") {
          return Number(f.call(self));
        }
        return objects.identity(self);
      }
    }

  });

  Object.defineProperties(String.prototype, {
    __eq__: {
      value: function(o) {
        return (o instanceof String) && this.valueOf() == o.valueOf();
      }
    },

    __hash__: {
      value: function() {
        function mapper(x) {
          return x.charCodeAt(0);
        }
        function reducer(p, c) {
          return ((p * 31) + c) & 0xFFFFFFFF;
        }
        return Array.prototype.map.call(this, mapper).reduce(reducer, 0);
      }
    }
  });

  Object.defineProperty(namespace, "_objects", { value: objects });

})(this.amf);