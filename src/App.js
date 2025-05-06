import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const chatContainerRef = useRef(null);
    const apiKey = 'AIzaSyCv7I0_dqjkDjeqZaG0wsGonnRyIdgyoVw';

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSendMessage = async () => {
        if (inputText.trim()) {
            const newUserMessage = { text: inputText, sender: 'user' };
            const updatedMessages = [...messages, newUserMessage];
            setMessages(updatedMessages);
            setInputText('');
            setLoading(true);

            try {
                const historyForApi = updatedMessages.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }],
                }));

                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
                    {
                        contents: historyForApi,
                        generationConfig: {
                            maxOutputTokens: 2048,
                        },
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                const botResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
                setMessages([...updatedMessages, { text: botResponse, sender: 'gemini' }]);
            } catch (error) {
                console.error('Error communicating with Gemini:', error.response?.data || error.message);
                setMessages([...updatedMessages, {
                    text: 'Error communicating with Gemini.',
                    sender: 'gemini',
                    error: true,
                }]);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleInputChange = (event) => setInputText(event.target.value);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">Gemini Chat</div>
            <div className="chat-history" ref={chatContainerRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender} ${msg.error ? 'error' : ''}`}>
                        {msg.text}
                    </div>
                ))}
                {loading && (
                    <div className="message gemini typing-indicator">
                        Gemini is typing<span className="dots"><span>.</span><span>.</span><span>.</span></span>
                    </div>
                )}
            </div>
            <div className="input-area">
                <textarea
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={2}
                    disabled={loading}
                />
                <button onClick={handleSendMessage} disabled={loading}>Send</button>
            </div>
        </div>
    );
}

export default App;
