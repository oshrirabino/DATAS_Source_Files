#include <iostream>
#include <sstream>
#include <string>
#include <memory>
#include <fstream>
#include "LogBTree.hpp"

class BTreeInterface {
private:
    std::unique_ptr<datas::LogBTree<int>> tree;
    std::ostringstream log_stream;
    int tree_size;
    int order;
    bool interactive_mode;
    
    // Separate output streams
    std::ostream* program_out;    // For program messages
    std::ostream* tree_log_out;   // For tree operation logs
    
    // For file handling
    std::unique_ptr<std::ofstream> program_file;
    std::unique_ptr<std::ofstream> tree_log_file;
    
    void printMenu() {
        if (interactive_mode) {
            *program_out << "\n=== BTree Interface ===\n";
            *program_out << "Commands:\n";
            *program_out << "  insert <value>  - Insert a value\n";
            *program_out << "  remove <value>  - Remove a value\n";
            *program_out << "  find <value>    - Search for a value\n";
            *program_out << "  print           - Display the tree\n";
            *program_out << "  size            - Show tree size\n";
            *program_out << "  order           - Show tree order\n";
            *program_out << "  logs            - Show operation logs\n";
            *program_out << "  clear_logs      - Clear operation logs\n";
            *program_out << "  status          - Show tree status\n";
            *program_out << "  help            - Show this menu\n";
            *program_out << "  quit            - Exit program\n";
            *program_out << "========================\n";
            *program_out << "Current tree size: " << tree_size << ", order: " << order << "\n";
            program_out->flush();
        }
    }
    
    void showStatus() {
        *program_out << "STATUS tree_size=" << tree_size 
                     << " order=" << order 
                     << " root=" << (tree ? "initialized" : "null") << std::endl;
    }
    
    void clearLogs() {
        log_stream.str("");
        log_stream.clear();
        *program_out << "LOGS_CLEARED" << std::endl;
    }
    
    void showLogs() {
        std::string logs = log_stream.str();
        if (logs.empty()) {
            *program_out << "LOGS_EMPTY" << std::endl;
        } else {
            *program_out << "LOGS_START" << std::endl;
            *program_out << logs;
            *program_out << "LOGS_END" << std::endl;
        }
    }
    
    void insertValue(int value) {
        if (!tree) {
            *program_out << "ERROR tree_not_initialized" << std::endl;
            return;
        }
        
        size_t log_pos_before = log_stream.str().length();
        
        try {
            tree->insert(value);
            tree_size++;
            *program_out << "INSERT_SUCCESS value=" << value << " new_size=" << tree_size << std::endl;
            
            // Send new tree logs to tree log stream
            std::string new_logs = log_stream.str().substr(log_pos_before);
            if (!new_logs.empty()) {
                *tree_log_out << new_logs;
                tree_log_out->flush();
            }
        } catch (const std::exception& e) {
            *program_out << "INSERT_ERROR value=" << value << " error=" << e.what() << std::endl;
        }
    }
    
    void removeValue(int value) {
        if (!tree) {
            *program_out << "ERROR tree_not_initialized" << std::endl;
            return;
        }
        
        // Check if value exists before removal
        bool exists = tree->find(value);
        if (!exists) {
            *program_out << "REMOVE_NOT_FOUND value=" << value << " size=" << tree_size << std::endl;
            return;
        }
        
        size_t log_pos_before = log_stream.str().length();
        
        try {
            tree->remove(value);
            tree_size--;
            *program_out << "REMOVE_SUCCESS value=" << value << " new_size=" << tree_size << std::endl;
            
            // Send new tree logs to tree log stream
            std::string new_logs = log_stream.str().substr(log_pos_before);
            if (!new_logs.empty()) {
                *tree_log_out << new_logs;
                tree_log_out->flush();
            }
        } catch (const std::exception& e) {
            *program_out << "REMOVE_ERROR value=" << value << " error=" << e.what() << std::endl;
        }
    }
    
