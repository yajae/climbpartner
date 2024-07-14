import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatWidget.css';
import markerIcon from './assets/search.png';

const socket = io(`${import.meta.env.VITE_SERVER_URL}`, {
  withCredentials: true,
});

const ChatWidget = ({ room }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('userId');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    if (username) {
      socket.emit('join-room', room);
      fetchMessages();
    }

    socket.on('receiveMessage', (data) => {
      setMessages((premsgs) => {
        const newmsgs = [...(premsgs || []), data];
        return newmsgs;
      });
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [username, room]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = messages.filter((msg) =>
        msg.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchTerm, messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/route/chat-messages/${room}`);
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
      setFilteredMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = () => {
    if (message.trim() !== '') {
      const data = { user: username, message, timestamp: new Date(), room };
      socket.emit('sendMessage', data);
      setMessage('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  const highlightText = (text, highlight) => {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={index} className="highlight">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="chat-widget">
      <div className="chat-box">
      
        <div className="chat-content">
          <div className="input-container">
          <img src={markerIcon} alt="Marker Icon" className="input-logo"/>

        
            <input
              type="text"
              placeholder="搜尋聊天和信息"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="chat-body">
            {Array.isArray(filteredMessages) && filteredMessages.length > 0 ? (
              filteredMessages.map((msg, index) => (
                <div key={index} className="chat-message">
                  <strong>{msg.user}</strong>: {highlightText(msg.message, searchTerm)}
                </div>
              ))
            ) : (
              <div>請在下方輸入聊天內容</div>
            )}
            <div ref={messagesEndRef} /> 
          </div>
          <div className="chat-footer">
         
            <input
              type="text"
              placeholder="輸入訊息"
              value={message}
              onKeyDown={handleKeyPress}
              onChange={(e) => setMessage(e.target.value)}
              className="chat-input"
            />
         
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
