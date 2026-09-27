export interface FirestoreTimestamp {
  seconds: number
  nanoseconds?: number
}

export interface Project {
  id: string
  name: string
  description: string
  github?: string
  demo?: string
  image?: string
  tags?: string
  status?: string
  featured?: boolean
  order?: number
  createdAt?: string | FirestoreTimestamp
  updatedAt?: string | FirestoreTimestamp
}

export interface Skill {
  id: string
  name: string
  group: string
  order?: number
  updatedAt?: string | FirestoreTimestamp
}

export interface Experience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate?: string
  description: string
  order?: number
  createdAt?: string | FirestoreTimestamp
  updatedAt?: string | FirestoreTimestamp
}

export interface Education {
  id: string
  degree: string
  branch?: string
  institution: string
  location: string
  startYear: string
  endYear: string
  grade?: string
  description?: string
  order?: number
  createdAt?: string | FirestoreTimestamp
  updatedAt?: string | FirestoreTimestamp
}

export interface Certificate {
  id: string
  name: string
  issuer: string
  year: string
  category: string
  verifyUrl?: string
  image?: string
  order?: number
  createdAt?: string | FirestoreTimestamp
  updatedAt?: string | FirestoreTimestamp
}

export interface BlogPost {
  id: string
  title: string
  content: string
  excerpt?: string
  category?: string
  coverImage?: string
  readingTime?: number | string
  status: 'draft' | 'scheduled' | 'published' | string
  publishedAt?: string | FirestoreTimestamp
  scheduledAt?: string | FirestoreTimestamp
}

export interface PortfolioContext {
  projects: Project[]
  skills: Skill[]
  experience: Experience[]
  education: Education[]
  certificates: Certificate[]
  settings: Record<string, unknown> | null
  currentWork: Record<string, unknown>[]
}
