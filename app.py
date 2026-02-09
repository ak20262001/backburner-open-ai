from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Simple in-memory storage untuk konversasi
conversations = {}

@app.route('/api/chat', methods=['POST'])
def handle_chat():
    """
    Endpoint untuk menerima pesan dari chatbot
    """
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        conversation_id = data.get('conversationId', '')
        
        if not message:
            return jsonify({'error': 'Message is empty'}), 400
        
        # Simpan pesan dalam memory
        if conversation_id not in conversations:
            conversations[conversation_id] = []
        
        conversations[conversation_id].append({
            'role': 'user',
            'content': message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Generate response (contoh sederhana)
        # Ganti dengan logic AI Anda (OpenAI, Gemini, dll)
        reply = generate_bot_response(message, conversation_id)
        
        # Simpan response
        conversations[conversation_id].append({
            'role': 'assistant',
            'content': reply,
            'timestamp': datetime.now().isoformat()
        })
        
        return jsonify({
            'reply': reply,
            'conversationId': conversation_id,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_bot_response(message, conversation_id):
    """
    Generate bot response
    Anda bisa mengganti ini dengan OpenAI API, Gemini, atau logic lainnya
    """
    
    # Contoh sederhana - ganti dengan AI logic Anda
    message_lower = message.lower()
    
    responses = {
        'halo': 'Halo! Apa kabar Anda?',
        'apa': 'Saya adalah Nexus Assistant, siap membantu Anda.',
        'bantuan': 'Saya bisa membantu menjawab pertanyaan tentang produk kami.',
    }
    
    # Cari response yang sesuai
    for keyword, response in responses.items():
        if keyword in message_lower:
            return response
    
    # Default response
    return f"Terima kasih atas pertanyaan Anda: '{message}'. Tim kami sedang memproses jawaban Anda."

@app.route('/api/conversation/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """
    Get conversation history
    """
    if conversation_id in conversations:
        return jsonify({'messages': conversations[conversation_id]})
    return jsonify({'messages': []})

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(debug=True, port=5000)