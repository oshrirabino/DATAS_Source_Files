package main

import (
	"fmt"
	"os"
	"syscall"
)

var nextID = 0

func makeFifo(path string) error {
	// Remove old FIFO if exists
	_ = os.Remove(path)
	return syscall.Mkfifo(path, 0666)
}

func genID() string {
	nextID++
	return fmt.Sprintf("%04d", nextID)
}
