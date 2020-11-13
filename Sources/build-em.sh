#!/bin/bash

NCPU=`cat /proc/cpuinfo |grep vendor_id |wc -l`
let NCPU=$NCPU+2
echo "Will build with 'make -j$NCPU' ... please edit this script if incorrect."

GIT_ROOT=$(git rev-parse --show-toplevel)
SRC_ROOT="$GIT_ROOT/Sources"

set -e
set -x

rm -rf cmake-em-build
mkdir cmake-em-build
cd cmake-em-build

#cmake -G Ninja -DCMAKE_BUILD_TYPE=Debug -DCMAKE_C_FLAGS=-m32 -DCMAKE_CXX_FLAGS=-m32 ..
#ninja

emcmake cmake \
  -DECC="$GIT_ROOT/ecc" \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_C_FLAGS=-m32 \
  -DCMAKE_CXX_FLAGS=-m32 \
  -DUSE_I386_NASM_ASM=FALSE \
  "$SRC_ROOT"

echo "Then the rest..."
emmake make ParseEntities
emmake make VERBOSE=1 EntitiesMP

#mv Debug Bin
#mv ssam* Bin/
#cp -vr "$SRC_ROOT"/../template/* ./

cd -
