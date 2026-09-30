/*
 * ASSIGNMENT 1 STARTER
 *
 * Implement the functions marked TODO.
 * Do not replace them with Babylon.js drawing primitives.
 */

export const WIDTH = 640;
export const HEIGHT = 480;

export function createFramebuffer(width = WIDTH, height = HEIGHT) {
    return {
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4)
    };
}

export function clear(frame, r = 245, g = 245, b = 245, a = 255) {
    for (let i = 0; i < frame.data.length; i += 4) {
        frame.data[i] = r;
        frame.data[i + 1] = g;
        frame.data[i + 2] = b;
        frame.data[i + 3] = a;
    }
}

export function setPixel(frame, x, y, color) {
    x = Math.round(x);
    y = Math.round(y);

    if (x < 0 || x >= frame.width || y < 0 || y >= frame.height) return;

    const i = 4 * (y * frame.width + x);
    frame.data[i] = color.r;
    frame.data[i + 1] = color.g;
    frame.data[i + 2] = color.b;
    frame.data[i + 3] = color.a ?? 255;
}

export function rgb(r, g, b, a = 255) {
    return { r, g, b, a };
}

export function barycentric(P, A, B, C) {
    const area = edgeFunction(A, B, C);
    if (area === 0) {
        return { alpha: 0, beta: 0, gamma: 0 };
    }

    // alpha, beta, gamma are the weights of A, B and C.
    const alpha = edgeFunction(B, C, P) / area;
    const beta = edgeFunction(C, A, P) / area;
    const gamma = edgeFunction(A, B, P) / area;
    return { alpha, beta, gamma };
}

export function drawLineExplicit(frame, x0, y0, x1, y1, color) {
    if (x0 === x1 && y0 === y1) {
        setPixel(frame, x0, y0, color);
        return;
    }

    // Vertical lines have an undefined slope, so step in y instead.
    if (x0 === x1) {
        const yStart = Math.min(y0, y1);
        const yEnd = Math.max(y0, y1);
        for (let y = Math.ceil(yStart); y <= Math.floor(yEnd); y++) {
            setPixel(frame, x0, y, color);
        }
        return;
    }

    const dx = x1 - x0;
    const dy = y1 - y0;
    const steep = Math.abs(dy) > Math.abs(dx);

    if (!steep) {
        if (x0 > x1) {
            [x0, x1] = [x1, x0];
            [y0, y1] = [y1, y0];
        }
        const m = (y1 - y0) / (x1 - x0);
        const b = y0 - m * x0;
        for (let x = Math.ceil(x0); x <= Math.floor(x1); x++) {
            setPixel(frame, x, m * x + b, color);
        }
        return;
    }

    // Steep lines are sampled along y, then x is recovered from y = mx + b.
    if (y0 > y1) {
        [x0, x1] = [x1, x0];
        [y0, y1] = [y1, y0];
    }
    const m = (y1 - y0) / (x1 - x0);
    const b = y0 - m * x0;
    for (let y = Math.ceil(y0); y <= Math.floor(y1); y++) {
        setPixel(frame, (y - b) / m, y, color);
    }
}

export function drawLineImplicit(frame, x0, y0, x1, y1, color) {
    const A = y0 - y1;
    const B = x1 - x0;
    const C = x0 * y1 - x1 * y0;
    const norm = Math.hypot(A, B);

    if (norm === 0) {
        setPixel(frame, x0, y0, color);
        return;
    }

    const minX = Math.max(0, Math.floor(Math.min(x0, x1) - 1));
    const maxX = Math.min(frame.width - 1, Math.ceil(Math.max(x0, x1) + 1));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1) - 1));
    const maxY = Math.min(frame.height - 1, Math.ceil(Math.max(y0, y1) + 1));
    // Distance = |F| / ||(A,B)||. 0.75px keeps diagonals solid without a thick stroke.
    const limit = 0.75 * norm;

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (Math.abs(A * x + B * y + C) <= limit) {
                setPixel(frame, x, y, color);
            }
        }
    }
}

export function edgeFunction(A, B, P) {
    return (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
}

function triangleBounds(frame, A, B, C) {
    return {
        minX: Math.max(0, Math.floor(Math.min(A.x, B.x, C.x))),
        maxX: Math.min(frame.width - 1, Math.ceil(Math.max(A.x, B.x, C.x))),
        minY: Math.max(0, Math.floor(Math.min(A.y, B.y, C.y))),
        maxY: Math.min(frame.height - 1, Math.ceil(Math.max(A.y, B.y, C.y)))
    };
}

export function drawTriangleHalfPlane(frame, A, B, C, color) {
    const area = edgeFunction(A, B, C);
    if (area === 0) return;

    const { minX, maxX, minY, maxY } = triangleBounds(frame, A, B, C);

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const P = { x: x + 0.5, y: y + 0.5 };
            const w0 = edgeFunction(B, C, P);
            const w1 = edgeFunction(C, A, P);
            const w2 = edgeFunction(A, B, P);
            const inside = area > 0
                ? (w0 >= 0 && w1 >= 0 && w2 >= 0)
                : (w0 <= 0 && w1 <= 0 && w2 <= 0);
            if (inside) setPixel(frame, x, y, color);
        }
    }
}

export function drawTriangleBarycentric(
    frame, A, B, C, colorA, colorB, colorC
) {
    const area = edgeFunction(A, B, C);
    if (area === 0) return;

    const { minX, maxX, minY, maxY } = triangleBounds(frame, A, B, C);

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const P = { x: x + 0.5, y: y + 0.5 };
            const { alpha, beta, gamma } = barycentric(P, A, B, C);
            if (alpha < 0 || beta < 0 || gamma < 0) continue;

            setPixel(frame, x, y, rgb(
                alpha * colorA.r + beta * colorB.r + gamma * colorC.r,
                alpha * colorA.g + beta * colorB.g + gamma * colorC.g,
                alpha * colorA.b + beta * colorB.b + gamma * colorC.b
            ));
        }
    }
}
