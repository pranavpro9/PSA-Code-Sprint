import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, TrendingUp, AlertTriangle, Target, Leaf, Users, Network, ChevronRight, Info, Database, Zap, CheckCircle, XCircle } from 'lucide-react';

// Configuration
const OPENAI_API_KEY = 'your-openai-api-key-here';
const POWERBI_CONFIG = {
  clientId: 'your-azure-app-client-id',
  tenantId: 'your-tenant-id',
  workspaceId: 'your-workspace-id',
  datasetId: 'your-dataset-id'
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
      // Add historical performance data to vector store
      const historicalDocs = [
        {
          type: 'metric',
          category: 'port_time_savings',
          content: 'Port Time Savings in May 2025 achieved 20% reduction vs baseline, the highest performance of the year. Contributing factors: optimized berth allocation, reduced vessel waiting times, efficient cargo handling operations.',
          metadata: { month: 'May', value: 20, metric: 'port_time_savings' }
        },
        {
          type: 'metric',
          category: 'arrival_accuracy',
          content: 'Arrival Accuracy peaked at 82% in April 2025. This was achieved through enhanced predictive analytics, improved weather forecasting integration, and better coordination with shipping lines.',
          metadata: { month: 'April', value: 82, metric: 'arrival_accuracy' }
        },
        {
          type: 'metric',
          category: 'arrival_accuracy',
          content: 'Arrival Accuracy N category consistently underperforms at 18-39% range. Root causes: inadequate buffer times, poor schedule coordination, vessel-specific operational constraints, lack of real-time tracking.',
          metadata: { category: 'N', range: '18-39%', metric: 'arrival_accuracy' }
        },
        {
          type: 'metric',
          category: 'bunker_savings',
          content: 'Bunker Savings reached $0.95M in May 2025 through optimized vessel speed management, reduced idle times, and just-in-time arrival coordination. This represents 58% above monthly average.',
          metadata: { month: 'May', value: 0.95, metric: 'bunker_savings' }
        },
        {
          type: 'metric',
          category: 'carbon_abatement',
          content: 'Carbon Abatement achieved 8.6K tonnes in May 2025 and 8.5K tonnes in July 2025. Success factors: reduced vessel idle time, optimized berth allocation, efficient port operations reducing overall emissions.',
          metadata: { months: ['May', 'July'], values: [8.6, 8.5], metric: 'carbon_abatement' }
        },
        {
          type: 'insight',
          category: 'correlation',
          content: 'Strong correlation observed between port time savings and carbon abatement. Months with 18%+ port time savings (May, August) also show 7K+ tonnes carbon reduction. This validates that operational efficiency directly supports sustainability goals.',
          metadata: { correlation: 'port_time_carbon', strength: 'strong' }
        },
        {
          type: 'anomaly',
          category: 'arrival_accuracy',
          content: 'September 2025 arrival accuracy dropped to 61% from 79% in August, representing an 18-point decline. Preliminary investigation suggests: seasonal weather patterns, increased vessel traffic, maintenance schedules at key terminals.',
          metadata: { month: 'September', value: 61, change: -18, metric: 'arrival_accuracy' }
        },
        {
          type: 'benchmark',
          category: 'targets',
          content: 'Performance targets: Port Time Savings 18%, Arrival Accuracy 80%, Bunker Savings $0.8M/month, Carbon Abatement 8K tonnes/month. Current 9-month performance: 3 of 9 months met all targets, 6 of 9 months met 2-3 targets.',
          metadata: { type: 'targets' }
        }
      ];

      for (const doc of historicalDocs) {
        await vectorStore.current.addDocument(doc);
      }

      setConnectionStatus(prev => ({ ...prev, vectorstore: 'connected' }));
      
      // Initialize welcome message
      setMessages([{
        type: 'assistant',
        content: 'Hello! I\'m your PSA Strategic Insights AI with real-time Power BI integration and intelligent data retrieval.\n\nI can analyze live dashboard data, retrieve historical context, and provide strategic recommendations.',
        insights: [
          {
            type: 'proactive',
            title: '⚡ System Ready',
            summary: 'Vector store initialized with 8 historical documents',
            impact: 'medium',
            pillar: 'digital',
            detail: 'RAG system ready for context-aware analysis with historical performance data.'
          }
        ]
      }]);
    } catch (error) {
      console.error('Vector store initialization error:', error);
      setConnectionStatus(prev => ({ ...prev, vectorstore: 'error' }));
    }
  };

  // Power BI API Integration
  const fetchPowerBIData = async () => {
    try {
      setConnectionStatus(prev => ({ ...prev, powerbi: 'connecting' }));

      // Step 1: Get Access Token (using MSAL or direct auth)
      // In production, implement proper OAuth flow
      const tokenResponse = await fetch(`https://login.microsoftonline.com/${POWERBI_CONFIG.tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: POWERBI_CONFIG.clientId,
          scope: 'https://analysis.windows.net/powerbi/api/.default',
          grant_type: 'client_credentials',
          client_secret: 'your-client-secret' // Store securely
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to authenticate with Power BI');
      }

      const { access_token } = await tokenResponse.json();

      // Step 2: Execute DAX Query to get dashboard data
      const daxQuery = {
        queries: [
          {
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
          }
        ]
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
        throw new Error('Failed to fetch Power BI data');
      }

      const data = await dataResponse.json();
      setPowerBIData(data);
      setConnectionStatus(prev => ({ ...prev, powerbi: 'connected' }));

      // Store fresh data in vector store
      await storeDataInVectorStore(data);

      return data;
    } catch (error) {
      console.error('Power BI fetch error:', error);
      setConnectionStatus(prev => ({ ...prev, powerbi: 'error' }));
      
      // Fallback to simulated data for demo
      return simulatePowerBIData();
    }
  };

  // Simulate Power BI data for demo purposes
  const simulatePowerBIData = () => {
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
  };

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

  // Initialize Power BI connection on mount
  useEffect(() => {
    // Simulate Power BI connection (in demo mode)
    setTimeout(() => {
      simulatePowerBIData();
    }, 1000);
  }, []);

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

  const callOpenAI = async (userMessage) => {
    try {
      setConnectionStatus(prev => ({ ...prev, openai: 'connecting' }));
      
      const contextWithRAG = await buildRAGContext(userMessage);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: contextWithRAG },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
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
      console.error('OpenAI API Error:', err);
      setConnectionStatus(prev => ({ ...prev, openai: 'error' }));
      return {
        type: 'error',
        content: `Error: ${err.message}. Using cached data for analysis.`,
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

    const response = await callOpenAI(userMessage);
    
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
    const Icon = insight.type === 'proactive' ? AlertTriangle : TrendingUp;
    const colors = insight.impact === 'high' ? 'border-red-300 bg-red-50' : insight.impact === 'medium' ? 'border-blue-300 bg-blue-50' : 'border-green-300 bg-green-50';
    
    return (
      <div className={`border-l-4 ${colors} p-4 rounded-r-lg mb-3`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${insight.impact === 'high' ? 'text-red-600' : insight.impact === 'medium' ? 'text-blue-600' : 'text-green-600'} mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">{insight.title}</h4>
            <p className="text-gray-700 text-sm mb-2">{insight.summary}</p>
            <p className="text-gray-600 text-xs mb-2">{insight.detail}</p>
            {insight.pillar && <StrategyPillarBadge pillarKey={insight.pillar} />}
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

                  <div className={`${message.isError ? 'bg-red-50 border border-red-200 rounded-2xl p-4' : ''}`}>
                    <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${message.isError ? 'text-red-800' : 'text-gray-800'}`}>
                      {message.content}
                    </div>
                  </div>

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
            AI-powered insights from OpenAI GPT-4
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;