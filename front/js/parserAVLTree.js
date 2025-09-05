/**
 * AVL Tree Log Parser
 * Rebuilds AVL Tree state from logs without implementing tree logic
 * Based on parseLogsAVLTree.cpp logic
 * 
 * @class AVLTreeParser
 */
class AVLTreeParser {
  /**
   * Creates an instance of AVLTreeParser
   */
  constructor() {
    this.nodeMap = new Map();
    this.rootId = null;
  }
  
  /**
   * Parses a single log line and updates tree state
   * 
   * @param {string} logLine - Log line to parse
   */
  parseLog(logLine) {
    console.log('Parsing AVL log line:', logLine);
    
    // Handle different types of logs based on actual AVL log format
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
    }
    // Ignore: [FIND], [TREE_FIND], [INSERT], [REMOVE], [ROTATE_*], [FIND_PREDECESSOR], etc.
  }
  
  /**
   * Parses root creation log
   * Format: [ROOT_CREATE] address=0x... value=...
   */
  parseRootCreate(line) {
    const addressMatch = line.match(/address=(0x[0-9a-fA-F]+)/);
    const valueMatch = line.match(/value=(\d+)/);
    
    if (addressMatch && valueMatch) {
      const address = addressMatch[1];
      const value = parseInt(valueMatch[1], 10);
      
      this.nodeMap.set(address, {
        id: address,
        data: value,
        left: null,
        right: null
      });
      this.rootId = address;
      
      console.log('Created root:', address, 'with value', value);
    }
  }
  
  /**
   * Parses node creation log
   * Format: [NODE_CREATE] address=0x... value=...
   */
  parseNodeCreate(line) {
    const addressMatch = line.match(/address=(0x[0-9a-fA-F]+)/);
    const valueMatch = line.match(/value=(\d+)/);
    
    if (addressMatch && valueMatch) {
      const address = addressMatch[1];
      const value = parseInt(valueMatch[1], 10);
      
      this.nodeMap.set(address, {
        id: address,
        data: value,
        left: null,
        right: null
      });
      
      console.log('Created node:', address, 'with value', value);
    }
  }
  
  /**
   * Parses node deletion log
   * Format: [NODE_DELETE] address=0x... value=... type=...
   */
  parseNodeDelete(line) {
    const addressMatch = line.match(/address=(0x[0-9a-fA-F]+)/);
    
    if (addressMatch) {
      const address = addressMatch[1];
      
      if (this.nodeMap.has(address)) {
        // Set children to null to prevent cascade deletion
        const node = this.nodeMap.get(address);
        node.left = null;
        node.right = null;
        this.nodeMap.delete(address);
        
        console.log('Deleted node:', address);
      }
    }
  }
  
  /**
   * Parses pointer change log
   * Format: [POINTER_CHANGE] 0x....left=0x... or [POINTER_CHANGE] 0x....right=0x...
   */
  parsePointerChange(line) {
    const addressMatch = line.match(/0x[0-9a-fA-F]+/);
    const leftMatch = line.match(/\.left=([0x0-9a-fA-F]+|0)/);
    const rightMatch = line.match(/\.right=([0x0-9a-fA-F]+|0)/);
    
    if (addressMatch) {
      const parentAddress = addressMatch[0];
      
      if (this.nodeMap.has(parentAddress)) {
        const parentNode = this.nodeMap.get(parentAddress);
        
        if (leftMatch) {
          const leftValue = leftMatch[1];
          // Handle null pointer (0 or null)
          if (leftValue === '0' || leftValue === 'null' || leftValue === 'nullptr') {
            parentNode.left = null;
            console.log('Set left pointer to null:', parentAddress);
          } else {
            parentNode.left = leftValue;
            console.log('Set left pointer:', parentAddress, '->', leftValue);
          }
        }
        
        if (rightMatch) {
          const rightValue = rightMatch[1];
          // Handle null pointer (0 or null)
          if (rightValue === '0' || rightValue === 'null' || rightValue === 'nullptr') {
            parentNode.right = null;
            console.log('Set right pointer to null:', parentAddress);
          } else {
            parentNode.right = rightValue;
            console.log('Set right pointer:', parentAddress, '->', rightValue);
          }
        }
      }
    }
  }
  
  /**
   * Parses data change log
   * Format: [DATA_CHANGE] address=0x... old_value=... new_value=...
   */
  parseDataChange(line) {
    const addressMatch = line.match(/address=(0x[0-9a-fA-F]+)/);
    const newValueMatch = line.match(/new_value=(\d+)/);
    
    if (addressMatch && newValueMatch) {
      const address = addressMatch[1];
      const newValue = parseInt(newValueMatch[1], 10);
      
      if (this.nodeMap.has(address)) {
        this.nodeMap.get(address).data = newValue;
        console.log('Changed data:', address, 'to', newValue);
      }
    }
  }
  
  /**
   * Parses root change log
   * Format: [ROOT_CHANGE] old=0x... new=0x...
   */
  parseRootChange(line) {
    const newRootMatch = line.match(/new=(0x[0-9a-fA-F]+)/);
    
    if (newRootMatch) {
      const newRootId = newRootMatch[1];
      this.rootId = newRootId;
      console.log('Root changed to:', newRootId);
    } else {
      // Also try the other format
      const newRootMatch2 = line.match(/new_root=(0x[0-9a-fA-F]+)/);
      if (newRootMatch2) {
        const newRootId = newRootMatch2[1];
        this.rootId = newRootId;
        console.log('Root changed to:', newRootId);
      }
    }
  }
  
  /**
   * Gets the root node of the tree
   * 
   * @returns {Object|null} Root node or null if no root
   */
  getRoot() {
    return this.rootId ? this.nodeMap.get(this.rootId) : null;
  }
  
  /**
   * Gets all nodes in the tree
   * 
   * @returns {Map} Map of all nodes
   */
  getAllNodes() {
    return this.nodeMap;
  }
  
  /**
   * Clones a tree node recursively
   * 
   * @param {Object} node - Node to clone
   * @returns {Object} Cloned node
   */
  cloneTree(node) {
    if (!node) return null;
    
    const cloned = {
      id: node.id,
      data: node.data,
      left: null,
      right: null
    };
    
    // Clone children recursively
    if (node.left && this.nodeMap.has(node.left)) {
      cloned.left = this.cloneTree(this.nodeMap.get(node.left));
    }
    
    if (node.right && this.nodeMap.has(node.right)) {
      cloned.right = this.cloneTree(this.nodeMap.get(node.right));
    }
    
    return cloned;
  }
  
  /**
   * Prints the tree structure for debugging
   * 
   * @param {Object} node - Node to print (defaults to root)
   * @param {number} level - Current level (for indentation)
   */
  printTree(node = null, level = 0) {
    if (node === null) {
      node = this.getRoot();
    }
    
    if (!node) {
      console.log('(empty tree)');
      return;
    }
    
    const indent = '  '.repeat(level);
    console.log(`${indent}${node.data}`);
    
    if (node.left || node.right) {
      if (node.left && this.nodeMap.has(node.left)) {
        this.printTree(this.nodeMap.get(node.left), level + 1);
      } else {
        console.log(`${indent}  [null]`);
      }
      
      if (node.right && this.nodeMap.has(node.right)) {
        this.printTree(this.nodeMap.get(node.right), level + 1);
      } else {
        console.log(`${indent}  [null]`);
      }
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AVLTreeParser;
}