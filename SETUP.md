# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Get Your Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the generated API key

### Step 3: Configure Environment Variables

Open the `.env` file in the project root and replace the placeholder:

```env
REACT_APP_GEMINI_API_KEY=your-actual-gemini-api-key-here
```

Paste your actual Gemini API key here ☝️

### Step 4: Run the Application

```bash
npm start
```

The app will automatically open at [http://localhost:3000](http://localhost:3000)

## ✅ Verify It's Working

You should see:
- ✅ **Vector Store**: Connected (green)
- ✅ **Power BI**: Connected (green)
- ❌ **Gemini AI**: Disconnected (until you send a message)

The app will automatically:
1. Load dashboard data
2. Analyze for anomalies
3. Show proactive insights

Try asking: **"What patterns do you see in the data?"**

If the AI responds with insights, you're all set! 🎉

## 🔧 Troubleshooting

### "Gemini API key not configured" Error
- Make sure `.env` file exists in the project root
- Verify you replaced `your-gemini-api-key-here` with your actual key
- Restart the dev server: Stop (Ctrl+C) and run `npm start` again

### Changes to .env Not Working
- **Always restart** the development server after changing `.env`
- React only reads environment variables at startup

### API Key Invalid
- Double-check you copied the complete key from Google AI Studio
- Make sure there are no extra spaces or quotes around the key
- Try generating a new API key

## 📋 What Data Is Included?

The app comes with Power BI dashboard data:
- **5 months** of metrics (May-September 2025)
- **4 key metrics**: Port Time Savings, Arrival Accuracy, Bunker Savings, Carbon Abatement
- **Automatic analysis**: Anomaly detection, trend identification, strategic recommendations

The AI can answer questions about:
- Performance trends over time
- Comparisons between months
- Root cause analysis
- Strategic recommendations

## 🎯 Next Steps

- Try the quick prompts in the UI
- Ask questions about port operations, sustainability, or arrival accuracy
- Explore how the AI retrieves historical context using RAG
- Check the strategic pillar badges on AI responses

## 📚 Need More Help?

See the full [README.md](README.md) for detailed documentation.
