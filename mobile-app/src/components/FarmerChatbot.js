import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';

const BOT_RESPONSES = {
  "hello": "Hello! I am your HerBlock Farm Assistant 🌿. How can I help you today?",
  "hi": "Hi there! Need help with your herb collection?",
  "help": "I can help you with:\n1. How to capture photos\n2. Geofence errors\n3. Syncing offline data",
  "photo": "To capture a photo, tap 'Capture Live Photo' on the New Collection screen. Make sure the herb is clearly visible in the frame.",
  "location": "Your GPS location is required to verify your farm. Make sure you are within 500 meters of your registered farm location!",
  "geofence": "If you get a 'Fraud Detected' error, it means your current GPS is more than 500m away from the farm you originally registered.",
  "offline": "No internet? No problem! The app will save your collection locally. Just press 'Sync' on the dashboard when you get back to Wi-Fi.",
  "sync": "Go to the Pending Sync screen from your dashboard to upload any collections you saved while offline.",
  "default": "I'm a simple assistant! Try asking about 'photo', 'location', 'geofence', 'offline', or 'sync'."
};

export default function FarmerChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: "Namaste! I am your HerBlock Assistant 🌿. How can I help you with your harvest today?", sender: 'bot' }
  ]);
  const scrollViewRef = useRef();

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage = { id: Date.now().toString(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    // Simple logic to find a response
    const lowerInput = inputText.toLowerCase();
    let botResponseText = BOT_RESPONSES["default"];
    
    for (const key in BOT_RESPONSES) {
      if (lowerInput.includes(key)) {
        botResponseText = BOT_RESPONSES[key];
        break;
      }
    }

    const botMessage = { id: (Date.now() + 1).toString(), text: botResponseText, sender: 'bot' };
    
    setInputText('');
    
    // Simulate thinking delay
    setTimeout(() => {
      setMessages(prev => [...prev, botMessage]);
    }, 600);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <TouchableOpacity style={styles.fab} onPress={() => setIsOpen(true)}>
          <Text style={styles.fabText}>💬</Text>
        </TouchableOpacity>
      )}

      {/* Chat Modal */}
      <Modal visible={isOpen} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          style={styles.modalContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.chatBox}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>🌿 Farm Assistant</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>X</Text>
              </TouchableOpacity>
            </View>

            {/* Messages Area */}
            <ScrollView 
              style={styles.messagesContainer}
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
            >
              {messages.map((msg) => (
                <View 
                  key={msg.id} 
                  style={[
                    styles.messageBubble, 
                    msg.sender === 'user' ? styles.userBubble : styles.botBubble
                  ]}
                >
                  <Text style={[
                    styles.messageText, 
                    msg.sender === 'user' ? styles.userText : styles.botText
                  ]}>
                    {msg.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask for help..."
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#10B981',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 999,
  },
  fabText: {
    fontSize: 28,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chatBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F0FDF4',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#10B981',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#1F2937',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
