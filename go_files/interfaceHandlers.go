package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
)

// Message represents a structured message to send to client
type Message struct {
	Type    string `json:"type"`    // "program" or "log"
	Content string `json:"message"` // actual message content
}

// sendJSONMessage sends a structured JSON message to client
func sendJSONMessage(writer io.Writer, msgType string, content string) error {
	msg := Message{
		Type:    msgType,
		Content: content,
	}

	jsonData, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	// Add newline for message separation
	_, err = fmt.Fprintln(writer, string(jsonData))
	return err
}

// --- Utility Functions ---

// startCppProcess starts the C++ interface with given FIFOs
func startCppProcess(ds, flags, progFifo, logFifo string, webSocket io.Reader) (*exec.Cmd, error) {
	cmd := exec.Command("./"+ds+"Interface.exe",
		flags,
		"--program-out", progFifo,
		"--tree-log-out", logFifo,
	)
	// For now: forward Go stdin → C++ stdin
	cmd.Stdin = webSocket
	return cmd, cmd.Start()
}

// forwardFifoJSON reads from FIFO and sends structured JSON messages
// Returns a channel that closes when forwarding stops
func forwardFifoJSON(fifo string, webSocket io.Writer, messageType string) <-chan struct{} {
	done := make(chan struct{})
	go func() {
		defer close(done)
		f, err := os.Open(fifo)
		if err != nil {
			fmt.Println("Error opening fifo:", fifo, err)
			return
		}
		defer f.Close()
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := scanner.Text()
			writeErr := sendJSONMessage(webSocket, messageType, line)
			if writeErr != nil {
				fmt.Printf("Client disconnected while writing %s output\n", messageType)
				return
			}
			// If you want to debug, uncomment:
			// fmt.Printf("[%s] %s\n", messageType, line)
		}
	}()
	return done
}

// runClientThread manages one client session with its own FIFOs and process
func runClientThread(ID string, ds string, flags string, clientSocket io.ReadWriter) {
	fmt.Printf("[Client %s] Starting session\n", ID)

	// Define fifo paths
	progFifo := "fifos/" + ID + "_" + ds + "_program.fifo"
	logFifo := "fifos/" + ID + "_" + ds + "_log.fifo"

	// Create FIFOs
	if err := makeFifo(progFifo); err != nil {
		fmt.Printf("[Client %s] Error creating program FIFO: %v\n", ID, err)
		return
	}
	if err := makeFifo(logFifo); err != nil {
		fmt.Printf("[Client %s] Error creating log FIFO: %v\n", ID, err)
		return
	}

	// Start C++ interface
	cmd, err := startCppProcess(ds, flags, progFifo, logFifo, clientSocket)
	if err != nil {
		fmt.Printf("[Client %s] Error starting C++ process: %v\n", ID, err)
		return
	}

	// Forward FIFO → client socket as JSON messages
	progDone := forwardFifoJSON(progFifo, clientSocket, "program")
	logDone := forwardFifoJSON(logFifo, clientSocket, "log")

	// Monitor both C++ process and FIFO forwarding
	processDone := make(chan error, 1)
	go func() {
		processDone <- cmd.Wait()
	}()

	// Wait for ANY of these to finish
	select {
	case err := <-processDone:
		if err != nil {
			fmt.Printf("[Client %s] C++ process exited with error: %v\n", ID, err)
		} else {
			fmt.Printf("[Client %s] C++ process completed successfully\n", ID)
		}
	case <-progDone:
		fmt.Printf("[Client %s] Program FIFO forwarding stopped (client likely disconnected)\n", ID)
	case <-logDone:
		fmt.Printf("[Client %s] Log FIFO forwarding stopped (client likely disconnected)\n", ID)
	}

	// Cleanup: kill process if still running
	if cmd.Process != nil {
		cmd.Process.Kill()
	}

	// Clean up FIFOs
	os.Remove(progFifo)
	os.Remove(logFifo)

	fmt.Printf("[Client %s] Session ended\n", ID)
}
