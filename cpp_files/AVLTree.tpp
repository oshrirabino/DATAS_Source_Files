#include <iostream>
#include <algorithm>
#include <stdexcept>

namespace datas {

// --- AVLNode member functions ---

template<typename T>
AVLTree<T>::AVLNode::AVLNode(T value)
    : data(value), left(nullptr), right(nullptr), height(1) {}

template<typename T>
AVLTree<T>::AVLNode::~AVLNode() {
    delete left;
    delete right;
}

template<typename T>
int AVLTree<T>::AVLNode::get_height(AVLNode* node) {
    return node ? node->height : 0;
}

template<typename T>
int AVLTree<T>::AVLNode::get_balance(AVLNode* node) {
    return node ? get_height(node->left) - get_height(node->right) : 0;
}

template<typename T>
void AVLTree<T>::AVLNode::update_height() {
    height = 1 + std::max(get_height(left), get_height(right));
}

template<typename T>
typename AVLTree<T>::AVLNode* AVLTree<T>::AVLNode::rotate_right() {
    AVLNode* new_root = left;
    left = new_root->right;
    new_root->right = this;
    update_height();
    new_root->update_height();
    return new_root;
}

template<typename T>
typename AVLTree<T>::AVLNode* AVLTree<T>::AVLNode::rotate_left() {
    AVLNode* new_root = right;
    right = new_root->left;
    new_root->left = this;
    update_height();
    new_root->update_height();
    return new_root;
}

template<typename T>
typename AVLTree<T>::AVLNode* AVLTree<T>::AVLNode::balance() {
    update_height();
    int balance_factor = get_balance(this);
    if (balance_factor > 1) {
        if (get_balance(left) < 0)
            left = left->rotate_left();
        return rotate_right();
    }
    if (balance_factor < -1) {
        if (get_balance(right) > 0)
            right = right->rotate_right();
        return rotate_left();
    }
    return this;
}

template<typename T>
typename AVLTree<T>::AVLNode* AVLTree<T>::AVLNode::insert(T value) {
    if (value < data) {
        if (!left)
            left = new AVLNode(value);
        else
            left = left->insert(value);
    } else {
        if (!right)
            right = new AVLNode(value);
        else
            right = right->insert(value);
    }
    return balance();
}

template<typename T>
typename AVLTree<T>::AVLNode* AVLTree<T>::AVLNode::find(const T& val) {
    if (data == val) return this;
    if (data > val && left) return left->find(val);
    if (data < val && right) return right->find(val);
    return nullptr;
}

template<typename T>
void AVLTree<T>::AVLNode::inorder() {
    if (left) left->inorder();
    std::cout << data << " ";
    if (right) right->inorder();
}

// --- AVLTree member functions ---

template<typename T>
AVLTree<T>::AVLTree() : root(nullptr) {}

template<typename T>
AVLTree<T>::~AVLTree() {
    delete root;
}

template<typename T>
typename AVLTree<T>::AVLNode* AVLTree<T>::find_node(const T& val) {
    return root ? root->find(val) : nullptr;
}

template<typename T>
typename AVLTree<T>::AVLNode* AVLTree<T>::find_next_node_l(AVLNode* root, int* depth) {
    AVLNode* leaf = root->left;
    if (!leaf) return root;
    int d = 0;
    while (leaf->right) {
        leaf = leaf->right;
        d++;
    }
    *depth = d;
    return leaf;
}

template<typename T>
typename AVLTree<T>::AVLNode* AVLTree<T>::find_next_node_r(AVLNode* root, int* depth) {
    AVLNode* leaf = root->right;
    if (!leaf) return root;
    int d = 0;
    while (leaf->left) {
        leaf = leaf->left;
        d++;
    }
    *depth = d;
    return leaf;
}

template<typename T>
typename AVLTree<T>::AVLNode* AVLTree<T>::remove_item(AVLNode* root, const T& val) {
    if (!root) throw std::runtime_error("val not found in the tree");
    if (val < root->data) {
        root->left = remove_item(root->left, val);
        return root->balance();
    }
    if (val > root->data) {
        root->right = remove_item(root->right, val);
        return root->balance();
    }
    // val == root->data
    if (!root->left && !root->right) {
        delete root;
        return nullptr;
    }
    if (!root->right) {
        AVLNode* tmp = root->left;
        root->left = nullptr;
        delete root;
        return tmp;
    }
    if (!root->left) {
        AVLNode* tmp = root->right;
        root->right = nullptr;
        delete root;
        return tmp;
    }
    int dl = 0, dr = 0;
    AVLNode* next_l = find_next_node_l(root, &dl);
    AVLNode* next_r = find_next_node_r(root, &dr);
    if (dl > dr) {
        root->data = next_l->data;
        root->left = remove_item(root->left, root->data);
    } else {
        root->data = next_r->data;
        root->right = remove_item(root->right, root->data);
    }
    return root->balance();
}

template<typename T>
bool AVLTree<T>::exist_in_tree(const T& val) {
    return find_node(val) != nullptr;
}

template<typename T>
void AVLTree<T>::insert(T value) {
    if (!root)
        root = new AVLNode(value);
    else
        root = root->insert(value);
}

template<typename T>
bool AVLTree<T>::remove(const T& val) {
    try {
        root = remove_item(root, val);
    } catch (const std::runtime_error&) {
        return false;
    }
    return true;
}

template<typename T>
void AVLTree<T>::inorder() {
    if (root) root->inorder();
    std::cout << "\n";
}

} // namespace datas