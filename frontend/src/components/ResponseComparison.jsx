const ResponseComparison = ({ result }) => {
  return (
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
  );
};

export default ResponseComparison;
