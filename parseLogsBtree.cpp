#include <iostream>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>
#include <regex>
#include <cassert>
#include "LogBTree.hpp"

struct DummyBNode {
    bool is_leaf;
    std::vector<int> keys;
    std::vector<DummyBNode*> children;
    
    DummyBNode(bool leaf) : is_leaf(leaf) {}
    
    ~DummyBNode() {
        for (auto child : children) {
            delete child;
        }
    }
    
    void print(std::ostream& os, int level = 0) const {
        std::string indent(level * 2, ' ');
        
        // Print keys in BTree style: [key1, key2, key3]
        os << indent << "[";
        for (size_t i = 0; i < keys.size(); ++i) {
            os << keys[i];
            if (i + 1 < keys.size()) os << ", ";
        }
        os << "]";
        
        // If it's a leaf, end the line here
        if (is_leaf) {
            os << "\n";
            return;
        }
        
        // For internal nodes, print children on new lines
        os << "\n";
        for (size_t i = 0; i < children.size(); ++i) {
            if (children[i]) {
                children[i]->print(os, level + 1);
            } else {
                os << indent << "  [null]\n";
            }
        }
    }
};

struct DummyBTree {
    std::unordered_map<void*, DummyBNode*> node_map;
    void* root_id = nullptr;
    int order;
    
    DummyBTree(int order_) : order(order_) {
        node_map[nullptr] = nullptr;
    }
    
    ~DummyBTree() {
        // Clean up all nodes except nullptr
        for (auto& pair : node_map) {
            if (pair.first != nullptr && pair.second != nullptr) {
                // Set children to nullptr to avoid double deletion
                pair.second->children.clear();
                delete pair.second;
            }
        }
    }
    
    DummyBNode* getRoot() {
        return node_map[root_id];
    }
    
    void print(std::ostream& os) const {
        os << "Dummy BTree (root=" << root_id << "):\n";
        if (root_id && node_map.count(root_id) && node_map.at(root_id)) {
            node_map.at(root_id)->print(os, 0);
        } else {
            os << "(empty tree)\n";
        }
    }
    
    // Add method to ensure node exists
    void ensureNodeExists(void* node_id, bool is_leaf = true) {
        if (node_id && !node_map.count(node_id)) {
            node_map[node_id] = new DummyBNode(is_leaf);
            std::cout << "    Created node " << node_id << " (leaf=" << is_leaf << ")" << std::endl;
        }
    }
};

class BTreeLogParser {
public:
    static void parseLog(DummyBTree& tree, const std::string& log_line) {
        // Handle different types of logs
        if (log_line.find("[TREE_INIT]") != std::string::npos) {
            parseTreeInit(tree, log_line);
        }
        else if (log_line.find("[NODE_STATE]") != std::string::npos) {
            parseNodeState(tree, log_line);
        }
        else if (log_line.find("[PARENT_CHILD]") != std::string::npos) {
            parseParentChild(tree, log_line);
        }
        else if (log_line.find("[TREE_INSERT_COMPLETE]") != std::string::npos ||
                 log_line.find("[TREE_REMOVE_COMPLETE]") != std::string::npos) {
            parseTreeComplete(tree, log_line);
        }
        else if (log_line.find("[Split Keys]") != std::string::npos) {
            parseSplitKeys(tree, log_line);
        }
        else if (log_line.find("[Merge Result]") != std::string::npos) {
            parseMergeResult(tree, log_line);
        }
        // Ignore other logs for now as NODE_STATE provides complete information
    }

private:
    static void* parseAddress(const std::string& str) {
        size_t pos = str.find("0x");
        if (pos == std::string::npos) {
            if (str.find("(nil)") != std::string::npos || str.find("nullptr") != std::string::npos) {
                return nullptr;
            }
            return nullptr;
        }
        
        std::string addr_str = str.substr(pos);
        size_t end = addr_str.find_first_of(" )=\n\t");
        if (end != std::string::npos) {
            addr_str = addr_str.substr(0, end);
        }
        
        unsigned long long addr_val;
        std::stringstream ss;
        ss << std::hex << addr_str.substr(2);
        ss >> addr_val;
        return reinterpret_cast<void*>(addr_val);
    }
    
