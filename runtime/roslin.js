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










function roslin_demo_setup(canvas) {
    // create a surface
    var surf = Roslin.mksf(canvas);
    // create an email forest
    var example = {
        assets : {

        },
        forest : {
            demo_card : {

            }
        },
        'default' : 'demo_card'
    };
    var viewstate = new AdamaTree();
    var data = new AdamaTree();

    surf.context.strokeStyle = 'red';
    surf.context.strokeRect(10, 10, 100, 100);
}