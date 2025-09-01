/**
 * Animator.js - Handles B-Tree visualization and animation
 * 
 * This module is responsible for:
 * - Rendering the B-Tree structure on HTML5 Canvas
 * - Animating structural changes (splits, merges, insertions, deletions)
 * - Managing node layout and positioning to avoid overlaps
 * - Providing smooth animations for tree operations
 * - Highlighting active nodes and search results
 */

export class Animator {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.treeModel = null;
        
        // Animation settings
        this.animationSpeed = 1.0;
        this.frameRate = 60;
        this.isAnimating = false;
        this.animationQueue = [];
        
        // Layout settings
        this.nodeWidth = 120;
        this.nodeHeight = 40;
        this.levelHeight = 80;
        this.nodeSpacing = 20;
        this.marginX = 50;
        this.marginY = 50;
        
        // Visual styling
        this.colors = {
            leafNode: '#2ecc71',
            internalNode: '#3498db', 
            activeNode: '#e74c3c',
            highlightedNode: '#f39c12',
            text: '#2c3e50',
            border: '#34495e',
            connection: '#7f8c8d',
            background: '#ffffff'
        };
        
        // Animation state
        this.nodePositions = new Map();
        this.animationStartTime = 0;
        this.currentAnimation = null;
        
        // Layout cache
        this.layoutCache = new Map();
        this.lastLayoutUpdate = 0;
        
