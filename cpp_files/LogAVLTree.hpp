#ifndef ENHANCED_LOGAVL_TREE_HPP
#define ENHANCED_LOGAVL_TREE_HPP

#include "AVLTree.hpp"
#include "LogDatas.hpp"

namespace datas {

template<typename T>
class LogAVLTree : public AVLTree<T>, public LogDatas {
    using typename AVLTree<T>::AVLNode;

protected:
    class LogAVLNode : public AVLNode {
        LogAVLTree<T>* owner;

    public:
        LogAVLNode(const T& value, LogAVLTree<T>* tree_owner)
            : AVLNode(value), owner(tree_owner) {}

        AVLNode* rotate_right() override {
            // Log before rotation
            owner->buffer << "[ROTATE_RIGHT] node=" << this 
                         << " left=" << this->left 
                         << " left_right=" << (this->left ? this->left->right : nullptr);
            owner->log();

            // Call original rotation
            AVLNode* new_root = AVLNode::rotate_right();

            // Log after rotation - the pointer changes
            owner->buffer << "[POINTER_CHANGE] " << this << ".left=" << this->left;
            owner->log();
            owner->buffer << "[POINTER_CHANGE] " << new_root << ".right=" << this;
            owner->log();
            
            return new_root;
        }

        AVLNode* rotate_left() override {
            // Log before rotation
            owner->buffer << "[ROTATE_LEFT] node=" << this 
                         << " right=" << this->right 
                         << " right_left=" << (this->right ? this->right->left : nullptr);
            owner->log();

            // Call original rotation
            AVLNode* new_root = AVLNode::rotate_left();

            // Log after rotation - the pointer changes
            owner->buffer << "[POINTER_CHANGE] " << this << ".right=" << this->right;
            owner->log();
            owner->buffer << "[POINTER_CHANGE] " << new_root << ".left=" << this;
            owner->log();
            
            return new_root;
        }

        AVLNode* insert(T value) override {
            owner->buffer << "[INSERT] node=" << this << " value=" << value;
            
            if (value < this->data) {
                owner->buffer << " direction=left";
                owner->log();
                
                if (!this->left) {
                    this->left = new LogAVLNode(value, owner);
                    owner->buffer << "[NODE_CREATE] address=" << this->left << " value=" << value;
                    owner->log();
                    owner->buffer << "[POINTER_CHANGE] " << this << ".left=" << this->left;
                    owner->log();
                } else {
                    AVLNode* old_left = this->left;
                    this->left = this->left->insert(value);
                    if (old_left != this->left) {
                        owner->buffer << "[POINTER_CHANGE] " << this << ".left=" << this->left;
                        owner->log();
                    }
                }
            } else {
                owner->buffer << " direction=right";
                owner->log();
                
                if (!this->right) {
                    this->right = new LogAVLNode(value, owner);
                    owner->buffer << "[NODE_CREATE] address=" << this->right << " value=" << value;
                    owner->log();
                    owner->buffer << "[POINTER_CHANGE] " << this << ".right=" << this->right;
                    owner->log();
                } else {
                    AVLNode* old_right = this->right;
                    this->right = this->right->insert(value);
                    if (old_right != this->right) {
                        owner->buffer << "[POINTER_CHANGE] " << this << ".right=" << this->right;
                        owner->log();
                    }
                }
            }
            
            // Use original balance logic (will call our virtual rotations if needed)
            return AVLNode::balance();
        }

        AVLNode* find(const T& val) override {
            owner->buffer << "[FIND] node=" << this << " searching=" << val;
            
            if (val == this->data) {
                owner->buffer << " result=FOUND";
                owner->log();
                return this;
            }
            if (val < this->data) {
                owner->buffer << " direction=left";
                owner->log();
                return this->left ? this->left->find(val) : nullptr;
            } else {
                owner->buffer << " direction=right";  
                owner->log();
                return this->right ? this->right->find(val) : nullptr;
            }
        }
    };

    AVLNode* find_next_node_l(AVLNode* root, int* depth) override {
        this->buffer << "[FIND_PREDECESSOR] start=" << root;
        this->log();
        
        // Call original method
        AVLNode* result = AVLTree<T>::find_next_node_l(root, depth);
        
        this->buffer << "[FIND_PREDECESSOR] result=" << result << " depth=" << *depth;
        this->log();
        
        return result;
    }

    AVLNode* find_next_node_r(AVLNode* root, int* depth) override {
        this->buffer << "[FIND_SUCCESSOR] start=" << root;
        this->log();
        
        // Call original method
        AVLNode* result = AVLTree<T>::find_next_node_r(root, depth);
        
        this->buffer << "[FIND_SUCCESSOR] result=" << result << " depth=" << *depth;
        this->log();
        
        return result;
    }

