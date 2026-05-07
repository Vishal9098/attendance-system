import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, User } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const EXAMPLE_QUERIES = [
  "Who came late today?",
  "How many employees are present today?",
  "Show employees with less than 8 hours this week",
  "List all pending overtime requests",
  "Give me today's attendance summary",
  "Who is absent today?"
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI attendance assistant. Ask me anything about attendance, overtime, late arrivals, or employee summaries. I have access to real-time data!"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (query) => {
    const text = query || input.trim()
    if (!text) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/ai/query', { query: text })
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'AI query failed. Check your API key in backend settings.'
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot size={28} className="text-blue-600" /> AI Assistant
        </h1>
        <p className="text-sm text-gray-500 mt-1">Ask anything about attendance, employees, overtime, and more</p>
      </div>

      {/* Example queries */}
      <div className="flex flex-wrap gap-2 mb-4">
        {EXAMPLE_QUERIES.map(q => (
          <button key={q} onClick={() => sendMessage(q)}
            className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
            {q}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto card space-y-4 mb-4 min-h-[300px] max-h-[50vh]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'assistant' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              {msg.role === 'assistant' ? <Bot size={16} className="text-white" /> : <User size={16} />}
            </div>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
              msg.role === 'assistant'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                : 'bg-blue-600 text-white rounded-tr-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-tl-none">
              <Loader2 size={18} className="animate-spin text-blue-600" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <textarea
          className="input flex-1 resize-none min-h-[44px] max-h-[120px]"
          rows={1}
          placeholder="Ask about attendance, late employees, overtime..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
          className="btn-primary px-4 flex items-center gap-2">
          <Send size={18} />
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Press Enter to send • Shift+Enter for new line</p>
    </div>
  )
}
