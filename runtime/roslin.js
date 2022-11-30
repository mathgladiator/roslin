var Roslin = {};

// internal: make a surface from a canvas DOM element
Roslin.mksf = function (canvas) {
    var surface = {};
    surface.canvas = canvas;
    if (canvas.getContext) {
        surface.ctx = canvas.getContext('2d');
        surface.w = canvas.width;
        surface.h = canvas.height;
        // TODO: better DOM lookups for width and height
        return surface;
    } else {
        throw new Error("Either <canvas>.getContext is not supported, or provided element not a canvas");
    }
};

/*
  var get_connection_obj = function (name) {
    if (name in connections) {
      return connections[name];
    } else {
      var obj = {
        name: name,
        ptr: null,
        tree: new AdamaTree(),
        outstanding: {},
        decisions: {},
        choice_subs: {},
        resets: {},
        connection_events: {},
        id: 0,
        connection_state: false,
        choices: {},
      };
      obj.set_connected = function(cs) {
        if (this.connection_state == cs) {
          return;
        }
        this.connection_state = cs;
        var axe = [];
        for (var sub in obj.connection_events) {
          if (!(obj.connection_events[sub](cs))) {
            axe.push(sub);
          }
        }
        for (var k = 0; k < axe.length; k++) {
          delete obj.connection_events[axe[k]];
        }
      }.bind(obj);
      obj.connected = function(callback) {
        var s = "-|" + this.id++;
        this.connection_events[s] = callback;
        callback(this.connection_state);
        return function () {
          delete this.connection_events[s];
        }.bind(this);
      }.bind(obj);
      obj.subscribe_any = function(callback) {
        var s = "-|" + this.id++;
        this.decisions[s] = callback;
        return function () {
          delete this.decisions[s];
        }.bind(this);
      }.bind(obj);
      obj.subscribe = function (channel, callback) {
        var s = channel + "|" + this.id++;
        this.decisions[s] = callback;
        return function () {
          delete this.decisions[s];
        }.bind(this);
      }.bind(obj);
      obj.subscribe_reset = function(callback) {
        var dr = "reset|" + this.id++;
        this.resets[dr] = callback;
        return function () {
          delete this.resets[dr];
        }.bind(this);
      }.bind(obj);
      obj.subscribe_choice = function (channel, callback) {
        var s = channel + "|" + this.id++;
        this.choice_subs[s] = callback;
        return function () {
          delete this.choice_subs[s];
        }.bind(this);
      }.bind(obj);
      obj.onchoices = function(channel, choice) {
        var axe = [];
        for (var sub in obj.choice_subs) {
          if (sub.startsWith(channel + "|")) {
            if (!obj.choice_subs[sub](choice)) {
              axe.push(sub);
            }
          }
        }
        for (var k = 0; k < axe.length; k++) {
          delete obj.choice_subs[axe[k]];
        }
      };
      obj.ondecide = function (outstanding) {
        var axeReset = [];
        for (var dr in obj.resets) {
          var r = obj.resets[dr];
          if (!(r())) {
            axeReset.push(dr);
          }
        }
        for (var k = 0; k < axeReset.length; k++) {
          delete obj.resets[axeReset[k]];
        }
        for (var ch in obj.outstanding) {
          obj.outstanding[ch] = {options: []};
        }
        var n = outstanding.length;
        for (var k = 0; k < n; k++) {
          var o = outstanding[k];
          obj.outstanding[o.channel] = o;
        }
        for (var ch in obj.outstanding) {
          var out = obj.outstanding[ch];
          var axe = [];
          for (var sub in obj.decisions) {
            if (sub.startsWith(ch + "|") || sub.startsWith("-|")) {
              if (!obj.decisions[sub](out, ch)) {
                axe.push(sub);
              }
            }
          }
          for (var k = 0; k < axe.length; k++) {
            delete obj.decisions[axe[k]];
          }
        }
      };
      connections[name] = obj;
      return obj;
    }
  };


  var subscribe = function (state, name, sub) {
    var ss = self.pI(state, name);
    var s = ss[ss.current];
    if ("@e" in s.delta) {
      s.delta["@e"].push(sub);
    } else {
      s.delta["@e"] = [sub];
    }
  };

  var fresh = function (where) {
    return {
      tree: new AdamaTree(),
      delta: {},
      parent: null,
      path: null,
      where: where
    };
  };


  var root_of = function (ss) {
    var x = ss;
    while (x.parent != null) {
      x = x.parent;
    }
    return x;
  };

  var path_to = function (ss, obj) {
    if (ss.parent != null) {
      var parent = path_to(ss.parent, {});
      parent[ss.path] = obj;
      return parent;
    } else {
      return obj;
    }
  };

  var new_delta_copy = function (ss) {
    if (ss == null) {
      return null;
    }
    var parent = null;
    if (ss.parent != null) {
      parent = new_delta_copy(ss.parent);
    }
    var new_delta = {};
    if (parent != null) {
      parent.delta[ss.path] = new_delta;
    }
    return {tree: ss.tree, parent: parent, delta: new_delta, path: ss.path};
  };


 */

    /*
    var state = {
        service: null,
        data: {connection: co, tree: co.tree, delta: {}, parent: null, path: null},
        view: new_delta_copy(priorState.view),
        current: "data"
      };
      */


