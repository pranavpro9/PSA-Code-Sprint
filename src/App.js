import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, RefreshCw, TrendingUp, AlertTriangle, Target, Leaf, Users, Network, ChevronRight, Info, Database, Zap, CheckCircle, XCircle } from 'lucide-react';

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

// Vector Store for RAG (in-memory implementation)
class VectorStore {
  constructor() {
    this.documents = [];
    this.embeddings = new Map();
  }

  // Simplified embedding using text similarity (in production, use OpenAI embeddings)
  async addDocument(doc) {
    const id = `doc_${this.documents.length}`;
    this.documents.push({ id, ...doc });
    
    // Store keywords for retrieval
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

  // Retrieve relevant documents based on query
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

  getAll() {
    return this.documents;
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
    openai: 'disconnected'
  });
  const messagesEndRef = useRef(null);
  const vectorStore = useRef(new VectorStore());
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Vector Store with dashboard context
  useEffect(() => {
    initializeVectorStore();
  }, []);

  const initializeVectorStore = async () => {
    try {
      setConnectionStatus(prev => ({ ...prev, vectorstore: 'connected' }));
      
      // Initialize welcome message
      setMessages([{
        type: 'assistant',
        content: 'Hello! I\'m your PSA Strategic Insights AI with real-time dashboard integration.\n\nI have access to your network performance data and can provide insights on port operations, arrival accuracy, sustainability metrics, and strategic recommendations. Ask me anything!'
      }]);
    } catch (error) {
      console.error('Vector store initialization error:', error);
      setConnectionStatus(prev => ({ ...prev, vectorstore: 'error' }));
    }
  };

  // Proactive Anomaly Detection
  const detectAnomalies = useCallback((data) => {
    const insights = [];
    const rows = data.results[0].tables[0].rows;
    
    if (rows.length < 2) return insights;

    const current = rows[0];
    const previous = rows[1];
    const allRows = rows;

    // Calculate averages for benchmarking
    const avgPortTime = allRows.reduce((sum, r) => sum + r.PortTimeSavings, 0) / allRows.length;
    const avgCarbon = allRows.reduce((sum, r) => sum + r.CarbonAbatement, 0) / allRows.length;

    // Detect significant drops in Arrival Accuracy
    const arrivalDrop = previous.ArrivalAccuracy - current.ArrivalAccuracy;
    if (arrivalDrop > 15) {
      insights.push({
        type: 'anomaly',
        title: '🚨 Critical: Arrival Accuracy Declined',
        summary: `Arrival accuracy dropped ${arrivalDrop.toFixed(0)}% from ${previous.ArrivalAccuracy}% (${previous['Date[Month]']}) to ${current.ArrivalAccuracy}% (${current['Date[Month]']})`,
        impact: 'high',
        pillar: 'customer',
        detail: `This decline affects service predictability and customer satisfaction.`,
        actions: [
          'Review vessel schedule coordination with shipping lines',
          'Analyze weather pattern impacts for the period',
          'Check terminal maintenance schedules for conflicts',
          'Implement enhanced buffer times for high-risk routes'
        ]
      });
    }

    // Detect below-average Port Time Savings
    if (current.PortTimeSavings < avgPortTime - 5) {
      insights.push({
        type: 'anomaly',
        title: '⚠️ Port Time Savings Below Target',
        summary: `Current port time savings (${current.PortTimeSavings}%) is ${(avgPortTime - current.PortTimeSavings).toFixed(1)}% below network average (${avgPortTime.toFixed(1)}%)`,
        impact: 'medium',
        pillar: 'operational',
        detail: `Operational efficiency has declined compared to historical performance.`,
        actions: [
          'Optimize berth allocation algorithms',
          'Review vessel waiting times at key terminals',
          'Analyze cargo handling bottlenecks',
          'Deploy additional resources during peak periods'
        ]
      });
    }

    // Detect strong performance (positive insights)
    if (current.CarbonAbatement > avgCarbon + 1) {
      insights.push({
        type: 'success',
        title: '✅ Excellent: Carbon Abatement Exceeds Target',
        summary: `Carbon abatement (${current.CarbonAbatement}K tonnes) is ${((current.CarbonAbatement - avgCarbon) / avgCarbon * 100).toFixed(0)}% above average`,
        impact: 'low',
        pillar: 'sustainability',
        detail: `Strong sustainability performance demonstrates effective emissions reduction strategies.`,
        actions: [
          'Document successful practices for replication',
          'Share best practices across terminal network',
          'Consider expanding initiatives to other regions',
          'Report achievements to stakeholders'
        ]
      });
    }

    // Detect correlation opportunities
    if (current.PortTimeSavings > 18 && current.CarbonAbatement > 7) {
      insights.push({
        type: 'insight',
        title: '💡 Insight: Efficiency Drives Sustainability',
        summary: `High port time savings (${current.PortTimeSavings}%) correlates with strong carbon abatement (${current.CarbonAbatement}K tonnes)`,
        impact: 'medium',
        pillar: 'digital',
        detail: `Operational excellence directly supports sustainability goals through reduced idle times.`,
        actions: [
          'Continue optimizing vessel turnaround times',
          'Invest in predictive berth allocation systems',
          'Implement just-in-time arrival coordination',
          'Monitor and maintain this positive correlation'
        ]
      });
    }

    return insights;
  }, []);

