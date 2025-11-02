import { useEffect, useState } from 'react'
import Header from './components/Header'
import OptimizationForm from './components/OptimizationForm'
import StatsCards from './components/StatsCards'
import ResponseComparison from './components/ResponseComparison'
import DetailedMetrics from './components/DetailedMetrics'
import Toast from './components/Toast'

function App() {
  const [query, setQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('chinese')
  const [selectedModel, setSelectedModel] = useState('')
  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ visible: false, message: '' })

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

  const languageToCode = {
    chinese: { code: 'zh-CN', label: 'Chinese', savings: 50 },
    japanese: { code: 'ja', label: 'Japanese', savings: 70 },
    korean: { code: 'ko', label: 'Korean', savings: 45 }
  }

  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelsLoading(true)
        const resp = await fetch(`${API_BASE_URL}/api/bedrock/models`)
        const data = await resp.json()
        if (resp.ok && data && Array.isArray(data.models)) {
          const textModels = data.models
            .filter(m => (m.outputModalities || []).includes('TEXT'))
            .filter(m => !/rerank|embed|embedding/i.test(m.modelId))
          setModels(textModels)
          // Pick a sensible default if none selected
          if (!selectedModel) {
            const haiku = textModels.find(m => m.modelId.startsWith('anthropic.claude-3-haiku'))
            setSelectedModel(haiku ? haiku.modelId : (textModels[0]?.modelId || ''))
          }
        } else {
          setModels([])
        }
      } catch (e) {
        setModels([])
      } finally {
        setModelsLoading(false)
      }
    }
    loadModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (toast.visible) {
      const t = setTimeout(() => setToast({ visible: false, message: '' }), 4000)
      return () => clearTimeout(t)
    }
  }, [toast.visible])

  const handleOptimize = async () => {
    try {
      setError('')
      setLoading(true)
      const langMeta = languageToCode[selectedLanguage]
      const modelId = selectedModel || 'anthropic.claude-3-haiku-20240307-v1:0'

      const resp = await fetch(`${API_BASE_URL}/api/bedrock/generate-translate`, {
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
        tokenSavings: data.metrics.tokens.savings.percentage,
        costSavings: data.metrics.costs.savings.absolute,
        language: languageToCode[selectedLanguage].label,
        response: data.translatedText,
        targetResponse: data.generatedText,
        metrics: data.metrics
      })
    } catch (e) {
      const msg = e.message || 'Something went wrong'
      setError(msg)
      setToast({ visible: true, message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <Header />
      
      <OptimizationForm
        query={query}
        setQuery={setQuery}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        models={models}
        modelsLoading={modelsLoading}
        loading={loading}
        handleOptimize={handleOptimize}
      />

      <Toast toast={toast} setToast={setToast} />

      {result && (
        <div className="results-card">
          <h2 className="results-title">✨ Optimization Results</h2>
          
          <StatsCards result={result} />
          <ResponseComparison result={result} />
          <DetailedMetrics result={result} />
        </div>
      )}
    </div>
  )
}

export default App
