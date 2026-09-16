/**
 * Vercel Serverless Function: /api/ask-charan
 * Safe server-side API proxy for Gemini / OpenAI queries.
 * Server-only environment variables: GEMINI_API_KEY, OPENAI_API_KEY
 */

function parseFirestoreFields(fields) {
  if (!fields) return {}
  const res = {}
  for (const [key, val] of Object.entries(fields)) {
    if (val.stringValue !== undefined) res[key] = val.stringValue
    else if (val.integerValue !== undefined) res[key] = Number(val.integerValue)
    else if (val.doubleValue !== undefined) res[key] = Number(val.doubleValue)
    else if (val.booleanValue !== undefined) res[key] = val.booleanValue
    else if (val.arrayValue !== undefined) {
      res[key] = (val.arrayValue.values || []).map((v) => v.stringValue || v)
    }
  }
  return res
}

async function fetchFirestoreCollection(projectId, collectionName) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`
    const response = await fetch(url)
    if (!response.ok) return []
    const data = await response.json()
    if (!data.documents) return []
    return data.documents.map((doc) => ({
      id: doc.name.split('/').pop(),
      ...parseFirestoreFields(doc.fields),
    }))
  } catch {
    return []
  }
}

async function fetchFirestoreDocument(projectId, path) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    return parseFirestoreFields(data.fields)
  } catch {
    return null
  }
}

async function getFirestoreContext() {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
  if (!projectId) return null

  try {
    const [projects, skills, experience, education, certificates, settings] = await Promise.all([
      fetchFirestoreCollection(projectId, 'projects'),
      fetchFirestoreCollection(projectId, 'skills'),
      fetchFirestoreCollection(projectId, 'experience'),
      fetchFirestoreCollection(projectId, 'education'),
      fetchFirestoreCollection(projectId, 'certificates'),
      fetchFirestoreDocument(projectId, 'settings/general'),
    ])

    return { projects, skills, experience, education, certificates, settings }
  } catch {
    return null
  }
}

function buildSystemPrompt(context) {
  const bio = context?.settings?.bio || 'Full Stack Engineer & Security Specialist.'
  const heroSubtitle = context?.settings?.heroSubtitle || 'Building modern, secure, scalable web applications.'
  const email = context?.settings?.contactEmail || 'charanraj@example.com'

  const projectsSummary = context?.projects?.length
    ? context.projects
        .map(
          (p) =>
            `- ${p.name} (${p.status || 'Active'}): ${p.description || ''}. Tech Stack: ${p.tags || 'React, Node'}. ${
              p.github ? `GitHub: ${p.github}` : ''
            } ${p.demo ? `Live: ${p.demo}` : ''}`
        )
        .join('\n')
    : 'GuardGPT (Priority Case): AI prompt firewall & threat analysis pipeline. Stack: React, Python, Firebase, LLM Security.'

  const skillsSummary = context?.skills?.length
    ? context.skills.map((s) => `- ${s.category || 'Tech'}: ${s.name || s.skills}`).join('\n')
    : 'Frontend: React 19, Vite, Tailwind CSS 4, Framer Motion\nBackend: Node.js, Firebase, Python, Firestore\nSecurity: Threat Scoring, LLM Guardrails, Code Auditing'

  const experienceSummary = context?.experience?.length
    ? context.experience
        .map((e) => `- ${e.role} at ${e.company} (${e.period || e.startDate || ''}): ${e.description || ''}`)
        .join('\n')
    : 'Full-Stack Software Developer focusing on modern web apps and AI integrations.'

  const eduSummary = context?.education?.length
    ? context.education.map((ed) => `- ${ed.degree} from ${ed.institution} (${ed.year || ed.startYear || ''})`).join('\n')
    : 'Degree in Computer Science & Engineering.'

  return `You are "Ask Charan AI", a friendly, professional, tactical AI assistant representing Charanraj M.
Your goal is to answer recruiters, tech leads, and visitors about Charanraj's technical skills, experience, project architecture, and availability.

CHARANRAJ'S PORTFOLIO CONTEXT:
Bio / Summary: ${bio} - ${heroSubtitle}
Contact Email: ${email}
Availability: Open for full-time roles, full-stack engineering, AI/LLM security projects, and select contract opportunities.

PROJECTS / MISSION CASE FILES:
${projectsSummary}

SKILLS & TECH STACK:
${skillsSummary}

WORK EXPERIENCE:
${experienceSummary}

EDUCATION:
${eduSummary}

INSTRUCTIONS:
1. Be helpful, professional, concise, and enthusiastic about Charanraj's work.
2. Answer based strictly on the portfolio data provided above.
3. If asked about a project like "GuardGPT", highlight its architecture (Input -> Intent Analysis -> Threat Scoring -> Decision Engine -> Action).
4. If asked about availability or contact, invite them to send a message via the Contact section or email ${email}.
5. Keep responses concise (2 to 4 sentences or brief bullet points). Format key terms with markdown bold or code blocks.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  try {
    const { userMessage, conversationHistory = [], context: clientContext } = req.body || {}

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userMessage.' })
    }

    // Source of truth: try server-side Firestore context first, fallback to client-sent context
    const serverContext = await getFirestoreContext()
    const activeContext = serverContext || clientContext || {}

    const geminiApiKey = process.env.GEMINI_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY

    const systemInstruction = buildSystemPrompt(activeContext)

    // 1. Try Gemini API
    if (geminiApiKey) {
      try {
        const contents = [
          ...conversationHistory.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          })),
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Question: ${userMessage}` }],
          },
        ]

        const apiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          }
        )

        if (apiRes.ok) {
          const data = await apiRes.json()
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (candidateText) {
            return res.status(200).json({ text: candidateText, source: 'gemini' })
          }
        }
      } catch (err) {
        console.error('Gemini API call failed on server:', err)
      }
    }

    // 2. Try OpenAI API
    if (openaiApiKey) {
      try {
        const messages = [
          { role: 'system', content: systemInstruction },
          ...conversationHistory.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
          { role: 'user', content: userMessage },
        ]

        const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
          }),
        })

        if (apiRes.ok) {
          const data = await apiRes.json()
          const text = data?.choices?.[0]?.message?.content
          if (text) {
            return res.status(200).json({ text, source: 'openai' })
          }
        }
      } catch (err) {
        console.error('OpenAI API call failed on server:', err)
      }
    }

    // If no server API key configured or calls failed, signal fallback to client
    return res.status(200).json({
      fallback: true,
      message: 'No server API key present or API unreachable; using local knowledge base.',
    })
  } catch (error) {
    console.error('Ask Charan AI Serverless Endpoint Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
