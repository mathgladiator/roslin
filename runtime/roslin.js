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

/* helper: Pull a field from an object using multiple field names
 * 
 * Since roslin is going to operate on "output" of some WYSIWYG tools,
 * we want to have a machine generated version that is leaner on size
 * while enabling humans to understand the tree. We also don't want to
 * deal with undefined and rather bias towards using null.
*/
var pull = function(parameters, fields) {
  for (var k = 0; k < fields.length; k++) { // for each field
    var f = fields[k];
    if (f in parameters) { // if the field is in the object, then use it
        return parameters[f];
    }
  }
  return null; // otherwise, use null
}

var assemble_draw_shape = function(parameters) {
    var self = {};
    self.s = pull(parameters, ['stroke', 's']);
    self.f = pull(parameters, ['fill', 'f']);
    var shape = pull(parameters, ['shape', 'h']);
    if (shape == 'box') {
        self.D = function(ctx, w, h) {
            var self = this;
            if (self.f !== null) {
                ctx.fillStyle = self.f;
                ctx.fillRect(0, 0, w, h);
            }
            if (self.s !== null) {
                ctx.strokeStyle = self.s;
                ctx.strokeRect(0, 0, w, h);
            }
        }.bind(self);
    }
    // TODO: more shapes
    return self;
};

var assemble_draw = function(item) {
    if ('shape' in item) {
        return assemble_draw_shape(item['shape']);
    }
    if ('compound' in item) {
        return assemble_draw_compound(item['compound']);
    }
    return null;
}

var assemble_draw_compound = function(arr) {
  var self = {};
  self.c = [];
  for (var k = 0; k < arr.length; k++) {
    self.c[k] = assemble_draw(arr[k]);
  }
  self.D = function(context, w, h) {
    var self = this;
    var c = self.c;
    var n = c.length;
    for (var k = 0; k < n; k++) {
        c[k].D(context, w, h);
    }
  }.bind(self);
  
}

// 







function roslin_demo_setup(canvas) {
    // create a surface
    var surf = Roslin.mksf(canvas);
    // create an email forest
    var example = {
        assets : {
            sample: { type: 'image', url: 'TODO' }
        },
        forest : {
            demo_card : {
                x : [0, 400],
                y : [0, 300],
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
                            anchor: {left:0, right:1, top:0, bottom: 1}
                        }
                    }
                ]
            }
        },
        'default' : 'demo_card'
    };
    var viewstate = new AdamaTree();
    var data = new AdamaTree();

    var test1 = assemble_draw({shape:{
        'shape': 'box',
        'stroke': 'red',
        'fill': '#00fc'
    }});

    test1.D(surf.context, 50, 50);

    surf.context.strokeStyle = 'red';
    surf.context.strokeRect(10, 10, 100, 100);
}