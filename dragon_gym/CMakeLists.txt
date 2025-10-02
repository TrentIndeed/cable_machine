cmake_minimum_required(VERSION 3.5)
project(dragon_gym CXX)

# Specify the location of the WebUI source directory
# Relative to this CMakeLists.txt
set(WEBUI_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/webui")

# Add the WebUI include directory so your program can find webui.hpp
target_include_directories(dragon_gym PRIVATE
    "${WEBUI_SOURCE_DIR}/include"
)

# Add WebUI as a subdirectory to build the library alongside your project
add_subdirectory("${WEBUI_SOURCE_DIR}" EXCLUDE_FROM_ALL)

# Add your executable
add_executable(dragon_gym main.cpp)

# Link your executable with the WebUI library
# The WebUI library target is named "webui" by default
target_link_libraries(dragon_gym PRIVATE webui)
