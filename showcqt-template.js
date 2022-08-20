/*
 * Copyright (c) 2020 Muhammad Faiz <mfcc64@gmail.com>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
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

/* https://github.com/mfcc64/showcqt-js */
/* Audio visualization based on showcqt mpv/ffmpeg audio visualization */
/* See https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/avf_showcqt.c */
/* The output frequency range is fixed between E0 - 50 cents and E10 - 50 cents. */

{
//wasm_embedded_base64

//wasm_simd_embedded_base64

    let decode64 = function(b64) {
        var str = atob(b64);
        var buf = new Uint8Array(str.length);
        for (var k = 0; k < str.length; k++)
            buf[k] = str.charCodeAt(k);
        return buf;
    };

    let wasm_module_promise = null;
    let wasm_simd_module_promise = null;
    let wasm_imports = {
        env: {
            cos: Math.cos,
            sin: Math.sin,
            log: Math.log,
            exp: Math.exp
        }
    };

    let invalid_func = function() {
        throw new Error("ShowCQT is not initialized");
    };

    let cqt_uninit = function(cqt) {
        cqt.fft_size = 0;
        cqt.width = 0;
        cqt.inputs = null;
        cqt.output = null;
        cqt.color = null;
        cqt.calc = invalid_func;
        cqt.render_line_alpha = invalid_func;
        cqt.render_line_opaque = invalid_func;
        cqt.set_height = invalid_func;
        cqt.set_volume = invalid_func;
    };

    var ShowCQT = {
        instantiate: async function(opt) {
            var instance = null;
            var simd = true;
            if (opt && opt.simd !== undefined)
                simd = opt.simd;
            if (simd) {
                try {
                    if (!wasm_simd_module_promise)
                        wasm_simd_module_promise = WebAssembly.compile(decode64(wasm_simd_embedded_base64));
                    instance = await WebAssembly.instantiate(await wasm_simd_module_promise, wasm_imports);
                } catch(e) {
                    console.warn(e);
                }
            }
            if (!instance) {
                if (!wasm_module_promise)
                    wasm_module_promise = WebAssembly.compile(decode64(wasm_embedded_base64));
                instance = await WebAssembly.instantiate(await wasm_module_promise, wasm_imports);
            }
            var exports = instance.exports;
            var buffer = exports.memory.buffer;

            var retval = {
                init: function(rate, width, height, bar_v, sono_v, supersampling) {
                    cqt_uninit(this);
                    this.fft_size = exports.init(rate, width, height, bar_v, sono_v, supersampling);
                    if (!this.fft_size)
                        throw new Error("ShowCQT init: cannot initialize ShowCQT");
                    this.width = width;
                    this.inputs = [
                        new Float32Array(buffer, exports.get_input_array(0), this.fft_size),
                        new Float32Array(buffer, exports.get_input_array(1), this.fft_size)
                    ];
                    this.color = new Float32Array(buffer, exports.get_color_array(), this.width * 4);
                    this.output = new Uint8ClampedArray(buffer, exports.get_output_array(), this.width * 4);
                    this.calc = exports.calc;
                    this.render_line_alpha = exports.render_line_alpha;
                    this.render_line_opaque = exports.render_line_opaque;
                    this.set_height = exports.set_height;
                    this.set_volume = exports.set_volume;
                }
            };
            cqt_uninit(retval);
            return retval;
        }
    };
}
