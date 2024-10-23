'use client';
import React, { useEffect, useState } from 'react'
import { useSocket } from '../app/socketContext';

const Chat = () => {
    const { socket } = useSocket();
    const [message, setMessage] = useState('');
    const [inbox, setInbox] = useState<any>([]);

    // Log message state every time it changes
    useEffect(() => {
      console.log('mess =', message);
    }, [message]);

    useEffect(() => {
      if (socket) {
        console.log('WebSocket connected');
        console.log('message is completed');
        socket.on('message', (message) => {
          console.log('Received message:', message);
          setInbox((inbox: any) => [...inbox, message]);
        });
      }
    }, [socket]);

    const sendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (socket && message) {
        console.log('sending the message')
        socket.emit('message', message, 'xhx-xhx');
        setMessage(''); // Clear the input after sending the message
      }
    };

    console.log("inbox message =", inbox)

    return (
        <div>
            <h1>Chat App</h1>
            <ul>
                {inbox.map((msg: any, index: any) => (
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
};

export default Chat;
