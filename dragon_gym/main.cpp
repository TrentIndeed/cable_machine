#include "webui.hpp"

void my_callback(webui::window_t& my_window, const std::string& arg) {
    // This is an example of a native function called from JavaScript.
    std::cout << "Native C++ function called with argument: " << arg << std::endl;
}

int main() {
    // Create a new window
    webui::window my_window;

    // Bind a native function to a JavaScript name
    my_window.bind("my_callback_js", &my_callback);

    // Show the window with your local HTML file
    my_window.show("website/index.html");

    // Wait for all windows to be closed
    webui::wait();
    return 0;
}