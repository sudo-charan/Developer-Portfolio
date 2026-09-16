import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Sparkles, Send, X, Trash2, Terminal, User, Cpu, ArrowUpRight, Copy, Check } from 'lucide-react'
import { queryAiAssistant, fetchPortfolioContext } from '../../services/aiAssistantService'

const SUGGESTED_PROMPTS = [
  'What has Charan built?',
  "Tell me about Charan's recent experience",
  "What are Charan's strongest technical skills?",
  'How can I contact Charan?',
  'Tell me about GuardGPT',
]

const INITIAL_WELCOME = {
  id: 'welcome',
  sender: 'ai',
  text: '👋 Hi! I’m **Ask Charan AI**.\n\nExplore Charanraj’s projects, technical skills, experience, and tech journey — or ask me about **GuardGPT**.',
}

function renderFormattedMessage(text, onNavigate) {
  if (!text) return null

  const lines = text.split('\n')

  return lines.map((line, lIdx) => {
    const trimmed = line.trim()

    if (!trimmed) {
      return <div key={lIdx} className="h-1.5" />
    }

    const isHeading = trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')
    let headingText = trimmed
    if (isHeading) {
      headingText = trimmed.replace(/^#+\s*/, '')
    }

    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')
    let lineContent = isHeading ? headingText : trimmed
    if (isBullet) {
      lineContent = trimmed.replace(/^[-*•]\s*/, '')
    }

    const parts = lineContent.split(/(\*\*.*?\*\*|`.*?`|#[a-zA-Z0-9-]+)/g)

    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-accent">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={pIdx} className="px-1.5 py-0.5 mx-0.5 text-[11px] font-mono bg-dark-bg/80 border border-accent/25 text-accent rounded-xs font-normal">
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
            className="inline-flex items-center gap-0.5 text-accent font-mono underline hover:text-accent/80 transition-colors cursor-pointer px-1 py-0.5 bg-accent/10 rounded-xs text-[11px]"
          >
            {part}
            <ArrowUpRight size={10} />
          </button>
        )
      }
      return part
    })

    if (isHeading) {
      return (
        <h4 key={lIdx} className="font-bold font-mono text-accent text-xs sm:text-sm mt-2 mb-1 tracking-wide">
          {renderedParts}
        </h4>
      )
    }

    if (isBullet) {
      return (
        <div key={lIdx} className="flex items-start gap-2 my-1 pl-1">
          <span className="text-accent font-bold leading-none mt-1 text-[10px]">•</span>
          <div className="flex-1 leading-relaxed text-xs sm:text-sm text-text-secondary font-sans break-words">
            {renderedParts}
          </div>
        </div>
      )
    }

    return (
      <p key={lIdx} className="my-1 leading-relaxed text-xs sm:text-sm text-text-secondary font-sans break-words">
        {renderedParts}
      </p>
    )
  })
}

