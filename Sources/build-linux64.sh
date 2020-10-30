#!/bin/bash

NCPU=`cat /proc/cpuinfo |grep vendor_id |wc -l`
let NCPU=$NCPU+2
echo "Will build with 'make -j$NCPU' ... please edit this script if incorrect."

GIT_ROOT=$(git rev-parse --show-toplevel)
SRC_ROOT="$GIT_ROOT/Sources"

set -e
set -x

rm -rf cmake-build
mkdir cmake-build
cd cmake-build

#cmake -G Ninja -DCMAKE_BUILD_TYPE=Debug -DCMAKE_C_FLAGS=-m32 -DCMAKE_CXX_FLAGS=-m32 ..
#ninja

# This is the eventual path for amd64.
cmake -DCMAKE_BUILD_TYPE=Release "$SRC_ROOT"

# Right now we force x86, though...
#cmake -DCMAKE_BUILD_TYPE=Debug -DCMAKE_C_FLAGS=-m32 -DCMAKE_CXX_FLAGS=-m32 ..
echo "ECC first"
make ecc
echo "Then the rest..."
make -j$NCPU

mv Debug Bin
mv ssam* Bin/
cp -vr "$SRC_ROOT"/template/* ./

cd -
