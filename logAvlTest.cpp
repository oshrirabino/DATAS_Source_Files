#include "LogAVLTree.hpp"

int main() {
    datas::LogAVLTree<int> tree(std::cout);
    for (int i = 0; i < 7; i++) tree.insert(i);
    tree.remove(4);
}