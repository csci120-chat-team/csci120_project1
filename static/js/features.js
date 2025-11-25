// Additional features for WebChat
// Works with socket.js for enhanced functionality

// Ensure we have a socket reference
const socket = window.socket || io();

// Cache DOM elements
const userListElem = document.getElementById('user-list');
const typingIndicator = document.getElementById('typing-indicator');
const messagePanel = document.getElementById('message-panel');
const messageInput = document.getElementById('message-input');
const messageForm = document.getElementById('message-form');

// Get current username from global scope
const currentUsername = window.currentUsername || localStorage.getItem('username') || 'You';

// ----- Active Users: listen for `user_list` -----
// This will work once the server supports it
socket.on('user_list', (users) => {
  if (!userListElem) return;
  
  // Expecting an array of usernames: ['Alice','Bob',...]
  userListElem.innerHTML = '';
  (users || []).forEach(u => {
    const li = document.createElement('li');
    li.textContent = (u === currentUsername) ? `${u} (you)` : u;
    userListElem.appendChild(li);
  });
});

// ----- Typing Indicator: emit + listen -----
// Emit 'typing' while the user types, but debounce to avoid spam
let typingTimer;
const TYPING_EMIT_DELAY_MS = 350;

if (messageInput) {
  messageInput.addEventListener('input', () => {
    // Only emit if we have a username
    if (!window.currentUsername) return;
    
    // Debounce emits
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('typing', { user: window.currentUsername });
    }, TYPING_EMIT_DELAY_MS);
  });
  
  // Clear typing indicator when user submits
  if (messageForm) {
    messageForm.addEventListener('submit', () => {
      clearTimeout(typingTimer);
      if (typingIndicator) {
        typingIndicator.style.display = 'none';
      }
    });
  }
}

// Show "<user> is typing..." when others are typing
// This will work once the server supports it
socket.on('typing', (data) => {
  if (!typingIndicator) return;
  
  const typingUser = data && data.user;
  if (!typingUser || typingUser === window.currentUsername) {
    typingIndicator.style.display = 'none';
    return; // don't show for self
  }
  
  typingIndicator.textContent = `${typingUser} is typing...`;
  typingIndicator.style.display = 'block';

  // Hide after a short timeout
  clearTimeout(typingIndicator._hideTimer);
  typingIndicator._hideTimer = setTimeout(() => {
    typingIndicator.style.display = 'none';
  }, 2000);
});

// Clear typing indicator when a message arrives
socket.on('message', () => {
  if (typingIndicator) {
    typingIndicator.style.display = 'none';
  }
});

// Smooth auto-scroll when a new message arrives
function scrollMessagesToBottom() {
  if (!messagePanel) return;
  messagePanel.scrollTo({ top: messagePanel.scrollHeight, behavior: 'smooth' });
}

// Auto-scroll observer for new messages
if (messagePanel) {
  const observer = new MutationObserver(() => {
    scrollMessagesToBottom();
  });
  observer.observe(messagePanel, { childList: true });
}
