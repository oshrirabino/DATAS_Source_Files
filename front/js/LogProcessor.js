/**
 * LogProcessor.js - Parses B-Tree operation logs and extracts meaningful actions
 * 
 * This module is responsible for:
 * - Reading log text and extracting individual log entries
 * - Parsing different types of log entries (tree operations, node states, etc.)
 * - Converting raw log data into structured action objects for the tree model
 * 
 * Log Format Expected:
 * [TREE_INIT] order=4 root=0x7fff...
 * [TREE_INSERT] value=10 root=0x7fff...
 * [NODE_STATE] context node=0x7fff... is_leaf=true keys_count=1 keys=[10] children=[]
 * [Split Child] parent=0x7fff... child_index=0 child=0x7fff...
 * [Merge Result] merged_node=0x7fff... deleted_node=0x7fff...
 */

export class LogProcessor {
    constructor() {
        // Regular expressions for parsing different log types
        this.patterns = {
            // Tree-level operations
            treeInit: /\[TREE_INIT\]\s+order=(\d+)\s+root=(\S+)/,
            treeInsert: /\[TREE_INSERT\]\s+value=(\d+)\s+root=(\S+)/,
            treeInsertComplete: /\[TREE_INSERT_COMPLETE\]\s+value=(\d+)\s+root=(\S+)/,
            treeRemove: /\[TREE_REMOVE\]\s+value=(\d+)\s+root=(\S+)/,
            treeRemoveComplete: /\[TREE_REMOVE_COMPLETE\]\s+value=(\d+)\s+root=(\S+)/,
            treeFind: /\[TREE_FIND\]\s+value=(\d+)\s+root=(\S+)/,
            treeFindResult: /\[TREE_FIND_RESULT\]\s+value=(\d+)\s+found=(\w+)/,

            // Node state information
            nodeState: /\[NODE_STATE\]\s+(\w+)\s+node=(\S+)\s+is_leaf=(\w+)\s+keys_count=(\d+)\s+children_count=(\d+)\s+keys=\[(.*?)\]\s+children=\[(.*?)\]/,
            
            // Structural operations
            splitChild: /\[Split Child\]\s+parent=(\S+)\s+child_index=(\d+)\s+child=(\S+)/,
            splitSibling: /\[Split Sibling\]\s+node=(\S+)\s+keys_size=(\d+)/,
            splitKeys: /\[Split Keys\]\s+original_node=(\S+)\s+original_keys=\[(.*?)\]\s+new_sibling=(\S+)\s+new_keys=\[(.*?)\]/,
            splitResult: /\[Split Result\]\s+original_node=(\S+)\s+new_sibling=(\S+)\s+mid_val=(\d+)/,
            
            mergeSiblings: /\[Merge Siblings\]\s+parent=(\S+)\s+left=(\S+)\s+right=(\S+)\s+key_to_merge=(\d+)/,
            mergeResult: /\[Merge Result\]\s+merged_node=(\S+)\s+deleted_node=(\S+)/,
            
            borrowFromLeft: /\[Borrow Left\]\s+Move from left=(\S+)\s+key=(\d+)\s+to father=(\S+)\s+and move key=(\d+)\s+to right=(\S+)/,
            borrowFromRight: /\[Borrow Right\]\s+Move from right=(\S+)\s+key=(\d+)\s+to father=(\S+)\s+and move key=(\d+)\s+to left=(\S+)/,

            // Parent-child relationships
            parentChild: /\[PARENT_CHILD\]\s+(\w+)\s+parent=(\S+)\s+child_index=(\d+)\s+child=(\S+)/,

            // Value operations
            insertVal: /\[Insert Val\]\s+node=(\S+)\s+value=(\d+)/,
            removeVal: /\[Remove Val\]\s+node=(\S+)\s+searching=(\d+)/,
            findIndex: /\[find Index\]\s+search index for val=(\d+) in node=(\S+):\s+found index=(\d+)/
        };
    }

