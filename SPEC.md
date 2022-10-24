# Roslin Specification

# Let's set the scene

This document outlines the specification for roslin which is a reactive runtime for board games. Roslin is designed as a UX mirror to [Adama](https://github.com/mathgladiator/adama-lang), and the expectation is that Roslin + Adama = a game.

**About the name:** [roslin][https://en.wikipedia.org/wiki/Laura_Roslin] is derived from [Battlestar Galatica](https://www.imdb.com/title/tt0407362/) which is how the author and his wife named their goats.

## Goals &amp; Requirements

* Provide a fantastic user experience for board game players on multiple devices (tv, gameboard, phone, tablet)
* Serve as a mostly-logic-free template engine to turn a streaming-JSON object into an interactive image.
* Small footprint and lean implementation for low-end devices and battery friendly execution
* The format should be easily edited by humans and tools

## Non-goals

This runtime should extend beyond board games, but this is the path towards madness. The initial version should be 100% focus on board games and the challenges presented by them. Focus!

# Format

Roslin is plain-ole JSON structured under a schema that we will describe as this document unfolds.

## Top level

The root object of the format has XYZ fields which are 

* assets
* forest
* setup

## Assets

## Forest

## Setup

