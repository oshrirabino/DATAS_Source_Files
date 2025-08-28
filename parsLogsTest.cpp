#include <iostream>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>
#include <regex>
#include <cassert>
#include "LogAVLTree.hpp"

struct DummyNode {
    int data;
    DummyNode* left;
    DummyNode* right;

    DummyNode(int value) : data(value), left(nullptr), right(nullptr) {}
    
    ~DummyNode() {
        delete left;
        delete right;
    }
    
    // Inorder traversal for comparison
    void inorder(std::ostream& os) const {
        if (left) left->inorder(os);
        os << data << " ";
        if (right) right->inorder(os);
    }
};

struct DummyTree {
    std::unordered_map<void*, DummyNode*> node_map;
    void* root_id = nullptr;

    DummyTree() {
        node_map[nullptr] = nullptr;
    }
    
    ~DummyTree() {
        // Clean up all nodes except nullptr
        for (auto& pair : node_map) {
            if (pair.first != nullptr && pair.second != nullptr) {
                // Set children to nullptr to avoid double deletion
                pair.second->left = nullptr;
                pair.second->right = nullptr;
                delete pair.second;
            }
        }
    }
    
    DummyNode* getRoot() {
        return node_map[root_id];
    }
    
    void inorder(std::ostream& os) const {
        if (node_map.at(root_id)) {
            node_map.at(root_id)->inorder(os);
        }
        os << std::endl;
    }
};

// Function for DummyTree - add this to your test script
void printDummyTreeStructure(DummyNode* node, const std::string& prefix = "", bool isLast = true) {
    if (node == nullptr) {
        std::cout << prefix << (isLast ? "└── " : "├── ") << "null" << std::endl;
        return;
    }
    
    std::cout << prefix << (isLast ? "└── " : "├── ") << node->data << std::endl;
    
    if (node->left != nullptr || node->right != nullptr) {
        // Print left child
        printDummyTreeStructure(node->left, prefix + (isLast ? "    " : "│   "), node->right == nullptr);
        // Print right child
        printDummyTreeStructure(node->right, prefix + (isLast ? "    " : "│   "), true);
    }
}
// Helper function to call from DummyTree
void printDummyTreeStructure(const DummyTree& tree) {
    std::cout << "DummyTree Structure:" << std::endl;
    if (tree.root_id == nullptr || tree.node_map.at(tree.root_id) == nullptr) {
        std::cout << "└── (empty)" << std::endl;
    } else {
        printDummyTreeStructure(tree.node_map.at(tree.root_id));
    }
}

class LogParser {
public:
    static void parseLog(DummyTree& tree, const std::string& log_line) {
        // Only process structure-changing logs, ignore find/search logs
        if (log_line.find("[ROOT_CREATE]") != std::string::npos) {
            parseRootCreate(tree, log_line);
        }
        else if (log_line.find("[NODE_CREATE]") != std::string::npos) {
            parseNodeCreate(tree, log_line);
        }
        else if (log_line.find("[NODE_DELETE]") != std::string::npos) {
            parseNodeDelete(tree, log_line);
        }
        else if (log_line.find("[POINTER_CHANGE]") != std::string::npos) {
            parsePointerChange(tree, log_line);
        }
        else if (log_line.find("[DATA_CHANGE]") != std::string::npos) {
            parseDataChange(tree, log_line);
        }
        else if (log_line.find("[ROOT_CHANGE]") != std::string::npos) {
            parseRootChange(tree, log_line);
        }
        // Ignore: [FIND], [TREE_FIND], [INSERT], [REMOVE], [ROTATE_*], [FIND_PREDECESSOR], etc.
    }

private:
    static void* parseAddress(const std::string& str) {
        size_t pos = str.find("0x");
        if (pos == std::string::npos) {
            // Handle nullptr case
            if (str.find("(nil)") != std::string::npos || str.find("nullptr") != std::string::npos) {
                return nullptr;
            }
            return nullptr;
        }
        
        std::string addr_str = str.substr(pos);
        // Find the end of the address
        size_t end = addr_str.find_first_of(" )=");
        if (end != std::string::npos) {
            addr_str = addr_str.substr(0, end);
        }
        
        // Convert hex string to pointer
        unsigned long long addr_val;
        std::stringstream ss;
        ss << std::hex << addr_str.substr(2); // Remove "0x"
        ss >> addr_val;
        return reinterpret_cast<void*>(addr_val);
    }
    
