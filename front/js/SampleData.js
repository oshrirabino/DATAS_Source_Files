/**
 * SampleData.js - Generates sample B-Tree operation logs for testing
 * 
 * This module provides sample log data that matches the format expected by LogProcessor.
 * It includes various B-Tree operations like insertions, deletions, searches, and
 * structural changes like splits and merges.
 */

/**
 * Generate sample B-Tree logs for demonstration
 * @returns {string} Sample log data as text
 */
export function generateSampleLogs() {
    return `[TREE_INIT] order=4 root=0x7fff5fbff720
[NODE_STATE] INITIAL_ROOT node=0x7fff5fbff720 is_leaf=true keys_count=0 children_count=0 keys=[] children=[]
[TREE_INSERT] value=10 root=0x7fff5fbff720
[NODE_STATE] ROOT_BEFORE_INSERT node=0x7fff5fbff720 is_leaf=true keys_count=0 children_count=0 keys=[] children=[]
[Insert Val] node=0x7fff5fbff720 value=10
[Insert Leaf] node=0x7fff5fbff720 inserting key=10 at index=0
[NODE_STATE] AFTER_INSERT_LEAF node=0x7fff5fbff720 is_leaf=true keys_count=1 children_count=0 keys=[10] children=[]
[TREE_INSERT_COMPLETE] value=10 root=0x7fff5fbff720
[NODE_STATE] ROOT_AFTER_INSERT node=0x7fff5fbff720 is_leaf=true keys_count=1 children_count=0 keys=[10] children=[]
[TREE_INSERT] value=20 root=0x7fff5fbff720
[NODE_STATE] ROOT_BEFORE_INSERT node=0x7fff5fbff720 is_leaf=true keys_count=1 children_count=0 keys=[10] children=[]
[Insert Val] node=0x7fff5fbff720 value=20
[Insert Leaf] node=0x7fff5fbff720 inserting key=20 at index=1
[NODE_STATE] AFTER_INSERT_LEAF node=0x7fff5fbff720 is_leaf=true keys_count=2 children_count=0 keys=[10,20] children=[]
[TREE_INSERT_COMPLETE] value=20 root=0x7fff5fbff720
[NODE_STATE] ROOT_AFTER_INSERT node=0x7fff5fbff720 is_leaf=true keys_count=2 children_count=0 keys=[10,20] children=[]
[TREE_INSERT] value=5 root=0x7fff5fbff720
[NODE_STATE] ROOT_BEFORE_INSERT node=0x7fff5fbff720 is_leaf=true keys_count=2 children_count=0 keys=[10,20] children=[]
[Insert Val] node=0x7fff5fbff720 value=5
[Insert Leaf] node=0x7fff5fbff720 inserting key=5 at index=0
[NODE_STATE] AFTER_INSERT_LEAF node=0x7fff5fbff720 is_leaf=true keys_count=3 children_count=0 keys=[5,10,20] children=[]
[TREE_INSERT_COMPLETE] value=5 root=0x7fff5fbff720
[NODE_STATE] ROOT_AFTER_INSERT node=0x7fff5fbff720 is_leaf=true keys_count=3 children_count=0 keys=[5,10,20] children=[]
[TREE_INSERT] value=6 root=0x7fff5fbff720
[NODE_STATE] ROOT_BEFORE_INSERT node=0x7fff5fbff720 is_leaf=true keys_count=3 children_count=0 keys=[5,10,20] children=[]
[Root Split] root=0x7fff5fbff720 is full, creating new root
[Split Child] parent=0x7fff5fbff820 child_index=0 child=0x7fff5fbff720
[NODE_STATE] PARENT_BEFORE_SPLIT node=0x7fff5fbff820 is_leaf=false keys_count=0 children_count=1 keys=[] children=[0x7fff5fbff720]
[NODE_STATE] CHILD_BEFORE_SPLIT node=0x7fff5fbff720 is_leaf=true keys_count=3 children_count=0 keys=[5,10,20] children=[]
[Split Sibling] node=0x7fff5fbff720 keys_size=3
[NODE_STATE] BEFORE_SPLIT node=0x7fff5fbff720 is_leaf=true keys_count=3 children_count=0 keys=[5,10,20] children=[]
[Split Result] original_node=0x7fff5fbff720 new_sibling=0x7fff5fbff920 mid_val=10
[Split Keys] original_node=0x7fff5fbff720 original_keys=[5] new_sibling=0x7fff5fbff920 new_keys=[20]
[NODE_STATE] AFTER_SPLIT_ORIGINAL node=0x7fff5fbff720 is_leaf=true keys_count=1 children_count=0 keys=[5] children=[]
[NODE_STATE] AFTER_SPLIT_NEW node=0x7fff5fbff920 is_leaf=true keys_count=1 children_count=0 keys=[20] children=[]
[Split Child Result] parent=0x7fff5fbff820 left_child=0x7fff5fbff720 right_child=0x7fff5fbff920 promoted_key=10
[NODE_STATE] PARENT_AFTER_SPLIT node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[PARENT_CHILD] LEFT_CHILD_AFTER_SPLIT parent=0x7fff5fbff820 child_index=0 child=0x7fff5fbff720
[PARENT_CHILD] RIGHT_CHILD_AFTER_SPLIT parent=0x7fff5fbff820 child_index=1 child=0x7fff5fbff920
[Insert Val] node=0x7fff5fbff720 value=6
[Insert Leaf] node=0x7fff5fbff720 inserting key=6 at index=1
[NODE_STATE] AFTER_INSERT_LEAF node=0x7fff5fbff720 is_leaf=true keys_count=2 children_count=0 keys=[5,6] children=[]
[TREE_INSERT_COMPLETE] value=6 root=0x7fff5fbff820
[NODE_STATE] ROOT_AFTER_INSERT node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[TREE_INSERT] value=12 root=0x7fff5fbff820
[NODE_STATE] ROOT_BEFORE_INSERT node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[Insert Val] node=0x7fff5fbff920 value=12
[Insert Leaf] node=0x7fff5fbff920 inserting key=12 at index=0
[NODE_STATE] AFTER_INSERT_LEAF node=0x7fff5fbff920 is_leaf=true keys_count=2 children_count=0 keys=[12,20] children=[]
[TREE_INSERT_COMPLETE] value=12 root=0x7fff5fbff820
[NODE_STATE] ROOT_AFTER_INSERT node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[TREE_INSERT] value=30 root=0x7fff5fbff820
[NODE_STATE] ROOT_BEFORE_INSERT node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[Insert Val] node=0x7fff5fbff920 value=30
[Insert Leaf] node=0x7fff5fbff920 inserting key=30 at index=2
[NODE_STATE] AFTER_INSERT_LEAF node=0x7fff5fbff920 is_leaf=true keys_count=3 children_count=0 keys=[12,20,30] children=[]
[TREE_INSERT_COMPLETE] value=30 root=0x7fff5fbff820
[NODE_STATE] ROOT_AFTER_INSERT node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[TREE_FIND] value=12 root=0x7fff5fbff820
[find Index] search index for val=12 in node=0x7fff5fbff820: found index=1
[find Index] search index for val=12 in node=0x7fff5fbff920: found index=0
[TREE_FIND_RESULT] value=12 found=true
[TREE_FIND] value=25 root=0x7fff5fbff820
[find Index] search index for val=25 in node=0x7fff5fbff820: found index=1
[find Index] search index for val=25 in node=0x7fff5fbff920: found index=2
[TREE_FIND_RESULT] value=25 found=false
[TREE_REMOVE] value=6 root=0x7fff5fbff820
[NODE_STATE] ROOT_BEFORE_REMOVE node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[Remove Val] node=0x7fff5fbff820 searching=6
[NODE_STATE] BEFORE_REMOVE node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[Remove Internal Miss] key=6 not at current level, going to child at index=0 child=0x7fff5fbff720
[PARENT_CHILD] REMOVE_GOING_TO_CHILD parent=0x7fff5fbff820 child_index=0 child=0x7fff5fbff720
[Remove Val] node=0x7fff5fbff720 searching=6
[NODE_STATE] BEFORE_REMOVE node=0x7fff5fbff720 is_leaf=true keys_count=2 children_count=0 keys=[5,6] children=[]
[Remove Leaf] node=0x7fff5fbff720 removing key=6 at index=1
[NODE_STATE] AFTER_REMOVE_LEAF node=0x7fff5fbff720 is_leaf=true keys_count=1 children_count=0 keys=[5] children=[]
[NODE_STATE] AFTER_REMOVE_FIX node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[TREE_REMOVE_COMPLETE] value=6 root=0x7fff5fbff820
[NODE_STATE] ROOT_AFTER_REMOVE node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[TREE_REMOVE] value=12 root=0x7fff5fbff820
[NODE_STATE] ROOT_BEFORE_REMOVE node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[Remove Val] node=0x7fff5fbff820 searching=12
[NODE_STATE] BEFORE_REMOVE node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[Remove Internal Miss] key=12 not at current level, going to child at index=1 child=0x7fff5fbff920
[PARENT_CHILD] REMOVE_GOING_TO_CHILD parent=0x7fff5fbff820 child_index=1 child=0x7fff5fbff920
[Remove Val] node=0x7fff5fbff920 searching=12
[NODE_STATE] BEFORE_REMOVE node=0x7fff5fbff920 is_leaf=true keys_count=3 children_count=0 keys=[12,20,30] children=[]
[Remove Leaf] node=0x7fff5fbff920 removing key=12 at index=0
[NODE_STATE] AFTER_REMOVE_LEAF node=0x7fff5fbff920 is_leaf=true keys_count=2 children_count=0 keys=[20,30] children=[]
[NODE_STATE] AFTER_REMOVE_FIX node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]
[TREE_REMOVE_COMPLETE] value=12 root=0x7fff5fbff820
[NODE_STATE] ROOT_AFTER_REMOVE node=0x7fff5fbff820 is_leaf=false keys_count=1 children_count=2 keys=[10] children=[0x7fff5fbff720,0x7fff5fbff920]`;
}

