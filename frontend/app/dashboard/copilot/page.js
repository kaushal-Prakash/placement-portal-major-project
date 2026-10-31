"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, User, Bot, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function CopilotChat() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your **AI Career Copilot**.\n\nHow can I help you prepare for your placements today? You can ask about:\n- Company interview questions and packages\n- Resume tips and skill-gap recommendations\n- Technical and HR round prep roadmaps' }
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
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message AND placeholder assistant message for streaming
    const messagesWithUser = [...messages, { role: 'user', content: userMessage }];
    const messagesWithPlaceholder = [...messagesWithUser, { role: 'assistant', content: '' }];
    setMessages(messagesWithPlaceholder);
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
          chatHistory: messages.slice(1).map(m => ({ role: m.role, content: m.content })),
          stream: true
        })
      });

      if (!res.ok) {
        throw new Error("Failed to get response from copilot");
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantReply = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const dataStr = trimmed.replace(/^data:\s*/, "");
            if (dataStr === "[DONE]") {
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) {
                assistantReply += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantReply
                  };
                  return updated;
                });
              }
            } catch {
              // Raw text chunk fallback
              assistantReply += dataStr;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantReply
                };
                return updated;
              });
            }
          }
        }
      } else {
        // Fallback non-streaming JSON handling
        const data = await res.json();
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: data.reply || "No response received."
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("[Copilot Frontend Error]:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I encountered an error connecting to the Copilot server. Please check your network and try again.'
        };
        return updated;
      });
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
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-6 h-6 text-[#8b9a6e]" />
              AI Career Copilot
            </h1>
            <p className="text-sm text-gray-500">Ask me anything about placements, company archives, or interview roadmaps</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col relative">
        <div className="flex-1 overflow-y-auto mb-20 space-y-6 pb-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-[#8b9a6e]/10 flex items-center justify-center shrink-0 border border-[#8b9a6e]/20 mt-1">
                  <Bot className="w-5 h-5 text-[#8b9a6e]" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gray-900 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
              }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                ) : msg.content === '' && isLoading && idx === messages.length - 1 ? (
                  <div className="flex items-center gap-2 text-gray-500 py-1">
                    <Loader2 className="w-4 h-4 animate-spin text-[#8b9a6e]" />
                    <span className="text-sm font-medium">Copilot is thinking...</span>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-gray-800">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-base font-bold text-gray-900 mt-3 mb-1 first:mt-0" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-bold text-gray-900 mt-3 mb-1 first:mt-0" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-bold text-gray-900 mt-2.5 mb-1 first:mt-0" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-2.5 mt-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 mb-2.5 mt-1" {...props} />,
                        li: ({node, ...props}) => <li className="pl-0.5 text-gray-800" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-gray-950" {...props} />,
                        code: ({node, inline, ...props}) => inline ? (
                          <code className="bg-gray-100 text-[#8b9a6e] px-1.5 py-0.5 rounded text-xs font-mono font-medium" {...props} />
                        ) : (
                          <pre className="bg-gray-900 text-gray-100 p-3 rounded-xl overflow-x-auto my-2 text-xs font-mono">
                            <code {...props} />
                          </pre>
                        ),
                        blockquote: ({node, ...props}) => (
                          <blockquote className="border-l-4 border-[#8b9a6e] pl-3 italic text-gray-600 my-2" {...props} />
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}
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
                className="w-full py-4 pl-6 pr-14 outline-none text-gray-800 bg-transparent placeholder-gray-400 text-sm"
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
              AI Copilot is grounded in college placement archives. Verify important dates with placement officers.
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
