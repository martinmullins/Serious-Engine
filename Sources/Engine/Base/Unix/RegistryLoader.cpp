#include <Engine/Base/Unix/RegistryLoader.h>
#include <Registry.h>

void CRegistryLoader::SetError(const char* sym)
{
  std::string errMsg("Cannot find symbol in registry: ");
  errMsg += sym;
  err = new CTString(errMsg.c_str());
}

const char *CRegistryLoader::GetError(void)
{
  return ((err) ? (const char *)(*err) : NULL);
}

void *CRegistryLoader::FindSymbol(const char *sym)
{
  printf("RegistryLoader: Looking for symbol ^ %s\n", sym);
  fflush(stdout);
  void *reg = Registry::lookup(sym);
  if (!reg) {
    printf("RegistryLoader: FAILED! for symbol ^ %s\n", sym);
    fflush(stdout);
    SetError(sym);
  }
  return reg;
}

CRegistryLoader::CRegistryLoader(const char *libname)
    : err(NULL)
{
}

CRegistryLoader::~CRegistryLoader(void)
{
  if (err) {
    delete err;
  }
}

CDynamicLoader *CDynamicLoader::GetInstance(const char *libname)
{
    return(new CRegistryLoader(libname));
}

CTFileName CDynamicLoader::ConvertLibNameToPlatform(const char *libname)
{
    CTFileName fnm = CTString("ConvertLibNameToPlatform_should_not_be_called_for_registry_loading");
    return fnm;
}

