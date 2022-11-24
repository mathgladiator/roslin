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

There may be some interesting gaming experiences beyond board games, and those will be considered in good time. Regarding expanding beyond games, this is a hard non-goal as HTML and the web are a better fit.

Furthermore, the runtime should adapt into non-2D surfaces like VR/AR, but this is beyond this document’s scope.

# The critical game we are playing.

This design document is playing a game of how do I take data and turn it into an interactive image. This means there are several critical questions to answer. How to pick and select content to draw? How do I position and orientate that drawn content? How do make that content interactive? How do animate the drawn content? How do I make the content depend on data?

# Format

Roslin is plain-ole JSON structured under a schema that we will describe as this document unfolds.

## Top level

The roslin schema starts with a singular root object. The root object has many fields: assets, search, forest, default, channels, and more. These root fields will be defined throughout the document.

## Assets

The root field "assets" is an object providing a mapping of names (i.e. asset ids) to assets which the system can pre-load. An asset is an object with a required "url" string field, and "url" represents a file like an image, movie, svg, audio, nine-patch image, etc. The "url" identifies the location of the asset's resource and may point to an online resource via HTTP or a local resource (using relative pathing). For convenience, an optional top level field called "search" provides an array to provide the runtime a path to search for the resources. The "url" must contain an extension to indicate the nature (image, animation, movie, audio) of the resource.

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

