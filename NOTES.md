
# From board games to items

We will be using this concept of a card in multiple ways. A card may be a play area, a token, a board, part of a board, a hand of cards, an actual card, and many more. As such, we need to elicit a variety of types that define cards. We will do this by breaking down existing games to emerge requirements to assist the design.

## Chess

Chess is a simple game and can be broken down into a 8x8 board and 32 pieces of various types. Adama would provide three arrays: *pieces_in_play*, *white_capture*, *black_capture*. Roslin would then visualize the game with these items:

* A grid token holder
* Black and white token capture zones

The grid token holder would be configured to be 8x8 grid and bound to *pieces_in_play*. Either this grid has a background image of the board, or we introduce a new array *board_cells* which has a boolean/enum to indicate black/white. If the array dictates the color of the cell, then the grid component can use a tileset/tilecard and select a card to render per cell. Both *pieces_in_play* and *board_cells* would require an X and Y coordinate.

A capture zone will simply render tokens using a layout algorithm (stacked, random stable plot, etc...)

Animation is achieved by these two items working together by having an animation channel.

One complication is that the orientation of the board should face the active player, and this is easily resolved by creating two versions with black/white facing the user. This requires Adama to emit a *is_play_white* field along with a boolean card selector to pick between "player_black_board" or "player_white_board".

## Hearts

Hearts is fantastic trick taking game which can be broken down to simply your hand, cards in play, your points, and then a count of cards per other player. Adama would need to provide an array of cards in your hand (as *hand*), an array of cards in play (*in_play*), an array of other players with their card counts (*others*) which is sorted per play to the next three players.

Drawing the cards in hand or in play is a simple task of mapping a container item with a layout algorithm (*hand* would use a stacked left to right while *in_play* would use a circular layout with a minimum count) to visualize the cards shown.

Drawing a player would be a repeated container which accepts the count and then renders the card with a layout algorithm.

A core complication of this data invention is that animation is much harder as there is no id to track (for privacy reasons). Worse, we can't infer any animation status from the numbers changing or not. Adama will need to produce a flow table. The repeated container would need to listen to a *card_flow* array with three fields (id_from, id_to, count). Ideally, count will monotonically go up.

## Dominion

In the base game, dominion is a bunch of cards. There are 17 supply piles (three victory cards, three money cards, a curse pile, and ten kingdom cards) which Adama would supply to the user via a count. The player has a deck, their active hand, a discard pile, and a play area. The deck would be private to everyone and Adama would supply a counter. The discard pile is also a counter with the top card revealed. The hand is only visible to the player, but it could be revealed due to some actions. There is also a shared trash pile.

## Monopoly

There are two options. First, the board may have a list of player tokens which then leverages the animation channel for pieces to move. Second, there is a list of tokens which yield an enum of where the piece is; this requires a new component to define where tokens be placed.

## Risk

The map is the hardest element, and it requires an image color coded map. Here, an image contains regions of colors which then require mapping to enum values. This will require some tooling help, but this image map could then be used to create a highlight map.

## Battlestar Galatica


# DEFUNCT (Notes)
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


* stack {left, right, top, bottom} to {right, left, bottom, top}
* plot {top, bottom} to {bottom, top}, then {left, right} to {right, left}
* plot {left, right} to {right, left}, then {top, bottom} to {bottom, top}

## Systems

The l-system will produce a scene tree, but an important aspect of *online* board games is animation which requires branches within the tree to migrate. With Adama, the required information to tween is not available out of the box and requires the infrastructure to provide hints. There are two mechanisms for providing hints: implicit inference and explicit instruction.

**Implicit inference** requires roslin to detect a radical position change of a item by an id. That is, a card disappeared from "in hand" and showed up "in play" which requires global tracking of items by id to smoothly tween the location of the card. Unfortunately, this has problems when the privacy of the card makes that impossible.

**Explicit instruction** requires the back-end to provide some hints as to what to animate. Rather than implicitly detecting a migration, the system has to be told to "move a card from 'in play' to 'discard'"

The key boundary is privacy which requires explicit instruction as information is simply hidden. The back-end must explicitly model the private flow of information. Consider the case of a player passing a card to another player. In a real game, the moment the decision is made, the card is face down for all players.

## Channels

 A channel is fundamentally a publisher-subscriber system using ids. Items use a goal centric animation system where the dimensions of the item are published globally, and the manifested dimensions are continuously transformed from the current to future. This allows cards to transition from various places.

 Channels are configured with various speed to indicate how fast the transformation happens. Items may also provide movement restrictions on a channel. For example, the linear path from an item's current location may intersect an item. If so, then the entry and exit point are determined by the intersected item.


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