    static int parseValue(const std::string& str, const std::string& prefix) {
        size_t pos = str.find(prefix);
        if (pos == std::string::npos) return 0;
        
        pos += prefix.length();
        size_t end = str.find_first_of(" \n\t", pos);
        if (end == std::string::npos) end = str.length();
        std::string val_str = str.substr(pos, end - pos);
        return std::stoi(val_str);
    }
    
    static bool parseBool(const std::string& str, const std::string& prefix) {
        size_t pos = str.find(prefix);
        if (pos == std::string::npos) return false;
        
        pos += prefix.length();
        return str.substr(pos, 4) == "true";
    }
    
    static std::vector<int> parseKeyArray(const std::string& str, const std::string& prefix) {
        std::vector<int> keys;
        size_t start = str.find(prefix + "[");
        if (start == std::string::npos) return keys;
        
        size_t end = str.find("]", start);
        if (end == std::string::npos) return keys;
        
        std::string keys_str = str.substr(start + prefix.length() + 1, end - start - prefix.length() - 1);
        if (keys_str.empty()) return keys;
        
        std::stringstream ss(keys_str);
        std::string key;
        while (std::getline(ss, key, ',')) {
            keys.push_back(std::stoi(key));
        }
        
        return keys;
    }
    
    static std::vector<void*> parseAddressArray(const std::string& str, const std::string& prefix) {
        std::vector<void*> addresses;
        size_t start = str.find(prefix + "[");
        if (start == std::string::npos) return addresses;
        
        size_t end = str.find("]", start);
        if (end == std::string::npos) return addresses;
        
        std::string addr_str = str.substr(start + prefix.length() + 1, end - start - prefix.length() - 1);
        if (addr_str.empty()) return addresses;
        
        // Split by comma and parse each address
        std::stringstream ss(addr_str);
        std::string addr;
        while (std::getline(ss, addr, ',')) {
            addresses.push_back(parseAddress(addr));
        }
        
        return addresses;
    }
    
    static void parseTreeInit(DummyBTree& tree, const std::string& line) {
        // [TREE_INIT] order=... root=...
        int order = parseValue(line, "order=");
        void* root = parseAddress(line.substr(line.find("root=")));
        
        tree.order = order;
        tree.root_id = root;
        
        if (root) {
            tree.ensureNodeExists(root, true); // Initial root is typically a leaf
        }
        
        std::cout << "  Initialized tree: order=" << order << ", root=" << root << std::endl;
    }
    
    static void parseNodeState(DummyBTree& tree, const std::string& line) {
        // [NODE_STATE] context node=... is_leaf=... keys_count=... children_count=... keys=[...] children=[...]
        
        size_t node_pos = line.find("node=");
        if (node_pos == std::string::npos) return;
        
        void* node = parseAddress(line.substr(node_pos));
        if (!node) return;
        
        bool is_leaf = parseBool(line, "is_leaf=");
        std::vector<int> keys = parseKeyArray(line, "keys=");
        std::vector<void*> children = parseAddressArray(line, "children=");
        
        // Ensure node exists
        tree.ensureNodeExists(node, is_leaf);
        
        // Update node properties
        DummyBNode* dummy_node = tree.node_map[node];
        if (dummy_node) {
            dummy_node->is_leaf = is_leaf;
            dummy_node->keys = keys;
            
            // Update children
            dummy_node->children.clear();
            for (void* child_addr : children) {
                if (child_addr) {
                    tree.ensureNodeExists(child_addr, true); // We'll update leaf status later
                    dummy_node->children.push_back(tree.node_map[child_addr]);
                } else {
                    dummy_node->children.push_back(nullptr);
                }
            }
            
            std::cout << "  Updated node " << node << ": is_leaf=" << is_leaf 
                      << ", keys=" << keys.size() << ", children=" << children.size() << std::endl;
        }
    }
    