    static int parseValue(const std::string& str, const std::string& prefix) {
        size_t pos = str.find(prefix);
        if (pos == std::string::npos) return 0;
        
        pos += prefix.length();
        size_t end = str.find_first_of(" \n", pos);
        std::string val_str = str.substr(pos, end - pos);
        return std::stoi(val_str);
    }
    
    static void parseRootCreate(DummyTree& tree, const std::string& line) {
        // [ROOT_CREATE] address=0x... value=...
        void* address = parseAddress(line);
        int value = parseValue(line, "value=");
        
        tree.node_map[address] = new DummyNode(value);
        tree.root_id = address;
        
        std::cout << "  Created root: " << address << " with value " << value << std::endl;
    }
    
    static void parseNodeCreate(DummyTree& tree, const std::string& line) {
        // [NODE_CREATE] address=0x... value=...
        void* address = parseAddress(line);
        int value = parseValue(line, "value=");
        
        tree.node_map[address] = new DummyNode(value);
        
        std::cout << "  Created node: " << address << " with value " << value << std::endl;
    }
    
    static void parseNodeDelete(DummyTree& tree, const std::string& line) {
        // [NODE_DELETE] address=0x... value=... type=...
        void* address = parseAddress(line);
        
        if (tree.node_map.count(address) && tree.node_map[address]) {
            // Set children to nullptr to prevent cascade deletion
            tree.node_map[address]->left = nullptr;
            tree.node_map[address]->right = nullptr;
            delete tree.node_map[address];
            tree.node_map.erase(address);
            
            std::cout << "  Deleted node: " << address << std::endl;
        }
    }
    
    static void parsePointerChange(DummyTree& tree, const std::string& line) {
        // [POINTER_CHANGE] 0x....left=0x... or [POINTER_CHANGE] 0x....right=0x...
        
        // Find the parent address (before the dot)
        size_t start = line.find("0x");
        if (start == std::string::npos) return;
        
        size_t dot_pos = line.find(".", start);
        if (dot_pos == std::string::npos) return;
        
        std::string parent_str = line.substr(start, dot_pos - start);
        void* parent_addr = parseAddress("0x" + parent_str.substr(2));
        
        // Determine if it's left or right
        bool is_left = line.find(".left=") != std::string::npos;
        
        // Find the child address (after the equals)
        size_t eq_pos = line.find("=", dot_pos);
        if (eq_pos == std::string::npos) return;
        
        void* child_addr = parseAddress(line.substr(eq_pos + 1));
        
        if (tree.node_map.count(parent_addr) && tree.node_map[parent_addr]) {
            if (is_left) {
                tree.node_map[parent_addr]->left = tree.node_map[child_addr];
                std::cout << "  Pointer change: " << parent_addr << ".left = " << child_addr << std::endl;
            } else {
                tree.node_map[parent_addr]->right = tree.node_map[child_addr];
                std::cout << "  Pointer change: " << parent_addr << ".right = " << child_addr << std::endl;
            }
        }
    }
    
    static void parseDataChange(DummyTree& tree, const std::string& line) {
        // [DATA_CHANGE] node=0x... old_value=... new_value=...
        void* address = parseAddress(line);
        int new_value = parseValue(line, "new_value=");
        
        if (tree.node_map.count(address) && tree.node_map[address]) {
            tree.node_map[address]->data = new_value;
            std::cout << "  Data change: " << address << " = " << new_value << std::endl;
        }
    }
    
    static void parseRootChange(DummyTree& tree, const std::string& line) {
        // [ROOT_CHANGE] old=0x... new=0x...
        size_t new_pos = line.find("new=");
        if (new_pos != std::string::npos) {
            void* new_root = parseAddress(line.substr(new_pos));
            tree.root_id = new_root;
            std::cout << "  Root changed to: " << new_root << std::endl;
        }
    }
};

