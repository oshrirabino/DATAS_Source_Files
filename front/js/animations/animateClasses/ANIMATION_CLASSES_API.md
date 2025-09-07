# Tree Animation Classes API Documentation

This document describes the Tree Animation System - a modular OOP framework for visualizing AVL Tree and B-Tree operations using JavaScript, SVG, and GSAP.

## Overview

The system consists of four main classes:
- **AVLNode.js** - Individual AVL tree nodes with animation capabilities
- **BTreeNode.js** - B-tree nodes that can contain multiple keys
- **AVLTree.js** - Manages collections of AVL nodes and layout
- **BTree.js** - Manages collections of B-tree nodes and layout

## Class Documentation

### AVLNode

Represents a single AVL tree node as a circle with animation capabilities.

#### Constructor
```javascript
new AVLNode(id, value, svg)
```
- `id` (string) - Unique identifier for the node
- `value` (any) - Value to display in the node
- `svg` (SVGElement) - Parent SVG element to attach to

#### Methods

##### `appear(x, y)`
Animates the node appearing at specified coordinates.
- **Parameters:** `x` (number), `y` (number) - Target coordinates
- **Returns:** GSAP Timeline
- **Duration:** 0.5s with back.out easing

##### `move(x, y)`
Smoothly moves the node to new coordinates.
- **Parameters:** `x` (number), `y` (number) - Target coordinates  
- **Returns:** GSAP Timeline
- **Duration:** 0.6s with power2.out easing

##### `highlight()`
Creates a pulse/glow effect to highlight the node.
- **Returns:** GSAP Timeline
- **Effect:** Scales up 1.2x then back to 1x with highlight class

##### `remove()`
Animates node removal with fade out and scale down.
- **Returns:** GSAP Timeline
- **Effect:** Removes DOM element after animation completes

##### `updateValue(newValue)`
Updates the displayed value with a small pulse animation.
- **Parameters:** `newValue` (any) - New value to display

#### Properties
- `x`, `y` (number) - Current position
- `radius` (number) - Node radius (default: 25)
- `id`, `value` - Node identifier and display value

---

### BTreeNode

Represents a B-tree node as a rectangle containing multiple keys.

#### Constructor
```javascript
new BTreeNode(id, keys, svg)
```
- `id` (string) - Unique identifier for the node
- `keys` (Array) - Array of keys to display
- `svg` (SVGElement) - Parent SVG element

#### Methods

##### `appear(x, y)`
Animates the node appearing at specified coordinates.
- **Parameters:** `x` (number), `y` (number) - Target coordinates
- **Returns:** GSAP Timeline

##### `move(x, y)`
Smoothly moves the node to new coordinates.
- **Parameters:** `x` (number), `y` (number) - Target coordinates
- **Returns:** GSAP Timeline

##### `highlight()`
Highlights the node with scale and glow effects.
- **Returns:** GSAP Timeline

##### `addKey(value, position)`
Animates adding a key at the specified position.
- **Parameters:** `value` (any), `position` (number) - Key and insertion index
- **Returns:** GSAP Timeline
- **Effect:** Rebuilds node structure with new key

##### `removeKey(value)`
Animates removing a key from the node.
- **Parameters:** `value` (any) - Key to remove
- **Returns:** GSAP Timeline

##### `shiftKeys(startIndex, direction)`
Animates keys shifting left or right.
- **Parameters:** `startIndex` (number), `direction` (number) - Start index and direction (-1 left, 1 right)
- **Returns:** GSAP Timeline

##### `splitNode(resultSpec)`
Animates node splitting preparation.
- **Parameters:** `resultSpec` (Object) - Split specification
- **Returns:** GSAP Timeline

##### `mergeNodes(otherNode, resultSpec)`
Animates merging with another node.
- **Parameters:** `otherNode` (BTreeNode), `resultSpec` (Object) - Other node and merge spec
- **Returns:** GSAP Timeline

##### `remove()`
Animates node removal with rotation and fade.
- **Returns:** GSAP Timeline

##### `getKeys()` / `setKeys(newKeys)`
Get or set the keys array.

#### Properties
- `keyWidth`, `keyHeight` (number) - Dimensions of individual keys
- `keySpacing` (number) - Space between keys
- `keys` (Array) - Current keys in the node

---

### AVLTree

Manages a collection of AVLNode objects and handles tree layout.

#### Constructor
```javascript
new AVLTree(svgElement)
```
- `svgElement` (SVGElement) - SVG container for the tree

#### Methods

##### `addNode(id, parentId, value)`
Adds a new node to the tree.
- **Parameters:** `id` (string), `parentId` (string|null), `value` (any)
- **Returns:** AVLNode instance
- **Effect:** Creates node and edge to parent if specified

##### `removeNode(id)`
Removes a node and its associated edges.
- **Parameters:** `id` (string) - Node ID to remove
- **Returns:** GSAP Timeline for removal animation

##### `updateLayout()`
Recalculates positions and animates nodes to new locations.
- **Returns:** Array of animation timelines
- **Effect:** Updates both nodes and edges

##### `getNode(id)` / `hasNode(id)` / `getAllNodes()`
Node access and query methods.

##### `clear()`
Removes all nodes and edges from the tree.

##### `setCenter(x, y)`
Sets the center position for tree layout.
- **Parameters:** `x` (number), `y` (number) - Center coordinates

