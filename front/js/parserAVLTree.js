/**
 * AVL Tree Log Parser
 * 
 * Parses AVL Tree operation logs and reconstructs tree state snapshots.
 * Based on the C++ parseLogsAVLTree.cpp implementation.
 * 
 * Log format examples:
 * - [ROOT_CREATE] address=0x64cd886b1d10 value=6
 * - [NODE_CREATE] address=0x64cd886b1d50 value=7
 * - [POINTER_CHANGE] 0x64cd886b1d10.right=0x64cd886b1d50
 * - [ROTATE_LEFT] node=0x64cd886b1d10 right=0x64cd886b1d50 right_left=0
 * - [ROOT_CHANGE] old=0x64cd886b1d10 new=0x64cd886b1d50
 */

class AVLTreeParser {
  constructor() {
    this.nodeMap = new Map(); // Maps address strings to node objects
    this.rootId = null;
    this.snapshots = []; // Array of tree snapshots
  }

  /**
   * Parse a single log line and update the tree state
   * @param {string} logLine - The log line to parse
   */
  parseLogLine(logLine) {
    if (logLine.includes('[ROOT_CREATE]')) {
      this.parseRootCreate(logLine);
    } else if (logLine.includes('[NODE_CREATE]')) {
      this.parseNodeCreate(logLine);
    } else if (logLine.includes('[NODE_DELETE]')) {
      this.parseNodeDelete(logLine);
    } else if (logLine.includes('[POINTER_CHANGE]')) {
      this.parsePointerChange(logLine);
    } else if (logLine.includes('[DATA_CHANGE]')) {
      this.parseDataChange(logLine);
    } else if (logLine.includes('[ROOT_CHANGE]')) {
      this.parseRootChange(logLine);
    } else if (logLine.includes('[ROTATE_LEFT]')) {
      this.parseRotateLeft(logLine);
    } else if (logLine.includes('[ROTATE_RIGHT]')) {
      this.parseRotateRight(logLine);
    } else if (logLine.includes('[INSERT]')) {
      this.parseInsert(logLine);
    } else if (logLine.includes('[REMOVE]')) {
      this.parseRemove(logLine);
    } else if (logLine.includes('[REMOVE_FOUND]')) {
      this.parseRemoveFound(logLine);
    } else if (logLine.includes('[FIND_PREDECESSOR]')) {
      this.parseFindPredecessor(logLine);
    } else if (logLine.includes('[FIND_SUCCESSOR]')) {
      this.parseFindSuccessor(logLine);
    } else if (logLine.includes('INIT_SUCCESS')) {
      this.parseInitSuccess(logLine);
    }
  }

