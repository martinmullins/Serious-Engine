#ifndef _REGISTRY_LOADER_H
#define _REGISTRY_LOADER_H
#ifdef PRAGMA_ONCE
  #pragma once
#endif

#include <Engine/Engine.h>
#include <Engine/Base/DynamicLoader.h>

#include "Registry.h"

class CRegistryLoader : public CDynamicLoader
{
public:
    CRegistryLoader(const char *libname);
    virtual ~CRegistryLoader(void);
    virtual void *FindSymbol(const char *sym);
    virtual const char *GetError(void);

protected:
    void SetError(const char* sym);
    CTString *err;
};

#endif