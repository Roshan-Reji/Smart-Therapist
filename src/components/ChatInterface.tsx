import React, { useState } from 'react';
import { chatWithAI } from '../services/chatService';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      // Get API key from environment variables
      const apiKey = import.meta.env.VITE_GROK_API_KEY || '';
      if (!apiKey) {
        throw new Error('Grok API key not found. Please add VITE_GROK_API_KEY to your .env file.');
      }

      const aiResponse = await chatWithAI(message, apiKey);
      setResponse(aiResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <h2>Chat with AI</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
      
      {error && <div className="error">{error}</div>}
      
      {response && (
        <div className="response">
          <h3>Response:</h3>
          <p>{response}</p>
        </div>
      )}
      
      <style>{`
        .chat-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        textarea {
          width: 100%;
          margin-bottom: 10px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          padding: 10px 20px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .error {
          color: red;
          margin: 10px 0;
        }
        .response {
          margin-top: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
