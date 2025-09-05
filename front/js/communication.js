/**
 * Tree Communication Module
 * Handles HTTP to WebSocket connection upgrade and message processing
 * 
 * @class TreeCommunication
 */
class TreeCommunication {
  /**
   * Creates an instance of TreeCommunication
   * 
   * @param {Object} options - Configuration options
   * @param {Function} options.onConnect - Callback when connection is established
   * @param {Function} options.onDisconnect - Callback when connection is lost
   * @param {Function} options.onMessage - Callback when message is received
   * @param {Function} options.onError - Callback when error occurs
   * @param {string} options.port - Server port (defaults to '80')
   */
  constructor(options = {}) {
    this.options = {
      onConnect: options.onConnect || (() => {}),
      onDisconnect: options.onDisconnect || (() => {}),
      onMessage: options.onMessage || (() => {}),
      onError: options.onError || (() => {}),
      onAnimationData: options.onAnimationData || (() => {})
    };
    
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.serverPort = options.port || '8080'; // Default to port 8080
    
    // Bind methods to preserve context
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
  }
  
  /**
   * Establishes connection to the server via HTTP then upgrades to WebSocket
   * 
   * @param {string} url - Server URL (defaults to '/session')
   * @param {string} treeType - Tree type: 'btree' or 'avltree'
   */
  connect(url = '/session', treeType = 'btree') {
    if (this.isConnected) {
      console.warn('Already connected to server');
      return;
    }
    
    // Validate tree type
    if (!['btree', 'avltree'].includes(treeType)) {
      const error = new Error('Invalid tree type. Must be "btree" or "avltree"');
      console.error(error.message);
      this.options.onError(error);
      return;
    }
    
    this.treeType = treeType;
    
    try {
      // Go server expects GET request to /session?type=btree, then upgrades to WebSocket
      this.upgradeToWebSocket(url, treeType);
      
    } catch (error) {
      console.error('Failed to create connection:', error);
      this.options.onError(error);
    }
  }
  
  /**
   * Upgrades HTTP connection to WebSocket
   * The Go server handles the HTTP to WebSocket upgrade automatically
   * 
   * @param {string} url - Server URL
   * @param {string} treeType - Tree type: 'btree' or 'avltree'
   */
  upgradeToWebSocket(url, treeType) {
    try {
      // Determine the WebSocket URL with correct port and tree type parameter
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname;
      
      // Construct WebSocket URL with port
      const wsUrl = `${protocol}//${hostname}:${this.serverPort}${url}?type=${treeType}`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      
      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.ws.onopen = this.handleOpen;
      this.ws.onmessage = this.handleMessage;
      this.ws.onclose = this.handleClose;
      this.ws.onerror = this.handleError;
      
    } catch (error) {
      console.error('Failed to upgrade to WebSocket:', error);
      this.options.onError(error);
    }
  }
  
  /**
   * Handles WebSocket connection open event
   * 
   * @param {Event} event - WebSocket open event
   */
  handleOpen(event) {
    console.log('WebSocket connection established');
    console.log('WebSocket ready state:', this.ws.readyState);
    console.log('WebSocket URL:', this.ws.url);
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000; // Reset delay
    
    this.options.onConnect();
  }
  
  /**
   * Handles incoming WebSocket messages
   * 
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    try {
      // Parse the JSON message
      const data = JSON.parse(event.data);
      
      // Validate message structure
      if (!this.isValidMessage(data)) {
        console.warn('Invalid message format received:', data);
        return;
      }
      
      // Log to console as requested
      console.log('Received message:', data);
      
      // Forward to callback
      this.options.onMessage(data);
      
      // Forward to animation system
      this.options.onAnimationData(data);
      
    } catch (error) {
      console.error('Failed to parse message:', error);
      console.log('Raw message data:', event.data);
      this.options.onError(new Error('Invalid JSON received from server'));
    }
  }
  
  /**
   * Handles WebSocket connection close event
   * 
   * @param {CloseEvent} event - WebSocket close event
   */
  handleClose(event) {
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.isConnected = false;
    this.ws = null;
    
    this.options.onDisconnect();
    
    // Attempt to reconnect if it wasn't a manual disconnect
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }
  
  /**
   * Handles WebSocket errors
   * 
   * @param {Event} event - WebSocket error event
   */
  handleError(event) {
    console.error('WebSocket error occurred:', event);
    this.options.onError(new Error('WebSocket connection error'));
  }
  
  /**
   * Validates incoming message structure
   * 
   * @param {Object} data - Message data to validate
   * @returns {boolean} - True if message is valid
   */
  isValidMessage(data) {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.type === 'string' &&
      typeof data.message === 'string' &&
      (data.type === 'program' || data.type === 'log')
    );
  }
  
  /**
   * Schedules a reconnection attempt with exponential backoff
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        console.log(`Reconnection attempt ${this.reconnectAttempts}`);
        this.connect('/session', this.treeType);
      }
    }, delay);
  }
  
  /**
   * Manually disconnects from the server
   */
  disconnect() {
    if (this.ws && this.isConnected) {
      console.log('Manually disconnecting from server');
      this.ws.close(1000, 'Manual disconnect');
    }
  }
  
  /**
   * Sends a message to the server
   * 
   * @param {string} message - Message to send (plain text command)
   */
  send(message) {
    console.log('Attempting to send message:', message);
    console.log('Connection status:', this.isConnected);
    console.log('WebSocket exists:', !!this.ws);
    console.log('WebSocket ready state:', this.ws ? this.ws.readyState : 'N/A');
    
    if (!this.isConnected || !this.ws) {
      console.error('Cannot send message: not connected to server');
      this.options.onError(new Error('Not connected to server'));
      return;
    }
    
    if (this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not open. Ready state:', this.ws.readyState);
      this.options.onError(new Error('WebSocket connection is not open'));
      return;
    }
    
    try {
      // Send as plain text - server forwards to C++ process as stdin
      this.ws.send(message);
      console.log('Successfully sent command:', message);
      console.log('Command length:', message.length);
      console.log('Command bytes:', Array.from(message).map(c => c.charCodeAt(0)));
    } catch (error) {
      console.error('Failed to send message:', error);
      this.options.onError(error);
    }
  }
  
  /**
   * Gets the current connection status
   * 
   * @returns {boolean} - True if connected
   */
  getConnectionStatus() {
    return this.isConnected;
  }
  
  /**
   * Gets connection information
   * 
   * @returns {Object} - Connection details
   */
  getConnectionInfo() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      serverPort: this.serverPort,
      treeType: this.treeType,
      url: this.ws ? this.ws.url : null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TreeCommunication;
}