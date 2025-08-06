import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Upload, 
  LogOut, 
  Plus, 
  FileText, 
  History, 
  Trash2,
  RefreshCw,
  User,
  Bot,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import FileUpload from './FileUpload';

const API_BASE = 'http://localhost:8000';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  message: string;
  timestamp?: string;
}

interface FileItem {
  id: string;
  file_name: string;
  upload_time?: string;
}

interface Session {
  session_token: string;
  first_question: string;
  created_at?: string;
}

export default function ChatPage() {
  const { sessionToken, username, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadFiles();
    loadChatHistory();
    loadSessions();
  }, [sessionToken]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/files?session_token=${sessionToken}`);
      const data = await response.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles([]);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/chat-history?session_token=${sessionToken}`);
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setMessages([]);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/sessions?session_token=${sessionToken}`);
      const data = await response.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    // Add user message immediately
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      message: userMessage
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const body: any = {
        question: userMessage,
        session_token: sessionToken
      };

      if (selectedFileId) {
        body.file_id = selectedFileId;
      }

      const response = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      // Add agent response
      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        message: data.answer || 'No response received'
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: 'agent',
        message: 'Sorry, there was an error processing your request.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`${API_BASE}/chat-history/${messageId}?session_token=${sessionToken}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`${API_BASE}/file/${fileId}?session_token=${sessionToken}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
        if (selectedFileId === fileId) {
          setSelectedFileId('');
          setSelectedFileName('');
        }
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const deleteSession = async (sessionTokenToDelete: string) => {
    try {
      const response = await fetch(`${API_BASE}/sessions/${sessionTokenToDelete}?session_token=${sessionToken}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.session_token !== sessionTokenToDelete));
        if (sessionToken === sessionTokenToDelete) {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const loadSessionChat = async (sessionTokenToLoad: string) => {
    try {
      const response = await fetch(`${API_BASE}/chat-history-by-session?session_token=${sessionTokenToLoad}`);
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load session chat:', error);
    }
  };

  const startNewChat = async () => {
    try {
      const response = await fetch(`${API_BASE}/new-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken })
      });

      const data = await response.json();
      if (data.session_token) {
        setMessages([]);
        setSelectedFileId('');
        setSelectedFileName('');
        loadSessions();
      }
    } catch (error) {
      console.error('Failed to start new chat:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-gray-100 border-r border-gray-300 transition-all duration-300 ease-in-out flex flex-col ${
        isSidebarCollapsed ? 'w-12' : 'w-80'
      } ${isSidebarCollapsed ? 'lg:w-12' : 'lg:w-80'} 
      ${isSidebarCollapsed ? 'md:w-12' : 'md:w-72'} 
      ${isSidebarCollapsed ? 'w-0 md:w-12' : 'w-80 md:w-72'}`}>
        {/* Sidebar Header */}
        <div className="p-3 md:p-4 border-b border-gray-300 bg-gray-200">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <h2 className="text-base md:text-lg font-semibold text-gray-800">Navigation</h2>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 md:p-2 hover:bg-gray-300 rounded-lg transition-colors"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {!isSidebarCollapsed && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Files Section */}
            <div className="flex-1 p-3 md:p-4 border-b border-gray-300 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  My Files
                </h3>
                <FileUpload
                  sessionToken={sessionToken}
                  onUploadSuccess={loadFiles}
                  ref={fileInputRef}
                />
              </div>
              
              <div className="space-y-2 overflow-y-auto flex-1 min-h-0 max-h-48 md:max-h-64">
                <button
                  onClick={() => {
                    setSelectedFileId('');
                    setSelectedFileName('');
                  }}
                  className={`w-full text-left p-2 md:p-3 rounded-lg transition-colors text-xs md:text-sm ${
                    !selectedFileId 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <FileText className="w-3 h-3 md:w-4 md:h-4 inline mr-2" />
                  All Files
                </button>
                
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`group p-2 md:p-3 rounded-lg transition-colors cursor-pointer text-xs md:text-sm ${
                      selectedFileId === file.id
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'hover:bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedFileId(file.id);
                      setSelectedFileName(file.file_name);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <FileText className="w-3 h-3 md:w-4 md:h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{file.file_name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-red-100 rounded transition-all text-red-500"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {files.length === 0 && (
                  <div className="text-gray-500 text-sm p-4 text-center">
                    No files uploaded yet
                  </div>
                )}
              </div>
            </div>

            {/* Chat History Section */}
            <div className="flex-1 p-3 md:p-4 min-h-0 flex flex-col">
              <h3 className="text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Chat History
              </h3>
              
              <div className="space-y-2 overflow-y-auto flex-1 min-h-0 max-h-48 md:max-h-64">
                {sessions.map((session) => (
                  <div
                    key={session.session_token}
                    className="group p-2 md:p-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-xs md:text-sm"
                    onClick={() => loadSessionChat(session.session_token)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-gray-800">
                          {session.first_question || 'New Chat'}
                        </p>
                        {session.created_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.session_token);
                        }}
                        className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-red-100 rounded transition-all text-red-500"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {sessions.length === 0 && (
                  <div className="text-gray-500 text-sm p-4 text-center">
                    No chat history yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-300 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {selectedFileName && (
                <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <Paperclip className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-medium">
                    {selectedFileName}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={startNewChat}
                className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
              
              <button
                onClick={loadChatHistory}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-800">{username}</span>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
                
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to Ask Buddy
                </h3>
                <p className="text-gray-600">
                  Upload documents and start asking questions about them.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`group max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl p-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender === 'agent' && (
                      <Bot className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-black/10 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-2xl border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-emerald-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-gray-50 border-t border-gray-300 p-4">
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-colors bg-white"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isSending}
              />
            </div>
            
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isSending}
              className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}