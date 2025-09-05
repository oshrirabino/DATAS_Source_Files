package main

import (
	"net/http"
	"strconv"
)

// validateDataType checks if the data structure type is valid
func validateDataType(dataType string) bool {
	validTypes := map[string]bool{
		"btree":   true,
		"avltree": true,
	}
	return validTypes[dataType]
}

// buildFlags creates command line flags based on data type and parameters
func buildFlags(dataType string, r *http.Request) (string, error) {
	switch dataType {
	case "btree":
		order := r.URL.Query().Get("order")
		if order == "" {
			return "", nil
		}
		// Validate order is a number >= 2
		if orderInt, err := strconv.Atoi(order); err != nil || orderInt < 2 {
			return "", &ValidationError{"Invalid order. Must be integer >= 2"}
		}
		return "--order " + order, nil

	case "avltree":
		// AVL tree doesn't need special flags for now
		return "", nil

	default:
		return "", &ValidationError{"Unsupported data type"}
	}
}

// ValidationError represents a validation error
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

// validateRequest performs all request validation and returns flags
func validateRequest(r *http.Request) (string, string, error) {
	// Check if type parameter exists
	dataType := r.URL.Query().Get("type")
	if dataType == "" {
		return "", "", &ValidationError{"Missing required parameter: type"}
	}

	// Validate data structure type
	if !validateDataType(dataType) {
		return "", "", &ValidationError{"Invalid type. Supported types: btree, avltree"}
	}

	// Build flags for the data type
	flags, err := buildFlags(dataType, r)
	if err != nil {
		return "", "", err
	}

	return dataType, flags, nil
}
