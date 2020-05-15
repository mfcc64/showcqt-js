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
const wasm_embedded_base64 = "" +
"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" +
"CiAEQYiAAmoiEyoCACILlCABQYz4lYAAaioCACIMIARBjIACaiIUKgIAIg2UkyIOIAFBiPiUgABq" +
"KgIAIhUgBEGIgANqIhYqAgAiF5QgAUGM+JSAAGoqAgAiGCAPKgIAIhmUkyIakyIbkjgCACAWIARB" +
"CGoiBCoCACIcIAYgA5QgBSAHlJMiA5MiBSALIAyUIAogDZSSIgYgFyAYlCAVIBmUkiIHkyIKkzgC" +
"ACAUIAIgCJIiAiAGIAeSIgaTOAIAIBMgHCADkiIDIA4gGpIiB5M4AgAgEiAJIBuTOAIAIBEgBSAK" +
"kjgCACAQIAIgBpI4AgAgBCADIAeSOAIAIAFBCGoiAUH4/wBHDQALC+kECAF/An0Bfwp9Bn8BfQF/" +
"Bn0gABCQgICAACAAQYAQahCQgICAACAAQYAgahCQgICAACAAQYAwahCQgICAACAAQYQwaiIBKgIA" +
"IQIgASAAKgIEIgMgAEGEEGoiBCoCACIFkyIGIAAqAoAgIgcgACoCgDAiCJMiCZI4AgAgACAAKgIA" +
"IgogACoCgBAiC5MiDCAAQYQgaiIBKgIAIg0gApMiDpM4AoAwIAEgAyAFkiIDIA0gApIiApM4AgAg" +
"ACAKIAuSIgUgByAIkiIHkzgCgCAgBCAGIAmTOAIAIAAgDCAOkjgCgBAgACADIAKSOAIEIAAgBSAH" +
"kjgCAEEAIQEDQCAAIAFqIgRBjDBqIg8gBEEMaiIQKgIAIgIgBEGIEGoiESoCACIDIAFBjJiSgABq" +
"KgIAIgWUIAFBiJiSgABqKgIAIgYgBEGMEGoiEioCACIHlJIiCJMiCSABQYi4koAAaioCACIKIARB" +
"iCBqIhMqAgAiC5QgAUGMuJKAAGoqAgAiDCAEQYwgaiIUKgIAIg2UkyIOIAFBiKiSgABqKgIAIhUg" +
"BEGIMGoiFioCACIXlCABQYyokoAAaioCACIYIA8qAgAiGZSTIhqTIhuSOAIAIBYgBEEIaiIEKgIA" +
"IhwgBiADlCAFIAeUkyIDkyIFIAsgDJQgCiANlJIiBiAXIBiUIBUgGZSSIgeTIgqTOAIAIBQgAiAI" +
"kiICIAYgB5IiBpM4AgAgEyAcIAOSIgMgDiAakiIHkzgCACASIAkgG5M4AgAgESAFIAqSOAIAIBAg" +
"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" +
"CiANlJIiBiAXIBiUIBUgGZSSIgeTIgqTOAIAIBQgAiAIkiICIAYgB5IiBpM4AgAgEyAcIAOSIgMg" +
"DiAakiIHkzgCACASIAkgG5M4AgAgESAFIAqSOAIAIBAgAiAGkjgCACAEIAMgB5I4AgAgAUEIaiIB" +
"QfgHRw0ACwvpBAgBfwJ9AX8KfQZ/AX0BfwZ9IAAQk4CAgAAgAEGAAWoQk4CAgAAgAEGAAmoQk4CA" +
"gAAgAEGAA2oQk4CAgAAgAEGEA2oiASoCACECIAEgACoCBCIDIABBhAFqIgQqAgAiBZMiBiAAKgKA" +
"AiIHIAAqAoADIgiTIgmSOAIAIAAgACoCACIKIAAqAoABIguTIgwgAEGEAmoiASoCACINIAKTIg6T" +
"OAKAAyABIAMgBZIiAyANIAKSIgKTOAIAIAAgCiALkiIFIAcgCJIiB5M4AoACIAQgBiAJkzgCACAA" +
"IAwgDpI4AoABIAAgAyACkjgCBCAAIAUgB5I4AgBBACEBA0AgACABaiIEQYwDaiIPIARBDGoiECoC" +
"ACICIARBiAFqIhEqAgAiAyABQYz6kYAAaioCACIFlCABQYj6kYAAaioCACIGIARBjAFqIhIqAgAi" +
"B5SSIgiTIgkgAUGI/JGAAGoqAgAiCiAEQYgCaiITKgIAIguUIAFBjPyRgABqKgIAIgwgBEGMAmoi" +
"FCoCACINlJMiDiABQYj7kYAAaioCACIVIARBiANqIhYqAgAiF5QgAUGM+5GAAGoqAgAiGCAPKgIA" +
"IhmUkyIakyIbkjgCACAWIARBCGoiBCoCACIcIAYgA5QgBSAHlJMiA5MiBSALIAyUIAogDZSSIgYg" +
"FyAYlCAVIBmUkiIHkyIKkzgCACAUIAIgCJIiAiAGIAeSIgaTOAIAIBMgHCADkiIDIA4gGpIiB5M4" +
"AgAgEiAJIBuTOAIAIBEgBSAKkjgCACAQIAIgBpI4AgAgBCADIAeSOAIAIAFBCGoiAUH4AEcNAAsL" +
"4QkOBn0BfwF9AX8EfQF/AX0BfwJ9AX8DfQF/A30DfyAAIAAqAgAiASAAKgIIIgKSIgMgACoCECIE" +
"IAAqAhgiBZIiBpM4AhAgACADIAaSIgM4AgAgAEEcaiIHKgIAIQYgByAAKgIEIgggAEEMaiIJKgIA" +
"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" +
"ACARIAUgCpI4AgAgECACIAaSOAIAIAQgAyAHkjgCACABQQhqIgFB+AFHDQALC+YECAF/An0Bfwp9" +
"Bn8BfQF/Bn0gABCWgICAACAAQcAAahCWgICAACAAQYABahCWgICAACAAQcABahCWgICAACAAQcQB" +
"aiIBKgIAIQIgASAAKgIEIgMgAEHEAGoiBCoCACIFkyIGIAAqAoABIgcgACoCwAEiCJMiCZI4AgAg" +
"ACAAKgIAIgogACoCQCILkyIMIABBhAFqIgEqAgAiDSACkyIOkzgCwAEgASADIAWSIgMgDSACkiIC" +
"kzgCACAAIAogC5IiBSAHIAiSIgeTOAKAASAEIAYgCZM4AgAgACAMIA6SOAJAIAAgAyACkjgCBCAA" +
"IAUgB5I4AgBBACEBA0AgACABaiIEQcwBaiIPIARBDGoiECoCACICIARByABqIhEqAgAiAyABQYz5" +
"kYAAaioCACIFlCABQYj5kYAAaioCACIGIARBzABqIhIqAgAiB5SSIgiTIgkgAUGI+pGAAGoqAgAi" +
"CiAEQYgBaiITKgIAIguUIAFBjPqRgABqKgIAIgwgBEGMAWoiFCoCACINlJMiDiABQcj5kYAAaioC" +
"ACIVIARByAFqIhYqAgAiF5QgAUHM+ZGAAGoqAgAiGCAPKgIAIhmUkyIakyIbkjgCACAWIARBCGoi" +
"BCoCACIcIAYgA5QgBSAHlJMiA5MiBSALIAyUIAogDZSSIgYgFyAYlCAVIBmUkiIHkyIKkzgCACAU" +
"IAIgCJIiAiAGIAeSIgaTOAIAIBMgHCADkiIDIA4gGpIiB5M4AgAgEiAJIBuTOAIAIBEgBSAKkjgC" +
"ACAQIAIgBpI4AgAgBCADIAeSOAIAIAFBCGoiAUE4Rw0ACwvRBAsDfQF/DX0BfwF9AX8BfQF/AX0B" +
"fwN9IAAgACoCACIBIAAqAggiApMiAzgCCCAAQQxqIgQgACoCBCIFIAQqAgAiBpMiBzgCACAAIAEg" +
"ApIiASAAKgIQIgIgACoCGCIIkiIJkiIKIAAqAiAiCyAAKgIoIgySIg0gACoCMCIOIAAqAjgiD5Ii" +
"EJIiEZI4AgAgACAKIBGTOAIgIABBFGoiEiAFIAaSIgUgEioCACIGIABBHGoiEioCACIKkiIRkyIT" +
"IA0gEJMiDZM4AgAgAEEkaiIUIAUgEZIiBSAUKgIAIhAgAEEsaiIUKgIAIhGSIhUgAEE0aiIWKgIA" +
"IhcgAEE8aiIYKgIAIhmSIhqSIhuTOAIAIAAgASAJkyIBIBUgGpMiCZM4AjAgFiATIA2SOAIAIAAg" +
"ASAJkjgCECAAIAUgG5I4AgQgGCAHIAIgCJMiAUEAKgKs+JGAACIClEEAKgKo+JGAACIFIAYgCpMi" +
"BpSSIgiTIglBACoCyPiRgAAiCiALIAyTIguUQQAqAsz4kYAAIgwgECARkyINlJMiEEEAKgK4+JGA" +
"ACIRIA4gD5MiDpRBACoCvPiRgAAiDyAXIBmTIhOUkyIVkyIXkjgCACAAIAMgBSABlCACIAaUkyIB" +
"kyICIAsgDJQgCiANlJIiBSAOIA+UIBEgE5SSIgaTIgqTOAI4IBQgByAIkiIHIAUgBpIiBZM4AgAg" +
"ACADIAGSIgMgECAVkiIBkzgCKCASIAkgF5M4AgAgACACIAqSOAIYIAQgByAFkjgCACAAIAMgAZI4" +
"AggLAKQCBG5hbWUBnAIXAANsb2cBA2NvcwIDc2luAwNleHAED2dldF9pbnB1dF9hcnJheQUQZ2V0" +
"X291dHB1dF9hcnJheQYEaW5pdAcEY2FsYwgNZmZ0X2NhbGNfNDA5NgkNZmZ0X2NhbGNfODE5MgoN" +
"ZmZ0X2NhbGNfMTAyNAsNZmZ0X2NhbGNfMjA0OAwRcmVuZGVyX2xpbmVfYWxwaGENEnJlbmRlcl9s" +
"aW5lX29wYXF1ZQ4Kc2V0X3ZvbHVtZQ8Kc2V0X2hlaWdodBAMZmZ0X2NhbGNfMjU2EQxmZnRfY2Fs" +
"Y181MTISC2ZmdF9jYWxjXzY0EwtmZnRfY2FsY18xNhQMZmZ0X2NhbGNfMTI4FQtmZnRfY2FsY18z" +
"MhYKZmZ0X2NhbGNfOAA9CXByb2R1Y2VycwEMcHJvY2Vzc2VkLWJ5AQVjbGFuZx0xMC4wLjAgKEZl" +
"ZG9yYSAxMC4wLjAtMS5mYzMyKQ==";

    let decode64 = function(b64) {
        var str = atob(b64);
        var buf = new Uint8Array(str.length);
        for (var k = 0; k < str.length; k++)
            buf[k] = str.charCodeAt(k);
        return buf;
    }

    let wasm_module_promise = WebAssembly.compile(decode64(wasm_embedded_base64));
    let wasm_imports = {
        env: {
            cos: Math.cos,
            sin: Math.sin,
            log: Math.log,
            exp: Math.exp
        }
    };

    var ShowCQT = {
        instantiate: async function() {
            var instance = await WebAssembly.instantiate(await wasm_module_promise, wasm_imports);
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