    void findValue(int value) {
        if (!tree) {
            *program_out << "ERROR tree_not_initialized" << std::endl;
            return;
        }
        
        size_t log_pos_before = log_stream.str().length();
        
        try {
            bool found = tree->find(value);
            *program_out << "FIND_RESULT value=" << value << " found=" << (found ? "true" : "false") << std::endl;
            
            // Send search logs to tree log stream (if any)
            std::string new_logs = log_stream.str().substr(log_pos_before);
            if (!new_logs.empty()) {
                *tree_log_out << new_logs;
                tree_log_out->flush();
            }
        } catch (const std::exception& e) {
            *program_out << "FIND_ERROR value=" << value << " error=" << e.what() << std::endl;
        }
    }
    
    void printTree() {
        if (!tree) {
            *program_out << "ERROR tree_not_initialized" << std::endl;
            return;
        }
        
        *program_out << "TREE_START" << std::endl;
        *program_out << *tree;
        *program_out << "TREE_END" << std::endl;
    }
    
    bool processCommand(const std::string& line) {
        std::istringstream iss(line);
        std::string command;
        iss >> command;
        
        if (command == "quit" || command == "exit" || command == "q") {
            *program_out << "GOODBYE" << std::endl;
            return false;
        }
        else if (command == "help" || command == "menu") {
            printMenu();
        }
        else if (command == "insert") {
            int value;
            if (iss >> value) {
                insertValue(value);
            } else {
                *program_out << "ERROR invalid_insert_syntax usage=insert_<value>" << std::endl;
            }
        }
        else if (command == "remove") {
            int value;
            if (iss >> value) {
                removeValue(value);
            } else {
                *program_out << "ERROR invalid_remove_syntax usage=remove_<value>" << std::endl;
            }
        }
        else if (command == "find" || command == "search") {
            int value;
            if (iss >> value) {
                findValue(value);
            } else {
                *program_out << "ERROR invalid_find_syntax usage=find_<value>" << std::endl;
            }
        }
        else if (command == "print" || command == "show") {
            printTree();
        }
        else if (command == "size") {
            *program_out << "SIZE " << tree_size << std::endl;
        }
        else if (command == "order") {
            *program_out << "ORDER " << order << std::endl;
        }
        else if (command == "status") {
            showStatus();
        }
        else if (command == "logs") {
            showLogs();
        }
        else if (command == "clear_logs") {
            clearLogs();
        }
        else if (command == "init") {
            int new_order;
            if (iss >> new_order && new_order >= 3) {
                initTree(new_order);
            } else {
                *program_out << "ERROR invalid_init_syntax usage=init_<order> order_must_be_>=3" << std::endl;
            }
        }
        else if (command.empty() || command[0] == '#') {
            // Ignore empty lines and comments
        }
        else {
            *program_out << "ERROR unknown_command=" << command << " use_help_for_commands" << std::endl;
        }
        
        return true;
    }
    
    void initTree(int new_order) {
        order = new_order;
        tree = std::make_unique<datas::LogBTree<int>>(order, log_stream);
        tree_size = 0;
        log_stream.str("");
        log_stream.clear();
        
        *program_out << "INIT_SUCCESS order=" << order << " size=" << tree_size << std::endl;
    }

public:
    BTreeInterface(int initial_order = 4, bool interactive = true) 
        : tree_size(0), order(initial_order), interactive_mode(interactive),
          program_out(&std::cout), tree_log_out(&std::cout) {
        // Tree will be initialized after streams are set
    }
    
    // Set output streams
    void setProgramOutput(const std::string& filename) {
        if (filename == "stdout" || filename == "-") {
            program_out = &std::cout;
        } else if (filename == "stderr") {
            program_out = &std::cerr;
        } else if (filename == "null" || filename == "/dev/null") {
            static std::ofstream null_stream;
            program_out = &null_stream;
        } else {
            program_file = std::make_unique<std::ofstream>(filename);
            if (program_file->is_open()) {
                program_out = program_file.get();
            } else {
                std::cerr << "Warning: Could not open program output file: " << filename << std::endl;
                program_out = &std::cout;
            }
        }
    }
    
    void setTreeLogOutput(const std::string& filename) {
        if (filename == "stdout" || filename == "-") {
            tree_log_out = &std::cout;
        } else if (filename == "stderr") {
            tree_log_out = &std::cerr;
        } else if (filename == "null" || filename == "/dev/null") {
            static std::ofstream null_stream;
            tree_log_out = &null_stream;
        } else {
            tree_log_file = std::make_unique<std::ofstream>(filename);
            if (tree_log_file->is_open()) {
                tree_log_out = tree_log_file.get();
            } else {
                std::cerr << "Warning: Could not open tree log output file: " << filename << std::endl;
                tree_log_out = &std::cout;
            }
        }
    }
    
