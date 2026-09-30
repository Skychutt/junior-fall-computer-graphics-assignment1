import {
    WIDTH, HEIGHT, createFramebuffer, clear, rgb,
    drawLineExplicit, drawLineImplicit,
    drawTriangleHalfPlane, drawTriangleBarycentric
} from "./rasterization.js";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

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

const plane = BABYLON.MeshBuilder.CreatePlane(
    "framebuffer",
    { width: 2, height: 2 },
    scene
);

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

const frame = createFramebuffer();
let mode = new URLSearchParams(location.search).get("mode") || "explicit";

function pt(x, y) {
    return { x, y };
}

function fillQuad(a, b, c, d, color) {
    drawTriangleHalfPlane(frame, a, b, c, color);
    drawTriangleHalfPlane(frame, a, c, d, color);
}

function fillQuadColors(a, b, c, d, ca, cb, cc, cd) {
    drawTriangleBarycentric(frame, a, b, c, ca, cb, cc);
    drawTriangleBarycentric(frame, a, c, d, ca, cc, cd);
}

function fillRect(x, y, w, h, color) {
    fillQuad(
        pt(x, y),
        pt(x + w, y),
        pt(x + w, y + h),
        pt(x, y + h),
        color
    );
}

function strokeRect(x, y, w, h, color) {
    drawLineImplicit(frame, x, y, x + w, y, color);
    drawLineImplicit(frame, x + w, y, x + w, y + h, color);
    drawLineImplicit(frame, x + w, y + h, x, y + h, color);
    drawLineImplicit(frame, x, y + h, x, y, color);
}

function fillEllipse(cx, cy, rx, ry, inner, outer) {
    const steps = Math.max(16, Math.round((rx + ry) * 0.45));
    for (let i = 0; i < steps; i++) {
        const a0 = (i / steps) * Math.PI * 2;
        const a1 = ((i + 1) / steps) * Math.PI * 2;
        drawTriangleBarycentric(
            frame,
            pt(cx, cy),
            pt(cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry),
            pt(cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry),
            inner,
            outer,
            outer
        );
    }
}

function strokeTriangle(A, B, C, color) {
    drawLineImplicit(frame, A.x, A.y, B.x, B.y, color);
    drawLineImplicit(frame, B.x, B.y, C.x, C.y, color);
    drawLineImplicit(frame, C.x, C.y, A.x, A.y, color);
}

function drawComparisonLines(drawLine) {
    drawLine(frame, 36, 78, 604, 132, rgb(35, 35, 35));
    drawLine(frame, 36, 190, 604, 190, rgb(186, 52, 48));
    drawLine(frame, 48, 430, 592, 248, rgb(36, 96, 184));
    drawLine(frame, 150, 36, 246, 452, rgb(34, 138, 72));
    drawLine(frame, 500, 28, 500, 452, rgb(132, 64, 176));
    drawLine(frame, 78, 450, 210, 250, rgb(40, 40, 40));
}

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

