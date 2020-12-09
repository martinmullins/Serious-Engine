cmake_minimum_required(VERSION 3.18)
project(SeriousEngine)

# Set @rpath for Mac OS X shared library install names.
#cmake_policy(SET CMP0042 NEW)

# Use system SDL2 is on by default
option(USE_SYSTEM_SDL2 "Use systems sdl2 development files" On)
option(USE_SYSTEM_ZLIB "Use systems zlib development files" On)
option(USE_CCACHE "Set to ON to use ccache if present in the system" ${USE_CCACHE})
option(STATICALLY_LINKED "Set to build ssam statically" OFF)


# fallback for cmake versions without add_compile_options # RAKE! Borrowed from dhewm3 project
if(NOT COMMAND add_compile_options)
	function(add_compile_options)
		foreach(arg ${ARGN})
			set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${arg}" PARENT_SCOPE)
			set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${arg}" PARENT_SCOPE)
		endforeach()
	endfunction()
endif()

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_SOURCE_DIR}/cmake")
include(CheckCXXCompilerFlag)

# ssam expects the libs to be in Debug/
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${PROJECT_BINARY_DIR}/Debug)

if(USE_CCACHE)
    find_program(CCACHE_FOUND ccache)
    if(CCACHE_FOUND)
        set_property(GLOBAL PROPERTY RULE_LAUNCH_COMPILE ccache)
        set_property(GLOBAL PROPERTY RULE_LAUNCH_LINK ccache)
    endif()
endif()

if( ${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
  set(USE_FLAGS "-s FULL_ES2=1 -s USE_SDL=2 -s USE_ZLIB=1 -s USE_OGG=1 -s USE_VORBIS=1 -s DISABLE_EXCEPTION_CATCHING=0 -s SAFE_HEAP=0 -s STACK_OVERFLOW_CHECK=2 -s ASSERTIONS=1")
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${USE_FLAGS}")
  set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${USE_FLAGS}")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${USE_FLAGS}")
  set(CMAKE_EXECUTABLE_SUFFIX .html)
  add_compile_definitions(__linux__)
  #add_compile_definitions(__i386__)
  #add_compile_definitions(__i386)
  #add_compile_definitions(__x86_64__)
  #add_compile_definitions(__x86_64)
  set(EMSCRIPTEN TRUE)
  if (NOT STATICALLY_LINKED)
    set_property(GLOBAL PROPERTY TARGET_SUPPORTS_SHARED_LIBS TRUE)
    set(EM_LIB_COMPILE_FLAGS "-s EXPORT_ALL=1 -s SIDE_MODULE=1 -s ALLOW_MEMORY_GROWTH=1")
    set(EM_LIB_LINK_FLAGS "-s ERROR_ON_UNDEFINED_SYMBOLS=0 -s EXPORT_ALL=1 -s SIDE_MODULE=1 -s ALLOW_MEMORY_GROWTH=1 -shared")
  else()
    set(EM_LIB_COMPILE_FLAGS "-s ALLOW_MEMORY_GROWTH=1")
    set(EM_LIB_LINK_FLAGS "")
  endif()
endif()

if(STATICALLY_LINKED)
  message("Building ssam for static runtime")
  add_definitions(-DSTATICALLY_LINKED)
  set (LIB_TYPE STATIC)
else()
  message("Building ssam for dynamic runtime")
  set (LIB_TYPE SHARED)
endif()


# Use systemwide SDL2 or custom build
# RAKE!: Find a way to use their custom built library if
# they want to use that instead or if their system only
# allows for a setup like this. Maybe use a SDL2_DIR var or
# some thing set in the system enviroment.
if(NOT USE_SYSTEM_SDL2)
    include_directories(${CMAKE_SOURCE_DIR}/External/SDL2)
else()
    if( ${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
        message("Using emscripten sdl2 port")
    else()
        find_package(SDL2 REQUIRED)
        if(SDL2_FOUND)
        include_directories(${SDL2_INCLUDE_DIR})
        else()
            message(FATAL_ERROR "Error USE_SYSTEM_SDL2 is set but neccessary developer files are missing")
        endif()
    endif()
endif()

if(USE_SYSTEM_ZLIB)
    if( ${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
        message("Using emscripten zlib port")
    else()
      find_package(ZLIB REQUIRED)
      if(ZLIB_FOUND)
          include_directories(${ZLIB_INCLUDE_DIRS})
      else()
          message(FATAL_ERROR "Error! USE_SYSTEM_ZLIB is set but neccessary developer files are missing")
      endif()
    endif()
endif()

# RAKE! Where to install the binaries.
if(CMAKE_INSTALL_PREFIX STREQUAL "/usr/local" OR CMAKE_INSTALL_PREFIX STREQUAL "") # Only works for linux since I don't
                                                                                   # know what default is for windows/macos/freebsd.
    set(CMAKE_INSTALL_PREFIX "${CMAKE_SOURCE_DIR}/../") # set install path to project root directory since
                                                        # since one wasn't set during config
    set(LOCAL_INSTALL TRUE)
endif()

# Set up some sanity stuff...
if(CMAKE_SYSTEM_NAME STREQUAL "Linux" OR CMAKE_SYSTEM_NAME MATCHES "GNU|kFreeBSD")
    SET(LINUX TRUE)
endif()
if(CMAKE_SYSTEM_NAME STREQUAL "FreeBSD")
    SET(FREEBSD TRUE)
endif()
if(APPLE)
    SET(MACOSX TRUE)
endif()
if(MSVC)
    SET(WINDOWS TRUE)
endif()

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Debug CACHE STRING "None Debug Release RelWithDebInfo MinSizeRel" FORCE)
endif()
SET(DEBUG FALSE)
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    SET(DEBUG TRUE)
endif()

## ** RAKE! start compiler specific flags section **
## ** RAKE! Borrowed from dhewm3 project, need to **
## ** RAKE! clean up for SeriousEngine use. Also  **
## ** RAKE! need to make this pandora safe.	  **
# compiler specific flags
if(CMAKE_COMPILER_IS_GNUCC OR CMAKE_C_COMPILER_ID STREQUAL "Clang")
	# This section and the like are for flags/defines that can be shared between 
	# c and c++ compile options
	add_compile_options(-Wall)
	add_compile_options(-pipe)
	add_compile_options(-fPIC)
	if(NOT PANDORA AND NOT PYRA)
		add_compile_options(-march=native)
	endif()
	if(CMAKE_SYSTEM_PROCESSOR MATCHES "^arm.*")
		if(PYRA)
		add_compile_options(-mfpu=neon-vfpv4)
		else()
		add_compile_options(-mfpu=neon)
		endif()
	endif()
        add_compile_options(-fno-strict-aliasing)
	add_definitions(-D_REENTRANT=1)
	add_definitions(-D_MT=1)

        ## Add your custom C and CXX flags on the command line aka -DCMAKE_C_FLAGS=-std=c98 or -DCMAKE_CXX_FLAGS=-std=c++11

	## For C flags
        set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS} -g -D_DEBUG=1 -DDEBUG=1 -O0")
        if(PANDORA)
            set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g -O3 -faligned-new -ffast-math")
            set(CMAKE_C_FLAGS_RELWITHDEBINFO "${CMAKE_C_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g -O3  -faligned-new -ffast-math")
            set(CMAKE_C_FLAGS_MINSIZEREL "${CMAKE_C_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -Os -ffast-math")
	elseif(PYRA)
            set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g -O3 -marm -faligned-new -ffast-math")
            set(CMAKE_C_FLAGS_RELWITHDEBINFO "${CMAKE_C_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g -O3 -marm -faligned-new -ffast-math")
            set(CMAKE_C_FLAGS_MINSIZEREL "${CMAKE_C_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -Os -marm -ffast-math")
        elseif(EMSCRIPTEN)
            set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS} -O3")
            set(CMAKE_C_FLAGS_RELWITHDEBINFO "${CMAKE_C_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g4")
            set(CMAKE_C_FLAGS_MINSIZEREL "${CMAKE_C_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g4")
        else()
            set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g -O3 -fno-unsafe-math-optimizations")
            set(CMAKE_C_FLAGS_RELWITHDEBINFO "${CMAKE_C_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g -O3 -fno-unsafe-math-optimizations")
            set(CMAKE_C_FLAGS_MINSIZEREL "${CMAKE_C_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -Os -fno-unsafe-math-optimizations")
        endif()

	## For C++ flags
        set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS} -g -D_DEBUG=1 -DDEBUG=1 -O0")
        if(PANDORA)
            set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -O3  -faligned-new -ffast-math")
            set(CMAKE_CXX_FLAGS_RELWITHDEBINFO "${CMAKE_CXX_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g -O3  -faligned-new -ffast-math")
            set(CMAKE_CXX_FLAGS_MINSIZEREL "${CMAKE_CXX_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -Os -ffast-math")
	elseif(PYRA)
            set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -O3 -marm -faligned-new -ffast-math")
            set(CMAKE_CXX_FLAGS_RELWITHDEBINFO "${CMAKE_CXX_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g -O3 -marm -faligned-new -ffast-math")
            set(CMAKE_CXX_FLAGS_MINSIZEREL "${CMAKE_CXX_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -Os -marm -ffast-math")
        elseif (EMSCRIPTEN)
            set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS} -O3")
            set(CMAKE_CXX_FLAGS_RELWITHDEBINFO "${CMAKE_CXX_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g4") ## RAKE! Does -DNDEBUG=1 and -D_NDEBUG=1 mess with RelWithDebInfo?
            set(CMAKE_CXX_FLAGS_MINSIZEREL "${CMAKE_CXX_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -Os -g4")
        else()
            set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -O3 -fno-unsafe-math-optimizations")
            set(CMAKE_CXX_FLAGS_RELWITHDEBINFO "${CMAKE_CXX_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -g -O3 -fno-unsafe-math-optimizations") ## RAKE! Does -DNDEBUG=1 and -D_NDEBUG=1 mess with RelWithDebInfo?
            set(CMAKE_CXX_FLAGS_MINSIZEREL "${CMAKE_CXX_FLAGS} -DNDEBUG=1 -D_NDEBUG=1 -Os -fno-unsafe-math-optimizations")
        endif()

	# TODO fix these warnings
	add_compile_options(-Wno-switch)
	add_compile_options(-Wno-char-subscripts)
	add_compile_options(-Wno-unknown-pragmas)
	add_compile_options(-Wno-unused-variable) # TODO: maybe only enable this for Entities
	add_compile_options(-Wno-unused-value)    # same here (the Scripts generate tons of unused variables and values)
	add_compile_options(-Wno-missing-braces)
	add_compile_options(-Wno-overloaded-virtual)
	add_compile_options(-Wno-invalid-offsetof)
	#MESSAGE(WARNING, "re-enable some of the warnings some day!")

	if(CMAKE_CXX_COMPILER_ID MATCHES "Clang" OR CMAKE_CXX_COMPILER_ID MATCHES "AppleClang")
		# !!! FIXME: turn a bunch of these off, this is just for now. I hope.  --ryan.
		add_compile_options(-Wno-c++11-compat-deprecated-writable-strings)
	endif()

	if(MACOSX)
		add_definitions(-DPLATFORM_UNIX=1)
    		add_definitions(-DPLATFORM_MACOSX=1)
    		add_definitions(-DPRAGMA_ONCE=1)
	elseif(WINDOWS)
		add_definitions(-DPLATFORM_WIN32=1)
    		add_definitions(-DPRAGMA_ONCE=1)
                add_definitions(-D_CRT_SECURE_NO_WARNINGS=1)
                add_definitions(-D_CRT_SECURE_NO_DEPRECATE=1)
	elseif(LINUX)
	    	set(CMAKE_SKIP_RPATH ON CACHE BOOL "Skip RPATH" FORCE)
    		add_definitions(-DPLATFORM_UNIX=1)
    		add_definitions(-D_FILE_OFFSET_BITS=64)
    		add_definitions(-D_LARGEFILE_SOURCE=1)
    		add_definitions(-DPRAGMA_ONCE=1)
	elseif(FREEBSD)
    		set(CMAKE_SKIP_RPATH ON CACHE BOOL "Skip RPATH" FORCE)
    		add_definitions(-DPLATFORM_UNIX=1)
    		add_definitions(-DPLATFORM_FREEBSD=1)
    		add_definitions(-D_FILE_OFFSET_BITS=64)
    		add_definitions(-D_LARGEFILE_SOURCE=1)
    		add_definitions(-DPRAGMA_ONCE=1)
    		include_directories("/usr/local/include")
	endif()
	
        if(MACOSX OR LINUX OR FREEBSD)
		add_compile_options(-pthread)
                add_compile_options(-fsigned-char)
	endif()

	if(CMAKE_COMPILER_IS_GNUCC)
	    	# !!! FIXME: turn a bunch of these off, this is just for now. I hope.  --ryan.
    		add_compile_options(-Wno-invalid-offsetof)
	endif()

