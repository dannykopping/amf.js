(function(namespace) {
  "use strict";

  function TraitsInfo(className, dynamic, externalizable, properties) {
    Object.defineProperties(this, {
      className: { value: className },
      dynamic: { value: dynamic },
      externalizable: { value: externalizable },
      properties: { value: properties }
    });
  }
  Object.defineProperties(TraitsInfo.prototype, {
    length: {
      get: function() {
        return this.properties.length;
      }
    },
    __eq__: {
      value: function(obj) {
        if (this.className != obj.className) {
          return false;
        } else if (this.dynamic != obj.dynamic) {
          return false;
        } else {
          if (this.length != obj.length) {
            return false;
          }
          var len = this.length;
          for (var i=0; i<len; i++) {
            if (this.properties[i] != obj.properties[i]) {
              return false;
            }
          }
          return true;
        }
      }
    },
    __hash__: {
      value: function() {
        var c = namespace._objects.hashCode(this.className);
        c = this.dynamic? c << 2: c << 1;
        c = c | (this.length << 24);
        return c;
      }
    }
  });

  Object.defineProperty(namespace, "_TraitsInfo", {
    value: TraitsInfo
  });
})(this.amf);