import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Sparkles, Send, X, Trash2, Terminal, User, Cpu, ArrowUpRight } from 'lucide-react'
import { queryAiAssistant, fetchPortfolioContext } from '../../services/aiAssistantService'

const SUGGESTED_PROMPTS = [
  'What stack was used for GuardGPT?',
  'Is Charan open for contract work?',
  'What are Charan’s core skills?',
  'How can I get in touch?',
]

function renderFormattedMessage(text, onNavigate) {
  if (!text) return null

  // Split lines
  const lines = text.split('\n')

  return lines.map((line, lIdx) => {
    // Check if line contains bullet points or bold text or inline code or hash links
    const parts = line.split(/(\*\*.*?\*\*|`.*?`|#[a-zA-Z0-9-]+)/g)

    return (
      <p key={lIdx} className={lIdx > 0 ? 'mt-2' : ''}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-bold text-accent">
                {part.slice(2, -2)}
              </strong>
            )
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={pIdx} className="px-1.5 py-0.5 mx-0.5 text-xs font-mono bg-dark-bg border border-accent/20 text-accent rounded-xs">
                {part.slice(1, -1)}
              </code>
            )
          }
          if (part.startsWith('#')) {
            const target = part.trim()
            return (
              <button
                key={pIdx}
                type="button"
                onClick={() => onNavigate(target)}
                className="inline-flex items-center gap-0.5 text-accent font-mono underline hover:text-accent-2 transition-colors cursor-pointer px-1 py-0.5 bg-accent/10 rounded-xs"
              >
                {part}
                <ArrowUpRight size={10} />
              </button>
            )
          }
          return part
        })}
      </p>
    )
  })
}

export default memo(function AiAssistantDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: '👋 Hi! I am **Ask Charan AI**. I can answer questions about Charanraj’s skills, experience, project architecture (like **GuardGPT**), and availability.\n\nHow can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [portfolioContext, setPortfolioContext] = useState(null)
  const messagesEndRef = useRef(null)

  // Pre-fetch portfolio context when component mounts
  useEffect(() => {
    fetchPortfolioContext().then((ctx) => setPortfolioContext(ctx))
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, scrollToBottom])

  const handleSend = async (customText = null) => {
    const textToSend = customText || input
    if (!textToSend.trim() || loading) return

    const userMsg = {
      id: `user-${crypto.randomUUID()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!customText) setInput('')
    setLoading(true)

    try {
      const history = messages.filter((m) => m.id !== 'welcome')
      const result = await queryAiAssistant(textToSend, history, portfolioContext)

      const aiMsg = {
        id: `ai-${crypto.randomUUID()}`,
        sender: 'ai',
        text: result.text,
        source: result.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      console.error('AI error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${crypto.randomUUID()}`,
          sender: 'ai',
          text: 'Sorry, I ran into an issue retrieving that detail. Feel free to reach out via the #contact section!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Chat cleared. Ask me anything about Charanraj’s projects, tech stack, or availability!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  const handleNavigate = (hashtag) => {
    const sectionId = hashtag.replace('#', '')
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center gap-3 px-4 py-3 bg-dark-surface/90 backdrop-blur-md border border-accent/40 text-accent hover:border-accent hover:shadow-[0_0_25px_rgba(0,242,255,0.3)] transition-all duration-300 font-mono text-sm cursor-pointer"
          aria-label="Open Ask Charan AI Assistant"
        >
          {/* Glowing pulse ring */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
          </span>
          <Bot size={18} className="text-accent group-hover:rotate-12 transition-transform" />
          <span className="font-semibold tracking-wider text-text-primary group-hover:text-accent transition-colors">
            Ask Charan AI
          </span>
          <Sparkles size={14} className="text-accent/60 group-hover:text-accent animate-pulse" />
        </motion.button>
      </div>

      {/* DRAWER MODAL BACKDROP & OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-over Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 w-full sm:w-[460px] h-full bg-dark-bg border-l border-accent/30 shadow-2xl flex flex-col font-sans"
            >
              {/* DRAWER HEADER */}
              <div className="p-4 sm:p-5 border-b border-dark-border bg-dark-surface/80 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-accent/40 bg-accent/10 text-accent">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold font-mono tracking-wide text-text-primary text-base">
                        ASK CHARAN AI
                      </h3>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono border border-accent/30 text-accent bg-accent/5 uppercase">
                        ONLINE
                      </span>
                    </div>
                    <p className="text-xs text-text-muted font-mono">Recruiter & Tech Assistant</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearChat}
                    title="Clear Conversation"
                    className="p-2 text-text-muted hover:text-accent border border-transparent hover:border-dark-border transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    title="Close Assistant"
                    className="p-2 text-text-muted hover:text-text-primary border border-transparent hover:border-dark-border transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* MESSAGES CONTAINER */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans text-sm leading-relaxed">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user'
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`w-7 h-7 flex-shrink-0 flex items-center justify-center border text-xs font-mono ${
                          isUser
                            ? 'bg-accent/20 border-accent text-accent'
                            : 'bg-dark-surface border-accent/30 text-accent'
                        }`}
                      >
                        {isUser ? <User size={14} /> : <Bot size={14} />}
                      </div>

                      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`p-3.5 border text-sm ${
                            isUser
                              ? 'bg-accent/10 border-accent/40 text-text-primary'
                              : 'bg-dark-surface border-dark-border text-text-secondary'
                          }`}
                        >
                          {renderFormattedMessage(msg.text, handleNavigate)}
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-[10px] text-text-muted font-mono">{msg.timestamp}</span>
                          {msg.source && msg.source !== 'local' && (
                            <span className="text-[9px] font-mono text-accent/70 uppercase">
                              via {msg.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}

                {/* TYPING INDICATOR */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 items-center text-text-muted text-xs font-mono py-2"
                  >
                    <div className="w-7 h-7 flex items-center justify-center border border-accent/30 bg-dark-surface text-accent">
                      <Bot size={14} />
                    </div>
                    <div className="p-3 bg-dark-surface border border-dark-border flex items-center gap-1.5">
                      <Terminal size={12} className="text-accent animate-spin" />
                      <span>Analyzing portfolio knowledge base...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* SUGGESTED PROMPTS */}
              <div className="px-4 py-2 border-t border-dark-border bg-dark-surface/50">
                <p className="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1">
                  <Terminal size={10} className="text-accent" />
                  Suggested Inquiries
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      disabled={loading}
                      onClick={() => handleSend(prompt)}
                      className="px-2.5 py-1 text-xs font-mono border border-dark-border hover:border-accent/50 text-text-secondary hover:text-accent bg-dark-bg/80 transition-colors text-left cursor-pointer disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* INPUT FORM */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="p-4 border-t border-dark-border bg-dark-surface flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about GuardGPT, tech stack, hiring..."
                  disabled={loading}
                  className="flex-1 px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-accent text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-hidden transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="px-4 py-2.5 bg-accent text-white font-mono text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <Send size={14} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
})
