/**
 * TreeModel.js - Maintains internal B-Tree representation based on log entries
 * 
 * This module is responsible for:
 * - Maintaining a dummy B-Tree structure that mirrors the logged operations
 * - Processing log entries and updating the internal tree state
 * - Providing tree statistics and current state information
 * - Generating change events for the animator when tree structure changes
 * 
 * The TreeModel doesn't perform actual B-Tree operations, but rather reconstructs
 * the tree state from the logged operations and structural changes.
 */

export class TreeModel {
    constructor() {
        this.reset();
    }

    /**
     * Reset the tree to initial empty state
     */
    reset() {
        this.order = 0;
        this.rootId = null;
        this.nodes = new Map(); // Map of nodeId -> TreeNode
        this.activeNodes = new Set(); // Nodes currently involved in operations
        this.highlightedNodes = new Set(); // Nodes to highlight (search results, etc.)
        this.lastOperation = null;
        this.operationContext = null;
    }

    /**
     * Process a single log entry and update tree state
     * @param {Object} logEntry - Parsed log entry from LogProcessor
     * @returns {Array<Object>} Array of change objects for animation
     */
    processLogEntry(logEntry) {
        const changes = [];
        
        switch (logEntry.type) {
            case 'treeInit':
                changes.push(...this.handleTreeInit(logEntry));
                break;
                
            case 'treeInsert':
                changes.push(...this.handleTreeInsert(logEntry));
                break;
                
            case 'treeRemove':
                changes.push(...this.handleTreeRemove(logEntry));
                break;
                
            case 'treeFind':
                changes.push(...this.handleTreeFind(logEntry));
                break;
                
            case 'nodeState':
                changes.push(...this.handleNodeState(logEntry));
                break;
                
            case 'splitResult':
                changes.push(...this.handleSplitResult(logEntry));
                break;
                
            case 'splitKeys':
                changes.push(...this.handleSplitKeys(logEntry));
                break;
                
            case 'mergeResult':
                changes.push(...this.handleMergeResult(logEntry));
                break;
                
            case 'borrowFromLeft':
            case 'borrowFromRight':
                changes.push(...this.handleBorrowOperation(logEntry));
                break;
                
            case 'treeInsertComplete':
            case 'treeRemoveComplete':
                changes.push(...this.handleOperationComplete(logEntry));
                break;
                
            case 'treeFindResult':
                changes.push(...this.handleFindResult(logEntry));
                break;
                
            default:
                // Log unhandled entry types for debugging
                console.log(`Unhandled log entry type: ${logEntry.type}`);
                break;
        }

        this.lastOperation = logEntry;
        return changes;
    }

    /**
     * Handle tree initialization
     */
    handleTreeInit(logEntry) {
        this.order = logEntry.order;
        this.rootId = logEntry.root;
        
        if (this.rootId) {
            this.ensureNodeExists(this.rootId, true); // Initial root is typically a leaf
        }
        
        return [{
            type: 'tree_init',
            order: this.order,
            rootId: this.rootId
        }];
    }

    /**
     * Handle tree insertion start
     */
    handleTreeInsert(logEntry) {
        this.operationContext = {
            type: 'insert',
            value: logEntry.value,
            startTime: Date.now()
        };
        
        this.activeNodes.clear();
        this.highlightedNodes.clear();
        
        return [{
            type: 'operation_start',
            operation: 'insert',
            value: logEntry.value,
            rootId: logEntry.root
        }];
    }

    /**
     * Handle tree removal start
     */
    handleTreeRemove(logEntry) {
        this.operationContext = {
            type: 'remove',
            value: logEntry.value,
            startTime: Date.now()
        };
        
        this.activeNodes.clear();
        this.highlightedNodes.clear();
        
        return [{
            type: 'operation_start',
            operation: 'remove',
            value: logEntry.value,
            rootId: logEntry.root
        }];
    }

    /**
     * Handle tree search start
     */
    handleTreeFind(logEntry) {
        this.operationContext = {
            type: 'find',
            value: logEntry.value,
            startTime: Date.now()
        };
        
        this.activeNodes.clear();
        this.highlightedNodes.clear();
        
        return [{
            type: 'operation_start',
            operation: 'find',
            value: logEntry.value,
            rootId: logEntry.root
        }];
    }