  /**
   * Parse multiple log lines and return tree snapshots
   * @param {string} logContent - The complete log content
   * @returns {Array} Array of tree snapshots
   */
  parseLogs(logContent) {
    // Don't reset - maintain state across calls
    const lines = logContent.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        this.parseLogLine(line);
        // Create snapshot after each significant operation
        if (this.shouldCreateSnapshot(line)) {
          this.createSnapshot(line);
        }
      }
    }
    
    return this.snapshots;
  }

  /**
   * Parse a single log line incrementally (for real-time parsing)
   * @param {string} logLine - The log line to parse
   * @returns {Object|null} Snapshot if created, null otherwise
   */
  parseLogLineIncremental(logLine) {
    if (logLine.trim()) {
      this.parseLogLine(logLine);
      // Create snapshot after each significant operation
      if (this.shouldCreateSnapshot(logLine)) {
        this.createSnapshot(logLine);
        return this.snapshots[this.snapshots.length - 1]; // Return the latest snapshot
      }
    }
    return null;
  }

  /**
   * Reset the parser state
   */
  reset() {
    this.nodeMap.clear();
    this.rootId = null;
    this.snapshots = [];
  }

  /**
   * Determine if we should create a snapshot after this log line
   * @param {string} line - The log line
   * @returns {boolean} True if snapshot should be created
   */
  shouldCreateSnapshot(line) {
    return line.includes('[TREE_INSERT]') || 
           line.includes('[TREE_REMOVE]') || 
           line.includes('[TREE_FIND]') ||
           line.includes('[TREE_FIND_RESULT]');
  }

  /**
   * Create a snapshot of the current tree state
   * @param {string} operation - The operation that triggered the snapshot
   */
  createSnapshot(operation) {
    const snapshot = {
      operation: this.extractOperation(operation),
      root: this.rootId,
      nodes: this.cloneNodeMap(),
      timestamp: Date.now()
    };
    this.snapshots.push(snapshot);
  }

  /**
   * Extract operation type from log line
   * @param {string} line - The log line
   * @returns {string} Operation type
   */
  extractOperation(line) {
    if (line.includes('[TREE_INSERT]')) {
      const value = this.parseValue(line, 'value=');
      return `Insert ${value}`;
    } else if (line.includes('[TREE_REMOVE]')) {
      const value = this.parseValue(line, 'value=');
      return `Remove ${value}`;
    } else if (line.includes('[TREE_FIND]')) {
      const value = this.parseValue(line, 'value=');
      return `Find ${value}`;
    } else if (line.includes('[TREE_FIND_RESULT]')) {
      const value = this.parseValue(line, 'value=');
      const found = line.includes('found=true');
      return `Find ${value} (${found ? 'found' : 'not found'})`;
    }
    return 'Unknown operation';
  }

  /**
   * Clone the current node map for snapshot
   * @returns {Map} Cloned node map
   */
  cloneNodeMap() {
    const cloned = new Map();
    for (const [address, node] of this.nodeMap) {
      cloned.set(address, {
        address: node.address,
        value: node.value,
        left: node.left,
        right: node.right
      });
    }
    return cloned;
  }

  /**
   * Parse initialization success log
   * @param {string} line - The log line
   */
  parseInitSuccess(line) {
    // AVL trees don't have order, just type
    // Line format: INIT_SUCCESS type=AVL size=0
  }

  /**
   * Parse root creation log
   * @param {string} line - The log line
   */
  parseRootCreate(line) {
    const address = this.parseAddress(line);
    const value = this.parseValue(line, 'value=');
    
    if (address) {
      this.nodeMap.set(address, {
        address: address,
        value: value,
        left: null,
        right: null
      });
      this.rootId = address;
    }
  }

  /**
   * Parse node creation log
   * @param {string} line - The log line
   */
  parseNodeCreate(line) {
    const address = this.parseAddress(line);
    const value = this.parseValue(line, 'value=');
    
    if (address) {
      this.nodeMap.set(address, {
        address: address,
        value: value,
        left: null,
        right: null
      });
    }
  }

  /**
   * Parse node deletion log
   * @param {string} line - The log line
   */
  parseNodeDelete(line) {
    const address = this.parseAddress(line);
    
    if (address && this.nodeMap.has(address)) {
      this.nodeMap.delete(address);
    }
  }

  /**
   * Parse pointer change log
   * @param {string} line - The log line
   */
  parsePointerChange(line) {
    // Format: [POINTER_CHANGE] 0x....left=0x... or [POINTER_CHANGE] 0x....right=0x...
    
    // Find the parent address (before the dot)
    const start = line.indexOf('0x');
    if (start === -1) return;
    
    const dotPos = line.indexOf('.', start);
    if (dotPos === -1) return;
    
    const parentStr = line.substring(start, dotPos);
    const parentAddr = parentStr;
    
    // Determine if it's left or right
    const isLeft = line.includes('.left=');
    
    // Find the child address (after the equals)
    const eqPos = line.indexOf('=', dotPos);
    if (eqPos === -1) return;
    
    const childAddr = this.parseAddress(line.substring(eqPos + 1));
    
    if (this.nodeMap.has(parentAddr)) {
      const parentNode = this.nodeMap.get(parentAddr);
      if (isLeft) {
        parentNode.left = childAddr;
      } else {
        parentNode.right = childAddr;
      }
    }
  }

  /**
   * Parse data change log
   * @param {string} line - The log line
   */
  parseDataChange(line) {
    const address = this.parseAddress(line);
    const newValue = this.parseValue(line, 'new_value=');
    
    if (address && this.nodeMap.has(address)) {
      this.nodeMap.get(address).value = newValue;
    }
  }

  /**
   * Parse root change log
   * @param {string} line - The log line
   */
  parseRootChange(line) {
    const newRoot = this.parseAddress(line, 'new=');
    if (newRoot) {
      this.rootId = newRoot;
    }
  }

  /**
   * Parse address from log line
   * @param {string} line - The log line
   * @param {string} prefix - Optional prefix to search for
   * @returns {string|null} Parsed address or null
   */
  parseAddress(line, prefix = 'address=') {
    let pos = line.indexOf(prefix);
    if (pos === -1) {
      // Try to find 0x directly
      pos = line.indexOf('0x');
      if (pos === -1) return null;
    } else {
      pos = line.indexOf('0x', pos);
      if (pos === -1) return null;
    }

    const end = line.indexOf(' ', pos);
    const end2 = line.indexOf(')', pos);
    const end3 = line.indexOf('=', pos);
    const end4 = line.indexOf('\n', pos);
    
    let actualEnd = line.length;
    if (end !== -1) actualEnd = Math.min(actualEnd, end);
    if (end2 !== -1) actualEnd = Math.min(actualEnd, end2);
    if (end3 !== -1) actualEnd = Math.min(actualEnd, end3);
    if (end4 !== -1) actualEnd = Math.min(actualEnd, end4);

    return line.substring(pos, actualEnd);
  }

  /**
   * Parse integer value from log line
   * @param {string} line - The log line
   * @param {string} prefix - The prefix to search for
   * @returns {number} Parsed value
   */
  parseValue(line, prefix) {
    const pos = line.indexOf(prefix);
    if (pos === -1) return 0;

    const start = pos + prefix.length;
    const end = line.indexOf(' ', start);
    const end2 = line.indexOf('\n', start);
    
    let actualEnd = line.length;
    if (end !== -1) actualEnd = Math.min(actualEnd, end);
    if (end2 !== -1) actualEnd = Math.min(actualEnd, end2);

    const valueStr = line.substring(start, actualEnd);
    return parseInt(valueStr, 10) || 0;
  }

  /**
   * Get the current tree structure as a hierarchical object
   * @returns {Object|null} Tree structure or null if empty
   */
  getTreeStructure() {
    if (!this.rootId || !this.nodeMap.has(this.rootId)) {
      return null;
    }

    return this.buildNodeStructure(this.rootId);
  }

  /**
   * Build node structure recursively
   * @param {string} address - Node address
   * @returns {Object} Node structure
   */
  buildNodeStructure(address) {
    if (!address || !this.nodeMap.has(address)) {
      return null;
    }

    const node = this.nodeMap.get(address);
    const structure = {
      address: address,
      value: node.value,
      left: null,
      right: null
    };

    if (node.left) {
      structure.left = this.buildNodeStructure(node.left);
    }
    if (node.right) {
      structure.right = this.buildNodeStructure(node.right);
    }

    return structure;
  }

  /**
   * Get inorder traversal of the tree
   * @returns {Array<number>} Array of values in inorder
   */
  getInorderTraversal() {
    const result = [];
    this.inorderTraversal(this.rootId, result);
    return result;
  }

  /**
   * Perform inorder traversal recursively
   * @param {string} address - Current node address
   * @param {Array<number>} result - Result array to populate
   */
  inorderTraversal(address, result) {
    if (!address || !this.nodeMap.has(address)) {
      return;
    }

    const node = this.nodeMap.get(address);
    
    // Visit left subtree
    if (node.left) {
      this.inorderTraversal(node.left, result);
    }
    
    // Visit current node
    result.push(node.value);
    
    // Visit right subtree
    if (node.right) {
      this.inorderTraversal(node.right, result);
    }
  }

  /**
   * Calculate tree height
   * @returns {number} Tree height
   */
  getTreeHeight() {
    return this.calculateHeight(this.rootId);
  }

  /**
   * Calculate height recursively
   * @param {string} address - Node address
   * @returns {number} Height of subtree
   */
  calculateHeight(address) {
    if (!address || !this.nodeMap.has(address)) {
      return 0;
    }

    const node = this.nodeMap.get(address);
    const leftHeight = node.left ? this.calculateHeight(node.left) : 0;
    const rightHeight = node.right ? this.calculateHeight(node.right) : 0;
    
    return 1 + Math.max(leftHeight, rightHeight);
  }

  /**
   * Parse rotation left log
   * @param {string} line - The log line
   */
  parseRotateLeft(line) {
    // Format: [ROTATE_LEFT] node=0x... right=0x... right_left=0x...
    // This is informational - the actual pointer changes are in POINTER_CHANGE logs
  }

  /**
   * Parse rotation right log
   * @param {string} line - The log line
   */
  parseRotateRight(line) {
    // Format: [ROTATE_RIGHT] node=0x... left=0x... left_right=0x...
    // This is informational - the actual pointer changes are in POINTER_CHANGE logs
  }

  /**
   * Parse insert log (tracks insertion path)
   * @param {string} line - The log line
   */
  parseInsert(line) {
    // Format: [INSERT] node=0x... value=X direction=left/right
    // This is informational - actual node creation is in NODE_CREATE
  }

  /**
   * Parse remove log (tracks removal path)
   * @param {string} line - The log line
   */
  parseRemove(line) {
    // Format: [REMOVE] node=0x... searching=X
    // This is informational - actual removal is in NODE_DELETE
  }

  /**
   * Parse remove found log
   * @param {string} line - The log line
   */
  parseRemoveFound(line) {
    // Format: [REMOVE_FOUND] node=0x... value=X
    // This is informational - actual removal is in NODE_DELETE
  }

  /**
   * Parse find predecessor log
   * @param {string} line - The log line
   */
  parseFindPredecessor(line) {
    // Format: [FIND_PREDECESSOR] start=0x... result=0x... depth=X
    // This is informational - used for finding replacement nodes
  }

  /**
   * Parse find successor log
   * @param {string} line - The log line
   */
  parseFindSuccessor(line) {
    // Format: [FIND_SUCCESSOR] start=0x... result=0x... depth=X
    // This is informational - used for finding replacement nodes
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AVLTreeParser;
}