elseif(MSVC) # RAKE! I don't know if this will build with MSVC
	add_compile_options(/W4)
	add_compile_options(/wd4100) # unreferenced formal parameter
	add_compile_options(/wd4127) # conditional expression is constant
	add_compile_options(/wd4244) # possible loss of data
	add_compile_options(/wd4245) # signed/unsigned mismatch
	add_compile_options(/wd4267) # possible loss of data
	add_compile_options(/wd4714) # 'function' marked as __forceinline not inlined
	add_compile_options(/wd4996) # 'function': was declared deprecated
	add_compile_options(/wd4068) # unknown pragma
        set(CMAKE_C_FLAGS_DEBUG "-D_DEBUG /Od /Zi /MDd")
	set(CMAKE_C_FLAGS_RELEASE "/Ox /Oy /MD")
	set(CMAKE_C_FLAGS_RELWITHDEBINFO "/Ox /Oy /Zi /MD")
	set(CMAKE_C_FLAGS_MINSIZEREL "/Ox /Oy /Os /MD")
else()
	message(FATAL_ERROR "Unsupported compiler")
endif()

## ** RAKE! end compiler specific flags section **

if(DEBUG)
    set(DEBUGSUFFIX "D")
else()
    set(DEBUGSUFFIX "")
endif()

option(USE_ASM "Use ASM code" TRUE)
if (USE_ASM)
    MESSAGE(STATUS "Using assembler code (when available)")
else()
    add_definitions(-DUSE_PORTABLE_C=1)
    MESSAGE(STATUS "Using portable C instead of all ASM")
endif()

option(USE_I386_NASM_ASM "Use i386 nasm ASM code" FALSE)

if (USE_ASM AND USE_I386_NASM_ASM)
    # You need the Netwide Assembler (NASM) to build this on Intel systems.
    #   http://nasm.sf.net/
    add_definitions(-DUSE_I386_NASM_ASM=1)
    if (MACOSX)
        set(ASMOBJFMT "macho")
        list(APPEND ASMFLAGS --prefix _)
    elseif(WINDOWS)
        set(ASMOBJFMT "win32")
    else()
        set(ASMOBJFMT "elf")
    endif()
    MESSAGE(STATUS "Using i386 nasm ASM")
else()
    MESSAGE(STATUS "Not using i386 nasm ASM")
endif()

option(PANDORA "Compile for Pandora" FALSE)
if (PANDORA)
    add_definitions(-DPLATFORM_PANDORA=1)
endif()

option(PYRA "Compile for Pyra" FALSE)
if (PYRA)
    add_definitions(-DPLATFORM_PYRA=1)
endif()

option(USE_TREMOR "Use Tremor instead of Vorbis" FALSE)
if (USE_TREMOR)
    add_definitions(-DUSE_TREMOR=1)
endif()

option(TFE "Compile a The First Encounter version" FALSE)
if (TFE)
 add_definitions(-DFIRST_ENCOUNTER=1)
 set(MP "")
else()
 set(MP "MP")
endif()


# !!! FIXME: I currently force this, but you shouldn't _have_ to.
option(USE_SINGLE_THREAD "Use Single Threaded version" TRUE)
if(USE_SINGLE_THREAD)
 add_definitions(-DSINGLE_THREADED=1)
endif()


include_directories(
    .
    ${CMAKE_SOURCE_DIR}/External/libogg/include
)
if(USE_TREMOR)
if(PANDORA)
    include_directories(/mnt/utmp/codeblocks/usr/include/tremor)
else()
    # !!!Do something here!
endif()
else()
    include_directories(External/libvorbis/include)
endif()

# We build ECC, then use it to generate C++ code for the game entities...
macro(add_parser_and_scanner _PARSER _SCANNER)
    add_custom_command(
        OUTPUT "${CMAKE_CURRENT_SOURCE_DIR}/${_SCANNER}.cpp"
        MAIN_DEPENDENCY "${CMAKE_CURRENT_SOURCE_DIR}/${_SCANNER}.l"
        WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
        COMMAND flex
        ARGS -o${_SCANNER}.cpp ${_SCANNER}.l
    )

    add_custom_command(
        OUTPUT "${CMAKE_CURRENT_SOURCE_DIR}/${_PARSER}.cpp" "${CMAKE_CURRENT_SOURCE_DIR}/${_PARSER}.hpp"
        MAIN_DEPENDENCY "${CMAKE_CURRENT_SOURCE_DIR}/${_PARSER}.y"
        WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
        COMMAND bison
        ARGS -o${_PARSER}.cpp ${_PARSER}.y -d
    )

    add_custom_command(
        OUTPUT "${CMAKE_CURRENT_SOURCE_DIR}/${_PARSER}.h"
        MAIN_DEPENDENCY "${CMAKE_CURRENT_SOURCE_DIR}/${_PARSER}.hpp"
        WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
        COMMAND ${CMAKE_COMMAND}
        ARGS -E copy ${_PARSER}.hpp ${_PARSER}.h
    )
endmacro()

