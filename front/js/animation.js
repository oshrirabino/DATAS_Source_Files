/**
 * Tree Animation System
 * Handles tree visualization, animations, and user feedback
 * 
 * @class TreeAnimation
 */
class TreeAnimation {
  /**
   * Creates an instance of TreeAnimation
   * 
   * @param {string} containerId - ID of the container element
   * @param {string} treeType - Type of tree: 'btree' or 'avltree'
   */
  constructor(containerId, treeType = 'btree') {
    this.container = document.getElementById(containerId);
    
    this.treeType = treeType;
    this.currentTree = null;
    this.previousTree = null;
    this.animationQueue = [];
    this.isAnimating = false;
    
    // Animation settings
    this.animationDuration = 800;
    this.highlightDuration = 1000;
    this.captionDuration = 3000;
    
    // Visual elements
    this.captionElement = null;
    this.pointerElement = null;
    this.nodeElements = new Map();
    
    // Parsers
    this.btreeParser = new BTreeParser();
    this.avlParser = new AVLTreeParser();
    this.currentParser = treeType === 'btree' ? this.btreeParser : this.avlParser;
    
    this.initializeVisualElements();
  }
  
  /**
   * Initializes visual elements for animations
   */
  initializeVisualElements() {
    if (!this.container) {
      return;
    }
    
    // Clear any existing content
    this.container.innerHTML = '';
    
    // No caption element - no banners
    this.captionElement = null;
    
    // Create pointer element
    this.pointerElement = document.createElement('div');
    this.pointerElement.className = 'tree-pointer';
    this.pointerElement.innerHTML = '👆';
    this.pointerElement.style.cssText = `
      position: absolute;
      font-size: 24px;
      z-index: 999;
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    this.container.appendChild(this.pointerElement);
    
    // Set up container positioning
    this.container.style.position = 'relative';
    
  }
  
  /**
   * Processes incoming data from server
   * 
   * @param {Object} data - Server data with type and message
   */
  processServerData(data) {
    console.log('Animation processing data:', data.type, ':', data.message);
    
    if (data.type === 'log') {
      // Parse log data to build tree structure
      this.currentParser.parseLog(data.message);
      this.currentTree = this.currentParser.getRoot();
      console.log('Current tree after parsing:', this.currentTree);
      this.renderTree();
    }
    // Ignore program messages - no captions needed
  }
  
  /**
   * Shows a caption message - DISABLED
   */
  showCaption(message) {
    // No captions - just animations
  }
  
  
  
  /**
   * Animates tree structure changes
   */
  animateTreeChanges() {
    if (!this.currentTree) {
      this.clearTree();
      return;
    }
    
    // Render the current tree
    this.renderTree();
    
    // Animate any structural changes
    this.animateStructuralChanges();
  }
  
  /**
   * Renders the tree structure
   */
  renderTree() {
    console.log('renderTree called, currentTree:', this.currentTree);
    
    // Clear existing tree
    this.clearTree();
    
    if (!this.currentTree) {
      console.log('No tree to render');
      return;
    }
    
    // Calculate tree layout
    const layout = this.calculateTreeLayout();
    console.log('Layout calculated:', layout);
    
    // Render nodes
    this.renderNodes(layout);
    
    // Render connections
    this.renderConnections(layout);
  }
  
  /**
   * Calculates tree layout for visualization
   * 
   * @returns {Object} Layout information
   */
  calculateTreeLayout() {
    if (this.treeType === 'btree') {
      return this.calculateBTreeLayout();
    } else {
      return this.calculateAVLLayout();
    }
  }
  
  /**
   * Calculates B-Tree layout
   * 
   * @returns {Object} B-Tree layout
   */
  calculateBTreeLayout() {
    const nodes = [];
    const connections = [];
    
    if (this.currentTree) {
      this.traverseBTree(this.currentTree, 0, 0, nodes, connections);
    }
    
    return { nodes, connections };
  }
  
  /**
   * Calculates AVL Tree layout
   * 
   * @returns {Object} AVL Tree layout
   */
  calculateAVLLayout() {
    const nodes = [];
    const connections = [];
    
    if (this.currentTree) {
      this.traverseAVLTree(this.currentTree, 0, 0, nodes, connections);
    }
    
    return { nodes, connections };
  }
  
  /**
   * Traverses B-Tree for layout calculation
   * 
   * @param {Object} node - Current node
   * @param {number} level - Current level
   * @param {number} position - Position at current level
   * @param {Array} nodes - Nodes array
   * @param {Array} connections - Connections array
   */
  traverseBTree(node, level, position, nodes, connections) {
    if (!node) return;
    
    const nodeInfo = {
      id: node.id,
      keys: node.keys,
      isLeaf: node.isLeaf,
      level: level,
      position: position,
      x: 0, // Will be calculated
      y: 0  // Will be calculated
    };
    
    nodes.push(nodeInfo);
    
    // Traverse children
    if (!node.isLeaf && node.children) {
      node.children.forEach((childId, index) => {
        if (childId) {
          const childNode = this.currentParser.nodeMap.get(childId);
          if (childNode) {
            this.traverseBTree(childNode, level + 1, position * 10 + index, nodes, connections);
            
            // Add connection
            connections.push({
              from: node.id,
              to: childId,
              childIndex: index
            });
          }
        }
      });
    }
  }

  
  /**
   * Traverses AVL Tree for layout calculation
   * 
   * @param {Object} node - Current node
   * @param {number} level - Current level
   * @param {number} position - Position at current level
   * @param {Array} nodes - Nodes array
   * @param {Array} connections - Connections array
   */
  traverseAVLTree(node, level, position, nodes, connections) {
    if (!node) return;
    
    const nodeInfo = {
      id: node.id,
      data: node.data,
      level: level,
      position: position,
      x: 0, // Will be calculated
      y: 0  // Will be calculated
    };
    
    nodes.push(nodeInfo);
    
    // Traverse left child
    if (node.left) {
      const leftNode = this.currentParser.nodeMap.get(node.left);
      if (leftNode) {
        this.traverseAVLTree(leftNode, level + 1, position * 2, nodes, connections);
        connections.push({
          from: node.id,
          to: node.left,
          direction: 'left'
        });
      }
    }
    
    // Traverse right child
    if (node.right) {
      const rightNode = this.currentParser.nodeMap.get(node.right);
      if (rightNode) {
        this.traverseAVLTree(rightNode, level + 1, position * 2 + 1, nodes, connections);
        connections.push({
          from: node.id,
          to: node.right,
          direction: 'right'
        });
      }
    }
  }
  
  /**
   * Renders tree nodes
   * 
   * @param {Object} layout - Tree layout
   */
  renderNodes(layout) {
    if (!layout.nodes || layout.nodes.length === 0) {
      return;
    }
    
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    
    // Calculate positions
    const maxLevel = Math.max(...layout.nodes.map(n => n.level));
    const levelHeight = containerHeight / (maxLevel + 2);
    
    layout.nodes.forEach((node) => {
      const x = (node.position + 1) * (containerWidth / (Math.pow(2, node.level) + 1));
      const y = (node.level + 1) * levelHeight;
      
      node.x = x;
      node.y = y;
      
      this.createNodeElement(node);
    });
  }
  
  /**
   * Creates a node element
   * 
   * @param {Object} nodeInfo - Node information
   */
  createNodeElement(nodeInfo) {
    const nodeElement = document.createElement('div');
    nodeElement.className = 'tree-node';
    nodeElement.dataset.nodeId = nodeInfo.id;
    
    // Handle negative numbers properly
    let nodeText;
    if (this.treeType === 'btree') {
      nodeText = `[${nodeInfo.keys.join(', ')}]`;
    } else {
      nodeText = nodeInfo.data.toString();
    }
    nodeElement.innerHTML = nodeText;
    
    
    nodeElement.style.cssText = `
      position: absolute !important;
      left: ${nodeInfo.x - 30}px !important;
      top: ${nodeInfo.y - 15}px !important;
      width: 60px !important;
      height: 30px !important;
      background: #3498db !important;
      color: white !important;
      border-radius: 15px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 12px !important;
      font-weight: bold !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
      transition: all 0.3s ease !important;
      z-index: 100 !important;
    `;
    
    this.container.appendChild(nodeElement);
    this.nodeElements.set(nodeInfo.id, nodeElement);
  }
  
  /**
   * Renders tree connections
   * 
   * @param {Object} layout - Tree layout
   */
  renderConnections(layout) {
    layout.connections.forEach(conn => {
      const fromNode = layout.nodes.find(n => n.id === conn.from);
      const toNode = layout.nodes.find(n => n.id === conn.to);
      
      if (fromNode && toNode) {
        this.createConnectionElement(fromNode, toNode);
      }
    });
  }
  
  /**
   * Creates a connection element
   * 
   * @param {Object} fromNode - Source node
   * @param {Object} toNode - Target node
   */
  createConnectionElement(fromNode, toNode) {
    const connection = document.createElement('div');
    connection.className = 'tree-connection';
    
    const x1 = fromNode.x;
    const y1 = fromNode.y + 15;
    const x2 = toNode.x;
    const y2 = toNode.y - 15;
    
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    connection.style.cssText = `
      position: absolute;
      left: ${x1}px;
      top: ${y1}px;
      width: ${length}px;
      height: 2px;
      background: #7f8c8d;
      transform-origin: 0 0;
      transform: rotate(${angle}deg);
      z-index: 1;
    `;
    
    this.container.appendChild(connection);
  }
  
  /**
   * Animates structural changes
   */
  animateStructuralChanges() {
    // Add entrance animation to new nodes
    this.nodeElements.forEach((element, nodeId) => {
      element.style.transform = 'scale(0)';
      element.style.opacity = '0';
      
      setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.opacity = '1';
      }, 100);
    });
  }
  
  /**
   * Points to a specific node
   * 
   * @param {string} nodeId - Node ID to point to
   */
  pointToNode(nodeId) {
    const nodeElement = this.nodeElements.get(nodeId);
    if (nodeElement) {
      const rect = nodeElement.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      
      this.pointerElement.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
      this.pointerElement.style.top = (rect.top - containerRect.top - 30) + 'px';
      this.pointerElement.style.opacity = '1';
      
      // Hide after duration
      setTimeout(() => {
        this.pointerElement.style.opacity = '0';
      }, this.highlightDuration);
    }
  }
  
  /**
   * Highlights a node
   * 
   * @param {string} nodeId - Node ID to highlight
   * @param {string} color - Highlight color
   */
  highlightNode(nodeId, color = '#e74c3c') {
    const nodeElement = this.nodeElements.get(nodeId);
    if (nodeElement) {
      const originalColor = nodeElement.style.background;
      nodeElement.style.background = color;
      nodeElement.style.transform = 'scale(1.2)';
      
      setTimeout(() => {
        nodeElement.style.background = originalColor;
        nodeElement.style.transform = 'scale(1)';
      }, this.highlightDuration);
    }
  }
  
  /**
   * Clears the tree display
   */
  clearTree() {
    // Remove all node elements
    this.nodeElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.nodeElements.clear();
    
    // Remove all connection elements
    const connections = this.container.querySelectorAll('.tree-connection');
    connections.forEach(conn => {
      if (conn.parentNode) {
        conn.parentNode.removeChild(conn);
      }
    });
  }
  
  /**
   * Clones a tree structure
   * 
   * @param {Object} tree - Tree to clone
   * @returns {Object} Cloned tree
   */
  cloneTree(tree) {
    return JSON.parse(JSON.stringify(tree));
  }
  
  /**
   * Sets the tree type
   * 
   * @param {string} treeType - Tree type: 'btree' or 'avltree'
   */
  setTreeType(treeType) {
    this.treeType = treeType;
    this.currentParser = treeType === 'btree' ? this.btreeParser : this.avlParser;
    this.clearTree();
  }
  
  /**
   * Gets current tree information
   * 
   * @returns {Object} Tree information
   */
  getTreeInfo() {
    return this.currentParser.getTreeInfo();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TreeAnimation;
}
