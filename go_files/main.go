package main

import (
	"fmt"
)

func clientHandle(req string) {
	// creat stable connection with client and tell server i started a session

	switch req {
	case "BTree":
		// call BTreeClientHandle
	case "AVLTree":
		// call AVLTreeClientHandle
	case "Stack":
		// call StackClientHandle
	default:
		// call BadRequestHandle
	}

	// sign to server that session is over
}

func main() {
	fmt.Println("server start...")
	runClientThread(genID(), "avltree")
}