# Build ECC from source if there wasn't a prebuilt-one specified on the command line.
#  Normally we build it here, but we might need a prebuilt, native binary if
#  we're cross-compiling the rest of the game.
if(NOT ECC)
    add_parser_and_scanner("Ecc/Parser" "Ecc/Scanner")
    add_executable(ecc Ecc/Main.cpp Ecc/Parser.cpp Ecc/Parser.h Ecc/Scanner.cpp)
    set(ECC "ecc")
endif()

macro(entity _NAME)
    add_custom_command(
        OUTPUT "${CMAKE_CURRENT_SOURCE_DIR}/${_NAME}.cpp" "${CMAKE_CURRENT_SOURCE_DIR}/${_NAME}.h" "${CMAKE_CURRENT_SOURCE_DIR}/${_NAME}_tables.h"
        MAIN_DEPENDENCY "${CMAKE_CURRENT_SOURCE_DIR}/${_NAME}.es"
        DEPENDS ${ECC}
        WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
        COMMAND ${ECC}
        ARGS "${_NAME}.es"
    )
    list(APPEND ENTITIES_CPP "${CMAKE_CURRENT_SOURCE_DIR}/${_NAME}.cpp")
    list(APPEND ENTITIES_H "${CMAKE_CURRENT_SOURCE_DIR}/${_NAME}.h")
    list(APPEND ENTITIES_H "${CMAKE_CURRENT_SOURCE_DIR}/${_NAME}_tables.h")
endmacro()

set(ENTITIES_CPP "")
set(ENTITIES_H "")
entity(Engine/Classes/BaseEvents)
entity(Engine/Classes/MovableBrushEntity)
entity(Engine/Classes/MovableEntity)
entity(Engine/Classes/MovableModelEntity)
entity(Engine/Classes/PlayerEntity)
set(ENGINE_ENTITIES_CPP ${ENTITIES_CPP})

set(ENTITIES_CPP "")
if(TFE)
 entity(Entities/Acid)
 entity(Entities/AirWave)
 entity(Entities/AmmoItem)
 entity(Entities/AmmoPack)
 entity(Entities/AnimationChanger)
 entity(Entities/AnimationHub)
 entity(Entities/ArmorItem)
 entity(Entities/BackgroundViewer)
 entity(Entities/BasicEffects)
 entity(Entities/Beast)
 entity(Entities/BigHead)
 entity(Entities/BlendController)
 entity(Entities/BloodSpray)
 entity(Entities/Boneman)
 entity(Entities/Bouncer)
 entity(Entities/Bullet)
 entity(Entities/Camera)
 entity(Entities/CameraMarker)
 entity(Entities/CannonBall)
 entity(Entities/Catman)
 entity(Entities/Copier)
 entity(Entities/Counter)
 entity(Entities/CrateRider)
 entity(Entities/CyborgBike)
 entity(Entities/Cyborg)
 entity(Entities/Damager)
 entity(Entities/Debris)
 entity(Entities/DestroyableArchitecture)
 entity(Entities/Devil)
 entity(Entities/DevilMarker)
 entity(Entities/DevilProjectile)
 entity(Entities/DoorController)
 entity(Entities/Dragonman)
 entity(Entities/EffectMarker)
 entity(Entities/Effector)
 entity(Entities/Elemental)
 entity(Entities/EnemyBase)
 entity(Entities/EnemyCounter)
 entity(Entities/EnemyDive)
 entity(Entities/EnemyFly)
 entity(Entities/EnemyMarker)
 entity(Entities/EnemyRunInto)
 entity(Entities/EnemySpawner)
 entity(Entities/EnvironmentBase)
 entity(Entities/EnvironmentMarker)
 entity(Entities/Eruptor)
 entity(Entities/Eyeman)
 entity(Entities/Fish)
 entity(Entities/Fishman)
 entity(Entities/Flame)
 entity(Entities/FogMarker)
 #entity(Entities/GhostBusterRay)
 entity(Entities/Gizmo)
 entity(Entities/Global)
 entity(Entities/GradientMarker)
 entity(Entities/GravityMarker)
 entity(Entities/GravityRouter)
 entity(Entities/HazeMarker)
 entity(Entities/Headman)
 entity(Entities/HealthItem)
 entity(Entities/Huanman)
 entity(Entities/Item)
 entity(Entities/KeyItem)
 entity(Entities/Light)
 entity(Entities/Lightning)
 entity(Entities/LightStyle)
 entity(Entities/Mamut)
 entity(Entities/Mamutman)
 entity(Entities/Mantaman)
 entity(Entities/Marker)
 entity(Entities/MessageHolder)
 entity(Entities/MessageItem)
 entity(Entities/MirrorMarker)
 entity(Entities/ModelDestruction)
 entity(Entities/ModelHolder2)
 entity(Entities/ModelHolder)
 entity(Entities/MovingBrush)
 entity(Entities/MovingBrushMarker)
 entity(Entities/MusicChanger)
 entity(Entities/MusicHolder)
 entity(Entities/NavigationMarker)
 entity(Entities/ParticlesHolder)
 entity(Entities/Pendulum)
 entity(Entities/Pipebomb)
 entity(Entities/PlayerActionMarker)
 entity(Entities/PlayerAnimator)
 entity(Entities/Player)
 entity(Entities/PlayerMarker)
 entity(Entities/PlayerView)
 entity(Entities/PlayerWeaponsEffects)
 entity(Entities/PlayerWeapons)
 entity(Entities/Projectile)
 entity(Entities/PyramidSpaceShip)
 entity(Entities/PyramidSpaceShipMarker)
 entity(Entities/Reminder)
 entity(Entities/RobotDriving)
 entity(Entities/RobotFixed)
 entity(Entities/RobotFlying)
 entity(Entities/RollingStone)
 entity(Entities/Scorpman)
 entity(Entities/Ship)
 entity(Entities/ShipMarker)
 entity(Entities/SoundHolder)
 entity(Entities/StormController)
 entity(Entities/Switch)
 entity(Entities/Teleport)
 entity(Entities/TouchField)
 entity(Entities/Trigger)
 entity(Entities/Twister)
 entity(Entities/VoiceHolder)
 entity(Entities/Walker)
 entity(Entities/Watcher)
 entity(Entities/WatchPlayers)
 entity(Entities/Water)
 entity(Entities/WeaponItem)
 entity(Entities/Werebull)
 entity(Entities/Woman)
 entity(Entities/WorldBase)
 entity(Entities/WorldLink)
 entity(Entities/WorldSettingsController)
