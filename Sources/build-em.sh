#!/bin/bash

NCPU=`cat /proc/cpuinfo |grep vendor_id |wc -l`
let NCPU=$NCPU+2
echo "Will build with 'make -j$NCPU' ... please edit this script if incorrect."

GIT_ROOT=$(git rev-parse --show-toplevel)
SRC_ROOT="$GIT_ROOT/Sources"

set -e
set -x

BLD_LOC="cmake-em-build"
BLD_TYPE="RelWithDebInfo"
if [[ "$1" == "rel" ]]; then
  BLD_LOC="cmake-rel"
  BLD_TYPE="Release"
  shift
fi



clean() {
  rm -rf $BLD_LOC
  mkdir $BLD_LOC
}

cm() {
  mkdir -p $BLD_LOC
  pushd $BLD_LOC

  emcmake cmake \
    -DECC="$GIT_ROOT/ecc" \
    -DCMAKE_BUILD_TYPE=$BLD_TYPE \
    -DCMAKE_C_FLAGS=-m32 \
    -DCMAKE_CXX_FLAGS=-m32 \
    -DUSE_I386_NASM_ASM=FALSE \
    -DUSE_ASM=FALSE \
    -DSTATICALLY_LINKED=ON \
    -DNOX11=ON \
    -DNOEGL=ON \
    -DSTATICLIB=ON \
    -DTFE=TRUE \
    "$SRC_ROOT"


   popd
}

mktarg() {
  if [[ -n "$1" ]]; then
    emmake make -C $BLD_LOC VERBOSE=1 "$1"
  else
    emmake make -C $BLD_LOC VERBOSE=1 
  fi
}

cpfiles() {
  cp -vr "$GIT_ROOT"/template/* $BLD_LOC/
}

serveit() {
  npx serve "$GIT_ROOT"/$BLD_LOC/
}

$*
#mv Debug Bin
#mv ssam* Bin/
#cp -vr "$SRC_ROOT"/../template/* ./

