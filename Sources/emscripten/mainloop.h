#ifndef __MAINLOOP_H
#define __MAINLOOP_H

#ifdef EMSCRIPTEN

#ifdef RETPTR
#undef RETPTR
void (*retfn)() = 0;
#else
extern void (*retfn)();
#endif

#define DECFN(nx) \
  void nx();

#define DECFNARGS(nx, ...) \
  DECFN(nx) \
  struct { __VA_ARGS__ } nx##_args; \

#define NEXTFN(nx) retfn = nx;

#define BEGINFN(nx) \
  } \
  void nx() { \
  retfn = NULL;

#define __CAT(A, B) A##B

#define __FLD(nx, fld) __CAT( nx, _args).fld

#define PUSHARG(nx, typ, fld) \
   __FLD(nx, fld) = fld;

#define POPARG(nx, typ, fld) \
  typ fld = __FLD(nx, fld);

#else
#define DECFN(nx)
#define DECFNARGS(nx)
#define NEXTFN(nx)
#define BEGINFN(nx)
#define PUSHARG(nx, typ, fld)
#define POPARG(nx, typ, fld)
#endif


#endif