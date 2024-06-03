
import ShowCQT from "./showcqt-main.mjs";
import ShowCQTRef from "./showcqt-ref.mjs";
import {argv} from "node:process";

var name    = argv[2];
var width   = Number(argv[3]);
var height  = Number(argv[4]);
var rate    = Number(argv[5]);
var multi   = Number(argv[6]);

benchmark(name, width, height, rate, multi);

async function benchmark(name, width, height, rate, multi) {
    var cqt     = await (name == "reference" ? ShowCQTRef : ShowCQT).instantiate({simd: name == "simd"});
    cqt.init(rate, width, height - 1, 20, 30, multi);

    for (let x = 0; x < cqt.fft_size; x++) {
        const t = Math.round(x / rate * 1e6);
        cqt.inputs[0][x] = 0.1 * ((t % 100000) / 100000 - (t % 28765) / 28765 + (t % 4341) % 4341 - (t % 256) % 256);
        cqt.inputs[1][x] = 0.1 * ((t % 125000) / 125000 - (t % 18256) / 18256 + (t % 8888) % 8888 - (t % 128) % 128);
    }

    var t0 = performance.now();
    for (let k = 0; k < 1000; k++)
        cqt.calc();
    var t1 = performance.now();
    for (let k = 0; k < 1000; k++) {
        for (let y = 0; y < height; y++)
            cqt.render_line_alpha(y, 255);
    }
    var t2 = performance.now();

    console.log(
        name.padEnd(9),
        String(width).padStart(4),
        String(height).padStart(4),
        String(rate).padStart(5),
        String(multi),
        String(cqt.fft_size).padStart(5),
        (t1 - t0).toFixed(2).padStart(8),
        (t2 - t1).toFixed(2).padStart(8)
    );
}