else()
 entity(EntitiesMP/AirElemental)
 entity(EntitiesMP/AirShockwave)
 entity(EntitiesMP/AmmoItem)
 entity(EntitiesMP/AmmoPack)
 entity(EntitiesMP/AnimationChanger)
 entity(EntitiesMP/AnimationHub)
 entity(EntitiesMP/AreaMarker)
 entity(EntitiesMP/ArmorItem)
 entity(EntitiesMP/BackgroundViewer)
 entity(EntitiesMP/BasicEffects)
 entity(EntitiesMP/Beast)
 entity(EntitiesMP/BigHead)
 entity(EntitiesMP/BlendController)
 entity(EntitiesMP/BloodSpray)
 entity(EntitiesMP/Boneman)
 entity(EntitiesMP/Bouncer)
 entity(EntitiesMP/Bullet)
 entity(EntitiesMP/Camera)
 entity(EntitiesMP/CameraMarker)
 entity(EntitiesMP/CannonBall)
 entity(EntitiesMP/CannonRotating)
 entity(EntitiesMP/CannonStatic)
 entity(EntitiesMP/ChainsawFreak)
 entity(EntitiesMP/Copier)
 entity(EntitiesMP/Counter)
 entity(EntitiesMP/CrateBus)
 entity(EntitiesMP/CrateRider)
 entity(EntitiesMP/CreditsHolder)
 entity(EntitiesMP/Damager)
 entity(EntitiesMP/Debris)
 entity(EntitiesMP/DebugEntityStatesDisplay)
 entity(EntitiesMP/Demon)
 entity(EntitiesMP/DestroyableArchitecture)
 entity(EntitiesMP/Devil)
 entity(EntitiesMP/DevilMarker)
 entity(EntitiesMP/DevilProjectile)
 entity(EntitiesMP/DoorController)
 entity(EntitiesMP/Dragonman)
 entity(EntitiesMP/EffectMarker)
 entity(EntitiesMP/Effector)
 entity(EntitiesMP/Elemental)
 entity(EntitiesMP/EnemyBase)
 entity(EntitiesMP/EnemyCounter)
 entity(EntitiesMP/EnemyDive)
 entity(EntitiesMP/EnemyFly)
 entity(EntitiesMP/EnemyMarker)
 entity(EntitiesMP/EnemyRunInto)
 entity(EntitiesMP/EnemySpawner)
 entity(EntitiesMP/EnvironmentBase)
 entity(EntitiesMP/EnvironmentMarker)
 entity(EntitiesMP/EnvironmentParticlesHolder)
 entity(EntitiesMP/Eruptor)
 entity(EntitiesMP/ExotechLarva)
 entity(EntitiesMP/ExotechLarvaBattery)
 entity(EntitiesMP/ExotechLarvaCharger)
 entity(EntitiesMP/Eyeman)
 entity(EntitiesMP/Fireworks)
 entity(EntitiesMP/Fish)
 entity(EntitiesMP/Flame)
 entity(EntitiesMP/FogMarker)
 entity(EntitiesMP/Gizmo)
 entity(EntitiesMP/Global)
 entity(EntitiesMP/GradientMarker)
 entity(EntitiesMP/GravityMarker)
 entity(EntitiesMP/GravityRouter)
 entity(EntitiesMP/Grunt)
 entity(EntitiesMP/GruntSka)
 entity(EntitiesMP/Guffy)
 entity(EntitiesMP/HazeMarker)
 entity(EntitiesMP/Headman)
 entity(EntitiesMP/HealthItem)
 entity(EntitiesMP/HudPicHolder)
 entity(EntitiesMP/Item)
 entity(EntitiesMP/KeyItem)
 entity(EntitiesMP/LarvaOffspring)
 entity(EntitiesMP/Light)
 entity(EntitiesMP/Lightning)
 entity(EntitiesMP/Marker)
 entity(EntitiesMP/MessageHolder)
 entity(EntitiesMP/MessageItem)
 entity(EntitiesMP/MeteorShower)
 entity(EntitiesMP/MirrorMarker)
 entity(EntitiesMP/ModelDestruction)
 entity(EntitiesMP/ModelHolder)
 entity(EntitiesMP/ModelHolder2)
 entity(EntitiesMP/ModelHolder3)
 entity(EntitiesMP/MovingBrush)
 entity(EntitiesMP/MovingBrushMarker)
 entity(EntitiesMP/MusicChanger)
 entity(EntitiesMP/MusicHolder)
 entity(EntitiesMP/NavigationMarker)
 entity(EntitiesMP/ParticlesHolder)
 entity(EntitiesMP/Pendulum)
 entity(EntitiesMP/PhotoAlbum)
 entity(EntitiesMP/Pipebomb)
 entity(EntitiesMP/Player)
 entity(EntitiesMP/PlayerActionMarker)
 entity(EntitiesMP/PlayerAnimator)
 entity(EntitiesMP/PlayerMarker)
 entity(EntitiesMP/PlayerView)
 entity(EntitiesMP/PlayerWeapons)
 entity(EntitiesMP/PlayerWeaponsEffects)
 entity(EntitiesMP/PowerUpItem)
 entity(EntitiesMP/Projectile)
 entity(EntitiesMP/PyramidSpaceShip)
 entity(EntitiesMP/PyramidSpaceShipMarker)
 entity(EntitiesMP/Reminder)
 entity(EntitiesMP/RollingStone)
 entity(EntitiesMP/Santa)
 entity(EntitiesMP/Scorpman)
 entity(EntitiesMP/ScrollHolder)
 entity(EntitiesMP/SeriousBomb)
 entity(EntitiesMP/Ship)
 entity(EntitiesMP/ShipMarker)
 entity(EntitiesMP/Shooter)
 entity(EntitiesMP/SoundHolder)
 entity(EntitiesMP/SpawnerProjectile)
 entity(EntitiesMP/Spinner)
 entity(EntitiesMP/StormController)
 entity(EntitiesMP/Summoner)
 entity(EntitiesMP/SummonerMarker)
 entity(EntitiesMP/Switch)
 entity(EntitiesMP/TacticsChanger)
 entity(EntitiesMP/TacticsHolder)
 entity(EntitiesMP/Teleport)
 entity(EntitiesMP/Terrain)
 entity(EntitiesMP/TextFXHolder)
 entity(EntitiesMP/TimeController)
 entity(EntitiesMP/TouchField)
 entity(EntitiesMP/Trigger)
 entity(EntitiesMP/Twister)
 entity(EntitiesMP/VoiceHolder)
 entity(EntitiesMP/Walker)
 entity(EntitiesMP/WatchPlayers)
 entity(EntitiesMP/Watcher)
 entity(EntitiesMP/Water)
 entity(EntitiesMP/WeaponItem)
 entity(EntitiesMP/Werebull)
 entity(EntitiesMP/Woman)
 entity(EntitiesMP/WorldBase)
 entity(EntitiesMP/WorldLink)
 entity(EntitiesMP/WorldSettingsController)
endif()

add_custom_target(ParseEntities DEPENDS ${ENTITIES_H})

set(ENTITIESMPLIB "Entities${MP}${DEBUGSUFFIX}")
if(TFE)
 add_library(${ENTITIESMPLIB} ${LIB_TYPE}
     ${ENTITIES_CPP}
     Entities/Common/Common.cpp
     Entities/Common/Debris.cpp
     Entities/Common/Particles.cpp
     Entities/Common/Stats.cpp
     Entities/Common/PathFinding.cpp
     Entities/Common/HUD.cpp
 )
else()
 add_library(${ENTITIESMPLIB} ${LIB_TYPE}
     ${ENTITIES_CPP}
     EntitiesMP/Common/Common.cpp
 	 EntitiesMP/Common/Particles.cpp
 	 EntitiesMP/Common/EmanatingParticles.cpp
 	 EntitiesMP/Common/PathFinding.cpp
 	 EntitiesMP/Common/HUD.cpp
 )
endif()

if (EMSCRIPTEN)
  set_target_properties(${ENTITIESMPLIB} PROPERTIES COMPILE_FLAGS "${EM_LIB_COMPILE_FLAGS}")
  set_target_properties(${ENTITIESMPLIB} PROPERTIES LINK_FLAGS "${EM_LIB_LINK_FLAGS}")
  if (NOT STATICALLY_LINKED)
    set_target_properties(${ENTITIESMPLIB} PROPERTIES SUFFIX ".wasm")
  endif()
endif()

if(MACOSX)
    target_link_libraries(${ENTITIESMPLIB} "-undefined dynamic_lookup")
endif()
add_dependencies(${ENTITIESMPLIB} ParseEntities)

set(GAMEMPLIB "Game${MP}${DEBUGSUFFIX}")
add_library(${GAMEMPLIB} ${LIB_TYPE}
    GameMP/Camera.cpp
    GameMP/CompMessage.cpp
    GameMP/CompModels.cpp
    GameMP/Computer.cpp
    GameMP/Console.cpp
    GameMP/Controls.cpp
    GameMP/Game.cpp
    GameMP/LCDDrawing.cpp
    GameMP/LoadingHook.cpp
    GameMP/Map.cpp
    GameMP/SessionProperties.cpp
    GameMP/WEDInterface.cpp
)
if (EMSCRIPTEN)
  set_target_properties(${GAMEMPLIB} PROPERTIES COMPILE_FLAGS "${EM_LIB_COMPILE_FLAGS}")
  set_target_properties(${GAMEMPLIB} PROPERTIES LINK_FLAGS "${EM_LIB_LINK_FLAGS}")
  if (NOT STATICALLY_LINKED)
    set_target_properties(${GAMEMPLIB} PROPERTIES SUFFIX ".wasm")
  endif()
endif()
if(MACOSX)
    target_link_libraries(${GAMEMPLIB} "-undefined dynamic_lookup")
endif()
add_dependencies(${GAMEMPLIB} ParseEntities)

set(SHADERSLIB "Shaders${DEBUGSUFFIX}")
add_library(${SHADERSLIB} ${LIB_TYPE}
    Shaders/AddShader.cpp
    Shaders/AddShaderDS.cpp
    Shaders/BaseShader.cpp
    Shaders/BaseShaderDS.cpp
    Shaders/BaseTransparent.cpp
    Shaders/BaseTransparentDS.cpp
    Shaders/ColorShader.cpp
    Shaders/Common.cpp
    Shaders/DetailShader.cpp
    Shaders/DisplaceShader.cpp
    Shaders/InvisibleShader.cpp
    Shaders/MultiLayerShader.cpp
    Shaders/Reflection.cpp
    Shaders/ReflectionDS.cpp
    Shaders/ReftectionAndSpecular.cpp
    Shaders/ReftectionAndSpecularDS.cpp
    Shaders/Specular.cpp
    Shaders/SpecularDS.cpp
    Shaders/StdH.cpp
    Shaders/Translucent.cpp
)
if(MACOSX)
    target_link_libraries(${SHADERSLIB} "-undefined dynamic_lookup")
endif()
if (EMSCRIPTEN)
  set_target_properties(${SHADERSLIB} PROPERTIES COMPILE_FLAGS "${EM_LIB_COMPILE_FLAGS}")
  set_target_properties(${SHADERSLIB} PROPERTIES LINK_FLAGS "${EM_LIB_LINK_FLAGS}")
  if (NOT STATICALLY_LINKED)
    set_target_properties(${SHADERSLIB} PROPERTIES SUFFIX ".wasm")
  endif()
endif()
add_dependencies(${SHADERSLIB} ParseEntities)

add_parser_and_scanner("Engine/Base/Parser" "Engine/Base/Scanner")
add_parser_and_scanner("Engine/Ska/smcPars" "Engine/Ska/smcScan")