    void run() {
        // Initialize tree after streams are configured
        if (!tree) {
            initTree(order);
        }
        
        if (interactive_mode) {
            *program_out << "BTree Interface Started (order=" << order << ")" << std::endl;
            printMenu();
        } else {
            *program_out << "READY order=" << order << std::endl;
        }
        
        std::string line;
        while (std::getline(std::cin, line)) {
            if (!processCommand(line)) {
                break;
            }
            
            if (interactive_mode) {
                *program_out << "\nEnter command (help for menu): ";
                program_out->flush();
            }
        }
    }
    
    // Batch mode for programmatic use
    void setBatchMode(bool batch) {
        interactive_mode = !batch;
    }
};

int main(int argc, char* argv[]) {
    int order = 4;
    bool interactive = true;
    std::string program_output = "stdout";
    std::string tree_log_output = "stdout";
    
    // Parse command line arguments
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "--order" && i + 1 < argc) {
            order = std::atoi(argv[++i]);
            if (order < 3) {
                std::cerr << "Error: Order must be >= 3" << std::endl;
                return 1;
            }
        }
        else if (arg == "--batch") {
            interactive = false;
        }
        else if (arg == "--program-out" && i + 1 < argc) {
            program_output = argv[++i];
        }
        else if (arg == "--tree-log-out" && i + 1 < argc) {
            tree_log_output = argv[++i];
        }
        else if (arg == "--help") {
            std::cout << "Usage: " << argv[0] << " [options]\n";
            std::cout << "Options:\n";
            std::cout << "  --order <n>           Set B-tree order (default: 4, minimum: 3)\n";
            std::cout << "  --batch               Run in batch mode (no interactive prompts)\n";
            std::cout << "  --program-out <file>  Program output destination:\n";
            std::cout << "                        stdout (default), stderr, null, or filename\n";
            std::cout << "  --tree-log-out <file> Tree log output destination:\n";
            std::cout << "                        stdout (default), stderr, null, or filename\n";
            std::cout << "  --help                Show this help\n";
            std::cout << "\nCommands:\n";
            std::cout << "  init <order>     - Initialize new tree with given order\n";
            std::cout << "  insert <value>   - Insert a value\n";
            std::cout << "  remove <value>   - Remove a value\n";
            std::cout << "  find <value>     - Search for a value\n";
            std::cout << "  print            - Display the tree\n";
            std::cout << "  size             - Show tree size\n";
            std::cout << "  order            - Show tree order\n";
            std::cout << "  logs             - Show operation logs\n";
            std::cout << "  clear_logs       - Clear operation logs\n";
            std::cout << "  status           - Show tree status\n";
            std::cout << "  quit             - Exit program\n";
            std::cout << "\nExamples:\n";
            std::cout << "  # Both streams to stdout (default):\n";
            std::cout << "  " << argv[0] << " --batch\n";
            std::cout << "  \n";
            std::cout << "  # Program to stdout, tree logs to file:\n";
            std::cout << "  " << argv[0] << " --batch --tree-log-out btree.log\n";
            std::cout << "  \n";
            std::cout << "  # Program to stderr, tree logs to stdout:\n";
            std::cout << "  " << argv[0] << " --batch --program-out stderr\n";
            std::cout << "  \n";
            std::cout << "  # Silence tree logs:\n";
            std::cout << "  " << argv[0] << " --batch --tree-log-out null\n";
            std::cout << "  \n";
            std::cout << "  # Separate to different files:\n";
            std::cout << "  " << argv[0] << " --batch --program-out program.log --tree-log-out tree.log\n";
            return 0;
        }
    }
    
    try {
        BTreeInterface interface(order, interactive);
        
        // Configure output streams
        interface.setProgramOutput(program_output);
        interface.setTreeLogOutput(tree_log_output);
        
        interface.run();
    } catch (const std::exception& e) {
        std::cerr << "FATAL_ERROR " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}