    /**
     * Handle node state updates
     */
    handleNodeState(logEntry) {
        const nodeId = logEntry.node;
        if (!nodeId) return [];

        this.ensureNodeExists(nodeId, logEntry.isLeaf);
        const node = this.nodes.get(nodeId);
        
        // Update node properties
        const oldKeys = [...node.keys];
        const oldChildren = [...node.children];
        
        node.isLeaf = logEntry.isLeaf;
        node.keys = [...logEntry.keys];
        node.children = logEntry.children ? [...logEntry.children] : [];
        
        // Ensure all child nodes exist
        for (const childId of node.children) {
            if (childId) {
                this.ensureNodeExists(childId, true); // We'll update leaf status later
            }
        }
        
        // Determine the type of change based on context
        let changeType = 'node_update';
        if (logEntry.context) {
            const context = logEntry.context.toLowerCase();
            if (context.includes('split')) {
                changeType = 'node_split';
                this.activeNodes.add(nodeId);
            } else if (context.includes('merge')) {
                changeType = 'node_merge';
                this.activeNodes.add(nodeId);
            } else if (context.includes('borrow')) {
                changeType = 'node_borrow';
                this.activeNodes.add(nodeId);
            }
        }
        
        return [{
            type: changeType,
            nodeId: nodeId,
            oldKeys: oldKeys,
            newKeys: node.keys,
            oldChildren: oldChildren,
            newChildren: node.children,
            isLeaf: node.isLeaf,
            context: logEntry.context
        }];
    }

    /**
     * Handle split operation result
     */
    handleSplitResult(logEntry) {
        const originalNodeId = logEntry.originalNode;
        const newSiblingId = logEntry.newSibling;
        const midVal = logEntry.midVal;
        
        if (originalNodeId) this.ensureNodeExists(originalNodeId);
        if (newSiblingId) this.ensureNodeExists(newSiblingId);
        
        this.activeNodes.add(originalNodeId);
        this.activeNodes.add(newSiblingId);
        
        return [{
            type: 'split_complete',
            originalNodeId: originalNodeId,
            newSiblingId: newSiblingId,
            midVal: midVal
        }];
    }

    /**
     * Handle split keys update
     */
    handleSplitKeys(logEntry) {
        const originalNodeId = logEntry.originalNode;
        const newSiblingId = logEntry.newSibling;
        
        if (originalNodeId && this.nodes.has(originalNodeId)) {
            this.nodes.get(originalNodeId).keys = [...logEntry.originalKeys];
        }
        
        if (newSiblingId) {
            this.ensureNodeExists(newSiblingId);
            this.nodes.get(newSiblingId).keys = [...logEntry.newKeys];
        }
        
        return [{
            type: 'keys_redistributed',
            originalNodeId: originalNodeId,
            newSiblingId: newSiblingId,
            originalKeys: logEntry.originalKeys,
            newKeys: logEntry.newKeys
        }];
    }

    /**
     * Handle merge operation result
     */
    handleMergeResult(logEntry) {
        const mergedNodeId = logEntry.mergedNode;
        const deletedNodeId = logEntry.deletedNode;
        
        // Remove the deleted node
        if (deletedNodeId && this.nodes.has(deletedNodeId)) {
            this.nodes.delete(deletedNodeId);
        }
        
        this.activeNodes.add(mergedNodeId);
        this.activeNodes.delete(deletedNodeId);
        
        return [{
            type: 'nodes_merged',
            mergedNodeId: mergedNodeId,
            deletedNodeId: deletedNodeId
        }];
    }

    /**
     * Handle borrow operations
     */
    handleBorrowOperation(logEntry) {
        const isFromLeft = logEntry.type === 'borrowFromLeft';
        const sourceNodeId = isFromLeft ? logEntry.leftNode : logEntry.rightNode;
        const targetNodeId = isFromLeft ? logEntry.rightNode : logEntry.leftNode;
        const parentNodeId = logEntry.parent;
        
        this.activeNodes.add(sourceNodeId);
        this.activeNodes.add(targetNodeId);
        this.activeNodes.add(parentNodeId);
        
        return [{
            type: 'key_borrowed',
            direction: isFromLeft ? 'from_left' : 'from_right',
            sourceNodeId: sourceNodeId,
            targetNodeId: targetNodeId,
            parentNodeId: parentNodeId,
            borrowedKey: logEntry.borrowedKey,
            parentKey: logEntry.parentKey
        }];
    }

    /**
     * Handle operation completion
     */
    handleOperationComplete(logEntry) {
        this.rootId = logEntry.root;
        this.operationContext = null;
        
        // Clear active states after a delay to allow animation to complete
        setTimeout(() => {
            this.activeNodes.clear();
            this.highlightedNodes.clear();
        }, 1000);
        
        return [{
            type: 'operation_complete',
            operation: logEntry.type.includes('INSERT') ? 'insert' : 'remove',
            value: logEntry.value,
            newRootId: this.rootId
        }];
    }

    /**
     * Handle find operation result
     */
    handleFindResult(logEntry) {
        this.operationContext = null;
        
        if (logEntry.found) {
            // Find and highlight the node containing the value
            for (const [nodeId, node] of this.nodes.entries()) {
                if (node.keys.includes(logEntry.value)) {
                    this.highlightedNodes.add(nodeId);
                    break;
                }
            }
        }
        
        return [{
            type: 'find_complete',
            value: logEntry.value,
            found: logEntry.found
        }];
    }

    /**
     * Ensure a node exists in the tree model
     * @param {string} nodeId - Node identifier
     * @param {boolean} isLeaf - Whether the node is a leaf (default true)
     */
    ensureNodeExists(nodeId, isLeaf = true) {
        if (!nodeId || this.nodes.has(nodeId)) {
            return;
        }
        
        this.nodes.set(nodeId, new TreeNode(nodeId, isLeaf));
    }

