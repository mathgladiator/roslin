# Roslin Specification

**SUPER DRAFT: spelling nor grammar consults, 100% human**

This document outlines the specification for [roslin](https://github.com/mathgladiator/roslin) which is a reactive runtime for board games. Roslin is designed as a UX mirror to [Adama](https://github.com/mathgladiator/adama-lang), and the expectation is that Roslin + Adama = a game.

**About the name:** [roslin](https://en.wikipedia.org/wiki/Laura_Roslin) is derived from [Battlestar Galatica](https://www.imdb.com/title/tt0407362/) which is how the author and his wife named their goats.

## Goals &amp; Requirements

* Provide a fantastic user experience for board game players on multiple devices (tv, [gameboard](https://lastgameboard.com/), phone, tablet)
* Serve as a mostly-logic-free template engine to turn a streaming-JSON object into an interactive image.
* Small footprint and lean implementation for low-end devices and battery friendly execution
* The format should be easily edited by humans and tools

## Non-goals

This runtime should extend beyond board games, but this is the path towards madness. The initial version should be 100% focused on board games and the challenges presented by them. Focus!

Furthermore, the runtime should adapt into non-2D surfaces like VR/AR, but this is beyond this document’s scope.

# Format

Roslin is plain-ole JSON structured under a schema that we will describe as this document unfolds.

## Top level

The root object has many fields: assets, search, forest, default, channels, and more. These root fields will be defined throughout the document.

## Assets

The root field "assets" is an object providing a mapping of names (i.e. asset ids) to assets which the system can pre-load. An asset is an object with a required "url" string field, and "url" represents a file like an image, movie, svg, audio, nine-path image, etc. The "url" identifies the location of the asset's resource and may point to an online resource via HTTP or a local resource (using relative pathing). For convenience, an optional top level field called "search" provides an array to provide the runtime a path to search for the resources. The "url" must contain an extension to indicate the nature (image, animation, movie, audio) of the resource.

Beyond mapping asset ids to files, the asset object is an opportunity to provide parameters on how that particular asset is to be used. For example, a nine-patch image requires four integer values as to how to slice the image up to scale. Similarly, a set of assets may share a file with different parameters so tile-maps and an image atlas may be used.

### 'assets' example

```js
{
    "search": ["https://mydomain.com"]
    "assets" : {
        "my-card-back": {
            "url":"cardback-01.png"
        }
    }
}
```

## Forest

Roslin uses an [l-system](https://en.wikipedia.org/wiki/L-system) inspired approach where you have a forest of cards. Cards are simply functions that turn JSON into a scalable image. The root field "forest" is an object mapping names (i.e. card ids) to cards. A card is an object with parameters and instructions on how to pull data from JSON, draw it, and map any feedback. 

First, a card has a "x" and "y" boundaries which are in pixel units; boundaries will be explained in [the below section in layout](#layout-engine), but both x and y are arrays where the final element is width and height, respectively.

Second, the card also has a field called "items" which is a array of items. An item is an object which is a dynamically typed object that is determined on the fly.

An item fundamentally uses ideas inspired from [entity component systems](https://en.wikipedia.org/wiki/Entity_component_system) where there are no direct types of items. Instead, the behavior is the composition of fields within an item.

For example, an item may have a field called 'shape' will which indicate the item will render a shape. The 'shape' object has at least three parameters: "shape", "stroke", "fill" which sit inside the object. More details can be found in the later sections, but we will set "shape" to "box" to render a box with stroke set to "#000" and fill set to "#fff". This will render a white box with a black border.

An item may also have a field called matrix which will define how to position and size the box. The defaults of this will be outlined in the [layout engine](#layout-engine) section.

We give this card the name "simple-white-box", and then use the top-level field "default" to set this card as the root card.

### minimal 'forest' example

```js
{
    "forest": {
        "simple-white-box": {
            "x": [0, 400],
            "y": [0, 300],
            "items": [
                {
                    "shape": {
                        "shape": "box",
                        "stroke": "#000",
                        "fill": "#fff"
                    },
                    "matrix": { ... }
                }
            ]
        }
    },
    "default":"simple-white-box"
}
```

This minimal example will render a white box. This sets the stage for more details.

* How are items positioned? [see layout engine](#layout-engine)
* How are items drawn? [see item drawing](#item-drawing)
* How we handle multiplicity (i.e. multiple dynamic objects)? [see containers](#containers) 


## Layout engine

Fundamentally, the items with a card use a box model which begs the question of how the box is defined.

### The card's size, growth, and tracking lines

A card is a box that has been cut up via tracking lines. For example, the minimal example had:

```js
  "x": [0, 400],
  "y": [0, 300],
```

which indicates the card is cut by x=0, x=400 and y=0, y=300. These numbers are fixed within the design space. When a card is actually drawn, it may be drawn in a larger container (but never smaller). The design space allows items to be transformed into the larger container, and the tracking lines define a coordinate system for that transformation.

For example, instead of thinking of (x, y) from the (left, top) corner of the card. We aim to think ([0, x], [0, y]) to track the offset (x, y) from the 0'th (i.e left) x-tracking line and 0'th (i.e. top) y-tracking line. For example, this allows us to track the right border of a card via ([1, -17], [0, 10]) represents the point from the right-top corner down. Should the right border move, this point will move with it.

Since the tracking lines are arrays, this implies that a card may have multiple tracking lines. A tracking line is either fixed-offset or relative-offset. By default, all values are relative-offset. We denote a fixed offset by changing the number into an object of the form

```js
  "x": [0, {"v":50,"mode":"fixed"}, 400],
  "y": [0, 300],
```

The x=50 line is fixed which means that as the card is resized, nothing happens between (0, 50) on the x axis. By contrast, a relative offset (the default)

```js
  "x": [0, 200, 400],
  "y": [0, 300],
```

Would be stretched with the card. If the card is in an environment that is 1000 pixels wide, then the right design line of x=400 is transformed into x'=1000 while the design line of x=200 becomes x'=500.

Besides a card rendering in a larger space, items may grow which extend the size of the card as well. For example, this allows for cards to have scrollable text. This means the tracking lines are used to determine how items grow. The sequence of events for rendering are: (1) seed the sizes from the design space, (2) stretch the design space into the rendering space, (3) grow the rendering space for each item.

The order in which items grow the card's rendering is important to consider as changing the tracking lines change may change the dimensions of a previous item sizes. For example, suppose we have a container that lists square boxes from top to bottom and left to right. The height of this container depends on the width of the container, and if another item changes the width then the height changes.

*hard problem inbound, need to figure out how to prove this*
This creates a topological ordering, and we seek to topologically sort the items during sizing to eliminate back-tracking. This requires an item to fit one of three categorizations: does not expand, expands horizontally, expands vertically.



### matrix

A 'matrix' layout is limited in many ways. A matrix based layout is unable to push the tracking lines, scale non-uniformaly. However, the matrix layout can rotate. We start with an example:

```js
{
    'matrix': {
        a: 1.0,
        b: 0.0,
        c: 0.0,
        d: 1.0,
        e: 10.0, // x
        f: 17.0, // y
        track: [0, 0],
        w: 40,
        h: 30,
        scale: [0, 0],
    }
}
```

The homogeneous transformation matrix is defined via:

| a | c | e |
| b | d | f |
| 0 | 0 | 1 |

The width and height are defined via (w, h). The track field is responsible for defining the origin in terms of the tracking lines.

Resizing a matrix is tricky... *TODO*

### aabb

The 'aabb' mode is more interesting whilst eliminating rotation. We start with an example:

```js
{
    'aabb': {
        left: [0, 10],
        top: [0, 17],
        width: 100,
        height: 150,
    }
}
```

Here, the layout is to associate the box's edged with the tracking lines. In this example, we track the left and top edges to (10, 17) with a dimensions of (100, 150). This is the easiest mode to understand.

## Item drawing

## Containers