int main() {
    std::cout << "=== Enhanced LogAVLTree Test ===" << std::endl;
    
    // Test 1: Basic insertions
    std::cout << "\n--- Test 1: Basic Insertions ---" << std::endl;
    
    std::ostringstream log_stream;
    datas::LogAVLTree<int> log_tree(log_stream);
    DummyTree dummy_tree;
    
    std::vector<int> values = {10, 5, 15, 3, 7, 12, 20, 1};
    
    for (int val : values) {
        std::cout << "\nInserting " << val << "..." << std::endl;
        log_tree.insert(val);
        
        // Parse the new logs
        std::string new_logs = log_stream.str();
        std::istringstream iss(new_logs);
        std::string line;
        
        // Find only the new lines since last parse
        static size_t last_pos = 0;
        std::string recent_logs = new_logs.substr(last_pos);
        last_pos = new_logs.length();
        
        std::istringstream recent_iss(recent_logs);
        while (std::getline(recent_iss, line)) {
            if (!line.empty()) {
                LogParser::parseLog(dummy_tree, line);
            }
        }
        
        // Compare inorder traversals
        std::cout << "Original tree: ";
        log_tree.inorder();
        
        std::cout << "Dummy tree:    ";
        dummy_tree.inorder(std::cout);
    }
    
    // Test 2: Search operations (should not affect dummy tree)
    std::cout << "\n--- Test 2: Search Operations ---" << std::endl;
    
    size_t log_pos_before_search = log_stream.str().length();
    
    for (int val : {7, 25, 3}) {
        std::cout << "Searching for " << val << ": " 
                  << (log_tree.exist_in_tree(val) ? "found" : "not found") << std::endl;
    }
    
    // Parse search logs (should be ignored)
    std::string search_logs = log_stream.str().substr(log_pos_before_search);
    std::istringstream search_iss(search_logs);
    std::string line;
    
    std::cout << "Parsing search logs (should be ignored):" << std::endl;
    while (std::getline(search_iss, line)) {
        if (!line.empty()) {
            std::cout << "  Ignoring: " << line << std::endl;
            LogParser::parseLog(dummy_tree, line);
        }
    }
    
    std::cout << "Trees should be unchanged after search:" << std::endl;
    std::cout << "Original tree: ";
    log_tree.inorder();
    std::cout << "Dummy tree:    ";
    dummy_tree.inorder(std::cout);
    
    // Test 3: Removal
    std::cout << "\n--- Test 3: Removal ---" << std::endl;
    
    size_t log_pos_before_remove = log_stream.str().length();
    
    std::cout << "Removing 5..." << std::endl;
    bool removed = log_tree.remove(5);
    std::cout << "Removal " << (removed ? "successful" : "failed") << std::endl;
    
    if (removed) {
        // Parse remove logs
        std::string remove_logs = log_stream.str().substr(log_pos_before_remove);
        std::istringstream remove_iss(remove_logs);
        
        std::cout << "Parsing removal logs:" << std::endl;
        while (std::getline(remove_iss, line)) {
            if (!line.empty()) {
                LogParser::parseLog(dummy_tree, line);
            }
        }
        
        std::cout << "After removal:" << std::endl;
        std::cout << "Original tree: ";
        log_tree.inorder();
        std::cout << "Dummy tree:    ";
        dummy_tree.inorder(std::cout);
    }
    
    // Test 4: More complex operations
    std::cout << "\n--- Test 4: More Insertions (trigger rotations) ---" << std::endl;
    
    size_t log_pos_before_complex = log_stream.str().length();
    
    std::vector<int> more_values = {2, 4, 6, 8, 9};
    for (int val : more_values) {
        std::cout << "\nInserting " << val << "..." << std::endl;
        log_tree.insert(val);
        
        // Parse the new logs
        std::string new_logs = log_stream.str().substr(log_pos_before_complex);
        log_pos_before_complex = log_stream.str().length();
        
        std::istringstream iss(new_logs);
        while (std::getline(iss, line)) {
            if (!line.empty()) {
                LogParser::parseLog(dummy_tree, line);
            }
        }
        
        std::cout << "Original tree: ";
        log_tree.inorder();
        std::cout << "Dummy tree:    ";
        dummy_tree.inorder(std::cout);
    }
    
    std::cout << "\n=== Final Verification ===" << std::endl;
    std::cout << "Final Original tree: ";
    log_tree.inorder();
    std::cout << "Final Dummy tree:    ";
    dummy_tree.inorder(std::cout);
    
    std::cout << "\n=== Test Complete ===" << std::endl;
    printDummyTreeStructure(dummy_tree);
    log_tree.printTreeStructure();
    return 0;
}