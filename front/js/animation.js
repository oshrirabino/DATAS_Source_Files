/**
 * Tree Animation System
 * 
 * Provides functions to render and animate tree state changes.
 * Supports both BTree and AVL Tree visualization.
 */

class TreeAnimator {
  constructor(containerId) {
    if (!containerId || typeof containerId !== 'string') {
      throw new Error('Container ID must be a valid string');
    }
    
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
    this.animationTimeouts = []; // Track timeouts for cleanup
    
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
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
        border: 3px solid #2c3e50;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .tree-node.btree-node {
        background: linear-gradient(135deg, #e67e22, #d35400);
        border-radius: 8px;
        width: 80px;
        height: 50px;
        font-size: 12px;
      }
      
      .tree-node:hover {
        background: linear-gradient(135deg, #2980b9, #1f4e79);
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }
      
      .tree-node.btree-node:hover {
        background: linear-gradient(135deg, #d35400, #a04000);
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
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
        height: 3px;
        background: linear-gradient(90deg, #3498db, #2980b9);
        transform-origin: left center;
        transition: all 0.3s ease;
        z-index: 5;
        border-radius: 2px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
      
      .tree-connection.btree-connection {
        background: linear-gradient(90deg, #e67e22, #d35400);
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
    try {
      // Validate inputs
      if (!snapshot || typeof snapshot !== 'object') {
        console.warn('Invalid snapshot provided to renderSnapshot');
        this.showEmptyTree();
        return;
      }
      
      // Normalize tree type (convert 'avltree' to 'avl')
      if (treeType === 'avltree') {
        treeType = 'avl';
      }
      
      if (!['btree', 'avl'].includes(treeType)) {
        console.warn('Invalid tree type provided to renderSnapshot:', treeType);
        treeType = 'avl'; // Default fallback
      }
      
      this.clearDisplay();
      this.currentSnapshot = snapshot;
      
      if (!snapshot.root) {
        this.showEmptyTree();
        return;
      }
      
      // Build tree structure from node map
      const treeStructure = this.buildTreeStructure(snapshot, treeType);
      
      if (!treeStructure) {
        console.warn('Failed to build tree structure');
        this.showEmptyTree();
        return;
      }
      
      if (treeType === 'btree') {
        this.renderBTree(treeStructure);
      } else {
        this.renderAVLTree(treeStructure);
      }
      
      this.showCaption(snapshot.operation);
      
    } catch (error) {
      console.error('Error rendering snapshot:', error);
      this.showEmptyTree();
    }
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
      // For AVL trees, calculate depth first, then position with dynamic spacing
      const maxDepth = this.calculateAVLTreeDepth(treeStructure);
      const startX = containerWidth / 2;
      this.calculateAVLPositions(treeStructure, positions, startX, 70, 0, maxDepth);
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
   * Calculate the maximum depth of an AVL tree
   * @param {Object} node - AVL node
   * @param {number} currentDepth - Current depth
   * @returns {number} Maximum tree depth
   */
  calculateAVLTreeDepth(node, currentDepth = 0) {
    if (!node) return currentDepth;
    
    const leftDepth = node.left ? this.calculateAVLTreeDepth(node.left, currentDepth + 1) : currentDepth;
    const rightDepth = node.right ? this.calculateAVLTreeDepth(node.right, currentDepth + 1) : currentDepth;
    
    return Math.max(leftDepth, rightDepth);
  }

  /**
   * Calculate the width of an AVL tree to determine optimal positioning
   * @param {Object} node - AVL node
   * @param {number} level - Tree level
   * @param {number} maxDepth - Maximum tree depth
   * @returns {number} Tree width
   */
  calculateAVLTreeWidth(node, level, maxDepth) {
    if (!node) return 0;
    
    // Dynamic spacing based on tree depth and current level
    const baseSpacing = 40; // Base spacing for deepest nodes
    const depthRatio = (maxDepth - level) / maxDepth; // Higher nodes get more space
    const spacing = Math.max(baseSpacing * (1 + depthRatio * 3.5), 30);
    
    let leftWidth = 0;
    let rightWidth = 0;
    
    if (node.left) {
      leftWidth = spacing + this.calculateAVLTreeWidth(node.left, level + 1, maxDepth);
    }
    if (node.right) {
      rightWidth = spacing + this.calculateAVLTreeWidth(node.right, level + 1, maxDepth);
    }
    
    return leftWidth + rightWidth;
  }

  /**
   * Calculate positions for AVL nodes with improved spacing and dynamic angles
   * @param {Object} node - AVL node
   * @param {Object} positions - Position mapping
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} level - Tree level
   */
  calculateAVLPositions(node, positions, x, y, level, maxDepth) {
    if (!node) return;
    
    positions[node.address] = { x: x - this.nodeSize / 2, y: y };
    
    // Dynamic spacing based on tree depth and current level
    const baseSpacing = 40; // Base spacing for deepest nodes
    const depthRatio = (maxDepth - level) / maxDepth; // Higher nodes get more space
    let spacing = Math.max(baseSpacing * (1 + depthRatio * 2.5), 30);
    
    // Check if tree is getting too wide and adjust spacing
    const containerWidth = this.container.clientWidth;
    const maxWidth = containerWidth - 100; // Leave 50px margin on each side
    const currentWidth = this.calculateAVLTreeWidth(node, level, maxDepth);
    
    if (currentWidth > maxWidth && level < 3) {
      // Scale down spacing for higher levels if tree is too wide
      const scaleFactor = maxWidth / currentWidth;
      spacing = spacing * scaleFactor;
    }
    
    // Calculate child positions with improved spacing
    if (node.left) {
      this.calculateAVLPositions(node.left, positions, x - spacing, y + this.levelHeight, level + 1, maxDepth);
    }
    if (node.right) {
      this.calculateAVLPositions(node.right, positions, x + spacing, y + this.levelHeight, level + 1, maxDepth);
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
          this.createConnectionElement(parentPos, childPos, 'btree');
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
        this.createConnectionElement(parentPos, leftPos, 'avl');
      }
      this.renderAVLConnections(node.left, positions);
    }
    
    if (node.right) {
      const rightPos = positions[node.right.address];
      if (rightPos) {
        this.createConnectionElement(parentPos, rightPos, 'avl');
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
    
    if (treeType === 'btree') {
      element.className += ' btree-node';
    }
    
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
   * @param {string} treeType - 'btree' or 'avl'
   */
  createConnectionElement(fromPos, toPos, treeType = 'avl') {
    const element = document.createElement('div');
    element.className = 'tree-connection';
    
    if (treeType === 'btree') {
      element.className += ' btree-connection';
    }
    
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
    
    const timeout = setTimeout(() => {
      element.classList.remove('searching');
    }, duration);
    
    this.animationTimeouts.push(timeout);
  }
  
  /**
   * Clean up all animations and timeouts
   */
  cleanup() {
    // Clear all timeouts
    this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
    this.animationTimeouts = [];
    
    // Clear animation queue
    this.animationQueue = [];
    this.isAnimating = false;
    
    // Clear display
    this.clearDisplay();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TreeAnimator;
}
