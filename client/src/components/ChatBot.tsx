import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2, HelpCircle, ArrowLeft, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'faq';
  content: string;
  timestamp: Date;
}

interface FAQ {
  category: string;
  questions: string[];
}

const faqs: FAQ[] = [
  {
    category: "General Usage",
    questions: [
      "How do I use this anomaly detection system?",
      "Can you explain what this dashboard shows?",
      "What is an anomaly and why does it matter?",
    ]
  },
  {
    category: "Data Ingestion",
    questions: [
      "How do I upload or ingest new data?",
      "What type of data formats are supported?",
      "Where can I see the data I just uploaded?",
    ]
  },
  {
    category: "Viewing Data and Analytics",
    questions: [
      "Can you show me the latest energy consumption trends?",
      "Where can I find the current CO₂ emission levels?",
      "How do I interpret this graph/chart?",
    ]
  },
  {
    category: "Alerts & Anomalies",
    questions: [
      "Are there any new anomalies detected?",
      "What should I do if an alert is triggered?",
      "How can I view past alerts or notifications?",
    ]
  },
  {
    category: "FMEA",
    questions: [
      "What is FMEA and how does it work here?",
      "How can I view the FMEA report for my system?",
      "Does the system suggest actions for the detected failure modes?",
    ]
  },
  {
    category: "Model Training & Testing",
    questions: [
      "How can I train the model with new data?",
      "Is the model currently being tested or trained?",
      "How accurate is the anomaly detection model?",
    ]
  }
];

const answers: Record<string, string> = {
  "How do I use this anomaly detection system?": 
    "Our system works in three simple steps:\n1. Upload your data through the Data Ingestion page\n2. Select and train an anomaly detection model\n3. View results in the Alerts and FMEA sections",
  
  "Can you explain what this dashboard shows?":
    "The dashboard provides comprehensive monitoring of your system's performance through multiple views:\n• Data Ingestion: Upload and manage data\n• Multichannel View: Visualize multiple metrics\n• Model Training: Train anomaly detection models\n• Alerts: View detected anomalies\n• FMEA: Detailed failure mode analysis",
  
  "What is an anomaly and why does it matter?":
    "An anomaly is an unusual pattern in your data that could indicate potential issues. We monitor:\n• Energy consumption spikes\n• Abnormal CO₂ emissions\n• Power factor deviations\nDetecting these early helps prevent equipment failures and reduce operational costs.",
  
  "How do I upload or ingest new data?":
    "To upload data:\n1. Go to the Data Ingestion page\n2. Drag & drop your CSV file or click to select\n3. Ensure your file contains required columns (usage_kwh, co2_tco2, power_factor)\n4. The system will automatically validate and process your data",
  
  "What type of data formats are supported?":
    "Currently, we support CSV files with the following required columns:\n• usage_kwh: Energy usage in kilowatt-hours\n• co2_tco2: CO₂ emissions in tonnes\n• power_factor: Power factor measurements\nThe data should be time-series with a date/timestamp column.",
  
  "Where can I see the data I just uploaded?":
    "Uploaded data can be viewed in:\n1. Data Ingestion page: List of all uploaded files\n2. Multichannel View: Visual representation of data\n3. Model Training: When selecting data for training",
  
  "Can you show me the latest energy consumption trends?":
    "You can view energy consumption trends in:\n1. Multichannel View: Interactive time-series graphs\n2. Alerts page: Anomalies in consumption\n3. FMEA section: Detailed analysis of patterns",
  
  "Where can I find the current CO₂ emission levels?":
    "CO₂ emissions can be monitored in:\n1. Multichannel View: Real-time emissions data\n2. Alerts: Emission-related anomalies\n3. FMEA: Environmental impact analysis",
  
  "How do I interpret this graph/chart?":
    "Our graphs show:\n• X-axis: Time series data\n• Y-axis: Metric values (kWh, tCO₂, etc.)\n• Color coding: Different metrics\n• Interactive features: Zoom, pan, hover for details\nAnomalies are highlighted for easy identification.",
  
  "Are there any new anomalies detected?":
    "Check the Alerts page for:\n• Latest anomalies with severity levels\n• Detailed diagnosis of each anomaly\n• Time and date of detection\nYou can filter by severity (Critical, Moderate, Minor)",
  
  "What should I do if an alert is triggered?":
    "When an alert triggers:\n1. Check the severity level\n2. Review the FMEA diagnosis\n3. Follow recommended actions\n4. Monitor the system for improvements\nCritical alerts require immediate attention.",
  
  "How can I view past alerts or notifications?":
    "Access historical alerts in:\n1. Alerts page: Complete alert history\n2. FMEA section: Detailed analysis\nUse filters and sorting to find specific alerts.",
  
  "What is FMEA and how does it work here?":
    "FMEA (Failure Mode and Effects Analysis) helps identify potential failures:\n• Analyzes anomaly patterns\n• Provides root cause analysis\n• Suggests preventive measures\n• Prioritizes issues by severity",
  
  "How can I view the FMEA report for my system?":
    "Access FMEA reports in the FMEA section:\n1. View failure mode categories\n2. Check root cause analysis\n3. Review recommended actions\n4. Monitor effectiveness metrics",
  
  "Does the system suggest actions for the detected failure modes?":
    "Yes, for each anomaly the system provides:\n• Root cause analysis\n• Recommended actions\n• Prevention strategies\n• Priority levels for action",
  
  "How can I train the model with new data?":
    "To train the model:\n1. Upload data in Data Ingestion\n2. Go to Model Training page\n3. Select your dataset\n4. Choose a model type\n5. Click 'Train Model'",
  
  "Is the model currently being tested or trained?":
    "Check the Model Training page for:\n• Current training status\n• Progress indicators\n• Success/failure notifications\n• Model performance metrics",
  
  "How accurate is the anomaly detection model?":
    "Model accuracy is measured by:\n• False positive/negative rates\n• Detection precision\n• Recall rates\nWe use multiple algorithms to ensure reliable detection."
};

