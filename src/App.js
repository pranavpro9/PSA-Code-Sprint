import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, RefreshCw, TrendingUp, AlertTriangle, Target, Leaf, Users, Network, ChevronRight, Info, Database, Zap, CheckCircle, XCircle, BarChart3, Calendar } from 'lucide-react';

// Configuration from environment variables
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const POWERBI_CONFIG = {
  clientId: process.env.REACT_APP_POWERBI_CLIENT_ID,
  tenantId: process.env.REACT_APP_POWERBI_TENANT_ID,
  workspaceId: process.env.REACT_APP_POWERBI_WORKSPACE_ID,
  datasetId: process.env.REACT_APP_POWERBI_DATASET_ID,
  clientSecret: process.env.REACT_APP_POWERBI_CLIENT_SECRET
};

// PSA Strategy Pillars
const STRATEGY_PILLARS = {
  operational: {
    name: 'Operational Excellence',
    icon: Target,
    color: 'blue',
    description: 'Optimizing port operations, reducing berth times, and maximizing throughput efficiency'
  },
  digital: {
    name: 'Digital Integration',
    icon: Network,
    color: 'indigo',
    description: 'Connecting terminals globally through real-time data, AI-driven decisions, and seamless coordination'
  },
  sustainability: {
    name: 'Sustainability',
    icon: Leaf,
    color: 'emerald',
    description: 'Reducing carbon emissions, optimizing fuel consumption, and environmental stewardship'
  },
  customer: {
    name: 'Customer-Centric Innovation',
    icon: Users,
    color: 'violet',
    description: 'Delivering predictable, reliable service through data-driven arrival accuracy and proactive communication'
  }
};

// XGBoost-inspired Gradient Boosting Implementation
class SimpleGradientBoosting {
  constructor(nEstimators = 100, learningRate = 0.1, maxDepth = 3) {
    this.nEstimators = nEstimators;
    this.learningRate = learningRate;
    this.maxDepth = maxDepth;
    this.trees = [];
    this.initialPrediction = 0;
  }

  fit(X, y) {
    // Initialize with mean
    this.initialPrediction = y.reduce((a, b) => a + b, 0) / y.length;
    let predictions = new Array(y.length).fill(this.initialPrediction);
    
    // Build trees iteratively
    for (let i = 0; i < this.nEstimators; i++) {
      const residuals = y.map((val, idx) => val - predictions[idx]);
      const tree = this.buildTree(X, residuals, 0);
      this.trees.push(tree);
      
      // Update predictions
      predictions = predictions.map((pred, idx) => 
        pred + this.learningRate * this.predictSingleTree(tree, X[idx])
      );
    }
  }

  buildTree(X, y, depth) {
    if (depth >= this.maxDepth || X.length < 2) {
      return { value: y.reduce((a, b) => a + b, 0) / y.length };
    }

    // Find best split
    let bestSplit = null;
    let bestScore = Infinity;
    
    for (let featureIdx = 0; featureIdx < X[0].length; featureIdx++) {
      const values = X.map(row => row[featureIdx]);
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
      
      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const { left, right } = this.splitData(X, y, featureIdx, threshold);
        
        if (left.y.length === 0 || right.y.length === 0) continue;
        
        const score = this.calculateMSE(left.y) * left.y.length + 
                      this.calculateMSE(right.y) * right.y.length;
        
        if (score < bestScore) {
          bestScore = score;
          bestSplit = { featureIdx, threshold, left, right };
        }
      }
    }

    if (!bestSplit) {
      return { value: y.reduce((a, b) => a + b, 0) / y.length };
    }

    return {
      featureIdx: bestSplit.featureIdx,
      threshold: bestSplit.threshold,
      left: this.buildTree(bestSplit.left.X, bestSplit.left.y, depth + 1),
      right: this.buildTree(bestSplit.right.X, bestSplit.right.y, depth + 1)
    };
  }

  splitData(X, y, featureIdx, threshold) {
    const left = { X: [], y: [] };
    const right = { X: [], y: [] };
    
    for (let i = 0; i < X.length; i++) {
      if (X[i][featureIdx] <= threshold) {
        left.X.push(X[i]);
        left.y.push(y[i]);
      } else {
        right.X.push(X[i]);
        right.y.push(y[i]);
      }
    }
    
    return { left, right };
  }

  calculateMSE(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  predictSingleTree(tree, x) {
    if (tree.value !== undefined) return tree.value;
    
    if (x[tree.featureIdx] <= tree.threshold) {
      return this.predictSingleTree(tree.left, x);
    } else {
      return this.predictSingleTree(tree.right, x);
    }
  }

  predict(X) {
    return X.map(x => {
      let pred = this.initialPrediction;
      for (const tree of this.trees) {
        pred += this.learningRate * this.predictSingleTree(tree, x);
      }
      return pred;
    });
  }
}

// Forecasting Engine with XGBoost
class ForecastingEngine {
  constructor() {
    this.models = {};
    this.scalers = {};
    this.trainingData = null;
  }

  createFeatures(data, targetIdx) {
    const features = [];
    const targets = [];
    const windowSize = 2; // Use last 2 months to predict next month (reduced from 3 for small datasets)

    for (let i = windowSize; i < data.length; i++) {
      const feature = [];
      
      // Lagged features (previous values)
      for (let lag = 1; lag <= windowSize; lag++) {
        feature.push(data[i - lag][targetIdx]);
      }
      
      // Moving average
      const ma = data.slice(i - windowSize, i)
        .reduce((sum, row) => sum + row[targetIdx], 0) / windowSize;
      feature.push(ma);
      
      // Trend (difference from previous)
      if (i > 1) {
        feature.push(data[i - 1][targetIdx] - data[i - 2][targetIdx]);
      } else {
        feature.push(0);
      }
      
      // Time index (seasonality proxy)
      feature.push(i);
      
      features.push(feature);
      targets.push(data[i][targetIdx]);
    }

    return { features, targets };
  }

