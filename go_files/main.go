package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"syscall"
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
	// Context + waitgroup for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup

	// Start server
	os.Mkdir("fifos", 0755)
	wg.Add(1)
	go startRawTcpServer(ctx, &wg, "9000")
	go startHttpServer(ctx, &wg, "8080")
	// Wait for interrupt (Ctrl+C)
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt, syscall.SIGTERM)
	<-sig
	fmt.Println("Signal received, shutting down...")

	// Cancel server context, wait for goroutines
	cancel()
	wg.Wait()
	os.RemoveAll("fifos/")
	fmt.Println("Server stopped cleanly.")
}
