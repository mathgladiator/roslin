var Roslin = {};
(function () {
    // make a identity matrix
    var make_identity = function () {
        return {
            a: 1.0,
            b: 0.0,
            c: 0.0,
            d: 1.0,
            e: 0.0,
            f: 0.0
        }
    };
    // multiply the given matrices
    var compose_matrix = function (x, y) {
        return {
            f: x.b * y.e + x.d * y.f + x.f,
            e: x.a * y.e + x.c * y.f + x.e,
            d: x.b * y.c + x.d * y.d,
            c: x.a * y.c + x.c * y.d,
            b: x.b * y.a + x.d * y.b,
            a: x.a * y.a + x.c * y.b
        }
    };
    // is the given url an image
    var is_image = function (url) {
        if (url.endsWith('.png')) return true;
        if (url.endsWith('.jpg')) return true;
        if (url.endsWith('.svg')) return true;
        return false;
    };
    // transcribe tracking lines from the design space into the real space
    var transcribe_tracking_lines = function(arr, real) {
        var result = [];
        var n = arr.length;
        var design = arr[n - 1];
        for (var k = 0; k < n; k++) {
            var cand = arr[k];
            var typ = '%';
            if (typeof(cand) == 'object') {
                typ = cand.t;
                cand = cand.v;
            }
            if (typ == '%') {
                cand = (cand / design) * real
            }
            result.push(cand);
        }
        return result;
    };

    // export: make a surface from a canvas DOM element
    Roslin.mksf = function (canvas) {
        var surface = {};
        surface.canvas = canvas;
        if (canvas.getContext) {
            surface.ctx = canvas.getContext('2d');
            surface.w = canvas.width;
            surface.h = canvas.height;
            surface.transform = make_identity();
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
            assembly.draw = function(surface) {
                
            };
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


        var attach = function(state, expression, obj, variable) {
            if (typeof(expression) == "string") {
                obj[variable] = expression;
            }
            if (typeof(expression) == "object") {
                if ('p' in expression) {
                    // TODO: create a new state travelling up the parent's state
                    return;
                }
                if ('r' in expression) {
                    // TODO: create a new state going to the root's state
                    return;
                }
                if ('d' in expression) {
                    // TODO: create a new state diving into a child object's state
                    return;
                }
                if ('l' in expression) {
                    // subscribe
                }
                if ('c' in expression) {
                    // concat
                }
            }
        }





        var assemble_draw_box = function (parameters) {
            var self = {};
            self.s = pull(parameters, ['stroke', 's']);
            self.f = pull(parameters, ['fill', 'f']);
            self.bind = function (state) { };
            self.unbind = function (state) { };
            self.draw = function (surface) {
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
        };

        var assemble_draw = function (item) {
            /*
            if ('asset' in item) {
                var asset_id = item['asset'];
                if (asset_id in assembly.draw) {
                    return assembly.draw[asset_id];
                }
            }
            */
            if ('box' in item) {
                return assemble_draw_box(item['box']);
            }
            // TODO: render an invalid draw command, issue a warning?
            // return function (surface) { };
            return null;
        };

        var assemble_transform = function (item) {
            if ('matrix' in item) {
                return {
                    before: function (surface, instance) {

                    },
                    after: function (surface, instance) {

                    }
                };
            } else if ('aabb' in item) {
                return {
                    before: function (surface, instance) {

                    },
                    after: function (surface, instance) {

                    }
                };
            } else {
                return null;
            }
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
                factory.base[k] = base;
                base.idx = k;
                base.par = factory;
                base.t = assemble_transform(item, made);
                base.d = assemble_draw(item);
            }
            // TODO: order the update functions to minimize churn
            factory.create = function (state) {
                var instance = {};
                instance.factory = this;
                instance.items = [];
                for (var k = 0; k < this.items.length; k++) {
                    instance.items[k] = {};
                };
                instance.draw = function (surface) {
                    instance.x = transcribe_tracking_lines(this.factory.x, surface.w);
                    instance.y = transcribe_tracking_lines(this.factory.y, surface.h);
                    var n = this.items.length;
                    for (var k = 0; k < n; k++) {
                        var item_instance = this.items[n];
                        var item_base = this.factory.base[k];
                        // base.t(surface);
                        // base.d(surface, item_instance);
                    }

                    // for each item
                }.bind(instance);

                instance.release = function() {

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
                            box: {
                                'stroke': '#000',
                                'fill': '#fff'
                            },
                            aabb: {
                                l: [0, 45],
                                r: [0, 145],
                                t: [0, 25],
                                b: [0, 124]
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
})();