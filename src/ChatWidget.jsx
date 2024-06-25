import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './ChatWidget.css';

const socket = io('http://localhost:3000');

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState('');
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);

  useEffect(() => {
    socket.on('receiveMessage', (data) => {
      setMessages((msgs) => [...msgs, data]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = messages.filter(msg => 
        msg.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchTerm, messages]);

  const sendMessage = () => {
    const data = { user, message, timestamp: new Date() };
    socket.emit('sendMessage', data);
    setMessage('');
  };

  const addNote = () => {
    setNotes([...notes, { note, timestamp: new Date() }]);
    setNote('');
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
            Chat & Notes
          </div>
          <div className="chat-content">
            <div className="chat-section">
              <div className="chat-search">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="chat-body">
                {filteredMessages.map((msg, index) => (
                  <div key={index} className="chat-message">
                    <strong>{msg.user}</strong>: {highlightText(msg.message, searchTerm)}
                  </div>
                ))}
              </div>
              <div className="chat-footer">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="chat-input"
                />
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="chat-input"
                  placeholder="Type a message"
                />
                <button onClick={sendMessage} className="chat-send-button">
                  Send
                </button>
              </div>
            </div>
            <div className="notes-section">
              <div className="notes-body">
                {notes.map((n, index) => (
                  <div key={index} className="note-item">
                    {n.note}
                  </div>
                ))}
              </div>
              <div className="notes-footer">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="chat-input"
                  placeholder="Type a note"
                />
                <button onClick={addNote} className="chat-send-button">
                  Add Note
                </button>
              </div>
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
