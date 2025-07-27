import React, { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);

  const sendQuery = async () => {
    if (!query.trim()) return;

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', text: query }]);

    try {
      // POST request to backend
      const res = await axios.post('http://localhost:3000/mcp/query', {
        prompt: query
      });

      // Assuming response contains the JSON result you showed in the screenshot
      const answer = JSON.stringify(res.data['Query Result'], null, 2);

      // Add backend response to chat
      setMessages(prev => [...prev, { role: 'bot', text: answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Error: ' + error.message }]);
    }

    setQuery('');
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100vh',
    padding: '20px',
    boxSizing: 'border-box',
  };

  const headerStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: 'black',
  };

  const chatBoxStyle = {
    flexGrow: 1,
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: '#F7FAFC',
    color: 'black', // Text color set to black inside the chat box
  };

  const messageStyle = {
    marginBottom: '8px',
    padding: '8px',
    borderRadius: '8px',
    whiteSpace: 'pre-wrap',
    maxWidth: '70%',
  };

  const userMessageStyle = {
    ...messageStyle,
    backgroundColor: '#bee3f8',
    alignSelf: 'flex-end',
  };

  const botMessageStyle = {
    ...messageStyle,
    backgroundColor: '#e2e8f0',
    alignSelf: 'flex-start',
  };

  const inputGroupStyle = {
    display: 'flex',
    gap: '8px',
  };

  const inputStyle = {
    flexGrow: 1,
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '16px',
  };

  const buttonStyle = {
    backgroundColor: '#3182ce',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  };

  const buttonHoverStyle = {
    ...buttonStyle,
    backgroundColor: '#2b6cb0',
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>LLM Chat UI</h1>

      <div style={chatBoxStyle}>
        {messages.length === 0 && <p style={{ color: '#a0aec0' }}>Ask your question above...</p>}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={msg.role === 'user' ? userMessageStyle : botMessageStyle}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div style={inputGroupStyle}>
        <input
          type="text"
          placeholder="Enter your query..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendQuery()}
          style={inputStyle}
        />
        <button
          onClick={sendQuery}
          style={buttonStyle}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2b6cb0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}
        >
          Send
        </button>
      </div>
    </div>
  );
}
