/**
 * AVLTree.js
 * Manages a collection of AVLNode objects and their layout
 */
class AVLTree {
    constructor(svgElement) {
        this.svg = svgElement;
        this.nodes = new Map();
        this.edges = new Map();
        this.levelSeparation = 80;
        this.nodeSeparation = 60;
        this.centerX = 300; // Default center X coordinate
        this.startY = 100;  // Default starting Y coordinate
    }
    
    /**
     * Add a new node to the tree
     * @param {string} id - Unique identifier for the node
     * @param {string|null} parentId - ID of the parent node (null for root)
     * @param {*} value - Value to display in the node
     * @returns {AVLNode} The created node
     */
    addNode(id, parentId, value) {
        const node = new AVLNode(id, value, this.svg);
        this.nodes.set(id, node);
        
        if (parentId && this.nodes.has(parentId)) {
            this.addEdge(parentId, id);
        }
        
        return node;
    }
    
    /**
     * Remove a node from the tree
     * @param {string} id - ID of the node to remove
     * @returns {GSAPTimeline} Animation timeline for the removal
     */
    removeNode(id) {
        const node = this.nodes.get(id);
        if (node) {
            // Remove associated edges
            this.edges.forEach((edge, edgeId) => {
                if (edgeId.includes(id)) {
                    edge.remove();
                    this.edges.delete(edgeId);
                }
            });
            
            // Remove node
            const removeAnimation = node.remove();
            this.nodes.delete(id);
            
            return removeAnimation;
        }
        
        return gsap.timeline();
    }
    
    /**
     * Add an edge between two nodes
     * @param {string} fromId - ID of the parent node
     * @param {string} toId - ID of the child node
     * @private
     */
    addEdge(fromId, toId) {
        const edgeId = `${fromId}-${toId}`;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('edge');
        
        // Insert edge before nodes so it appears behind them
        this.svg.insertBefore(line, this.svg.firstChild);
        
        this.edges.set(edgeId, {
            element: line,
            from: fromId,
            to: toId,
            remove: () => {
                if (line.parentNode) {
                    line.parentNode.removeChild(line);
                }
            }
        });
    }
    
    /**
     * Remove an edge between two nodes
     * @param {string} fromId - ID of the parent node
     * @param {string} toId - ID of the child node
     */
    removeEdge(fromId, toId) {
        const edgeId = `${fromId}-${toId}`;
        const edge = this.edges.get(edgeId);
        if (edge) {
            edge.remove();
            this.edges.delete(edgeId);
        }
    }
    
    /**
     * Calculate positions for all nodes in the tree
     * @returns {Map} Map of node IDs to position objects {x, y}
     * @private
     */
    calculatePositions() {
        const positions = new Map();
        
        // Find root node(s)
        const rootIds = this.findRootNodes();
        
        if (rootIds.length === 0) return positions;
        
        // For simplicity, handle single root case
        const rootId = rootIds[0];
        
        // Calculate tree structure
        const treeStructure = this.buildTreeStructure(rootId);
        
        // Layout nodes using recursive positioning
        this.layoutSubtree(treeStructure, this.centerX, this.startY, positions, 0);
        
        return positions;
    }
    
    /**
     * Find all root nodes (nodes with no parents)
     * @returns {Array} Array of root node IDs
     * @private
     */
    findRootNodes() {
        const childNodes = new Set();
        
        // Collect all child nodes
        for (const [edgeId, edge] of this.edges) {
            childNodes.add(edge.to);
        }
        
        // Find nodes that are not children of any other node
        const rootIds = [];
        for (const nodeId of this.nodes.keys()) {
            if (!childNodes.has(nodeId)) {
                rootIds.push(nodeId);
            }
        }
        
        return rootIds;
    }
    
    /**
     * Build tree structure starting from root
     * @param {string} nodeId - ID of the node to build structure for
     * @param {Set} visited - Set of visited nodes to avoid cycles
     * @returns {Object} Tree structure object
     * @private
     */
    buildTreeStructure(nodeId, visited = new Set()) {
        if (visited.has(nodeId)) {
            return { id: nodeId, children: [] };
        }
        
        visited.add(nodeId);
        
        const children = [];
        for (const [edgeId, edge] of this.edges) {
            if (edge.from === nodeId) {
                children.push(this.buildTreeStructure(edge.to, visited));
            }
        }
        
        return { id: nodeId, children };
    }
    
