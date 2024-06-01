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

/* Audio visualization based on showcqt mpv/ffmpeg audio visualization */
/* See https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/avf_showcqt.c */

#ifndef SHOWCQT_H_INCLUDED
#define SHOWCQT_H_INCLUDED 1

#include <stdint.h>

#define WASM_EXPORT extern __attribute__((__visibility__("default")))
#define WASM_IMPORT extern __attribute__((__nothrow__))
#define DECLARE_ALIGNED(n) __attribute__((__aligned__(n)))
#define ALWAYS_INLINE __inline__ __attribute__((__always_inline__, __nodebug__))

/* minimalist math.h definition */
#define M_PI 3.14159265358979323846
#define M_LN2 0.693147180559945309417

WASM_IMPORT double sin(double);
WASM_IMPORT double cos(double);
WASM_IMPORT double log(double);
WASM_IMPORT double exp(double);
WASM_IMPORT double ceil(double);
WASM_IMPORT double floor(double);
WASM_IMPORT float sqrtf(float);

#ifndef WASM_SIMD
#define WASM_SIMD 0
#endif

#if WASM_SIMD
#define WASM_SIMD_FUNCTION __attribute__((__target__("simd128")))
#else
#define WASM_SIMD_FUNCTION
#endif

#define MAX_FFT_SIZE 32768
#define MAX_WIDTH 7680
#define MAX_HEIGHT 4320
#define MAX_KERNEL_SIZE (6*256*1024)
#define MIN_VOL 1.0f
#define MAX_VOL 100.0f

typedef struct Complex {
    float re, im;
} Complex;

typedef struct ColorF {
    float r, g, b, h;
} ColorF;

#if WASM_SIMD
typedef float   float32x4   __attribute__((__vector_size__(16), __aligned__(16)));
typedef float   float32x4u  __attribute__((__vector_size__(16), __aligned__(4)));
typedef int32_t int32x4     __attribute__((__vector_size__(16), __aligned__(16)));
typedef uint32_t uint32x4   __attribute__((__vector_size__(16), __aligned__(16)));
typedef uint8_t uint8x16    __attribute__((__vector_size__(16), __aligned__(16)));

typedef struct Complex4 {
    float32x4 re, im;
} Complex4;

typedef struct ColorF4 {
    float32x4 r, g, b, h;
} ColorF4;
#endif

typedef struct KernelIndex {
    int len;
    int start;
} KernelIndex;

typedef struct ShowCQT {
    /* args */
    float       input[2][MAX_FFT_SIZE+64];
    unsigned    output[MAX_WIDTH];

    /* tables */
    Complex     exp_tbl[MAX_FFT_SIZE+MAX_FFT_SIZE/4];
    int16_t     perm_tbl[MAX_FFT_SIZE/4];
    float       attack_tbl[MAX_FFT_SIZE/8];
    uint8_t     padding[1024];

    /* buffers */
    Complex     fft_buf[MAX_FFT_SIZE+128];
    ColorF      color_buf[MAX_WIDTH*2];
    float       rcp_h_buf[MAX_WIDTH];

    /* kernel */
    KernelIndex kernel_index[MAX_WIDTH*2];
    float       kernel[MAX_KERNEL_SIZE];

    /* props */
    int         width;
    int         height;
    int         aligned_width;
    int         fft_size;
    int         t_size;
    int         attack_size;
    float       sono_v;
    float       bar_v;
    int         prerender;
} ShowCQT;

#endif