/**
 * Generate more complex sample logs with borrowing and merging operations
 * @returns {string} Complex sample log data
 */
export function generateComplexSampleLogs() {
    return `[TREE_INIT] order=3 root=0x7fff5fbff100
[NODE_STATE] INITIAL_ROOT node=0x7fff5fbff100 is_leaf=true keys_count=0 children_count=0 keys=[] children=[]
[TREE_INSERT] value=10 root=0x7fff5fbff100
[NODE_STATE] AFTER_INSERT_LEAF node=0x7fff5fbff100 is_leaf=true keys_count=1 children_count=0 keys=[10] children=[]
[TREE_INSERT_COMPLETE] value=10 root=0x7fff5fbff100
[TREE_INSERT] value=20 root=0x7fff5fbff100
[NODE_STATE] AFTER_INSERT_LEAF node=0x7fff5fbff100 is_leaf=true keys_count=2 children_count=0 keys=[10,20] children=[]
[TREE_INSERT_COMPLETE] value=20 root=0x7fff5fbff100
[TREE_INSERT] value=30 root=0x7fff5fbff100
[Split Child] parent=0x7fff5fbff200 child_index=0 child=0x7fff5fbff100
[Split Result] original_node=0x7fff5fbff100 new_sibling=0x7fff5fbff300 mid_val=20
[Split Keys] original_node=0x7fff5fbff100 original_keys=[10] new_sibling=0x7fff5fbff300 new_keys=[30]
[NODE_STATE] PARENT_AFTER_SPLIT node=0x7fff5fbff200 is_leaf=false keys_count=1 children_count=2 keys=[20] children=[0x7fff5fbff100,0x7fff5fbff300]
[TREE_INSERT_COMPLETE] value=30 root=0x7fff5fbff200
[TREE_INSERT] value=40 root=0x7fff5fbff200
[NODE_STATE] AFTER_INSERT_LEAF node=0x7fff5fbff300 is_leaf=true keys_count=2 children_count=0 keys=[30,40] children=[]
[TREE_INSERT_COMPLETE] value=40 root=0x7fff5fbff200
[TREE_INSERT] value=50 root=0x7fff5fbff200
[Split Child] parent=0x7fff5fbff200 child_index=1 child=0x7fff5fbff300
[Split Result] original_node=0x7fff5fbff300 new_sibling=0x7fff5fbff400 mid_val=40
[Split Keys] original_node=0x7fff5fbff300 original_keys=[30] new_sibling=0x7fff5fbff400 new_keys=[50]
[NODE_STATE] PARENT_AFTER_SPLIT node=0x7fff5fbff200 is_leaf=false keys_count=2 children_count=3 keys=[20,40] children=[0x7fff5fbff100,0x7fff5fbff300,0x7fff5fbff400]
[TREE_INSERT_COMPLETE] value=50 root=0x7fff5fbff200
[TREE_REMOVE] value=50 root=0x7fff5fbff200
[Remove Leaf] node=0x7fff5fbff400 removing key=50 at index=0
[NODE_STATE] AFTER_REMOVE_LEAF node=0x7fff5fbff400 is_leaf=true keys_count=0 children_count=0 keys=[] children=[]
[Borrow Right] Move from right=0x7fff5fbff300 key=30 to father=0x7fff5fbff200 and move key=40 to left=0x7fff5fbff400
[NODE_STATE] PARENT_BEFORE_BORROW_RIGHT node=0x7fff5fbff200 is_leaf=false keys_count=2 children_count=3 keys=[20,40] children=[0x7fff5fbff100,0x7fff5fbff300,0x7fff5fbff400]
[NODE_STATE] LEFT_BEFORE_BORROW node=0x7fff5fbff400 is_leaf=true keys_count=0 children_count=0 keys=[] children=[]
[NODE_STATE] RIGHT_BEFORE_BORROW node=0x7fff5fbff300 is_leaf=true keys_count=1 children_count=0 keys=[30] children=[]
[NODE_STATE] PARENT_AFTER_BORROW_RIGHT node=0x7fff5fbff200 is_leaf=false keys_count=2 children_count=3 keys=[20,30] children=[0x7fff5fbff100,0x7fff5fbff300,0x7fff5fbff400]
[NODE_STATE] LEFT_AFTER_BORROW node=0x7fff5fbff400 is_leaf=true keys_count=1 children_count=0 keys=[40] children=[]
[NODE_STATE] RIGHT_AFTER_BORROW node=0x7fff5fbff300 is_leaf=true keys_count=0 children_count=0 keys=[] children=[]
[TREE_REMOVE_COMPLETE] value=50 root=0x7fff5fbff200
[TREE_REMOVE] value=40 root=0x7fff5fbff200
[Remove Leaf] node=0x7fff5fbff400 removing key=40 at index=0
[NODE_STATE] AFTER_REMOVE_LEAF node=0x7fff5fbff400 is_leaf=true keys_count=0 children_count=0 keys=[] children=[]
[Merge Siblings] parent=0x7fff5fbff200 left=0x7fff5fbff300 right=0x7fff5fbff400 key_to_merge=30
[NODE_STATE] PARENT_BEFORE_MERGE node=0x7fff5fbff200 is_leaf=false keys_count=2 children_count=3 keys=[20,30] children=[0x7fff5fbff100,0x7fff5fbff300,0x7fff5fbff400]
[NODE_STATE] LEFT_BEFORE_MERGE node=0x7fff5fbff300 is_leaf=true keys_count=0 children_count=0 keys=[] children=[]
[NODE_STATE] RIGHT_BEFORE_MERGE node=0x7fff5fbff400 is_leaf=true keys_count=0 children_count=0 keys=[] children=[]
[Merge Result] merged_node=0x7fff5fbff300 deleted_node=0x7fff5fbff400
[NODE_STATE] PARENT_AFTER_MERGE node=0x7fff5fbff200 is_leaf=false keys_count=1 children_count=2 keys=[20] children=[0x7fff5fbff100,0x7fff5fbff300]
[NODE_STATE] MERGED_NODE node=0x7fff5fbff300 is_leaf=true keys_count=1 children_count=0 keys=[30] children=[]
[TREE_REMOVE_COMPLETE] value=40 root=0x7fff5fbff200`;
}

