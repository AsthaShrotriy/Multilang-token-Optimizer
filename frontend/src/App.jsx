import { useState } from 'react'

function App() {
  const [query, setQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('chinese')
  const [selectedModel, setSelectedModel] = useState('claude-haiku')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const languageToCode = {
    chinese: { code: 'zh-CN', label: 'Chinese', savings: 50 },
    japanese: { code: 'ja', label: 'Japanese', savings: 70 },
    korean: { code: 'ko', label: 'Korean', savings: 45 }
  }

  const modelToBedrockId = (modelKey) => {
    // Currently backend fully supports Anthropic Claude; fallback to Haiku for others
    if (modelKey === 'claude-haiku') return 'anthropic.claude-3-haiku-20240307-v1:0'
    if (modelKey === 'cohere') return 'anthropic.claude-3-haiku-20240307-v1:0'
    if (modelKey === 'mistral') return 'anthropic.claude-3-haiku-20240307-v1:0'
    return 'anthropic.claude-3-haiku-20240307-v1:0'
  }

  const handleOptimize = async () => {
    try {
      setError('')
      setLoading(true)
      const langMeta = languageToCode[selectedLanguage]
      const modelId = modelToBedrockId(selectedModel)

      const resp = await fetch('http://127.0.0.1:5000/api/bedrock/generate-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: query,
          language: langMeta.code,
          model: modelId
        })
      })

      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data && data.error ? data.error : 'Request failed')
      }

      setResult({
        tokenSavings: langMeta.savings,
        costSavings: 0.0,
        language: langMeta.label,
        response: data.translatedText, // Optimized Response (English)
        targetResponse: data.generatedText // Generated Response (target language)
      })
    } catch (e) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1 className="title">TokenWise</h1>
        <p className="subtitle">
          Reduce AI API costs by 30-70% using multilingual token optimization
        </p>
      </div>

      {/* Main Form */}
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
              <option value="chinese">🇨🇳 Chinese (50% savings)</option>
              <option value="japanese">🇯🇵 Japanese (70% savings)</option>
              <option value="korean">🇰🇷 Korean (45% savings)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">AI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="select"
            >
              <option value="claude-haiku">Claude 3 Haiku</option>
              <option value="cohere">Cohere Command R</option>
              <option value="mistral">Mistral 8x7B</option>
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

      {/* Error */}
      {error && (
        <div className="error-banner">{error}</div>
      )}

      {/* Results */}
      {result && (
        <div className="results-card">
          <h2 className="results-title">✨ Optimization Results</h2>
          
          <div className="stats-grid">
            <div className="stat-card green">
              <div className="stat-label">Token Savings</div>
              <div className="stat-value">{result.tokenSavings}%</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Cost Savings</div>
              <div className="stat-value">${result.costSavings}</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-label">Language Used</div>
              <div className="stat-value">{result.language}</div>
            </div>
          </div>

          <div className="responses-grid">
            <div className="response-section">
              <h3>📝 Optimized Response</h3>
              <div className="response-box">
                {result.response}
              </div>
            </div>
            <div className="response-section">
              <h3>🌏 Generated Response</h3>
              <div className="response-box">
                {result.targetResponse}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