if (USE_I386_NASM_ASM)
    add_custom_command(
        OUTPUT "SoundMixer386.o"
        MAIN_DEPENDENCY "${CMAKE_CURRENT_SOURCE_DIR}/Engine/Sound/SoundMixer386.asm"
        COMMAND nasm
        ARGS ${ASMFLAGS} -f ${ASMOBJFMT} -o SoundMixer386.o ${CMAKE_CURRENT_SOURCE_DIR}/Engine/Sound/SoundMixer386.asm
    )
    list(APPEND ADDITIONAL_ENGINE_SRCS SoundMixer386.o)
endif()

if (STATICALLY_LINKED)
 set(DYN_LOADER_SRC Engine/Base/Unix/RegistryLoader.cpp)
else()
 set(DYN_LOADER_SRC Engine/Base/Unix/UnixDynamicLoader.cpp)
endif()

if(USE_SINGLE_THREAD)
 set(SYNCHRO_SRCS
    Engine/Base/NullSynchronization.cpp  # single threaded.
 )
else()
 #!! TODO Win32/Linux case
 set(SYNCHRO_SRCS
    Engine/Base/Unix/UnixSynchronization.cpp  # multithreaded Unix.
    #Engine/Base/SDL/SDLSynchronization.cpp
    #Engine/Base/SDL/SDLThreadLocalStorage.cpp  # multithreaded Unix.
 )
    #Engine/Base/Registry.cpp  # Windows only.
    #Engine/Base/StackDump.cpp  # Windows only.
    #Engine/Base/Win32/Win32Synchronization.cpp # Windows only.
endif()

set(ZLIB_SRCS "")
if(NOT USE_SYSTEM_ZLIB)
    set(ZLIB_SRCS
        Engine/zlib/inflate.c
        Engine/zlib/adler32.c
        Engine/zlib/infblock.c
        Engine/zlib/inffast.c
        Engine/zlib/inftrees.c
        Engine/zlib/trees.c
        Engine/zlib/compress.c
        Engine/zlib/zutil.c
        Engine/zlib/deflate.c
        Engine/zlib/infcodes.c
        Engine/zlib/infutil.c
        Engine/zlib/uncompr.c)
endif()

set(ENGINE_SAFEMATH_SRCS
    Engine/Brushes/Brush.cpp
    Engine/Brushes/BrushPolygon.cpp
    Engine/Brushes/BrushSector.cpp
    Engine/Entities/Entity.cpp
    Engine/Entities/EntityClass.cpp
    Engine/Entities/EntityCollision.cpp
    Engine/Entities/PlayerCharacter.cpp
    Engine/Terrain/TerrainMisc.cpp
    Engine/Terrain/TerrainRayCasting.cpp
    Engine/World/WorldCSG.cpp
    Engine/World/WorldRayCasting.cpp
    Engine/World/WorldCollision.cpp
    Engine/World/WorldCollisionGrid.cpp

    Engine/Math/Projection_Simple_DOUBLE.cpp
    Engine/Math/Geometry_DOUBLE.cpp
)
add_library(engine_safemath STATIC
    ${ENGINE_SAFEMATH_SRCS}
)


if (EMSCRIPTEN)
  set_target_properties(engine_safemath PROPERTIES COMPILE_FLAGS "${EM_LIB_COMPILE_FLAGS}")
endif()


if(NOT EMSCRIPTEN) 
    target_compile_options(engine_safemath PRIVATE "-fno-unsafe-math-optimizations")
endif()

if(PANDORA)
    target_compile_options(engine_safemath PRIVATE "-mfpu=vfpv3")
endif()
add_dependencies(engine_safemath ParseEntities)

set(ENGINE_SRCS
    ${ENGINE_ENTITIES_CPP}
    Engine/Engine.cpp
    Engine/Base/Anim.cpp
    Engine/Base/CRC.cpp
    Engine/Base/CRCTable.cpp
    Engine/Base/Changeable.cpp
    Engine/Base/Console.cpp
    Engine/Base/Directory.cpp
    Engine/Base/ErrorReporting.cpp
    Engine/Base/FileName.cpp
    Engine/Base/Input.cpp
    Engine/Base/Lists.cpp
    Engine/Base/Memory.cpp
    Engine/Base/Profiling.cpp
    Engine/Base/ProgressHook.cpp
    Engine/Base/Protection.cpp
    Engine/Base/Relations.cpp
    Engine/Base/ReplaceFile.cpp
    Engine/Base/Serial.cpp
    Engine/Base/Shell.cpp
    Engine/Base/ShellTypes.cpp
    Engine/Base/Statistics.cpp
    Engine/Base/Stream.cpp
    Engine/Base/Timer.cpp
    Engine/Base/Translation.cpp
    Engine/Base/Unzip.cpp
    Engine/Base/Updateable.cpp
    Engine/Base/CTString.cpp
    Engine/Base/Scanner.cpp
    Engine/Base/Parser.cpp
    Engine/Base/Parser.h
    Engine/Base/IFeel.cpp
    Engine/Base/Unix/UnixFileSystem.cpp
    ${DYN_LOADER_SRC}
    Engine/Base/SDL/SDLTimer.cpp
    Engine/Base/SDL/SDLInput.cpp
    Engine/Base/SDL/SDLEvents.cpp
    ${SYNCHRO_SRCS}
    Engine/Brushes/BrushIO.cpp
    Engine/Brushes/BrushShadows.cpp
    Engine/Brushes/BrushTriangularize.cpp
    Engine/Brushes/BrushArchive.cpp
    Engine/Brushes/BrushImport.cpp
    Engine/Brushes/BrushMip.cpp
    Engine/Brushes/BrushExport.cpp
    Engine/Entities/NearestPolygon.cpp
    Engine/Entities/EntityProperties.cpp
    Engine/Entities/FieldBSPTesting.cpp
    Engine/Entities/EntityCopying.cpp
    Engine/Entities/LastPositions.cpp
    Engine/Math/Projection_Isometric.cpp
    Engine/Math/Object3D.cpp
    Engine/Math/Projection_Parallel.cpp
    Engine/Math/Projection_Perspective.cpp
    Engine/Math/Float.cpp
    Engine/Math/Object3D_CSG.cpp
    Engine/Math/Projection_Simple.cpp
    Engine/Math/Functions.cpp
    Engine/Math/ObjectSector.cpp
    Engine/Math/Placement.cpp
    Engine/Math/TextureMapping.cpp
    Engine/Math/Geometry.cpp
    Engine/Math/Projection.cpp
    #Engine/Math/Object3D_IO.cpp  # Exploration 3D support.
    #Engine/Models/EditModel.cpp
    Engine/Models/Model.cpp
    Engine/Models/RenderModel_View.cpp
    Engine/Models/Normals.cpp
    Engine/Models/VertexGetting.cpp
    Engine/Models/RenderModel.cpp
    Engine/Models/MipMaker.cpp
    Engine/Models/ModelProfile.cpp
    Engine/Models/RenderModel_Mask.cpp
    Engine/Light/LayerMaker.cpp
    Engine/Light/LayerMixer.cpp
    Engine/Light/LightSource.cpp
    Engine/Graphics/Adapter.cpp
    Engine/Graphics/Raster.cpp
    Engine/Graphics/GfxLibrary.cpp
    Engine/Graphics/Benchmark.cpp
    Engine/Graphics/GfxProfile.cpp
    Engine/Graphics/Color.cpp
    Engine/Graphics/ShadowMap.cpp
    Engine/Graphics/DepthCheck.cpp
    Engine/Graphics/Texture.cpp
    Engine/Graphics/DisplayMode.cpp
    Engine/Graphics/Gfx_OpenGL.cpp
    Engine/Graphics/Gfx_OpenGL_Textures.cpp
    Engine/Graphics/TextureEffects.cpp
    Engine/Graphics/DrawPort.cpp
    Engine/Graphics/Gfx_wrapper.cpp
    Engine/Graphics/DrawPort_Particles.cpp
    Engine/Graphics/Graphics.cpp
    Engine/Graphics/ViewPort.cpp
    Engine/Graphics/DrawPort_RenderScene.cpp
    Engine/Graphics/ImageInfo.cpp
    Engine/Graphics/Fog.cpp
    Engine/Graphics/MultiMonitor.cpp
    Engine/Graphics/Font.cpp
    Engine/Graphics/Shader.cpp
    Engine/Graphics/Stereo.cpp
    Engine/Graphics/SDL/SDLOpenGL.cpp
    Engine/Graphics/SDL/SDLAdapter.cpp
    Engine/Network/ActionBuffer.cpp
    Engine/Network/NetworkMessage.cpp
    Engine/Network/Server.cpp
    Engine/Network/Buffer.cpp
    Engine/Network/NetworkProfile.cpp
    Engine/Network/SessionState.cpp
    Engine/Network/PlayerBuffer.cpp
    Engine/Network/MessageDispatcher.cpp
    Engine/Network/PlayerSource.cpp
    Engine/Network/Compression.cpp
    Engine/Network/Network.cpp
    Engine/Network/PlayerTarget.cpp
    Engine/Network/CPacket.cpp
    Engine/Network/ClientInterface.cpp
    Engine/Network/CommunicationInterface.cpp
    Engine/Network/Diff.cpp
    Engine/GameAgent/GameAgent.cpp
    Engine/Terrain/ArrayHolder.cpp
    Engine/Terrain/Terrain.cpp
    Engine/Terrain/TerrainArchive.cpp
    Engine/Terrain/TerrainEditing.cpp
    Engine/Terrain/TerrainLayer.cpp
    Engine/Terrain/TerrainRender.cpp
    Engine/Terrain/TerrainTile.cpp
    Engine/Rendering/Render.cpp
    Engine/Rendering/RenderProfile.cpp
    Engine/Rendering/SelectOnRender.cpp
    Engine/Ska/AnimSet.cpp
    Engine/Ska/RMRender.cpp
    Engine/Ska/Skeleton.cpp
    Engine/Ska/ModelInstance.cpp
    Engine/Ska/StringTable.cpp
    Engine/Ska/Mesh.cpp
    Engine/Ska/RMRenderMask.cpp
    Engine/Ska/smcPars.cpp
    Engine/Ska/smcPars.h
    Engine/Ska/smcScan.cpp
    Engine/Sound/SoundDecoder.cpp
    Engine/Sound/SoundObject.cpp
    Engine/Sound/SoundLibrary.cpp
    Engine/Sound/SoundProfile.cpp
    Engine/Sound/SoundData.cpp
    Engine/Sound/Wave.cpp
    Engine/Sound/SoundMixer.cpp
    Engine/Templates/Stock_CAnimData.cpp
    Engine/Templates/Stock_CAnimSet.cpp
    Engine/Templates/Stock_CEntityClass.cpp
    Engine/Templates/Stock_CMesh.cpp
    Engine/Templates/Stock_CModelData.cpp
    Engine/Templates/Stock_CSkeleton.cpp
    Engine/Templates/Stock_CSoundData.cpp
    Engine/Templates/Stock_CTextureData.cpp
    Engine/Templates/Stock_CShader.cpp
    Engine/Templates/NameTable_CTFileName.cpp
    Engine/Templates/NameTable_CTranslationPair.cpp
    Engine/Templates/BSP.cpp
    Engine/World/PhysicsProfile.cpp
    Engine/World/World.cpp
    Engine/World/WorldEditingProfile.cpp
    Engine/World/WorldIO.cpp
    ${ADDITIONAL_ENGINE_SRCS}
    ${ZLIB_SRCS}
)