/**
 * Generate sample logs demonstrating search operations
 * @returns {string} Search operation sample logs
 */
export function generateSearchSampleLogs() {
    return `[TREE_INIT] order=4 root=0x7fff5fbff500
[NODE_STATE] INITIAL_ROOT node=0x7fff5fbff500 is_leaf=false keys_count=2 children_count=3 keys=[10,30] children=[0x7fff5fbff510,0x7fff5fbff520,0x7fff5fbff530]
[NODE_STATE] LEFT_CHILD node=0x7fff5fbff510 is_leaf=true keys_count=2 children_count=0 keys=[5,8] children=[]
[NODE_STATE] MIDDLE_CHILD node=0x7fff5fbff520 is_leaf=true keys_count=3 children_count=0 keys=[15,20,25] children=[]
[NODE_STATE] RIGHT_CHILD node=0x7fff5fbff530 is_leaf=true keys_count=2 children_count=0 keys=[35,40] children=[]
[TREE_FIND] value=5 root=0x7fff5fbff500
[find Index] search index for val=5 in node=0x7fff5fbff500: found index=0
[find Index] search index for val=5 in node=0x7fff5fbff510: found index=0
[TREE_FIND_RESULT] value=5 found=true
[TREE_FIND] value=20 root=0x7fff5fbff500
[find Index] search index for val=20 in node=0x7fff5fbff500: found index=1
[find Index] search index for val=20 in node=0x7fff5fbff520: found index=1
[TREE_FIND_RESULT] value=20 found=true
[TREE_FIND] value=50 root=0x7fff5fbff500
[find Index] search index for val=50 in node=0x7fff5fbff500: found index=2
[find Index] search index for val=50 in node=0x7fff5fbff530: found index=2
[TREE_FIND_RESULT] value=50 found=false
[TREE_FIND] value=12 root=0x7fff5fbff500
[find Index] search index for val=12 in node=0x7fff5fbff500: found index=1
[find Index] search index for val=12 in node=0x7fff5fbff520: found index=1
[TREE_FIND_RESULT] value=12 found=false`;
}

