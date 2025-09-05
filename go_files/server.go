package main

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	// CheckOrigin controls whether to accept connections from any origin
	CheckOrigin: func(r *http.Request) bool { return true }, // allow all for dev
}

// handleClient runs in its own goroutine for each client
func handleClient(conn net.Conn, clientID string) {
	defer conn.Close()
	fmt.Printf("[Client %s] Connected from %s\n", clientID, conn.RemoteAddr())
	runClientThread(clientID, "btree", "", conn)
}

func handleHttpClient(w http.ResponseWriter, r *http.Request) {
	// Validate request and get parameters
	dataType, flags, err := validateRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Upgrade to WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Upgrade error:", err)
		return
	}

	conn := WebSocketWrapper{Conn: ws}
	defer conn.Close()

	clientID := genID()
	fmt.Printf("[Client %s] Connected from %s (type: %s, flags: %s)\n",
		clientID, conn.RemoteAddr(), dataType, flags)

	runClientThread(clientID, dataType, flags, &conn)
}

// startServer runs the TCP server and listens until shutdown is requested
func startRawTcpServer(ctx context.Context, wg *sync.WaitGroup, port string) {
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

func startHttpServer(ctx context.Context, wg *sync.WaitGroup, port string) {
	defer wg.Done()
	srv := &http.Server{Addr: ":" + port}
	fmt.Printf("HTTP server listin on port %s\n", port)
	http.HandleFunc("/session", handleHttpClient)
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Println("HTTP server error:", err)
		}
	}()

	<-ctx.Done()
	fmt.Println("Shuting down HTTP server...")
	srv.Shutdown(ctx)
}
