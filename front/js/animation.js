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
    console.log('TreeAnimation constructor called with:', containerId, treeType);
    
    this.container = document.getElementById(containerId);
    console.log('Container found:', this.container);
    
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
    console.log('Creating parsers...');
    try {
      this.btreeParser = new BTreeParser();
      console.log('BTreeParser created:', this.btreeParser);
    } catch (error) {
      console.error('Failed to create BTreeParser:', error);
    }
    
    try {
      this.avlParser = new AVLTreeParser();
      console.log('AVLTreeParser created:', this.avlParser);
    } catch (error) {
      console.error('Failed to create AVLTreeParser:', error);
    }
    
    this.currentParser = treeType === 'btree' ? this.btreeParser : this.avlParser;
    console.log('Current parser:', this.currentParser);
    
    this.initializeVisualElements();
    console.log('TreeAnimation constructor completed');
  }
  
  /**
   * Initializes visual elements for animations
   */
  initializeVisualElements() {
    if (!this.container) {
      console.error('Tree container not found!');
      return;
    }
    
    // Clear any existing content
    this.container.innerHTML = '';
    
    // Create caption element
    this.captionElement = document.createElement('div');
    this.captionElement.className = 'tree-caption';
    this.captionElement.style.cssText = `
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
    `;
    this.container.appendChild(this.captionElement);
    
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
    
    // Set up container
    this.container.style.cssText = `
      position: relative;
      min-height: 400px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Add initial message
    this.showCaption('Tree visualization ready. Connect to server to see tree operations.');
  }
  
  /**
   * Processes incoming data from server
   * 
   * @param {Object} data - Server data with type and message
   */
  processServerData(data) {
    console.log('Animation processing data:', data);
    
    if (data.type === 'program') {
      this.handleProgramMessage(data.message);
    } else if (data.type === 'log') {
      this.handleLogMessage(data.message);
    } else {
      console.warn('Unknown data type:', data.type);
    }
  }
  
  /**
   * Handles program messages (user-friendly descriptions)
   * 
   * @param {string} message - Program message
   */
  handleProgramMessage(message) {
    console.log('Program message:', message);
    
    // Show caption with the message
    this.showCaption(message);
    
    // Parse the message to understand what's happening
    if (message.includes('INSERT_SUCCESS')) {
      this.animateInsert(message);
    } else if (message.includes('REMOVE_SUCCESS')) {
      this.animateRemove(message);
    } else if (message.includes('FIND_RESULT')) {
      this.animateFind(message);
    } else if (message.includes('INSERT_DUPLICATE')) {
      this.animateDuplicate(message);
    } else if (message.includes('REMOVE_NOT_FOUND')) {
      this.animateNotFound(message);
    }
  }
  
  /**
   * Handles log messages (tree structure data)
   * 
   * @param {string} message - Log message
   */
  handleLogMessage(message) {
    console.log('=== HANDLING LOG MESSAGE ===');
    console.log('Log message:', message);
    
    // Store previous tree state
    this.previousTree = this.currentTree ? this.cloneTree(this.currentTree) : null;
    console.log('Previous tree stored:', this.previousTree);
    
    // Parse the log to update tree structure
    console.log('Parsing log with parser:', this.currentParser);
    this.currentParser.parseLog(message);
    
    // Get updated tree
    this.currentTree = this.currentParser.getRoot();
    console.log('Current tree after parsing:', this.currentTree);
    
    // Animate the changes
    console.log('Calling animateTreeChanges...');
    this.animateTreeChanges();
    console.log('=== LOG MESSAGE HANDLED ===');
  }
  
  /**
   * Shows a caption message
   * 
   * @param {string} message - Message to show
   */
  showCaption(message) {
    console.log('showCaption called with:', message);
    console.log('captionElement:', this.captionElement);
    
    if (!this.captionElement) {
      console.error('Caption element not found!');
      return;
    }
    
    this.captionElement.textContent = message;
    
    // Make it more visible and add debugging - use fixed positioning
    this.captionElement.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 15px 25px;
      border-radius: 20px;
      font-size: 18px;
      font-weight: bold;
      z-index: 10000;
      opacity: 1;
      transition: opacity 0.3s ease;
      pointer-events: none;
      border: 3px solid yellow;
    `;
    
    console.log('Caption displayed with enhanced visibility:', message);
    console.log('Caption element computed styles:', window.getComputedStyle(this.captionElement));
    
    // Hide after duration
    setTimeout(() => {
      this.captionElement.style.opacity = '0';
      console.log('Caption hidden');
    }, this.captionDuration);
  }
  
  /**
   * Animates insert operation
   * 
   * @param {string} message - Insert message
   */
  animateInsert(message) {
    const valueMatch = message.match(/value=(\d+)/);
    if (valueMatch) {
      const value = valueMatch[1];
      this.showCaption(`Inserting ${value}...`);
    }
  }
  
  /**
   * Animates remove operation
   * 
   * @param {string} message - Remove message
   */
  animateRemove(message) {
    const valueMatch = message.match(/value=(\d+)/);
    if (valueMatch) {
      const value = valueMatch[1];
      this.showCaption(`Removing ${value}...`);
    }
  }
  
  /**
   * Animates find operation
   * 
   * @param {string} message - Find message
   */
  animateFind(message) {
    const valueMatch = message.match(/value=(\d+)/);
    const foundMatch = message.match(/found=(true|false)/);
    
    if (valueMatch && foundMatch) {
      const value = valueMatch[1];
      const found = foundMatch[1] === 'true';
      this.showCaption(`Searching for ${value}... ${found ? 'Found!' : 'Not found'}`);
    }
  }
  
  /**
   * Animates duplicate insert
   * 
   * @param {string} message - Duplicate message
   */
  animateDuplicate(message) {
    const valueMatch = message.match(/value=(\d+)/);
    if (valueMatch) {
      const value = valueMatch[1];
      this.showCaption(`Value ${value} already exists!`);
    }
  }
  
  /**
   * Animates not found
   * 
   * @param {string} message - Not found message
   */
  animateNotFound(message) {
    const valueMatch = message.match(/value=(\d+)/);
    if (valueMatch) {
      const value = valueMatch[1];
      this.showCaption(`Value ${value} not found!`);
    }
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
    console.log('=== RENDERING TREE ===');
    console.log('Rendering tree, current tree:', this.currentTree);
    
    // Clear existing tree
    console.log('Clearing existing tree...');
    this.clearTree();
    
    if (!this.currentTree) {
      console.log('No current tree to render - stopping');
      return;
    }
    
    // Calculate tree layout
    console.log('Calculating tree layout...');
    const layout = this.calculateTreeLayout();
    console.log('Tree layout calculated:', layout);
    
    // Render nodes
    console.log('Rendering nodes...');
    this.renderNodes(layout);
    
    // Render connections
    console.log('Rendering connections...');
    this.renderConnections(layout);
    
    console.log('=== TREE RENDERING COMPLETE ===');
  }
  
  /**
   * Calculates tree layout for visualization
   * 
   * @returns {Object} Layout information
   */
  calculateTreeLayout() {
    console.log('=== CALCULATING TREE LAYOUT ===');
    console.log('Tree type:', this.treeType);
    console.log('Current tree:', this.currentTree);
    
    let layout;
    if (this.treeType === 'btree') {
      layout = this.calculateBTreeLayout();
    } else {
      layout = this.calculateAVLLayout();
    }
    
    console.log('Layout calculated:', layout);
    return layout;
  }
  
  /**
   * Calculates B-Tree layout
   * 
   * @returns {Object} B-Tree layout
   */
  calculateBTreeLayout() {
    console.log('=== CALCULATING B-TREE LAYOUT ===');
    const nodes = [];
    const connections = [];
    
    if (this.currentTree) {
      console.log('Traversing B-Tree starting from root:', this.currentTree);
      this.traverseBTree(this.currentTree, 0, 0, nodes, connections);
    } else {
      console.log('❌ No current tree to layout');
    }
    
    console.log('B-Tree layout result:', { nodes: nodes.length, connections: connections.length });
    return { nodes, connections };
  }
  
  /**
   * Calculates AVL Tree layout
   * 
   * @returns {Object} AVL Tree layout
   */
  calculateAVLLayout() {
    console.log('=== CALCULATING AVL LAYOUT ===');
    const nodes = [];
    const connections = [];
    
    if (this.currentTree) {
      console.log('Traversing AVL Tree starting from root:', this.currentTree);
      this.traverseAVLTree(this.currentTree, 0, 0, nodes, connections);
    } else {
      console.log('❌ No current tree to layout');
    }
    
    console.log('AVL layout result:', { nodes: nodes.length, connections: connections.length });
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
    console.log(`🌲 Traversing B-Tree node at level ${level}, position ${position}:`, node);
    
    if (!node) {
      console.log('❌ Node is null/undefined');
      return;
    }
    
    const nodeInfo = {
      id: node.id,
      keys: node.keys,
      isLeaf: node.isLeaf,
      level: level,
      position: position,
      x: 0, // Will be calculated
      y: 0  // Will be calculated
    };
    
    console.log('✅ Adding node to layout:', nodeInfo);
    nodes.push(nodeInfo);
    
    // Traverse children
    if (!node.isLeaf && node.children) {
      console.log(`Node has ${node.children.length} children:`, node.children);
      node.children.forEach((childId, index) => {
        console.log(`  Processing child ${index}: ${childId}`);
        if (childId) {
          console.log('  Looking up child in parser nodeMap...');
          console.log('  Current parser:', this.currentParser);
          console.log('  Parser nodeMap size:', this.currentParser ? this.currentParser.nodeMap.size : 'N/A');
          
          const childNode = this.currentParser.nodeMap.get(childId);
          console.log('  Child node found:', childNode);
          
          if (childNode) {
            console.log('  ✅ Recursing into child node');
            this.traverseBTree(childNode, level + 1, position * 10 + index, nodes, connections);
            
            // Add connection
            connections.push({
              from: node.id,
              to: childId,
              childIndex: index
            });
            console.log('  ✅ Added connection:', { from: node.id, to: childId, childIndex: index });
          } else {
            console.log('  ❌ Child node not found in parser nodeMap');
          }
        } else {
          console.log('  ⚠️ Child ID is null/empty');
        }
      });
    } else {
      if (node.isLeaf) {
        console.log('Node is a leaf - no children to traverse');
      } else {
        console.log('Node has no children array');
      }
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
    console.log(`🌳 Traversing AVL node at level ${level}, position ${position}:`, node);
    
    if (!node) {
      console.log('❌ Node is null/undefined');
      return;
    }
    
    const nodeInfo = {
      id: node.id,
      data: node.data,
      level: level,
      position: position,
      x: 0, // Will be calculated
      y: 0  // Will be calculated
    };
    
    console.log('✅ Adding AVL node to layout:', nodeInfo);
    nodes.push(nodeInfo);
    
    // Traverse left child
    if (node.left) {
      console.log(`  Processing left child: ${node.left}`);
      const leftNode = this.currentParser.nodeMap.get(node.left);
      console.log('  Left node found:', leftNode);
      if (leftNode) {
        this.traverseAVLTree(leftNode, level + 1, position * 2, nodes, connections);
        connections.push({
          from: node.id,
          to: node.left,
          direction: 'left'
        });
        console.log('  ✅ Added left connection');
      } else {
        console.log('  ❌ Left child not found in parser nodeMap');
      }
    } else {
      console.log('  No left child');
    }
    
    // Traverse right child
    if (node.right) {
      console.log(`  Processing right child: ${node.right}`);
      const rightNode = this.currentParser.nodeMap.get(node.right);
      console.log('  Right node found:', rightNode);
      if (rightNode) {
        this.traverseAVLTree(rightNode, level + 1, position * 2 + 1, nodes, connections);
        connections.push({
          from: node.id,
          to: node.right,
          direction: 'right'
        });
        console.log('  ✅ Added right connection');
      } else {
        console.log('  ❌ Right child not found in parser nodeMap');
      }
    } else {
      console.log('  No right child');
    }
  }
  
  /**
   * Renders tree nodes
   * 
   * @param {Object} layout - Tree layout
   */
  renderNodes(layout) {
    console.log('=== RENDERING NODES ===');
    console.log('Layout nodes:', layout.nodes);
    console.log('Container dimensions:', this.container.clientWidth, 'x', this.container.clientHeight);
    
    if (!layout.nodes || layout.nodes.length === 0) {
      console.log('❌ No nodes to render!');
      return;
    }
    
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    
    // Calculate positions
    const maxLevel = Math.max(...layout.nodes.map(n => n.level));
    const levelHeight = containerHeight / (maxLevel + 2);
    
    console.log('Rendering', layout.nodes.length, 'nodes, maxLevel:', maxLevel, 'levelHeight:', levelHeight);
    
    layout.nodes.forEach((node, index) => {
      const x = (node.position + 1) * (containerWidth / (Math.pow(2, node.level) + 1));
      const y = (node.level + 1) * levelHeight;
      
      node.x = x;
      node.y = y;
      
      console.log(`Creating node ${index + 1}/${layout.nodes.length}:`, {
        id: node.id,
        keys: node.keys || node.data,
        position: { x, y },
        level: node.level
      });
      
      this.createNodeElement(node);
    });
    
    console.log('✅ All nodes rendered');
  }
  
  /**
   * Creates a node element
   * 
   * @param {Object} nodeInfo - Node information
   */
  createNodeElement(nodeInfo) {
    console.log('🔵 Creating node element for:', nodeInfo.id);
    
    const nodeElement = document.createElement('div');
    nodeElement.className = 'tree-node';
    nodeElement.dataset.nodeId = nodeInfo.id;
    
    let nodeText;
    if (this.treeType === 'btree') {
      nodeText = `[${nodeInfo.keys.join(', ')}]`;
    } else {
      nodeText = nodeInfo.data;
    }
    nodeElement.innerHTML = nodeText;
    
    const styles = `
      position: absolute;
      left: ${nodeInfo.x - 30}px;
      top: ${nodeInfo.y - 15}px;
      width: 60px;
      height: 30px;
      background: #3498db;
      color: white;
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      z-index: 10;
    `;
    
    nodeElement.style.cssText = styles;
    
    console.log('Node element created:', {
      id: nodeInfo.id,
      text: nodeText,
      position: { left: nodeInfo.x - 30, top: nodeInfo.y - 15 },
      styles: styles
    });
    
    console.log('Appending to container:', this.container);
    this.container.appendChild(nodeElement);
    this.nodeElements.set(nodeInfo.id, nodeElement);
    
    console.log('✅ Node element added to DOM. Container children count:', this.container.children.length);
    
    // Double-check the element is actually in the DOM
    const inDom = document.body.contains(nodeElement);
    console.log('Node element in DOM:', inDom);
    
    // Log the element's computed styles
    setTimeout(() => {
      const computedStyles = window.getComputedStyle(nodeElement);
      console.log('Node element computed styles:', {
        display: computedStyles.display,
        position: computedStyles.position,
        left: computedStyles.left,
        top: computedStyles.top,
        visibility: computedStyles.visibility,
        opacity: computedStyles.opacity
      });
    }, 100);
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
