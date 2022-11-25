var Roslin = {};

// internal: make a surface from a canvas DOM element
Roslin.mksf = function (canvas) {
    var surface = {};
    surface.canvas = canvas;
    if (canvas.getContext) {
        surface.context = canvas.getContext('2d');
        return surface;
    } else {
        throw new Error("Either <canvas>.getContext is not supported, or provided element not a canvas");
    }
};

Roslin.assemble_into = function (assembly, scene) {

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
            self.D = function (/* forest, */ instance, surface, w, h) {
                var self = this;
                if (self.f !== null) {
                    surface.context.fillStyle = self.f;
                    surface.context.fillRect(0, 0, w, h);
                }
                if (self.s !== null) {
                    surface.context.strokeStyle = self.s;
                    surface.context.strokeRect(0, 0, w, h);
                }
            }.bind(self);
        }
        // TODO: more shapes
        return self;
    };

    var assemble_draw_compound = function (arr, root) {
        var self = {};
        self.c = [];
        for (var k = 0; k < arr.length; k++) {
            self.c[k] = assemble_draw(arr[k], root);
        }
        self.D = function (instance, surface, w, h) {
            var self = this;
            var c = self.c;
            var n = c.length;
            for (var k = 0; k < n; k++) {
                c[k].D(instance, surface, w, h);
            }
        }.bind(self);
        return self;
    };

    var assemble_draw = function (item, root) {
        if ('shape' in item) {
            return assemble_draw_shape(item['shape']);
        }
        if ('asset' in item) {
            var asset_id = item['asset'];
            if (asset_id in root.draw) {
                return root.draw[asset_id];
            }
            // TODO: return a default 'invalid texture'
        }
        if ('compound' in item) {
            return assemble_draw_compound(item['compound'], root);
        }
        return null;
    };

    var assemble_transform = function (item, card, root) {
        if ('matrix' in item) {

        } else if ('aabb' in item) {

        } else {
            return null;
        }
    };

    assembly.imgc = {};
    assembly.imgw = 0;
    assembly.imgl = 0;
    assembly.draw = {};

    var is_image = function (url) {
        if (url.endsWith('.png')) return true;
        if (url.endsWith('.jpg')) return true;
        if (url.endsWith('.svg')) return true;
        return false;
    };

    if (!('on_progress' in assembly)) {
        assembly.on_progress = function(completed, total, done) {
        };
    }

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
            assembly.draw[asset_id] = {
                D: function (instance, surface, w, h) {
                    surface.context.drawImage(this, 0, 0, w, h);
                }.bind(img)
            };
        }
    }
    // TODO: define an async function to wait for the images to load

    assembly.root = scene['default'];
    for (var card_id in scene.forest) {
        var card = scene.forest[card_id];
        var made = {};
        made.d_x = card.x;
        made.d_y = card.y;
        var items = card.items;
        var n = items.length;
        made._update = [];
        made._draw = [];
        for (var k = 0; k < n; k++) {
            var item = items[k];
            var transform = assemble_transform(item, made, assembly);
            var draw = assemble_draw(item, assembly);
        }
        made.update = function (instance, globals) {

        };
        made.draw = function (surface, instance) {

        };
    }
    return assembly;
};

// 







function roslin_demo_setup(canvas) {
    // create a surface
    var surf = Roslin.mksf(canvas);
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
    compiled.on_progress = function(x, n, finished) {
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