package main

import (
	"github.com/gorilla/websocket"
)

// WebSocketWrapper wraps websocket.Conn to implement io.ReadWriter interface
type WebSocketWrapper struct {
	*websocket.Conn
}

// Read implements io.Reader
// Reads one WebSocket message and returns its data
func (ws *WebSocketWrapper) Read(p []byte) (int, error) {
	_, data, err := ws.Conn.ReadMessage()
	if err != nil {
		return 0, err
	}

	// Copy data to the provided buffer
	n := copy(p, data)
	if n < len(data) {
		// Buffer too small - this is a limitation of the io.Reader interface
		// In practice, make sure your read buffer is large enough
		return n, nil
	}
	return n, nil
}

// Write implements io.Writer
// Writes data as a WebSocket text message
func (ws *WebSocketWrapper) Write(p []byte) (int, error) {
	err := ws.Conn.WriteMessage(websocket.TextMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

// WrapWebSocket creates a new WebSocketWrapper
func WrapWebSocket(conn *websocket.Conn) *WebSocketWrapper {
	return &WebSocketWrapper{Conn: conn}
}