const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1 p-3">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
    <span className="text-sm text-gray-500">Assistant is typing...</span>
  </div>
);

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showFAQ, setShowFAQ] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const simulateTyping = async (callback: () => void) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    setIsTyping(false);
    callback();
  };

  const handleQuestionClick = (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      type: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    simulateTyping(() => {
      const botMessage: Message = {
        id: Date.now().toString() + '-bot',
        type: 'bot',
        content: answers[question] || "I'm sorry, I don't have an answer for that specific question.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    });
    
    setShowFAQ(false);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    simulateTyping(() => {
      const relevantQuestion = Object.keys(answers).find(q => 
        q.toLowerCase().includes(message.toLowerCase()) ||
        message.toLowerCase().includes(q.toLowerCase())
      );

      const botMessage: Message = {
        id: Date.now().toString() + '-bot',
        type: 'bot',
        content: relevantQuestion 
          ? answers[relevantQuestion]
          : "I'm not sure about that. Please try asking one of the suggested questions or rephrase your question.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    });
    
    setShowFAQ(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 animate-pulse"
          aria-label="Open chat"
        >
          <MessageSquare size={28} className="group-hover:rotate-12 transition-transform duration-300" />
        </button>
        <div className="absolute -top-12 right-0 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Need help? Click to chat!
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed right-6 bottom-6 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 transition-all duration-500 ease-in-out z-50 ${
        isMinimized ? 'w-80 h-16' : 'w-[28rem] h-[36rem]'
      }`}
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="text-white" size={20} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">AI Assistant</h3>
            <p className="text-xs text-gray-500">Always here to help</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!showFAQ && messages.length > 0 && (
            <button
              onClick={() => {
                setShowFAQ(true);
                setMessages([]);
              }}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              aria-label="Back to FAQ"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <button
            onClick={() => {
              setShowFAQ(true);
              setMessages([]);
            }}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            aria-label="Show FAQ"
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="h-[calc(36rem-10rem)] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
            {messages.length === 0 && showFAQ && (
              <div className="text-center py-4">
                <Bot className="mx-auto text-blue-500 mb-2" size={32} />
                <h4 className="font-medium text-gray-800 mb-1">Welcome! How can I help?</h4>
                <p className="text-sm text-gray-500">Choose a question below or type your own</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 animate-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {msg.type === 'bot' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="text-white" size={16} />
                  </div>
                )}
                
                <div className={`flex-1 ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      msg.type === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <span className={`text-xs mt-2 block ${
                      msg.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {msg.type === 'user' && (
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="text-white" size={16} />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white" size={16} />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm">
                  <TypingIndicator />
                </div>
              </div>
            )}

            {showFAQ && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {faqs.map((category, categoryIndex) => (
                  <div key={category.category} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                      <h4 className="font-semibold text-gray-800 text-sm">{category.category}</h4>
                    </div>
                    <div className="space-y-2 ml-3">
                      {category.questions.map((question, questionIndex) => (
                        <button
                          key={question}
                          onClick={() => handleQuestionClick(question)}
                          className="w-full text-left p-3 text-sm text-gray-700 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 group"
                          style={{
                            animationDelay: `${(categoryIndex * 100) + (questionIndex * 50)}ms`
                          }}
                        >
                          <span className="group-hover:text-blue-700 transition-colors">{question}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200/50 bg-white/80 backdrop-blur-sm rounded-b-2xl">
            <div className="flex space-x-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question here..."
                  rows={1}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none transition-all duration-200 text-sm bg-white/80 backdrop-blur-sm"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                  Press Enter to send
                </div>
              </div>
              <button 
                onClick={handleSendMessage}
                disabled={!message.trim() || isTyping}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 min-w-[44px] justify-center"
              >
                <Send size={18} className={`${message.trim() ? 'animate-bounce' : ''}`} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBot;