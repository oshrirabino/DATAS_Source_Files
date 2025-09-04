package main

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
)

// --- Utility Functions ---

// openOutputFiles prepares files for program and log outputs
func openOutputFiles(ID string) (*os.File, *os.File) {
	progFile, _ := os.Create(ID + "_program_output.txt")
	logFile, _ := os.Create(ID + "_tree_logs.txt")
	return progFile, logFile
}

// startCppProcess starts the C++ interface with given FIFOs
func startCppProcess(ds, progFifo, logFifo string, webSocket io.Reader) (*exec.Cmd, error) {
	cmd := exec.Command("./"+ds+"Interface.exe",
		"--program-out", progFifo,
		"--tree-log-out", logFifo,
	)
	// For now: forward Go stdin → C++ stdin
	cmd.Stdin = webSocket
	return cmd, cmd.Start()
}

// forwardFifo reads from FIFO and writes into a file with optional console mirroring
func forwardFifo(fifo string, file io.Writer, prefix string) {
	go func() {
		f, err := os.Open(fifo)
		if err != nil {
			fmt.Println("Error opening fifo:", fifo, err)
			return
		}
		defer f.Close()
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := scanner.Text()
			fmt.Fprintln(file, prefix+":: "+line)
			// If you want to debug, uncomment:
			// fmt.Printf("[%s] %s\n", prefix, line)
		}
	}()
}

// runClientThread manages one client session with its own FIFOs and process
func runClientThread(ID string, ds string, clientSocket net.Conn) {
	// Define fifo paths
	progFifo := "fifos/" + ID + "_" + ds + "_program.fifo"
	logFifo := "fifos/" + ID + "_" + ds + "_log.fifo"

	// Create FIFOs
	if err := makeFifo(progFifo); err != nil {
		fmt.Println("panic at 1")
		panic(err)
	}
	if err := makeFifo(logFifo); err != nil {
		fmt.Println("panic at 2")
		panic(err)
	}

	// Prepare output files
	// progFile, logFile := openOutputFiles(ID)
	// defer progFile.Close()
	// defer logFile.Close()

	// Start C++ interface
	cmd, err := startCppProcess(ds, progFifo, logFifo, clientSocket)
	if err != nil {
		panic(err)
	}

	// Forward FIFO → files
	forwardFifo(progFifo, clientSocket, "PROGRAM")
	forwardFifo(logFifo, clientSocket, "TREELOG")

	// Wait for C++ process to finish
	if err := cmd.Wait(); err != nil {
		fmt.Println("btree exited with:", err)
	}
}
