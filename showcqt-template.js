/*
 * Copyright (c) 2020 Muhammad Faiz <mfcc64@gmail.com>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */

/* Audio visualization based on showcqt mpv/ffmpeg audio visualization */
/* See https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/avf_showcqt.c */
/* The output frequency range is fixed between E0 - 50 cents and E10 - 50 cents. */

/*
 * Example usage:
 *
 * // Instantiate transform context. The context is uninitialized.
 * var cqt = await ShowCQT.instantiate();
 *
 * // Initialize transform context. May be called multiple times (reinitialization).
 * // Constraints:
 * //     0 < rate <= 96000 (actually slightly above 96000)
 * //     0 < width <= 7680
 * //     0 < height <= 4320
 * //     1.0 <= bar_v (bar height) <= 100.0
 * //     1.0 <= sono_v (brightness) <= 100.0
 * //     If supersampling is true, the actual transform will be twice the width.
 * var rate = audio_ctx.sampleRate;
 * var width = canvas.width;
 * var height = canvas.height;
 * var bar_v = 15;
 * var sono_v = 25;
 * cqt.init(rate, width, height, bar_v, sono_v, supersampling);
 *
 * // Change height at runtime.
 * height = 256;
 * cqt.set_height(height);
 *
 * // Change volume (bar height and brigthness) at runtime.
 * bar_v = 10;
 * sono_v = 20;
 * cqt.set_volume(bar_v, sono_v);
 *
 * // Set analyser fft size.
 * analyser_left.fftSize = cqt.fft_size;
 * analyser_right.fftSize = cqt.fft_size;
 *
 * function draw() {
 *     // Set input time domain data.
 *     analyser_left.getFloatTimeDomainData(cqt.inputs[0]);
 *     analyser_right.getFloatTimeDomainData(cqt.inputs[1]);
 *     cqt.calc();
 *     for (let y = 0; y < height; y++) {
 *         // Render line, result is in cqt.output.
 *         // equal to cqt.render_line_opaque(y)
 *         cqt.render_line_alpha(y, 255);
 *         canvas_buffer.data.set(cqt.output, 4*width*y);
 *     }
 *     requestAnimationFrame(draw);
 * }
 * requestAnimationFrame(draw);
 *
 */

{
//wasm_embedded_base64

//wasm_simd_embedded_base64

    let decode64 = function(b64) {
        var str = atob(b64);
        var buf = new Uint8Array(str.length);
        for (var k = 0; k < str.length; k++)
            buf[k] = str.charCodeAt(k);
        return buf;
    }

    let wasm_module_promise = WebAssembly.compile(decode64(wasm_embedded_base64));
    let wasm_simd_module_promise = WebAssembly.compile(decode64(wasm_simd_embedded_base64));
    let wasm_imports = {
        env: {
            cos: Math.cos,
            sin: Math.sin,
            log: Math.log,
            exp: Math.exp
        }
    };

    var ShowCQT = {
        instantiate: async function(opt) {
            var instance = null;
            var simd = false;
            if (opt && opt.simd !== undefined)
                simd = opt.simd;
            if (simd) {
                try {
                    instance = await WebAssembly.instantiate(await wasm_simd_module_promise, wasm_imports);
                    console.log("ShowCQT: SIMD is enabled");
                } catch(e) {
                    console.error(e);
                }
            }
            if (!instance) {
                instance = await WebAssembly.instantiate(await wasm_module_promise, wasm_imports);
                console.log("ShowCQT: SIMD is disabled");
            }
            var exports = instance.exports;
            var buffer = exports.memory.buffer;
            return {
                fft_size: 0,
                width: 0,
                init: function(rate, width, height, bar_v, sono_v, supersampling) {
                    this.width = width;
                    this.fft_size = exports.init(rate, width, height, bar_v, sono_v, supersampling);
                    if (!this.fft_size)
                        throw new Error("ShowCQT init: cannot initialize ShowCQT");
                    this.inputs = [
                        new Float32Array(buffer, exports.get_input_array(0), this.fft_size),
                        new Float32Array(buffer, exports.get_input_array(1), this.fft_size)
                    ];
                    this.output = new Uint8ClampedArray(buffer, exports.get_output_array(), this.width * 4);
                },
                calc: exports.calc,
                render_line_alpha: exports.render_line_alpha,
                render_line_opaque: exports.render_line_opaque,
                set_volume: exports.set_volume,
                set_height: exports.set_height
            }
        }
    };
}
