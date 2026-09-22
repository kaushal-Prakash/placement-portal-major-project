"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, User, Bot, ArrowLeft } from "lucide-react";

export default function CopilotChat() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Career Copilot. How can I help you prepare for your placements today?' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "student") {
      router.push("/admin");
      return;
    }
    
    setUser(parsedUser);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5001/api/copilot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: messages.slice(1) // exclude initial greeting
        })
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen bg-[#f7f2eb] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#8b9a6e]" /></div>;

  return (
    <div className="min-h-screen bg-[#f7f2eb] flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-6 h-6 text-[#8b9a6e]" />
              AI Career Copilot
            </h1>
            <p className="text-sm text-gray-500">Ask me anything about placements, resumes, or interviews</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col relative">
        <div className="flex-1 overflow-y-auto mb-20 space-y-6 pb-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-[#8b9a6e]/10 flex items-center justify-center shrink-0 border border-[#8b9a6e]/20">
                  <Bot className="w-5 h-5 text-[#8b9a6e]" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gray-900 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
              }`}>
                {msg.content.split('\\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0 leading-relaxed">{line}</p>
                ))}
              </div>
              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 rounded-full bg-[#8b9a6e]/10 flex items-center justify-center shrink-0 border border-[#8b9a6e]/20">
                <Bot className="w-5 h-5 text-[#8b9a6e]" />
              </div>
              <div className="bg-white rounded-2xl p-4 rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#8b9a6e]" />
                <span className="text-sm text-gray-500 font-medium">Copilot is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#f7f2eb] via-[#f7f2eb] to-transparent pt-10 pb-6 px-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative flex items-center shadow-lg rounded-2xl overflow-hidden bg-white border border-gray-200 focus-within:border-[#8b9a6e] focus-within:ring-2 focus-within:ring-[#8b9a6e]/20 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about placements, skill gaps, or interview tips..."
                className="w-full py-4 pl-6 pr-14 outline-none text-gray-800 bg-transparent placeholder-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-3 font-medium">
              AI Copilot can make mistakes. Consider verifying important information.
            </p>
          </div>
        </div>
      </main>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 154, 110, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 154, 110, 0.5);
        }
      `}</style>
    </div>
  );
}
