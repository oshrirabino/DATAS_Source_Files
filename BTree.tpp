#include <stdexcept>
#include <algorithm>

namespace datas {

// --- Protected member functions ---

template <typename T>
int BTree<T>::keyIndex(BNode *node, T val) {
    int idx = 0;
    while(idx < node->keys.size() && node->keys[idx] < val) idx++;
    return idx;
}

template <typename T>
bool BTree<T>::findVal(BNode *node, T val) {
    int idx = keyIndex(node, val);
    if (idx < node->keys.size() && node->keys[idx] == val) return true;
    if (node->is_leaf) return false;
    return findVal(node->childrens[idx].get(), val);
}

template <typename T>
std::unique_ptr<typename BTree<T>::BNode> BTree<T>::splitSibling(BNode *node, T& midVal) {
    if (node->keys.size() != order - 1) throw std::runtime_error("splitting none full node");
    std::unique_ptr<BNode> newSibling = std::make_unique<BNode>(node->is_leaf);
    int mid = (order - 1) / 2;
    midVal = node->keys[mid];
    newSibling->keys.assign(
        std::make_move_iterator(node->keys.begin() + mid + 1),
        std::make_move_iterator(node->keys.end())
    );
    node->keys.erase(node->keys.begin() + mid, node->keys.end());
    if (!node->is_leaf) {
        newSibling->childrens.assign(
            std::make_move_iterator(node->childrens.begin() + mid + 1),
            std::make_move_iterator(node->childrens.end())
        );
        node->childrens.erase(node->childrens.begin() + mid + 1, node->childrens.end());
    }
    return newSibling;
}

template <typename T>
void BTree<T>::splitChild(BNode *node, int index) {
    T midVal;
    std::unique_ptr<BNode> newSibling = splitSibling(node->childrens[index].get(), midVal);
    node->childrens.insert(node->childrens.begin() + index + 1, std::move(newSibling));
    node->keys.insert(node->keys.begin() + index, midVal);
}

template <typename T>
void BTree<T>::insertVal(BNode *node, T val) {
    int idx = keyIndex(node, val);
    if (node->is_leaf) {
        if (node->keys.size() >= order - 1) throw std::runtime_error("inserting to full leaf");
        node->keys.insert(node->keys.begin() + idx, val);
    } else {
        if (node->childrens[idx]->keys.size() == order - 1) {
            splitChild(node, idx);
            idx = keyIndex(node, val);
        }
        insertVal(node->childrens[idx].get(), val);
    }
}

template <typename T>
void BTree<T>::mergeSiblings(BNode *node, int idx) {
    T key = node->keys[idx];
    node->keys.erase(node->keys.begin() + idx);
    node->childrens[idx]->keys.push_back(key);
    node->childrens[idx]->keys.insert(
        node->childrens[idx]->keys.end(),
        node->childrens[idx + 1]->keys.begin(),
        node->childrens[idx + 1]->keys.end()
    );
    if (!node->childrens[idx]->is_leaf) {
        node->childrens[idx]->childrens.insert(
            node->childrens[idx]->childrens.end(),
            std::make_move_iterator(node->childrens[idx + 1]->childrens.begin()),
            std::make_move_iterator(node->childrens[idx + 1]->childrens.end())
        );
    }
    node->childrens.erase(node->childrens.begin() + idx + 1);
}

template <typename T>
void BTree<T>::borrowFromRight(BNode *node, int idx) {
    BNode *left = node->childrens[idx].get();
    BNode *right = node->childrens[idx + 1].get();
    left->keys.push_back(node->keys[idx]);
    node->keys[idx] = right->keys[0];
    right->keys.erase(right->keys.begin());

    if (!left->is_leaf) {
        left->childrens.push_back(std::move(right->childrens.front()));
        right->childrens.erase(right->childrens.begin());
    }
}

template <typename T>
void BTree<T>::borrowFromLeft(BNode *node, int idx) {
    BNode *left = node->childrens[idx - 1].get();
    BNode *right = node->childrens[idx].get();
    right->keys.insert(right->keys.begin(), node->keys[idx - 1]);
    node->keys[idx - 1] = left->keys.back();
    left->keys.pop_back();
    if (!right->is_leaf) {
        right->childrens.insert(right->childrens.begin(), std::move(left->childrens.back()));
        left->childrens.pop_back();
    }
}

template <typename T>
void BTree<T>::fixChild(BNode *node, int idx) {
    if (node->childrens[idx]->keys.size() >= min_keys) return;
    if (idx > 0 && node->childrens[idx - 1]->keys.size() > min_keys)
        borrowFromLeft(node, idx);
    else if (idx < node->childrens.size() - 1 && node->childrens[idx + 1]->keys.size() > min_keys)
        borrowFromRight(node, idx);
    else {
        int leftIdx = idx < node->childrens.size() - 1 ? idx : idx - 1;
        mergeSiblings(node, leftIdx);
    }
}

template <typename T>
T BTree<T>::findSuc(BNode *node) {
    while (!node->is_leaf) node = node->childrens[0].get();
    return node->keys[0];
}

template <typename T>
T BTree<T>::findPred(BNode *node) {
    while (!node->is_leaf) node = node->childrens[node->keys.size()].get();
    return node->keys[node->keys.size() - 1];
}

template <typename T>
void BTree<T>::removeVal(BNode *node, T val) {
    int idx = keyIndex(node, val);
    if (node->is_leaf) {
        if (idx < node->keys.size() && node->keys[idx] == val) node->keys.erase(node->keys.begin() + idx);
        return;
    }

    if (idx < node->keys.size() && node->keys[idx] == val) {
        int victim;
        T nextValToRemove;
        if (node->childrens[idx]->keys.size() > min_keys) {
            nextValToRemove = findPred(node->childrens[idx].get());
            node->keys[idx] = nextValToRemove;
            victim = idx;
        } else if (node->childrens[idx + 1]->keys.size() > min_keys) {
            nextValToRemove = findSuc(node->childrens[idx + 1].get());
            node->keys[idx] = nextValToRemove;
            victim = idx + 1;
        } else {
            mergeSiblings(node, idx);
            nextValToRemove = val;
            victim = idx;
        }
        removeVal(node->childrens[victim].get(), nextValToRemove);
        fixChild(node, victim);
    } else {
        removeVal(node->childrens[idx].get(), val);
        fixChild(node, idx);
    }
}

// --- Public member functions ---

template <typename T>
BTree<T>::BTree(int order_) : order(order_) {
    if (order < 3) throw std::invalid_argument("Order must be at least 3");
    int t = (order + 1) / 2;
    min_size = t;
    min_keys = t - 1;
    root = std::make_unique<BNode>(true);
}

template <typename T>
void BTree<T>::insert(T val) {
    if (root->keys.size() == order - 1) {
        T midVal;
        std::unique_ptr<BNode> newRoot = std::make_unique<BNode>(false);
        std::unique_ptr<BNode> newSibling = splitSibling(root.get(), midVal);
        newRoot->keys.push_back(midVal);
        newRoot->childrens.push_back(std::move(root));
        newRoot->childrens.push_back(std::move(newSibling));
        root = std::move(newRoot);
    }
    insertVal(root.get(), val);
}

template <typename T>
bool BTree<T>::find(T val) {
    return findVal(root.get(), val);
}

template <typename T>
void BTree<T>::remove(T val) {
    if (!findVal(root.get(), val)) return;
    removeVal(root.get(), val);
    if (!root->is_leaf && root->keys.empty()) root = std::move(root->childrens[0]);
}

} // namespace datas
