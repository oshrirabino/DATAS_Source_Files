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
        std::string indent(level * 4, ' ');
        os << indent << "Keys: [";
        for (size_t i = 0; i < keys.size(); ++i) {
            os << keys[i];
            if (i + 1 < keys.size()) os << ", ";
        }
        os << "]\n";
        
        if (!is_leaf) {
            for (const auto& child : children) {
                if (child) child->print(os, level + 1);
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
        if (node_map.at(root_id)) {
            node_map.at(root_id)->print(os, 0);
        } else {
            os << "(empty tree)\n";
        }
    }
};

class BTreeLogParser {
public:
    static void parseLog(DummyBTree& tree, const std::string& log_line) {
        // Only process structure-changing logs
        if (log_line.find("[Split Result]") != std::string::npos) {
            parseSplitResult(tree, log_line);
        }
        else if (log_line.find("[Split Keys]") != std::string::npos) {
            parseSplitKeys(tree, log_line);
        }
        else if (log_line.find("[Split Child Result]") != std::string::npos) {
            parseSplitChildResult(tree, log_line);
        }
        else if (log_line.find("[Merge Result]") != std::string::npos) {
            parseMergeResult(tree, log_line);
        }
        else if (log_line.find("[Insert Leaf]") != std::string::npos) {
            parseInsertLeaf(tree, log_line);
        }
        else if (log_line.find("[Remove Leaf]") != std::string::npos) {
            parseRemoveLeaf(tree, log_line);
        }
        else if (log_line.find("[Remove Pred Found]") != std::string::npos ||
                 log_line.find("[Remove Succ Found]") != std::string::npos) {
            parseKeyReplacement(tree, log_line);
        }
        else if (log_line.find("[TREE_INSERT_COMPLETE]") != std::string::npos) {
            parseTreeComplete(tree, log_line);
        }
        // Ignore: search, navigation, and analysis logs
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
        size_t end = addr_str.find_first_of(" )=");
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
        size_t end = str.find_first_of(" \n", pos);
        std::string val_str = str.substr(pos, end - pos);
        return std::stoi(val_str);
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
    
    static void parseSplitResult(DummyBTree& tree, const std::string& line) {
        // [Split Result] original_node=... new_sibling=... mid_val=...
        void* new_sibling = nullptr;
        
        size_t sib_pos = line.find("new_sibling=");
        if (sib_pos != std::string::npos) {
            new_sibling = parseAddress(line.substr(sib_pos));
        }
        
        if (new_sibling) {
            // We don't know if it's leaf yet, we'll update when we get the keys
            tree.node_map[new_sibling] = new DummyBNode(true); // Default to leaf
            std::cout << "  Created new sibling: " << new_sibling << std::endl;
        }
    }
    
    static void parseSplitKeys(DummyBTree& tree, const std::string& line) {
        // [Split Keys] original_keys=[...] new_keys=[...]
        std::vector<int> original_keys = parseKeyArray(line, "original_keys=");
        std::vector<int> new_keys = parseKeyArray(line, "new_keys=");
        
        // Find the nodes from recent split result
        // This is tricky - we need to match with the previous split result
        // For now, find the most recent new sibling
        void* new_sibling = nullptr;
        for (auto& pair : tree.node_map) {
            if (pair.first != nullptr && pair.second && pair.second->keys.empty()) {
                new_sibling = pair.first;
                break;
            }
        }
        
        if (new_sibling && tree.node_map[new_sibling]) {
            tree.node_map[new_sibling]->keys = new_keys;
            std::cout << "  Updated sibling " << new_sibling << " with keys: [";
            for (size_t i = 0; i < new_keys.size(); ++i) {
                std::cout << new_keys[i];
                if (i + 1 < new_keys.size()) std::cout << ", ";
            }
            std::cout << "]" << std::endl;
        }
    }
    
    static void parseSplitChildResult(DummyBTree& tree, const std::string& line) {
        // [Split Child Result] parent=... left_child=... right_child=... promoted_key=...
        void* parent = parseAddress(line);
        int promoted_key = parseValue(line, "promoted_key=");
        
        if (tree.node_map.count(parent) && tree.node_map[parent]) {
            // The promoted key should now be in the parent
            // We need to update the parent's keys - this is complex without exact position
            std::cout << "  Parent " << parent << " received promoted key: " << promoted_key << std::endl;
        }
    }
    
    static void parseMergeResult(DummyBTree& tree, const std::string& line) {
        // [Merge Result] merged_node=... deleted_node=...
        void* deleted_node = parseAddress(line.substr(line.find("deleted_node=")));
        
        if (tree.node_map.count(deleted_node)) {
            delete tree.node_map[deleted_node];
            tree.node_map.erase(deleted_node);
            std::cout << "  Deleted merged node: " << deleted_node << std::endl;
        }
    }
    
    static void parseInsertLeaf(DummyBTree& tree, const std::string& line) {
        // [Insert Leaf] node=... inserting key=... at index=...
        void* node = parseAddress(line);
        int key = parseValue(line, "inserting key=");
        int index = parseValue(line, "at index=");
        
        if (tree.node_map.count(node) && tree.node_map[node]) {
            tree.node_map[node]->keys.insert(tree.node_map[node]->keys.begin() + index, key);
            std::cout << "  Inserted key " << key << " at index " << index << " in node " << node << std::endl;
        }
    }
    
    static void parseRemoveLeaf(DummyBTree& tree, const std::string& line) {
        // [Remove Leaf] node=... removing key=... at index=...
        void* node = parseAddress(line);
        int key = parseValue(line, "removing key=");
        int index = parseValue(line, "at index=");
        
        if (tree.node_map.count(node) && tree.node_map[node] && 
            index < tree.node_map[node]->keys.size()) {
            tree.node_map[node]->keys.erase(tree.node_map[node]->keys.begin() + index);
            std::cout << "  Removed key " << key << " from index " << index << " in node " << node << std::endl;
        }
    }
    
    static void parseKeyReplacement(DummyBTree& tree, const std::string& line) {
        // [Remove Pred Found] predecessor=... replacing key=... in node=...
        // [Remove Succ Found] successor=... replacing key=... in node=...
        void* node = parseAddress(line.substr(line.find("in node=")));
        int old_key = parseValue(line, "replacing key=");
        int new_key = 0;
        
        if (line.find("predecessor=") != std::string::npos) {
            new_key = parseValue(line, "predecessor=");
        } else {
            new_key = parseValue(line, "successor=");
        }
        
        if (tree.node_map.count(node) && tree.node_map[node]) {
            // Find and replace the old key
            for (int& k : tree.node_map[node]->keys) {
                if (k == old_key) {
                    k = new_key;
                    break;
                }
            }
            std::cout << "  Replaced key " << old_key << " with " << new_key << " in node " << node << std::endl;
        }
    }
    
    static void parseTreeComplete(DummyBTree& tree, const std::string& line) {
        // [TREE_INSERT_COMPLETE] value=... root=...
        void* root = parseAddress(line.substr(line.find("root=")));
        
        if (tree.root_id != root) {
            tree.root_id = root;
            if (!tree.node_map.count(root)) {
                tree.node_map[root] = new DummyBNode(true); // Will be updated
            }
            std::cout << "  Root changed to: " << root << std::endl;
        }
    }
};

int main() {
    std::cout << "=== LogBTree Test ===" << std::endl;
    
    const int order = 4; // B-tree of order 4
    std::ostringstream log_stream;
    datas::LogBTree<int> log_tree(order, log_stream);
    DummyBTree dummy_tree(order);
    
    // Test 1: Basic insertions
    std::cout << "\n--- Test 1: Basic Insertions ---" << std::endl;
    
    std::vector<int> values = {10, 20, 5, 6, 12, 30, 7, 17};
    
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
        
        std::cout << "Dummy BTree:" << std::endl;
        dummy_tree.print(std::cout);
        std::cout << std::endl;
    }
    
