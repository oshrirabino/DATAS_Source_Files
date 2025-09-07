/**
 * BTreeNode.js
 * Represents a B-Tree node with multiple keys and animation capabilities
 */
class BTreeNode {
    constructor(id, keys, svg) {
        this.id = id;
        this.keys = [...keys];
        this.svg = svg;
        this.x = 0;
        this.y = 0;
        this.keyWidth = 40;
        this.keyHeight = 30;
        this.keySpacing = 5;
        
        // Create SVG elements
        this.group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.setupElements();
    }
    
    setupElements() {
        this.updateNodeStructure();
        this.svg.appendChild(this.group);
        
        // Initially hidden
        gsap.set(this.group, { opacity: 0, scale: 0 });
    }
    
    /**
     * Rebuilds the visual structure of the node based on current keys
     * @private
     */
    updateNodeStructure() {
        // Clear existing elements
        while (this.group.firstChild) {
            this.group.removeChild(this.group.firstChild);
        }
        
        if (this.keys.length === 0) return;
        
        const totalWidth = this.keys.length * this.keyWidth + (this.keys.length - 1) * this.keySpacing;
        const startX = -totalWidth / 2;
        
        // Create background rectangle
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', startX - 5);
        bgRect.setAttribute('y', -this.keyHeight / 2 - 5);
        bgRect.setAttribute('width', totalWidth + 10);
        bgRect.setAttribute('height', this.keyHeight + 10);
        bgRect.setAttribute('rx', 8);
        bgRect.classList.add('btree-node');
        this.group.appendChild(bgRect);
        
        // Create key rectangles and text
        this.keys.forEach((key, index) => {
            const keyX = startX + index * (this.keyWidth + this.keySpacing);
            
            // Key rectangle
            const keyRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            keyRect.setAttribute('x', keyX);
            keyRect.setAttribute('y', -this.keyHeight / 2);
            keyRect.setAttribute('width', this.keyWidth);
            keyRect.setAttribute('height', this.keyHeight);
            keyRect.setAttribute('rx', 4);
            keyRect.setAttribute('fill', 'rgba(255,255,255,0.2)');
            keyRect.setAttribute('stroke', 'rgba(255,255,255,0.5)');
            keyRect.setAttribute('stroke-width', 1);
            this.group.appendChild(keyRect);
            
            // Key text
            const keyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            keyText.textContent = key;
            keyText.setAttribute('x', keyX + this.keyWidth / 2);
            keyText.setAttribute('y', 0);
            keyText.classList.add('node-text');
            keyText.setAttribute('font-size', '12');
            this.group.appendChild(keyText);
        });
    }
    