Roslin.fresh = function(connection) {

    return {};
}

Roslin.assemble_into = function (scene, assembly) {
    // Assemble into supports merging two scenes into the same assembly.
    // The first call of assemble_into will seed the parameters within the assembly.
    if (!('_first' in assembly)) {
        assembly._first = true;
        assembly.imgc = {};
        assembly.imgw = 0;
        assembly.imgl = 0;
        assembly.draw = {};
        assembly.make = {};
    }
    // events come from the outside
    if (!('on_progress' in assembly)) {
        assembly.on_progress = function (completed, total, done) { };
    }
    // assume a default root
    if ('default' in scene && !('root' in assembly)) {
        assembly.root = scene['default'];
    }

    /* helper: Pull a field from an object using multiple field names
     * 
     * Since roslin is going to operate on "output" of some WYSIWYG tools,
     * we want to have a machine generated version that is leaner on size
     * while enabling humans to understand the tree. We also don't want to
     * deal with undefined and rather bias towards using null.
    */
    var pull = function (parameters, fields) {
        for (var k = 0; k < fields.length; k++) { // for each field
            var f = fields[k];
            if (f in parameters) { // if the field is in the object, then use it
                return parameters[f];
            }
        }
        return null; // otherwise, use null
    };

    var assemble_draw_shape = function (parameters) {
        var self = {};
        self.s = pull(parameters, ['stroke', 's']);
        self.f = pull(parameters, ['fill', 'f']);
        var shape = pull(parameters, ['shape', 'h']);
        if (shape == 'box') {
            return function (surface) {
                var self = this;
                if (self.f !== null) {
                    surface.ctx.fillStyle = self.f;
                    surface.ctx.fillRect(0, 0, surface.w, surface.h);
                }
                if (self.s !== null) {
                    surface.ctx.strokeStyle = self.s;
                    surface.ctx.strokeRect(0, 0, surface.w, surface.h);
                }
            }.bind(self);
        }
        return function (surface) { };
    };

    var assemble_draw_compound = function (arr) {
        var self = {};
        self.c = [];
        for (var k = 0; k < arr.length; k++) {
            self.c[k] = assemble_draw(arr[k]);
        }
        return function (surface) {
            var self = this;
            var c = self.c;
            var n = c.length;
            for (var k = 0; k < n; k++) {
                c[k](surface);
            }
        }.bind(self);
    };

    var assemble_draw = function (item) {
        if ('asset' in item) {
            var asset_id = item['asset'];
            if (asset_id in assembly.draw) {
                return assembly.draw[asset_id];
            }
        }
        if ('shape' in item) {
            return assemble_draw_shape(item['shape']);
        }
        if ('compound' in item) {
            return assemble_draw_compound(item['compound']);
        }
        // TODO: render an invalid draw command, issue a warning?
        return function (surface) { };
    };



    var assemble_transform = function (item) {
        if ('matrix' in item) {
            return function(surface) {
            };
        } else if ('aabb' in item) {

        } else {
            return null;
        }
    };

    var is_image = function (url) {
        if (url.endsWith('.png')) return true;
        if (url.endsWith('.jpg')) return true;
        if (url.endsWith('.svg')) return true;
        return false;
    };

    // build the image cache and asset drawing functions
    for (var asset_id in scene.assets) {
        var asset_raw = scene.assets[asset_id];
        var url = asset_raw.url;
        // TODO: figure out search path here
        if (is_image(url)) {
            var exists = url in assembly.imgc;
            if (!exists) {
                var img = new Image();
                assembly.imgc[url] = img;
                assembly.imgw++;
                img.addEventListener('load', () => {
                    assembly.imgl++;
                    assembly.on_progress(assembly.imgl, assembly.imgw, assembly.imgw == assembly.imgl);
                });
                img.src = url;
                assembly.on_progress(assembly.imgl, assembly.imgw, assembly.imgw == assembly.imgl);
            }
            var img = assembly.imgc[url];
            // TODO: inspect parameters

            // Nothing special / normal image plot
            assembly.draw[asset_id] = function (surface) {
                surface.context.drawImage(this, 0, 0, surface.w, surface.h);
            }.bind(img);

        }
    }
    // TODO: define an async function to wait for the images to load

    for (var card_id in scene.forest) {
        var card = scene.forest[card_id];
        var factory = {};
        assembly.make[card_id] = factory;
        factory.d_x = card.x;
        factory.d_y = card.y;
        factory.base = [];
        var items = card.items;
        var n = items.length;
        for (var k = 0; k < n; k++) {
            var item = items[k];
            var base = {};
            base.idx = k;
            base.par = factory;
            factory.base[k] = base;
            base.t = assemble_transform(item, made);
            base.d = assemble_draw(item);
        }
        // TODO: order the update functions to minimize churn
        factory.create = function (state) {
            var self = this;
            var instance = {};
            instance.update = function(surface, dt) {
                var current = {};
                current.pri = surface.current;
                surface.cur = current;
                
            };
            instance.draw = function(surface) {

            };
        }.bind(factory);
    }

    return assembly;
};