First, a card has a "x" and "y" tracking lines which are in pixel units; tracking lines will be explained in [the below section in layout](#layout-engine), but both x and y are arrays where the final element is width and height, respectively. The below example has dimensions of 400 pixels by 300 pixels.

Second, the card also has a field called "items" which is a array of items. An item is an object which is a dynamically typed object that is determined on the fly.

An item fundamentally uses ideas inspired from [entity component systems](https://en.wikipedia.org/wiki/Entity_component_system) where there are no direct types of items. Instead, the behavior is the composition of fields within an item.

For example, an item may have a field called 'shape' will which indicate the item will render a shape. The 'shape' object has at least three parameters: "shape", "stroke", "fill" which sit inside the object. More details can be found in the later sections, but we will set "shape" to "box" to render a box with stroke set to "#000" and fill set to "#fff". This will render a white box with a black border.

An item may also have a field called 'matrix' which will define how to position and size the box. The defaults of this will be outlined in the [layout engine](#layout-engine) section.

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
* How do we handle data binding? [see data binding](#data-binding)
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

For example, instead of thinking of (x, y) from the (left, top) corner of the card. We aim to think ([0, x], [0, y]) to track the offset (x, y) from the 0'th (i.e left) x-tracking line and 0'th (i.e. top) y-tracking line. For example, this allows us to track the right border of a card via ([1, -17], [0, 10]) represents the point from the right-top corner down. Should the right tracking line move, this point will move with it.

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

Besides a card rendering in a larger space, items may grow which extend the size of the card as well. For example, this allows for cards to have scrollable text. This means the tracking lines are used to determine how items grow. The sequence of events for rendering are: (1) seed the sizes from the design space, (2) stretch the design space into the rendering space, (3) grow the rendering space for each item by adjusting the tracking lines.

The order in which items grow the card's rendering is important to consider as changing the tracking lines change may change the dimensions of a previous item sizes. Resizing and dependency tracking will discussed in [aabb](#aabb). For now, the key is that an item and card negotiate the item's size and the coordinate system as defined by tracking lines.

At hand, there are two ways for an item to size and position themselves. The simple case is a ['matrix'](#matrix) while the more interesting case is ['aabb'](#aabb).

### matrix

A 'matrix' layout is a limited way to size and position an item, but it is also the simplest and supports rotation. This layout algorithm is unable to influence tracking lines, and is primarily meant as a way to rotate perspectives or place doodads. We start with an example:

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
        scale: [[0, 0], [1,1],
    }
}
```

The homogeneous transformation matrix is defined via:
| row\col | col 1 | col 2 | col 3 |
| --- | --- | --- | --- |
| row 1 | a | c | e |
| row 2 | b | d | f |
| row 3 | 0 | 0 | 1 |

The width and height are defined via (w, h). The track field is responsible for defining the origin in terms of the tracking line coordinate system. Here, the origin is defined as the top left most point (x=0 and y=0).

Resizing is done via the scale parameter which defines a box using tracking line coordinates to monitor. A value of *null* would indicate no resizing available. In the example, the box defined by the left-top coordinate (x=0, y=0) and right-bottom coordinate (x=400,y=300). This means that if the width and height will resize uniformly to preserve aspect ratio of the item. For example, if the render size is (600, 400) then the ratio used = min(600/400, 400/300) = 1.3.

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

Here, the layout will associate the box's edges with the tracking lines. In this example, we track the left and top edges to (10, 17) with a dimensions of (100, 150). This is the easiest mode to understand. 'aabb' can also track both left and right. For example, 

```js
{
    'aabb': {
        left: [0, 10],
        top: [0, 17],
        right: [1, -10],
        height: 150,
    }
}
```

Here, the width is determined by maintaining a fixed distance between the x=0 and x=400 lines. This allows a great deal of options in anchoring items within and across tracking lines. This mirrors and old school anchoring where tracking lines replace edges.

Since the 'aabb' is axis aligned with the card, the 'aabb' mode can also resize the hosting card by pushing the right and bottom tracking lines out accordingly. There are 'horizontal' and 'vertical' fields with values: 'clip', 'scroll', 'expand'. For 'clip' and 'scroll', the item's size does not influence the associated right or bottom tracking lines. When the value is 'expand', the line will be pushed such that the size is increased to fit the content.

This begs a question of how items will expand, and we first must talk about [data binding](#data-binding) and [containers](#containers). Regardless of how the items expand, the ability to items to expand the parent create a topological dependency tracking problem.

#### Dependency tracking

Suppose we have a container that lists square boxes from top to bottom and left to right. The height of this container depends on the width of the container, and if another item changes the width then the height changes.

We start with the hard rule that tracking lines only monotonically expand as this ensures everything will fit eventually, and our goal is to order the items to be sized such that need to back-track and recompute previous sized items is minimized. For example, if the last item resizes the entire card and the first few items depended on the width of the card then they require their sizes to be computed again.

Thus, we need to topologically sort the items by their dependencies. We can think about several associations between items and tracking lines.

* Read(itemId, x|y, trackingLineId)
* Write(itemId, x|y, trackingLineId)
* Free(itemId, x|y)

And then we need to order these associates such that Write happen before Read, and Free can happen anywhere because they cost nothing. The axis which the associates operate are independent which means cycles can happen.

For example, an item may read x and write y while another item may write x and read y; these cycles are why the tracking line must only expand out so writes become idempotent. Since cycles exist, we must therefore backtrack when we detect a change which is why the writes must occur first.

## Data binding

The roslin document sits as a stateless function with two sources of data available: view state and server state. The view state is ephemeral and includes things like 'currently selected tab' and 'scroll bar positions'. The server state is coming from [Adama as a giant JSON object with JSON deltas](https://book.adama-platform.com/reference/deltas.html).

The roslin runtime will mirror [RxHTML](https://book.adama-platform.com/rxhtml/ref.html) with the ability to manage multiple server states. It's worth noting that a single item can be bind data to a single server state at a time.

How data gets bound is a aspect centered idea, and we will introduce various answers to this as the document unfolds. We will introduce [branching](#branching) and [containers](#containers)

### Scoping

An item is going to evaluate data binding against an object within the JSON object. There are some implicit rules, but it may be useful to navigate the object more directly.

## Branching

A basic form of data binding is branching on booleans, enumerations, or numeric ranges. This is denoted via the item field 'branch' which contains an object.

The first field within 'branch' is 'bind' which indicates which field to lookup in the JSON object. Based on the type and value of the field, the branch is going to select a card. The 'default' field within the branch object indicates the card id to use when no value was matched.

Branching supports specific values and ranges.

| value | branching rule to match |
| --- | --- |
| true | '=true' |
| false | '=false' |
| "xyz" | '=xyz' |
| 1 | '=1' |
| 2 | '=2' |
| ... | '=...' |
| 2.4 | '<2.5>2.3' |

The branching rule is written as a field within the branch object and the associated value is a card id.

## Containers

A container is fundamentally how an array within the server state gets exposed. For example, a hand of cards is represented as an array in Adama, and roslin will data bind to that array and create instances of cards. The item field 'container' is used to denote the field has children, and the associated object has fields like 'bind' and 'child'. The 'bind' field denotes which array in the JSON object to bind to, and the 'child' is a pointer to a card id used to denote which card is used on each child object.

 The multiplicity requires some kind of layout algorithm. For example, a hand of cards could use a "stack left to right" layout algorithm.

Each algorithm supports up to two directions. A direction goes from one edge of the container to the opposite. We further classify each direction as either horizontal or vertical.

| direction | type |
| --- | --- |
| left-right | horizontal |
| right-left | horizontal |
| top-bottom | vertical |
| bottom-top | vertical |

These directions feed various layout algorithms. The 'layout' field is used to select a specific algorithm:

| 'layout' algorithm | directions | causes growth on overflow |
| --- |
| stack | all | yes, in the direction of growth |
| overlap | all | no |
| flow | horizontal to vertical, vertical to horizontal | yes, in the minor direction of growth |

The key difference between stack and overlap algorithms is that stack will adjoin the items together edge to edge while overlap will evenly fit the items into the container. The direction is denoted via 'major' field.

The flow layout algorithm has a major direction and minor direction. If the major direction is left to right and the minor direction is top to bottom, then this is the typical western typesetter algorithm. The major direction is held in the 'major' field while the minor direction is held in the 'minor' field.

The sizing of child cards in the container starts with minimum sizing which cards can override. By default, the minimize size of each child card is one pixel by one pixel. The minimum size can be configured to follow from the height or width of a container as well via a variety of rules. This allows the sizing of the container to be communicated to the child cards. The rule is determined by the presence of a field.

| child sizing field | meaning |
| --- | --- |
| child-size | fixed size of the child size |
| child-width-scale-height | The width of the child is a scalar multiplier of the height |
| child-height-scale-width | The height of the child is a scalar multiplier of the width |
| child-multiplier | The size of the child is a multiple of the parent |

For example, a hand of cards could be configured via.

```js
{
    'container': {
        'bind': 'hand',
        'child': 'single-card',
        'layout': 'overlap',
        'major': 'left-right',
        'child-width-scale-height': 0.7,
    }
}
```

## Item drawing

### Shapes

### Images and SVG

### Text





