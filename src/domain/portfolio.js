const asString = (value, fallback = '') => typeof value === 'string' ? value : fallback
const asOptionalString = (value) => typeof value === 'string' && value.trim() ? value : undefined
const asNumber = (value) => typeof value === 'number' && Number.isFinite(value) ? value : undefined
const asBoolean = (value) => typeof value === 'boolean' ? value : undefined

function normalizeTimestamp(value) {
  if (!value) return undefined
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return { seconds: value.seconds, nanoseconds: value.nanoseconds || 0 }
  }
  return typeof value === 'string' || value instanceof Date ? value : undefined
}

export function normalizeProject(value, id = '') {
  const item = value && typeof value === 'object' ? value : {}
  return {
    id: asString(item.id, id),
    name: asString(item.name),
    description: asString(item.description),
    github: asOptionalString(item.github),
    demo: asOptionalString(item.demo),
    image: asOptionalString(item.image),
    tags: asOptionalString(item.tags),
    status: asOptionalString(item.status),
    featured: asBoolean(item.featured),
    order: asNumber(item.order),
    createdAt: normalizeTimestamp(item.createdAt),
    updatedAt: normalizeTimestamp(item.updatedAt),
  }
}

export function normalizeSkill(value, id = '') {
  const item = value && typeof value === 'object' ? value : {}
  return {
    id: asString(item.id, id),
    name: asString(item.name),
    group: asString(item.group || item.category),
    order: asNumber(item.order),
    updatedAt: normalizeTimestamp(item.updatedAt),
  }
}

export function normalizeExperience(value, id = '') {
  const item = value && typeof value === 'object' ? value : {}
  return {
    id: asString(item.id, id),
    title: asString(item.title || item.role),
    company: asString(item.company),
    location: asString(item.location),
    startDate: asString(item.startDate),
    endDate: asOptionalString(item.endDate),
    description: asString(item.description),
    order: asNumber(item.order),
    createdAt: normalizeTimestamp(item.createdAt),
    updatedAt: normalizeTimestamp(item.updatedAt),
  }
}

export function normalizeEducation(value, id = '') {
  const item = value && typeof value === 'object' ? value : {}
  return {
    id: asString(item.id, id),
    degree: asString(item.degree),
    branch: asOptionalString(item.branch),
    institution: asString(item.institution),
    location: asString(item.location),
    startYear: asString(item.startYear),
    endYear: asString(item.endYear),
    grade: asOptionalString(item.grade),
    description: asOptionalString(item.description),
    order: asNumber(item.order),
    createdAt: normalizeTimestamp(item.createdAt),
    updatedAt: normalizeTimestamp(item.updatedAt),
  }
}

export function normalizeCertificate(value, id = '') {
  const item = value && typeof value === 'object' ? value : {}
  return {
    id: asString(item.id, id),
    name: asString(item.name),
    issuer: asString(item.issuer),
    year: asString(item.year),
    category: asString(item.category),
    verifyUrl: asOptionalString(item.verifyUrl),
    image: asOptionalString(item.image),
    order: asNumber(item.order),
    createdAt: normalizeTimestamp(item.createdAt),
    updatedAt: normalizeTimestamp(item.updatedAt),
  }
}

export function normalizeBlogPost(value, id = '') {
  const item = value && typeof value === 'object' ? value : {}
  return {
    id: asString(item.id, id),
    title: asString(item.title),
    content: asString(item.content),
    excerpt: asOptionalString(item.excerpt),
    category: asOptionalString(item.category),
    coverImage: asOptionalString(item.coverImage),
    readingTime: typeof item.readingTime === 'number' || typeof item.readingTime === 'string'
      ? item.readingTime
      : undefined,
    status: asString(item.status, 'draft'),
    publishedAt: normalizeTimestamp(item.publishedAt),
    scheduledAt: normalizeTimestamp(item.scheduledAt),
  }
}

export function normalizePortfolioContext(value) {
  const context = value && typeof value === 'object' ? value : {}
  return {
    projects: Array.isArray(context.projects) ? context.projects.map((item) => normalizeProject(item, item?.id)) : [],
    skills: Array.isArray(context.skills) ? context.skills.map((item) => normalizeSkill(item, item?.id)) : [],
    experience: Array.isArray(context.experience) ? context.experience.map((item) => normalizeExperience(item, item?.id)) : [],
    education: Array.isArray(context.education) ? context.education.map((item) => normalizeEducation(item, item?.id)) : [],
    certificates: Array.isArray(context.certificates) ? context.certificates.map((item) => normalizeCertificate(item, item?.id)) : [],
    settings: context.settings && typeof context.settings === 'object' ? context.settings : null,
    currentWork: Array.isArray(context.currentWork) ? context.currentWork : [],
  }
}

export function validateContactMessage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const fields = ['name', 'email', 'subject', 'message']
  return fields.every((field) => typeof value[field] === 'string' && value[field].trim().length > 0)
}