    /**
     * Get current tree statistics
     * @returns {Object} Tree statistics
     */
    getStats() {
        return {
            order: this.order,
            nodeCount: this.nodes.size,
            height: this.calculateHeight(),
            rootId: this.rootId,
            activeNodeCount: this.activeNodes.size
        };
    }

    /**
     * Calculate tree height
     * @returns {number} Height of the tree
     */
    calculateHeight() {
        if (!this.rootId || !this.nodes.has(this.rootId)) {
            return 0;
        }
        
        return this.calculateNodeHeight(this.rootId);
    }

    /**
     * Calculate height of a subtree rooted at given node
     * @param {string} nodeId - Root node of subtree
     * @returns {number} Height of subtree
     */
    calculateNodeHeight(nodeId) {
        if (!nodeId || !this.nodes.has(nodeId)) {
            return 0;
        }
        
        const node = this.nodes.get(nodeId);
        if (node.isLeaf || node.children.length === 0) {
            return 1;
        }
        
        let maxChildHeight = 0;
        for (const childId of node.children) {
            if (childId) {
                const childHeight = this.calculateNodeHeight(childId);
                maxChildHeight = Math.max(maxChildHeight, childHeight);
            }
        }
        
        return 1 + maxChildHeight;
    }

    /**
     * Get all nodes in level order
     * @returns {Array<TreeNode>} Nodes in level order
     */
    getNodesInLevelOrder() {
        if (!this.rootId || !this.nodes.has(this.rootId)) {
            return [];
        }
        
        const result = [];
        const queue = [{ nodeId: this.rootId, level: 0 }];
        
        while (queue.length > 0) {
            const { nodeId, level } = queue.shift();
            const node = this.nodes.get(nodeId);
            
            if (node) {
                result.push({ node, level, nodeId });
                
                // Add children to queue
                for (const childId of node.children) {
                    if (childId && this.nodes.has(childId)) {
                        queue.push({ nodeId: childId, level: level + 1 });
                    }
                }
            }
        }
        
        return result;
    }

    /**
     * Check if a node is currently active (involved in an operation)
     * @param {string} nodeId - Node identifier
     * @returns {boolean} True if node is active
     */
    isNodeActive(nodeId) {
        return this.activeNodes.has(nodeId);
    }

    /**
     * Check if a node is currently highlighted (search result, etc.)
     * @param {string} nodeId - Node identifier
     * @returns {boolean} True if node is highlighted
     */
    isNodeHighlighted(nodeId) {
        return this.highlightedNodes.has(nodeId);
    }

    /**
     * Get the current operation context
     * @returns {Object|null} Current operation context
     */
    getCurrentOperation() {
        return this.operationContext;
    }

    /**
     * Get a node by ID
     * @param {string} nodeId - Node identifier
     * @returns {TreeNode|null} Node object or null if not found
     */
    getNode(nodeId) {
        return this.nodes.get(nodeId) || null;
    }

    /**
     * Get all node IDs
     * @returns {Array<string>} Array of all node IDs
     */
    getAllNodeIds() {
        return Array.from(this.nodes.keys());
    }

    /**
     * Check if tree is empty
     * @returns {boolean} True if tree is empty
     */
    isEmpty() {
        return this.nodes.size === 0 || !this.rootId;
    }
}

/**
 * TreeNode class represents a single node in the B-Tree
 */
class TreeNode {
    constructor(id, isLeaf = true) {
        this.id = id;
        this.isLeaf = isLeaf;
        this.keys = [];
        this.children = [];
        
        // Animation properties
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.width = 0;
        this.height = 0;
        
        // Visual state
        this.isAnimating = false;
        this.opacity = 1.0;
        this.scale = 1.0;
        this.rotation = 0;
        
        // Timing
        this.createdAt = Date.now();
        this.lastUpdated = Date.now();
    }

    /**
     * Update node position with animation target
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     */
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.isAnimating = true;
    }

    /**
     * Update current position (for animation interpolation)
     * @param {number} x - Current X coordinate
     * @param {number} y - Current Y coordinate
     */
    updatePosition(x, y) {
        this.x = x;
        this.y = y;
        
        // Check if we've reached the target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 1) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.isAnimating = false;
        }
    }

    /**
     * Get node bounds for collision detection and layout
     * @returns {Object} Bounds object with x, y, width, height
     */
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Check if this node contains a specific key
     * @param {number} key - Key to search for
     * @returns {boolean} True if key is found in this node
     */
    containsKey(key) {
        return this.keys.includes(key);
    }

    /**
     * Get a string representation of the node
     * @returns {string} String representation
     */
    toString() {
        return `Node(${this.id}): [${this.keys.join(', ')}] ${this.isLeaf ? '(leaf)' : '(internal)'}`;
    }
}

export default TreeModel;