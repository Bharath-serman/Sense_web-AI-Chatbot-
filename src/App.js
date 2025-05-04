import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import "./App.css";

function ThemeToggle({ toggleTheme, isDark }) {
  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {isDark ? "🌞 Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}

function DeleteConfirmation({ onConfirm, onCancel }) {
  return (
    <div className="delete-popup">
      <div className="popup-content">
        <p>Are you sure you wanna delete this chat?</p>
        <div className="popup-buttons">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="delete-btn" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ conversations, onSelectConversation, onNewChat, onDelete, onRename }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sidebar">
      <button className="sidebar-toggle-btn" onClick={onNewChat}>➕ New Chat</button>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-box"
          placeholder=" Search Chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Chat List */}
      <div className="conversation-list">
        {filteredConversations.map((conv, index) => (
          <div key={index} className="conversation">
            {/* If editing, show input field */}
            {editingIndex === index ? (
              <input
                type="text"
                value={newTitle}
                className="edit-chat-input"
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={() => {
                  if (newTitle.trim()) {
                    onRename(index, newTitle);
                  }
                  setEditingIndex(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle.trim()) {
                    onRename(index, newTitle);
                    setEditingIndex(null);
                  }
                }}
                autoFocus
              />
            ) : (
              <span onClick={() => onSelectConversation(conversations.indexOf(conv))}>
                {conv.title}
              </span>
            )}

            {/* Edit & Delete Buttons */}
            <button onClick={() => { setEditingIndex(index); setNewTitle(conv.title); }}>✏️</button>
            <button onClick={() => onDelete(index)}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePopup({ isOpen, onClose, profilePic, onProfileChange }) {
  return (
    isOpen && (
      <div className="profile-popup">
        <div className="popup-content">
          <span className="close-btn" onClick={onClose}>❌</span>
          <img src={profilePic} alt="Profile" className="profile-pic" />
          <input type="file" accept="image/*" onChange={onProfileChange} />
        </div>
      </div>
    )
  );
}

function ProfileSection() {
  const [profilePic, setProfilePic] = useState(
    () => localStorage.getItem("profilePic") || "default-avatar.png"
  );
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleProfileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePic(e.target.result);
        localStorage.setItem("profilePic", e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-section">
      <img
        src={profilePic}
        alt="Profile"
        className="profile-pic"
        onClick={() => setIsPopupOpen(true)}
      />
      <ProfilePopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        profilePic={profilePic}
        onProfileChange={handleProfileChange}
      />
    </div>
  );
}

function ChatBot() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  const [extractedDocs, setExtractedDocs] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [abortController, setAbortController] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lookAtInput, setLookAtInput] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState(() => JSON.parse(localStorage.getItem("conversations")) || []);
  const [currentChatIndex, setCurrentChatIndex] = useState(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [deleteIndex, setDeleteIndex] = useState(null);
  const typingIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isExploded, setIsExploded] = useState(false);

  const handleInputFocus = () => {
    setIsExploded(true);
  };

  const handleMouseClick = (e) => {
    const ripple = document.createElement("div");
    ripple.classList.add("click-animation");

    const x = e.clientX;
    const y = e.clientY;

    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    document.body.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 500);
  };

  useEffect(() => {
    window.addEventListener("click", handleMouseClick);
    return () => {
      window.removeEventListener("click", handleMouseClick);
    };
  }, []);

  const handleGlobalDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleGlobalDragLeave = () => {
    setIsDragging(false);
  };

  const handleGlobalDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles((prevFiles) => [...prevFiles, ...files]);
    }
  };

  function SettingsPopup({ onClose, onDeleteAllChats, onOpenArchive, onOpenArchivedChats }) {
    return (
      <div className="settings-popup">
        <div className="popup-content">
          <h2>Settings</h2>
          <button className="delete-all-btn" onClick={onDeleteAllChats}>
            🗑️ Delete All Chats
          </button>
          <button className="close-btn" onClick={onClose}>❌</button>
        </div>
      </div>
    );
  }

  const handleDeleteAllChats = () => {
    setConversations([]);
    localStorage.removeItem("conversations");
    setIsSettingsOpen(false);
  };

  const extractTextFromFile = async (file) => {
    return new Promise(async (resolve, reject) => {
      const reader = new FileReader();

      if (file.type === "text/plain" || file.type === "application/json") {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
      }

      else if (file.type === "application/pdf") {
        reader.onload = async () => {
          try {
            const typedArray = new Uint8Array(reader.result);
            const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
            let text = "";

            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              const pageText = content.items.map((item) => item.str).join(" ");
              text += pageText + "\n";
            }

            resolve(text);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      }
      else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        reader.onload = async () => {
          try {
            const mammoth = (await import("mammoth")).default;
            const data = await mammoth.extractRawText({ arrayBuffer: reader.result });
            resolve(data.value);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      }
      else {
        resolve("");
      }
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setUploadedFiles((prevFiles) => [...prevFiles, ...files]);
      try {
        const extractedTexts = await Promise.all(files.map(extractTextFromFile));
        setExtractedDocs((prevDocs) => [...prevDocs, ...extractedTexts.filter(Boolean)]);
      } catch (error) {
        console.error("Error extracting text from files:", error);
      }
    }
  };

  const openFilePicker = () => {
    document.getElementById("fileInput").click();
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    const appContainer = document.querySelector(".app-container");

    if (isDark) {
      document.body.classList.add("dark-theme");
      appContainer.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
      appContainer.classList.remove("dark-theme");
    }

    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem("conversations")) || [];
    setConversations(savedChats);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const handleSendMessage = async () => {
    if (input.trim() === "" && extractedDocs.length === 0) return;

    setIsGenerating(true);
    let newConversations = [...conversations];
    let chatIndex = currentChatIndex;

    if (chatIndex === null) {
      chatIndex = newConversations.length;
      const chatTitle = input.split(" ").slice(0, 5).join(" ") || `Chat ${chatIndex + 1}`;
      newConversations.push({ title: chatTitle, messages: [] });
    }

    const userMessage = { sender: "user", text: input };
    newConversations[chatIndex].messages.push(userMessage);
    setConversations(newConversations);
    setCurrentChatIndex(chatIndex);
    setMessages([...newConversations[chatIndex].messages]);
    setInput("");
    localStorage.setItem("conversations", JSON.stringify(newConversations));

    try {
      const promptWithDocs = extractedDocs.length
        ? `User uploaded documents:\n\n${extractedDocs.join("\n\n")}\n\nUser's question: ${input}`
        : input;

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-r1:1.5b",
          prompt: promptWithDocs,
          stream: false,
        }),
      });

      const data = await response.json();
      const fullResponseText = data.response || "I didn't get that. Try again!";

      let botMessage = { sender: "bot", text: "" };
      newConversations[chatIndex].messages.push(botMessage);
      setMessages([...newConversations[chatIndex].messages]);

      let index = 0;
      let typingInterval = setInterval(() => {
        if (index < fullResponseText.length) {
          botMessage.text += fullResponseText[index];
          setMessages([...newConversations[chatIndex].messages]);
          index++;
        } else {
          clearInterval(typingInterval);
          typingIntervalRef.current = null;
          setIsGenerating(false);
          localStorage.setItem("conversations", JSON.stringify(newConversations));
        }
      }, 30);

      typingIntervalRef.current = typingInterval;

    } catch (error) {
      console.error("Error fetching response:", error);
      newConversations[chatIndex].messages.push({ sender: "bot", text: "Error connecting to AI server." });
      setConversations(newConversations);
      setMessages([...newConversations[chatIndex].messages]);
      setIsGenerating(false);
    }
  };

  const createNewChat = () => {
    const newChat = { title: `Chat ${conversations.length + 1}`, messages: [] };
    const updatedConversations = [...conversations, newChat];

    setConversations(updatedConversations);
    setCurrentChatIndex(conversations.length);
    setMessages([]);
    localStorage.setItem("conversations", JSON.stringify(updatedConversations));
  };

  const selectConversation = (index) => {
    setCurrentChatIndex(index);
    setMessages([...conversations[index].messages]);
  };

  const deleteConversation = () => {
    if (deleteIndex !== null) {
      const updatedConversations = conversations.filter((_, i) => i !== deleteIndex);
      setConversations(updatedConversations);
      setCurrentChatIndex(null);
      setMessages([]);
      setDeleteIndex(null);
      localStorage.setItem("conversations", JSON.stringify(updatedConversations));
    }
  };

  useEffect(() => {
    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("dragleave", handleGlobalDragLeave);
    window.addEventListener("drop", handleGlobalDrop);

    return () => {
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("dragleave", handleGlobalDragLeave);
      window.removeEventListener("drop", handleGlobalDrop);
    };
  }, []);

  return (
    <> {/* React Fragment to wrap multiple elements */}
      {/* Global Drag-and-Drop Overlay */}
      {isDragging && <div className="drag-overlay visible">Drop files Anywhere to upload!</div>}

      <div className="app-container">
        <div className="space-background"></div> {/* Space Background */}
        <ThemeToggle toggleTheme={toggleTheme} isDark={isDark} />
        <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>
          ⚙️ Settings
        </button>
        {isSettingsOpen && (
          <SettingsPopup
            onClose={() => setIsSettingsOpen(false)}
            onDeleteAllChats={handleDeleteAllChats}

          />
        )}

        <div className="app-container">
          {/* Sidebar */}
          <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
            <Sidebar
              conversations={conversations}
              onSelectConversation={selectConversation}
              onDelete={(index) => setDeleteIndex(index)}
              onRename={(index, newTitle) => {
                if (newTitle) {
                  const updatedConversations = [...conversations];
                  updatedConversations[index].title = newTitle;
                  setConversations(updatedConversations);
                }
              }}
              onNewChat={createNewChat}
            />
          </div>

          {/* Sidebar Toggle Button */}
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isSidebarOpen ? "❌ Close" : "📂 Open"}
          </button>
          <div className="website-title">
            <h1>SENSE WEB</h1>
          </div>
          {/* Chat Section */}
          <div className="chat-section">
            <div className="chat-box">
              <p className={`box-text ${isExploded ? "explode" : ""}`}>HOW CAN I HELP YOU?</p>
              {/* Display Uploaded Files */}

              <div className="uploaded-files">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="uploaded-file">
                    <span className="file-icon">📄</span>
                    <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer">
                      {file.name}
                    </a>
                  </div>
                ))}
              </div>
              {/* Chat Messages */}
              <div className="messages-container">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender === "user" ? "user-message" : "bot-message"} ${msg.className || ''}`}>
                    {msg.text}
                  </div>
                ))}
                <div ref={messagesEndRef}></div>

                {isGenerating && (
                  <div className="typing-indicator">Typing...</div>
                )}
              </div>

              {/* Input Section */}
              <div className="input-container">
                {/* File Upload Button */}
                <button className="file-upload-button" onClick={openFilePicker}>
                  ➕
                </button>

                {/* Hidden File Input */}
                <input
                  type="file"
                  id="fileInput"
                  className="file-input"
                  multiple
                  onChange={handleFileUpload}
                />

                <input
                  type="text"
                  className="input-box"
                  placeholder="Message SenseWeb..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={() => setLookAtInput(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />

                <button className="send-button" onClick={isGenerating ? handleStopGeneration : handleSendMessage}>
                  {isGenerating ? "Stop" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <video className="background-video" src="violet.mp4" autoPlay loop muted />
        <ProfileSection />
        {deleteIndex !== null && <DeleteConfirmation onConfirm={deleteConversation} onCancel={() => setDeleteIndex(null)} />}
      </div>
    </>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    console.log('Login successful');
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleSignup = () => {
    setIsAuthenticated(true);
  };

  return (
    <div className="App">
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <Route path="/" element={<ChatBot />} />
        )}
      </Routes>
    </div>
  );
}

export default App;
