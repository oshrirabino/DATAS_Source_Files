/**
 * BTree Log Parser
 * 
 * Parses BTree operation logs and reconstructs tree state snapshots.
 * Based on the C++ parseLogsBtree.cpp implementation.
 * 
 * Log format examples:
 * - [NODE_STATE] ROOT_BEFORE_INSERT node=0x63a140872460 is_leaf=true keys_count=1 children_count=0 keys=[5] children=[]
 * - [Split Keys] original_node=0x63a140872460 original_keys=[5] new_sibling=0x63a1408754c0 new_keys=[78]
 * - [TREE_INSERT_COMPLETE] value=9 root=0x63a140873d90
 */

class BTreeParser {
  constructor() {
    this.nodeMap = new Map(); // Maps address strings to node objects
    this.rootId = null;
    this.order = 4; // Default B-tree order
    this.snapshots = []; // Array of tree snapshots
  }

  /**
   * Parse a single log line and update the tree state
   * @param {string} logLine - The log line to parse
   */
  parseLogLine(logLine) {
    if (logLine.includes('[NODE_STATE]')) {
      this.parseNodeState(logLine);
    } else if (logLine.includes('[Split Keys]')) {
      this.parseSplitKeys(logLine);
    } else if (logLine.includes('[TREE_INSERT_COMPLETE]') || 
               logLine.includes('[TREE_REMOVE_COMPLETE]')) {
      this.parseTreeComplete(logLine);
    } else if (logLine.includes('[Merge Result]')) {
      this.parseMergeResult(logLine);
    } else if (logLine.includes('[TREE_INSERT]')) {
      this.parseTreeInsert(logLine);
    } else if (logLine.includes('[Insert Val]')) {
      this.parseInsertVal(logLine);
    } else if (logLine.includes('[Insert Leaf]')) {
      this.parseInsertLeaf(logLine);
    } else if (logLine.includes('[Insert Internal]')) {
      this.parseInsertInternal(logLine);
    } else if (logLine.includes('[find Index]')) {
      this.parseFindIndex(logLine);
    } else if (logLine.includes('[Root Split]')) {
      this.parseRootSplit(logLine);
    } else if (logLine.includes('[Split Sibling]')) {
      this.parseSplitSibling(logLine);
    } else if (logLine.includes('[Split Result]')) {
      this.parseSplitResult(logLine);
    } else if (logLine.includes('[Remove Val]')) {
      this.parseRemoveVal(logLine);
    } else if (logLine.includes('[Remove Leaf]')) {
      this.parseRemoveLeaf(logLine);
    } else if (logLine.includes('[Remove Internal]')) {
      this.parseRemoveInternal(logLine);
    } else if (logLine.includes('[PARENT_CHILD]')) {
      this.parseParentChild(logLine);
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
    return line.includes('[TREE_INSERT_COMPLETE]') || 
           line.includes('[TREE_REMOVE_COMPLETE]') || 
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
    if (line.includes('[TREE_INSERT_COMPLETE]')) {
      const value = this.parseValue(line, 'value=');
      return `Insert ${value}`;
    } else if (line.includes('[TREE_REMOVE_COMPLETE]')) {
      const value = this.parseValue(line, 'value=');
      return `Remove ${value}`;
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
        isLeaf: node.isLeaf,
        keys: [...node.keys],
        children: [...node.children]
      });
    }
    return cloned;
  }

  /**
   * Parse initialization success log
   * @param {string} line - The log line
   */
  parseInitSuccess(line) {
    this.order = this.parseValue(line, 'order=');
  }

  /**
   * Parse node state log
   * @param {string} line - The log line
   */
  parseNodeState(line) {
    const address = this.parseAddress(line);
    if (!address) return;

    const isLeaf = this.parseBool(line, 'is_leaf=');
    const keys = this.parseKeyArray(line, 'keys=');
    const children = this.parseAddressArray(line, 'children=');

    // Ensure node exists
    if (!this.nodeMap.has(address)) {
      this.nodeMap.set(address, {
        address: address,
        isLeaf: isLeaf,
        keys: [],
        children: []
      });
    }

    const node = this.nodeMap.get(address);
    node.isLeaf = isLeaf;
    node.keys = keys;
    node.children = children.map(addr => addr || null);
  }

  /**
   * Parse split keys log
   * @param {string} line - The log line
   */
  parseSplitKeys(line) {
    const originalNode = this.parseAddress(line);
    const newSibling = this.parseAddress(line, 'new_sibling=');
    const originalKeys = this.parseKeyArray(line, 'original_keys=');
    const newKeys = this.parseKeyArray(line, 'new_keys=');

    if (originalNode && newSibling) {
      // Determine if nodes are leaves (assume same type)
      let isLeaf = true;
      if (this.nodeMap.has(originalNode)) {
        isLeaf = this.nodeMap.get(originalNode).isLeaf;
      }

      // Ensure both nodes exist
      this.ensureNodeExists(originalNode, isLeaf);
      this.ensureNodeExists(newSibling, isLeaf);

      // Update keys
      this.nodeMap.get(originalNode).keys = originalKeys;
      this.nodeMap.get(newSibling).keys = newKeys;
    }
  }

  /**
   * Parse tree complete log (insert/remove completion)
   * @param {string} line - The log line
   */
  parseTreeComplete(line) {
    const root = this.parseAddress(line, 'root=');
    if (root && this.rootId !== root) {
      this.rootId = root;
      this.ensureNodeExists(root);
    }
  }

  /**
   * Parse merge result log
   * @param {string} line - The log line
   */
  parseMergeResult(line) {
    const deletedNode = this.parseAddress(line, 'deleted_node=');
    if (deletedNode && this.nodeMap.has(deletedNode)) {
      this.nodeMap.delete(deletedNode);
    }
  }

  /**
   * Ensure a node exists in the map
   * @param {string} address - Node address
   * @param {boolean} isLeaf - Whether the node is a leaf
   */
  ensureNodeExists(address, isLeaf = true) {
    if (address && !this.nodeMap.has(address)) {
      this.nodeMap.set(address, {
        address: address,
        isLeaf: isLeaf,
        keys: [],
        children: []
      });
    }
  }

  /**
   * Parse address from log line
   * @param {string} line - The log line
   * @param {string} prefix - Optional prefix to search for
   * @returns {string|null} Parsed address or null
   */
  parseAddress(line, prefix = 'node=') {
    const pos = line.indexOf(prefix);
    if (pos === -1) return null;

    const start = line.indexOf('0x', pos);
    if (start === -1) return null;

    const end = line.indexOf(' ', start);
    const end2 = line.indexOf(')', start);
    const end3 = line.indexOf('=', start);
    
    let actualEnd = line.length;
    if (end !== -1) actualEnd = Math.min(actualEnd, end);
    if (end2 !== -1) actualEnd = Math.min(actualEnd, end2);
    if (end3 !== -1) actualEnd = Math.min(actualEnd, end3);

    return line.substring(start, actualEnd);
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
   * Parse boolean value from log line
   * @param {string} line - The log line
   * @param {string} prefix - The prefix to search for
   * @returns {boolean} Parsed boolean value
   */
  parseBool(line, prefix) {
    const pos = line.indexOf(prefix);
    if (pos === -1) return false;

    const start = pos + prefix.length;
    return line.substring(start, start + 4) === 'true';
  }

  /**
   * Parse key array from log line
   * @param {string} line - The log line
   * @param {string} prefix - The prefix to search for
   * @returns {Array<number>} Parsed key array
   */
  parseKeyArray(line, prefix) {
    const keys = [];
    const start = line.indexOf(prefix + '[');
    if (start === -1) return keys;

    const end = line.indexOf(']', start);
    if (end === -1) return keys;

    const keysStr = line.substring(start + prefix.length + 1, end);
    if (keysStr.trim() === '') return keys;

    const keyParts = keysStr.split(',');
    for (const key of keyParts) {
      const trimmed = key.trim();
      if (trimmed) {
        keys.push(parseInt(trimmed, 10));
      }
    }

    return keys;
  }

  /**
   * Parse address array from log line
   * @param {string} line - The log line
   * @param {string} prefix - The prefix to search for
   * @returns {Array<string|null>} Parsed address array
   */
  parseAddressArray(line, prefix) {
    const addresses = [];
    const start = line.indexOf(prefix + '[');
    if (start === -1) return addresses;

    const end = line.indexOf(']', start);
    if (end === -1) return addresses;

    const addrStr = line.substring(start + prefix.length + 1, end);
    if (addrStr.trim() === '') return addresses;

    const addrParts = addrStr.split(',');
    for (const addr of addrParts) {
      const trimmed = addr.trim();
      if (trimmed && trimmed !== 'null' && trimmed !== '(nil)') {
        addresses.push(trimmed);
      } else {
        addresses.push(null);
      }
    }

    return addresses;
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
      keys: node.keys,
      isLeaf: node.isLeaf,
      children: []
    };

    if (!node.isLeaf) {
      for (const childAddr of node.children) {
        if (childAddr) {
          structure.children.push(this.buildNodeStructure(childAddr));
        } else {
          structure.children.push(null);
        }
      }
    }

    return structure;
  }

  /**
   * Parse tree insert start log
   * @param {string} line - The log line
   */
  parseTreeInsert(line) {
    // Format: [TREE_INSERT] value=X root=0x...
    // This is informational - actual insertion is in NODE_STATE logs
  }

  /**
   * Parse insert value log
   * @param {string} line - The log line
   */
  parseInsertVal(line) {
    // Format: [Insert Val] node=0x... value=X
    // This is informational - actual insertion is in NODE_STATE logs
  }

  /**
   * Parse insert leaf log
   * @param {string} line - The log line
   */
  parseInsertLeaf(line) {
    // Format: [Insert Leaf] node=0x... inserting key=X at index=Y
    // This is informational - actual insertion is in NODE_STATE logs
  }

  /**
   * Parse insert internal log
   * @param {string} line - The log line
   */
  parseInsertInternal(line) {
    // Format: [Insert Internal] node=0x... going to child at index=X child=0x...
    // This is informational - actual insertion is in NODE_STATE logs
  }

  /**
   * Parse find index log
   * @param {string} line - The log line
   */
  parseFindIndex(line) {
    // Format: [find Index] search index for val=X in node=0x...: found index=Y
    // This is informational - used for finding insertion position
  }

  /**
   * Parse root split log
   * @param {string} line - The log line
   */
  parseRootSplit(line) {
    // Format: [Root Split] root=0x... is full, creating new root
    // This is informational - actual split is in Split Keys logs
  }

  /**
   * Parse split sibling log
   * @param {string} line - The log line
   */
  parseSplitSibling(line) {
    // Format: [Split Sibling] node=0x... keys_size=X
    // This is informational - actual split is in Split Keys logs
  }

  /**
   * Parse split result log
   * @param {string} line - The log line
   */
  parseSplitResult(line) {
    // Format: [Split Result] original_node=0x... new_sibling=0x... mid_val=X
    // This is informational - actual split is in Split Keys logs
  }

  /**
   * Parse remove value log
   * @param {string} line - The log line
   */
  parseRemoveVal(line) {
    // Format: [Remove Val] node=0x... searching=X
    // This is informational - actual removal is in NODE_STATE logs
  }

  /**
   * Parse remove leaf log
   * @param {string} line - The log line
   */
  parseRemoveLeaf(line) {
    // Format: [Remove Leaf] node=0x... removing key=X at index=Y
    // This is informational - actual removal is in NODE_STATE logs
  }

  /**
   * Parse remove internal log
   * @param {string} line - The log line
   */
  parseRemoveInternal(line) {
    // Format: [Remove Internal Miss] key=X not at current level, going to child at index=Y child=0x...
    // This is informational - actual removal is in NODE_STATE logs
  }

  /**
   * Parse parent child relationship log
   * @param {string} line - The log line
   */
  parseParentChild(line) {
    // Format: [PARENT_CHILD] INSERT_GOING_TO_CHILD parent=0x... child_index=X child=0x...
    // This is informational - used for tracking parent-child relationships
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BTreeParser;
}
