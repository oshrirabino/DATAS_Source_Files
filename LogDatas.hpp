#ifndef LOGDATAS_HPP
#define LOGDATAS_HPP

#include <iostream>
#include <sstream>
#include <string>

class LogDatas {
protected:
    std::ostringstream buffer;   // internal buffer to accumulate messages
    std::ostream* os;            // default output stream

public:
    // Constructor: user can pass a stream, default is cout
    LogDatas(std::ostream& output_stream = std::cout) : os(&output_stream) {}

    virtual ~LogDatas() = default;

    // Append values to the buffer
    template<typename... Args>
    void append(Args&&... args) {
        (buffer << ... << args);
    }

    // Flush the buffer to the stored stream or a user-supplied stream
    virtual void log(std::ostream* custom_os = nullptr) {
        std::ostream* out = custom_os ? custom_os : os;
        if (!out) return;
        (*out) << buffer.str() << std::endl;
        buffer.str("");   // clear buffer
        buffer.clear();   // reset error flags
    }

    // Overload: log a string immediately
    virtual void log(const std::string& message, std::ostream* custom_os = nullptr) {
        std::ostream* out = custom_os ? custom_os : os;
        if (!out) return;
        (*out) << message << std::endl;
    }

    // Optional: allow changing the default output stream
    void set_stream(std::ostream& output_stream) { os = &output_stream; }
    std::ostringstream& getBuffer() { return buffer;}
};

#endif // LOGDATAS_HPP
