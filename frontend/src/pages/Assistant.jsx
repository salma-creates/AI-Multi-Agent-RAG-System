import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, RotateCcw, Bot, User, Sparkles, HelpCircle } from 'lucide-react';
import TransparencyPanel from '../components/TransparencyPanel';
import { queryPipeline } from '../services/api';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export default function Assistant({ showToast }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am Lumina AI. Ask me any question grounded in your uploaded knowledge base, or ask general questions.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [pendingClarification, setPendingClarification] = useState(null);
  const chatEndRef = useRef(null);

  // Speech Hooks
  const { isListening, transcript, startListening, stopListening, isSupported: isSttSupported } = useSpeechRecognition({
    onResult: (text) => {
      setInputQuery(text);
    }
  });

  const { speak, stop: stopTts, isSpeaking, isSupported: isTtsSupported } = useSpeechSynthesis();

  // Keep transcript synced to input
  useEffect(() => {
    if (transcript) {
      setInputQuery(transcript);
    }
  }, [transcript]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (customQuery = null, clarificationAnswer = null) => {
    const textToSend = customQuery || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMessageId = `msg_${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);
    setPendingClarification(null);

    try {
      const response = await queryPipeline({
        query: textToSend.trim(),
        conversation_id: conversationId,
        clarification_response: clarificationAnswer
      });

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      const assistantMessage = {
        id: response.query_id || `asst_${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        responseData: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.requires_clarification) {
        setPendingClarification({
          original_query: textToSend.trim(),
          prompt: response.clarification_prompt
        });
      }

      // Auto TTS if user used voice
      if (isListening && isTtsSupported) {
        speak(response.answer);
      }

    } catch (err) {
      console.error('[Pipeline Error]', err);
      showToast(err.message || 'Failed to resolve query.', 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: `Error: ${err.message || 'Server encountered an issue.'}`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Conversation history cleared. How can I assist you with your knowledge base today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setConversationId(null);
    setPendingClarification(null);
    stopTts();
    showToast('Conversation cleared.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)', maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '1rem 1.5rem' }}>
      {/* Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #FEF08A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF08A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles style={{ width: '18px', height: '18px', color: '#D97706' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#451A03' }}>AI Assistant Chat</h2>
            <p style={{ fontSize: '0.75rem', color: '#854D0E', fontWeight: 600 }}>Multi-Agent Grounded RAG & Conversation Memory</p>
          </div>
        </div>

        <button className="btn-secondary" onClick={handleClearHistory} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
          <RotateCcw style={{ width: '14px', height: '14px' }} />
          Clear Chat
        </button>
      </div>

      {/* Chat Messages Scroll Window */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1rem' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {/* Avatar & Sender Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontSize: '0.75rem', color: '#854D0E', fontWeight: 600 }}>
              {msg.role === 'user' ? (
                <>
                  <span>You</span>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User style={{ width: '12px', height: '12px', color: '#FFF' }} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot style={{ width: '12px', height: '12px', color: '#FFF' }} />
                  </div>
                  <span>Lumina Assistant</span>
                </>
              )}
              <span>• {msg.timestamp}</span>
            </div>

            {/* Message Content Bubble */}
            <div style={{
              maxWidth: '85%',
              padding: '1rem 1.25rem',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              backgroundColor: msg.role === 'user' ? '#FEF08A' : '#FFFFFF',
              color: msg.role === 'user' ? '#713F12' : '#1E293B',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              fontWeight: msg.role === 'user' ? 600 : 400,
              border: msg.isError ? '1px solid #FCA5A5' : '1px solid #FEF08A',
              boxShadow: '0 4px 15px rgba(234, 179, 8, 0.06)',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.text}

              {/* Speech Output Controls for Assistant messages */}
              {msg.role === 'assistant' && isTtsSupported && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #FEF08A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => isSpeaking ? stopTts() : speak(msg.text)}
                    style={{ background: 'none', border: 'none', color: '#B45309', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {isSpeaking ? <VolumeX style={{ width: '14px', height: '14px' }} /> : <Volume2 style={{ width: '14px', height: '14px' }} />}
                    <span>{isSpeaking ? 'Stop Audio' : 'Listen Answer'}</span>
                  </button>
                </div>
              )}

              {/* Transparency Panel for Grounded Answers */}
              {msg.responseData && (
                <TransparencyPanel responseData={msg.responseData} />
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#854D0E', fontSize: '0.88rem' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot style={{ width: '14px', height: '14px', color: '#FFF' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#FFFFFF', border: '1px solid #FEF08A', padding: '0.75rem 1rem', borderRadius: '12px' }}>
              <div className="animate-spin-fast" style={{ width: '16px', height: '16px', border: '2px solid #D97706', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
              <span>Multi-Agent Pipeline resolving query...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Clarification Response Chips */}
      {pendingClarification && (
        <div style={{ marginBottom: '0.75rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#FEF9C3', border: '1px solid #FDE047', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <HelpCircle style={{ width: '20px', height: '20px', color: '#D97706' }} />
          <div style={{ flex: 1, fontSize: '0.82rem', color: '#713F12' }}>
            <strong>Clarification Needed:</strong> {pendingClarification.prompt}
          </div>
        </div>
      )}

      {/* Input Form Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#FFFFFF', padding: '0.5rem', borderRadius: '12px', border: '1px solid #FDE047', boxShadow: '0 4px 20px rgba(234, 179, 8, 0.1)' }}>
        {/* STT Microphone Toggle */}
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          title={isListening ? 'Stop Listening' : 'Speak Query (Speech-to-Text)'}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: isListening ? '#EF4444' : '#FEF08A',
            color: isListening ? '#FFF' : '#713F12',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'none'
          }}
        >
          {isListening ? <MicOff style={{ width: '20px', height: '20px' }} /> : <Mic style={{ width: '20px', height: '20px', color: '#B45309' }} />}
        </button>

        {/* Input Text Box */}
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={isListening ? 'Listening... Speak your question now' : 'Ask a question grounded in your knowledge base...'}
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#1E293B',
            fontSize: '0.95rem',
            padding: '0.5rem',
            outline: 'none',
            fontWeight: 500
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="btn-primary"
          style={{ height: '42px', padding: '0 1.25rem' }}
        >
          <span>Send</span>
          <Send style={{ width: '16px', height: '16px' }} />
        </button>
      </form>
    </div>
  );
}
