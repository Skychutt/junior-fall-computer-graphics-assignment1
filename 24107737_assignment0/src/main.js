// Arrange the demos and house using coordinates and colours; the rasterisers compute their pixels.
import {
    WIDTH, HEIGHT, createFramebuffer, clear, rgb,
    drawLineExplicit, drawLineImplicit,
    drawTriangleHalfPlane, drawTriangleBarycentric
} from "./rasterization.js?v=lecture4";

// Get the display canvas and create the Babylon.js engine and scene.
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// An orthographic camera faces the display plane to show the entire pixel image.
const camera = new BABYLON.FreeCamera(
    "camera",
    new BABYLON.Vector3(0, 0, -3),
    scene
);
camera.setTarget(BABYLON.Vector3.Zero());
camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
camera.orthoLeft = -1;
camera.orthoRight = 1;
camera.orthoTop = 1;
camera.orthoBottom = -1;

// This plane only displays the completed image; house components are rasterised in software.
const plane = BABYLON.MeshBuilder.CreatePlane(
    "framebuffer",
    { width: 2, height: 2 },
    scene
);

// The dynamic texture receives framebuffer colours and is displayed through the material.
const material = new BABYLON.StandardMaterial("framebufferMaterial", scene);
material.backFaceCulling = false;
const texture = new BABYLON.DynamicTexture(
    "softwareFramebuffer",
    { width: WIDTH, height: HEIGHT },
    scene,
    false
);
material.diffuseTexture = texture;
material.emissiveTexture = texture;
plane.material = material;

// frame stores pixel colours; mode selects which demonstration to draw.
const frame = createFramebuffer();
let mode = new URLSearchParams(location.search).get("mode") || "explicit";
if (!["explicit", "implicit", "halfplane", "barycentric", "house"].includes(mode)) {
    mode = "explicit";
}

// Create a point object: pt(10,20) is equivalent to { x:10, y:20 }.
function pt(x, y) {
    return { x, y };
}

// Supply vertices in boundary order and split a convex quadrilateral along a-c into two triangles.
function fillQuad(a, b, c, d, color) {
    drawTriangleHalfPlane(frame, a, b, c, color);
    drawTriangleHalfPlane(frame, a, c, d, color);
}

// Split into the same two triangles, using barycentric interpolation of the vertex colours.
function fillQuadColors(a, b, c, d, ca, cb, cc, cd) {
    drawTriangleBarycentric(frame, a, b, c, ca, cb, cc);
    drawTriangleBarycentric(frame, a, c, d, ca, cc, cd);
}

// x and y specify the top-left corner; w and h define its size. Fill using the four corners.
function fillRect(x, y, w, h, color) {
    fillQuad(
        pt(x, y),
        pt(x + w, y),
        pt(x + w, y + h),
        pt(x, y + h),
        color
    );
}

// Draw only the rectangle outline by connecting its top, right, bottom and left edges.
function strokeRect(x, y, w, h, color) {
    drawLineImplicit(frame, x, y, x + w, y, color);
    drawLineImplicit(frame, x + w, y, x + w, y + h, color);
    drawLineImplicit(frame, x + w, y + h, x, y + h, color);
    drawLineImplicit(frame, x, y + h, x, y, color);
}

// Connect all three vertices to outline the triangle with the supplied colour.
function strokeTriangle(A, B, C, color) {
    drawLineImplicit(frame, A.x, A.y, B.x, B.y, color);
    drawLineImplicit(frame, B.x, B.y, C.x, C.y, color);
    drawLineImplicit(frame, C.x, C.y, A.x, A.y, color);
}

// drawLine is a function parameter: use either rasteriser with identical coordinates for comparison.
// The six segments demonstrate shallow, horizontal, diagonal, steep and vertical orientations.
function drawComparisonLines(drawLine) {
    drawLine(frame, 36, 78, 604, 132, rgb(35, 35, 35));
    drawLine(frame, 36, 190, 604, 190, rgb(186, 52, 48));
    drawLine(frame, 48, 430, 592, 248, rgb(36, 96, 184));
    drawLine(frame, 150, 36, 246, 452, rgb(34, 138, 72));
    drawLine(frame, 500, 28, 500, 452, rgb(132, 64, 176));
    drawLine(frame, 78, 450, 210, 250, rgb(40, 40, 40));
}

