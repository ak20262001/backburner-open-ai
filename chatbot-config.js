/**
 * CHATBOT CONFIGURATION & LOGIC
 * File ini berisi semua konfigurasi dan logic chatbot
 * Terintegrasi dengan Python backend
 */

// ==================== KONFIGURASI DASAR ====================
const CHATBOT_CONFIG = {
  // Backend URL - Ubah sesuai dengan alamat Python server Anda
  API_URL: 'http://localhost:5000/api/chat', // Flask/Django URL
  
  // Konfigurasi UI
  UI: {
    botName: '🤖 Nexus Assistant',
    botEmoji: '💬',
    placeholder: 'Tanya tentang produk...',
    position: {
      bottom: '20px',
      right: '20px',
    },
  },

  // Warna & Styling
  COLORS: {
    primary: '#4f46e5',
    secondary: '#7c3aed',
    background: '#f8fafc',
    darkBg: '#0f172a',
    userMessage: '#4f46e5',
    botMessage: '#ffffff',
  },

  // Timeout untuk response
  TIMEOUT: 30000, // 30 detik

  // Pesan default
  MESSAGES: {
    welcome: 'Halo! 👋 Apa yang bisa saya bantu Anda hari ini?',
    typing: 'Mengetik...',
    error: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
    offline: 'Chatbot sedang offline. Silakan coba lagi nanti.',
  },
};

// ==================== STATE MANAGEMENT ====================
const CHATBOT_STATE = {
  isOpen: false,
  messages: [],
  isLoading: false,
  conversationId: generateConversationId(),
};

/**
 * Generate unique conversation ID
 */
function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== INITIALIZATION ====================
/**
 * Initialize chatbot
 */
function initializeChatbot() {
  // Load message history from localStorage
  loadMessageHistory();

  // Add welcome message if empty
  if (CHATBOT_STATE.messages.length === 0) {
    addBotMessage(CHATBOT_CONFIG.MESSAGES.welcome, true);
  }

  // Setup event listeners
  setupEventListeners();

  console.log('✅ Chatbot initialized successfully');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Input field focus handling
  const input = document.getElementById('chatbot-input');
  if (input) {
    input.addEventListener('focus', () => {
      scrollMessagesToBottom();
    });
  }
}

// ==================== MAIN CHATBOT FUNCTIONS ====================
/**
 * Toggle chatbot visibility
 */
function toggleChatbot() {
  const chatbot = document.getElementById('nexus-chatbot');
  const button = document.getElementById('chatbot-toggle');

  if (!chatbot) return;

  CHATBOT_STATE.isOpen = !CHATBOT_STATE.isOpen;

  if (CHATBOT_STATE.isOpen) {
    chatbot.classList.add('chatbot-open');
    document.getElementById('chatbot-input')?.focus();
  } else {
    chatbot.classList.remove('chatbot-open');
  }
}

/**
 * Handle chatbot input
 * @param {string} message - User message
 */
async function handleChatbotInput(message) {
  if (!message.trim() || CHATBOT_STATE.isLoading) return;

  // Clear input
  const input = document.getElementById('chatbot-input');
  if (input) input.value = '';

  // Add user message to chat
  addUserMessage(message);

  // Set loading state
  CHATBOT_STATE.isLoading = true;
  showTypingIndicator();

  try {
    // Send message to backend
    const response = await sendMessageToBackend(message);

    // Remove typing indicator
    removeTypingIndicator();

    // Add bot response
    addBotMessage(response, false);

    // Save message history
    saveMessageHistory();
  } catch (error) {
    console.error('Error:', error);
    removeTypingIndicator();
    addBotMessage(CHATBOT_CONFIG.MESSAGES.error, false);
  } finally {
    CHATBOT_STATE.isLoading = false;
  }
}

/**
 * Send message to Python backend
 * @param {string} message - User message
 * @returns {Promise<string>} - Bot response
 */
