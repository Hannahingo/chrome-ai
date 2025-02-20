import { useState } from 'react'
import PropTypes from 'prop-types'
import ActionButtons from './ActionButtons'
import { summarizeText, translateText } from '../utils/chromeAI'

const MessageOutput = ({ message }) => {
  const [summary, setSummary] = useState('')
  const [translation, setTranslation] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'es', name: 'Spanish' },
    { code: 'ru', name: 'Russian' },
    { code: 'tr', name: 'Turkish' },
    { code: 'fr', name: 'French' },
  ]

  const handleSummarize = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const summaryText = await summarizeText(message.text, {
        type: 'key-points',
        format: 'markdown',
        length: 'medium',
        context: 'This is a chat message'
      })
      setSummary(summaryText)
    } catch (err) {
      setError(err.message || 'Failed to summarize text')
      console.error('Summarization error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTranslate = async () => {
    if (selectedLanguage === message.language) {
      setError('Text is already in the selected language')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const translatedText = await translateText(
        message.text,
        selectedLanguage,
        message.language
      )
      setTranslation(translatedText)
    } catch (err) {
      setError(err.message || 'Failed to translate text')
      console.error('Translation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="message-output">
      <div className="message-text">{message.text}</div>
      <div className="message-language">
        Detected language: {message.language}
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <ActionButtons 
        showSummarize={message.showSummarize && message.language === 'en'}
        onSummarize={handleSummarize}
        onTranslate={handleTranslate}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        languages={languages}
        isLoading={isLoading}
      />

      {summary && (
        <div className="message-summary">
          <h4>Summary:</h4>
          <p>{summary}</p>
        </div>
      )}

      {translation && (
        <div className="message-translation">
          <h4>Translation:</h4>
          <p>{translation}</p>
        </div>
      )}
    </div>
  )
}

MessageOutput.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired,
    showSummarize: PropTypes.bool.isRequired
  }).isRequired
}

export default MessageOutput 