// Fill right, acute and obtuse triangles, then outline them to demonstrate different edge orientations.
function drawHalfPlaneDemo() {
    const right = [pt(40, 36), pt(220, 36), pt(40, 220)];
    const acute = [pt(300, 48), pt(590, 210), pt(250, 250)];
    const obtuse = [pt(70, 300), pt(600, 292), pt(210, 430)];

    drawTriangleHalfPlane(frame, right[0], right[1], right[2], rgb(92, 156, 214));
    drawTriangleHalfPlane(frame, acute[0], acute[1], acute[2], rgb(240, 176, 72));
    drawTriangleHalfPlane(frame, obtuse[0], obtuse[1], obtuse[2], rgb(92, 176, 122));

    strokeTriangle(right[0], right[1], right[2], rgb(28, 58, 96));
    strokeTriangle(acute[0], acute[1], acute[2], rgb(120, 72, 20));
    strokeTriangle(obtuse[0], obtuse[1], obtuse[2], rgb(28, 78, 48));
}

// Use three distinct vertex colours per triangle to show smooth barycentric colour interpolation.
function drawBarycentricDemo() {
    const red = rgb(220, 48, 48);
    const green = rgb(48, 186, 82);
    const blue = rgb(52, 92, 220);
    const A = pt(70, 400);
    const B = pt(330, 360);
    const C = pt(170, 70);
    drawTriangleBarycentric(frame, A, B, C, red, green, blue);
    strokeTriangle(A, B, C, rgb(40, 40, 40));

    const D = pt(390, 80);
    const E = pt(600, 210);
    const F = pt(430, 430);
    drawTriangleBarycentric(
        frame, D, E, F,
        rgb(255, 214, 64),
        rgb(214, 64, 168),
        rgb(64, 210, 214)
    );
    strokeTriangle(D, E, F, rgb(40, 40, 40));
}