async function sendMessageToBackend(message) {
  const payload = {
    message: message,
    conversationId: CHATBOT_STATE.conversationId,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(CHATBOT_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: CHATBOT_CONFIG.TIMEOUT,
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || CHATBOT_CONFIG.MESSAGES.error;
  } catch (error) {
    console.error('Backend Error:', error);

    // Fallback response jika backend tidak available
    return generateFallbackResponse(message);
  }
}

/**
 * Generate fallback response ketika backend tidak tersedia
 * @param {string} message - User message
 * @returns {string} - Fallback response
 */
function generateFallbackResponse(message) {
  const fallbackResponses = [
    'Maaf, saya tidak dapat terhubung ke server. Silakan coba lagi nanti.',
    'Sepertinya koneksi terputus. Periksa kembali atau hubungi support.',
    'Backend sedang maintenance. Coba lagi dalam beberapa menit.',
  ];

  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

// ==================== MESSAGE DISPLAY ====================
/**
 * Add user message to chat
 * @param {string} message - Message content
 */
function addUserMessage(message) {
  CHATBOT_STATE.messages.push({
    type: 'user',
    content: message,
    timestamp: new Date(),
  });

  renderMessage('user', message);
  scrollMessagesToBottom();
}

/**
 * Add bot message to chat
 * @param {string} message - Message content
 * @param {boolean} isWelcome - Is welcome message
 */
function addBotMessage(message, isWelcome = false) {
  CHATBOT_STATE.messages.push({
    type: 'bot',
    content: message,
    timestamp: new Date(),
    isWelcome: isWelcome,
  });

  renderMessage('bot', message);
  scrollMessagesToBottom();
}

/**
 * Render message in chat
 * @param {string} type - 'user' or 'bot'
 * @param {string} content - Message content
 */
function renderMessage(type, content) {
  const messagesContainer = document.getElementById('chatbot-messages');
  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `chatbot-message ${type}-message`;

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = content;

  const messageTime = document.createElement('div');
  messageTime.className = 'message-time';
  messageTime.textContent = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  messageDiv.appendChild(messageContent);
  messageDiv.appendChild(messageTime);
  messagesContainer.appendChild(messageDiv);
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
  const messagesContainer = document.getElementById('chatbot-messages');
  if (!messagesContainer) return;

  const typingDiv = document.createElement('div');
  typingDiv.className = 'chatbot-message bot-message';
  typingDiv.id = 'typing-indicator';

  typingDiv.innerHTML = `
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  messagesContainer.appendChild(typingDiv);
  scrollMessagesToBottom();
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

/**
 * Scroll messages to bottom
 */
function scrollMessagesToBottom() {
  const messagesContainer = document.getElementById('chatbot-messages');
  if (messagesContainer) {
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 0);
  }
}

// ==================== HISTORY MANAGEMENT ====================
/**
 * Save message history to localStorage
 */
function saveMessageHistory() {
  try {
    localStorage.setItem(
      `chatbot_history_${CHATBOT_STATE.conversationId}`,
      JSON.stringify(CHATBOT_STATE.messages)
    );
  } catch (error) {
    console.error('Error saving message history:', error);
  }
}

/**
 * Load message history from localStorage
 */
function loadMessageHistory() {
  try {
    const saved = localStorage.getItem(
      `chatbot_history_${CHATBOT_STATE.conversationId}`
    );
    if (saved) {
      CHATBOT_STATE.messages = JSON.parse(saved);
      renderAllMessages();
    }
  } catch (error) {
    console.error('Error loading message history:', error);
  }
}

/**
 * Render all messages from state
 */
function renderAllMessages() {
  const messagesContainer = document.getElementById('chatbot-messages');
  if (!messagesContainer) return;

  messagesContainer.innerHTML = '';

  CHATBOT_STATE.messages.forEach((msg) => {
    renderMessage(msg.type, msg.content);
  });
}

/**
 * Clear chat history
 */
function clearChatbotHistory() {
  const confirmed = confirm('Apakah Anda yakin ingin menghapus riwayat chat?');
  if (!confirmed) return;

  CHATBOT_STATE.messages = [];
  CHATBOT_STATE.conversationId = generateConversationId();

  const messagesContainer = document.getElementById('chatbot-messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
  }

  // Clear localStorage
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('chatbot_history_'))
      .forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing history:', error);
  }

  // Add welcome message
  addBotMessage(CHATBOT_CONFIG.MESSAGES.welcome, true);
}

// ==================== KEYBOARD HANDLING ====================
/**
 * Handle keypress in input field
 * @param {KeyboardEvent} event
 */
function handleChatbotKeypress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendChatbotMessage();
  }
}

/**
 * Send message from input field
 */
function sendChatbotMessage() {
  const input = document.getElementById('chatbot-input');
  if (!input) return;

  const message = input.value.trim();
  if (message) {
    handleChatbotInput(message);
  }
}

// ==================== UTILITY FUNCTIONS ====================
/**
 * Update API URL (untuk testing atau konfigurasi dinamis)
 * @param {string} newUrl - New API URL
 */
function updateChatbotApiUrl(newUrl) {
  CHATBOT_CONFIG.API_URL = newUrl;
  console.log('API URL updated to:', newUrl);
}

/**
 * Get conversation history
 * @returns {Array} - Message history
 */
function getChatbotHistory() {
  return CHATBOT_STATE.messages;
}

/**
 * Export conversation as JSON
 * @returns {string} - JSON string of conversation
 */
function exportChatbotConversation() {
  return JSON.stringify(CHATBOT_STATE.messages, null, 2);
}

/**
 * Get chatbot status
 * @returns {Object} - Current chatbot state
 */
function getChatbotStatus() {
  return {
    isOpen: CHATBOT_STATE.isOpen,
    isLoading: CHATBOT_STATE.isLoading,
    messagesCount: CHATBOT_STATE.messages.length,
    conversationId: CHATBOT_STATE.conversationId,
  };
}

// ==================== AUTO INITIALIZE ====================
// Initialize ketika DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initializeChatbot();
});