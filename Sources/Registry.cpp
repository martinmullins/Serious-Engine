#include "Registry.h"

Registry::map_t& Registry::RegMap() {
  static map_t mapt;
  return mapt;
}

bool Registry::insert(const char* symbol, void* obj) {
  RegMap().insert(pair_t(std::string(symbol), obj));
  return true;
}

void* Registry::lookup(const char* symbol) {
  map_t::const_iterator it;
  it = RegMap().find(std::string(symbol));
  if (it != RegMap().end()) {
    return it->second;
  }
  return (void*)0;
}

void Registry::dump() {
  for(map_t::const_iterator it = RegMap().begin(); it != RegMap().end(); ++it) {
    std::cout << it->first << "::" << it->second << std::endl;
  }
}