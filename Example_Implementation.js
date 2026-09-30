

//          *** Explicit Line Rasterization Function - Rasteriztion file ***

    // TODO Part A:
    // Implement y = mx + b.
    // Remember that x0 === x1 needs separate handling.

    if (x0 === x1) {
        const ys = Math.min(y0, y1);
        const ye = Math.max(y0, y1);
        for (let y = Math.ceil(ys); y <= Math.floor(ye); y++) {
            setPixel(frame, x0, y, color);
        }
        return;
    }

    if (x0 > x1) {
        [x0, x1] = [x1, x0];
        [y0, y1] = [y1, y0];
    }

    const m = (y1 - y0) / (x1 - x0);
    const b = y0 - m * x0;

    for (let x = Math.ceil(x0); x <= Math.floor(x1); x++) {
        const y = m * x + b;
        setPixel(frame, x, y, color);
    }


////////////////////////////////////////
///////////////////////////////////////


//              ***  Draw Explicit Line - Main file  ***

        // Add horizontal, vertical and steep examples.
        drawLineExplicit(frame, 80, 80, 560, 180, rgb(20,20,20));
        drawLineExplicit(frame, 80, 400, 560, 400, rgb(20,20,20));
        drawLineExplicit(frame, 320, 60, 320, 420, rgb(20,20,20));
        drawLineExplicit(frame, 80, 400, 220, 100, rgb(20,20,20));
