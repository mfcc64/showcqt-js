
var sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
var pad_string = (arg, len) => String(arg).padStart(len, " ");
var separator = "----------------------------------------------------------------------------------------------------------------------------------------------";

var [{ShowCQT}, {ShowCQTRef}] = await Promise.all([
    import("./showcqt.mjs"),
    import("./showcqt-ref.mjs")
]);

var cqt = await Promise.all([
    ShowCQTRef.instantiate(),
    ShowCQT.instantiate({simd: false}),
    ShowCQT.instantiate()
]);

var result, bottom;
try {
    result = document.getElementById("result");
    bottom = document.getElementById("bottom");
} catch (e) { }

var label = [
    "reference",
    "standard",
    "simd"
];
var grand_calc_time = [ 0, 0, 0 ];
var grand_render_time = [ 0, 0, 0 ];
var grand_total_time = [ 0, 0, 0 ];
var grand_stddev = [ 0, 0, 0 ];
var grand_maxdiff = [ 0, 0, 0 ];
var grand_count = [ 0, 0, 0 ];

let drand_state = 0;
let drand = function() {
    drand_state = (drand_state * 8121 + 28411) % 134456;
    return drand_state / 134456 - 0.5;
};

for (let width of [1920, 1600, 1366, 1280, 960, 683, 333]) {
    for (let height = Math.ceil(width/4); height < width; height *= 2) {
        for (let rate of [96000, 88200, 48000, 44100, 24000, 22050, 11025, 8000]) {
            for (let multi = 0; multi <= 1; multi++) {
                for (let n = 0; cqt[n]; n++)
                    cqt[n].init(rate, width, height - 1, 20, 30, multi);

                for (let x = 0; x < cqt[0].fft_size; x++) {
                    cqt[0].inputs[0][x] = 0.3 * Math.sin(0.001 * x * x) +
                        0.2 * Math.cos(0.0001 * x * x * x) + 0.2 * drand();
                    cqt[0].inputs[1][x] = 0.2 * Math.cos(0.001 * x * x) +
                        0.3 * Math.sin(0.0001 * x * x * x) + 0.2 * drand();
                }

                for (let n = 1; cqt[n]; n++) {
                    for (let x = 0; x < cqt[0].fft_size; x++) {
                        cqt[n].inputs[0][x] = cqt[0].inputs[0][x];
                        cqt[n].inputs[1][x] = cqt[0].inputs[1][x];
                    }
                }
                cqt[0].calc();

                for (let n = 0; cqt[n]; n++) {
                    let calc_time = 0;
                    let render_time = 0;
                    let total_time = 0;
                    let stddev = 0;
                    let maxdiff = 0;

                    for (let m = 0, t0 = performance.now(), delta = 0;
                            delta <= 50;
                            m++, delta = performance.now() - t0, calc_time = delta / m)
                        cqt[n].calc();

                    for (let m = 0, t0 = performance.now(), delta = 0;
                            delta <= 50;
                            m++, delta = performance.now() - t0, render_time = delta / m)
                        for (let y = 0; y < height; y++)
                            cqt[n].render_line_alpha(y, y % 256);

                    total_time = calc_time + render_time;
                    await sleep(1);

                    for (let y = 0; y < height && n; y++) {
                        cqt[n].render_line_alpha(y, y % 256);
                        cqt[0].render_line_alpha(y, y % 256);
                        for (let x = 0; x < 4 * width; x++) {
                            let diff = Math.abs(cqt[n].output[x] - cqt[0].output[x]);
                            maxdiff = Math.max(maxdiff, diff);
                            stddev += diff * diff;
                        }
                    }
                    stddev = Math.sqrt(stddev / (width * height * 4));
                    let str = "name = " + pad_string(label[n], 10) +
                            ", w = " + pad_string(width, 4) +
                            ", h = " + pad_string(height, 4) +
                            ", r = " + pad_string(rate, 5) +
                            ", m = " + multi +
                            ", calc = " + pad_string(Math.round(calc_time * 1000), 7) + " us" +
                            ", render = " + pad_string(Math.round(render_time * 1000), 7) + " us" +
                            ", total = " + pad_string(Math.round(total_time * 1000), 7) + " us" +
                            ", maxdiff = " + pad_string(maxdiff, 3) +
                            ", stddev = " + stddev;
                    console.log(str);
                    if (result) result.textContent += str + "\n";
                    grand_calc_time[n] += calc_time;
                    grand_render_time[n] += render_time;
                    grand_total_time[n] += total_time;
                    grand_stddev[n] += stddev;
                    grand_maxdiff[n] = Math.max(grand_maxdiff[n], maxdiff);
                    grand_count[n]++;
                    bottom?.scrollIntoView();
                    await sleep(10);
                }
                console.log(separator);
                if (result) result.textContent += separator + "\n";
            }
        }
        console.log(separator);
        if (result) result.textContent += separator + "\n";
    }
}

var max_maxdiff = 0;
for (let n = 0; cqt[n]; n++) {
    let str = "name = " + pad_string(label[n], 10) +
            ", w = " + pad_string("avg", 4) +
            ", h = " + pad_string("avg", 4) +
            ", r = " + pad_string("avg", 5) +
            ", m = " + "-" +
            ", calc = " + pad_string(Math.round(grand_calc_time[n] / grand_count[n] * 1000), 7) + " us" +
            ", render = " + pad_string(Math.round(grand_render_time[n] / grand_count[n] * 1000), 7) + " us" +
            ", total = " + pad_string(Math.round(grand_total_time[n] / grand_count[n] * 1000), 7) + " us" +
            ", maxdiff = " + pad_string(grand_maxdiff[n], 3) +
            ", stddev = " + grand_stddev[n] / grand_count[n];
    console.log(str);
    if (result) result.textContent += str + "\n";
    max_maxdiff = Math.max(grand_maxdiff[n], max_maxdiff);
}
bottom?.scrollIntoView();

if (max_maxdiff > 1)
    throw new Error("maxdiff > 1");
