#include "BTree.hpp"
#include <iostream>

using namespace datas;
int main() {
    BTree<int> tree(5);  // order 5 B-tree

    // Insert some values
    int values[] = {10, 20, 5, 6, 12, 30, 7, 17, 34, 2, 2, 2, 93, 44};
    for (int v : values) {
        tree.insert(v);
    }

    std::cout << "Tree after insertions:\n" << tree << "\n\n";

    // Remove some values, including root and internal nodes
    tree.remove(6);
    tree.remove(17);
    tree.remove(10);
    tree.remove(2);

    std::cout << "Tree after removals (6, 17, 10):\n" << tree << "\n\n";

    // Test removing a non-existent key (should do nothing)
    tree.remove(100);

    std::cout << "Tree after trying to remove non-existent 100:\n" << tree << "\n\n";

    // Insert more keys to test rebalancing
    tree.insert(3);
    tree.insert(4);
    tree.insert(15);

    std::cout << "Tree after more insertions (3, 4, 15):\n" << tree << "\n\n";

    return 0;
}