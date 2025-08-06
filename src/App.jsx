import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

export default function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendQuery = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:3000/mcp/query', {
        prompt: query
      });

      console.log('Full response:', res.data); // Debug log

      // The server returns the response data directly, not wrapped in 'Query Result'
      const responseData = res.data;
      console.log('Response data:', responseData); // Debug log

      if (responseData && responseData.success) {
        const botMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          responseData: responseData,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else if (responseData) {
        // Handle unsuccessful but valid responses
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: responseData.message || responseData.error || 'Request failed',
          error: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } else {
        // Handle completely invalid responses
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Unexpected response format: ${JSON.stringify(res.data)}`,
          error: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Request error:', error); // Debug log
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Connection error: ${error.message}`,
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  // Response renderers
  const DatabaseResult = ({ data }) => {
    const { result, details } = data;

    // Count query
    if (result?.length === 1 && result[0].count) {
      return (
        <div className="response-card database-count">
          <div className="response-header">
            <div className="response-icon">📊</div>
            <div className="response-title">Database Query</div>
          </div>
          <div className="count-display">
            <div className="count-value">{result[0].count.toLocaleString()}</div>
            <div className="count-label">Total Records</div>
          </div>
          <div className="query-footer">
            <code>{details?.query}</code>
          </div>
        </div>
      );
    }

    // Table results
    if (result?.length > 0) {
      const columns = Object.keys(result[0]);
      return (
        <div className="response-card database-table">
          <div className="response-header">
            <div className="response-icon">📋</div>
            <div className="response-title">
              Query Results ({result.length} row{result.length !== 1 ? 's' : ''})
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col}>{col.replace(/_/g, ' ').toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map(col => (
                      <td key={col}>
                        <div className="cell-content" title={String(row[col])}>
                          {String(row[col])}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="query-footer">
            <code>{details?.query}</code>
          </div>
        </div>
      );
    }

    return (
      <div className="response-card database-empty">
        <div className="response-header">
          <div className="response-icon">📊</div>
          <div className="response-title">Database Query</div>
        </div>
        <div className="empty-state">No results found</div>
      </div>
    );
  };

  const SimpleReply = ({ data }) => (
    <div className="response-card simple-reply">
      <div className="reply-content">
        <div className="reply-icon">💬</div>
        <div className="reply-text">{data.result}</div>
      </div>
    </div>
  );

  const CalculationResult = ({ data, toolName }) => {
    const { result, details } = data;
    const isAddition = toolName === 'sum';
    const operation = isAddition ? 'Addition' : 'Subtraction';
    const symbol = isAddition ? '+' : '−';

    return (
      <div className="response-card calculation">
        <div className="response-header">
          <div className="response-icon">🧮</div>
          <div className="response-title">{operation}</div>
        </div>
        <div className="calculation-display">
          <div className="equation">
            <span className="operand">{details.operands.a}</span>
            <span className="operator">{symbol}</span>
            <span className="operand">{details.operands.b}</span>
            <span className="equals">=</span>
            <span className="result">{result}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderResponse = (responseData) => {
    const { toolName, data } = responseData;

    switch (toolName) {
      case 'executeRawQuery':
        return <DatabaseResult data={data} />;
      case 'simple_reply':
        return <SimpleReply data={data} />;
      case 'sum':
      case 'sub':
        return <CalculationResult data={data} toolName={toolName} />;
      default:
        return (
          <div className="response-card generic">
            <div className="response-header">
              <div className="response-icon">📄</div>
              <div className="response-title">Response</div>
            </div>
            <div className="generic-content">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="chat-app">
      <header className="app-header">
        <div className="header-content">
          <h1>
            <span className="app-icon">🤖</span>
            AI Assistant
          </h1>
          <div className={`status-badge ${isLoading ? 'loading' : 'ready'}`}>
            {isLoading ? 'Processing...' : 'Ready'}
          </div>
        </div>
      </header>

      <main className="chat-content">
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon">👋</div>
              <h2>Welcome to AI Assistant</h2>
              <p>Ask me anything about your data, perform calculations, or just chat!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-avatar">
                  {message.role === 'user' ? '👤' :
                   message.error ? '❌' : '🤖'}
                </div>
                <div className="message-body">
                  <div className="message-content">
                    {message.role === 'user' ? (
                      <div className="user-message">
                        {message.content}
                      </div>
                    ) : message.responseData ? (
                      renderResponse(message.responseData)
                    ) : (
                      <div className={`system-message ${message.error ? 'error' : ''}`}>
                        {message.content}
                      </div>
                    )}
                  </div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-body">
                <div className="thinking-indicator">
                  <div className="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="chat-input-section">
        <div className="input-container">
          <textarea
            className="chat-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading}
            rows={1}
          />
          <button
            className="send-button"
            onClick={sendQuery}
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? '⏳' : '↗'}
          </button>
        </div>
      </footer>
    </div>
  );
}