##### `setSpacing(levelSeparation, nodeSeparation)`
Configures spacing parameters.
- **Parameters:** `levelSeparation` (number), `nodeSeparation` (number)

##### `animateRotation(nodeIds)`
Animates a rotation by highlighting affected nodes.
- **Parameters:** `nodeIds` (Array) - Array of node IDs involved
- **Returns:** GSAP Timeline

#### Properties
- `levelSeparation` (number) - Vertical spacing between levels (default: 80)
- `nodeSeparation` (number) - Horizontal spacing between siblings (default: 60)
- `nodes` (Map) - Map of node ID to AVLNode instance
- `edges` (Map) - Map of edge connections

---

### BTree

Manages a collection of BTreeNode objects and handles B-tree layout.

#### Constructor
```javascript
new BTree(svgElement)
```
- `svgElement` (SVGElement) - SVG container for the tree

#### Methods

##### `addNode(id, parentId, keysArray)`
Adds a new B-tree node.
- **Parameters:** `id` (string), `parentId` (string|null), `keysArray` (Array)
- **Returns:** BTreeNode instance

##### `removeNode(id)`
Removes a node and associated edges.
- **Parameters:** `id` (string) - Node ID to remove
- **Returns:** GSAP Timeline

##### `insertKey(nodeId, key, position)`
Inserts a key into a specific node.
- **Parameters:** `nodeId` (string), `key` (any), `position` (number)
- **Returns:** GSAP Timeline

##### `removeKey(nodeId, key)`
Removes a key from a specific node.
- **Parameters:** `nodeId` (string), `key` (any)
- **Returns:** GSAP Timeline

##### `animateSplit(nodeId, splitSpec)`
Animates a node split operation.
- **Parameters:** `nodeId` (string), `splitSpec` (Object)
- **splitSpec properties:**
  - `leftNodeId`, `rightNodeId` (string) - IDs for resulting nodes
  - `leftKeys`, `rightKeys` (Array) - Keys for each resulting node
  - `parentId` (string) - Parent node ID
  - `promotedKey` (any) - Key promoted to parent
- **Returns:** GSAP Timeline

##### `animateMerge(nodeId1, nodeId2, mergeSpec)`
Animates merging two nodes.
- **Parameters:** `nodeId1` (string), `nodeId2` (string), `mergeSpec` (Object)
- **mergeSpec properties:**
  - `resultNodeId` (string) - ID for merged node
  - `keys` (Array) - Final merged keys
- **Returns:** GSAP Timeline

##### `updateLayout()`
Updates tree layout and positions.

##### `clear()` / `setCenter()` / `setSpacing()`
Same as AVLTree methods.

#### Properties
- `levelSeparation` (number) - Vertical spacing (default: 100)
- `nodeSeparation` (number) - Horizontal spacing (default: 120)
- `nodes` (Map), `edges` (Map) - Node and edge collections

## Usage Examples

### Creating and Manipulating an AVL Tree
```javascript
// Initialize
const svg = document.getElementById('avl-svg');
const avlTree = new AVLTree(svg);

// Create nodes
avlTree.addNode('root', null, 50);
avlTree.addNode('left', 'root', 25);
avlTree.addNode('right', 'root', 75);

// Update layout to show tree
avlTree.updateLayout();

// Highlight a node
const rootNode = avlTree.getNode('root');
rootNode.highlight();

// Simulate rotation
avlTree.animateRotation(['root', 'left', 'right']);
```

### Creating and Manipulating a B-Tree
```javascript
// Initialize  
const svg = document.getElementById('btree-svg');
const bTree = new BTree(svg);

// Create node with multiple keys
bTree.addNode('root', null, [10, 20, 30]);
bTree.updateLayout();

// Insert a key
bTree.insertKey('root', 15, 1); // Insert 15 at position 1

// Simulate split
const splitSpec = {
    leftNodeId: 'left_1',
    rightNodeId: 'right_1', 
    leftKeys: [10, 15],
    rightKeys: [25, 30],
    parentId: null,
    promotedKey: 20
};
bTree.animateSplit('root', splitSpec);
```

### Animation Coordination
```javascript
// Chain animations
const timeline = gsap.timeline();
timeline.add(node1.appear(100, 100))
        .add(node2.appear(200, 100), "-=0.2")
        .add(node1.highlight(), "+=0.5");

// Wait for layout update, then highlight
avlTree.updateLayout();
setTimeout(() => {
    avlTree.getNode('root').highlight();
}, 700);
```

## CSS Classes

The system uses several CSS classes for styling:

- `.avl-node` - Styling for AVL node circles
- `.btree-node` - Styling for B-tree node rectangles  
- `.node-text` - Text styling for node labels
- `.edge` - Styling for connecting lines
- `.highlighted` - Applied during highlight animations

## Dependencies

- **GSAP 3.12+** - For all animations
- **SVG** - For rendering nodes and edges
- **Modern Browser** - ES6+ support required

## Integration Notes

- **Server Communication:** Classes are designed to animate pre-computed results, not perform tree operations
- **Event Handling:** All methods return GSAP timelines for coordination
- **Performance:** Efficient SVG manipulation and GSAP animations
- **Modularity:** Each class can be used independently or together

This system provides a clean separation between tree logic (handled by your server) and visualization (handled by these classes), making it easy to integrate with any tree algorithm implementation.