  normalize(values) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    return {
      normalized: values.map(v => (v - min) / range),
      scaler: { min, max, range }
    };
  }

  denormalize(values, scaler) {
    return values.map(v => v * scaler.range + scaler.min);
  }

  trainModel(data, metricName, metricIdx) {
    try {
      const { features, targets } = this.createFeatures(data, metricIdx);
      
      if (features.length < 2) {
        throw new Error(`Insufficient data for training ${metricName}: need at least 3 data points, got ${data.length}`);
      }

      // Normalize features
      const normalizedTargets = this.normalize(targets);
      this.scalers[metricName] = normalizedTargets.scaler;

      // Train XGBoost-like model
      const model = new SimpleGradientBoosting(50, 0.1, 3);
      model.fit(features, normalizedTargets.normalized);
      
      this.models[metricName] = model;
      this.trainingData = data;

      return { success: true, trainSize: features.length };
    } catch (error) {
      console.error(`Error training ${metricName}:`, error);
      return { success: false, error: error.message };
    }
  }

  forecast(metricName, monthsAhead = 3) {
    if (!this.models[metricName] || !this.trainingData) {
      throw new Error('Model not trained');
    }

    const model = this.models[metricName];
    const scaler = this.scalers[metricName];
    const metricIdx = this.getMetricIndex(metricName);
    const predictions = [];
    
    // Start with last known values
    let currentData = [...this.trainingData];
    const windowSize = 2; // Must match the windowSize in createFeatures

    for (let i = 0; i < monthsAhead; i++) {
      const lastValues = currentData.slice(-windowSize);
      
      // Create features for prediction
      const features = [];
      for (let lag = 1; lag <= windowSize; lag++) {
        features.push(lastValues[windowSize - lag][metricIdx]);
      }
      
      const ma = lastValues.reduce((sum, row) => sum + row[metricIdx], 0) / windowSize;
      features.push(ma);
      
      if (lastValues.length >= 2) {
        features.push(lastValues[windowSize - 1][metricIdx] - lastValues[windowSize - 2][metricIdx]);
      } else {
        features.push(0);
      }
      features.push(currentData.length + i);

      // Predict
      const normalizedPred = model.predict([features])[0];
      const pred = this.denormalize([normalizedPred], scaler)[0];
      
      // Add to predictions
      predictions.push(Math.max(0, pred));
      
      // Update current data with prediction
      const newRow = [...currentData[currentData.length - 1]];
      newRow[metricIdx] = pred;
      currentData.push(newRow);
    }

    return predictions;
  }

  getMetricIndex(metricName) {
    const mapping = {
      'PortTimeSavings': 0,
      'ArrivalAccuracy': 1,
      'BunkerSavings': 2,
      'CarbonAbatement': 3,
      'TotalCalls': 4
    };
    return mapping[metricName];
  }

  calculateConfidenceIntervals(predictions, historicalStd = 2) {
    return predictions.map(pred => ({
      prediction: pred,
      lower: Math.max(0, pred - 1.96 * historicalStd),
      upper: pred + 1.96 * historicalStd
    }));
  }
}

// Vector Store for RAG
class VectorStore {
  constructor() {
    this.documents = [];
    this.embeddings = new Map();
  }

  async addDocument(doc) {
    const id = `doc_${this.documents.length}`;
    this.documents.push({ id, ...doc });
    const keywords = this.extractKeywords(doc.content);
    this.embeddings.set(id, keywords);
    return id;
  }

  extractKeywords(text) {
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but'];
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
  }