        this.startAnimationLoop();
    }

    /**
     * Set the tree model to visualize
     * @param {TreeModel} treeModel - Tree model instance
     */
    setTreeModel(treeModel) {
        this.treeModel = treeModel;
        this.recalculateLayout();
    }

    /**
     * Resize the canvas and recalculate layout
     * @param {number} width - New canvas width
     * @param {number} height - New canvas height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.recalculateLayout();
    }

    /**
     * Queue animation changes from tree model updates
     * @param {Array<Object>} changes - Array of change objects
     */
    animateChanges(changes) {
        for (const change of changes) {
            this.animationQueue.push({
                ...change,
                timestamp: Date.now(),
                duration: this.calculateAnimationDuration(change)
            });
        }
        
        if (!this.isAnimating) {
            this.processAnimationQueue();
        }
    }

    /**
     * Calculate animation duration based on change type
     * @param {Object} change - Change object
     * @returns {number} Duration in milliseconds
     */
    calculateAnimationDuration(change) {
        const baseDuration = 800 / this.animationSpeed;
        
        switch (change.type) {
            case 'tree_init':
                return 500 / this.animationSpeed;
            case 'operation_start':
                return 300 / this.animationSpeed;
            case 'node_split':
                return baseDuration * 1.5;
            case 'nodes_merged':
                return baseDuration * 1.2;
            case 'key_borrowed':
                return baseDuration;
            case 'operation_complete':
                return 200 / this.animationSpeed;
            default:
                return baseDuration;
        }
    }

    /**
     * Process the animation queue
     */
    async processAnimationQueue() {
        if (this.animationQueue.length === 0) {
            this.isAnimating = false;
            return;
        }
        
        this.isAnimating = true;
        const change = this.animationQueue.shift();
        
        await this.executeAnimation(change);
        
        // Continue processing queue
        setTimeout(() => {
            this.processAnimationQueue();
        }, 50); // Small delay between animations
    }

    /**
     * Execute a single animation
     * @param {Object} change - Change object to animate
     */
    async executeAnimation(change) {
        this.currentAnimation = change;
        this.animationStartTime = Date.now();
        
        // Recalculate layout before animation
        this.recalculateLayout();
        
        switch (change.type) {
            case 'tree_init':
                await this.animateTreeInit(change);
                break;
            case 'operation_start':
                await this.animateOperationStart(change);
                break;
            case 'node_split':
                await this.animateNodeSplit(change);
                break;
            case 'nodes_merged':
                await this.animateNodeMerge(change);
                break;
            case 'key_borrowed':
                await this.animateKeyBorrow(change);
                break;
            case 'operation_complete':
                await this.animateOperationComplete(change);
                break;
            default:
                await this.animateGenericChange(change);
                break;
        }
        
        this.currentAnimation = null;
    }

    /**
     * Animate tree initialization
     */
    async animateTreeInit(change) {
        return new Promise(resolve => {
            setTimeout(resolve, change.duration);
        });
    }

    /**
     * Animate operation start (highlight relevant nodes)
     */
    async animateOperationStart(change) {
        return new Promise(resolve => {
            // Add pulsing effect to root or relevant nodes
            this.highlightOperation(change.operation, change.value);
            setTimeout(resolve, change.duration);
        });
    }

    /**
     * Animate node split
     */
    async animateNodeSplit(change) {
        return new Promise(resolve => {
            const duration = change.duration;
            const startTime = Date.now();
            
            const animateFrame = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                if (progress < 1) {
                    // Continue animation
                    requestAnimationFrame(animateFrame);
                } else {
                    resolve();
                }
            };
            
            animateFrame();
        });
    }

    /**
     * Animate node merge
     */
    async animateNodeMerge(change) {
        return new Promise(resolve => {
            const duration = change.duration;
            const startTime = Date.now();
            
            const animateFrame = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    resolve();
                }
            };
            
            animateFrame();
        });
    }

    /**
     * Animate key borrowing between nodes
     */
    async animateKeyBorrow(change) {
        return new Promise(resolve => {
            const duration = change.duration;
            let startTime = Date.now();
            
            const animateFrame = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    resolve();
                }
            };
            
            animateFrame();
        });
    }

    /**
     * Animate operation completion
     */
    async animateOperationComplete(change) {
        return new Promise(resolve => {
            // Clear highlights and active states
            setTimeout(resolve, change.duration);
        });
    }

    /**
     * Generic animation for unspecified changes
     */
    async animateGenericChange(change) {
        return new Promise(resolve => {
            setTimeout(resolve, change.duration);
        });
    }

    /**
     * Highlight nodes related to current operation
     * @param {string} operation - Operation type
     * @param {number} value - Value being operated on
     */
    highlightOperation(operation, value) {
        if (!this.treeModel) return;
        
        // Find path to value or insertion point
        const path = this.findPathToValue(value);
        
        // Animate highlighting along the path
        path.forEach((nodeId, index) => {
            setTimeout(() => {
                // Add temporary highlight class or effect
            }, index * 200);
        });
    }

    /**
     * Find path to a value in the tree
     * @param {number} value - Value to find
     * @returns {Array<string>} Array of node IDs in path
     */
    findPathToValue(value) {
        if (!this.treeModel || !this.treeModel.rootId) {
            return [];
        }
        
        const path = [];
        this.findPathRecursive(this.treeModel.rootId, value, path);
        return path;
    }

    /**
     * Recursive helper for finding path to value
     * @param {string} nodeId - Current node ID
     * @param {number} value - Target value
     * @param {Array<string>} path - Current path
     * @returns {boolean} True if value found in this subtree
     */
    findPathRecursive(nodeId, value, path) {
        if (!nodeId || !this.treeModel.getNode(nodeId)) {
            return false;
        }
        
        path.push(nodeId);
        const node = this.treeModel.getNode(nodeId);
        
        // Check if value is in this node
        if (node.keys.includes(value)) {
            return true;
        }
        
        // If leaf, value not found
        if (node.isLeaf) {
            path.pop();
            return false;
        }
        
        // Find correct child to search
        let childIndex = 0;
        while (childIndex < node.keys.length && value > node.keys[childIndex]) {
            childIndex++;
        }
        
        if (childIndex < node.children.length) {
            const childId = node.children[childIndex];
            if (this.findPathRecursive(childId, value, path)) {
                return true;
            }
        }
        
        path.pop();
        return false;
    }

    /**
     * Recalculate layout positions for all nodes
     */
    recalculateLayout() {
        if (!this.treeModel || this.treeModel.isEmpty()) {
            return;
        }
        
        const layoutStart = Date.now();
        
        // Get nodes in level order
        const levelNodes = this.treeModel.getNodesInLevelOrder();
        
        // Group nodes by level
        const levels = new Map();
        for (const { node, level, nodeId } of levelNodes) {
            if (!levels.has(level)) {
                levels.set(level, []);
            }
            levels.get(level).push({ node, nodeId });
        }
        
        // Calculate positions level by level
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        for (const [level, nodesInLevel] of levels.entries()) {
            const y = this.marginY + (level * this.levelHeight);
            const totalWidth = nodesInLevel.length * this.nodeWidth + 
                              (nodesInLevel.length - 1) * this.nodeSpacing;
            const startX = (canvasWidth - totalWidth) / 2;
            
            nodesInLevel.forEach((nodeInfo, index) => {
                const x = startX + (index * (this.nodeWidth + this.nodeSpacing)) + (this.nodeWidth / 2);
                const nodeId = nodeInfo.nodeId;
                const node = nodeInfo.node;
                
                // Update node position
                if (!this.nodePositions.has(nodeId)) {
                    this.nodePositions.set(nodeId, { x, y });
                }
                
                const position = this.nodePositions.get(nodeId);
                node.setTarget(x, y);
                
                // Store layout info
                node.width = this.nodeWidth;
                node.height = this.nodeHeight;
            });
        }
        
        this.lastLayoutUpdate = Date.now();
        
        console.log(`Layout recalculated in ${Date.now() - layoutStart}ms for ${levelNodes.length} nodes`);
    }

    /**
     * Main render method - draws the entire tree
     */
    render() {
        if (!this.treeModel) {
            this.clearCanvas();
            return;
        }
        
        this.clearCanvas();
        
        if (this.treeModel.isEmpty()) {
            this.drawEmptyTreeMessage();
            return;
        }
        
        // Update node positions for smooth animation
        this.updateNodePositions();
        
        // Draw connections first (so they appear behind nodes)
        this.drawConnections();
        
        // Draw nodes
        this.drawNodes();
        
        // Draw operation indicators
        this.drawOperationIndicators();
    }

    /**
     * Clear the canvas
     */
    clearCanvas() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw message when tree is empty
     */
    drawEmptyTreeMessage() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Empty B-Tree', centerX, centerY);
    }

    /**
     * Update node positions for smooth animation
     */
    updateNodePositions() {
        for (const nodeId of this.treeModel.getAllNodeIds()) {
            const node = this.treeModel.getNode(nodeId);
            if (node && node.isAnimating) {
                // Interpolate position
                const dx = node.targetX - node.x;
                const dy = node.targetY - node.y;
                const speed = 0.1 * this.animationSpeed;
                
                node.updatePosition(
                    node.x + dx * speed,
                    node.y + dy * speed
                );
            }
        }
    }

    /**
     * Draw connections between nodes
     */
    drawConnections() {
        for (const nodeId of this.treeModel.getAllNodeIds()) {
            const node = this.treeModel.getNode(nodeId);
            if (!node || node.isLeaf || node.children.length === 0) {
                continue;
            }
            
            // Draw lines to each child
            for (const childId of node.children) {
                if (childId) {
                    const childNode = this.treeModel.getNode(childId);
                    if (childNode) {
                        this.drawConnection(node, childNode);
                    }
                }
            }
        }
    }

    /**
     * Draw a connection line between parent and child nodes
     * @param {TreeNode} parent - Parent node
     * @param {TreeNode} child - Child node
     */
    drawConnection(parent, child) {
        this.ctx.strokeStyle = this.colors.connection;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(parent.x, parent.y + parent.height / 2);
        this.ctx.lineTo(child.x, child.y - child.height / 2);
        this.ctx.stroke();
    }

    /**
     * Draw all nodes
     */
    drawNodes() {
        // Draw nodes in reverse level order so parent nodes appear on top
        const levelNodes = this.treeModel.getNodesInLevelOrder().reverse();
        
        for (const { node, nodeId } of levelNodes) {
            this.drawNode(node, nodeId);
        }
    }

    /**
     * Draw a single node
     * @param {TreeNode} node - Node to draw
     * @param {string} nodeId - Node identifier
     */
    drawNode(node, nodeId) {
        const x = node.x;
        const y = node.y;
        const width = node.width;
        const height = node.height;
        
        // Determine node color based on state
        let fillColor = node.isLeaf ? this.colors.leafNode : this.colors.internalNode;
        
        if (this.treeModel.isNodeActive(nodeId)) {
            fillColor = this.colors.activeNode;
        } else if (this.treeModel.isNodeHighlighted(nodeId)) {
            fillColor = this.colors.highlightedNode;
        }
        
        // Apply opacity and scale for animations
        this.ctx.save();
        this.ctx.globalAlpha = node.opacity;
        
        const centerX = x;
        const centerY = y;
        
        // Draw node background
        this.ctx.fillStyle = fillColor;
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 2;
        
        const radius = 8;
        this.roundRect(
            centerX - width / 2,
            centerY - height / 2,
            width,
            height,
            radius
        );
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw keys
        this.drawNodeKeys(node, centerX, centerY);
        
        // Draw node address (for debugging)
        if (this.showNodeAddresses) {
            this.drawNodeAddress(nodeId, centerX, centerY + height / 2 + 15);
        }
        
        this.ctx.restore();
    }

    /**
     * Draw keys inside a node
     * @param {TreeNode} node - Node containing keys
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     */
    drawNodeKeys(node, centerX, centerY) {
        if (node.keys.length === 0) {
            return;
        }
        
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const keyText = node.keys.join(', ');
        
        // Handle long key lists by truncating or using smaller font
        if (keyText.length > 12) {
            this.ctx.font = 'bold 12px Arial';
        }
        if (keyText.length > 20) {
            const truncated = node.keys.length > 3 
                ? `${node.keys.slice(0, 3).join(', ')}...`
                : keyText.substring(0, 17) + '...';
            this.ctx.fillText(truncated, centerX, centerY);
        } else {
            this.ctx.fillText(keyText, centerX, centerY);
        }
    }

    /**
     * Draw node address for debugging
     * @param {string} nodeId - Node identifier
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    drawNodeAddress(nodeId, x, y) {
        this.ctx.fillStyle = '#999';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        // Show last few characters of address
        const shortId = nodeId.length > 8 ? `...${nodeId.slice(-6)}` : nodeId;
        this.ctx.fillText(shortId, x, y);
    }

    /**
     * Draw operation indicators and animations
     */
    drawOperationIndicators() {
        const currentOp = this.treeModel.getCurrentOperation();
        if (!currentOp) {
            return;
        }
        
        // Draw operation info in top-left corner
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        const opText = `${currentOp.type.toUpperCase()}: ${currentOp.value}`;
        this.ctx.fillText(opText, 20, 20);
        
        // Draw animated indicators for active operations
        if (this.currentAnimation) {
            this.drawAnimationEffects();
        }
    }

    /**
     * Draw special effects for current animation
     */
    drawAnimationEffects() {
        if (!this.currentAnimation) return;
        
        const elapsed = Date.now() - this.animationStartTime;
        const duration = this.currentAnimation.duration;
        const progress = Math.min(elapsed / duration, 1);
        
        switch (this.currentAnimation.type) {
            case 'node_split':
                this.drawSplitEffect(progress);
                break;
            case 'nodes_merged':
                this.drawMergeEffect(progress);
                break;
            case 'key_borrowed':
                this.drawBorrowEffect(progress);
                break;
        }
    }

    /**
     * Draw visual effect for node split
     * @param {number} progress - Animation progress (0-1)
     */
    drawSplitEffect(progress) {
        // Draw expanding circle or split indicator
        const nodeId = this.currentAnimation.nodeId;
        if (!nodeId) return;
        
        const node = this.treeModel.getNode(nodeId);
        if (!node) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = this.colors.activeNode;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.globalAlpha = 1 - progress;
        
        const radius = 30 + (progress * 20);
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    /**
     * Draw visual effect for node merge
     * @param {number} progress - Animation progress (0-1)
     */
    drawMergeEffect(progress) {
        // Draw converging lines or merge indicator
        const mergedNodeId = this.currentAnimation.mergedNodeId;
        if (!mergedNodeId) return;
        
        const node = this.treeModel.getNode(mergedNodeId);
        if (!node) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = this.colors.activeNode;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 1 - progress;
        
        // Draw converging arrows or lines
        const offset = 40 * (1 - progress);
        this.ctx.beginPath();
        this.ctx.moveTo(node.x - offset, node.y);
        this.ctx.lineTo(node.x, node.y);
        this.ctx.moveTo(node.x + offset, node.y);
        this.ctx.lineTo(node.x, node.y);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    /**
     * Draw visual effect for key borrowing
     * @param {number} progress - Animation progress (0-1)
     */
    drawBorrowEffect(progress) {
        // Draw moving key animation between nodes
        const sourceNodeId = this.currentAnimation.sourceNodeId;
        const targetNodeId = this.currentAnimation.targetNodeId;
        
        if (!sourceNodeId || !targetNodeId) return;
        
        const sourceNode = this.treeModel.getNode(sourceNodeId);
        const targetNode = this.treeModel.getNode(targetNodeId);
        
        if (!sourceNode || !targetNode) return;
        
        // Calculate moving position
        const startX = sourceNode.x;
        const startY = sourceNode.y;
        const endX = targetNode.x;
        const endY = targetNode.y;
        
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;
        
        // Draw moving key
        this.ctx.save();
        this.ctx.fillStyle = this.colors.highlightedNode;
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 2;
        
        const keySize = 20;
        this.ctx.fillRect(currentX - keySize/2, currentY - keySize/2, keySize, keySize);
        this.ctx.strokeRect(currentX - keySize/2, currentY - keySize/2, keySize, keySize);
        
        // Draw key value
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.currentAnimation.borrowedKey, currentX, currentY);
        
        this.ctx.restore();
    }

    /**
     * Draw rounded rectangle
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Corner radius
     */
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    /**
     * Start the main animation loop
     */
    startAnimationLoop() {
        const animate = () => {
            this.render();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    /**
     * Set animation speed
     * @param {number} speed - Speed multiplier (1.0 = normal)
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(5.0, speed));
    }

    /**
     * Toggle display of node addresses for debugging
     * @param {boolean} show - Whether to show addresses
     */
    setShowNodeAddresses(show) {
        this.showNodeAddresses = show;
    }

    /**
     * Get current animation status
     * @returns {Object} Animation status information
     */
    getAnimationStatus() {
        return {
            isAnimating: this.isAnimating,
            queueLength: this.animationQueue.length,
            currentAnimation: this.currentAnimation?.type || 'none',
            animationSpeed: this.animationSpeed
        };
    }

    /**
     * Force stop all animations
     */
    stopAllAnimations() {
        this.isAnimating = false;
        this.animationQueue.length = 0;
        this.currentAnimation = null;
        
        // Snap all nodes to target positions
        for (const nodeId of this.treeModel?.getAllNodeIds() || []) {
            const node = this.treeModel.getNode(nodeId);
            if (node) {
                node.x = node.targetX;
                node.y = node.targetY;
                node.isAnimating = false;
            }
        }
    }

    /**
     * Export current frame as image
     * @returns {string} Data URL of current canvas content
     */
    exportFrame() {
        return this.canvas.toDataURL('image/png');
    }
}

export default Animator;