/**
 * Tree Animation System
 * 
 * Provides functions to render and animate tree state changes.
 * Supports both BTree and AVL Tree visualization.
 */

class TreeAnimator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }
    
    this.currentTree = null;
    this.currentSnapshot = null;
    this.animationSpeed = 800; // milliseconds
    this.nodeSize = 60;
    this.levelHeight = 100;
    this.siblingSpacing = 80;
    this.minSpacing = 40;
    
    // Animation state
    this.isAnimating = false;
    this.animationQueue = [];
    
    this.setupStyles();
  }

  /**
   * Setup CSS styles for tree visualization
   */
  setupStyles() {
    if (document.getElementById('tree-animator-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'tree-animator-styles';
    style.textContent = `
      .tree-node {
        position: absolute;
        width: 60px;
        height: 60px;
        background: #3498db;
        color: white;
        border: 2px solid #2c3e50;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .tree-node:hover {
        background: #2980b9;
        transform: scale(1.05);
      }
      
      .tree-node.highlighted {
        background: #e74c3c;
        animation: pulse 0.5s ease-in-out;
      }
      
      .tree-node.inserting {
        background: #27ae60;
        animation: insertPulse 0.8s ease-in-out;
      }
      
      .tree-node.removing {
        background: #e74c3c;
        animation: removePulse 0.8s ease-in-out;
      }
      
      .tree-node.searching {
        background: #f39c12;
        animation: searchPulse 0.6s ease-in-out infinite;
      }
      
      .tree-connection {
        position: absolute;
        height: 2px;
        background: #7f8c8d;
        transform-origin: left center;
        transition: all 0.3s ease;
        z-index: 5;
      }
      
      .tree-caption {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 16px;
        font-weight: 500;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      @keyframes insertPulse {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes removePulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
        100% { transform: scale(0); opacity: 0; }
      }
      
      @keyframes searchPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Render a tree snapshot
   * @param {Object} snapshot - Tree snapshot from parser
   * @param {string} treeType - 'btree' or 'avl'
   */
  renderSnapshot(snapshot, treeType = 'avl') {
    this.clearDisplay();
    this.currentSnapshot = snapshot;
    
    if (!snapshot || !snapshot.root) {
      this.showEmptyTree();
      return;
    }
    
    // Build tree structure from node map
    const treeStructure = this.buildTreeStructure(snapshot, treeType);
    
    if (treeType === 'btree') {
      this.renderBTree(treeStructure);
    } else {
      this.renderAVLTree(treeStructure);
    }
    
    this.showCaption(snapshot.operation);
  }

  /**
   * Build tree structure from snapshot node map
   * @param {Object} snapshot - Tree snapshot
   * @param {string} treeType - 'btree' or 'avl'
   * @returns {Object} Tree structure
   */
  buildTreeStructure(snapshot, treeType) {
    if (!snapshot || !snapshot.root || !snapshot.nodes) {
      return null;
    }
    
    const rootNode = snapshot.nodes.get(snapshot.root);
    if (!rootNode) {
      return null;
    }
    
    if (treeType === 'btree') {
      return this.buildBTreeStructure(rootNode, snapshot.nodes);
    } else {
      return this.buildAVLTreeStructure(rootNode, snapshot.nodes);
    }
  }

  /**
   * Build BTree structure recursively
   * @param {Object} node - Current node
   * @param {Map} nodeMap - All nodes map
   * @returns {Object} BTree node structure
   */
  buildBTreeStructure(node, nodeMap) {
    if (!node) return null;
    
    const structure = {
      address: node.address,
      keys: node.keys,
      isLeaf: node.isLeaf,
      children: []
    };
    
    if (!node.isLeaf && node.children) {
      for (const childAddr of node.children) {
        if (childAddr) {
          const childNode = nodeMap.get(childAddr);
          if (childNode) {
            structure.children.push(this.buildBTreeStructure(childNode, nodeMap));
          } else {
            structure.children.push(null);
          }
        } else {
          structure.children.push(null);
        }
      }
    }
    
    return structure;
  }

  /**
   * Build AVL tree structure recursively
   * @param {Object} node - Current node
   * @param {Map} nodeMap - All nodes map
   * @returns {Object} AVL node structure
   */
  buildAVLTreeStructure(node, nodeMap) {
    if (!node) return null;
    
    const structure = {
      address: node.address,
      value: node.value,
      left: null,
      right: null
    };
    
    if (node.left) {
      const leftNode = nodeMap.get(node.left);
      if (leftNode) {
        structure.left = this.buildAVLTreeStructure(leftNode, nodeMap);
      }
    }
    
    if (node.right) {
      const rightNode = nodeMap.get(node.right);
      if (rightNode) {
        structure.right = this.buildAVLTreeStructure(rightNode, nodeMap);
      }
    }
    
    return structure;
  }

  /**
   * Animate transition between two snapshots
   * @param {Object} oldSnapshot - Previous snapshot
   * @param {Object} newSnapshot - New snapshot
   * @param {string} treeType - 'btree' or 'avl'
   */
  animateTransition(oldSnapshot, newSnapshot, treeType = 'avl') {
    if (this.isAnimating) {
      this.animationQueue.push({ oldSnapshot, newSnapshot, treeType });
      return;
    }
    
    this.isAnimating = true;
    
    // Show caption for the operation
    this.showCaption(newSnapshot.operation);
    
    // For now, just render the new snapshot
    // TODO: Implement smooth transitions
    this.renderSnapshot(newSnapshot, treeType);
    
    setTimeout(() => {
      this.isAnimating = false;
      this.processAnimationQueue();
    }, this.animationSpeed);
  }

  /**
   * Calculate positions for all nodes in the tree
   * @param {Object} treeStructure - Tree structure
   * @param {string} treeType - 'btree' or 'avl'
   * @returns {Object} Position mapping
   */
  calculatePositions(treeStructure, treeType) {
    if (!treeStructure) return {};
    
    const positions = {};
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    
    if (treeType === 'btree') {
      this.calculateBTreePositions(treeStructure, positions, 0, containerWidth, 0);
    } else {
      this.calculateAVLPositions(treeStructure, positions, containerWidth / 2, 50, 0);
    }
    
    return positions;
  }

  /**
   * Calculate positions for BTree nodes
   * @param {Object} node - BTree node
   * @param {Object} positions - Position mapping
   * @param {number} left - Left boundary
   * @param {number} right - Right boundary
   * @param {number} y - Y position
   */
  calculateBTreePositions(node, positions, left, right, y) {
    if (!node) return;
    
    const width = right - left;
    const centerX = left + width / 2;
    
    positions[node.address] = { x: centerX - this.nodeSize / 2, y: y };
    
    if (!node.isLeaf && node.children) {
      const childWidth = width / node.children.length;
      for (let i = 0; i < node.children.length; i++) {
        if (node.children[i]) {
          const childLeft = left + i * childWidth;
          const childRight = left + (i + 1) * childWidth;
          this.calculateBTreePositions(node.children[i], positions, childLeft, childRight, y + this.levelHeight);
        }
      }
    }
  }

  /**
   * Calculate positions for AVL nodes
   * @param {Object} node - AVL node
   * @param {Object} positions - Position mapping
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} level - Tree level
   */
  calculateAVLPositions(node, positions, x, y, level) {
    if (!node) return;
    
    positions[node.address] = { x: x - this.nodeSize / 2, y: y };
    
    const spacing = Math.max(this.siblingSpacing, this.minSpacing * Math.pow(0.8, level));
    
    if (node.left) {
      this.calculateAVLPositions(node.left, positions, x - spacing, y + this.levelHeight, level + 1);
    }
    if (node.right) {
      this.calculateAVLPositions(node.right, positions, x + spacing, y + this.levelHeight, level + 1);
    }
  }

  /**
   * Render BTree
   * @param {Object} treeStructure - Tree structure
   */
  renderBTree(treeStructure) {
    const positions = this.calculatePositions(treeStructure, 'btree');
    this.renderBTreeRecursive(treeStructure, positions);
    this.renderBTreeConnections(treeStructure, positions);
  }

  /**
   * Render BTree recursively
   * @param {Object} node - BTree node
   * @param {Object} positions - Position mapping
   */
  renderBTreeRecursive(node, positions) {
    if (!node) return;
    
    const pos = positions[node.address];
    if (pos) {
      this.createNodeElement(node, pos, 'btree');
    }
    
    if (!node.isLeaf && node.children) {
      for (const child of node.children) {
        if (child) {
          this.renderBTreeRecursive(child, positions);
        }
      }
    }
  }

  /**
   * Render BTree connections
   * @param {Object} node - BTree node
   * @param {Object} positions - Position mapping
   */
  renderBTreeConnections(node, positions) {
    if (!node || node.isLeaf || !node.children) return;
    
    const parentPos = positions[node.address];
    if (!parentPos) return;
    
    for (const child of node.children) {
      if (child) {
        const childPos = positions[child.address];
        if (childPos) {
          this.createConnectionElement(parentPos, childPos);
        }
        this.renderBTreeConnections(child, positions);
      }
    }
  }

  /**
   * Render AVL Tree
   * @param {Object} treeStructure - Tree structure
   */
  renderAVLTree(treeStructure) {
    const positions = this.calculatePositions(treeStructure, 'avl');
    this.renderAVLRecursive(treeStructure, positions);
    this.renderAVLConnections(treeStructure, positions);
  }

  /**
   * Render AVL Tree recursively
   * @param {Object} node - AVL node
   * @param {Object} positions - Position mapping
   */
  renderAVLRecursive(node, positions) {
    if (!node) return;
    
    const pos = positions[node.address];
    if (pos) {
      this.createNodeElement(node, pos, 'avl');
    }
    
    if (node.left) {
      this.renderAVLRecursive(node.left, positions);
    }
    if (node.right) {
      this.renderAVLRecursive(node.right, positions);
    }
  }

  /**
   * Render AVL connections
   * @param {Object} node - AVL node
   * @param {Object} positions - Position mapping
   */
  renderAVLConnections(node, positions) {
    if (!node) return;
    
    const parentPos = positions[node.address];
    if (!parentPos) return;
    
    if (node.left) {
      const leftPos = positions[node.left.address];
      if (leftPos) {
        this.createConnectionElement(parentPos, leftPos);
      }
      this.renderAVLConnections(node.left, positions);
    }
    
    if (node.right) {
      const rightPos = positions[node.right.address];
      if (rightPos) {
        this.createConnectionElement(parentPos, rightPos);
      }
      this.renderAVLConnections(node.right, positions);
    }
  }

  /**
   * Create a node element
   * @param {Object} node - Node data
   * @param {Object} position - Position data
   * @param {string} treeType - 'btree' or 'avl'
   */
  createNodeElement(node, position, treeType) {
    const element = document.createElement('div');
    element.className = 'tree-node';
    element.setAttribute('data-address', node.address);
    element.style.left = position.x + 'px';
    element.style.top = position.y + 'px';
    
    if (treeType === 'btree') {
      // BTree nodes show keys array
      element.textContent = `[${node.keys.join(',')}]`;
      element.title = `BTree Node\nKeys: [${node.keys.join(', ')}]\nLeaf: ${node.isLeaf}`;
    } else {
      // AVL nodes show single value
      element.textContent = node.value;
      element.title = `AVL Node\nValue: ${node.value}`;
    }
    
    this.container.appendChild(element);
  }

  /**
   * Create a connection element
   * @param {Object} fromPos - Source position
   * @param {Object} toPos - Destination position
   */
  createConnectionElement(fromPos, toPos) {
    const element = document.createElement('div');
    element.className = 'tree-connection';
    
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    element.style.left = (fromPos.x + this.nodeSize / 2) + 'px';
    element.style.top = (fromPos.y + this.nodeSize / 2) + 'px';
    element.style.width = length + 'px';
    element.style.transform = `rotate(${angle}deg)`;
    
    this.container.appendChild(element);
  }

  /**
   * Show caption for current operation
   * @param {string} operation - Operation description
   */
  showCaption(operation) {
    // Remove existing caption
    const existingCaption = this.container.querySelector('.tree-caption');
    if (existingCaption) {
      existingCaption.remove();
    }
    
    if (!operation) return;
    
    const caption = document.createElement('div');
    caption.className = 'tree-caption';
    caption.textContent = operation;
    
    this.container.appendChild(caption);
    
    // Show caption with animation
    setTimeout(() => {
      caption.style.opacity = '1';
    }, 100);
    
    // Hide caption after delay
    setTimeout(() => {
      caption.style.opacity = '0';
      setTimeout(() => {
        if (caption.parentNode) {
          caption.parentNode.removeChild(caption);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Show empty tree message
   */
  showEmptyTree() {
    const message = document.createElement('div');
    message.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #7f8c8d;
      font-size: 18px;
      text-align: center;
    `;
    message.textContent = 'Tree is empty';
    this.container.appendChild(message);
  }

  /**
   * Clear the display
   */
  clearDisplay() {
    this.container.innerHTML = '';
  }

  /**
   * Process animation queue
   */
  processAnimationQueue() {
    if (this.animationQueue.length > 0) {
      const next = this.animationQueue.shift();
      this.animateTransition(next.oldSnapshot, next.newSnapshot, next.treeType);
    }
  }

  /**
   * Set animation speed
   * @param {number} speed - Animation speed in milliseconds
   */
  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
  }

  /**
   * Highlight a specific node (for search operations)
   * @param {string} address - Node address to highlight
   * @param {number} duration - Highlight duration in milliseconds
   */
  highlightNode(address, duration = 1000) {
    const element = document.querySelector(`[data-address="${address}"]`);
    if (!element) return;
    
    element.classList.add('searching');
    
    setTimeout(() => {
      element.classList.remove('searching');
    }, duration);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TreeAnimator;
}
