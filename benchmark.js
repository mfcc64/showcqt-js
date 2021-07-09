
{
    let pad_string = function(arg, len) {
        var str = "" + arg;
        while (str.length < len)
            str = " " + str;
        return str;
    };

    let sleep = function(ms) {
        return new Promise(function(resolve){ setTimeout(resolve, ms); });
    };

    let benchmark = async function() {
        const bench_count = 100;
        var result = document.getElementById("result");
        var bottom = document.getElementById("bottom");
        var cqt = [
            await ShowCQTRef.instantiate(),
            await ShowCQT.instantiate({simd: false}),
            await ShowCQT.instantiate({simd: true})
        ];
        var label = [
            "reference",
            "standard",
            "simd"
        ];

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

                            for (let m = 0; m < bench_count; m++) {
                                let t0 = performance.now();
                                cqt[n].calc();
                                let t1 = performance.now();
                                for (let y = 0; y < height; y++)
                                    cqt[n].render_line_alpha(y, y % 256);
                                let t2 = performance.now();
                                calc_time += t1 - t0;
                                render_time += t2 - t1;
                                total_time += t2 - t0;
                                if (m % 10 == 0)
                                    await sleep(1);
                            }

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
                            var str = "name = " + pad_string(label[n], 10) +
                                    ", w = " + pad_string(width, 4) +
                                    ", h = " + pad_string(height, 4) +
                                    ", r = " + pad_string(rate, 5) +
                                    ", m = " + multi +
                                    ", calc = " + pad_string(Math.round(calc_time / bench_count * 1000), 7) + " us" +
                                    ", render = " + pad_string(Math.round(render_time / bench_count * 1000), 7) + " us" +
                                    ", total = " + pad_string(Math.round(total_time / bench_count * 1000), 7) + " us" +
                                    ", maxdiff = " + pad_string(maxdiff, 3) +
                                    ", stddev = " + stddev + "\n";
                            result.textContent += str;
                            bottom.scrollIntoView();
                            await sleep(10);
                        }
                        result.textContent += "---------------------------------------------------------------" +
                            "-------------------------------------------------------------------------------\n";
                    }
                }
                result.textContent += "---------------------------------------------------------------" +
                    "-------------------------------------------------------------------------------\n";
            }
        }
    };

    addEventListener("load", benchmark);
}