add_subdirectory(amp11lib)
if (NOT EMSCRIPTEN)
  add_subdirectory(libogg)
  add_subdirectory(libvorbis)
endif()

if (EMSCRIPTEN)
  add_subdirectory(gl4es)
endif()

add_executable(ssam
    ${ENGINE_SRCS}
    SeriousSam/LevelInfo.cpp
    SeriousSam/CmdLine.cpp
    SeriousSam/SeriousSam.cpp
    SeriousSam/VarList.cpp
    SeriousSam/Credits.cpp
    SeriousSam/GLSettings.cpp
    SeriousSam/LCDDrawing.cpp
    SeriousSam/SplashScreen.cpp
    SeriousSam/MainWindow.cpp
    SeriousSam/Menu.cpp
    SeriousSam/MenuGadgets.cpp
    SeriousSam/MenuPrinting.cpp
    Registry.cpp
)
target_link_libraries(ssam engine_safemath)
add_dependencies(ssam ParseEntities)
# Make symbols in the main executable available to dynamic objects
set_target_properties(ssam PROPERTIES ENABLE_EXPORTS ON)

if(EMSCRIPTEN)
  target_include_directories(ssam PUBLIC gl4es/include)
endif()

# !!! FIXME: this is an option because you have to recompile the entire engine twice.
# !!! FIXME:  If we can put the engine in a static library and not lose symbols,
# !!! FIXME:  that's a better plan and we can remove the toggle here.
option(BUILD_DEDICATED_SERVER "Compile the dedicated server, too" FALSE)
if(BUILD_DEDICATED_SERVER)
    add_executable(SeriousSamDedicated ${ENGINE_SRCS} DedicatedServer/DedicatedServer.cpp)
    target_link_libraries(SeriousSamDedicated engine_safemath)
    add_dependencies(SeriousSamDedicated ParseEntities)
    # Make symbols in the main executable available to dynamic objects
    set_target_properties(SeriousSamDedicated PROPERTIES ENABLE_EXPORTS ON)
endif()

if(MACOSX)
    target_link_libraries(ssam ${ZLIB_LIBRARIES})
    if(USE_SYSTEM_SDL2) # use sdl2 framework on system
      target_link_libraries(ssam ${SDL2_LIBRARY})
    else() # use local libsdl2
	  find_library(COCOA_FRAMEWORK Cocoa)
      target_link_libraries(ssam "${COCOA_FRAMEWORK}")
      target_link_libraries(ssam "${CMAKE_CURRENT_SOURCE_DIR}/lib/macosx/libSDL2-2.0.0.dylib")
    endif()
    
    if(BUILD_DEDICATED_SERVER)
		target_link_libraries(SeriousSamDedicated ${ZLIB_LIBRARIES})
		if(USE_SYSTEM_SDL2)
			target_link_libraries(SeriousSamDedicated ${SDL2_LIBRARY})
		else()
			target_link_libraries(SeriousSamDedicated "${COCOA_FRAMEWORK}")
			target_link_libraries(SeriousSamDedicated "${CMAKE_CURRENT_SOURCE_DIR}/lib/macosx/libSDL2-2.0.0.dylib")
		endif()
    endif()
endif()

if (EMSCRIPTEN)
    set_target_properties(ssam PROPERTIES LINK_FLAGS "\
      --pre-js ${CMAKE_CURRENT_SOURCE_DIR}/emscripten/pre.js \
      --post-js ${CMAKE_CURRENT_SOURCE_DIR}/emscripten/post.js \
      --preload-file ${CMAKE_CURRENT_SOURCE_DIR}/../preload@/ \
      -s ALLOW_MEMORY_GROWTH=1 \
      -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
      -s LLD_REPORT_UNDEFINED=1 \
      -s USE_WEBGL2=1 \
      -s \"EXPORTED_FUNCTIONS=[\
        '_main',\
        '_GAME_Create',\
         '_CAcid_DLLClass',\
         '_CAirWave_DLLClass',\
         '_CAmmoItem_DLLClass',\
         '_CAmmoPack_DLLClass',\
         '_CAnimationChanger_DLLClass',\
         '_CAnimationHub_DLLClass',\
         '_CArmorItem_DLLClass',\
         '_CBackgroundViewer_DLLClass',\
         '_CBeast_DLLClass',\
         '_CBigHead_DLLClass',\
         '_CBlendController_DLLClass',\
         '_CBloodSpray_DLLClass',\
         '_CBoneman_DLLClass',\
         '_CBouncer_DLLClass',\
         '_CBullet_DLLClass',\
         '_CCamera_DLLClass',\
         '_CCameraMarker_DLLClass',\
         '_CCannonBall_DLLClass',\
         '_CCatman_DLLClass',\
         '_CCopier_DLLClass',\
         '_CCounter_DLLClass',\
         '_CCrateRider_DLLClass',\
         '_CCyborgBike_DLLClass',\
         '_CCyborg_DLLClass',\
         '_CDamager_DLLClass',\
         '_CDebris_DLLClass',\
         '_CDestroyableArchitecture_DLLClass',\
         '_CDevil_DLLClass',\
         '_CDevilMarker_DLLClass',\
         '_CDevilProjectile_DLLClass',\
         '_CDoorController_DLLClass',\
         '_CDragonman_DLLClass',\
         '_CEffectMarker_DLLClass',\
         '_CEffector_DLLClass',\
         '_CElemental_DLLClass',\
         '_CEnemyBase_DLLClass',\
         '_CEnemyCounter_DLLClass',\
         '_CEnemyDive_DLLClass',\
         '_CEnemyFly_DLLClass',\
         '_CEnemyMarker_DLLClass',\
         '_CEnemyRunInto_DLLClass',\
         '_CEnemySpawner_DLLClass',\
         '_CEnvironmentBase_DLLClass',\
         '_CEnvironmentMarker_DLLClass',\
         '_CEruptor_DLLClass',\
         '_CEyeman_DLLClass',\
         '_CFish_DLLClass',\
         '_CFishman_DLLClass',\
         '_CFlame_DLLClass',\
         '_CFogMarker_DLLClass',\
         '_CGizmo_DLLClass',\
         '_CGlobal_DLLClass',\
         '_CGradientMarker_DLLClass',\
         '_CGravityMarker_DLLClass',\
         '_CGravityRouter_DLLClass',\
         '_CHazeMarker_DLLClass',\
         '_CHeadman_DLLClass',\
         '_CHealthItem_DLLClass',\
         '_CHuanman_DLLClass',\
         '_CItem_DLLClass',\
         '_CKeyItem_DLLClass',\
         '_CLight_DLLClass',\
         '_CLightning_DLLClass',\
         '_CLightStyle_DLLClass',\
         '_CMamut_DLLClass',\
         '_CMamutman_DLLClass',\
         '_CMantaman_DLLClass',\
         '_CMarker_DLLClass',\
         '_CMessageHolder_DLLClass',\
         '_CMessageItem_DLLClass',\
         '_CMirrorMarker_DLLClass',\
         '_CModelDestruction_DLLClass',\
         '_CModelHolder2_DLLClass',\
         '_CModelHolder_DLLClass',\
         '_CMovingBrush_DLLClass',\
         '_CMovingBrushMarker_DLLClass',\
         '_CMusicChanger_DLLClass',\
         '_CMusicHolder_DLLClass',\
         '_CNavigationMarker_DLLClass',\
         '_CParticlesHolder_DLLClass',\
         '_CPendulum_DLLClass',\
         '_CPipebomb_DLLClass',\
         '_CPlayerActionMarker_DLLClass',\
         '_CPlayerAnimator_DLLClass',\
         '_CPlayer_DLLClass',\
         '_CPlayerMarker_DLLClass',\
         '_CPlayerView_DLLClass',\
         '_CPlayerWeaponsEffects_DLLClass',\
         '_CPlayerWeapons_DLLClass',\
         '_CProjectile_DLLClass',\
         '_CPyramidSpaceShip_DLLClass',\
         '_CPyramidSpaceShipMarker_DLLClass',\
         '_CReminder_DLLClass',\
         '_CRobotDriving_DLLClass',\
         '_CRobotFlying_DLLClass',\
         '_CRollingStone_DLLClass',\
         '_CScorpman_DLLClass',\
         '_CShip_DLLClass',\
         '_CShipMarker_DLLClass',\
         '_CSoundHolder_DLLClass',\
         '_CStormController_DLLClass',\
         '_CSwitch_DLLClass',\
         '_CTeleport_DLLClass',\
         '_CTouchField_DLLClass',\
         '_CTrigger_DLLClass',\
         '_CTwister_DLLClass',\
         '_CVoiceHolder_DLLClass',\
         '_CWalker_DLLClass',\
         '_CWatcher_DLLClass',\
         '_CWatchPlayers_DLLClass',\
         '_CWater_DLLClass',\
         '_CWeaponItem_DLLClass',\
         '_CWerebull_DLLClass',\
         '_CWoman_DLLClass',\
         '_CWorldBase_DLLClass',\
         '_CWorldLink_DLLClass',\
         '_CWorldSettingsController_DLLClass'\
        ]\" \
        --use-preload-cache \
      ")
      # only if debug: -g4 --source-map-base http://localhost:5000/cmake-em-build/ \
      # if release probably dont want to use preload cache
    set_target_properties(ssam PROPERTIES COMPILE_FLAGS "-s MAIN_MODULE=1 -s FULL_ES2=1")
