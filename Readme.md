# ShowCQT
ShowCQT (Constant Q Transfrom) is a javascript audio visualization engine based on
[ffmpeg showcqt filter](https://ffmpeg.org/ffmpeg-filters.html#showcqt).

## Projects
- [Youtube Musical Spectrum](https://github.com/mfcc64/youtube-musical-spectrum) - a browser extension that uses showcqt-js.
- [html5-showcqtbar](https://github.com/mfcc64/html5-showcqtbar) - an example github page that uses showcqt-js.

## Usage
### npm
```
npm i showcqt
```
```js
// only ES module is available
// use default import
import ShowCQT from "showcqt";

// use named import
import { ShowCQT } from "showcqt";

// use dynamic import
const { ShowCQT } = await import("showcqt");
```
### <script>
```html
<!-- use a specific version -->
<script src="https://cdn.jsdelivr.net/npm/showcqt@1.1.2/showcqt.js"></script>

<!-- use the latest version -->
<script src="https://cdn.jsdelivr.net/npm/showcqt/showcqt.js"></script>

<!-- use local copy (only showcqt.js is required to be copied) -->
<script src="showcqt.js"></script>
```

### ES module
```js
// use a specific version
import ShowCQT from "https://cdn.jsdelivr.net/npm/showcqt@1.1.2/showcqt.mjs";

// use the latest version
import ShowCQT from "https://cdn.jsdelivr.net/npm/showcqt/showcqt.mjs";

// use local copy (only showcqt.mjs is required to be copied)
import ShowCQT from "./showcqt.mjs";
```

### Example code
```js
// The output frequency range is fixed between E0 - 50 cents and E10 - 50 cents.
// Instantiate transform context. The context is uninitialized.
var cqt = await ShowCQT.instantiate();

// Initialize transform context. May be called multiple times (reinitialization).
// Constraints:
//     0 < rate <= 96000 (actually slightly above 96000)
//     0 < width <= 7680
//     0 < height <= 4320
//     1.0 <= bar_v (bar height) <= 100.0
//     1.0 <= sono_v (brightness) <= 100.0
//     If supersampling is true, the actual transform will be twice the width.
var rate = audio_ctx.sampleRate;
var width = canvas.width;
var height = canvas.height - 1;
var bar_v = 15;
var sono_v = 25;
var supersampling = true;
cqt.init(rate, width, height, bar_v, sono_v, supersampling);

// Change height at runtime.
height = 256;
cqt.set_height(height - 1);

// Change volume (bar height and brigthness) at runtime.
bar_v = 10;
sono_v = 20;
cqt.set_volume(bar_v, sono_v);

// Set analyser fft size.
analyser_left.fftSize = cqt.fft_size;
analyser_right.fftSize = cqt.fft_size;

function draw() {
    // Set input time domain data.
    analyser_left.getFloatTimeDomainData(cqt.inputs[0]);
    analyser_right.getFloatTimeDomainData(cqt.inputs[1]);
    cqt.calc();

    // Edit temporary color buffer. The array is Float32Array consisting of interleaved red, green, blue, and height channel.
    // The buffer is only valid after cqt.calc() and before cqt.render_line_*().
    // The color range is from 0.0 to 1.0 but it hasn't been clamped to the range. It may contain values greater than 1.0.
    // The initial equations of the colors and the height:
    // red    = sqrt(sono_v * amplitude_left);
    // green  = sqrt(sono_v * sqrt(average(sqr(amplitude_left), sqr(amplitude_right))));
    // blue   = sqrt(sono_v * amplitude_right);
    // height = bar_v * sqrt(average(sqr(amplitude_left), sqr(amplitude_right)));
    // You may edit the temporary color buffer if you want to change color scheme for example.
    for (let x = 0; x < cqt.width * 4; x += 4) {
        let r = cqt.color[x + 0];
        let g = cqt.color[x + 1];
        let b = cqt.color[x + 2];
        let h = cqt.color[x + 3];
        cqt.color[x + 0] = g;
        cqt.color[x + 1] = b;
        cqt.color[x + 2] = r;
        cqt.color[x + 3] = Math.sqrt(h);
    }

    for (let y = 0; y < height; y++) {
        // Render line, result is in cqt.output.
        // equal to cqt.render_line_opaque(y)
        cqt.render_line_alpha(y, 255);
        canvas_buffer.data.set(cqt.output, 4*width*y);
    }
    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
```
