import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getSiteContent,
  getProjects,
  getSkills,
  getExperience,
  getEducation,
  getCertificates,
  getCurrentWork,
  getBlogPosts,
  getContactMessages,
  getSettings,
  getBlogPost,
} from '../firebase/services'

const FALLBACK_DELAY = 800
const RETRY_DELAYS = [2000, 4000, 8000]
const noop = () => []

const COLLECTION_FETCHERS = {
  projects: getProjects,
  skills: getSkills,
  experience: getExperience,
  education: getEducation,
  certificates: getCertificates,
  currentWork: getCurrentWork,
  blogPosts: null,
  contactMessages: getContactMessages,
}

export function useFirestoreCollection(collectionName, options = {}) {
  const defaultFetcher = COLLECTION_FETCHERS[collectionName]
  const fetcher = options.fetcher || defaultFetcher || noop
  const deferMs = options.defer || 0
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const timerRef = useRef(null)
  const mountedRef = useRef(true)
  const fetcherRef = useRef(fetcher)
  const deferRef = useRef(deferMs)

  if (fetcherRef.current !== fetcher) fetcherRef.current = fetcher
  if (deferRef.current !== deferMs) deferRef.current = deferMs

  const load = useCallback(async () => {
    if (!mountedRef.current) return
    setLoading(true)
    setError(null)

    timerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false)
      }
    }, FALLBACK_DELAY)

    try {
      const currentFetcher = fetcherRef.current
      const currentDefer = deferRef.current
      let result
      if (currentDefer > 0) {
        await new Promise((resolve) => setTimeout(resolve, currentDefer))
      }
      result = await currentFetcher(options.params)
      if (mountedRef.current) {
        clearTimeout(timerRef.current)
        setData(result)
        setLoading(false)
        setRetryCount(0)
      }
    } catch (err) {
      if (mountedRef.current) {
        clearTimeout(timerRef.current)
        setError(err)
        setLoading(false)
      }
    }
  }, [options.params])

  useEffect(() => {
    mountedRef.current = true
    load()

    return () => {
      mountedRef.current = false
      clearTimeout(timerRef.current)
    }
  }, [load])

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1)
  }, [])

  useEffect(() => {
    if (error && retryCount < RETRY_DELAYS.length) {
      const timeout = setTimeout(() => {
        setRetryCount((c) => c + 1)
        load()
      }, RETRY_DELAYS[retryCount] || 8000)
      return () => clearTimeout(timeout)
    }
  }, [error, retryCount, load])

  return { data, loading, error, retry }
}

export function useFirestoreDoc(fetcher) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const timerRef = useRef(null)
  const mountedRef = useRef(true)
  const fetcherRef = useRef(fetcher)

  if (fetcherRef.current !== fetcher) fetcherRef.current = fetcher

  const load = useCallback(async () => {
    if (!mountedRef.current) return
    setLoading(true)
    setError(null)

    timerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false)
      }
    }, FALLBACK_DELAY)

    try {
      const result = await fetcherRef.current()
      if (mountedRef.current) {
        clearTimeout(timerRef.current)
        setData(result)
        setLoading(false)
        setRetryCount(0)
      }
    } catch (err) {
      if (mountedRef.current) {
        clearTimeout(timerRef.current)
        setError(err)
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()

    return () => {
      mountedRef.current = false
      clearTimeout(timerRef.current)
    }
  }, [load])

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1)
  }, [])

  useEffect(() => {
    if (error && retryCount < RETRY_DELAYS.length) {
      const timeout = setTimeout(() => {
        setRetryCount((c) => c + 1)
        load()
      }, RETRY_DELAYS[retryCount] || 8000)
      return () => clearTimeout(timeout)
    }
  }, [error, retryCount, load])

  return { data, loading, error, retry }
}

export function useSiteContent() {
  return useFirestoreDoc(getSiteContent)
}

export function useProjects() {
  return useFirestoreCollection('projects')
}

export function useSkills() {
  return useFirestoreCollection('skills')
}

export function useExperience() {
  return useFirestoreCollection('experience')
}

export function useEducation() {
  return useFirestoreCollection('education')
}

export function useCertificates() {
  return useFirestoreCollection('certificates')
}

export function useCurrentWork() {
  return useFirestoreCollection('currentWork')
}

export function useSettings() {
  return useFirestoreDoc(getSettings)
}

export function useBlogPosts(status = 'published') {
  return useFirestoreCollection('blogPosts', { fetcher: getBlogPosts, params: status })
}

export function useBlogPost(id) {
  const memoizedFetcher = useCallback(() => getBlogPost(id), [id])
  return useFirestoreDoc(memoizedFetcher)
}
