# CG Assignment 1 — 2D Rasterisation

**Name:** 楚天泽

**BDIC student ID:** 24372307

**UCD student ID:** 24107737


## Description

A software rasteriser written in JavaScript and displayed with the Babylon.js starter. The assessed geometry is produced by explicit lines, implicit lines, half-plane triangle tests and barycentric colour interpolation. The final mode draws a 2D house (body, roof, door, windows, chimney and line details) with those functions. Babylon.js only uploads the pixel buffer to the screen.

## How to run

From this directory:

```text
python3 -m http.server 8000
```

Open http://localhost:8000 . The toolbar switches between Explicit Lines, Implicit Lines, Half-plane Triangles, Barycentric Triangles and Final House.

Opening `index.html` directly can fail, because the page loads `src/main.js` as an ES module.

## Lecture correspondence

- `drawLineExplicit`: lecture 05 pp.4–5, `y = mx + c` or `x = ny + d`.
- `drawLineImplicit`: lecture 04 directed-line distance and lecture 05 p.7, `abs(distance) < 0.5`. Projection limits the result to a finite segment; deterministic half-pixel ties and rounded endpoints handle boundary cases.
- `edgeFunction` / `drawTriangleHalfPlane`: lecture 05 p.23, three half-plane tests. Vertex order is normalised before testing.
- `barycentric`: lecture 05 p.29, signed distance ratios for alpha and gamma, then beta = 1 - alpha - gamma. Degenerate inputs return null.
- `drawTriangleBarycentric`: lecture 05 p.29, per-pixel weights and RGB interpolation.

## Known limitations and conventions

- Integer (x,y) sample locations are used consistently, matching lecture pseudocode. Framebuffer y increases downward.
- Implicit lines use the lecture’s 0.5-pixel distance test. At exact ties (within 1e-10), a fixed sign of the line coefficients selects one side independently of endpoint order. This prevents half-integer horizontal/vertical lines from disappearing or becoming two pixels wide. There is no anti-aliasing.
- Both line modes include rounded endpoints, including subpixel segments. Explicit lines sample the major axis; implicit interior samples use the segment projection interval [0,1].
- Loops are clipped to the framebuffer. Bounding-box scans are slower than incremental rasterisers.
- Zero-area triangles are skipped; barycentric coverage allows 1e-10 negative round-off at boundaries.
- Shared triangle edges are inclusive and may be overwritten by the later triangle; no top-left ownership rule is implemented.
- All scenery uses explicit line segments, triangles or rectangles split into two triangles. The faceted sun is a twelve-sided polygon split into twelve barycentrically shaded triangles with explicitly listed vertices. There are no circle/ellipse routines or trigonometric point generation.

## Files

- `src/rasterization.js` — framebuffer and the four rasterisers
- `src/main.js` — Babylon.js display, mode switch, demonstrations and the house
- `vendor/babylon.js` — locally saved official Babylon.js display library
- `assets/` — screenshots used in the report
- `report.pdf` — written report

## Acknowledgements

The window, camera, plane and dynamic texture come from the supplied starter. Babylon.js was downloaded from the official CDN (`https://cdn.babylonjs.com/babylon.js`) and is loaded locally from `vendor/babylon.js` and is not used to draw the assessed lines or triangles.

## Submission

Both institutional IDs appear above. The submission folder uses UCD ID 24107737 and the `studentID_assignment0` naming pattern printed in `docs/ASSIGNMENT_1.md` (although the assignment title is Assignment 1).
Include `vendor/` when copying or submitting: the app loads Babylon.js locally.
The HTML report is the editable source corresponding to the PDF. Result screenshots were refreshed after the lecture-aligned implementation.
