
// Compute pixel colours in memory; main.js displays the completed framebuffer.
// The origin is at the top left: x increases rightwards and y increases downwards.
export const WIDTH = 640;
export const HEIGHT = 480;

// Each pixel stores four consecutive RGBA channels, clamped to the range 0-255.
export function createFramebuffer(width = WIDTH, height = HEIGHT) {
    return {
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4)
    };
}

// Step through four channels at a time to reset every pixel to the background colour.
export function clear(frame, r = 245, g = 245, b = 245, a = 255) {
    for (let i = 0; i < frame.data.length; i += 4) {
        frame.data[i] = r;
        frame.data[i + 1] = g;
        frame.data[i + 2] = b;
        frame.data[i + 3] = a;
    }
}

// Round continuous coordinates to pixel locations and ignore points outside the framebuffer.
export function setPixel(frame, x, y, color) {
    x = Math.round(x);
    y = Math.round(y);

    if (x < 0 || x >= frame.width || y < 0 || y >= frame.height) return;

    // Find pixel (x,y) in row-major order, then multiply by four to locate its red channel.
    const i = 4 * (y * frame.width + x);
    frame.data[i] = color.r;
    frame.data[i + 1] = color.g;
    frame.data[i + 2] = color.b;
    frame.data[i + 3] = color.a ?? 255;
}

// Create a colour object; the default alpha of 255 means fully opaque.
export function rgb(r, g, b, a = 255) {
    return { r, g, b, a };
}
// Compute the weights of vertices A, B and C for the current point P.
// alpha is the signed distance ratio to BC; gamma is the corresponding ratio to AB.
// Distances are measured to infinite edge lines. Their signs identify points outside the triangle.
export function barycentric(P, A, B, C) {
    // Collinear or coincident vertices have zero area, so their distance ratios are undefined.
    if (edgeFunction(A, B, C) === 0) return null;

    // Math.hypot gives the edge length; dividing the edge function by this length gives signed distance.
    const lengthBC = Math.hypot(C.x - B.x, C.y - B.y);
    const lengthAB = Math.hypot(B.x - A.x, B.y - A.y);
    const distancePtoBC = edgeFunction(B, C, P) / lengthBC;
    const distanceAtoBC = edgeFunction(B, C, A) / lengthBC;
    const distancePtoAB = edgeFunction(A, B, P) / lengthAB;
    const distanceCtoAB = edgeFunction(A, B, C) / lengthAB;

    const alpha = distancePtoBC / distanceAtoBC;
    const gamma = distancePtoAB / distanceCtoAB;
    // The weights sum to one, so beta follows from alpha and gamma.
    const beta = 1 - alpha - gamma;
    return { alpha, beta, gamma };
}
// Explicit lines: sample y = mx + c by column, or x = ny + d by row for steep lines.
// Changing the sampling axis prevents steep lines from skipping several pixel rows per step.
export function drawLineExplicit(frame, x0, y0, x1, y1, color) {
    // Coincident endpoints require only one pixel.
    if (x0 === x1 && y0 === y1) {
        setPixel(frame, x0, y0, color);
        return;
    }
    // Draw rounded endpoints separately so segments without integer samples remain visible.
    setPixel(frame, x0, y0, color);
    setPixel(frame, x1, y1, color);

    // A vertical line has undefined slope: keep x fixed and step through y between the endpoints.
    // ceil/floor select integer samples; max/min clip the loops to the framebuffer.
    if (x0 === x1) {
        for (let y = Math.max(0, Math.ceil(Math.min(y0, y1)));
             y <= Math.min(frame.height - 1, Math.floor(Math.max(y0, y1))); y++) {
            setPixel(frame, x0, y, color);
        }
        return;
    }

    // Choose the coordinate with the larger absolute change as the loop variable.
    if (Math.abs(y1 - y0) <= Math.abs(x1 - x0)) {
        // Swap both endpoint coordinates to traverse left to right without changing the segment.
        if (x0 > x1) {
            [x0, x1] = [x1, x0];
            [y0, y1] = [y1, y0];
        }
        // Calculate slope m and intercept c, then evaluate y for each integer x.
        const m = (y1 - y0) / (x1 - x0);
        const c = y0 - m * x0;
        for (let x = Math.max(0, Math.ceil(x0));
             x <= Math.min(frame.width - 1, Math.floor(x1)); x++) {
            setPixel(frame, x, m * x + c, color);
        }
    } else {
        // For steep lines, order the endpoints so y increases from top to bottom.
        if (y0 > y1) {
            [x0, x1] = [x1, x0];
            [y0, y1] = [y1, y0];
        }
        // Use n = dx/dy and x = ny + d; setPixel rounds the result to a pixel.
        const n = (x1 - x0) / (y1 - y0);
        const d = x0 - n * y0;
        for (let y = Math.max(0, Math.ceil(y0));
             y <= Math.min(frame.height - 1, Math.floor(y1)); y++) {
            setPixel(frame, n * y + d, y, color);
        }
    }
}
// Implicit lines: test pixel distances to ax + by + c = 0 within a bounding box.
// Use a half-pixel distance threshold and projection t to restrict coverage to the segment.
export function drawLineImplicit(frame, x0, y0, x1, y1, color) {
    const dx = x1 - x0, dy = y1 - y0;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
        setPixel(frame, x0, y0, color);
        return;
    }
    setPixel(frame, x0, y0, color);
    setPixel(frame, x1, y1, color);
    // The endpoints define the implicit equation; sqrt(a*a + b*b) converts its value to distance.
    const a = y0 - y1;
    const b = x1 - x0;
    const c = x0 * y1 - x1 * y0;
    const length = Math.hypot(a, b);
    // Fix the line's sign so reversing the endpoints selects the same boundary pixels.
    const side = a > 0 || (a === 0 && b > 0) ? 1 : -1;
    // Expand the bounding box by half a pixel and clip it to avoid irrelevant checks.
    const minX = Math.max(0, Math.floor(Math.min(x0, x1) - 0.5));
    const maxX = Math.min(frame.width - 1, Math.ceil(Math.max(x0, x1) + 0.5));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1) - 0.5));
    const maxY = Math.min(frame.height - 1, Math.ceil(Math.max(y0, y1) + 0.5));
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            const distance = (a * x + b * y + c) / length;
            // t = 0 is the start and t = 1 is the end; values outside [0,1] lie beyond the segment.
            const t = ((x - x0) * dx + (y - y0) * dy) / lengthSquared;
            // At a distance of exactly 0.5, choose one side to avoid drawing both neighbouring rows or neither.
            // The 1e-10 tolerance absorbs round-off; rounded endpoints are drawn separately.
            const gap = Math.abs(distance) - 0.5;
            const covered = gap < -1e-10 ||
                (Math.abs(gap) <= 1e-10 && side * distance > 0);
            if (t >= 0 && t <= 1 && covered) {
                setPixel(frame, x, y, color);
            }
        }
    }
}