    /**
     * Parse raw log text into structured log entries
     * @param {string} logText - Raw log text from file or stream
     * @returns {Array<Object>} Array of parsed log entries
     */
    parseLogText(logText) {
        const lines = logText.split('\n').filter(line => line.trim());
        const entries = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const entry = this.parseLogLine(line, i);
                if (entry) {
                    entries.push(entry);
                }
            }
        }

        return this.filterAndOrderEntries(entries);
    }

    /**
     * Parse a single log line into a structured entry
     * @param {string} line - Single log line
     * @param {number} lineNumber - Line number for debugging
     * @returns {Object|null} Parsed log entry or null if not recognized
     */
    parseLogLine(line, lineNumber = 0) {
        // Try to match against each pattern
        for (const [patternName, regex] of Object.entries(this.patterns)) {
            const match = line.match(regex);
            if (match) {
                return this.createLogEntry(patternName, match, line, lineNumber);
            }
        }

        // If no pattern matches, create a generic entry
        console.warn(`Unrecognized log format at line ${lineNumber}: ${line}`);
        return null;
    }

    /**
     * Create a structured log entry from regex match
     * @param {string} type - Type of log entry
     * @param {Array} match - Regex match results
     * @param {string} originalLine - Original log line
     * @param {number} lineNumber - Line number
     * @returns {Object} Structured log entry
     */
    createLogEntry(type, match, originalLine, lineNumber) {
        const entry = {
            type,
            line: lineNumber,
            originalLine,
            timestamp: Date.now() // Add timestamp for ordering
        };

        switch (type) {
            case 'treeInit':
                entry.order = parseInt(match[1]);
                entry.root = this.parseAddress(match[2]);
                break;

            case 'treeInsert':
            case 'treeInsertComplete':
            case 'treeRemove':
            case 'treeRemoveComplete':
            case 'treeFind':
                entry.value = parseInt(match[1]);
                entry.root = this.parseAddress(match[2]);
                break;

            case 'treeFindResult':
                entry.value = parseInt(match[1]);
                entry.found = match[2] === 'true';
                break;

            case 'nodeState':
                entry.context = match[1];
                entry.node = this.parseAddress(match[2]);
                entry.isLeaf = match[3] === 'true';
                entry.keyCount = parseInt(match[4]);
                entry.childrenCount = parseInt(match[5]);
                entry.keys = this.parseArray(match[6]);
                entry.children = this.parseAddressArray(match[7]);
                break;

            case 'splitChild':
                entry.parent = this.parseAddress(match[1]);
                entry.childIndex = parseInt(match[2]);
                entry.child = this.parseAddress(match[3]);
                break;

            case 'splitSibling':
                entry.node = this.parseAddress(match[1]);
                entry.keysSize = parseInt(match[2]);
                break;

            case 'splitKeys':
                entry.originalNode = this.parseAddress(match[1]);
                entry.originalKeys = this.parseArray(match[2]);
                entry.newSibling = this.parseAddress(match[3]);
                entry.newKeys = this.parseArray(match[4]);
                break;

            case 'splitResult':
                entry.originalNode = this.parseAddress(match[1]);
                entry.newSibling = this.parseAddress(match[2]);
                entry.midVal = parseInt(match[3]);
                break;

            case 'mergeSiblings':
                entry.parent = this.parseAddress(match[1]);
                entry.left = this.parseAddress(match[2]);
                entry.right = this.parseAddress(match[3]);
                entry.keyToMerge = parseInt(match[4]);
                break;

            case 'mergeResult':
                entry.mergedNode = this.parseAddress(match[1]);
                entry.deletedNode = this.parseAddress(match[2]);
                break;

            case 'borrowFromLeft':
                entry.leftNode = this.parseAddress(match[1]);
                entry.borrowedKey = parseInt(match[2]);
                entry.parent = this.parseAddress(match[3]);
                entry.parentKey = parseInt(match[4]);
                entry.rightNode = this.parseAddress(match[5]);
                break;

            case 'borrowFromRight':
                entry.rightNode = this.parseAddress(match[1]);
                entry.borrowedKey = parseInt(match[2]);
                entry.parent = this.parseAddress(match[3]);
                entry.parentKey = parseInt(match[4]);
                entry.leftNode = this.parseAddress(match[5]);
                break;

            case 'parentChild':
                entry.context = match[1];
                entry.parent = this.parseAddress(match[2]);
                entry.childIndex = parseInt(match[3]);
                entry.child = this.parseAddress(match[4]);
                break;

            case 'insertVal':
            case 'removeVal':
                entry.node = this.parseAddress(match[1]);
                entry.value = parseInt(match[2]);
                break;

            case 'findIndex':
                entry.value = parseInt(match[1]);
                entry.node = this.parseAddress(match[2]);
                entry.index = parseInt(match[3]);
                break;

            default:
                console.warn(`Unknown log entry type: ${type}`);
                break;
        }

        return entry;
    }

    /**
     * Parse memory address from log
     * @param {string} addressStr - Address string like "0x7fff5fbff720" or "(nil)"
     * @returns {string|null} Normalized address or null
     */
    parseAddress(addressStr) {
        if (!addressStr || addressStr === '(nil)' || addressStr === 'nullptr') {
            return null;
        }
        
        // Extract hex address
        const hexMatch = addressStr.match(/0x[a-fA-F0-9]+/);
        return hexMatch ? hexMatch[0] : addressStr;
    }

    /**
     * Parse array of integers from log
     * @param {string} arrayStr - Array string like "10,20,30" or empty
     * @returns {Array<number>} Array of integers
     */
    parseArray(arrayStr) {
        if (!arrayStr || arrayStr.trim() === '') {
            return [];
        }
        
        return arrayStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }

    /**
     * Parse array of addresses from log
     * @param {string} arrayStr - Array string of addresses
     * @returns {Array<string|null>} Array of normalized addresses
     */
    parseAddressArray(arrayStr) {
        if (!arrayStr || arrayStr.trim() === '') {
            return [];
        }
        
        return arrayStr.split(',').map(s => this.parseAddress(s.trim()));
    }

    /**
     * Filter and order log entries to focus on meaningful structural changes
     * @param {Array<Object>} entries - Raw parsed entries
     * @returns {Array<Object>} Filtered and ordered entries
     */
    filterAndOrderEntries(entries) {
        // Define priority order for entry types
        const priorityOrder = {
            'treeInit': 0,
            'treeInsert': 1,
            'treeRemove': 1,
            'treeFind': 1,
            'nodeState': 2,
            'splitResult': 3,
            'splitKeys': 4,
            'mergeResult': 5,
            'borrowFromLeft': 6,
            'borrowFromRight': 6,
            'treeInsertComplete': 7,
            'treeRemoveComplete': 7,
            'treeFindResult': 7
        };

        // Filter to only include entries we want to animate
        const filtered = entries.filter(entry => {
            return priorityOrder.hasOwnProperty(entry.type);
        });

        // Group by operation (entries between tree operations)
        const groups = [];
        let currentGroup = [];

        for (const entry of filtered) {
            if (['treeInsert', 'treeRemove', 'treeFind'].includes(entry.type)) {
                // Start new group
                if (currentGroup.length > 0) {
                    groups.push(currentGroup);
                }
                currentGroup = [entry];
            } else {
                currentGroup.push(entry);
            }
        }

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        // Sort entries within each group by priority
        const result = [];
        for (const group of groups) {
            const sorted = group.sort((a, b) => {
                const aPriority = priorityOrder[a.type] || 999;
                const bPriority = priorityOrder[b.type] || 999;
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }
                return a.line - b.line; // Maintain original order for same priority
            });
            result.push(...sorted);
        }

        return result;
    }

    /**
     * Check if a log entry represents a structural change that should be animated
     * @param {Object} entry - Log entry to check
     * @returns {boolean} True if entry should trigger animation
     */
    isStructuralChange(entry) {
        const structuralTypes = [
            'treeInit', 'treeInsertComplete', 'treeRemoveComplete',
            'splitResult', 'mergeResult', 'borrowFromLeft', 'borrowFromRight',
            'nodeState'
        ];
        
        return structuralTypes.includes(entry.type);
    }

    /**
     * Extract action sequence for a complete tree operation
     * @param {Array<Object>} entries - All log entries
     * @param {number} startIndex - Starting index for this operation
     * @returns {Object} Action sequence with main action and sub-actions
     */
    extractActionSequence(entries, startIndex) {
        const mainEntry = entries[startIndex];
        const sequence = {
            mainAction: mainEntry,
            subActions: [],
            endIndex: startIndex
        };

        // Look ahead for related entries
        for (let i = startIndex + 1; i < entries.length; i++) {
            const entry = entries[i];
            
            // Stop at next tree-level operation
            if (['treeInsert', 'treeRemove', 'treeFind'].includes(entry.type)) {
                break;
            }
            
            sequence.subActions.push(entry);
            sequence.endIndex = i;
        }

        return sequence;
    }
}

export default LogProcessor;