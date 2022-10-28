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

Roslin uses an [l-system](https://en.wikipedia.org/wiki/L-system) inspired approach where you have a forest of cards. Cards are simply functions that turn JSON into a scalable image. The root field "forest" is an object mapping names (i.e. card ids) to cards. A card is an object with instructions on how to pull data from JSON, draw it, and map any feedback. First, a card has a minimal dimensions represented by the "width" and "height" fields which have pixel units. Second, the card also has a field called "items" which is a list of items. An item is an object which must contain a "type" field as a string, and the value of the "type" field will determine the behavior of the item.

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

## Items

### Layout engine

A card uses a box-model

* pixel grid
* anchoring
* card slices
* matrix vs aligned box


### Simple shape
This is primarily a test shape for the developers

### Plot
Plot an asset (movies)

### Switch
Read the JSON tree, and then pick a card based on a value

### If
Read the JSON tree and evaluate a statement, and pick a card based on true/false

## Decide

### Child

## Containers &amp Layout options

* stack {left, right, top, bottom} to {right, left, bottom, top}
* plot {top, bottom} to {bottom, top}, then {left, right} to {right, left}
* plot {left, right} to {right, left}, then {top, bottom} to {bottom, top}

## Systems

The l-system will produce a scene tree, but an important aspect of *online* board games is animation which requires branches within the tree to migrate. With Adama, the required information to tween is not available out of the box and requires the infrastructure to provide hints. There are two mechanisms for providing hints: implicit inference and explicit instruction.

**Implicit inference** requires roslin to detect a radical position change of a item by an id. That is, a card disappeared from "in hand" and showed up "in play" which requires global tracking of items by id to smoothly tween the location of the card. Unfortunately, this has problems when the privacy of the card makes that impossible.

**Explicit instruction** requires the back-end to provide some hints as to what to animate. Rather than implicitly detecting a migration, the system has to be told to "move a card from 'in play' to 'discard'"

The key boundary is privacy which requires explicit instruction as information is simply hidden. The back-end must explicitly model the private flow of information. Consider the case of a player passing a card to another player. In a real game, the moment the decision is made, the card is face down for all players.



### Notes on animation
This is accomplished via systems which provide tracking of branches that can be mounted within the l-system tree. This is a solution to a problem that emerges from the reactive binding and deck builders, so it's worth taking a look at the nature of the problem.

In a deck builder, like [Dominion](https://en.wikipedia.org/wiki/Dominion_(card_game)), cards are all over the place. There are cards in the supply, trash piles, your hand, your discard, your deck, in play, in reserve, etc. There are many places that a specific card can be, and when a card changes between places we need a way to smoothly animate that changes. This is exceptionally interesting as we also aim to maximize privacy. This problem crops up because Adama encourages developers to expose the various piles of cards as fields.

```adama
  public formula in_play = iterate cards where location == Location::InPlay:
  bubble hand = iterate cards where owner == @who && location == Location::Hand:
  bubble deck_remaining = (iterate cards where owner == @who && location == Location::Deck).size();
  bubble discard_count = (iterate cards where owner == @who && location == Location::Discard).size();
  public formula trash_count = (iterate cards where location == Location::Trash).size();
```

The player will only see cards while in hand or in play, but cards in hand may be played, discarded, or trashed. The unfortunate aspect of Adama is that the behavior is instant. Trashing a card from hand will instantly remove the card from hand and increment trash_count. Similarly, discarding will product an instantaneous effect. Ultimately, we need Adama to be able to provide some kind of data to tween between game states. One problem at hand is that this tweening must be privacy centric, so card ids can't be in play as that reveals the nature of the card.

The privacy needs create a divide between implicit animation detection (this card identified by card id went from "hand" to "in play") versus explicit animation instruction (a card went from "hand" to "trash"). The beauty of implicit animation detection is a global tracking system can smoothly move cards between binding sites, but the downside of detecting where a card that "disappears" is impossible without extra information. Thus, it is a requirement that the server side provide additional information, and ideally we make this information as easy as possible to get without violating privacy.