const DetailedMetrics = ({ result }) => {
  if (!result.metrics) return null;

  return (
    <div className="metrics-section">
      {/* Token Comparison */}
      <div className="metric-group">
        <h3 className="metric-title">📊 Token Analysis</h3>
        <div className="metric-grid">
          <div className="metric-card baseline">
            <h4 className="metric-card-title">English Baseline</h4>
            <div className="metric-details">
              <div className="metric-item">
                <span>Input:</span>
                <span className="metric-value">{result.metrics.tokens.english.input} tokens</span>
              </div>
              <div className="metric-item">
                <span>Output:</span>
                <span className="metric-value">{result.metrics.tokens.english.output} tokens</span>
              </div>
              <div className="metric-item total">
                <span>Total:</span>
                <span className="metric-value">{result.metrics.tokens.english.total} tokens</span>
              </div>
            </div>
          </div>
          <div className="metric-card optimized">
            <h4 className="metric-card-title">Optimized ({result.language})</h4>
            <div className="metric-details">
              <div className="metric-item">
                <span>Input:</span>
                <span className="metric-value">{result.metrics.tokens.optimized.input} tokens</span>
              </div>
              <div className="metric-item">
                <span>Output:</span>
                <span className="metric-value">{result.metrics.tokens.optimized.output} tokens</span>
              </div>
              <div className="metric-item total">
                <span>Total:</span>
                <span className="metric-value">{result.metrics.tokens.optimized.total} tokens</span>
              </div>
              <div className="metric-item savings">
                <span>Saved:</span>
                <span className="metric-value">{result.metrics.tokens.savings.absolute} tokens ({result.metrics.tokens.savings.percentage}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="metric-group">
        <h3 className="metric-title">💰 Cost Breakdown</h3>
        <div className="cost-grid">
          <div className="cost-card english-cost">
            <h4 className="cost-title">English Cost</h4>
            <div className="cost-amount">${result.metrics.costs.english.total}</div>
            <div className="cost-subtitle">Model only</div>
          </div>
          <div className="cost-card optimized-cost">
            <h4 className="cost-title">Optimized Cost</h4>
            <div className="cost-amount">${result.metrics.costs.optimized.total}</div>
            <div className="cost-breakdown">
              <div>Model: ${result.metrics.costs.optimized.model}</div>
              <div>Translation: ${result.metrics.costs.optimized.translation}</div>
            </div>
          </div>
          <div className="cost-card savings-cost">
            <h4 className="cost-title">Net Savings</h4>
            <div className="cost-amount">${result.metrics.costs.savings.absolute}</div>
            <div className="cost-subtitle">{result.metrics.costs.savings.percentage}% saved</div>
          </div>
        </div>
      </div>

      {/* Performance & Quality */}
      <div className="metric-group">
        <h3 className="metric-title">⚡ Performance & Quality</h3>
        <div className="performance-grid">
          <div className="perf-card">
            <div className="perf-label">Processing Time</div>
            <div className="perf-value">{Math.round(result.metrics.performance.processingTime)}ms</div>
          </div>
          <div className="perf-card">
            <div className="perf-label">Latency Impact</div>
            <div className="perf-value">{result.metrics.performance.estimatedLatencyIncrease}</div>
          </div>
          <div className="perf-card">
            <div className="perf-label">Quality Score</div>
            <div className="perf-value">{result.metrics.quality.estimatedAccuracy}%</div>
          </div>
          <div className="perf-card">
            <div className="perf-label">Confidence</div>
            <div className="perf-value">{Math.round(result.metrics.quality.confidenceScore * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="metric-group">
        <h3 className="metric-title">💡 Analysis & Recommendations</h3>
        <div className="recommendations-card">
          <div className="rec-grid">
            <div className="rec-item">
              <strong>Use Case:</strong><br/>
              {result.metrics.performance.recommendedUseCase}
            </div>
            <div className="rec-item">
              <strong>Break-even:</strong><br/>
              {result.metrics.costs.breakEven} characters minimum
            </div>
            <div className="rec-item">
              <strong>Complexity:</strong><br/>
              {result.metrics.quality.languageComplexity} for {result.language}
            </div>
            <div className="rec-item">
              <strong>Output Efficiency:</strong><br/>
              {result.metrics.tokens.savings.outputSavingsPercent}% reduction
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedMetrics;
