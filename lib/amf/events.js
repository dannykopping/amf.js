(function(namespace) {
  "use strict";

  function EventManager() { };
  Object.defineProperties(EventManager.prototype, {
    _eventTypes: {
      value: { Event: Event }
    },
    createEvent: {
      enumerable: true,
      value: function(type) {
        var c = this._eventTypes[type];
        if (!c) {
          throw new Error(type);
        }
        return new c();
      }
    },
    registerEventType: {
      value: function(name, proto) {
        var c = function() {};
        c.prototype = Object.create(Event.prototype, proto);
        this._eventTypes[name] = c;
      }
    },
    _addEventListener: {
      value: function(node, type, listener, useCapture) {
        if (!type || !listener) {
          return;
        }

        this._removeEventListener(node, type, listener, useCapture);

        this._getEventListeners(node).push(
          [type, listener, useCapture]);
      }
    },
    _removeEventListener: {
      value: function(node, type, listener, useCapture) {
        if (!type || !listener) {
          return;
        }

        var listeners = this._getEventListeners(node);
        for (var i = listeners.length - 1; i >= 0; --i) {
          var l = listeners[i];
          if (l[2] == useCapture && l[1] == listener && l[0] == type) {
            delete listeners[i];
            break;
          }
        }
      }
    },
    _dispatchEvent: {
      value: function(node, event) {
        if (!event._initialized || !event.type) {
          throw Error();
        }

        event._target = node;
        event._stopPropagation = false;
        event._preventDefault = false;

        var pv = (function() {
          var r = [];
          var p = node;
          var n = p._parent;
          while (n) {
            r.push(n);
            p = n;
            n = p._parent;
          }
          return r;
        })();

        // CAPTURING_PHASE
        event._eventPhase = Event.prototype.CAPTURING_PHASE;
        for (var i = pv.length - 1; i >= 0; --i) {
          if (event._stopPropagation) {
            break;
          }

          var nn = pv[i];
          event._currentTarget = nn;

          this._getEventListeners(nn).slice().forEach(function(le) {
            if (le[2] && le[0] == event.type) {
              this._handleEvent(le[1], event);
            }
          }, this);
        }

        // AT_TARGET
        event._eventPhase = Event.prototype.AT_TARGET;
        event._currentTarget = node;
        if (!event._stopPropagation) {
          this._getEventListeners(node).slice().forEach(function(le) {
            if (!le[2] && le[0] == event.type) {
              this._handleEvent(le[1], event);
            }
          }, this);
        }

        // BUBBLING_PHASE
        if (event.bubbles) {
          event._eventPhase = Event.prototype.BUBBLING_PHASE;
          for (var i = pv.length - 1; i >= 0; --i) {
            if (event._stopPropagation) {
              break;
            }

            var nn = pv[i];
            event._currentTarget = nn;

            this._getEventListeners(nn).slice().forEach(function(le) {
              if (!le[2] && le[0] == event.type) {
                this._handleEvent(le[1], event);
              }
            }, this);
          }
        }
        return event._preventDefault;
      }
    },
    _getEventListeners: {
      value: function(node) {
        if (!node.hasOwnProperty("_eventListeners")) {
          Object.defineProperty(node, "_eventListeners", {
            value: []
          });
        }
        return node._eventListeners;
      }
    },
    _handleEvent: {
      value: function(listener, event) {
        try {
          if (!listener.handleEvent) {
            listener.call(null, event);
          } else {
            listener.handleEvent.call(listener, event);
          }
        } catch (e) {
          // ignore
          if (console) {
            console.error(e);
          }
        }
      }
    }
  });



  function Event() { };
  Object.defineProperties(Event.prototype, {
    CAPTURING_PHASE: { value: 1, enumerable: true },
    AT_TARGET: { value: 2, enumerable: true },
    BUBBLING_PHASE: { value: 3, enumerable: true },

    type: {
      enumerable: true,
      get: function() {
        return this._type;
      }
    },
    target: {
      enumerable: true,
      get: function() {
        return this._target;
      }
    },
    currentTarget: {
      enumerable: true,
      get: function() {
        return this._currentTarget;
      }
    },
    eventPhase: {
      enumerable: true,
      get: function() {
        return this._eventPhase;
      }
    },
    bubbles: {
      enumerable: true,
      get: function() {
        return this._bubbles;
      }
    },
    cancelable: {
      enumerable: true,
      get: function() {
        return this._cancelable;
      }
    },
    timeStamp: {
      enumerable: true,
      get: function() {
        return this._timeStamp;
      }
    },

    stopPropagation: {
      enumerable: true,
      value: function() {
        this._stopPropagation = true;
      }
    },
    preventDefault: {
      enumerable: true,
      value: function() {
        this._preventDefault = true;
      }
    },
    initEvent: {
      enumerable: true,
      value: function(eventTypeArg, canBubbleArg, cancelableArg) {
        Object.defineProperties(this, {
          _initialized: { value: true },
          _type: { value: eventTypeArg },
          _bubbles: { value: Boolean(canBubbleArg) },
          _cancelable: { value: Boolean(cancelableArg) },
          _timestamp: { value: Date.now() },
          _target: { writable: true },
          _currentTarget: { writable: true },
          _stopPropagation: { writable: true },
          _preventDefault: { writable: true },
          _eventPhase: { writable: true }
        });
      }
    }
  });



  function EventTarget(manager, parent) {
    Object.defineProperties(this, {
      _manager: {
        value: manager
      },
      _parent: {
        value: parent
      }
    });
  };
  Object.defineProperties(EventTarget.prototype, {
    addEventListener: {
      enumerable: true,
      value: function(type, listener, useCapture) {
        this._manager._addEventListener(this, type, listener, useCapture);
      }
    },
    removeEventListener: {
      enumerable: true,
      value: function(type, listener, useCapture) {
        this._manager._removeEventListener(this, type, listener, useCapture);
      }
    },
    dispatchEvent: {
      enumerable: true,
      value: function(evt) {
        return this._manager._dispatchEvent(this, evt);
      }
    }
  });



  Object.defineProperties(namespace, {
    EventManager: { value: EventManager },
    EventTarget: { value: EventTarget }
  });

})(this.amf);