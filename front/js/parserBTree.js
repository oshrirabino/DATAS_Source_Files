/**
 * B-Tree Log Parser
 * Rebuilds B-Tree state from logs without implementing tree logic
 * Based on parseLogsBtree.cpp logic
 * 
 * @class BTreeParser
 */
class BTreeParser {
  /**
   * Creates an instance of BTreeParser
   */
  constructor() {
    this.nodeMap = new Map();
    this.rootId = null;
    this.order = 3; // Default order
  }
  
  /**
   * Parses a single log line and updates tree state
   * 
   * @param {string} logLine - Log line to parse
   */
  parseLog(logLine) {
    console.log('Parsing log line:', logLine);
    
    // Handle different types of logs based on C++ parser
    if (logLine.includes('[TREE_INIT]')) {
      this.parseTreeInit(logLine);
    } else if (logLine.includes('[NODE_STATE]')) {
      this.parseNodeState(logLine);
    } else if (logLine.includes('[PARENT_CHILD]')) {
      this.parseParentChild(logLine);
    } else if (logLine.includes('[TREE_INSERT_COMPLETE]') || logLine.includes('[TREE_REMOVE_COMPLETE]')) {
      this.parseTreeComplete(logLine);
    } else if (logLine.includes('[Split Keys]')) {
      this.parseSplitKeys(logLine);
    } else if (logLine.includes('[Merge Result]')) {
      this.parseMergeResult(logLine);
    }
    // Ignore other logs as NODE_STATE provides complete information
  }
  
  /**
   * Parses tree initialization log
   * Format: [TREE_INIT] order=3 root=0x...
   */
  parseTreeInit(line) {
    const orderMatch = line.match(/order=(\d+)/);
    const rootMatch = line.match(/root=(0x[0-9a-fA-F]+)/);
    
    if (orderMatch) {
      this.order = parseInt(orderMatch[1], 10);
    }
    
    if (rootMatch) {
      this.rootId = rootMatch[1];
      this.ensureNodeExists(this.rootId, true); // Initial root is typically a leaf
    }
    
    console.log('Tree initialized: order=', this.order, 'root=', this.rootId);
  }
  
