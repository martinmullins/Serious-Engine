#ifndef _REGISTRY_H
#define _REGISTRY_H
#ifdef PRAGMA_ONCE
  #pragma once
#endif

#include <string>
#include <map>
#include <iostream>

class Registry {
public:
  typedef std::map<std::string, void*> map_t;
  typedef std::pair<std::string, void*> pair_t;

  static bool insert(const char* symbol, void* obj);
  static void* lookup(const char* symbol);
  static void dump(); 

private:
 static map_t& RegMap(); 
};

#endif