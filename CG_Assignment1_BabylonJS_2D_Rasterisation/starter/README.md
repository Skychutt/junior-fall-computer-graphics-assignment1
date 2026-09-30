# CG Assignment 1 — 2D Rasterisation

**Name:** 楚天泽  

## Description

A software rasteriser written in JavaScript and displayed with the Babylon.js starter. The assessed geometry is produced by explicit lines, implicit lines, half-plane triangle tests and barycentric colour interpolation. The final mode draws a 2D house (body, roof, door, windows, chimney and line details) with those functions. Babylon.js only uploads the pixel buffer to the screen.

## How to run

From this directory:

```text
python -m http.server 8000
```

Open http://localhost:8000 . The toolbar switches between Explicit Lines, Implicit Lines, Half-plane Triangles, Barycentric Triangles and Final House.

Opening `index.html` directly can fail, because the page loads `src/main.js` as an ES module.

## Known limitations

- Explicit lines use a floating-point slope. Vertical lines are a separate loop, because the slope is undefined. Steep lines are sampled along *y* so they stay continuous.
- Implicit lines use a 0.75 pixel distance tolerance. Some diagonals are therefore slightly thicker than the explicit samples.
- Implicit lines and triangle fills scan a bounding box. The result is correct, but slower than an integer line walker such as Bresenham’s algorithm.
- The sun, clouds and foliage are triangle fans, so their outlines are polygons.
- A pixel exactly on a shared edge can be written by both triangles. The later colour replaces the earlier one.

## Files

- `src/rasterization.js` — framebuffer and the four rasterisers
- `src/main.js` — Babylon.js display, mode switch, demonstrations and the house
- `assets/` — screenshots used in the report
- `report.pdf` — written report

## Acknowledgements

The window, camera, plane and dynamic texture come from the supplied starter. Babylon.js is loaded from the official CDN (`https://cdn.babylonjs.com/babylon.js`) and is not used to draw the assessed lines or triangles.
