import { useState } from 'react'

function App() {
  const [query, setQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('chinese')
  const [selectedModel, setSelectedModel] = useState('claude-haiku')
  const [loading, setLoading] = useState(false)

  const handleOptimize = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TokenWise</h1>
          <p className="text-gray-600">Multilanguage Token & Cost Optimizer</p>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your prompt here..."
            className="w-full p-3 border border-gray-300 rounded-lg h-32 mb-4"
          />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg"
            >
              <option value="chinese">Chinese (50% savings)</option>
              <option value="japanese">Japanese (70% savings)</option>
              <option value="korean">Korean (45% savings)</option>
            </select>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg"
            >
              <option value="claude-haiku">Claude 3 Haiku</option>
              <option value="cohere">Cohere Command R</option>
              <option value="mistral">Mistral 8x7B</option>
            </select>
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading || !query}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Optimizing...' : 'Optimize'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App