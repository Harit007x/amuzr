'use client';
// pages/index.tsx
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const websocket = useRef<WebSocket | null>(null);

  const connect_url = process.env.NEXT_PUBLIC_WEBSOCKET_URL as string;
  console.log('conn yurl =', connect_url)
  useEffect(() => {
    websocket.current = new WebSocket(connect_url);

    websocket.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    websocket.current.onmessage = (event) => {
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    websocket.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message && websocket.current) {
      websocket.current.send(message);
      setMessage('');
    }
  };

  return (
    <div>
      <h1>Chat App</h1>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}