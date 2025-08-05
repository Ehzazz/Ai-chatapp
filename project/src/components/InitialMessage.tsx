import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function InitialMessage() {
  const { username } = useAuth();
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);

  useEffect(() => {
    const welcomeMessage = {
      sender: 'bot',
      text:  `Hi ${username}, upload any document and ask your questions — I’m here to help!`,
    };

    setMessages([welcomeMessage]);
  }, [username]);

  return (
    <div className="chat-window">
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.sender}`}>
          {msg.text}
        </div>
      ))}
    </div>
  );
}