export default memo(function AiAssistantDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      ...INITIAL_WELCOME,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [portfolioContext, setPortfolioContext] = useState(null)
  const messagesEndRef = useRef(null)

  // Pre-fetch portfolio context when component mounts
  useEffect(() => {
    fetchPortfolioContext().then((ctx) => setPortfolioContext(ctx))
  }, [])

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

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
        ...INITIAL_WELCOME,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  const handleCopyText = (msgId, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(msgId)
    setTimeout(() => setCopiedId(null), 2000)
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
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center gap-2.5 px-3.5 py-2.5 bg-dark-surface/95 backdrop-blur-md border border-accent/40 text-accent hover:border-accent hover:shadow-[0_0_20px_rgba(249,115,22,0.25)] transition-all duration-300 font-mono text-xs rounded-full cursor-pointer"
          aria-label="Open Ask Charan AI Assistant"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
          </span>
          <Bot size={16} className="text-accent group-hover:rotate-12 transition-transform" />
          <span className="font-semibold tracking-wider text-text-primary group-hover:text-accent transition-colors">
            Ask Charan AI
          </span>
          <Sparkles size={12} className="text-accent/70 group-hover:text-accent" />
        </motion.button>
      </div>

      {/* COMPACT FLOATING CHAT PANEL */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Reduced Backdrop Overlay (Lightened Blur & Opacity) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] transition-opacity"
            />

            {/* Compact Floating Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-[400px] h-[min(620px,calc(100vh-80px))] bg-dark-surface/95 backdrop-blur-md border border-accent/30 rounded-2xl shadow-2xl shadow-black/80 flex flex-col font-sans overflow-hidden"
            >
              {/* COMPACT HEADER */}
              <div className="px-4 py-3 border-b border-dark-border bg-dark-surface/90 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 border border-accent/30 bg-accent/10 text-accent rounded-lg">
                    <Cpu size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold font-mono tracking-wide text-text-primary text-xs sm:text-sm">
                        ASK CHARAN AI
                      </h3>
                      <span className="px-1.5 py-0.2 text-[9px] font-mono border border-accent/30 text-accent bg-accent/5 uppercase rounded-full">
                        ONLINE
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted font-mono leading-none mt-0.5">Recruiter & Tech Assistant</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClearChat}
                    aria-label="Clear conversation"
                    title="Clear Conversation"
                    className="p-1.5 text-text-muted hover:text-accent rounded-md hover:bg-dark-bg transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close assistant"
                    title="Close Assistant"
                    className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-dark-bg transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* CHAT MESSAGES AREA (FLEX: 1 GROWING CONTAINER) */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans text-xs sm:text-sm leading-relaxed ai-chat-scrollbar overscroll-contain">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user'
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border text-[10px] font-mono mt-0.5 ${
                          isUser
                            ? 'bg-accent/20 border-accent text-accent'
                            : 'bg-dark-bg border-accent/30 text-accent'
                        }`}
                      >
                        {isUser ? <User size={12} /> : <Bot size={12} />}
                      </div>

                      <div className={`max-w-[84%] ${isUser ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`p-3 text-xs sm:text-sm leading-relaxed ${
                            isUser
                              ? 'bg-accent/15 border border-accent/30 text-text-primary rounded-2xl rounded-tr-xs'
                              : 'bg-dark-bg border border-dark-border text-text-secondary rounded-2xl rounded-tl-xs shadow-xs'
                          }`}
                        >
                          {renderFormattedMessage(msg.text, handleNavigate)}
                        </div>

                        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[9px] text-text-muted font-mono">{msg.timestamp}</span>
                          {!isUser && msg.text && (
                            <button
                              onClick={() => handleCopyText(msg.id, msg.text)}
                              className="text-[9px] text-text-muted hover:text-accent font-mono flex items-center gap-0.5 transition-colors cursor-pointer"
                              title="Copy response"
                              aria-label="Copy response text"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check size={9} className="text-accent" />
                                  <span className="text-accent">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={9} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
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
                    className="flex gap-2.5 items-center text-text-muted text-xs font-mono py-1"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center border border-accent/30 bg-dark-bg text-accent">
                      <Bot size={12} />
                    </div>
                    <div className="px-3 py-2 bg-dark-bg border border-dark-border rounded-xl flex items-center gap-1.5 text-[11px]">
                      <Terminal size={11} className="text-accent animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* COMPACT SUGGESTED INQUIRIES CHIPS (Only shown in empty / welcome state) */}
              {messages.length <= 1 && (
                <div className="px-3.5 py-2 border-t border-dark-border/60 bg-dark-surface/60 flex-shrink-0">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1">
                    <Terminal size={9} className="text-accent" />
                    Suggested Inquiries
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        disabled={loading}
                        onClick={() => handleSend(prompt)}
                        className="px-2.5 py-1 text-[11px] font-mono border border-dark-border hover:border-accent/50 text-text-secondary hover:text-accent bg-dark-bg transition-colors rounded-md text-left cursor-pointer disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ANCHORED INPUT FORM */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="p-3 border-t border-dark-border bg-dark-surface flex items-center gap-2 flex-shrink-0"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Charan..."
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border focus:border-accent text-text-primary placeholder:text-text-muted text-xs font-mono rounded-lg focus:outline-hidden transition-colors"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!input.trim() || loading}
                  className="px-3.5 py-2 bg-accent text-white font-mono text-xs rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Send size={12} />
                  <span>Send</span>
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
})
