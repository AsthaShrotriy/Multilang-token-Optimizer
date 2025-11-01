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

  const languageToCode = {
    chinese: { code: 'zh-CN', label: 'Chinese', savings: 50 },
    japanese: { code: 'ja', label: 'Japanese', savings: 70 },
    korean: { code: 'ko', label: 'Korean', savings: 45 }
  }

  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelsLoading(true)
        const resp = await fetch('http://127.0.0.1:5000/api/bedrock/models')
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

      // Create metrics for display
      const mockMetrics = {
        tokens: {
          english: {
            input: Math.ceil(query.length / 4),
            output: Math.ceil(query.length / 4 * 1.2),
            total: Math.ceil(query.length / 4 * 2.2)
          },
          optimized: {
            input: Math.ceil(query.length / 4),
            output: Math.ceil(query.length / 4 * 1.2 * (1 - langMeta.savings/100)),
            total: Math.ceil(query.length / 4 * (2.2 - langMeta.savings/100))
          },
          savings: {
            absolute: Math.ceil(query.length / 4 * langMeta.savings/100 * 1.2),
            percentage: langMeta.savings,
            outputSavingsPercent: langMeta.savings
          }
        },
        costs: {
          english: { total: 0.00234 },
          optimized: { model: 0.00156, translation: 0.00002, total: 0.00158 },
          savings: { absolute: 0.00076, percentage: 32.5 },
          breakEven: Math.ceil(query.length * 1.5)
        },
        performance: {
          processingTime: 1200 + Math.random() * 800,
          estimatedLatencyIncrease: '2.1x',
          recommendedUseCase: 'Viable for batch processing'
        },
        quality: {
          estimatedAccuracy: langMeta.savings === 70 ? 95 : langMeta.savings === 50 ? 92 : 90,
          confidenceScore: 0.85 + Math.random() * 0.1,
          languageComplexity: langMeta.savings === 70 ? 'High' : 'Medium'
        }
      }

      setResult({
        tokenSavings: langMeta.savings,
        costSavings: 0.00076,
        language: langMeta.label,
        response: data.translatedText,
        targetResponse: data.generatedText,
        metrics: mockMetrics
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
