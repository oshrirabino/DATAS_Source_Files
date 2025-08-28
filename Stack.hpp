#ifndef STACK_HPP
#define STACK_HPP

#include <iostream>
#include <stdexcept>

namespace datas {

template <typename T>
class Stack {
private:
    struct stack_node {
        T data;
        stack_node* next;
    };
    stack_node* top;
    int size;

public:
    Stack() : top(nullptr), size(0) {}

    void push(T data) {
        stack_node* to_push = new stack_node{data, top};
        top = to_push;
        size++;
    }

    T pop() {
        if (!top) throw std::runtime_error("empty stack");
        T value = top->data;
        stack_node* temp = top->next;
        delete top;
        top = temp;
        size--;
        return value;
    }

    T pick() {
        if (!top) throw std::runtime_error("empty stack");
        return top->data;
    }

    bool is_empty() const { return top == nullptr; }

    void merge_stack(Stack<T>& other) {
        Stack<T> temp;
        while (!other.is_empty()) temp.push(other.pop());
        while (!temp.is_empty()) push(temp.pop());
    }

    friend std::ostream& operator<<(std::ostream& os, const Stack<T>& stack) {
        os << "[ ";
        for (stack_node* itr = stack.top; itr; itr = itr->next) {
            os << itr->data;
            if (itr->next != nullptr) os << ", ";
        }
        os << " ]";
        return os;
    }

    // Iterator for range-based for
    class Iterator {
    private:
        stack_node* current;

    public:
        Iterator(stack_node* node) : current(node) {}
        T& operator*() const { return current->data; }
        Iterator& operator++() { current = current->next; return *this; }
        bool operator!=(const Iterator& other) const { return current != other.current; }
    };

    Iterator begin() { return Iterator(top); }
    Iterator end() { return Iterator(nullptr); }
};

} // namespace datas

#endif // STACK_HPP
