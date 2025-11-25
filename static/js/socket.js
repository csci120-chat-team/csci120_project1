// Core Socket.IO functionality for WebChat
// Converted from jQuery to vanilla JavaScript

// Create socket connection and expose globally for features.js
window.socket = io();

// Store current username globally
window.currentUsername = null;

// Cache DOM elements
const userDisplay = document.getElementById('user-display');
const messagePanel = document.getElementById('message-panel');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

// Load notification sound
const messageSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to render a message
function renderMessage(data) {
  const safeUser = escapeHtml(data.user);
  const safeMsg = escapeHtml(data.msg);
  
  // Determine if message is from current user
  const isSelf = data.user === window.currentUsername;
  const msgClass = isSelf ? 'self' : 'other';
  
  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${msgClass}`;
  messageDiv.innerHTML = `<strong>${safeUser}</strong>${safeMsg}`;
  
  // Append to message panel
  messagePanel.appendChild(messageDiv);
  
  // Auto-scroll to bottom
  messagePanel.scrollTop = messagePanel.scrollHeight;
  
  // Play notification sound (for all messages)
  messageSound.currentTime = 0;
  messageSound.play().catch(() => {
    // Ignore autoplay restrictions
  });
}

// When connected to the server
window.socket.on('connect', function() {
  // Prompt for username
  let username = prompt("Enter your username:");
  if (!username || username.trim() === "") {
    username = "Anonymous";
  }
  username = username.trim();
  
  // Store username globally
  window.currentUsername = username;
  
  // Show username in header
  if (userDisplay) {
    userDisplay.textContent = "Logged in as: " + username;
  }
  
  // Notify server that this user joined
  window.socket.emit('join', { username: username });
});

// Handle message submission
if (messageForm) {
  messageForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Stop page reload
    
    const message = messageInput.value.trim();
    if (message === "" || !window.currentUsername) return; // Ignore empty messages
    
    // Send message to server
    window.socket.emit('message', { 
      user: window.currentUsername, 
      msg: message 
    });
    
    // Clear input field
    messageInput.value = '';
  });
}

// When receiving a message from server
window.socket.on('message', function(data) {
  if (data && data.user && data.msg) {
    renderMessage(data);
  }
});

// Handle server error event
window.socket.on('error', function(data) {
  if (data && data.message) {
    alert(data.message);
  }
});

