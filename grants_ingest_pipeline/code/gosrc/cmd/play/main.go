package main

import (
	"archive/zip"
	"fmt"
)

func main() {
	fmt.Println("Testing Piping the contents of a file")

	rc, err := zip.OpenReader("archive.zip")

}
