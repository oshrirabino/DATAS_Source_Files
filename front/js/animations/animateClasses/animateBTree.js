/**
 * BTree.js
 * Manages a collection of BTreeNode objects and their layout
 */
class BTree {
    constructor(svgElement) {
        this.svg = svgElement;
        this.nodes = new Map();
        this.edges = new Map();
        this.levelSeparation = 100;
        this.nodeSeparation = 120;
        this.centerX = 300; // Default center X coordinate
        this.startY = 80;   // Default starting Y coordinate
    }
    
    /**
     * Add a new node to the tree
     * @param {string} id - Unique identifier for the node
     * @param {string|null} parentId - ID of the parent node (null for root)
     * @param {Array} keysArray - Array of keys for the node
     * @returns {BTreeNode} The created node
     */
    addNode(id, parentId, keysArray) {
        const node = new BTreeNode(id, keysArray, this.svg);
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
                edge.element.setAttribute('x1', fromPos.x);
                edge.element.setAttribute('y1', fromPos.y + 15); // Adjust for node height
                edge.element.setAttribute('x2', toPos.x);
                edge.element.setAttribute('y2', toPos.y - 15); // Adjust for node height
            }
        }
    }
    
    /**
     * Insert a key into a specific node
     * @param {string} nodeId - ID of the node to insert into
     * @param {*} key - Key to insert
     * @param {number} position - Position to insert at
     * @returns {GSAPTimeline} Animation timeline
     */
    insertKey(nodeId, key, position) {
        const node = this.nodes.get(nodeId);
        if (node) {
            return node.addKey(key, position);
        }
        return gsap.timeline();
    }
    
    /**
     * Remove a key from a specific node
     * @param {string} nodeId - ID of the node to remove from
     * @param {*} key - Key to remove
     * @returns {GSAPTimeline} Animation timeline
     */
    removeKey(nodeId, key) {
        const node = this.nodes.get(nodeId);
        if (node) {
            return node.removeKey(key);
        }
        return gsap.timeline();
    }
    
    /**
     * Animate a node split operation
     * @param {string} nodeId - ID of the node to split
     * @param {Object} splitSpec - Specification for the split
     * @param {string} splitSpec.leftNodeId - ID for the left resulting node
     * @param {string} splitSpec.rightNodeId - ID for the right resulting node
     * @param {Array} splitSpec.leftKeys - Keys for the left node
     * @param {Array} splitSpec.rightKeys - Keys for the right node
     * @param {string} splitSpec.parentId - ID of the parent node
     * @param {*} splitSpec.promotedKey - Key promoted to parent
     * @returns {GSAPTimeline} Animation timeline
     */
    animateSplit(nodeId, splitSpec) {
        const tl = gsap.timeline();
        const originalNode = this.nodes.get(nodeId);
        
        if (originalNode) {
            // Animate original node splitting
            tl.add(originalNode.splitNode(splitSpec));
            
            // Create new nodes after a delay
            tl.call(() => {
                // Create left node
                const leftNode = this.addNode(splitSpec.leftNodeId, splitSpec.parentId, splitSpec.leftKeys);
                const rightNode = this.addNode(splitSpec.rightNodeId, splitSpec.parentId, splitSpec.rightKeys);
                
                // Position them appropriately
                const positions = this.calculatePositions();
                const leftPos = positions.get(splitSpec.leftNodeId);
                const rightPos = positions.get(splitSpec.rightNodeId);
                
                if (leftPos) leftNode.appear(leftPos.x, leftPos.y);
                if (rightPos) rightNode.appear(rightPos.x, rightPos.y);
                
                // Remove original node from our tracking
                this.nodes.delete(nodeId);
            }, null, 0.4);
            
            // Update layout
            tl.call(() => {
                this.updateLayout();
            }, null, 0.8);
        }
        
        return tl;
    }
    
    /**
     * Animate a node merge operation
     * @param {string} nodeId1 - ID of the first node to merge
     * @param {string} nodeId2 - ID of the second node to merge
     * @param {Object} mergeSpec - Specification for the merge
     * @param {string} mergeSpec.resultNodeId - ID for the resulting merged node
     * @param {Array} mergeSpec.keys - Keys for the merged node
     * @returns {GSAPTimeline} Animation timeline
     */
    animateMerge(nodeId1, nodeId2, mergeSpec) {
        const node1 = this.nodes.get(nodeId1);
        const node2 = this.nodes.get(nodeId2);
        
        if (node1 && node2) {
            const tl = gsap.timeline();
            
            // Animate merge
            tl.add(node1.mergeNodes(node2, mergeSpec));
            
            // Clean up second node
            tl.call(() => {
                this.nodes.delete(nodeId2);
                if (mergeSpec.resultNodeId !== nodeId1) {
                    // If result has a different ID, update our tracking
                    this.nodes.delete(nodeId1);
                    this.nodes.set(mergeSpec.resultNodeId, node1);
                }
            }, null, 0.8);
            
            // Update layout
            tl.call(() => {
                this.updateLayout();
            }, null, 1.0);
            
            return tl;
        }
        
        return gsap.timeline();
    }
    
    /**
     * Get a node by its ID
     * @param {string} id - Node ID
     * @returns {BTreeNode|null} The node or null if not found
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
}