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