
CC=clang
CFLAGS=-O2 -fvisibility=hidden --target=wasm32
LD=wasm-ld
LDFLAGS=--no-entry --export-dynamic --allow-undefined --gc-sections -O3 --lto-O3

.PHONY: clean all
all: showcqt.js
clean:
	rm -frv *.o *.wasm showcqt.js

showcqt.o: showcqt.c showcqt.h
	$(CC) showcqt.c $(CFLAGS) -c -o showcqt.o

showcqt-simd.o: showcqt.c showcqt.h
	$(CC) showcqt.c $(CFLAGS) $(SIMDFLAGS) -c -o showcqt-simd.o

showcqt.wasm: showcqt.o
	$(LD) showcqt.o $(LDFLAGS) -o showcqt.wasm

showcqt.js: embed-base64 showcqt-template.js showcqt.wasm
	./embed-base64
