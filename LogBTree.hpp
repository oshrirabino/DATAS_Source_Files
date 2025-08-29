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
    virtual void borrowFromRight(BNode *node, int idx) override {
        BNode *left = node->childrens[idx].get();
        BNode *right = node->childrens[idx + 1].get();
        left->keys.push_back(node->keys[idx]);
        node->keys[idx] = right->keys[0];
        right->keys.erase(right->keys.begin());
        this->buffer << "[Borrow Right] Move from right=" << right << " key=" << right->keys[0] << " to father=" << node
                     << " and move key=" << node->keys[idx] << " to left=" << left;
        this->log();
        if (!left->is_leaf) {
            this->buffer << "[Borrow Right] Move child=" << right->childrens.front().get() << " to end of left";
            this->log();
            left->childrens.push_back(std::move(right->childrens.front()));
            right->childrens.erase(right->childrens.begin());
    }
    }

public:
    explicit LogBTree(int order_, std::ostream& os = std::cout): BTree<T>(order_), LogDatas(os) {}
};
}

#endif