package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
)

// Go wrapper for the C++ BTreeInterface process
type DatasProcess struct {
	cmd         *exec.Cmd
	stdin       io.WriteCloser
	programFile *os.File
	treeLogFile *os.File
}

// Start a new BTree process
func NewBTreeProcess(programOut, treeLogOut, ds string) (*DatasProcess, error) {
	// Build command: run C++ program (assume compiled to ./btreeInterface.exe)

	cmd := exec.Command("./" + ds + "Interface.exe")

	// Set up stdin pipe (to send commands)
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}

	// Set up pipes for stdout (program output) and stderr (tree logs)
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return nil, err
	}

	// Open files for logging
	progFile, err := os.Create(programOut)
	if err != nil {
		return nil, err
	}
	logFile, err := os.Create(treeLogOut)
	if err != nil {
		return nil, err
	}

	// Redirect stdout → programOut file
	go func() {
		scanner := bufio.NewScanner(stdoutPipe)
		for scanner.Scan() {
			line := scanner.Text()
			fmt.Fprintln(progFile, line)
		}
	}()

	// Redirect stderr → treeLogOut file
	go func() {
		scanner := bufio.NewScanner(stderrPipe)
		for scanner.Scan() {
			line := scanner.Text()
			fmt.Fprintln(logFile, line)
		}
	}()

	// Start process
	if err := cmd.Start(); err != nil {
		return nil, err
	}

	return &DatasProcess{
		cmd:         cmd,
		stdin:       stdin,
		programFile: progFile,
		treeLogFile: logFile,
	}, nil
}

// Send a command to the BTree
func (bp *DatasProcess) SendCommand(cmd string) error {
	_, err := fmt.Fprintln(bp.stdin, cmd)
	return err
}

// Wait for the process to finish
func (bp *DatasProcess) Wait() error {
	return bp.cmd.Wait()
}

func runClientThread(ID string, ds string) {
	progFifo := ID + "_" + ds + "_log.fifo"
	logFifo := ID + "_" + ds + "_program.fifo"
	if err := makeFifo(progFifo); err != nil {
		panic(err)
	}
	if err := makeFifo(logFifo); err != nil {
		panic(err)
	}

	// Output files where we want to archive the streams
	progFile, _ := os.Create(ID + "_program_output.txt")
	logFile, _ := os.Create(ID + "_tree_logs.txt")
	defer progFile.Close()
	defer logFile.Close()

	// Start C++ program with fifo paths
	cmd := exec.Command("./"+ds+"Interface.exe",
		"--program-out", progFifo,
		"--tree-log-out", logFifo,
	)

	// Hook stdin to our console so we can type commands interactively
	cmd.Stdin = os.Stdin

	if err := cmd.Start(); err != nil {
		panic(err)
	}

	// Start goroutines to read from the FIFOs
	go func() {
		f, _ := os.Open(progFifo)
		defer f.Close()
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := scanner.Text()
			fmt.Fprintln(progFile, line)
			// fmt.Println("[PROGRAM]", line) // also mirror to console
		}
	}()

	go func() {
		f, _ := os.Open(logFifo)
		defer f.Close()
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := scanner.Text()
			fmt.Fprintln(logFile, line)
			// fmt.Println("[TREELOG]", line) // also mirror to console
		}
	}()

	// Wait for process to finish
	if err := cmd.Wait(); err != nil {
		fmt.Println("btree exited with:", err)
	}
}
