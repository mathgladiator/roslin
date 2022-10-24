# Roslin Specification

This document outlines the specification for [roslin](https://github.com/mathgladiator/roslin) which is a reactive runtime for board games. Roslin is designed as a UX mirror to [Adama](https://github.com/mathgladiator/adama-lang), and the expectation is that Roslin + Adama = a game.

**About the name:** [roslin](https://en.wikipedia.org/wiki/Laura_Roslin) is derived from [Battlestar Galatica](https://www.imdb.com/title/tt0407362/) which is how the author and his wife named their goats.

## Goals &amp; Requirements

* Provide a fantastic user experience for board game players on multiple devices (tv, [gameboard](https://lastgameboard.com/), phone, tablet)
* Serve as a mostly-logic-free template engine to turn a streaming-JSON object into an interactive image.
* Small footprint and lean implementation for low-end devices and battery friendly execution
* The format should be easily edited by humans and tools

## Non-goals

This runtime should extend beyond board games, but this is the path towards madness. The initial version should be 100% focused on board games and the challenges presented by them. Focus!

# Format

Roslin is plain-ole JSON structured under a schema that we will describe as this document unfolds.

## Top level

The root object has these fields

* assets
** search
* forest
** default
* systems

## Assets

The root field "assets" is an object providing a mapping of names (i.e. asset ids) to assets which the system can pre-load. An asset is an object with a required "url" string field, and "url" represents a file like an image, movie, svg, audio, nine-path image, etc. The "url" identifies the location of the asset's resource and may point to an online resource via HTTP or a local resource. For convenience, an optional top level field called "search" provides an array to provide the runtime a path to search for the resources. The "url" must contain an extension to indicate the nature (image, animation, movie, audio) of the resource.

Beyond mapping asset ids to files, the asset object is opportunity to provide parameters on how that particular asset is to be used. For example, a nine-patch image requires four integer values as to how to slice the image up to scale. Similarly, a set of assets may share a file with different parameters so tile-maps and tile-assets may be used.

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

Roslin uses an [l-system](https://en.wikipedia.org/wiki/L-system) inspired approach where you have a forest of cards. Cards are simply functions that turn JSON into a scalable image. The root field "forest" is an object mapping names (i.e. card ids) to cards. A card is an object with instructions on how to pull data from JSON, draw it, and map any feedback. First, a card has a minimal dimensions represented by the "width" and "height" fields which have units within. Second, the card also has a field called "items" which is a list of items. An item is an object which must contain a "type" field as a string, and the value of the "type" field will determine the behavior of the item.

For simplicity, the "type" value "simple-shape" has three parameters: "shape", "stroke", "fill" which sit inside the object. More details can be found in the later sections, but we will set "shape" to "box" to render a box with stroke set to "#000" and fill set to "#fff". This will render a white box with a black border.

We give this card the name "simple-white-box", and then use the top-level field "default" to set this card as the root card.

### minimal 'forest' example

```js
{
    "forest": {
        "simple-white-box": {
            "width": 400,
            "height": 300,
            "items": [
                {
                    "type":"simple-shape",
                    "shape":"box",
                    "stroke":"#000",
                    "fill":"#fff"
                }

            ]
        }
    },
    "default":"simple-white-box"
}
```

## Systems

The l-system will produce a scene tree, but an important aspect of online board games is animation which requires branches within the tree to migrate. This is accomplished via systems which provide tracking of branches that can be mounted within the l-system tree. This is a solution to a problem that emerges from the reactive binding and deck builders, so it's worth taking a look at the nature of the problem.

In a deck builder, like [Dominion](https://en.wikipedia.org/wiki/Dominion_(card_game)), cards are all over the place. The are cards in the supply, trash piles, your hand, your discard, your deck, in play, in reserve, etc. There are many places that a specific card can be, and when a card changes between places we need a way to smoothly animate that changes. This is exceptionally interested as we also aim to maximize privacy.

## Card item types

### Common properties for visual items

A card uses a box-model

### Simple shape
This is primarily a test shape for the developers

### Plot
Plot an asset (movies)

### Switch

### If

### Layout