    // Test 2: Search operations (should not affect dummy tree)
    std::cout << "\n--- Test 2: Search Operations ---" << std::endl;
    
    size_t log_pos_before_search = log_stream.str().length();
    
    for (int val : {12, 25, 5}) {
        std::cout << "Searching for " << val << ": " 
                  << (log_tree.find(val) ? "found" : "not found") << std::endl;
    }
    
    // Parse search logs (should be ignored)
    std::string search_logs = log_stream.str().substr(log_pos_before_search);
    std::istringstream search_iss(search_logs);
    std::string line;
    
    std::cout << "Search logs (should be ignored):" << std::endl;
    while (std::getline(search_iss, line)) {
        if (!line.empty()) {
            std::cout << "  Ignoring: " << line << std::endl;
        }
    }
    
    std::cout << "Trees should be unchanged after search." << std::endl;
    
    // Test 3: Removal
    std::cout << "\n--- Test 3: Removal ---" << std::endl;
    
    std::vector<int> remove_values = {6, 12, 20};
    
    for (int val : remove_values) {
        std::cout << "\nRemoving " << val << "..." << std::endl;
        
        size_t log_pos_before = log_stream.str().length();
        log_tree.remove(val);
        
        // Parse removal logs
        std::string new_logs = log_stream.str().substr(log_pos_before);
        std::istringstream iss(new_logs);
        
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
        
        std::cout << "Dummy BTree:" << std::endl;
        dummy_tree.print(std::cout);
        std::cout << std::endl;
    }
    
    // Test 4: More complex operations
    std::cout << "\n--- Test 4: More Insertions (trigger more splits) ---" << std::endl;
    
    std::vector<int> more_values = {1, 2, 3, 4, 8, 9, 11, 13, 14, 15};
    
    for (int val : more_values) {
        std::cout << "\nInserting " << val << "..." << std::endl;
        
        size_t log_pos_before = log_stream.str().length();
        log_tree.insert(val);
        
        std::string new_logs = log_stream.str().substr(log_pos_before);
        std::istringstream iss(new_logs);
        
        while (std::getline(iss, line)) {
            if (!line.empty()) {
                BTreeLogParser::parseLog(dummy_tree, line);
            }
        }
        
        // Only show final state for brevity
        if (val == more_values.back()) {
            std::cout << "\nFinal state after all insertions:" << std::endl;
            std::cout << "Original BTree:" << std::endl;
            std::cout << log_tree << std::endl;
            
            std::cout << "Dummy BTree:" << std::endl;
            dummy_tree.print(std::cout);
        }
    }
    
    std::cout << "\n=== Test Complete ===" << std::endl;
    return 0;
}