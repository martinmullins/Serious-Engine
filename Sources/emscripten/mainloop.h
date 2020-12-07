#ifndef __MAINLOOP_H
#define __MAINLOOP_H

#ifdef EMSCRIPTEN
#include <emscripten.h>
#include <map>
#include <Engine/Base/Console.h>

//#define DBG(a) a
#define DBG(a)

#ifdef RETPTR
#undef RETPTR
void (*retfn)() = 0;
std::map<void*, int> fnState;
#else
extern void (*retfn)();
extern std::map<void*, int> fnState;
#endif

#define DECFN(nx) \
  void nx();

#define DECFNEX(nx) \
  extern void nx();

#define DECFNARGS(nx, ...) \
  DECFN(nx) \
  struct { __VA_ARGS__ } nx##_args; \

#define TOSTR(x) #x
#define TOSTRING(x) TOSTR(x)

#define NEXTFN(nx) retfn = nx; DBG(CPrintF("NEXTFN: " TOSTRING(nx) "\n"));

#define BEGINFN(nx) \
  } \
  void nx() { \
  DBG(CPrintF("BEGIN: " TOSTRING(nx) "\n")); \
  retfn = NULL;

#define __CAT(A, B) A##B

#define __FLD(nx, fld) __CAT( nx, _args).fld

#define PUSHARG(nx, typ, fld) \
   __FLD(nx, fld) = fld;

#define POPARG(nx, typ, fld) \
  typ fld = __FLD(nx, fld);



#define emBegin DBG(CPrintF("  begin: %s %d\n", __func__, fnState[(void*)(__func__)])); switch(fnState[(void*)(__func__)]) { case 0:
#define emReturn do { DBG(CPrintF("   emreturn: %s %d\n", __func__, __LINE__)); fnState[(void*)(__func__)]=__LINE__;  emscripten_exit_with_live_runtime(); case __LINE__:; } while (0);
#define emFinish } fnState[(void*)(__func__)]=0;
#define emDone fnState[(void*)(__func__)]=0;
#define emQuit emscripten_exit_with_live_runtime();
#define emArg static


#else
#define DECFN(...)
#define DECFNARGS(...)
#define NEXTFN(...)
#define BEGINFN(...)
#define PUSHARG(...)
#define POPARG(...)

#define emBegin
#define emReturn
#define emFinish
#define emDone
#define emQuit
#define emArg

#endif


#endif