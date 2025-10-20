# PSA Strategic Insights AI

An AI-powered chatbot interface for analyzing Port of Singapore Authority (PSA) operational metrics with real-time Power BI integration and intelligent data retrieval using RAG (Retrieval-Augmented Generation).

![React](https://img.shields.io/badge/React-19.2.0-blue)
![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange)
![Power BI](https://img.shields.io/badge/Data-Power%20BI-yellow)

## 🚀 Features

### Core Capabilities
- **🤖 AI-Powered Analysis**: Uses Google Gemini AI for intelligent insights and recommendations
- **📊 Power BI Integration**: Connects to Microsoft Power BI dashboards for live operational data
- **🧠 RAG (Retrieval-Augmented Generation)**: Vector store retrieves historical context to enhance AI responses
- **🎯 Strategic Alignment**: Insights mapped to PSA's four strategic pillars

### Strategic Pillars
1. **Operational Excellence** - Port operations optimization, reduced berth times
2. **Digital Integration** - Real-time data, AI-driven decisions, seamless coordination
3. **Sustainability** - Carbon reduction, fuel optimization, environmental stewardship
4. **Customer-Centric Innovation** - Predictable service, proactive communication

### Key Metrics Tracked
- **Port Time Savings** (%)
- **Arrival Accuracy** (%)
- **Bunker Savings** ($M)
- **Carbon Abatement** (K tonnes)

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/pranavpro9/PSA-Code-Sprint.git
cd PSA-Code-Sprint
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```env
# Required: Google Gemini API Key
REACT_APP_GEMINI_API_KEY=your-actual-gemini-api-key
```

### 4. Get Your Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into your `.env` file

## 🚀 Running the Application

### Development Mode
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

## 📖 Usage

### Quick Start
1. Launch the application
2. Wait for the vector store to initialize (shows "connected" status)
3. Try one of the quick prompts or ask your own question
4. View AI-generated insights with strategic pillar alignment

### Example Queries
- "Analyze current port time savings performance"
- "What are the key trends in arrival accuracy?"
- "Compare bunker savings across recent periods"
- "Provide insights on carbon abatement progress"

### How It Works

The app loads Power BI dashboard data and makes it available for conversational analysis:

1. **Data Loading**: Dashboard metrics are loaded on startup
2. **AI Analysis**: Gemini AI analyzes the data and detects patterns
3. **Proactive Insights**: Automatically identifies anomalies and opportunities
4. **Chat Interface**: Ask questions in natural language to get insights
5. **Recommended Actions**: Every insight includes specific action items

**Current Data Includes**:
- 5 months of performance metrics (May-September 2025)
- Port Time Savings, Arrival Accuracy, Bunker Savings, Carbon Abatement
- Automatic anomaly detection and trend analysis
- Strategic recommendations aligned with PSA pillars

## 🏗️ Architecture

```
┌─────────────────┐
│   React UI      │
│  (Frontend)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────────┐
│Gemini│  │ Power BI  │
│  AI  │  │    API    │
└───┬──┘  └──┬────────┘
    │        │
    └────┬───┘
         │
    ┌────▼────────┐
    │ Vector Store│
    │    (RAG)    │
    └─────────────┘
```

### Key Components
- **App.js**: Main application component with chat interface
- **VectorStore**: In-memory RAG implementation for context retrieval
- **Power BI Integration**: Live data fetching and caching
- **Gemini AI**: Natural language processing and insight generation

## 🔧 Configuration

### Switching AI Providers
The app is configured for Google Gemini. To use a different provider, modify `src/App.js`:
- Update API endpoint in `callGeminiAI()` function
- Adjust request/response format
- Update environment variables

### Power BI Setup (Optional)
1. Create an Azure AD application
2. Grant Power BI API permissions
3. Get workspace and dataset IDs from Power BI Service
4. Add credentials to `.env` file

## 🐛 Troubleshooting

### Common Issues

**"Missing API Key" Error**
- Ensure `.env` file exists in project root
- Verify `REACT_APP_GEMINI_API_KEY` is set
- Restart the development server after changing `.env`

**Data Not Loading**
- Check browser console for errors
- Ensure Gemini API key is configured correctly
- Verify the app has fully loaded (all status indicators green)
- Try refreshing the page

**Dependencies Installation Failed**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Security Vulnerabilities**
```bash
# Fix non-breaking issues
npm audit fix

# Fix all issues (may cause breaking changes)
npm audit fix --force
```

**Tailwind CSS CDN Warning**
- This is a development-only warning
- The app uses Tailwind via CDN for simplicity
- For production, consider installing Tailwind as a PostCSS plugin
- Current setup works fine for demos and development

## 🔒 Security Notes

⚠️ **Important Security Considerations**:
- Never commit `.env` file to version control
- API keys in frontend are visible to users
- For production, implement a backend proxy to secure API calls
- Use environment-specific configurations
- Rotate API keys regularly

## 📦 Dependencies

### Core
- **React** 19.2.0 - UI framework
- **Lucide React** - Icon library
- **TailwindCSS** - Styling (via CDN)

### Testing
- **@testing-library/react** - Component testing
- **@testing-library/jest-dom** - DOM assertions

## 🚧 Known Limitations

1. **Frontend API Calls**: API keys exposed in browser (needs backend proxy)
2. **In-Memory Vector Store**: Data lost on refresh (needs persistent storage)
3. **No Authentication**: Open access (needs user auth)
4. **Limited Error Handling**: Basic error messages (needs improvement)
5. **No Rate Limiting**: Uncontrolled API usage (needs throttling)

## 🛣️ Roadmap

- [ ] Backend API proxy for secure key management
- [ ] Persistent vector store (PostgreSQL + pgvector)
- [ ] User authentication and session management
- [ ] Advanced error handling and retry logic
- [ ] Real-time Power BI streaming
- [ ] Export insights to PDF/Excel
- [ ] Multi-language support
- [ ] Mobile responsive improvements

## 📄 License

This project is private and proprietary.

## 👥 Contributors

- PSA Code Sprint Team

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for PSA International**