// Draw from background to foreground; later pixel writes cover earlier colours.
// Build the house and scenery from lines and triangles, splitting rectangles into triangles too.
function drawHouse() {
    const skyTop = rgb(118, 182, 222);
    const skyHorizon = rgb(255, 214, 168);
    const grassTop = rgb(116, 176, 82);
    const grassBottom = rgb(70, 138, 60);
    const wall = rgb(248, 240, 224);
    const wallShade = rgb(214, 190, 164);
    const roof = rgb(176, 68, 54);
    const roofLine = rgb(112, 40, 36);

    // Two shaded triangles form the sky, blending blue at the top into a warm horizon colour.
    fillQuadColors(
        pt(0, 0), pt(WIDTH - 1, 0), pt(WIDTH - 1, 352), pt(0, 352),
        skyTop, skyTop, skyHorizon, skyHorizon
    );
    // Connect twelve boundary vertices to one centre to form twelve triangles making a faceted sun.
    const sunCenter = pt(86, 78);
    const sunEdge = [
        pt(86, 44), pt(103, 49), pt(115, 61), pt(120, 78),
        pt(115, 95), pt(103, 107), pt(86, 112), pt(69, 107),
        pt(57, 95), pt(52, 78), pt(57, 61), pt(69, 49)
    ];
    const sunColors = [
        rgb(255, 230, 126), rgb(255, 212, 92), rgb(255, 192, 64),
        rgb(248, 171, 48), rgb(255, 186, 62), rgb(242, 157, 40),
        rgb(255, 178, 54), rgb(255, 199, 76), rgb(255, 218, 102),
        rgb(255, 232, 138), rgb(255, 222, 110), rgb(255, 240, 160)
    ];
    // Arrays start at zero; % wraps the last vertex's next index back to the first to close the polygon.
    // Use pale yellow at the centre and different outer colours to give the faces light and shade.
    for (let i = 0; i < sunEdge.length; i++) {
        drawTriangleBarycentric(
            frame, sunCenter, sunEdge[i], sunEdge[(i + 1) % sunEdge.length],
            rgb(255, 248, 184), sunColors[i], sunColors[i]
        );
    }
    // Each group gives a ray's x0, y0, x1 and y1; draw these segments with the explicit rasteriser.
    const rays = [
        [86, 38, 86, 20], [86, 118, 86, 136],
        [46, 78, 28, 78], [126, 78, 144, 78],
        [48, 40, 34, 26], [124, 40, 138, 26],
        [48, 116, 34, 130], [124, 116, 138, 130]
    ];
    for (const [x0, y0, x1, y1] of rays) {
        drawLineExplicit(frame, x0, y0, x1, y1, rgb(255, 196, 96));
    }
    // Build the clouds from overlapping rectangles.
    fillRect(198, 72, 96, 22, rgb(236, 242, 246));
    fillRect(222, 56, 46, 24, rgb(255, 252, 250));
    fillRect(452, 100, 96, 22, rgb(236, 242, 246));
    fillRect(480, 82, 40, 26, rgb(255, 252, 250));

    // Draw distant hills as two flat-colour triangles, then cover their lower parts with the grass.
    drawTriangleHalfPlane(frame, pt(0, 338), pt(250, 268), pt(430, 348), rgb(138, 176, 132));
    drawTriangleHalfPlane(frame, pt(220, 352), pt(520, 286), pt(639, 346), rgb(112, 164, 118));

    fillQuadColors(
        pt(0, 338), pt(WIDTH - 1, 338), pt(WIDTH - 1, HEIGHT - 1), pt(0, HEIGHT - 1),
        grassTop, grassTop, grassBottom, grassBottom
    );

    // Draw a quadrilateral ground shadow, followed by a path that widens downwards and its side edges.
    fillQuad(pt(160, 366), pt(476, 366), pt(496, 384), pt(144, 384), rgb(78, 132, 64));

    fillQuad(
        pt(286, 360), pt(362, 360), pt(408, 470), pt(236, 470),
        rgb(198, 164, 118)
    );
    drawLineImplicit(frame, 286, 360, 236, 470, rgb(154, 120, 78));
    drawLineImplicit(frame, 362, 360, 408, 470, rgb(154, 120, 78));

    // Place two fence sections behind the house before drawing the walls.
    drawFence(18, 154, 318);
    drawFence(486, 622, 318);
    // Use a rectangular trunk and three triangular foliage layers, drawn from bottom to top.
    fillRect(100, 282, 16, 82, rgb(112, 74, 46));
    drawTriangleHalfPlane(frame, pt(52, 322), pt(164, 322), pt(108, 242), rgb(46, 108, 54));
    drawTriangleHalfPlane(frame, pt(62, 288), pt(154, 288), pt(108, 220), rgb(72, 146, 70));
    drawTriangleHalfPlane(frame, pt(76, 254), pt(140, 254), pt(108, 204), rgb(108, 164, 72));

    // Draw the chimney behind the roof, using horizontal and vertical segments for brick joints.
    fillRect(392, 132, 36, 78, rgb(166, 84, 68));
    for (let y = 146; y <= 196; y += 16) {
        drawLineImplicit(frame, 392, y, 428, y, rgb(124, 58, 50));
    }
    drawLineImplicit(frame, 410, 132, 410, 200, rgb(124, 58, 50));

    // Build the wall from a large rectangle, narrow highlight and shadow strips, and a foundation below.
    fillRect(176, 232, 288, 132, wall);
    fillRect(430, 232, 34, 132, wallShade);
    fillRect(176, 232, 14, 132, rgb(255, 248, 236));
    fillRect(168, 354, 304, 16, rgb(148, 128, 110));
    drawLineImplicit(frame, 168, 354, 472, 354, rgb(110, 92, 78));

    // Define three roof vertices, fill the triangle, then add its outline and decorative lines.
    const roofA = pt(154, 246);
    const roofB = pt(486, 246);
    const roofC = pt(320, 104);
    drawTriangleHalfPlane(frame, roofA, roofB, roofC, roof);
    strokeTriangle(roofA, roofB, roofC, roofLine);
    drawLineExplicit(frame, 210, 214, 320, 128, rgb(214, 120, 98));
    drawLineExplicit(frame, 430, 214, 320, 128, rgb(214, 120, 98));

    // Add the chimney cap and three rectangular smoke blocks after the roof so they remain visible.
    fillRect(384, 118, 52, 16, rgb(124, 58, 50));
    strokeRect(384, 118, 52, 16, rgb(86, 40, 36));
    fillRect(400, 88, 12, 14, rgb(206, 212, 216));
    fillRect(413, 66, 16, 16, rgb(220, 226, 230));
    fillRect(428, 42, 20, 18, rgb(236, 240, 242));

    // Reuse the window function to place one window on each side of the wall.
    drawWindow(214, 262, 58, 50);
    drawWindow(368, 262, 58, 50);

    // Build the attic window from an outer frame, shaded glass and horizontal/vertical dividers.
    fillRect(308, 156, 28, 34, rgb(255, 248, 238));
    fillQuadColors(
        pt(312, 160), pt(332, 160), pt(332, 186), pt(312, 186),
        rgb(186, 224, 232), rgb(186, 224, 232), rgb(120, 176, 198), rgb(120, 176, 198)
    );
    drawLineImplicit(frame, 322, 160, 322, 186, rgb(255, 248, 238));
    drawLineImplicit(frame, 312, 173, 332, 173, rgb(255, 248, 238));

    // Build the door from a filled rectangle, three rectangular outlines and a square handle.
    fillRect(292, 268, 64, 96, rgb(92, 58, 36));
    strokeRect(292, 268, 64, 96, rgb(64, 38, 24));
    strokeRect(302, 278, 44, 36, rgb(64, 38, 24));
    strokeRect(302, 320, 44, 32, rgb(64, 38, 24));
    fillRect(340, 314, 8, 8, rgb(232, 190, 78));

    // Two rectangles of different widths form the steps.
    fillRect(286, 356, 76, 8, rgb(168, 150, 128));
    fillRect(276, 364, 96, 8, rgb(150, 132, 112));

    // Use triangles for shrubs beside the house and small rectangles for coloured ground decorations.
    drawTriangleHalfPlane(frame, pt(444, 354), pt(492, 354), pt(468, 320), rgb(56, 120, 58));
    drawTriangleHalfPlane(frame, pt(474, 360), pt(522, 360), pt(498, 334), rgb(104, 168, 78));
    fillRect(118, 344, 22, 14, rgb(186, 72, 78));
    fillRect(144, 352, 20, 12, rgb(232, 196, 78));
    fillRect(104, 358, 14, 10, rgb(232, 146, 86));

    // Repeat short grass segments, skipping the path; remainders vary their heights and positions deterministically.
    for (let x = 12; x < 628; x += 9) {
        if (x > 230 && x < 420) continue;
        const height = 7 + ((x * 13) % 8);
        const base = 366 + ((x * 5) % 6);
        const color = x % 2 === 0 ? rgb(86, 146, 58) : rgb(154, 196, 92);
        drawLineExplicit(frame, x, base, x + ((x % 7) - 3), base - height, color);
    }

    // Two diagonal segments form a simplified distant bird.
    drawLineExplicit(frame, 340, 42, 356, 34, rgb(48, 58, 72));
    drawLineExplicit(frame, 352, 30, 370, 44, rgb(48, 58, 72));
}

