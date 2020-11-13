#!/bin/bash

NCPU=`cat /proc/cpuinfo |grep vendor_id |wc -l`
let NCPU=$NCPU+2
echo "Will build with 'make -j$NCPU' ... please edit this script if incorrect."

GIT_ROOT=$(git rev-parse --show-toplevel)
SRC_ROOT="$GIT_ROOT/Sources"

set -e
set -x

cm() {
  rm -rf cmake-em-build
  mkdir cmake-em-build
  pushd cmake-em-build

  emcmake cmake \
    -DECC="$GIT_ROOT/ecc" \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_C_FLAGS=-m32 \
    -DCMAKE_CXX_FLAGS=-m32 \
    -DUSE_I386_NASM_ASM=FALSE \
    "$SRC_ROOT"


   popd
}

mk() {
  echo "Then the rest..."
  emmake make -C cmake-em-build ParseEntities
  emmake make -C cmake-em-build EntitiesMP
  emmake make -C cmake-em-build GameMP
  emmake make -C cmake-em-build Shaders
  emmake make -C cmake-em-build
}

mktarg() {
  if [[ -n "$1" ]]; then
    emmake make -C cmake-em-build VERBOSE=1 "$1"
  else
    emmake make -C cmake-em-build VERBOSE=1 
  fi
}

cpfiles() {
  cp -vr "$GIT_ROOT"/template/* cmake-em-build/
}

serveit() {
  serve "$GIT_ROOT"/cmake-em-build/
}

$*
#mv Debug Bin
#mv ssam* Bin/
#cp -vr "$SRC_ROOT"/../template/* ./

