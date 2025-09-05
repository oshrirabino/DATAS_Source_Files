/**
 * UI Control Module
 * Handles user interface interactions for tree operations
 * 
 * @class TreeUI
 */
class TreeUI {
  /**
   * Creates an instance of TreeUI
   * 
   * @param {Object} communication - TreeCommunication instance
   */
  constructor(communication) {
    this.communication = communication;
    this.isConnected = false;
    
    // Bind methods to preserve context
    this.handleInsert = this.handleInsert.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleFind = this.handleFind.bind(this);
    this.handleClearLogs = this.handleClearLogs.bind(this);
    
    this.initializeUI();
  }
  
  /**
   * Initializes the UI event listeners and state
   */
  initializeUI() {
    // Get UI elements
    this.insertInput = document.getElementById('insert-value');
    this.removeInput = document.getElementById('remove-value');
    this.findInput = document.getElementById('find-value');
    this.insertBtn = document.getElementById('insert-btn');
    this.removeBtn = document.getElementById('remove-btn');
    this.findBtn = document.getElementById('find-btn');
    this.clearLogsBtn = document.getElementById('clear-logs-btn');
    this.logOutput = document.getElementById('log-output');
    
    // Add event listeners
    this.insertBtn.addEventListener('click', this.handleInsert);
    this.removeBtn.addEventListener('click', this.handleRemove);
    this.findBtn.addEventListener('click', this.handleFind);
    this.clearLogsBtn.addEventListener('click', this.handleClearLogs);
    
    // Add Enter key support for input fields
    this.insertInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleInsert();
    });
    
    this.removeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleRemove();
    });
    
    this.findInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleFind();
    });
    
    // Update UI state
    this.updateUIState();
  }
  
  /**
   * Updates UI state based on connection status
   */
  updateUIState() {
    const connected = this.communication && this.communication.getConnectionStatus();
    this.isConnected = connected;
    
    // Enable/disable buttons based on connection
    const buttons = [this.insertBtn, this.removeBtn, this.findBtn];
    buttons.forEach(btn => {
      if (btn) {
        btn.disabled = !connected;
        btn.style.opacity = connected ? '1' : '0.6';
      }
    });
    
    // Update input field states
    const inputs = [this.insertInput, this.removeInput, this.findInput];
    inputs.forEach(input => {
      if (input) {
        input.disabled = !connected;
        input.style.opacity = connected ? '1' : '0.6';
      }
    });
  }
  
  /**
   * Handles insert operation
   */
  handleInsert() {
    if (!this.isConnected) {
      this.showError('Not connected to server');
      return;
    }
    
    const value = this.insertInput.value.trim();
    if (!this.validateInteger(value)) {
      this.showError('Please enter a valid integer');
      return;
    }
    
    const command = `insert ${value}`;
    this.sendCommand(command);
    this.insertInput.value = ''; // Clear input
  }
  
  /**
   * Handles remove operation
   */
  handleRemove() {
    if (!this.isConnected) {
      this.showError('Not connected to server');
      return;
    }
    
    const value = this.removeInput.value.trim();
    if (!this.validateInteger(value)) {
      this.showError('Please enter a valid integer');
      return;
    }
    
    const command = `remove ${value}`;
    this.sendCommand(command);
    this.removeInput.value = ''; // Clear input
  }
  
  /**
   * Handles find operation
   */
  handleFind() {
    if (!this.isConnected) {
      this.showError('Not connected to server');
      return;
    }
    
    const value = this.findInput.value.trim();
    if (!this.validateInteger(value)) {
      this.showError('Please enter a valid integer');
      return;
    }
    
    const command = `find ${value}`;
    this.sendCommand(command);
    this.findInput.value = ''; // Clear input
  }
  
  /**
   * Handles clear logs operation
   */
  handleClearLogs() {
    if (this.logOutput) {
      this.logOutput.innerHTML = '';
    }
  }
  
  /**
   * Validates if input is a valid integer
   * 
   * @param {string} value - Value to validate
   * @returns {boolean} - True if valid integer
   */
  validateInteger(value) {
    if (!value) return false;
    
    // Check if it's a valid integer
    const num = parseInt(value, 10);
    return !isNaN(num) && num.toString() === value;
  }
  
  /**
   * Sends command to server via communication module
   * 
   * @param {string} command - Command to send
   */
  sendCommand(command) {
    if (!this.communication) {
      this.showError('Communication module not available');
      return;
    }
    
    try {
      // Send the command with newline - C++ process expects newline-terminated input
      const commandWithNewline = command + '\n';
      this.communication.send(commandWithNewline);
      this.logToUI(`Sent: ${command}`);
    } catch (error) {
      console.error('Failed to send command:', error);
      this.showError('Failed to send command: ' + error.message);
    }
  }
  
  /**
   * Logs message to UI
   * 
   * @param {string} message - Message to log
   */
  logToUI(message) {
    if (!this.logOutput) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry user-command';
    logEntry.textContent = new Date().toLocaleTimeString() + ': ' + message;
    this.logOutput.appendChild(logEntry);
    this.logOutput.scrollTop = this.logOutput.scrollHeight;
  }
  
  /**
   * Shows error message to user
   * 
   * @param {string} message - Error message
   */
  showError(message) {
    console.error('UI Error:', message);
    
    // Create temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      z-index: 1000;
      animation: fadeIn 0.3s ease-in;
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }
  
  /**
   * Updates connection status
   * 
   * @param {boolean} connected - Connection status
   */
  setConnectionStatus(connected) {
    this.isConnected = connected;
    this.updateUIState();
  }
  
  /**
   * Gets current UI state
   * 
   * @returns {Object} - UI state information
   */
  getUIState() {
    return {
      connected: this.isConnected,
      insertValue: this.insertInput ? this.insertInput.value : '',
      removeValue: this.removeInput ? this.removeInput.value : '',
      findValue: this.findInput ? this.findInput.value : ''
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TreeUI;
}
