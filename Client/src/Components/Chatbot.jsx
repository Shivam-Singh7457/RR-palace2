import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import "./Chatbot.css";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const QUICK_SUGGESTIONS = [
  "What room types do you have and what are their prices?",
  "Check room availability",
  "What is the cancellation policy?",
  "Who is the owner of this property?"
];

export const Chatbot = () => {
  const { user } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [sessionId, setSessionId] = useState("");
  const [showGreetingPopup, setShowGreetingPopup] = useState(false);
  const [isGrowing, setIsGrowing] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize Session ID & Initial Welcome Message & First-Time Grow Animation
  useEffect(() => {
    let savedSessionId = localStorage.getItem("rr_ai_session_id");
    if (!savedSessionId) {
      savedSessionId = "session_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
      localStorage.setItem("rr_ai_session_id", savedSessionId);
    }
    setSessionId(savedSessionId);

    setMessages([
      {
        role: "assistant",
        content: "Hi! I am Vedika. I can help in hotel booking, live room availability, rates, and hotel policies at Royal Rudraksh Palace. How may I assist you today?"
      }
    ]);

    // Trigger grow-up animation & pop-up message on initial page load & warm up AI service
    setIsGrowing(true);
    const popupTimer = setTimeout(() => {
      setShowGreetingPopup(true);
    }, 600);

    // Warm up backend AI service in background
    axios.get(`${API_BASE_URL}/api/ai/health`).catch(() => {});

    return () => clearTimeout(popupTimer);
  }, []);

  // Auto-scroll to bottom of messages container
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [messages, isLoading]);

  const toggleChat = () => {
    if (!isOpen) setUnreadCount(0);
    setShowGreetingPopup(false); // Hide popup when main chat opens
    setIsOpen(!isOpen);
    if (isOpen) setIsExpanded(false); // Reset expand on close
  };

  const handlePopupClick = () => {
    setShowGreetingPopup(false);
    setUnreadCount(0);
    setIsOpen(true);
  };

  const dismissPopup = (e) => {
    e.stopPropagation();
    setShowGreetingPopup(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleBookingAction = (action) => {
    if (!action || !action.params) return;
    const { room_type, check_in_date, check_out_date } = action.params;
    localStorage.setItem("rr_booking_prefill", JSON.stringify({ room_type, check_in_date, check_out_date }));
    window.location.href = "/rooms";
  };

  const handleLoginAction = (action) => {
    if (action && action.params) {
      const { room_type, check_in_date, check_out_date } = action.params;
      localStorage.setItem("rr_booking_prefill", JSON.stringify({ room_type, check_in_date, check_out_date }));
    }
    window.location.href = "/login";
  };

  const handlePaymentAction = (action) => {
    if (!action || !action.params) return;
    const { booking_id } = action.params;
    if (booking_id) {
      window.location.href = `/contact?payment=true&bookingId=${booking_id}`;
    } else {
      window.location.href = `/my-bookings`;
    }
  };

  const handleConfirmBookingPrompt = (action) => {
    if (!action || !action.params) return;
    const { room_type, check_in_date, check_out_date } = action.params;
    handleSendMessage(`Confirm booking for ${room_type || 'Room'} from ${check_in_date} to ${check_out_date}`);
  };

  const handleConfirmCancellationPrompt = (action) => {
    if (!action || !action.params) return;
    const { booking_id } = action.params;
    handleSendMessage(`Confirm cancellation of booking ${booking_id}`);
  };


  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    const userMsg = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    const userPayload = user ? { id: user._id, email: user.email, username: user.username } : null;

    let responseData = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await axios.post(`${API_BASE_URL}/api/ai/chat`, {
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          session_id: sessionId,
          user: userPayload
        }, { timeout: 45000 });

        if (res.data && res.data.message) {
          responseData = res.data;
          break;
        }
      } catch (error) {
        console.warn(`Chat attempt ${attempt}/${maxAttempts} failed:`, error.message);
        const status = error.response?.status;
        const isWakingUp = status === 503 || error.code === 'ECONNABORTED' || !error.response;

        if (isWakingUp && attempt < maxAttempts) {
          setMessages(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.isStatusMsg) {
              last.content = `Vedika AI is starting up... Retrying connection (${attempt}/${maxAttempts})`;
              return copy;
            } else {
              return [...copy, { role: "assistant", content: `Vedika AI is starting up... Retrying connection (${attempt}/${maxAttempts})`, isStatusMsg: true }];
            }
          });
          await new Promise(r => setTimeout(r, 4000));
        } else {
          break;
        }
      }
    }

    // Remove status message
    setMessages(prev => prev.filter(m => !m.isStatusMsg));

    if (responseData && responseData.message) {
      const assistantMsg = {
        role: responseData.message.role,
        content: responseData.message.content,
        action: responseData.action || null
      };
      setMessages(prev => [...prev, assistantMsg]);
    } else {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "I am having trouble connecting to the reservation service. The backend service may be restarting. Please wait a moment and try again." }
      ]);
    }
    setIsLoading(false);
  };


  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const clearChatHistory = () => {
    const newSession = "session_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    localStorage.setItem("rr_ai_session_id", newSession);
    setSessionId(newSession);
    setMessages([
      {
        role: "assistant",
        content: "Session reset. Hi! I am Vedika. How can I help you with your hotel booking today?"
      }
    ]);
  };

  const renderFormattedText = (text) => {
    if (!text) return "";
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} style={{ color: "#8A6110" }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* First-Time Pop-Up Greeting Bubble */}
      {showGreetingPopup && !isOpen && (
        <div className="vedika-greeting-popup" onClick={handlePopupClick}>
          <button
            className="vedika-popup-close"
            onClick={dismissPopup}
            title="Close"
            aria-label="Close message"
          >
            ✕
          </button>
          <div className="vedika-popup-header">
            <span className="vedika-popup-avatar">👑</span>
            <div className="vedika-popup-title-wrap">
              <span className="vedika-popup-name">Vedika</span>
              <span className="vedika-popup-tag">AI Assistant</span>
            </div>
          </div>
          <div className="vedika-popup-body">
            <p className="vedika-popup-msg">
              👋 <strong>Hi! I am Vedika.</strong> I can help in hotel booking!
            </p>
          </div>
          <div className="vedika-popup-footer">
            <span className="vedika-popup-action">Tap to chat with Vedika ➔</span>
          </div>
        </div>
      )}

      {/* Floating Launcher Avatar Button with Grow-Up Animation */}
      <button
        className={`rr-chatbot-launcher ${isGrowing ? "vedika-grow-animation" : ""}`}
        onClick={toggleChat}
        title="Chat with Vedika - AI Hotel Assistant"
        aria-label="Toggle Vedika AI Chat"
      >
        <span className="vedika-launcher-avatar">👩‍💼</span>
        {!isOpen && unreadCount > 0 && (
          <span className="rr-chatbot-badge">{unreadCount}</span>
        )}
      </button>

      {/* Luxury Chat Modal */}
      {isOpen && (
        <div className={`rr-chatbot-modal ${isExpanded ? "expanded" : ""}`}>
          <div className="rr-chatbot-bg-overlay"></div>
          <div className="rr-chatbot-tint"></div>

          <div className="rr-chatbot-content">
            {/* Header */}
            <div className="rr-chatbot-header">
              <div className="rr-chatbot-header-info">
                <div className="rr-chatbot-avatar">👩‍💼</div>
                <div>
                  <h3 className="rr-chatbot-title">Vedika</h3>
                  <div className="rr-chatbot-status">
                    <span className="rr-chatbot-dot"></span>
                    <span>AI Hotel Booking Assistant</span>
                  </div>
                </div>
              </div>
              <div className="rr-chatbot-actions">
                <button
                  className="rr-chatbot-icon-btn"
                  onClick={toggleExpand}
                  title={isExpanded ? "Minimize Window" : "Expand to Full Screen"}
                  aria-label={isExpanded ? "Minimize Window" : "Expand to Full Screen"}
                >
                  {isExpanded ? "🗗" : "⛶"}
                </button>
                <button
                  className="rr-chatbot-icon-btn"
                  onClick={clearChatHistory}
                  title="Reset Session"
                >
                  🔄
                </button>
                <button
                  className="rr-chatbot-icon-btn"
                  onClick={toggleChat}
                  title="Close Chat"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="rr-chatbot-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`rr-msg-row ${msg.role}`}>
                  <div className={`rr-bubble-${msg.role}`}>
                    {msg.content.split('\n').map((line, lIdx) => (
                      <p key={lIdx} style={{ margin: "0 0 6px 0" }}>
                        {renderFormattedText(line)}
                      </p>
                    ))}

                    {/* 1-Click Automated Booking Action Card */}
                    {msg.action && msg.action.type === "NAVIGATE_TO_BOOKING" && (
                      <div className="rr-action-card">
                        <div className="rr-action-card-header">
                          <span>✨</span>
                          <strong>Instant Reservation Ready</strong>
                        </div>
                        <p style={{ margin: "4px 0 10px 0", fontSize: "13px", color: "#634710" }}>
                          {msg.action.title}
                        </p>
                        <button
                          className="rr-action-card-btn"
                          onClick={() => handleBookingAction(msg.action)}
                        >
                          Reserve Room Now ➔
                        </button>
                      </div>
                    )}

                    {/* 1-Click Login Action Card */}
                    {msg.action && msg.action.type === "NAVIGATE_TO_LOGIN" && (
                      <div className="rr-action-card" style={{ borderColor: "#d97706", backgroundColor: "#fffbe6" }}>
                        <div className="rr-action-card-header">
                          <span>🔐</span>
                          <strong>Login Required to Complete Booking</strong>
                        </div>
                        <p style={{ margin: "4px 0 10px 0", fontSize: "13px", color: "#854d0e" }}>
                          {msg.action.title}
                        </p>
                        <button
                          className="rr-action-card-btn"
                          style={{ backgroundColor: "#d97706" }}
                          onClick={() => handleLoginAction(msg.action)}
                        >
                          Log In Now ➔
                        </button>
                      </div>
                    )}

                    {/* 1-Click UPI Payment Action Card */}
                    {msg.action && msg.action.type === "NAVIGATE_TO_PAYMENT" && (
                      <div className="rr-action-card" style={{ borderColor: "#16a34a", backgroundColor: "#f0fdf4" }}>
                        <div className="rr-action-card-header" style={{ color: "#15803d" }}>
                          <span>💳</span>
                          <strong>Booking Created – UPI Payment Ready</strong>
                        </div>
                        <p style={{ margin: "4px 0 10px 0", fontSize: "13px", color: "#166534" }}>
                          {msg.action.title}
                        </p>
                        <button
                          className="rr-action-card-btn"
                          style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
                          onClick={() => handlePaymentAction(msg.action)}
                        >
                          Pay via UPI QR Code ➔
                        </button>
                      </div>
                    )}

                    {/* Booking Confirmation Action Card */}
                    {msg.action && msg.action.type === "CONFIRM_BOOKING_PROMPT" && (
                      <div className="rr-action-card" style={{ borderColor: "#b8860b", backgroundColor: "#fffdf5" }}>
                        <div className="rr-action-card-header" style={{ color: "#8a6110" }}>
                          <span>📋</span>
                          <strong>Final Booking Confirmation Required</strong>
                        </div>
                        <p style={{ margin: "4px 0 10px 0", fontSize: "13px", color: "#634710" }}>
                          {msg.action.title}
                        </p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                          <button
                            className="rr-action-card-btn"
                            style={{ backgroundColor: "#16a34a", color: "#ffffff", flex: "1" }}
                            onClick={() => handleConfirmBookingPrompt(msg.action)}
                          >
                            Confirm & Book Room ➔
                          </button>
                          <button
                            className="rr-action-card-btn"
                            style={{ backgroundColor: "#9ca3af", color: "#ffffff", flex: "0 0 auto", padding: "8px 14px" }}
                            onClick={() => handleSendMessage("Cancel booking request")}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cancellation Confirmation Action Card */}
                    {msg.action && msg.action.type === "CONFIRM_CANCELLATION_PROMPT" && (
                      <div className="rr-action-card" style={{ borderColor: "#dc2626", backgroundColor: "#fef2f2" }}>
                        <div className="rr-action-card-header" style={{ color: "#b91c1c" }}>
                          <span>⚠️</span>
                          <strong>Confirm Booking Cancellation</strong>
                        </div>
                        <p style={{ margin: "4px 0 10px 0", fontSize: "13px", color: "#991b1b" }}>
                          {msg.action.title}
                        </p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                          <button
                            className="rr-action-card-btn"
                            style={{ backgroundColor: "#dc2626", color: "#ffffff", flex: "1" }}
                            onClick={() => handleConfirmCancellationPrompt(msg.action)}
                          >
                            Yes, Cancel Booking ➔
                          </button>
                          <button
                            className="rr-action-card-btn"
                            style={{ backgroundColor: "#9ca3af", color: "#ffffff", flex: "0 0 auto", padding: "8px 14px" }}
                            onClick={() => handleSendMessage("Keep my booking")}
                          >
                            Keep My Booking
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="rr-msg-row assistant">
                  <div className="rr-bubble-assistant">
                    <div className="rr-typing-dots">
                      <span className="rr-typing-dot"></span>
                      <span className="rr-typing-dot"></span>
                      <span className="rr-typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Pills */}
            <div className="rr-chatbot-suggestions">
              {QUICK_SUGGESTIONS.map((text, idx) => (
                <button
                  key={idx}
                  className="rr-suggestion-btn"
                  onClick={() => handleSendMessage(text)}
                  disabled={isLoading}
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Footer Input Bar */}
            <div className="rr-chatbot-footer">
              <div className="rr-chatbot-input-row">
                <input
                  type="text"
                  className="rr-chatbot-input"
                  placeholder="Ask Vedika about rooms, rates, policies..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <button
                  className="rr-chatbot-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  title="Send Message"
                >
                  ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;

