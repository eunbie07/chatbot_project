import React, { useState } from 'react';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '무엇을 도와드릴까요?' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);

    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();
    setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    setInput('');
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🛒 감정 소비 챗봇</h2>
      <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
            <strong>{msg.sender === 'user' ? '👤' : '🤖'}</strong>: {msg.text}
          </div>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>전송</button>
    </div>
  );
}

export default App;