    static void parseParentChild(DummyBTree& tree, const std::string& line) {
        // [PARENT_CHILD] context parent=... child_index=... child=...
        void* parent = parseAddress(line);
        int child_index = parseValue(line, "child_index=");
        void* child = parseAddress(line.substr(line.find("child=")));
        
        if (parent && child) {
            tree.ensureNodeExists(parent, false); // Parent is typically internal
            tree.ensureNodeExists(child, true);    // We'll update this later
            
            DummyBNode* parent_node = tree.node_map[parent];
            DummyBNode* child_node = tree.node_map[child];
            
            if (parent_node && child_node) {
                // Ensure parent has enough children slots
                while (parent_node->children.size() <= child_index) {
                    parent_node->children.push_back(nullptr);
                }
                parent_node->children[child_index] = child_node;
                
                std::cout << "  Set parent-child: " << parent << "[" << child_index << "] = " << child << std::endl;
            }
        }
    }
    
    static void parseSplitKeys(DummyBTree& tree, const std::string& line) {
        // [Split Keys] original_node=... original_keys=[...] new_sibling=... new_keys=[...]
        void* original_node = parseAddress(line);
        void* new_sibling = parseAddress(line.substr(line.find("new_sibling=")));
        
        std::vector<int> original_keys = parseKeyArray(line, "original_keys=");
        std::vector<int> new_keys = parseKeyArray(line, "new_keys=");
        
        if (original_node && new_sibling) {
            // Determine if nodes are leaves (assume same type)
            bool is_leaf = true;
            if (tree.node_map.count(original_node) && tree.node_map[original_node]) {
                is_leaf = tree.node_map[original_node]->is_leaf;
            }
            
            tree.ensureNodeExists(original_node, is_leaf);
            tree.ensureNodeExists(new_sibling, is_leaf);
            
            // Update keys
            if (tree.node_map[original_node]) {
                tree.node_map[original_node]->keys = original_keys;
            }
            if (tree.node_map[new_sibling]) {
                tree.node_map[new_sibling]->keys = new_keys;
            }
            
            std::cout << "  Split keys: original=" << original_node << " (" << original_keys.size() 
                      << " keys), new=" << new_sibling << " (" << new_keys.size() << " keys)" << std::endl;
        }
    }
    
    static void parseMergeResult(DummyBTree& tree, const std::string& line) {
        // [Merge Result] merged_node=... deleted_node=...
        void* deleted_node = parseAddress(line.substr(line.find("deleted_node=")));
        
        if (tree.node_map.count(deleted_node) && tree.node_map[deleted_node]) {
            delete tree.node_map[deleted_node];
            tree.node_map.erase(deleted_node);
            std::cout << "  Deleted merged node: " << deleted_node << std::endl;
        }
    }
    
    static void parseTreeComplete(DummyBTree& tree, const std::string& line) {
        // [TREE_INSERT_COMPLETE] value=... root=... or [TREE_REMOVE_COMPLETE] value=... root=...
        void* root = parseAddress(line.substr(line.find("root=")));
        
        if (root && tree.root_id != root) {
            tree.root_id = root;
            tree.ensureNodeExists(root);
            std::cout << "  Root changed to: " << root << std::endl;
        }
    }
};

