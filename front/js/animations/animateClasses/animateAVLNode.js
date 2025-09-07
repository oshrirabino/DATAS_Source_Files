/**
 * AVLNode.js
 * Represents an AVL tree node with animation capabilities
 */
class AVLNode {
    constructor(id, value, svg) {
        this.id = id;
        this.value = value;
        this.svg = svg;
        this.x = 0;
        this.y = 0;
        this.radius = 25;
        
        // Create SVG elements
        this.group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        
        this.setupElements();
    }
    
    setupElements() {
        // Setup circle
        this.circle.setAttribute('r', this.radius);
        this.circle.classList.add('avl-node');
        
        // Setup text
        this.text.textContent = this.value;
        this.text.classList.add('node-text');
        this.text.setAttribute('font-size', '14');
        
        // Group elements
        this.group.appendChild(this.circle);
        this.group.appendChild(this.text);
        this.svg.appendChild(this.group);
        
        // Initially hidden
        gsap.set(this.group, { opacity: 0, scale: 0 });
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
        tl.to(this.circle, {
            scale: 1.2,
            duration: 0.3,
            ease: "power2.out"
        })
        .to(this.circle, {
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
     * Animate the node removal (fade out and scale down)
     * @returns {GSAPTimeline} Animation timeline
     */
    remove() {
        const tl = gsap.timeline();
        tl.to(this.group, {
            scale: 0,
            opacity: 0,
            duration: 0.4,
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
     * Update the node's display value
     * @param {*} newValue - New value to display
     */
    updateValue(newValue) {
        this.value = newValue;
        this.text.textContent = newValue;
        
        // Small pulse animation to indicate change
        gsap.to(this.text, {
            scale: 1.2,
            duration: 0.2,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
        });
    }
}