/**
 * Get a random sample from available sample data sets
 * @returns {string} Random sample log data
 */
export function getRandomSample() {
    const samples = [
        generateSampleLogs,
        generateComplexSampleLogs,
        generateSearchSampleLogs
    ];
    
    const randomIndex = Math.floor(Math.random() * samples.length);
    return samples[randomIndex]();
}

/**
 * Generate custom sample logs based on parameters
 * @param {Object} params - Parameters for generation
 * @param {number} params.order - B-Tree order
 * @param {Array<number>} params.insertValues - Values to insert
 * @param {Array<number>} params.removeValues - Values to remove
 * @param {Array<number>} params.searchValues - Values to search
 * @returns {string} Custom generated logs
 */
export function generateCustomSample(params = {}) {
    const {
        order = 4,
        insertValues = [10, 20, 5, 30, 15],
        removeValues = [5, 30],
        searchValues = [15, 25]
    } = params;
    
    let logs = `[TREE_INIT] order=${order} root=0x7fff5fbff000\n`;
    logs += `[NODE_STATE] INITIAL_ROOT node=0x7fff5fbff000 is_leaf=true keys_count=0 children_count=0 keys=[] children=[]\n`;
    
    let nodeCounter = 1;
    
    // Generate insertion operations
    for (const value of insertValues) {
        logs += `[TREE_INSERT] value=${value} root=0x7fff5fbff000\n`;
        logs += `[Insert Val] node=0x7fff5fbff000 value=${value}\n`;
        logs += `[TREE_INSERT_COMPLETE] value=${value} root=0x7fff5fbff000\n`;
    }
    
    // Generate search operations
    for (const value of searchValues) {
        logs += `[TREE_FIND] value=${value} root=0x7fff5fbff000\n`;
        const found = insertValues.includes(value) && !removeValues.includes(value);
        logs += `[TREE_FIND_RESULT] value=${value} found=${found}\n`;
    }
    
    // Generate removal operations
    for (const value of removeValues) {
        logs += `[TREE_REMOVE] value=${value} root=0x7fff5fbff000\n`;
        logs += `[Remove Val] node=0x7fff5fbff000 searching=${value}\n`;
        logs += `[TREE_REMOVE_COMPLETE] value=${value} root=0x7fff5fbff000\n`;
    }
    
    return logs;
}

export default {
    generateSampleLogs,
    generateComplexSampleLogs, 
    generateSearchSampleLogs,
    getRandomSample,
    generateCustomSample
};