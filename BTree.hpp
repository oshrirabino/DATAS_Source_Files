#ifndef BTREE_HPP
#define BTREE_HPP

#include <iostream>
#include <vector>
#include <memory>

namespace datas {
template <typename T>
class BTree {
protected:
    struct BNode {
        bool is_leaf;
        std::vector<T> keys;
        std::vector<std::unique_ptr<BNode>> childrens;
        BNode(bool is_leaf) :is_leaf(is_leaf) {}
    };

    int order;      // Max number of children a node can have (m)
    int min_keys;   // Minimum number of keys in a non-root node (t-1)
    int min_size;   // Minimum number of children in a non-root internal node (t)
    std::unique_ptr<BNode> root;
    int keyIndex(BNode *node, T val);
    bool findVal(BNode *node, T val);
    std::unique_ptr<BNode> splitSibling(BNode *node, T& midVal);
    void splitChild(BNode *node, int index);
    void insertVal(BNode *node, T val);
    void mergeSiblings(BNode *node, int idx);
    void borrowFromRight(BNode *node, int idx);
    void borrowFromLeft(BNode *node, int idx);
    void fixChild(BNode *node, int idx);
    T findSuc(BNode *node);
    T findPred(BNode *node);
    void removeVal(BNode *node, T val);

public:
    BTree(int order_);
    void insert(T val);
    bool find(T val);
    void remove(T val);

    // Declare friend printing functions:
    template<typename U>
    friend void print_bnode(std::ostream&, const typename BTree<U>::BNode*, int);

    template<typename U>
    friend std::ostream& operator<<(std::ostream&, const BTree<U>&);
};

template<typename T>
void print_bnode(std::ostream& os, const typename BTree<T>::BNode* node, int level = 0) {
    if (!node) return;

    std::string indent(level * 4, ' ');
    os << indent << "Keys: [";
    for (size_t i = 0; i < node->keys.size(); ++i) {
        os << node->keys[i];
        if (i + 1 < node->keys.size()) os << ", ";
    }
    os << "]\n";

    if (!node->is_leaf) {
        for (const auto& child : node->childrens) {
            print_bnode<T>(os, child.get(), level + 1);
        }
    }
}

template<typename T>
std::ostream& operator<<(std::ostream& os, const BTree<T>& tree) {
    print_bnode<T>(os, tree.root.get(), 0);
    return os;
}
}

#include "BTree.tpp"

#endif // BTREE_HPP