// The 2D cross product gives the side of directed edge A -> B; zero means collinear.
// Its value is also twice the signed area of triangle ABP.
export function edgeFunction(A, B, P) {
    return (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
}

// Use vertex minima and maxima to scan only valid integer pixels within the triangle's bounding box.
function triangleBounds(frame, A, B, C) {
    return {
        minX: Math.max(0, Math.ceil(Math.min(A.x, B.x, C.x))),
        maxX: Math.min(frame.width - 1, Math.floor(Math.max(A.x, B.x, C.x))),
        minY: Math.max(0, Math.ceil(Math.min(A.y, B.y, C.y))),
        maxY: Math.min(frame.height - 1, Math.floor(Math.max(A.y, B.y, C.y)))
    };
}

// Fill a single-colour triangle by testing the three edge half-planes AB, BC and CA.
export function drawTriangleHalfPlane(frame, A, B, C, color) {
    const area = edgeFunction(A, B, C);
    if (area === 0) return;
    // Normalise winding so all three edge values are non-negative inside; this looks clockwise with y downwards.
    // Skip zero-area triangles and include pixels on the boundary.
    if (area < 0) [B, C] = [C, B];
    const { minX, maxX, minY, maxY } = triangleBounds(frame, A, B, C);
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            const P = { x, y };
            if (edgeFunction(A, B, P) >= 0 &&
                edgeFunction(B, C, P) >= 0 &&
                edgeFunction(C, A, P) >= 0) {
                setPixel(frame, x, y, color);
            }
        }
    }
}

// Fill a shaded triangle by calculating pixel weights and blending the R, G and B channels separately.
export function drawTriangleBarycentric(frame, A, B, C, colorA, colorB, colorC) {
    if (edgeFunction(A, B, C) === 0) return;
    const { minX, maxX, minY, maxY } = triangleBounds(frame, A, B, C);
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            const P = { x, y };
            // Each loop iteration uses the current pixel position as P and computes a new set of weights.
            const { alpha, beta, gamma } = barycentric(P, A, B, C);
            // Negative weights indicate an outside point; allow tiny negative round-off to avoid boundary gaps.
            if (alpha < -1e-10 || beta < -1e-10 || gamma < -1e-10) continue;
            // Pixel colour = alpha * colourA + beta * colourB + gamma * colourC.
            setPixel(frame, x, y, rgb(
                alpha * colorA.r + beta * colorB.r + gamma * colorC.r,
                alpha * colorA.g + beta * colorB.g + gamma * colorC.g,
                alpha * colorA.b + beta * colorB.b + gamma * colorC.b
            ));
        }
    }
}
