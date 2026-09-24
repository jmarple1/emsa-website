cmake_minimum_required(VERSION 3.16)
project(emsa_backend VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
# Drogon comes from Ubuntu 24.04's libdrogon-dev (1.8.7, built with PostgreSQL).
find_package(Drogon CONFIG REQUIRED)

# jwt-cpp — header-only, fetched at configure time (same as KnottSoDirtyCo)
include(FetchContent)
FetchContent_Declare(
    jwt-cpp
    GIT_REPOSITORY https://github.com/Thalhammer/jwt-cpp.git
    GIT_TAG        v0.7.0
)
set(JWT_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(jwt-cpp)

# ---------------------------------------------------------------------------
# Sources
# ---------------------------------------------------------------------------
set(SOURCES
    src/main.cpp
    src/utils/JwtUtil.cpp
    src/utils/Http.cpp
    src/filters/JwtFilter.cpp
    src/filters/RateLimitFilter.cpp
    src/controllers/PublicController.cpp
    src/controllers/JoinController.cpp
    src/controllers/ClassController.cpp
    src/controllers/GroupRequestController.cpp
    src/controllers/NaloxoneController.cpp
    src/controllers/AuthController.cpp
    src/controllers/AdminController.cpp
    src/controllers/EditController.cpp
)

add_executable(${PROJECT_NAME} ${SOURCES})

target_include_directories(${PROJECT_NAME} PRIVATE src)

target_link_libraries(${PROJECT_NAME} PRIVATE
    Drogon::Drogon
    jwt-cpp::jwt-cpp
)
