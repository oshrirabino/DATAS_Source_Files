#ifndef AVLTREE_HPP
#define AVLTREE_HPP

#include <iostream>
#include <algorithm>
#include <stdexcept>

namespace datas {

template<typename T>
class AVLTree {
protected:
    class AVLNode {
    public:
        T data;
        AVLNode* left;
        AVLNode* right;
        int height;

        AVLNode(T value);
        ~AVLNode();

        static int get_height(AVLNode* node);
        static int get_balance(AVLNode* node);
        void update_height();
        virtual AVLNode* rotate_right();
        virtual AVLNode* rotate_left();
        virtual AVLNode* balance();
        virtual AVLNode* insert(T value);
        virtual AVLNode* find(const T& val);
        void inorder();
    };

    AVLNode* root;

    AVLNode* find_node(const T& val);
    virtual AVLNode* find_next_node_l(AVLNode* root, int* depth);
    virtual AVLNode* find_next_node_r(AVLNode* root, int* depth);
    virtual AVLNode* remove_item(AVLNode* root, const T& val);
    
public:
    AVLTree();
    ~AVLTree();

    virtual bool exist_in_tree(const T& val);
    virtual void insert(T value);
    virtual bool remove(const T& val);
    void inorder();
    AVLNode* getRoot();
};
}

#include "AVLTree.tpp"

#endif // AVLTREE_HPP
