# TokenWise - Multilingual AI Cost Optimizer

Reduce AI API costs by up to 70% using multilingual token optimization with Amazon Bedrock models.

## 🚀 Overview

TokenWise leverages the token efficiency differences between languages to optimize AI costs. By processing queries in token-efficient languages (Chinese, Japanese, Korean) and translating back to English, you can achieve significant cost savings while maintaining response quality.

## 💰 Cost Savings

- **Chinese**: ~50% token savings
- **Japanese**: ~70% token savings  
- **Korean**: ~45% token savings

## 🏗️ Architecture

### Backend (`/backend`)
- **Express.js** server with AWS Bedrock integration
- **Static pricing data** from AWS Bedrock documentation
- **Google Translate API (free)** via `google-translate-api-x` package
- **Comprehensive metrics** calculation

### Frontend (`/frontend`)
- **React + Vite** application
- **Component-based architecture** (Header, OptimizationForm, StatsCards, etc.)
- **Real-time cost analysis** and optimization results
- **Premium glassmorphism UI** design

## 📊 Metrics Provided

### Token Analysis
- Input/output token counts for English vs optimized
- Absolute and percentage token savings
- Output-specific efficiency metrics

### Cost Breakdown  
- Real AWS Bedrock pricing (per million tokens)
- English vs optimized cost comparison
- Break-even analysis for profitability
- Net dollar savings calculation

### Performance Metrics
- Processing time and latency measurements
- Latency impact analysis
- Real-time performance comparison

## 🚀 Deployment

### Easy Deployment (Railway + Netlify)

#### Backend (Railway):
1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → Connect GitHub repo
3. Set environment variables:
   ```
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   ```
4. Deploy automatically

#### Frontend (Netlify):
1. Go to [netlify.com](https://netlify.com) → Import from GitHub
2. Set **Base directory**: `frontend`
3. Set **Build command**: `npm run build`
4. Set **Publish directory**: `frontend/dist`
5. Deploy

### Alternative: Vercel Frontend
Replace Netlify with [vercel.com](https://vercel.com) using same settings.

## 🛠️ Setup

### Prerequisites
- Node.js 16+
- AWS credentials configured
- No additional API keys required (uses free Google Translate)

### Backend Setup
```bash
cd backend
npm install
cp .env.sample .env
# Configure AWS credentials and region
npm run dev    # Development (with auto-reload)
# OR
npm start      # Production
```

### Frontend Setup
```bash
cd frontend  
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/.env`)
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
PORT=5000
```

#### Frontend Environment Files
The frontend automatically uses different API URLs based on environment:

**Development** (`frontend/.env.development`):
```bash
VITE_API_BASE_URL=http://127.0.0.1:5000
```

**Production** (`frontend/.env.production`):
```bash
VITE_API_BASE_URL=https://your-railway-backend-url.railway.app
```

**Fallback** (`frontend/.env`):
```bash
VITE_API_BASE_URL=http://127.0.0.1:5000
```

### Changing Backend URL
To update the backend URL:
1. **For development**: Update `frontend/.env.development`
2. **For production**: Update `frontend/.env.production` or set `VITE_API_BASE_URL` in Netlify environment variables
3. **Redeploy** frontend

### Supported Models
- **Anthropic**: Claude 3.5 Sonnet/Haiku, Claude 3 Opus/Sonnet/Haiku
- **Amazon**: Nova Pro/Lite/Micro, Titan Text Express/Lite
- **Meta**: Llama 3.3, 3.2, 3.1, 3.0, 2.0 (all variants)
- **Mistral**: Large, Mixtral 8x7B, Mistral 7B
- **Cohere**: Command R+/R, Command Light
- **AI21 Labs**: Jamba 1.5, Jurassic-2
- **DeepSeek**: DeepSeek-R1

## 📡 API Endpoints

### `GET /api/bedrock/models`
Returns available Bedrock foundation models

### `POST /api/bedrock/generate-translate`
Optimizes query using multilingual approach
```json
{
  "text": "Your query here",
  "language": "zh-CN",
  "model": "anthropic.claude-3-haiku-20240307-v1:0"
}
```

### `POST /api/translate`
Translates text between languages
```json
{
  "text": "Hello world",
  "targetLang": "zh-CN",
  "sourceLang": "en"
}
```

## 💡 How It Works

1. **Input Analysis**: Calculate baseline English token usage
2. **Language Optimization**: Process query in target language (Chinese/Japanese/Korean)
3. **Translation**: Convert response back to English
4. **Cost Comparison**: Compare costs and calculate savings
5. **Metrics Display**: Show comprehensive optimization results

## 🎯 Use Cases

- **Batch Processing**: High-volume content generation
- **Cost-Sensitive Applications**: Budget-constrained AI workflows
- **Multilingual Content**: Applications serving global audiences
- **Research & Development**: Cost optimization experiments

## 📈 Pricing Information

All pricing data sourced from [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) and may be subject to change. AWS does not provide a programmatic pricing API.

## 🔒 Security

- AWS credentials managed via environment variables or IAM roles
- No API keys stored in frontend code
- Secure HTTPS communication with AWS services

## 🚦 Break-Even Analysis

The system calculates minimum input length required for cost-effectiveness based on:
- Token savings percentage
- Translation overhead costs  
- Model-specific pricing differences

## 🎨 UI Components

- **Header**: Application branding and description
- **OptimizationForm**: Query input and model selection
- **StatsCards**: High-level savings metrics
- **ResponseComparison**: Side-by-side response display
- **DetailedMetrics**: Comprehensive cost and performance analysis

## 🔄 Development

### Component Structure
```
src/
├── App.jsx                 # Main application
├── components/
│   ├── Header.jsx         # App header
│   ├── OptimizationForm.jsx # Input form
│   ├── StatsCards.jsx     # Metrics cards
│   ├── ResponseComparison.jsx # Response display
│   ├── DetailedMetrics.jsx # Detailed analysis
│   └── Toast.jsx          # Error notifications
└── styles.css             # Premium glassmorphism styles
```

### Backend Structure
```
backend/
├── server.js              # Express server
├── .env                   # Environment config
└── package.json           # Dependencies
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Create GitHub issue
- Check AWS Bedrock documentation
- Verify AWS credentials and permissions

---

**TokenWise** - Making AI more affordable through intelligent multilingual optimization.