  /**
   * Parses node state log - this is the key function
   * Format: [NODE_STATE] context node=0x... is_leaf=true keys_count=1 children_count=0 keys=[5] children=[]
   */
  parseNodeState(line) {
    const nodeMatch = line.match(/node=(0x[0-9a-fA-F]+)/);
    const isLeafMatch = line.match(/is_leaf=(true|false)/);
    const keysMatch = line.match(/keys=\[([^\]]*)\]/);
    const childrenMatch = line.match(/children=\[([^\]]*)\]/);
    
    if (!nodeMatch) return;
    
    const nodeId = nodeMatch[1];
    const isLeaf = isLeafMatch ? isLeafMatch[1] === 'true' : true;
    
    // Ensure node exists
    this.ensureNodeExists(nodeId, isLeaf);
    
    const node = this.nodeMap.get(nodeId);
    
    // Parse keys
    if (keysMatch && keysMatch[1].trim()) {
      const keysStr = keysMatch[1];
      node.keys = keysStr.split(',').map(k => parseInt(k.trim(), 10)).filter(k => !isNaN(k));
    } else {
      node.keys = [];
    }
    
    // Parse children
    if (childrenMatch && childrenMatch[1].trim()) {
      const childrenStr = childrenMatch[1];
      const childIds = childrenStr.split(',').map(c => c.trim()).filter(c => c && c !== '0x0');
      node.children = childIds;
      
      // Ensure all child nodes exist
      childIds.forEach(childId => {
        this.ensureNodeExists(childId, true); // We'll update leaf status later
      });
    } else {
      node.children = [];
    }
    
    console.log('Updated node', nodeId, ':', {
      isLeaf: node.isLeaf,
      keys: node.keys,
      children: node.children
    });
  }
  
  /**
   * Parses parent-child relationship log
   * Format: [PARENT_CHILD] context parent=0x... child_index=1 child=0x...
   */
  parseParentChild(line) {
    const parentMatch = line.match(/parent=(0x[0-9a-fA-F]+)/);
    const childIndexMatch = line.match(/child_index=(\d+)/);
    const childMatch = line.match(/child=(0x[0-9a-fA-F]+)/);
    
    if (parentMatch && childIndexMatch && childMatch) {
      const parentId = parentMatch[1];
      const childIndex = parseInt(childIndexMatch[1], 10);
      const childId = childMatch[1];
      
      // Ensure both nodes exist
      this.ensureNodeExists(parentId, false); // Parent is typically internal
      this.ensureNodeExists(childId, true);   // We'll update this later
      
      const parentNode = this.nodeMap.get(parentId);
      const childNode = this.nodeMap.get(childId);
      
      if (parentNode && childNode) {
        // Ensure parent has enough children slots
        while (parentNode.children.length <= childIndex) {
          parentNode.children.push(null);
        }
        parentNode.children[childIndex] = childId;
        
        console.log('Set parent-child:', parentId, '[' + childIndex + '] =', childId);
      }
    }
  }
  
  /**
   * Parses tree completion log to update root
   * Format: [TREE_INSERT_COMPLETE] value=5 root=0x... or [TREE_REMOVE_COMPLETE] value=5 root=0x...
   */
  parseTreeComplete(line) {
    const rootMatch = line.match(/root=(0x[0-9a-fA-F]+)/);
    
    if (rootMatch) {
      const newRootId = rootMatch[1];
      this.rootId = newRootId;
      this.ensureNodeExists(newRootId);
      console.log('Root set to:', newRootId);
    }
  }
  
  /**
   * Parses split keys log
   * Format: [Split Keys] original_node=0x... original_keys=[5] new_sibling=0x... new_keys=[78]
   */
  parseSplitKeys(line) {
    const originalMatch = line.match(/original_node=(0x[0-9a-fA-F]+)/);
    const siblingMatch = line.match(/new_sibling=(0x[0-9a-fA-F]+)/);
    const originalKeysMatch = line.match(/original_keys=\[([^\]]*)\]/);
    const newKeysMatch = line.match(/new_keys=\[([^\]]*)\]/);
    
    if (originalMatch && siblingMatch) {
      const originalId = originalMatch[1];
      const siblingId = siblingMatch[1];
      
      // Determine if nodes are leaves (assume same type)
      let isLeaf = true;
      if (this.nodeMap.has(originalId)) {
        isLeaf = this.nodeMap.get(originalId).isLeaf;
      }
      
      this.ensureNodeExists(originalId, isLeaf);
      this.ensureNodeExists(siblingId, isLeaf);
      
      // Update keys
      if (originalKeysMatch && originalKeysMatch[1].trim()) {
        const keysStr = originalKeysMatch[1];
        this.nodeMap.get(originalId).keys = keysStr.split(',').map(k => parseInt(k.trim(), 10)).filter(k => !isNaN(k));
      }
      
      if (newKeysMatch && newKeysMatch[1].trim()) {
        const keysStr = newKeysMatch[1];
        this.nodeMap.get(siblingId).keys = keysStr.split(',').map(k => parseInt(k.trim(), 10)).filter(k => !isNaN(k));
      }
      
      console.log('Split keys: original=', originalId, 'new=', siblingId);
    }
  }
  
  /**
   * Parses merge result log
   * Format: [Merge Result] merged_node=0x... deleted_node=0x...
   */
  parseMergeResult(line) {
    const deletedMatch = line.match(/deleted_node=(0x[0-9a-fA-F]+)/);
    
    if (deletedMatch) {
      const deletedId = deletedMatch[1];
      if (this.nodeMap.has(deletedId)) {
        this.nodeMap.delete(deletedId);
        console.log('Deleted merged node:', deletedId);
      }
    }
  }
  
  /**
   * Ensures a node exists in the node map
   * 
   * @param {string} nodeId - Node ID
   * @param {boolean} isLeaf - Whether the node is a leaf
   */
  ensureNodeExists(nodeId, isLeaf = true) {
    if (nodeId && !this.nodeMap.has(nodeId)) {
      this.nodeMap.set(nodeId, {
        id: nodeId,
        isLeaf: isLeaf,
        keys: [],
        children: []
      });
      console.log('Created node', nodeId, '(leaf=' + isLeaf + ')');
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
      isLeaf: node.isLeaf,
      keys: [...node.keys],
      children: []
    };
    
    // Clone children recursively
    for (const childId of node.children) {
      if (childId && this.nodeMap.has(childId)) {
        cloned.children.push(this.cloneTree(this.nodeMap.get(childId)));
      } else {
        cloned.children.push(null);
      }
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
    const keysStr = node.keys.join(', ');
    console.log(`${indent}[${keysStr}]${node.isLeaf ? ' (leaf)' : ''}`);
    
    if (!node.isLeaf) {
      node.children.forEach(childId => {
        if (childId && this.nodeMap.has(childId)) {
          this.printTree(this.nodeMap.get(childId), level + 1);
        } else {
          console.log(`${indent}  [null]`);
        }
      });
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BTreeParser;
}