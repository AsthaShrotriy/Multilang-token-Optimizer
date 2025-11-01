const OptimizationForm = ({ 
  query, 
  setQuery, 
  selectedLanguage, 
  setSelectedLanguage, 
  selectedModel, 
  setSelectedModel, 
  models, 
  modelsLoading, 
  loading, 
  handleOptimize 
}) => {
  return (
    <div className="form-card">
      <div className="form-group">
        <label className="label">Your Prompt</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your prompt here..."
          className="textarea"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="label">Target Language</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="select"
          >
            <option value="chinese">🇨🇳 Chinese</option>
            <option value="japanese">🇯🇵 Japanese</option>
            <option value="korean">🇰🇷 Korean</option>
          </select>
        </div>

        <div className="form-group">
          <label className="label">AI Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="select"
          >
            {modelsLoading && <option>Loading models...</option>}
            {!modelsLoading && models.length === 0 && (
              <option value="anthropic.claude-3-haiku-20240307-v1:0">Claude 3 Haiku (fallback)</option>
            )}
            {!modelsLoading && models.map(m => (
              <option key={m.modelId} value={m.modelId}>
                {m.providerName} - {m.modelName || m.modelId}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleOptimize}
        disabled={loading || !query}
        className="button"
      >
        {loading ? '🔄 Optimizing...' : '🚀 Optimize Tokens'}
      </button>
    </div>
  );
};

export default OptimizationForm;
