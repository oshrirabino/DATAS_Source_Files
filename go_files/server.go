package main

import (
	"context"
	"fmt"
	"net"
	"sync"
	"time"
)

// handleClient runs in its own goroutine for each client
func handleClient(conn net.Conn, clientID string) {
	defer conn.Close()
	fmt.Printf("[Client %s] Connected from %s\n", clientID, conn.RemoteAddr())
	runClientThread(clientID, "btree", conn)
}

// startServer runs the TCP server and listens until shutdown is requested
func startServer(ctx context.Context, wg *sync.WaitGroup, port string) {
	defer wg.Done()

	ln, err := net.Listen("tcp", ":"+port)
	if err != nil {
		fmt.Println("Error starting server:", err)
		return
	}
	defer ln.Close()

	fmt.Println("Server listening on port", port)

	for {
		// Non-blocking check for shutdown
		select {
		case <-ctx.Done():
			fmt.Println("Shutting down server...")
			return
		default:
		}

		ln.(*net.TCPListener).SetDeadline(time.Now().Add(1 * time.Second))
		conn, err := ln.Accept()
		if err != nil {
			// Timeout = retry loop to check ctx.Done()
			if ne, ok := err.(net.Error); ok && ne.Timeout() {
				continue
			}
			fmt.Println("Accept error:", err)
			continue
		}

		go handleClient(conn, genID())
	}
}
