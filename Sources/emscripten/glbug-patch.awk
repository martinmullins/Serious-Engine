BEGIN {
  RS = "function";
  FS = "(";
  ORS = "";
  OFS = "(";
}

/^ _emscripten_glDrawElements\(/{ 
  ORS = "\n";
  OFS = "";
  print " _emscripten_glDrawElements(mode, count, type, indices) {";
  print "    var buf;";
  print "    if (!GLctx.currentElementArrayBufferBinding) {";
  print "      var size = GL.calcBufLength(1, type, 0, count);";
  print "      buf = GL.getTempIndexBuffer(size);";
  print "      GLctx.bindBuffer(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/, buf);";
  print "      GLctx.bufferSubData(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/,";
  print "                               0,";
  print "                               HEAPU8.subarray(indices, indices + size));";
  print "      // the index is now 0";
  print "      indices = 0;";
  print "    }";
  print "";
  print "    // bind any client-side buffers";
  print "    GL.preDrawHandleClientVertexAttribBindings(Math.max(globalThis.ctVtx, count));";
  print "";
  print "    GLctx.drawElements(mode, count, type, indices);";
  print "";
  print "    GL.postDrawHandleClientVertexAttribBindings(Math.max(globalThis.ctVtx, count));";
  print "";
  print "    if (!GLctx.currentElementArrayBufferBinding) {";
  print "      GLctx.bindBuffer(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/, null);";
  print "    }";
  print "  }";
  ORS = "";
  $1="";
  print "function _emscripten_glDrawElementsOrig(";
  OFS = "(";
  print "ASDFASDFASDF";
  print $0;
  print RT; 
  next;
}

{
  print $0
  print RT;
}

END {
  # Hacky
  ORS="\n"
  print "() { };"
}