    AVLNode* remove_item(AVLNode* node, const T& val) override {
        if (!node) {
            throw std::runtime_error("val not found in the tree");
        }

        this->buffer << "[REMOVE] node=" << node << " searching=" << val;
        this->log();

        if (val < node->data) {
            AVLNode* old_left = node->left;
            node->left = remove_item(node->left, val);
            if (old_left != node->left) {
                this->buffer << "[POINTER_CHANGE] " << node << ".left=" << node->left;
                this->log();
            }
            return node->balance();
        }
        
        if (val > node->data) {
            AVLNode* old_right = node->right;
            node->right = remove_item(node->right, val);
            if (old_right != node->right) {
                this->buffer << "[POINTER_CHANGE] " << node << ".right=" << node->right;
                this->log();
            }
            return node->balance();
        }

        // Found the node to remove
        this->buffer << "[REMOVE_FOUND] node=" << node << " value=" << node->data;
        this->log();

        // Case 1: Leaf node
        if (!node->left && !node->right) {
            this->buffer << "[NODE_DELETE] address=" << node << " value=" << node->data << " type=leaf";
            this->log();
            delete node;
            return nullptr;
        }

        // Case 2: Only right child
        if (!node->left) {
            AVLNode* replacement = node->right;
            this->buffer << "[NODE_DELETE] address=" << node << " value=" << node->data << " type=right_only replacement=" << replacement;
            this->log();
            node->right = nullptr; // Prevent cascade deletion
            delete node;
            return replacement;
        }

        // Case 3: Only left child  
        if (!node->right) {
            AVLNode* replacement = node->left;
            this->buffer << "[NODE_DELETE] address=" << node << " value=" << node->data << " type=left_only replacement=" << replacement;
            this->log();
            node->left = nullptr; // Prevent cascade deletion
            delete node;
            return replacement;
        }

        // Case 4: Two children - use original logic
        int dl = 0, dr = 0;
        AVLNode* next_l = find_next_node_l(node, &dl);
        AVLNode* next_r = find_next_node_r(node, &dr);

        T old_value = node->data;
        if (dl > dr) {
            T new_value = next_l->data;
            node->data = new_value;
            this->buffer << "[DATA_CHANGE] node=" << node << " old_value=" << old_value << " new_value=" << new_value;
            this->log();
            
            AVLNode* old_left = node->left;
            node->left = remove_item(node->left, new_value);
            if (old_left != node->left) {
                this->buffer << "[POINTER_CHANGE] " << node << ".left=" << node->left;
                this->log();
            }
        } else {
            T new_value = next_r->data;
            node->data = new_value;
            this->buffer << "[DATA_CHANGE] node=" << node << " old_value=" << old_value << " new_value=" << new_value;
            this->log();
            
            AVLNode* old_right = node->right;
            node->right = remove_item(node->right, new_value);
            if (old_right != node->right) {
                this->buffer << "[POINTER_CHANGE] " << node << ".right=" << node->right;
                this->log();
            }
        }

        return node->balance();
    }
    // Helper function for LogAVLTree - add this to your LogAVLTree class as a private method
    void printNodeStructure(AVLNode* node, const std::string& prefix = "", bool isLast = true) const {
        if (node == nullptr) {
            std::cout << prefix << (isLast ? "└── " : "├── ") << "null" << std::endl;
            return;
        }
        
        std::cout << prefix << (isLast ? "└── " : "├── ") << node->data << std::endl;
        
        if (node->left != nullptr || node->right != nullptr) {
            // Print left child
            printNodeStructure(node->left, prefix + (isLast ? "    " : "│   "), node->right == nullptr);
            // Print right child  
            printNodeStructure(node->right, prefix + (isLast ? "    " : "│   "), true);
        }
    }

public:
    explicit LogAVLTree(std::ostream& os = std::cout)
        : LogDatas(os) {}

    bool exist_in_tree(const T& val) override {
        this->buffer << "[TREE_FIND] value=" << val;
        this->log();
        
        bool result = AVLTree<T>::exist_in_tree(val); // Use original logic
        
        this->buffer << "[TREE_FIND_RESULT] value=" << val << " found=" << (result ? "true" : "false");
        this->log();
        
        return result;
    }

    void insert(T value) override {
        this->buffer << "[TREE_INSERT] value=" << value;
        this->log();
        
        if (!this->root) {
            this->root = new LogAVLNode(value, this);
            this->buffer << "[ROOT_CREATE] address=" << this->root << " value=" << value;
            this->log();
        } else {
            AVLNode* old_root = this->root;
            this->root = this->root->insert(value);
            if (old_root != this->root) {
                this->buffer << "[ROOT_CHANGE] old=" << old_root << " new=" << this->root;
                this->log();
            }
        }
    }

    bool remove(const T& val) override {
        this->buffer << "[TREE_REMOVE] value=" << val;
        this->log();
        
        try {
            AVLNode* old_root = this->root;
            this->root = remove_item(this->root, val);
            if (old_root != this->root) {
                this->buffer << "[ROOT_CHANGE] old=" << old_root << " new=" << this->root;
                this->log();
            }
            return true;
        } catch (const std::runtime_error&) {
            this->buffer << "[TREE_REMOVE_FAILED] value=" << val;
            this->log();
            return false;
        }
    }
    // Function for LogAVLTree - add this to your LogAVLTree class as a public method
    void printTreeStructure() const {
        std::cout << "LogAVLTree Structure:" << std::endl;
        if (this->root == nullptr) {
            std::cout << "└── (empty)" << std::endl;
        } else {
            printNodeStructure(this->root);
        }
    }
};

} // namespace datas

#endif // ENHANCED_LOGAVL_TREE_HPP