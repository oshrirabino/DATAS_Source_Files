#ifndef ENHANCED_LOG_BTREE_HPP
#define ENHANCED_LOG_BTREE_HPP

#include "BTree.hpp"
#include "LogDatas.hpp"

using namespace datas;
namespace datas {
template <typename T>
class LogBTree : public BTree<T>, public LogDatas {
    using typename BTree<T>::BNode;
protected:
    virtual int keyIndex(BNode *node, T val) override {
        this->buffer << "[find Index] search index for val=" << val << " in node=" << node << ": ";
        int idx = BTree<T>::keyIndex(node, val);
        this->buffer << "found index=" << idx;
        this->log();
        return idx;
    }

    virtual std::unique_ptr<BNode> splitSibling(BNode *node, T& midVal) override {
        this->buffer << "[Split Sibling] node=" << node << " keys_size=" << node->keys.size();
        this->log();
        
        // Call original function
        std::unique_ptr<BNode> newSibling = BTree<T>::splitSibling(node, midVal);
        
        this->buffer << "[Split Result] original_node=" << node << " new_sibling=" << newSibling.get() 
                     << " mid_val=" << midVal;
        this->log();
        
        // Log the key distribution
        this->buffer << "[Split Keys] original_keys=[";
        for (size_t i = 0; i < node->keys.size(); ++i) {
            this->buffer << node->keys[i];
            if (i + 1 < node->keys.size()) this->buffer << ",";
        }
        this->buffer << "] new_keys=[";
        for (size_t i = 0; i < newSibling->keys.size(); ++i) {
            this->buffer << newSibling->keys[i];
            if (i + 1 < newSibling->keys.size()) this->buffer << ",";
        }
        this->buffer << "]";
        this->log();
        
        return newSibling;
    }

    virtual void splitChild(BNode *node, int index) override {
        this->buffer << "[Split Child] parent=" << node << " child_index=" << index 
                     << " child=" << node->childrens[index].get();
        this->log();
        
        // Call original function
        BTree<T>::splitChild(node, index);
        
        this->buffer << "[Split Child Result] parent=" << node 
                     << " left_child=" << node->childrens[index].get()
                     << " right_child=" << node->childrens[index + 1].get()
                     << " promoted_key=" << node->keys[index];
        this->log();
    }

    virtual void mergeSiblings(BNode *node, int idx) override {
        BNode *left = node->childrens[idx].get();
        BNode *right = node->childrens[idx + 1].get();
        T key_to_merge = node->keys[idx];
        
        this->buffer << "[Merge Siblings] parent=" << node << " left=" << left 
                     << " right=" << right << " key_to_merge=" << key_to_merge;
        this->log();
        
        // Call original function
        BTree<T>::mergeSiblings(node, idx);
        
        this->buffer << "[Merge Result] merged_node=" << left << " deleted_node=" << right;
        this->log();
    }

    virtual void borrowFromLeft(BNode *node, int idx) override {
        BNode *left = node->childrens[idx - 1].get();
        BNode *right = node->childrens[idx].get();
        T parent_key = node->keys[idx - 1];
        T left_key = left->keys.back();
        
        this->buffer << "[Borrow Left] Move from left=" << left << " key=" << left_key 
                     << " to father=" << node << " and move key=" << parent_key 
                     << " to right=" << right;
        this->log();
        
        if (!left->is_leaf && !left->childrens.empty()) {
            this->buffer << "[Borrow Left] Move child=" << left->childrens.back().get() 
                         << " to start of right";
            this->log();
        }
        
        // Call original function
        BTree<T>::borrowFromLeft(node, idx);
    }

    virtual void borrowFromRight(BNode *node, int idx) override {
        BNode *left = node->childrens[idx].get();
        BNode *right = node->childrens[idx + 1].get();
        T parent_key = node->keys[idx];
        T right_key = right->keys[0];
        
        this->buffer << "[Borrow Right] Move from right=" << right << " key=" << right_key 
                     << " to father=" << node << " and move key=" << parent_key 
                     << " to left=" << left;
        this->log();
        
        if (!left->is_leaf && !right->childrens.empty()) {
            this->buffer << "[Borrow Right] Move child=" << right->childrens.front().get() 
                         << " to end of left";
            this->log();
        }
        
        // Call original function
        BTree<T>::borrowFromRight(node, idx);
    }
    virtual void insertVal(BNode *node, T val) override {
        this->buffer << "[Insert Val] node=" << node << " value=" << val;
        this->log();
        
        int idx = keyIndex(node, val);
        
        if (node->is_leaf) {
            if (node->keys.size() >= this->order - 1) {
                throw std::runtime_error("inserting to full leaf");
            }
            this->buffer << "[Insert Leaf] node=" << node << " inserting key=" << val 
                         << " at index=" << idx;
            this->log();
            
            node->keys.insert(node->keys.begin() + idx, val);
        } else {
            this->buffer << "[Insert Internal] node=" << node << " going to child at index=" << idx 
                         << " child=" << node->childrens[idx].get();
            this->log();
            
            if (node->childrens[idx]->keys.size() == this->order - 1) {
                this->buffer << "[Insert Split] child=" << node->childrens[idx].get() 
                             << " is full, splitting before insertion";
                this->log();
                
                splitChild(node, idx);
                idx = keyIndex(node, val);
                
                this->buffer << "[Insert After Split] new index=" << idx 
                             << " going to child=" << node->childrens[idx].get();
                this->log();
            }
            
            insertVal(node->childrens[idx].get(), val);
        }
    }