    /**
     * Animate the node appearing at specified coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {GSAPTimeline} Animation timeline
     */
    appear(x, y) {
        this.x = x;
        this.y = y;
        
        gsap.set(this.group, { 
            x: x, 
            y: y, 
            opacity: 0, 
            scale: 0 
        });
        
        return gsap.to(this.group, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.7)"
        });
    }
    
    /**
     * Smoothly move the node to new coordinates
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     * @returns {GSAPTimeline} Animation timeline
     */
    move(x, y) {
        this.x = x;
        this.y = y;
        
        return gsap.to(this.group, {
            x: x,
            y: y,
            duration: 0.6,
            ease: "power2.out"
        });
    }
    
    /**
     * Highlight the node with a pulse/glow effect
     * @returns {GSAPTimeline} Animation timeline
     */
    highlight() {
        this.group.classList.add('highlighted');
        
        const tl = gsap.timeline();
        tl.to(this.group, {
            scale: 1.1,
            duration: 0.3,
            ease: "power2.out"
        })
        .to(this.group, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        })
        .call(() => {
            this.group.classList.remove('highlighted');
        });
        
        return tl;
    }
    
    /**
     * Animate adding a key at the specified position
     * @param {*} value - Key value to add
     * @param {number} position - Index position to insert the key
     * @returns {GSAPTimeline} Animation timeline
     */
    addKey(value, position) {
        this.keys.splice(position, 0, value);
        
        const tl = gsap.timeline();
        tl.to(this.group, {
            scale: 1.1,
            duration: 0.2
        })
        .call(() => {
            this.updateNodeStructure();
        })
        .to(this.group, {
            scale: 1,
            duration: 0.3,
            ease: "back.out(1.7)"
        });
        
        return tl;
    }
    
    /**
     * Animate removing a key from the node
     * @param {*} value - Key value to remove
     * @returns {GSAPTimeline} Animation timeline
     */
    removeKey(value) {
        const index = this.keys.indexOf(value);
        if (index !== -1) {
            this.keys.splice(index, 1);
            
            const tl = gsap.timeline();
            tl.to(this.group, {
                scale: 0.9,
                duration: 0.2
            })
            .call(() => {
                this.updateNodeStructure();
            })
            .to(this.group, {
                scale: 1,
                duration: 0.3,
                ease: "back.out(1.7)"
            });
            
            return tl;
        }
        
        return gsap.timeline();
    }
    
    /**
     * Animate keys shifting left or right
     * @param {number} startIndex - Starting index for the shift
     * @param {number} direction - Direction to shift (-1 for left, 1 for right)
     * @returns {GSAPTimeline} Animation timeline
     */
    shiftKeys(startIndex, direction) {
        // Visual animation of keys sliding
        const tl = gsap.timeline();
        
        tl.to(this.group, {
            x: this.x + (direction * 10),
            duration: 0.2,
            ease: "power2.out"
        })
        .to(this.group, {
            x: this.x,
            duration: 0.2,
            ease: "power2.out"
        });
        
        return tl;
    }
    
    /**
     * Animate node splitting into two new nodes
     * @param {Object} resultSpec - Specification for the split result
     * @param {Array} resultSpec.leftKeys - Keys for the left node
     * @param {Array} resultSpec.rightKeys - Keys for the right node
     * @param {Object} resultSpec.leftPos - Position for left node {x, y}
     * @param {Object} resultSpec.rightPos - Position for right node {x, y}
     * @returns {GSAPTimeline} Animation timeline
     */
    splitNode(resultSpec) {
        const tl = gsap.timeline();
        
        tl.to(this.group, {
            scale: 1.2,
            rotation: 5,
            duration: 0.3
        })
        .to(this.group, {
            scale: 0,
            opacity: 0,
            rotation: 15,
            duration: 0.4
        });
        
        return tl;
    }
    
    /**
     * Animate merging with another node
     * @param {BTreeNode} otherNode - The other node to merge with
     * @param {Object} resultSpec - Specification for the merge result
     * @param {Array} resultSpec.keys - Final merged keys
     * @returns {GSAPTimeline} Animation timeline
     */
    mergeNodes(otherNode, resultSpec) {
        const tl = gsap.timeline();
        
        // Animate both nodes coming together
        tl.to([this.group, otherNode.group], {
            scale: 1.1,
            duration: 0.3
        })
        .to(otherNode.group, {
            x: this.x,
            y: this.y,
            duration: 0.4,
            ease: "power2.inOut"
        }, "-=0.1")
        .call(() => {
            // Update this node with merged keys
            this.keys = [...resultSpec.keys];
            this.updateNodeStructure();
        })
        .to(this.group, {
            scale: 1,
            duration: 0.3,
            ease: "back.out(1.7)"
        });
        
        return tl;
    }
    
    /**
     * Animate the node removal (fade out and scale down)
     * @returns {GSAPTimeline} Animation timeline
     */
    remove() {
        const tl = gsap.timeline();
        tl.to(this.group, {
            scale: 0,
            opacity: 0,
            rotation: 180,
            duration: 0.5,
            ease: "power2.in"
        })
        .call(() => {
            if (this.group.parentNode) {
                this.group.parentNode.removeChild(this.group);
            }
        });
        
        return tl;
    }
    
    /**
     * Get the current keys in the node
     * @returns {Array} Array of keys
     */
    getKeys() {
        return [...this.keys];
    }
    
    /**
     * Set new keys for the node
     * @param {Array} newKeys - New array of keys
     */
    setKeys(newKeys) {
        this.keys = [...newKeys];
        this.updateNodeStructure();
    }
}