function drawHouse() {
    const skyTop = rgb(118, 182, 222);
    const skyHorizon = rgb(255, 214, 168);
    const grassTop = rgb(116, 176, 82);
    const grassBottom = rgb(70, 138, 60);
    const wall = rgb(248, 240, 224);
    const wallShade = rgb(214, 190, 164);
    const roof = rgb(176, 68, 54);
    const roofLine = rgb(112, 40, 36);

    fillQuadColors(
        pt(0, 0), pt(WIDTH - 1, 0), pt(WIDTH - 1, 352), pt(0, 352),
        skyTop, skyTop, skyHorizon, skyHorizon
    );

    for (let i = 0; i < 10; i++) {
        const angle = -Math.PI * 0.85 + i * (Math.PI * 0.7 / 9);
        const x0 = 86 + Math.cos(angle) * 48;
        const y0 = 78 + Math.sin(angle) * 48;
        const x1 = 86 + Math.cos(angle) * 78;
        const y1 = 78 + Math.sin(angle) * 78;
        drawLineExplicit(frame, x0, y0, x1, y1, rgb(255, 196, 96));
    }
    fillEllipse(86, 78, 40, 40, rgb(255, 246, 196), rgb(255, 176, 62));

    fillEllipse(214, 82, 26, 18, rgb(255, 252, 250), rgb(236, 242, 246));
    fillEllipse(246, 74, 34, 24, rgb(255, 252, 250), rgb(236, 242, 246));
    fillEllipse(280, 84, 24, 16, rgb(255, 252, 250), rgb(236, 242, 246));
    fillEllipse(470, 108, 22, 15, rgb(255, 252, 250), rgb(236, 242, 246));
    fillEllipse(500, 98, 30, 20, rgb(255, 252, 250), rgb(236, 242, 246));
    fillEllipse(534, 110, 20, 14, rgb(255, 252, 250), rgb(236, 242, 246));

    drawTriangleHalfPlane(frame, pt(0, 338), pt(250, 268), pt(430, 348), rgb(138, 176, 132));
    drawTriangleHalfPlane(frame, pt(220, 352), pt(520, 286), pt(639, 346), rgb(112, 164, 118));

    fillQuadColors(
        pt(0, 338), pt(WIDTH - 1, 338), pt(WIDTH - 1, HEIGHT - 1), pt(0, HEIGHT - 1),
        grassTop, grassTop, grassBottom, grassBottom
    );

    fillEllipse(320, 372, 168, 16, rgb(78, 132, 64), rgb(78, 132, 64));

    fillQuad(
        pt(286, 360), pt(362, 360), pt(408, 470), pt(236, 470),
        rgb(198, 164, 118)
    );
    drawLineImplicit(frame, 286, 360, 236, 470, rgb(154, 120, 78));
    drawLineImplicit(frame, 362, 360, 408, 470, rgb(154, 120, 78));

    drawFence(18, 154, 318);
    drawFence(486, 622, 318);

    fillRect(96, 286, 24, 78, rgb(112, 74, 46));
    fillEllipse(108, 268, 40, 34, rgb(46, 108, 54), rgb(72, 146, 70));
    fillEllipse(78, 286, 28, 24, rgb(58, 124, 60), rgb(86, 156, 74));
    fillEllipse(142, 284, 30, 26, rgb(52, 116, 58), rgb(96, 164, 78));
    fillEllipse(112, 242, 24, 20, rgb(150, 190, 96), rgb(108, 164, 72));

    fillRect(392, 132, 36, 78, rgb(166, 84, 68));
    for (let y = 146; y <= 196; y += 16) {
        drawLineImplicit(frame, 392, y, 428, y, rgb(124, 58, 50));
    }
    drawLineImplicit(frame, 410, 132, 410, 200, rgb(124, 58, 50));

    fillRect(176, 232, 288, 132, wall);
    fillRect(430, 232, 34, 132, wallShade);
    fillRect(176, 232, 14, 132, rgb(255, 248, 236));
    fillRect(168, 354, 304, 16, rgb(148, 128, 110));
    drawLineImplicit(frame, 168, 354, 472, 354, rgb(110, 92, 78));

    const roofA = pt(154, 246);
    const roofB = pt(486, 246);
    const roofC = pt(320, 104);
    drawTriangleHalfPlane(frame, roofA, roofB, roofC, roof);
    strokeTriangle(roofA, roofB, roofC, roofLine);
    drawLineExplicit(frame, 210, 214, 320, 128, rgb(214, 120, 98));
    drawLineExplicit(frame, 430, 214, 320, 128, rgb(214, 120, 98));

    fillRect(384, 118, 52, 16, rgb(124, 58, 50));
    strokeRect(384, 118, 52, 16, rgb(86, 40, 36));
    fillEllipse(404, 96, 10, 8, rgb(226, 230, 234), rgb(206, 212, 216));
    fillEllipse(418, 78, 14, 11, rgb(236, 240, 242), rgb(214, 220, 224));
    fillEllipse(430, 58, 18, 13, rgb(244, 246, 248), rgb(220, 226, 230));

    drawWindow(214, 262, 58, 50);
    drawWindow(368, 262, 58, 50);

    fillRect(308, 156, 28, 34, rgb(255, 248, 238));
    fillQuadColors(
        pt(312, 160), pt(332, 160), pt(332, 186), pt(312, 186),
        rgb(186, 224, 232), rgb(186, 224, 232), rgb(120, 176, 198), rgb(120, 176, 198)
    );
    drawLineImplicit(frame, 322, 160, 322, 186, rgb(255, 248, 238));
    drawLineImplicit(frame, 312, 173, 332, 173, rgb(255, 248, 238));

    fillRect(292, 268, 64, 96, rgb(92, 58, 36));
    strokeRect(292, 268, 64, 96, rgb(64, 38, 24));
    strokeRect(302, 278, 44, 36, rgb(64, 38, 24));
    strokeRect(302, 320, 44, 32, rgb(64, 38, 24));
    fillEllipse(344, 318, 5, 5, rgb(232, 190, 78), rgb(186, 140, 48));

    fillRect(286, 356, 76, 8, rgb(168, 150, 128));
    fillRect(276, 364, 96, 8, rgb(150, 132, 112));

    fillEllipse(470, 338, 28, 16, rgb(56, 120, 58), rgb(86, 154, 72));
    fillEllipse(498, 346, 22, 14, rgb(64, 132, 62), rgb(104, 168, 78));
    fillEllipse(132, 348, 18, 12, rgb(186, 72, 78), rgb(214, 96, 86));
    fillEllipse(154, 356, 14, 10, rgb(214, 170, 54), rgb(232, 196, 78));
    fillEllipse(118, 358, 12, 9, rgb(214, 112, 64), rgb(232, 146, 86));

    for (let x = 12; x < 628; x += 9) {
        if (x > 230 && x < 420) continue;
        const height = 7 + ((x * 13) % 8);
        const base = 366 + ((x * 5) % 6);
        const color = x % 2 === 0 ? rgb(86, 146, 58) : rgb(154, 196, 92);
        drawLineExplicit(frame, x, base, x + ((x % 7) - 3), base - height, color);
    }

    drawLineExplicit(frame, 340, 42, 356, 34, rgb(48, 58, 72));
    drawLineExplicit(frame, 352, 30, 370, 44, rgb(48, 58, 72));
}

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

function drawFence(x0, x1, y) {
    drawLineImplicit(frame, x0, y + 10, x1, y + 10, rgb(214, 206, 190));
    drawLineImplicit(frame, x0, y + 24, x1, y + 24, rgb(214, 206, 190));
    for (let x = x0; x <= x1; x += 22) {
        fillRect(x, y, 6, 42, rgb(236, 230, 216));
        drawLineImplicit(frame, x + 6, y, x + 6, y + 42, rgb(176, 164, 146));
    }
}

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

    const ctx = texture.getContext();
    const image = ctx.createImageData(WIDTH, HEIGHT);
    image.data.set(frame.data);
    ctx.putImageData(image, 0, 0);
    texture.update();

    const active = document.querySelector(`button[data-mode="${mode}"]`);
    document.getElementById("status").textContent =
        "Mode: " + (active ? active.textContent : mode);
}

document.querySelectorAll("button[data-mode]").forEach(button => {
    button.addEventListener("click", () => {
        mode = button.dataset.mode;
        demo();
    });
});

engine.runRenderLoop(() => scene.render());

window.addEventListener("resize", () => engine.resize());

demo();