    /**
     * Layout a subtree recursively
     * @param {Object} tree - Tree structure object
     * @param {number} x - X coordinate for root of subtree
     * @param {number} y - Y coordinate for root of subtree
     * @param {Map} positions - Map to store calculated positions
     * @param {number} level - Current tree level
     * @private
     */
    layoutSubtree(tree, x, y, positions, level) {
        positions.set(tree.id, { x, y });
        
        if (tree.children.length === 0) return;
        
        const childY = y + this.levelSeparation;
        const totalWidth = (tree.children.length - 1) * this.nodeSeparation;
        const startX = x - totalWidth / 2;
        
        tree.children.forEach((child, index) => {
            const childX = startX + index * this.nodeSeparation;
            this.layoutSubtree(child, childX, childY, positions, level + 1);
        });
    }
    
    /**
     * Update the layout and animate nodes to their new positions
     * @returns {Array} Array of animation promises
     */
    updateLayout() {
        const positions = this.calculatePositions();
        const animations = [];
        
        // Update node positions
        for (const [id, pos] of positions) {
            const node = this.nodes.get(id);
            if (node) {
                if (node.x === 0 && node.y === 0) {
                    // New node - appear at position
                    animations.push(node.appear(pos.x, pos.y));
                } else {
                    // Existing node - move to position
                    animations.push(node.move(pos.x, pos.y));
                }
            }
        }
        
        // Update edge positions after a short delay to ensure nodes are positioned
        setTimeout(() => {
            this.updateEdges(positions);
        }, 100);
        
        return animations;
    }
    
    /**
     * Update edge positions based on node positions
     * @param {Map} positions - Map of node positions
     * @private
     */
    updateEdges(positions) {
        for (const [edgeId, edge] of this.edges) {
            const fromPos = positions.get(edge.from);
            const toPos = positions.get(edge.to);
            
            if (fromPos && toPos) {
                // Calculate connection points on node circumference
                const dx = toPos.x - fromPos.x;
                const dy = toPos.y - fromPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const nodeRadius = 25; // AVLNode radius
                    const fromX = fromPos.x + (dx / distance) * nodeRadius;
                    const fromY = fromPos.y + (dy / distance) * nodeRadius;
                    const toX = toPos.x - (dx / distance) * nodeRadius;
                    const toY = toPos.y - (dy / distance) * nodeRadius;
                    
                    edge.element.setAttribute('x1', fromX);
                    edge.element.setAttribute('y1', fromY);
                    edge.element.setAttribute('x2', toX);
                    edge.element.setAttribute('y2', toY);
                }
            }
        }
    }
    
    /**
     * Get a node by its ID
     * @param {string} id - Node ID
     * @returns {AVLNode|null} The node or null if not found
     */
    getNode(id) {
        return this.nodes.get(id) || null;
    }
    
    /**
     * Get all nodes in the tree
     * @returns {Array} Array of all nodes
     */
    getAllNodes() {
        return Array.from(this.nodes.values());
    }
    
    /**
     * Check if the tree contains a node with the given ID
     * @param {string} id - Node ID to check
     * @returns {boolean} True if node exists
     */
    hasNode(id) {
        return this.nodes.has(id);
    }
    
    /**
     * Clear all nodes and edges from the tree
     */
    clear() {
        // Remove all nodes
        for (const [id, node] of this.nodes) {
            node.remove();
        }
        this.nodes.clear();
        
        // Remove all edges
        for (const [edgeId, edge] of this.edges) {
            edge.remove();
        }
        this.edges.clear();
    }
    
    /**
     * Set the center position for the tree layout
     * @param {number} x - Center X coordinate
     * @param {number} y - Starting Y coordinate
     */
    setCenter(x, y) {
        this.centerX = x;
        this.startY = y;
    }
    
    /**
     * Set spacing parameters for the tree layout
     * @param {number} levelSeparation - Vertical spacing between levels
     * @param {number} nodeSeparation - Horizontal spacing between sibling nodes
     */
    setSpacing(levelSeparation, nodeSeparation) {
        this.levelSeparation = levelSeparation;
        this.nodeSeparation = nodeSeparation;
    }
    
    /**
     * Animate a rotation operation by highlighting affected nodes
     * @param {Array} nodeIds - Array of node IDs involved in the rotation
     * @returns {GSAPTimeline} Animation timeline
     */
    animateRotation(nodeIds) {
        const tl = gsap.timeline();
        
        // First update layout
        const layoutAnimations = this.updateLayout();
        
        // Then highlight nodes in sequence
        nodeIds.forEach((nodeId, index) => {
            const node = this.getNode(nodeId);
            if (node) {
                tl.add(node.highlight(), index * 0.2 + 0.7);
            }
        });
        
        return tl;
    }
}