    virtual void removeVal(BNode *node, T val) override {
        this->buffer << "[Remove Val] node=" << node << " searching=" << val;
        this->log();
        
        int idx = keyIndex(node, val);
        
        if (node->is_leaf) {
            if (idx < node->keys.size() && node->keys[idx] == val) {
                this->buffer << "[Remove Leaf] node=" << node << " removing key=" << val 
                             << " at index=" << idx;
                this->log();
                
                node->keys.erase(node->keys.begin() + idx);
            } else {
                this->buffer << "[Remove Leaf] key=" << val << " not found in leaf " << node;
                this->log();
            }
            return;
        }

        if (idx < node->keys.size() && node->keys[idx] == val) {
            this->buffer << "[Remove Internal Found] node=" << node << " found key=" << val 
                         << " at index=" << idx;
            this->log();
            
            int victim;
            T nextValToRemove;
            
            if (node->childrens[idx]->keys.size() > this->min_keys) {
                this->buffer << "[Remove Use Pred] left child=" << node->childrens[idx].get() 
                             << " has enough keys, finding predecessor";
                this->log();
                
                nextValToRemove = this->findPred(node->childrens[idx].get());
                
                this->buffer << "[Remove Pred Found] predecessor=" << nextValToRemove 
                             << " replacing key=" << val << " in node=" << node;
                this->log();
                
                node->keys[idx] = nextValToRemove;
                victim = idx;
                
            } else if (node->childrens[idx + 1]->keys.size() > this->min_keys) {
                this->buffer << "[Remove Use Succ] right child=" << node->childrens[idx + 1].get() 
                             << " has enough keys, finding successor";
                this->log();
                
                nextValToRemove = this->findSuc(node->childrens[idx + 1].get());
                
                this->buffer << "[Remove Succ Found] successor=" << nextValToRemove 
                             << " replacing key=" << val << " in node=" << node;
                this->log();
                
                node->keys[idx] = nextValToRemove;
                victim = idx + 1;
                
            } else {
                this->buffer << "[Remove Merge] both children have min keys, merging at index=" << idx;
                this->log();
                
                mergeSiblings(node, idx);
                nextValToRemove = val;
                victim = idx;
            }
            
            this->buffer << "[Remove Recurse] removing=" << nextValToRemove 
                         << " from child=" << node->childrens[victim].get();
            this->log();
            
            removeVal(node->childrens[victim].get(), nextValToRemove);
            this->fixChild(node, victim);
            
        } else {
            this->buffer << "[Remove Internal Miss] key=" << val << " not at current level, " 
                         << "going to child at index=" << idx 
                         << " child=" << node->childrens[idx].get();
            this->log();
            
            removeVal(node->childrens[idx].get(), val);
            this->fixChild(node, idx);
        }
    }

public:
    explicit LogBTree(int order_, std::ostream& os = std::cout)
        : BTree<T>(order_), LogDatas(os) {}

    void insert(T val) {
        this->buffer << "[TREE_INSERT] value=" << val;
        this->log();
        
        // Check if root needs splitting before insertion
        if (this->root->keys.size() == this->order - 1) {
            this->buffer << "[Root Split] root=" << this->root.get() << " is full, creating new root";
            this->log();
        }
        
        // Call original function
        BTree<T>::insert(val);
        
        this->buffer << "[TREE_INSERT_COMPLETE] value=" << val << " root=" << this->root.get();
        this->log();
    }

    bool find(T val) {
        this->buffer << "[TREE_FIND] value=" << val;
        this->log();
        
        // Call original function
        bool result = BTree<T>::find(val);
        
        this->buffer << "[TREE_FIND_RESULT] value=" << val << " found=" << (result ? "true" : "false");
        this->log();
        
        return result;
    }

    void remove(T val) {
        this->buffer << "[TREE_REMOVE] value=" << val;
        this->log();
        
        // Call original function
        BTree<T>::remove(val);
        
        this->buffer << "[TREE_REMOVE_COMPLETE] value=" << val << " root=" << this->root.get();
        this->log();
    }
};
}

#endif