// 







function roslin_demo_setup(canvas) {
    // create a surface
    var surface = Roslin.mksf(canvas);
    // create an email forest

    var example = {
        assets: {
            sample: {
                url: 'https://www.adama-platform.com/i/adama.png'
            },
            patch: {
                url: 'https://www.adama-platform.com/i/adama.png',
                patch: [16, 16, 16, 16]
            }
        },
        forest: {
            demo_card: {
                x: [0, 400],
                y: [0, 300],
                items: [
                    {
                        shape: {
                            'shape': 'box',
                            'stroke': '#000',
                            'fill': '#fff'
                        },
                        aabb: {
                            width: 100,
                            height: 100,
                            anchor: { left: 0, right: 1, top: 0, bottom: 1 }
                        }
                    }
                ]
            }
        },
        'default': 'demo_card'
    };
    var compiled = {};
    compiled.on_progress = function (x, n, finished) {
        console.log(x + "/" + n + "::" + finished);
    };
    Roslin.assemble_into(compiled, example);

    /*
    var viewstate = new AdamaTree();
    var data = new AdamaTree();

    var test1 = assemble_draw({
        shape: {
            'shape': 'box',
            'stroke': 'red',
            'fill': '#00fc'
        }
    });

    test1.D(surf.context, 50, 50);

    surf.context.strokeStyle = 'red';
    surf.context.strokeRect(10, 10, 100, 100);
    */
}