// Reusable window: draw the frame, shaded glass, cross-shaped dividers and the sill below.
function drawWindow(x, y, w, h) {
    fillRect(x - 3, y - 3, w + 6, h + 6, rgb(255, 250, 242));
    strokeRect(x - 3, y - 3, w + 6, h + 6, rgb(150, 116, 84));
    fillQuadColors(
        pt(x, y), pt(x + w, y), pt(x + w, y + h), pt(x, y + h),
        rgb(198, 230, 236), rgb(198, 230, 236), rgb(118, 176, 198), rgb(118, 176, 198)
    );
    drawLineImplicit(frame, x + w / 2, y, x + w / 2, y + h, rgb(255, 250, 242));
    drawLineImplicit(frame, x, y + h / 2, x + w, y + h / 2, rgb(255, 250, 242));
    fillRect(x - 4, y + h + 3, w + 8, 6, rgb(168, 132, 96));
}

// Draw two horizontal rails, then place a rectangular post every 22 pixels with a shadow edge.
function drawFence(x0, x1, y) {
    drawLineImplicit(frame, x0, y + 10, x1, y + 10, rgb(214, 206, 190));
    drawLineImplicit(frame, x0, y + 24, x1, y + 24, rgb(214, 206, 190));
    for (let x = x0; x <= x1; x += 22) {
        fillRect(x, y, 6, 42, rgb(236, 230, 216));
        drawLineImplicit(frame, x + 6, y, x + 6, y + 42, rgb(176, 164, 146));
    }
}

// Redraw once: clear the image, draw the selected mode, upload the pixels and update the status text.
function demo() {
    clear(frame);

    if (mode === "explicit") {
        drawComparisonLines(drawLineExplicit);
    }

    if (mode === "implicit") {
        drawComparisonLines(drawLineImplicit);
    }

    if (mode === "halfplane") {
        drawHalfPlaneDemo();
    }

    if (mode === "barycentric") {
        drawBarycentricDemo();
    }

    if (mode === "house") {
        drawHouse();
    }

    // Geometry is already rasterised in frame; copy the whole image without using Canvas shape-drawing methods.
    const ctx = texture.getContext();
    const image = ctx.createImageData(WIDTH, HEIGHT);
    image.data.set(frame.data);
    ctx.putImageData(image, 0, 0);
    texture.update();

    // Find the selected mode's button and display its text as the current mode name.
    const active = document.querySelector(`button[data-mode="${mode}"]`);
    document.getElementById("status").textContent =
        "Mode: " + (active ? active.textContent : mode);
}

// Attach click handlers to all five buttons; dataset.mode reads each HTML data-mode attribute.
// The arrow function runs when clicked, changes the mode and regenerates the pixel image.
document.querySelectorAll("button[data-mode]").forEach(button => {
    button.addEventListener("click", () => {
        mode = button.dataset.mode;
        demo();
    });
});

// Render the existing texture each frame; software rasterisation runs only on initial load or a mode change.
engine.runRenderLoop(() => scene.render());

// Resize the display when the window changes size; the final demo() draws the initial image.
window.addEventListener("resize", () => engine.resize());

demo();
