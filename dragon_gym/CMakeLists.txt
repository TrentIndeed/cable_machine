cmake_minimum_required(VERSION 3.18)
project(dragon_gym LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(WEBUI_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/webui")
add_subdirectory("${WEBUI_SOURCE_DIR}")

add_executable(dragon_gym main.cpp)

target_include_directories(dragon_gym PRIVATE
  "${WEBUI_SOURCE_DIR}/include"
)

target_link_libraries(dragon_gym PRIVATE webui)

if(MSVC)
  target_compile_definitions(dragon_gym PRIVATE _CRT_SECURE_NO_WARNINGS)
endif()

set(WEBSITE_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/website")
set(ASSETS_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/assets")

add_custom_command(TARGET dragon_gym POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy_directory
          "${WEBSITE_SOURCE_DIR}"
          "$<TARGET_FILE_DIR:dragon_gym>/website"
  COMMAND ${CMAKE_COMMAND} -E copy_directory
          "${ASSETS_SOURCE_DIR}"
          "$<TARGET_FILE_DIR:dragon_gym>/website/assets"
  COMMENT "Copying website and media assets for runtime"
)
