import { useState } from 'react'

function App() {
  const [query, setQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('chinese')
  const [selectedModel, setSelectedModel] = useState('claude-haiku')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleOptimize = () => {
    setLoading(true)
    setTimeout(() => {
      setResult({
        tokenSavings: 65,
        costSavings: 0.0045,
        language: 'Chinese',
        response: 'This is the optimized response translated back to English. It contains the same information but was generated using fewer tokens by leveraging the efficiency of Chinese tokenization.',
        targetResponse: '这是优化后的中文回复。它包含相同的信息，但通过利用中文标记化的效率使用更少的标记生成。'
      })
      setLoading(false)
    }, 2000)
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
              <h3>🌏 Target Language</h3>
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
