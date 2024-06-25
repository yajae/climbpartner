import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './ChatWidget.css';

const socket = io('http://localhost:3000');

const ChatWidget = ({ room }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);

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
      // const response = await fetch(`http://localhost:3000/chat-messages/${room}`);
       const response = await fetch(`/chat-messages/${room}`);
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []); 
      setFilteredMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = () => {
    const data = { user: username, message, timestamp: new Date(), room };
    socket.emit('sendMessage', data);
    setMessage('');
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
      {isOpen ? (
        <div className="chat-box">
          <div className="chat-header" onClick={() => setIsOpen(false)}>
            Chat
          </div>
          <div className="chat-content">
            <div className="chat-search">
              <input
                type="text"
                placeholder="Search..."
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
                <div>No messages found</div>
              )}
            </div>
            <div className="chat-footer">
              <div className="user-name">{username}</div>
              <input
                type="text"
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="chat-input"
              />
              <button onClick={sendMessage} className="chat-send-button">
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button className="chat-toggle-button" onClick={() => setIsOpen(true)}>
          <img src="chat-icon.png" alt="Chat" />
        </button>
      )}
    </div>
  );

};

export default ChatWidget;
