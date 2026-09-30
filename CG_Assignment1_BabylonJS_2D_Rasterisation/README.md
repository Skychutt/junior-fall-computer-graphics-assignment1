# CG Assignment 1 — 2D Rasterisation with Babylon.js

This package contains:

- `docs/ASSIGNMENT_1.md` —assignment specification & guidlines.
- `starter/` — starter repository for students to start with.

## Important teaching design

Babylon.js is used only as the application/display layer. The assessed line and triangle rasterisers operate on a software framebuffer implemented as a JavaScript `Uint8ClampedArray`.

Students should implement:

- explicit line rasterisation;
- implicit/half-plane line rasterisation;
- triangle rasterisation using edge functions;
- barycentric coordinates;
- barycentric colour interpolation;
- the final 2D house.

## Running

Because ES modules are used, run a local web server from either the `starter` or `model-answer` directory.

For example:

    python -m http.server 8000

Then open the corresponding localhost URL in a browser.

## Babylon.js version

The starter currently uses the Babylon.js browser CDN. Babylon.js currently recommends the ES6 `@babylonjs/core` package for new projects, while the UMD CDN distribution is supported for learning experiments and small browser experiments. See the official Babylon.js documentation and package information.

