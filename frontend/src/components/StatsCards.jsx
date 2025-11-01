const StatsCards = ({ result }) => {
  return (
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
  );
};

export default StatsCards;
