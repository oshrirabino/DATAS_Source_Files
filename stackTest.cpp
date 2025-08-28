#include "Stack.hpp"

int main() {
    datas::Stack<int> s, t;
    for (int i = 0; i < 10; i++) s.push(i * 2);
    for (int i = 0; i < 7; i++) t.push(i * 5);
    std::cout << s << std::endl;
    s.merge_stack(t);
    for (auto it : s) {
        std::cout << it << ' ';
    }
    std::cout << std::endl;
    return 0;
}