const ActionButtons = ({
  showSummarize,
  onSummarize,
  onTranslate,
  selectedLanguage,
  onLanguageChange,
  languages,
  isLoading
}) => {
  return (
    <div className="action-buttons">
      {showSummarize && (
        <button 
          onClick={onSummarize}
          className="summarize-btn"
          aria-label="Summarize text"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Summarize'}
        </button>
      )}
      
      <div className="translate-container">
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          aria-label="Select language"
          disabled={isLoading}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <button 
          onClick={onTranslate}
          className="translate-btn"
          aria-label="Translate text"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Translate'}
        </button>
      </div>
    </div>
  )
}

export default ActionButtons 