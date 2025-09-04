#include "AVLTree.hpp"
#include <iostream>

int main() {
    datas::AVLTree<int> tree;
    tree.insert(10);
    tree.insert(20);
    tree.insert(30);
    tree.insert(40);
    tree.insert(50);
    tree.insert(25);

    tree.inorder();  // Should print a sorted sequence
    tree.remove(25);
    tree.inorder();
    return 0;
}