  // Power BI Data Integration
  const loadPowerBIData = useCallback(async () => {
    try {
      setConnectionStatus(prev => ({ ...prev, powerbi: 'connecting' }));
      
      // Check if Power BI credentials are configured
      if (!POWERBI_CONFIG.clientId || !POWERBI_CONFIG.tenantId) {
        console.log('Power BI credentials not configured, using demo data');
        return loadDemoData();
      }

      console.log('Attempting to connect to Power BI...');
      
      // Step 1: Get Access Token
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
        const error = await tokenResponse.text();
        console.error('Power BI authentication failed:', error);
        console.log('Falling back to demo data');
        return loadDemoData();
      }

      const { access_token } = await tokenResponse.json();
      console.log('✅ Power BI authentication successful');

      // Step 2: Execute DAX Query
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
        const error = await dataResponse.text();
        console.error('Power BI data fetch failed:', error);
        console.log('Falling back to demo data');
        return loadDemoData();
      }

      const data = await dataResponse.json();
      console.log('✅ Successfully fetched Power BI data');
      
      setPowerBIData(data);
      setConnectionStatus(prev => ({ ...prev, powerbi: 'connected' }));
      storeDataInVectorStore(data);
      
      // Run proactive anomaly detection
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
      console.log('Falling back to demo data');
      return loadDemoData();
    }
  }, [detectAnomalies]);

  // Demo data fallback
  const loadDemoData = useCallback(() => {
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
    storeDataInVectorStore(data);
    
    return data;
  }, []);


  // Store Power BI data in vector store
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
            },
            timestamp: new Date().toISOString()
          }
        };
        
        await vectorStore.current.addDocument(doc);
      }
    } catch (error) {
      console.error('Error storing data in vector store:', error);
    }
  };


  // Initialize Power BI data on mount
  useEffect(() => {
    setTimeout(() => {
      loadPowerBIData();
    }, 1000);
  }, [loadPowerBIData]);

  // Build context with RAG
  const buildRAGContext = async (query) => {
    // Retrieve relevant documents from vector store
    const relevantDocs = await vectorStore.current.retrieve(query, 5);
    
    // Get current data summary
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
1. Operational Excellence - Port operations optimization
2. Digital Integration - Real-time data and AI decisions
3. Sustainability - Carbon reduction and fuel optimization
4. Customer-Centric Innovation - Predictable, reliable service

Provide analysis that:
- References specific historical data points
- Compares current vs historical performance
- Identifies patterns from retrieved context
- Aligns recommendations with strategic pillars
- Uses actual numbers from the data`;
  };

  const callGeminiAI = async (userMessage) => {
    try {
      setConnectionStatus(prev => ({ ...prev, openai: 'connecting' }));
      
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Please add REACT_APP_GEMINI_API_KEY to your .env file.');
      }

      const contextWithRAG = await buildRAGContext(userMessage);

      const prompt = `${contextWithRAG}

User Question: ${userMessage}

Please provide a detailed analysis that references specific data points from the context above.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API request failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
      
      setConnectionStatus(prev => ({ ...prev, openai: 'connected' }));

      // Extract strategic pillars
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
      setConnectionStatus(prev => ({ ...prev, openai: 'error' }));
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

    const response = await callGeminiAI(userMessage);
    
    setMessages(prev => [...prev, { 
      type: 'assistant', 
      content: response.content,
      pillars: response.pillars,
      isError: response.type === 'error'
    }]);
    setIsLoading(false);
  };

  const quickPrompts = [
    "Compare September vs our best months using historical data",
    "Why is arrival accuracy dropping? What does the data show?", 
    "Retrieve insights about May's peak performance",
    "What patterns do you see in carbon abatement trends?"
  ];

  const resetChat = () => {
    setMessages([{
      type: 'assistant',
      content: 'Chat reset. Ready for new analysis with live Power BI data and historical context.'
    }]);
    setShowChart({});
  };

  // Extract chart data from AI response
  const extractChartData = (content) => {
    if (!powerBIData?.results?.[0]?.tables?.[0]?.rows) return null;
    
    const rows = powerBIData.results[0].tables[0].rows;
    const contentLower = content.toLowerCase();
    
    // Don't show chart for welcome messages or short responses
    if (content.length < 100 || contentLower.includes('hello') || contentLower.includes('ask me anything')) {
      return null;
    }
    
    // Detect what metrics are mentioned with specific context
    const metrics = {
      portTimeSavings: (contentLower.includes('port time') && contentLower.includes('%')) || 
                       (contentLower.includes('savings') && contentLower.includes('port')),
      arrivalAccuracy: (contentLower.includes('arrival') && contentLower.includes('accuracy')) ||
                       (contentLower.includes('arrival') && contentLower.includes('%')),
      bunkerSavings: contentLower.includes('bunker') || 
                     (contentLower.includes('fuel') && contentLower.includes('savings')),
      carbonAbatement: (contentLower.includes('carbon') && contentLower.includes('abatement')) ||
                       (contentLower.includes('carbon') && contentLower.includes('tonnes'))
    };
    
    // Count how many metrics are mentioned
    const mentionedMetrics = Object.entries(metrics).filter(([_, mentioned]) => mentioned);
    
    if (mentionedMetrics.length === 0) return null;
    
    // Prepare chart data
    return {
      labels: rows.map(r => r['Date[Month]']).reverse(),
      datasets: mentionedMetrics.map(([key, _], idx) => {
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

  // Format AI response with better structure and styling
  const formatAIResponse = (content) => {
    // Helper function to parse inline bold text
    const parseInlineBold = (text) => {
      const parts = [];
      let lastIndex = 0;
      const regex = /\*\*(.*?)\*\*/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        // Add text before the bold
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        // Add bold text
        parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[1]}</strong>);
        lastIndex = regex.lastIndex;
      }
      
      // Add remaining text
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
      
      // Headers (##)
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
      // List items (numbered or bulleted)
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
      // Regular paragraphs
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
      // Empty lines
      else if (inList) {
        formatted.push(<ul key={`list-${idx}`} className="space-y-2 my-3 ml-4">{currentList}</ul>);
        currentList = [];
        inList = false;
      }
    });

    // Add remaining list items
    if (currentList.length > 0) {
      formatted.push(<ul key="list-final" className="space-y-2 my-3 ml-4">{currentList}</ul>);
    }

    return <div className="space-y-1">{formatted}</div>;
  };

  // Simple Line Chart Component
  const SimpleLineChart = ({ data, messageIdx }) => {
    if (!data) return null;
    
    const width = 700;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Find max value for scaling
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
            
            {/* X-axis labels */}
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
            
            {/* Lines */}
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
                  {/* Data points */}
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
        
        {/* Legend */}
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
            <p className="text-gray-600 text-xs mb-2">{insight.detail}</p>
            
            {insight.actions && insight.actions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h5 className="font-semibold text-gray-800 text-xs mb-2 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  Recommended Actions:
                </h5>
                <ul className="space-y-1.5">
                  {insight.actions.map((action, idx) => (
                    <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
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
      openai: Sparkles
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

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className={`text-xs font-medium ${config.color} capitalize`}>{status}</span>
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
                <p className="text-xs text-gray-500">Power BI Integration • RAG-Enhanced • Real-Time</p>
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
            <ConnectionIndicator service="openai" status={connectionStatus.openai} />
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

                  {/* Chart Visualization */}
                  {!message.isError && message.content && (
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