endif()

if(LINUX)
    if (NOT EMSCRIPTEN)
        set_target_properties(ssam PROPERTIES LINK_FLAGS "-Wl,-rpath,$ORIGIN")
    endif()
    target_link_libraries(ssam "m")
    target_link_libraries(ssam "dl")
    target_link_libraries(ssam "pthread")
    target_link_libraries(ssam ${SDL2_LIBRARY})
    target_link_libraries(ssam ${ZLIB_LIBRARIES})
    if(PANDORA)
    	target_link_libraries(ssam "rt")
    endif()
    if(BUILD_DEDICATED_SERVER)
        set_target_properties(SeriousSamDedicated PROPERTIES LINK_FLAGS "-Wl,-rpath,$ORIGIN")
        target_link_libraries(SeriousSamDedicated "m")
        target_link_libraries(SeriousSamDedicated "dl")
        target_link_libraries(SeriousSamDedicated "pthread")
	target_link_libraries(SeriousSamDedicated ${SDL2_LIBRARY})
        target_link_libraries(SeriousSamDedicated ${ZLIB_LIBRARIES})
    endif()
endif()

if(FREEBSD)
    set_target_properties(ssam PROPERTIES LINK_FLAGS "-Wl,-rpath,$ORIGIN")
    target_link_libraries(ssam "m")
    target_link_libraries(ssam "pthread")
    target_link_libraries(ssam ${SDL2_LIBRARY})
    target_link_libraries(ssam ${ZLIB_LIBRARIES})
    if(BUILD_DEDICATED_SERVER)
        set_target_properties(SeriousSamDedicated PROPERTIES LINK_FLAGS "-Wl,-rpath,$ORIGIN")
        target_link_libraries(SeriousSamDedicated "m")
        target_link_libraries(SeriousSamDedicated "pthread")
        target_link_libraries(SeriousSamDedicated ${SDL2_LIBRARY})
        target_link_libraries(SeriousSamDedicated ${ZLIB_LIBRARIES})
    endif()
endif()

if(STATICALLY_LINKED)
  if (EMSCRIPTEN)
    target_link_libraries(ssam ${ENTITIESMPLIB} ${GAMEMPLIB} ${SHADERSLIB} amp11lib GL)
  else()
    target_link_libraries(ssam -Wl,--undefined=GAME_Create
      -Wl,--undefined=CAcid_DLLClass
      -Wl,--undefined=CAirWave_DLLClass
      -Wl,--undefined=CAmmoItem_DLLClass
      -Wl,--undefined=CAmmoPack_DLLClass
      -Wl,--undefined=CAnimationChanger_DLLClass
      -Wl,--undefined=CAnimationHub_DLLClass
      -Wl,--undefined=CArmorItem_DLLClass
      -Wl,--undefined=CBackgroundViewer_DLLClass
      -Wl,--undefined=CBasicEffects_DLLClass
      -Wl,--undefined=CBeast_DLLClass
      -Wl,--undefined=CBigHead_DLLClass
      -Wl,--undefined=CBlendController_DLLClass
      -Wl,--undefined=CBloodSpray_DLLClass
      -Wl,--undefined=CBoneman_DLLClass
      -Wl,--undefined=CBouncer_DLLClass
      -Wl,--undefined=CBullet_DLLClass
      -Wl,--undefined=CCamera_DLLClass
      -Wl,--undefined=CCameraMarker_DLLClass
      -Wl,--undefined=CCannonBall_DLLClass
      -Wl,--undefined=CCatman_DLLClass
      -Wl,--undefined=CCopier_DLLClass
      -Wl,--undefined=CCounter_DLLClass
      -Wl,--undefined=CCrateRider_DLLClass
      -Wl,--undefined=CCyborgBike_DLLClass
      -Wl,--undefined=CCyborg_DLLClass
      -Wl,--undefined=CDamager_DLLClass
      -Wl,--undefined=CDebris_DLLClass
      -Wl,--undefined=CDestroyableArchitecture_DLLClass
      -Wl,--undefined=CDevil_DLLClass
      -Wl,--undefined=CDevilMarker_DLLClass
      -Wl,--undefined=CDevilProjectile_DLLClass
      -Wl,--undefined=CDoorController_DLLClass
      -Wl,--undefined=CDragonman_DLLClass
      -Wl,--undefined=CEffectMarker_DLLClass
      -Wl,--undefined=CEffector_DLLClass
      -Wl,--undefined=CElemental_DLLClass
      -Wl,--undefined=CEnemyBase_DLLClass
      -Wl,--undefined=CEnemyCounter_DLLClass
      -Wl,--undefined=CEnemyDive_DLLClass
      -Wl,--undefined=CEnemyFly_DLLClass
      -Wl,--undefined=CEnemyMarker_DLLClass
      -Wl,--undefined=CEnemyRunInto_DLLClass
      -Wl,--undefined=CEnemySpawner_DLLClass
      -Wl,--undefined=CEnvironmentBase_DLLClass
      -Wl,--undefined=CEnvironmentMarker_DLLClass
      -Wl,--undefined=CEruptor_DLLClass
      -Wl,--undefined=CEyeman_DLLClass
      -Wl,--undefined=CFish_DLLClass
      -Wl,--undefined=CFishman_DLLClass
      -Wl,--undefined=CFlame_DLLClass
      -Wl,--undefined=CFogMarker_DLLClass
      -Wl,--undefined=CGizmo_DLLClass
      -Wl,--undefined=CGlobal_DLLClass
      -Wl,--undefined=CGradientMarker_DLLClass
      -Wl,--undefined=CGravityMarker_DLLClass
      -Wl,--undefined=CGravityRouter_DLLClass
      -Wl,--undefined=CHazeMarker_DLLClass
      -Wl,--undefined=CHeadman_DLLClass
      -Wl,--undefined=CHealthItem_DLLClass
      -Wl,--undefined=CHuanman_DLLClass
      -Wl,--undefined=CItem_DLLClass
      -Wl,--undefined=CKeyItem_DLLClass
      -Wl,--undefined=CLight_DLLClass
      -Wl,--undefined=CLightning_DLLClass
      -Wl,--undefined=CLightStyle_DLLClass
      -Wl,--undefined=CMamut_DLLClass
      -Wl,--undefined=CMamutman_DLLClass
      -Wl,--undefined=CMantaman_DLLClass
      -Wl,--undefined=CMarker_DLLClass
      -Wl,--undefined=CMessageHolder_DLLClass
      -Wl,--undefined=CMessageItem_DLLClass
      -Wl,--undefined=CMirrorMarker_DLLClass
      -Wl,--undefined=CModelDestruction_DLLClass
      -Wl,--undefined=CModelHolder2_DLLClass
      -Wl,--undefined=CModelHolder_DLLClass
      -Wl,--undefined=CMovingBrush_DLLClass
      -Wl,--undefined=CMovingBrushMarker_DLLClass
      -Wl,--undefined=CMusicChanger_DLLClass
      -Wl,--undefined=CMusicHolder_DLLClass
      -Wl,--undefined=CNavigationMarker_DLLClass
      -Wl,--undefined=CParticlesHolder_DLLClass
      -Wl,--undefined=CPendulum_DLLClass
      -Wl,--undefined=CPipebomb_DLLClass
      -Wl,--undefined=CPlayerActionMarker_DLLClass
      -Wl,--undefined=CPlayerAnimator_DLLClass
      -Wl,--undefined=CPlayer_DLLClass
      -Wl,--undefined=CPlayerMarker_DLLClass
      -Wl,--undefined=CPlayerView_DLLClass
      -Wl,--undefined=CPlayerWeaponsEffects_DLLClass
      -Wl,--undefined=CPlayerWeapons_DLLClass
      -Wl,--undefined=CProjectile_DLLClass
      -Wl,--undefined=CPyramidSpaceShip_DLLClass
      -Wl,--undefined=CPyramidSpaceShipMarker_DLLClass
      -Wl,--undefined=CReminder_DLLClass
      -Wl,--undefined=CRobotDriving_DLLClass
      -Wl,--undefined=CRobotFixed_DLLClass
      -Wl,--undefined=CRobotFlying_DLLClass
      -Wl,--undefined=CRollingStone_DLLClass
      -Wl,--undefined=CScorpman_DLLClass
      -Wl,--undefined=CShip_DLLClass
      -Wl,--undefined=CShipMarker_DLLClass
      -Wl,--undefined=CSoundHolder_DLLClass
      -Wl,--undefined=CStormController_DLLClass
      -Wl,--undefined=CSwitch_DLLClass
      -Wl,--undefined=CTeleport_DLLClass
      -Wl,--undefined=CTouchField_DLLClass
      -Wl,--undefined=CTrigger_DLLClass
      -Wl,--undefined=CTwister_DLLClass
      -Wl,--undefined=CVoiceHolder_DLLClass
      -Wl,--undefined=CWalker_DLLClass
      -Wl,--undefined=CWatcher_DLLClass
      -Wl,--undefined=CWatchPlayers_DLLClass
      -Wl,--undefined=CWater_DLLClass
      -Wl,--undefined=CWeaponItem_DLLClass
      -Wl,--undefined=CWerebull_DLLClass
      -Wl,--undefined=CWoman_DLLClass
      -Wl,--undefined=CWorldBase_DLLClass
      -Wl,--undefined=CWorldLink_DLLClass
      -Wl,--undefined=CWorldSettingsController_DLLClass
      ${ENTITIESMPLIB} ${GAMEMPLIB} ${SHADERSLIB}  )
    target_link_libraries(ssam amp11lib vorbis)
  endif()