int main() {
    std::cout << "=== Enhanced LogBTree Test ===" << std::endl;
    
    const int order = 4; // B-tree of order 4
    std::ostringstream log_stream;
    datas::LogBTree<int> log_tree(order, log_stream);
    DummyBTree dummy_tree(order);
    
    // Test 1: Basic insertions
    std::cout << "\n--- Test 1: Basic Insertions ---" << std::endl;
    
    std::vector<int> values = {10, 20, 5};
    
    for (int val : values) {
        std::cout << "\nInserting " << val << "..." << std::endl;
        
        size_t log_pos_before = log_stream.str().length();
        log_tree.insert(val);
        
        // Parse the new logs
        std::string new_logs = log_stream.str().substr(log_pos_before);
        std::istringstream iss(new_logs);
        std::string line;
        
        std::cout << "Parsing insertion logs:" << std::endl;
        while (std::getline(iss, line)) {
            if (!line.empty()) {
                std::cout << "  Log: " << line << std::endl;
                BTreeLogParser::parseLog(dummy_tree, line);
            }
        }
        
        std::cout << "\nOriginal BTree:" << std::endl;
        std::cout << log_tree << std::endl;
        
        std::cout << "Dummy BTree Reconstruction:" << std::endl;
        dummy_tree.print(std::cout);
        std::cout << std::endl;
    }
    
    // Test 2: More insertions to trigger splits
    std::cout << "\n--- Test 2: More Insertions (trigger splits) ---" << std::endl;
    
    std::vector<int> more_values = {6, 12, 30};
    
    for (int val : more_values) {
        std::cout << "\nInserting " << val << "..." << std::endl;
        
        size_t log_pos_before = log_stream.str().length();
        log_tree.insert(val);
        
        std::string new_logs = log_stream.str().substr(log_pos_before);
        std::istringstream iss(new_logs);
        std::string line;
        
        std::cout << "Parsing insertion logs:" << std::endl;
        while (std::getline(iss, line)) {
            if (!line.empty()) {
                std::cout << "  Log: " << line << std::endl;
                BTreeLogParser::parseLog(dummy_tree, line);
            }
        }
        
        std::cout << "\nAfter inserting " << val << ":" << std::endl;
        std::cout << "Original BTree:" << std::endl;
        std::cout << log_tree << std::endl;
        
        std::cout << "Dummy BTree Reconstruction:" << std::endl;
        dummy_tree.print(std::cout);
        std::cout << std::endl;
    }
    
    // Test 3: Search operations (should not affect dummy tree)
    std::cout << "\n--- Test 3: Search Operations ---" << std::endl;
    
    size_t log_pos_before_search = log_stream.str().length();
    
    for (int val : {12, 25, 5}) {
        std::cout << "Searching for " << val << ": " 
                  << (log_tree.find(val) ? "found" : "not found") << std::endl;
    }
    
    std::cout << "Trees should be unchanged after search." << std::endl;
    
    // Test 4: Removal
    std::cout << "\n--- Test 4: Removal ---" << std::endl;
    
    std::vector<int> remove_values = {6, 12};
    
    for (int val : remove_values) {
        std::cout << "\nRemoving " << val << "..." << std::endl;
        
        size_t log_pos_before = log_stream.str().length();
        log_tree.remove(val);
        
        // Parse removal logs
        std::string new_logs = log_stream.str().substr(log_pos_before);
        std::istringstream iss(new_logs);
        std::string line;
        
        std::cout << "Parsing removal logs:" << std::endl;
        while (std::getline(iss, line)) {
            if (!line.empty()) {
                std::cout << "  Log: " << line << std::endl;
                BTreeLogParser::parseLog(dummy_tree, line);
            }
        }
        
        std::cout << "\nAfter removal:" << std::endl;
        std::cout << "Original BTree:" << std::endl;
        std::cout << log_tree << std::endl;
        
        std::cout << "Dummy BTree Reconstruction:" << std::endl;
        dummy_tree.print(std::cout);
        std::cout << std::endl;
    }
    
    // Debug: Print all captured logs
    std::cout << "\n--- Debug: All Logs ---" << std::endl;
    std::cout << log_stream.str() << std::endl;
    
    std::cout << "\n=== Test Complete ===" << std::endl;
    return 0;
}