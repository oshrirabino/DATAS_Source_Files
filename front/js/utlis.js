/**
 * utils.js - Utility functions for the B-Tree visualizer
 * 
 * This module provides common utility functions used throughout the application.
 */

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Easing function for smooth animations (ease-in-out cubic)
 * @param {number} t - Time factor (0-1)
 * @returns {number} Eased value
 */
export function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance between points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two rectangles overlap
 * @param {Object} rect1 - First rectangle {x, y, width, height}
 * @param {Object} rect2 - Second rectangle {x, y, width, height}
 * @returns {boolean} True if rectangles overlap
 */
export function rectanglesOverlap(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * Format a number with appropriate precision
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export function formatNumber(num, decimals = 2) {
    return Number(num).toFixed(decimals);
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix for ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
    
    return obj;
}

/**
 * Parse color string to RGB components
 * @param {string} color - Color string (hex, rgb, etc.)
 * @returns {Object} RGB color object {r, g, b}
 */
export function parseColor(color) {
    // Simple hex color parser
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16)
            };
        } else if (hex.length === 6) {
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16)
            };
        }
    }
    
    // Default to black if parsing fails
    return { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex color string
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {string} Hex color string
 */
export function rgbToHex(r, g, b) {
    const toHex = (component) => {
        const hex = Math.round(clamp(component, 0, 255)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Interpolate between two colors
 * @param {string} color1 - Start color (hex)
 * @param {string} color2 - End color (hex)
 * @param {number} t - Interpolation factor (0-1)
 * @returns {string} Interpolated color (hex)
 */
export function interpolateColor(color1, color2, t) {
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);
    
    const r = lerp(c1.r, c2.r, t);
    const g = lerp(c1.g, c2.g, t);
    const b = lerp(c1.b, c2.b, t);
    
    return rgbToHex(r, g, b);
}

/**
 * Calculate optimal text color (black or white) for a background color
 * @param {string} backgroundColor - Background color (hex)
 * @returns {string} Optimal text color (#000000 or #ffffff)
 */
export function getOptimalTextColor(backgroundColor) {
    const color = parseColor(backgroundColor);
    
    // Calculate luminance
    const luminance = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Load a text file from user input
 * @param {File} file - File object from input element
 * @returns {Promise<string>} Promise resolving to file content
 */
export function loadTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            resolve(event.target.result);
        };
        
        reader.onerror = (event) => {
            reject(new Error(`Error reading file: ${event.target.error.message}`));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Download text content as a file
 * @param {string} content - Text content to download
 * @param {string} filename - Name for the downloaded file
 * @param {string} mimeType - MIME type for the file
 */
export function downloadTextFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

/**
 * Format timestamp as readable string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted time string
 */
export function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
}

/**
 * Calculate elapsed time in human readable format
 * @param {number} startTime - Start timestamp
 * @param {number} endTime - End timestamp (default: now)
 * @returns {string} Elapsed time string
 */
export function formatElapsedTime(startTime, endTime = Date.now()) {
    const elapsed = endTime - startTime;
    
    if (elapsed < 1000) {
        return `${elapsed}ms`;
    } else if (elapsed < 60000) {
        return `${(elapsed / 1000).toFixed(1)}s`;
    } else {
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
}

/**
 * Create a promise that resolves after a delay
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise} Promise that resolves after delay
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if the current device is mobile
 * @returns {boolean} True if on mobile device
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get viewport dimensions
 * @returns {Object} Viewport dimensions {width, height}
 */
export function getViewportSize() {
    return {
        width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
}

/**
 * Add CSS class to element with optional delay
 * @param {HTMLElement} element - Target element
 * @param {string} className - CSS class name
 * @param {number} delay - Delay before adding class (ms)
 */
export function addClassWithDelay(element, className, delay = 0) {
    setTimeout(() => {
        element.classList.add(className);
    }, delay);
}

/**
 * Remove CSS class from element with optional delay
 * @param {HTMLElement} element - Target element
 * @param {string} className - CSS class name
 * @param {number} delay - Delay before removing class (ms)
 */
export function removeClassWithDelay(element, className, delay = 0) {
    setTimeout(() => {
        element.classList.remove(className);
    }, delay);
}

export default {
    clamp,
    lerp,
    easeInOutCubic,
    distance,
    rectanglesOverlap,
    formatNumber,
    debounce,
    throttle,
    generateId,
    deepClone,
    parseColor,
    rgbToHex,
    interpolateColor,
    getOptimalTextColor,
    loadTextFile,
    downloadTextFile,
    formatTime,
    formatElapsedTime,
    delay,
    isMobile,
    getViewportSize,
    addClassWithDelay,
    removeClassWithDelay
};