  async retrieve(query, topK = 3) {
    const queryKeywords = this.extractKeywords(query);
    const scores = this.documents.map(doc => {
      const docKeywords = this.embeddings.get(doc.id);
      const matches = queryKeywords.filter(k => docKeywords.includes(k)).length;
      return { doc, score: matches };
    });

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.doc);
  }
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredPillar, setHoveredPillar] = useState(null);
  const [powerBIData, setPowerBIData] = useState(null);
  const [showChart, setShowChart] = useState({});
  const [connectionStatus, setConnectionStatus] = useState({
    powerbi: 'disconnected',
    vectorstore: 'initializing',
    gemini: 'disconnected',
    forecasting: 'initializing'
  });
  const [forecastingEngine] = useState(new ForecastingEngine());
  const [modelsReady, setModelsReady] = useState(false);
  const messagesEndRef = useRef(null);
  const vectorStore = useRef(new VectorStore());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeVectorStore();
  }, []);

  const initializeVectorStore = async () => {
    try {
      setConnectionStatus(prev => ({ ...prev, vectorstore: 'connected' }));
      setMessages([{
        type: 'assistant',
        content: 'Hello! I\'m your PSA Strategic Insights AI with real-time dashboard integration and **XGBoost-powered forecasting**.\n\n🔄 Loading dashboard data and training forecasting models...\n\nOnce ready, I can provide insights on current performance and predict future trends for:\n• Port Time Savings\n• Arrival Accuracy\n• Bunker Savings\n• Carbon Abatement\n• Total Calls\n\nJust ask me to forecast any metric!'
      }]);
    } catch (error) {
      console.error('Vector store initialization error:', error);
      setConnectionStatus(prev => ({ ...prev, vectorstore: 'error' }));
    }
  };

  const detectAnomalies = useCallback((data) => {
    const insights = [];
    const rows = data.results[0].tables[0].rows;
    if (rows.length < 2) return insights;

    const current = rows[0];
    const previous = rows[1];
    const allRows = rows;

    const avgPortTime = allRows.reduce((sum, r) => sum + r.PortTimeSavings, 0) / allRows.length;
    const avgCarbon = allRows.reduce((sum, r) => sum + r.CarbonAbatement, 0) / allRows.length;

    const arrivalDrop = previous.ArrivalAccuracy - current.ArrivalAccuracy;
    if (arrivalDrop > 15) {
      insights.push({
        type: 'anomaly',
        title: '🚨 Critical: Arrival Accuracy Declined',
        summary: `Arrival accuracy dropped ${arrivalDrop.toFixed(0)}% from ${previous.ArrivalAccuracy}% (${previous['Date[Month]']}) to ${current.ArrivalAccuracy}% (${current['Date[Month]']})`,
        impact: 'high',
        pillar: 'customer'
      });
    }

    if (current.PortTimeSavings < avgPortTime - 5) {
      insights.push({
        type: 'anomaly',
        title: '⚠️ Port Time Savings Below Target',
        summary: `Current port time savings (${current.PortTimeSavings}%) is ${(avgPortTime - current.PortTimeSavings).toFixed(1)}% below network average`,
        impact: 'medium',
        pillar: 'operational'
      });
    }

    return insights;
  }, []);

  const loadPowerBIData = useCallback(async () => {
    try {
      setConnectionStatus(prev => ({ ...prev, powerbi: 'connecting' }));
      
      if (!POWERBI_CONFIG.clientId || !POWERBI_CONFIG.tenantId) {
        console.log('Power BI credentials not configured, using demo data');
        return loadDemoData();
      }

      console.log('Attempting to connect to Power BI...');
      
      const tokenResponse = await fetch(`https://login.microsoftonline.com/${POWERBI_CONFIG.tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: POWERBI_CONFIG.clientId,
          scope: 'https://analysis.windows.net/powerbi/api/.default',
          grant_type: 'client_credentials',
          client_secret: POWERBI_CONFIG.clientSecret
        })
      });

      if (!tokenResponse.ok) {
        console.log('Falling back to demo data');
        return loadDemoData();
      }

      const { access_token } = await tokenResponse.json();
      
      const daxQuery = {
        queries: [{
          query: `
            EVALUATE
            SUMMARIZECOLUMNS(
              'Date'[Month],
              "PortTimeSavings", AVERAGE('Metrics'[PortTimeSavings]),
              "ArrivalAccuracy", AVERAGE('Metrics'[ArrivalAccuracy]),
              "BunkerSavings", SUM('Metrics'[BunkerSavings]),
              "CarbonAbatement", SUM('Metrics'[CarbonAbatement]),
              "TotalCalls", COUNT('Metrics'[CallID])
            )
            ORDER BY 'Date'[Month] DESC
          `
        }]
      };

      const dataResponse = await fetch(
        `https://api.powerbi.com/v1.0/myorg/groups/${POWERBI_CONFIG.workspaceId}/datasets/${POWERBI_CONFIG.datasetId}/executeQueries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
          },
          body: JSON.stringify(daxQuery)
        }
      );

      if (!dataResponse.ok) {
        console.log('Falling back to demo data');
        return loadDemoData();
      }

      const data = await dataResponse.json();
      setPowerBIData(data);
      setConnectionStatus(prev => ({ ...prev, powerbi: 'connected' }));
      storeDataInVectorStore(data);
      trainForecastingModels(data);
      
      const anomalies = detectAnomalies(data);
      if (anomalies.length > 0) {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: 'I\'ve analyzed your live Power BI dashboard data and detected some important patterns:',
          insights: anomalies
        }]);
      }
      
      return data;
    } catch (error) {
      console.error('Power BI connection error:', error);
      return loadDemoData();
    }
  }, [detectAnomalies]);

  const loadDemoData = useCallback(() => {
    console.log('📊 Loading demo data...');
    const data = {
      results: [{
        tables: [{
          rows: [
            { 'Date[Month]': 'September', PortTimeSavings: 16, ArrivalAccuracy: 61, BunkerSavings: 0.65, CarbonAbatement: 5.5, TotalCalls: 33 },
            { 'Date[Month]': 'August', PortTimeSavings: 18, ArrivalAccuracy: 79, BunkerSavings: 0.87, CarbonAbatement: 7.1, TotalCalls: 35 },
            { 'Date[Month]': 'July', PortTimeSavings: 18, ArrivalAccuracy: 68, BunkerSavings: 0.73, CarbonAbatement: 8.5, TotalCalls: 34 },
            { 'Date[Month]': 'June', PortTimeSavings: 9, ArrivalAccuracy: 72, BunkerSavings: 0.87, CarbonAbatement: 6.1, TotalCalls: 32 },
            { 'Date[Month]': 'May', PortTimeSavings: 20, ArrivalAccuracy: 75, BunkerSavings: 0.95, CarbonAbatement: 8.6, TotalCalls: 36 }
          ]
        }]
      }]
    };
    
    setPowerBIData(data);
    setConnectionStatus(prev => ({ ...prev, powerbi: 'connected' }));
    console.log('✅ Demo data loaded');
    
    storeDataInVectorStore(data);
    trainForecastingModels(data);
    
    return data;
  }, []);

  const trainForecastingModels = async (data) => {
    try {
      console.log('🤖 Starting model training...');
      setConnectionStatus(prev => ({ ...prev, forecasting: 'connecting' }));
      
      const rows = data.results[0].tables[0].rows;
      if (!rows || rows.length < 3) {
        throw new Error(`Insufficient data for training (need at least 3 data points, got ${rows.length})`);
      }

      console.log(`📈 Training with ${rows.length} data points`);

      const trainingData = [...rows].reverse().map(row => [
        row.PortTimeSavings,
        row.ArrivalAccuracy,
        row.BunkerSavings,
        row.CarbonAbatement,
        row.TotalCalls
      ]);

      const metrics = ['PortTimeSavings', 'ArrivalAccuracy', 'BunkerSavings', 'CarbonAbatement', 'TotalCalls'];
      
      let successCount = 0;
      for (let i = 0; i < metrics.length; i++) {
        const result = forecastingEngine.trainModel(trainingData, metrics[i], i);
        if (result.success) {
          successCount++;
          console.log(`✅ ${metrics[i]} model trained (${result.trainSize} samples)`);
        } else {
          console.error(`❌ ${metrics[i]} model training failed:`, result.error);
        }
      }

      if (successCount === metrics.length) {
        setModelsReady(true);
        setConnectionStatus(prev => ({ ...prev, forecasting: 'connected' }));
        console.log(`🎉 All ${successCount} forecasting models trained successfully`);
      } else {
        throw new Error(`Only ${successCount}/${metrics.length} models trained successfully`);
      }
    } catch (error) {
      console.error('❌ Error training forecasting models:', error);
      setConnectionStatus(prev => ({ ...prev, forecasting: 'error' }));
      setModelsReady(false);
    }
  };

  const storeDataInVectorStore = async (data) => {
    try {
      const rows = data.results[0].tables[0].rows;
      
      for (const row of rows) {
        const doc = {
          type: 'live_data',
          category: 'monthly_metrics',
          content: `In ${row['Date[Month]']}, the network achieved ${row.PortTimeSavings}% port time savings, ${row.ArrivalAccuracy}% arrival accuracy, $${row.BunkerSavings}M bunker savings, and ${row.CarbonAbatement}K tonnes carbon abatement across ${row.TotalCalls} total calls.`,
          metadata: {
            month: row['Date[Month]'],
            metrics: {
              portTimeSavings: row.PortTimeSavings,
              arrivalAccuracy: row.ArrivalAccuracy,
              bunkerSavings: row.BunkerSavings,
              carbonAbatement: row.CarbonAbatement,
              totalCalls: row.TotalCalls
            }
          }
        };
        
        await vectorStore.current.addDocument(doc);
      }
    } catch (error) {
      console.error('Error storing data in vector store:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPowerBIData();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [loadPowerBIData]);

  // Separate effect to show ready message when models are trained
  useEffect(() => {
    if (modelsReady && powerBIData) {
      setMessages(prev => {
        // Only add the ready message if it's not already there
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.content?.includes('Dashboard loaded and forecasting models trained')) {
          return prev;
        }
        return [...prev, {
          type: 'assistant',
          content: '✅ **Dashboard loaded and forecasting models trained!**\n\nI\'m now ready to analyze your data and make predictions. Try asking:\n• "Forecast port time savings for next 3 months"\n• "What will arrival accuracy be in 6 months?"\n• "Predict carbon abatement trends"'
        }];
      });
    }
  }, [modelsReady, powerBIData]);

  const detectForecastIntent = (query) => {
    const forecastKeywords = ['forecast', 'predict', 'future', 'projection', 'next', 'upcoming', 'expect', 'trend'];
    const metricMapping = {
      'port time': 'PortTimeSavings',
      'arrival': 'ArrivalAccuracy',
      'bunker': 'BunkerSavings',
      'carbon': 'CarbonAbatement',
      'calls': 'TotalCalls'
    };

    const lowerQuery = query.toLowerCase();
    const hasForecastIntent = forecastKeywords.some(kw => lowerQuery.includes(kw));
    
    if (!hasForecastIntent) return null;

    // Detect metric
    let metric = null;
    for (const [key, value] of Object.entries(metricMapping)) {
      if (lowerQuery.includes(key)) {
        metric = value;
        break;
      }
    }

    // Detect time horizon
    const monthMatch = lowerQuery.match(/(\d+)\s*(month|months)/);
    const months = monthMatch ? parseInt(monthMatch[1]) : 3;

    return { metric, months: Math.min(months, 12) };
  };

  const generateForecast = async (metric, months) => {
    try {
      if (!modelsReady) {
        return {
          type: 'error',
          content: '⏳ Forecasting models are still initializing. Please wait a moment and try again.\n\nThe XGBoost models need to train on historical data before making predictions. This usually takes just a few seconds after the dashboard loads.'
        };
      }

      if (!forecastingEngine.models[metric]) {
        return {
          type: 'error',
          content: `❌ The forecasting model for ${metric} is not available. Available metrics are:\n• Port Time Savings\n• Arrival Accuracy\n• Bunker Savings\n• Carbon Abatement\n• Total Calls`
        };
      }

      const predictions = forecastingEngine.forecast(metric, months);
      const confidenceIntervals = forecastingEngine.calculateConfidenceIntervals(predictions);

      const metricLabels = {
        'PortTimeSavings': 'Port Time Savings (%)',
        'ArrivalAccuracy': 'Arrival Accuracy (%)',
        'BunkerSavings': 'Bunker Savings ($M)',
        'CarbonAbatement': 'Carbon Abatement (K tonnes)',
        'TotalCalls': 'Total Calls'
      };

      const forecastData = {
        metric,
        metricLabel: metricLabels[metric],
        months,
        predictions: confidenceIntervals,
        historicalData: powerBIData.results[0].tables[0].rows.map(r => ({
          month: r['Date[Month]'],
          value: r[metric]
        }))
      };

      return {
        type: 'forecast',
        content: `## ${metricLabels[metric]} Forecast (${months} Months)\n\nBased on historical patterns and XGBoost modeling, here are the predictions:\n\n${confidenceIntervals.map((pred, idx) => 
          `**Month ${idx + 1}**: ${pred.prediction.toFixed(2)} (95% CI: ${pred.lower.toFixed(2)} - ${pred.upper.toFixed(2)})`
        ).join('\n')}\n\nThe model uses gradient boosting with time-series features including lagged values, moving averages, and trend indicators.`,
        forecastData
      };
    } catch (error) {
      console.error('Forecast generation error:', error);
      return {
        type: 'error',
        content: `❌ Unable to generate forecast: ${error.message}\n\nPlease ensure the dashboard has loaded completely and try again.`
      };
    }
  };

  const buildRAGContext = async (query) => {
    const relevantDocs = await vectorStore.current.retrieve(query, 5);
    const currentData = powerBIData?.results?.[0]?.tables?.[0]?.rows?.[0];
    
    const ragContext = relevantDocs.map(doc => 
      `[${doc.type.toUpperCase()}] ${doc.content}`
    ).join('\n\n');

    const liveDataContext = currentData ? `
CURRENT PERIOD LIVE DATA (${currentData['Date[Month]']}):
- Port Time Savings: ${currentData.PortTimeSavings}%
- Arrival Accuracy: ${currentData.ArrivalAccuracy}%
- Bunker Savings: $${currentData.BunkerSavings}M
- Carbon Abatement: ${currentData.CarbonAbatement}K tonnes
- Total Calls: ${currentData.TotalCalls}
` : '';

    return `${liveDataContext}

RETRIEVED HISTORICAL CONTEXT:
${ragContext}

PSA STRATEGIC PILLARS:
1. Operational Excellence
2. Digital Integration
3. Sustainability
4. Customer-Centric Innovation`;
  };

  const callGeminiAI = async (userMessage) => {
    try {
      setConnectionStatus(prev => ({ ...prev, gemini: 'connecting' }));
      
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      const contextWithRAG = await buildRAGContext(userMessage);
      const prompt = `${contextWithRAG}\n\nUser Question: ${userMessage}\n\nProvide detailed analysis referencing specific data points.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000
          }
        })
      });

      if (!response.ok) {
        throw new Error('Gemini API request failed');
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
      
      setConnectionStatus(prev => ({ ...prev, gemini: 'connected' }));

      const pillars = [];
      Object.keys(STRATEGY_PILLARS).forEach(key => {
        if (content.toLowerCase().includes(STRATEGY_PILLARS[key].name.toLowerCase())) {
          pillars.push(key);
        }
      });

      return {
        type: 'success',
        content,
        pillars: [...new Set(pillars)]
      };
    } catch (err) {
      console.error('Gemini API Error:', err);
      setConnectionStatus(prev => ({ ...prev, gemini: 'error' }));
      return {
        type: 'error',
        content: `Error: ${err.message}`,
        pillars: []
      };
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    // Check for forecast intent
    const forecastIntent = detectForecastIntent(userMessage);
    
    let response;
    if (forecastIntent && forecastIntent.metric) {
      response = await generateForecast(forecastIntent.metric, forecastIntent.months);
    } else if (forecastIntent && !forecastIntent.metric) {
      // User wants forecast but didn't specify metric
      response = {
        type: 'clarification',
        content: 'I can forecast any of these metrics for you:\n\n• **Port Time Savings** - Operational efficiency predictions\n• **Arrival Accuracy** - Service reliability forecasts\n• **Bunker Savings** - Fuel cost projections\n• **Carbon Abatement** - Environmental impact trends\n• **Total Calls** - Volume predictions\n\nWhich metric would you like me to forecast? You can also specify how many months ahead (1-12 months).\n\nExample: "Forecast port time savings for the next 3 months"'
      };
    } else {
      response = await callGeminiAI(userMessage);
    }
    
    setMessages(prev => [...prev, { 
      type: 'assistant', 
      content: response.content,
      pillars: response.pillars,
      isError: response.type === 'error',
      forecastData: response.forecastData
    }]);
    setIsLoading(false);
  };

  const quickPrompts = [
    "Forecast port time savings for next 3 months",
    "Predict arrival accuracy trends for 6 months",
    "What will carbon abatement be in the next quarter?",
    "Compare current vs forecasted bunker savings"
  ];

  const resetChat = () => {
    setMessages([{
      type: 'assistant',
      content: 'Chat reset. Ready for analysis and forecasting with XGBoost-powered predictions!'
    }]);
    setShowChart({});
  };

  const extractChartData = (content) => {
    if (!powerBIData?.results?.[0]?.tables?.[0]?.rows) return null;
    
    const rows = powerBIData.results[0].tables[0].rows;
    const contentLower = content.toLowerCase();
    
    if (content.length < 100 || contentLower.includes('hello')) {
      return null;
    }
    
    const metrics = {
      portTimeSavings: (contentLower.includes('port time') && contentLower.includes('%')),
      arrivalAccuracy: (contentLower.includes('arrival') && contentLower.includes('accuracy')),
      bunkerSavings: contentLower.includes('bunker'),
      carbonAbatement: (contentLower.includes('carbon') && contentLower.includes('abatement'))
    };
    
    const mentionedMetrics = Object.entries(metrics).filter(([_, mentioned]) => mentioned);
    
    if (mentionedMetrics.length === 0) return null;
    
    return {
      labels: rows.map(r => r['Date[Month]']).reverse(),
      datasets: mentionedMetrics.map(([key, _]) => {
        const colors = {
          portTimeSavings: { bg: 'rgba(59, 130, 246, 0.5)', border: 'rgb(59, 130, 246)', label: 'Port Time Savings (%)' },
          arrivalAccuracy: { bg: 'rgba(16, 185, 129, 0.5)', border: 'rgb(16, 185, 129)', label: 'Arrival Accuracy (%)' },
          bunkerSavings: { bg: 'rgba(245, 158, 11, 0.5)', border: 'rgb(245, 158, 11)', label: 'Bunker Savings ($M)' },
          carbonAbatement: { bg: 'rgba(34, 197, 94, 0.5)', border: 'rgb(34, 197, 94)', label: 'Carbon Abatement (K tonnes)' }
        };
        
        const color = colors[key];
        const dataKey = key === 'portTimeSavings' ? 'PortTimeSavings' :
                       key === 'arrivalAccuracy' ? 'ArrivalAccuracy' :
                       key === 'bunkerSavings' ? 'BunkerSavings' : 'CarbonAbatement';
        
        return {
          label: color.label,
          data: rows.map(r => r[dataKey]).reverse(),
          backgroundColor: color.bg,
          borderColor: color.border,
          borderWidth: 2,
          tension: 0.4
        };
      })
    };
  };

  const formatAIResponse = (content) => {
    const parseInlineBold = (text) => {
      const parts = [];
      let lastIndex = 0;
      const regex = /\*\*(.*?)\*\*/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[1]}</strong>);
        lastIndex = regex.lastIndex;
      }
      
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : text;
    };

    const lines = content.split('\n');
    const formatted = [];
    let currentList = [];
    let inList = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('##')) {
        if (inList) {
          formatted.push(<ul key={`list-${idx}`} className="space-y-2 my-3 ml-4">{currentList}</ul>);
          currentList = [];
          inList = false;
        }
        const headerText = trimmed.replace(/^##\s*/, '');
        formatted.push(
          <h3 key={idx} className="text-lg font-bold text-gray-900 mt-4 mb-2 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded"></span>
            {parseInlineBold(headerText)}
          </h3>
        );
      }
      else if (trimmed.match(/^(\d+\.|-|\*)\s/)) {
        inList = true;
        const text = trimmed.replace(/^(\d+\.|-|\*)\s/, '');
        currentList.push(
          <li key={`item-${idx}`} className="flex items-start gap-2 text-gray-700">
            <span className="text-blue-600 font-bold mt-0.5">•</span>
            <span>{parseInlineBold(text)}</span>
          </li>
        );
      }
      else if (trimmed) {
        if (inList) {
          formatted.push(<ul key={`list-${idx}`} className="space-y-2 my-3 ml-4">{currentList}</ul>);
          currentList = [];
          inList = false;
        }
        formatted.push(
          <p key={idx} className="mb-3 text-gray-700 leading-relaxed">
            {parseInlineBold(trimmed)}
          </p>
        );
      }
      else if (inList) {
        formatted.push(<ul key={`list-${idx}`} className="space-y-2 my-3 ml-4">{currentList}</ul>);
        currentList = [];
        inList = false;
      }
    });

    if (currentList.length > 0) {
      formatted.push(<ul key="list-final" className="space-y-2 my-3 ml-4">{currentList}</ul>);
    }

    return <div className="space-y-1">{formatted}</div>;
  };

  const ForecastChart = ({ forecastData, messageIdx }) => {
    if (!forecastData) return null;
    
    const width = 800;
    const height = 350;
    const padding = { top: 40, right: 40, bottom: 60, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const historicalValues = forecastData.historicalData.map(d => d.value);
    const forecastValues = forecastData.predictions.map(p => p.prediction);
    const allValues = [...historicalValues, ...forecastValues];
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const valueRange = maxValue - minValue;
    
    const totalPoints = historicalValues.length + forecastValues.length;
    const xStep = chartWidth / (totalPoints - 1);
    
    return (
      <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              {forecastData.metricLabel} - Forecast Visualization
            </h4>
            <p className="text-xs text-gray-600 mt-1">XGBoost-powered predictions with 95% confidence intervals</p>
          </div>
          <button
            onClick={() => setShowChart(prev => ({ ...prev, [messageIdx]: !prev[messageIdx] }))}
            className="px-3 py-1.5 text-sm bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
          >
            {showChart[messageIdx] ? 'Hide' : 'Show'} Chart
          </button>
        </div>
        
        {showChart[messageIdx] && (
          <>
            <svg width={width} height={height} className="mx-auto bg-white rounded-lg">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map(i => {
                const y = padding.top + (chartHeight / 4) * i;
                const value = maxValue - (valueRange / 4) * i;
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="#6b7280"
                      fontWeight="500"
                    >
                      {value.toFixed(1)}
                    </text>
                  </g>
                );
              })}
              
              {/* Vertical separator between historical and forecast */}
              <line
                x1={padding.left + xStep * (historicalValues.length - 1)}
                y1={padding.top}
                x2={padding.left + xStep * (historicalValues.length - 1)}
                y2={height - padding.bottom}
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="8,4"
              />
              
              {/* X-axis labels */}
              {forecastData.historicalData.map((item, i) => {
                const x = padding.left + xStep * i;
                return (
                  <text
                    key={`hist-${i}`}
                    x={x}
                    y={height - padding.bottom + 20}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#4b5563"
                    fontWeight="500"
                  >
                    {item.month.substring(0, 3)}
                  </text>
                );
              })}
              
              {forecastData.predictions.map((_, i) => {
                const x = padding.left + xStep * (historicalValues.length + i);
                return (
                  <text
                    key={`fore-${i}`}
                    x={x}
                    y={height - padding.bottom + 20}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#3b82f6"
                    fontWeight="600"
                  >
                    +{i + 1}m
                  </text>
                );
              })}
              
              {/* Confidence interval shading */}
              {forecastData.predictions.length > 0 && (
                <polygon
                  points={
                    forecastData.predictions.map((pred, i) => {
                      const x = padding.left + xStep * (historicalValues.length + i);
                      const yUpper = padding.top + chartHeight - ((pred.upper - minValue) / valueRange) * chartHeight;
                      return `${x},${yUpper}`;
                    }).join(' ') + ' ' +
                    forecastData.predictions.map((pred, i) => {
                      const x = padding.left + xStep * (historicalValues.length + forecastData.predictions.length - 1 - i);
                      const yLower = padding.top + chartHeight - ((pred.lower - minValue) / valueRange) * chartHeight;
                      return `${x},${yLower}`;
                    }).join(' ')
                  }
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke="none"
                />
              )}
              
              {/* Historical line */}
              <polyline
                points={historicalValues.map((value, i) => {
                  const x = padding.left + xStep * i;
                  const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              
              {/* Forecast line */}
              <polyline
                points={
                  // Connect last historical point to first forecast
                  [[
                    padding.left + xStep * (historicalValues.length - 1),
                    padding.top + chartHeight - ((historicalValues[historicalValues.length - 1] - minValue) / valueRange) * chartHeight
                  ]].concat(
                    forecastData.predictions.map((pred, i) => {
                      const x = padding.left + xStep * (historicalValues.length + i);
                      const y = padding.top + chartHeight - ((pred.prediction - minValue) / valueRange) * chartHeight;
                      return [x, y];
                    })
                  ).map(([x, y]) => `${x},${y}`).join(' ')
                }
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeDasharray="8,4"
              />
              
              {/* Historical data points */}
              {historicalValues.map((value, i) => {
                const x = padding.left + xStep * i;
                const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
                return (
                  <circle
                    key={`hist-point-${i}`}
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#10b981"
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
              
              {/* Forecast data points */}
              {forecastData.predictions.map((pred, i) => {
                const x = padding.left + xStep * (historicalValues.length + i);
                const y = padding.top + chartHeight - ((pred.prediction - minValue) / valueRange) * chartHeight;
                return (
                  <circle
                    key={`fore-point-${i}`}
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
              
              {/* Labels */}
              <text
                x={padding.left + xStep * (historicalValues.length / 2)}
                y={height - 10}
                textAnchor="middle"
                fontSize="13"
                fill="#10b981"
                fontWeight="600"
              >
                Historical Data
              </text>
              
              <text
                x={padding.left + xStep * (historicalValues.length + forecastData.predictions.length / 2)}
                y={height - 10}
                textAnchor="middle"
                fontSize="13"
                fill="#3b82f6"
                fontWeight="600"
              >
                XGBoost Forecast
              </text>
            </svg>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700">Historical Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500" style={{ borderTop: '3px dashed #3b82f6' }}></div>
                <span className="text-sm font-medium text-gray-700">Predicted Values</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-200 opacity-50"></div>
                <span className="text-sm font-medium text-gray-700">95% Confidence Interval</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const SimpleLineChart = ({ data, messageIdx }) => {
    if (!data) return null;
    
    const width = 700;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const allValues = data.datasets.flatMap(d => d.data);
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const valueRange = maxValue - minValue;
    
    return (
      <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Data Visualization
          </h4>
          <button
            onClick={() => setShowChart(prev => ({ ...prev, [messageIdx]: !prev[messageIdx] }))}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showChart[messageIdx] ? 'Hide' : 'Show'} Chart
          </button>
        </div>
        
        {showChart[messageIdx] && (
          <svg width={width} height={height} className="mx-auto">
            {[0, 1, 2, 3, 4].map(i => {
              const y = padding.top + (chartHeight / 4) * i;
              const value = maxValue - (valueRange / 4) * i;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#6b7280"
                  >
                    {value.toFixed(1)}
                  </text>
                </g>
              );
            })}
            
            {data.labels.map((label, i) => {
              const x = padding.left + (chartWidth / (data.labels.length - 1)) * i;
              return (
                <text
                  key={i}
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {label}
                </text>
              );
            })}
            
            {data.datasets.map((dataset, datasetIdx) => {
              const points = dataset.data.map((value, i) => {
                const x = padding.left + (chartWidth / (data.labels.length - 1)) * i;
                const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
                return `${x},${y}`;
              }).join(' ');
              
              return (
                <g key={datasetIdx}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={dataset.borderColor}
                    strokeWidth={dataset.borderWidth}
                    strokeLinejoin="round"
                  />
                  {dataset.data.map((value, i) => {
                    const x = padding.left + (chartWidth / (data.labels.length - 1)) * i;
                    const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        fill={dataset.borderColor}
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        )}
        
        {showChart[messageIdx] && (
          <div className="flex flex-wrap gap-4 mt-3 justify-center">
            {data.datasets.map((dataset, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dataset.borderColor }}
                />
                <span className="text-xs text-gray-600">{dataset.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const StrategyPillarBadge = ({ pillarKey }) => {
    const pillar = STRATEGY_PILLARS[pillarKey];
    const Icon = pillar.icon;
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      violet: 'bg-violet-100 text-violet-700 border-violet-300'
    };

    return (
      <div 
        className="relative inline-block"
        onMouseEnter={() => setHoveredPillar(pillarKey)}
        onMouseLeave={() => setHoveredPillar(null)}
      >
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colors[pillar.color]} cursor-help transition-all hover:shadow-md`}>
          <Icon className="w-3.5 h-3.5" />
          <span>{pillar.name}</span>
          <Info className="w-3 h-3 opacity-60" />
        </div>
        
        {hoveredPillar === pillarKey && (
          <div className="absolute z-50 w-64 mt-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
            <div className="font-semibold mb-1">{pillar.name}</div>
            <div className="text-gray-300 leading-relaxed">{pillar.description}</div>
            <div className="absolute -top-1 left-6 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        )}
      </div>
    );
  };

  const ProactiveInsight = ({ insight }) => {
    const iconMap = {
      'proactive': AlertTriangle,
      'anomaly': AlertTriangle,
      'success': CheckCircle,
      'insight': TrendingUp
    };
    const Icon = iconMap[insight.type] || TrendingUp;
    
    const colorMap = {
      'high': 'border-red-300 bg-red-50',
      'medium': 'border-blue-300 bg-blue-50',
      'low': 'border-green-300 bg-green-50'
    };
    const colors = colorMap[insight.impact] || 'border-gray-300 bg-gray-50';
    
    const iconColorMap = {
      'high': 'text-red-600',
      'medium': 'text-blue-600',
      'low': 'text-green-600'
    };
    const iconColor = iconColorMap[insight.impact] || 'text-gray-600';
    
    return (
      <div className={`border-l-4 ${colors} p-4 rounded-r-lg mb-3`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${iconColor} mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">{insight.title}</h4>
            <p className="text-gray-700 text-sm mb-2">{insight.summary}</p>
            
            {insight.pillar && (
              <div className="mt-3">
                <StrategyPillarBadge pillarKey={insight.pillar} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ConnectionIndicator = ({ service, status }) => {
    const icons = {
      powerbi: Database,
      vectorstore: Zap,
      gemini: Sparkles,
      forecasting: BarChart3
    };
    const Icon = icons[service];
    const statusConfig = {
      connected: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
      connecting: { color: 'text-blue-600', bg: 'bg-blue-100', icon: RefreshCw },
      disconnected: { color: 'text-gray-400', bg: 'bg-gray-100', icon: XCircle },
      error: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
      initializing: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: RefreshCw }
    };
    const config = statusConfig[status];
    const StatusIcon = config.icon;

    const labels = {
      powerbi: 'Power BI',
      vectorstore: 'Vector Store',
      gemini: 'Gemini AI',
      forecasting: 'XGBoost'
    };

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className={`text-xs font-medium ${config.color}`}>{labels[service]}</span>
        <StatusIcon className={`w-3 h-3 ${config.color} ${status === 'connecting' || status === 'initializing' ? 'animate-spin' : ''}`} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">PSA Strategic Insights AI</h1>
                <p className="text-xs text-gray-500">Power BI • RAG-Enhanced • XGBoost Forecasting</p>
              </div>
            </div>
            <button
              onClick={resetChat}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New conversation"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <ConnectionIndicator service="powerbi" status={connectionStatus.powerbi} />
            <ConnectionIndicator service="vectorstore" status={connectionStatus.vectorstore} />
            <ConnectionIndicator service="gemini" status={connectionStatus.gemini} />
            <ConnectionIndicator service="forecasting" status={connectionStatus.forecasting} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {messages.map((message, idx) => (
            <div key={idx} className={`mb-8 ${message.type === 'user' ? 'flex justify-end' : ''}`}>
              {message.type === 'user' ? (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-3xl rounded-tr-md px-6 py-3.5 max-w-xl shadow-lg shadow-blue-500/20">
                  <p className="text-[15px] leading-relaxed">{message.content}</p>
                </div>
              ) : (
                <div className="max-w-full space-y-4">
                  {message.insights && (
                    <div className="space-y-2">
                      {message.insights.map((insight, i) => (
                        <ProactiveInsight key={i} insight={insight} />
                      ))}
                    </div>
                  )}

                  <div className={`${message.isError ? 'bg-red-50 border border-red-200 rounded-2xl p-4' : 'bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-5 shadow-sm'}`}>
                    <div className={`text-[15px] leading-relaxed ${message.isError ? 'text-red-800' : 'text-gray-800'}`}>
                      {formatAIResponse(message.content)}
                    </div>
                  </div>

                  {/* Forecast Chart */}
                  {message.forecastData && (
                    <ForecastChart 
                      forecastData={message.forecastData} 
                      messageIdx={idx}
                    />
                  )}

                  {/* Regular Chart Visualization */}
                  {!message.isError && !message.forecastData && message.content && (
                    <SimpleLineChart 
                      data={extractChartData(message.content)} 
                      messageIdx={idx}
                    />
                  )}

                  {message.pillars && message.pillars.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs text-gray-500 mb-2 font-medium">Strategic Alignment:</div>
                      <div className="flex flex-wrap gap-2">
                        {message.pillars.map(pillarKey => (
                          <StrategyPillarBadge key={pillarKey} pillarKey={pillarKey} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="mb-8">
              <div className="flex items-center gap-3 text-gray-400">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm">Retrieving data and analyzing...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-6 pb-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="text-left text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-3 transition-all group flex items-center justify-between"
                >
                  <span className="text-gray-700 group-hover:text-gray-900">{prompt}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 bg-white sticky bottom-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about your dashboard insights..."
                rows="1"
                className="w-full bg-gray-100 border-0 rounded-2xl px-5 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none text-[15px] text-gray-900 placeholder-gray-500 transition-all"
                style={{ minHeight: '52px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            AI-powered insights from Google Gemini
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
