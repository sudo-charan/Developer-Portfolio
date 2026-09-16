import {
  getProjects,
  getSkills,
  getExperience,
  getEducation,
  getCertificates,
  getSettings,
  getCurrentWork,
} from '../firebase/services'

/**
 * Fetches all portfolio data from Firestore to construct context for local fallback.
 */
export async function fetchPortfolioContext() {
  try {
    const [projects, skills, experience, education, certificates, settings, currentWork] =
      await Promise.allSettled([
        getProjects(),
        getSkills(),
        getExperience(),
        getEducation(),
        getCertificates(),
        getSettings(),
        getCurrentWork(),
      ])

    return {
      projects: projects.status === 'fulfilled' ? projects.value : [],
      skills: skills.status === 'fulfilled' ? skills.value : [],
      experience: experience.status === 'fulfilled' ? experience.value : [],
      education: education.status === 'fulfilled' ? education.value : [],
      certificates: certificates.status === 'fulfilled' ? certificates.value : [],
      settings: settings.status === 'fulfilled' ? settings.value : null,
      currentWork: currentWork.status === 'fulfilled' ? currentWork.value : [],
    }
  } catch (error) {
    console.error('Error fetching portfolio context for AI:', error)
    return {
      projects: [],
      skills: [],
      experience: [],
      education: [],
      certificates: [],
      settings: null,
      currentWork: [],
    }
  }
}

/**
 * Smart local query matcher used when serverless AI endpoint is unavailable or fallback requested.
 */
function generateLocalFallback(query, context) {
  const q = query.toLowerCase().trim()

  // GuardGPT / Specific Project query
  if (q.includes('guardgpt') || q.includes('guard gpt') || q.includes('firewall') || q.includes('threat')) {
    const guardProject = context?.projects?.find((p) => p.name?.toLowerCase().includes('guard'))
    return `**GuardGPT** is Charanraj's flagship security project! It operates an automated LLM execution pipeline with 5 key stages:

1. **Input**: User prompt ingestion
2. **Intent Analysis**: Semantic classification
3. **Risk Estimation**: Threat scoring model
4. **Decision Engine**: Policy enforcement
5. **Action**: Allow / Sanitize / Block

${guardProject ? `Tech Stack: \`${guardProject.tags || 'React, Python, LLM Security'}\`.` : 'Built using React, Python, and AI guardrail architectures.'} You can view it under the **#projects** section.`
  }

  // Project general query
  if (q.includes('project') || q.includes('case file') || q.includes('built') || q.includes('mission')) {
    if (context?.projects?.length) {
      const topProjects = context.projects.slice(0, 3).map((p) => `• **${p.name}**: ${p.description}`).join('\n')
      return `Charanraj has built several high-impact software & security projects:\n\n${topProjects}\n\nExplore full case files in the **#projects** section!`
    }
    return `Charanraj specializes in modern web applications, AI guardrails, and full-stack solutions. Top projects include **GuardGPT** (AI prompt firewall) and full-stack web apps. Check out the **#projects** section for live links and code repos!`
  }

  // Availability / Hiring query
  if (q.includes('available') || q.includes('avail') || q.includes('hire') || q.includes('contract') || q.includes('freelance') || q.includes('job') || q.includes('work with') || q.includes('role')) {
    return `⚡ **Charanraj is open for new opportunities!**

He is available for:
- Full-time Full-Stack Engineering & AI roles
- Technical Lead / Security Engineering positions
- High-impact freelance & contract projects

Feel free to send a message directly using the **#contact** section below or grab his resume from the top bar!`
  }

  // Skills / Stack query
  if (q.includes('skill') || q.includes('stack') || q.includes('tech') || q.includes('react') || q.includes('python') || q.includes('node') || q.includes('firebase') || q.includes('tailwind')) {
    if (context?.skills?.length) {
      const skillList = context.skills.map((s) => `• **${s.category || 'Tech'}**: ${s.name || s.skills}`).join('\n')
      return `Charanraj's core technical stack includes:\n\n${skillList}\n\nYou can inspect skill badges in detail under the **#skills** section.`
    }
    return `Charanraj's technical stack features:
- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion, JavaScript (ESNext)
- **Backend & Cloud**: Node.js, Firebase (Auth, Firestore, Storage), REST APIs
- **Security & AI**: Threat scoring pipelines, LLM guardrails, Python

Check out the **#skills** section for more!`
  }

  // Experience / Career query
  if (q.includes('experience') || q.includes('career') || q.includes('background') || q.includes('company') || q.includes('job history')) {
    if (context?.experience?.length) {
      const expList = context.experience.map((e) => `• **${e.role}** @ ${e.company} (${e.period || e.startDate})`).join('\n')
      return `Here is a snapshot of Charanraj's experience:\n\n${expList}\n\nDetailed milestones are listed in the **#experience** section!`
    }
    return `Charanraj has extensive experience developing high-performance frontend applications, backend services, and AI integrations. See the full timeline under **#experience**!`
  }

  // Contact query
  if (q.includes('contact') || q.includes('email') || q.includes('reach') || q.includes('touch') || q.includes('message')) {
    const email = context?.settings?.contactEmail
    return `📬 You can easily get in touch with Charanraj:
- **Contact Form**: Scroll to the **#contact** section on this page.
- **Email**: ${email ? `\`${email}\`` : 'Available in the contact form below.'}
- **Socials**: Check out GitHub and LinkedIn links in the footer!`
  }

  // Education / Degrees query
  if (q.includes('education') || q.includes('degree') || q.includes('college') || q.includes('university') || q.includes('study')) {
    if (context?.education?.length) {
      const edu = context.education.map((e) => `• **${e.degree}** - ${e.institution}`).join('\n')
      return `Academic background:\n\n${edu}`
    }
    return `Charanraj holds a strong foundation in Computer Science & Engineering, complemented by continuous self-driven learning and certifications.`
  }

  // Default fallback
  const bio = context?.settings?.bio || 'Full Stack Engineer & Security Specialist'
  return `👋 Hi there! I'm **Ask Charan AI**.

Charanraj M is a **${bio}**.

Here are some things you can ask me:
1. *"What stack was used for GuardGPT?"*
2. *"Is Charanraj available for contract or full-time work?"*
3. *"What are Charanraj's main technical skills?"*
4. *"How can I get in touch with Charanraj?"*`
}

/**
 * Main AI call function.
 * Calls Vercel Serverless API /api/ask-charan (which uses server-only GEMINI_API_KEY / OPENAI_API_KEY).
 * Falls back to local context matcher if endpoint is unreachable or server keys are missing.
 */
export async function queryAiAssistant(userMessage, conversationHistory = [], cachedContext = null) {
  const context = cachedContext || (await fetchPortfolioContext())

  try {
    const response = await fetch('/api/ask-charan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage,
        conversationHistory,
        context,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.text && !data.fallback) {
        return { text: data.text, source: data.source || 'server' }
      }
    }
  } catch (err) {
    console.warn('/api/ask-charan endpoint call failed, using local fallback:', err)
  }

  // Fallback engine if server endpoint isn't running or returns fallback
  const fallbackText = generateLocalFallback(userMessage, context)
  return { text: fallbackText, source: 'local' }
}
