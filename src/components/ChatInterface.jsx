import { useState } from 'react'
import MessageInput from './MessageInput'
import MessageOutput from './MessageOutput'
import { detectLanguage } from '../utils/chromeAI'

const ChatInterface = () => {
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)

  const handleSendMessage = async (text) => {
    if (!text.trim()) return
    setError(null)

    try {
      const detectedLanguage = await detectLanguage(text)
      
      const newMessage = {
        id: Date.now(),
        text,
        language: detectedLanguage,
        showSummarize: text.length > 150,
      }

      setMessages(prev => [...prev, newMessage])
    } catch (err) {
      setError(err.message || 'Failed to process message. Make sure Chrome AI APIs are enabled.')
      console.error('Error processing message:', err)
    }
  }

  const handleClear = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>AI Chat</h2>
        <button 
          onClick={handleClear}
          className="clear-button"
          aria-label="Clear chat"
        >
          Clear Chat
        </button>
      </div>
      {error && (
        <div className="error-message">
          {error.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      )}
      <div className="messages-container">
        {messages.map(message => (
          <MessageOutput 
            key={message.id}
            message={message}
          />
        ))}
      </div>
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  )
}

export default ChatInterface 