endif()

if(TFE)
 set_target_properties(ssam PROPERTIES OUTPUT_NAME "ssam-tfe")
endif()

if (EMSCRIPTEN)
  add_custom_command(
    OUTPUT "${PROJECT_BINARY_DIR}/scratch/pre.js"
    COMMAND ${CMAKE_COMMAND} -E copy "${PROJECT_SOURCE_DIR}/emscripten/pre.js"  "${PROJECT_BINARY_DIR}/scratch/pre.js"
    DEPENDS "${PROJECT_SOURCE_DIR}/emscripten/pre.js"
    COMMENT "Depdency on \"pre.js\"")
  add_custom_target(pre.js DEPENDS "${PROJECT_BINARY_DIR}/scratch/pre.js")
  add_dependencies(ssam pre.js)

  add_custom_command(
    OUTPUT "${PROJECT_BINARY_DIR}/scratch/post.js"
    COMMAND ${CMAKE_COMMAND} -E copy "${PROJECT_SOURCE_DIR}/emscripten/post.js" "${PROJECT_BINARY_DIR}/scratch/post.js"
    DEPENDS "${PROJECT_SOURCE_DIR}/emscripten/post.js"
    COMMENT "Depdency on \"post.js\"")
  add_custom_target(post.js DEPENDS "${PROJECT_BINARY_DIR}/scratch/post.js")
  add_dependencies(ssam post.js)

  add_custom_command(
    OUTPUT "${PROJECT_BINARY_DIR}/scratch/glbug-patch.awk"
    COMMAND ${CMAKE_COMMAND} -E copy "${PROJECT_SOURCE_DIR}/emscripten/glbug-patch.awk"  "${PROJECT_BINARY_DIR}/scratch/glbug-patch.awk"
    DEPENDS "${PROJECT_SOURCE_DIR}/emscripten/glbug-patch.awk"
    COMMENT "Depdency on \"glbug-patch.awk\"")
  add_custom_target(glbug-patch DEPENDS "${PROJECT_BINARY_DIR}/scratch/glbug-patch.awk")
  add_dependencies(ssam glbug-patch)

  set_target_properties(ssam PROPERTIES LINK_DEPENDS "${PROJECT_BINARY_DIR}/scratch/glbug-patch.awk;${PROJECT_BINARY_DIR}/scratch/pre.js;${PROJECT_BINARY_DIR}/scratch/glbug-patch.awk")

  get_target_property(SSAM_OUTPUT_NAME ssam OUTPUT_NAME)
  add_custom_command(
    TARGET ssam
    POST_BUILD
    COMMAND /usr/bin/env gawk -i inplace -f "${PROJECT_BINARY_DIR}/scratch/glbug-patch.awk" "${PROJECT_BINARY_DIR}/${SSAM_OUTPUT_NAME}.js"
    DEPENDS "${PROJECT_BINARY_DIR}/scratch/glbug-patch.awk"
    COMMENT "emscripten GL emulation bugfix")

endif()



# RAKE! Install Section.
if(DEBUG) # RAKE! Will this work with TFE?
    install(TARGETS ssam ${SHADERSLIB} ${GAMEMPLIB} ${ENTITIESMPLIB}
            RUNTIME DESTINATION "${CMAKE_INSTALL_PREFIX}/Bin"
            LIBRARY DESTINATION "${CMAKE_INSTALL_PREFIX}/Bin/Debug"
            PERMISSIONS OWNER_READ OWNER_WRITE OWNER_EXECUTE GROUP_READ GROUP_WRITE GROUP_EXECUTE WORLD_READ WORLD_EXECUTE)
    if(BUILD_DEDICATED_SERVER)
        install(TARGETS SeriousSamDedicated
                RUNTIME DESTINATION ${CMAKE_INSTALL_PREFIX}/Bin
                PERMISSIONS OWNER_READ OWNER_WRITE OWNER_EXECUTE GROUP_READ GROUP_WRITE GROUP_EXECUTE WORLD_READ WORLD_EXECUTE)
    endif()
else()
    install(TARGETS ssam ${SHADERSLIB} ${GAMEMPLIB} ${ENTITIESMPLIB}
            RUNTIME DESTINATION "${CMAKE_INSTALL_PREFIX}/Bin"
            LIBRARY DESTINATION "${CMAKE_INSTALL_PREFIX}/Bin"
            PERMISSIONS OWNER_READ OWNER_WRITE OWNER_EXECUTE GROUP_READ GROUP_WRITE GROUP_EXECUTE WORLD_READ WORLD_EXECUTE)
    if(BUILD_DEDICATED_SERVER)
        install(TARGETS SeriousSamDedicated
                RUNTIME DESTINATION "${CMAKE_INSTALL_PREFIX}/Bin"
                PERMISSIONS OWNER_READ OWNER_WRITE OWNER_EXECUTE GROUP_READ GROUP_WRITE GROUP_EXECUTE WORLD_READ WORLD_EXECUTE)
    endif()
endif()

# RAKE! If CMAKE_INSTALL_PREFIX was set during config then its not a local install
# and SE1_10.gro needs to be installed to Games root dir.
if(NOT LOCAL_INSTALL)
    install(FILES ${CMAKE_SOURCE_DIR}/../SE1_10.gro
            DESTINATION ${CMAKE_INSTALL_PREFIX}
            PERMISSIONS OWNER_READ OWNER_WRITE OWNER_EXECUTE GROUP_READ GROUP_WRITE GROUP_EXECUTE WORLD_READ WORLD_EXECUTE)
endif()

# end of CMakeLists.txt ...
