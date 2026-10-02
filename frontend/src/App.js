import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [apiEndpoint, setApiEndpoint] = useState(
    process.env.REACT_APP_API_ENDPOINT || ''
  );

  const exampleQueries = [
    'Show me all customers from California',
    'What are the top 5 best-selling products?',
    'How many orders were placed in January 2024?',
    'What is the total revenue by product category?',
    'List all pending orders with customer details'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !apiEndpoint) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await axios.post(`${apiEndpoint}/query`, {
        query: query,
        session_id: sessionId
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.data.session_id) {
        setSessionId(response.data.session_id);
      }
    } catch (error) {
      const errorMessage = {
        role: 'error',
        content: error.response?.data?.error || 'Failed to get response. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (exampleQuery) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>🤖 Bedrock Text-to-SQL Agent</h1>
          <p>Ask questions about your sales data in natural language</p>
        </header>

        {!apiEndpoint && (
          <div className="api-config">
            <input
              type="text"
              placeholder="Enter API Gateway endpoint URL"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="api-input"
            />
          </div>
        )}

        <div className="chat-container">
          <div className="messages">
            {messages.length === 0 && (
              <div className="welcome">
                <h2>Welcome! 👋</h2>
                <p>Try asking questions like:</p>
                <div className="examples">
                  {exampleQueries.map((example, index) => (
                    <button
                      key={index}
                      className="example-btn"
                      onClick={() => handleExampleClick(example)}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message assistant">
                <div className="message-content loading">
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your sales data..."
              disabled={loading || !apiEndpoint}
              className="query-input"
            />
            <button 
              type="submit" 
              disabled={loading || !query.trim() || !apiEndpoint}
              className="send-btn"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
