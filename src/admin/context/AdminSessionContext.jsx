import { useState, useEffect, useCallback, useRef } from 'react'
import { onAuthStateChanged, signOut, getIdTokenResult } from '@firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase/config'
import { AdminSessionContext } from './AdminSessionContext.js'

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
const TOKEN_REVALIDATE_INTERVAL_MS = 60 * 60 * 1000

export function AdminSessionProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const navigate = useNavigate()

  const inactivityTimerRef = useRef(null)
  const tokenCheckIntervalRef = useRef(null)
  const activitySubscribedRef = useRef(false)
  const cleanupCallbacksRef = useRef(new Set())
  const signOutAndRedirectRef = useRef(null)
  const isAdminRef = useRef(false)
  const currentUserRef = useRef(null)

  isAdminRef.current = isAdmin

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
  }, [])

  const validateAdmin = useCallback(async (firebaseUser) => {
    currentUserRef.current = firebaseUser
    if (!firebaseUser) {
      setIsAdmin(false)
      setUser(null)
      setLoading(false)
      return false
    }

    try {
      const tokenResult = await getIdTokenResult(firebaseUser, true)
      const admin = tokenResult.claims.admin === true
      setIsAdmin(admin)
      setUser(firebaseUser)
      if (!admin) {
        setAuthError('Missing admin claim. Re-authenticate or contact the owner.')
      } else {
        setAuthError('')
      }
      return admin
    } catch (error) {
      setIsAdmin(false)
      setUser(null)
      setAuthError('Unable to verify admin access. Try signing in again.')
      console.error('[Admin] Claim check failed:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const handleActivity = useCallback(() => {
    if (isAdminRef.current) {
      clearInactivityTimer()
      inactivityTimerRef.current = setTimeout(() => {
        inactivityTimerRef.current = null
        if (signOutAndRedirectRef.current) {
          signOutAndRedirectRef.current('Your admin session expired. Please sign in again.')
        }
      }, INACTIVITY_TIMEOUT_MS)
    }
  }, [clearInactivityTimer])

  const signOutAndRedirect = useCallback(
    async (message = 'You have been signed out.') => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      activitySubscribedRef.current = false
      clearInactivityTimer()
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current)
        tokenCheckIntervalRef.current = null
      }
      cleanupCallbacksRef.current.forEach((cb) => cb())
      cleanupCallbacksRef.current.clear()

      if (auth) {
        try {
          await signOut(auth)
        } catch (error) {
          console.error('[Admin] Sign out error:', error)
        }
      }
      setIsAdmin(false)
      setUser(null)
      currentUserRef.current = null
      window.history.replaceState(null, '', '/admin/login')
      navigate('/admin/login', {
        replace: true,
        state: { message },
      })
    },
    [navigate, clearInactivityTimer, handleActivity]
  )

  useEffect(() => {
    signOutAndRedirectRef.current = signOutAndRedirect
  }, [signOutAndRedirect])

  const subscribeActivity = useCallback(() => {
    if (activitySubscribedRef.current) return
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })
    activitySubscribedRef.current = true
  }, [handleActivity])

  const unsubscribeActivity = useCallback(() => {
    if (!activitySubscribedRef.current) return
    ACTIVITY_EVENTS.forEach((event) => {
      document.removeEventListener(event, handleActivity)
    })
    activitySubscribedRef.current = false
  }, [handleActivity])

  const logout = useCallback(() => {
    if (signOutAndRedirectRef.current) {
      signOutAndRedirectRef.current('You have been signed out.')
    }
  }, [])

  const registerCleanup = useCallback((callback) => {
    cleanupCallbacksRef.current.add(callback)
  }, [])

  const unregisterCleanup = useCallback((callback) => {
    cleanupCallbacksRef.current.delete(callback)
  }, [])

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      setIsAdmin(false)
      return
    }

    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return

      const admin = await validateAdmin(firebaseUser)

      if (admin && firebaseUser) {
        subscribeActivity()
        handleActivity()

        tokenCheckIntervalRef.current = setInterval(async () => {
          if (!auth) return
          try {
            const result = await getIdTokenResult(firebaseUser, true)
            if (!isMounted || !auth) return
            if (result.claims.admin !== true) {
              if (signOutAndRedirectRef.current) {
                signOutAndRedirectRef.current('Your admin session expired. Please sign in again.')
              }
            }
          } catch {
            if (isMounted && signOutAndRedirectRef.current) {
              signOutAndRedirectRef.current('Your admin session expired. Please sign in again.')
            }
          }
        }, TOKEN_REVALIDATE_INTERVAL_MS)
      } else {
        unsubscribeActivity()
        clearInactivityTimer()
        if (tokenCheckIntervalRef.current) {
          clearInterval(tokenCheckIntervalRef.current)
          tokenCheckIntervalRef.current = null
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
      unsubscribeActivity()
      clearInactivityTimer()
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current)
        tokenCheckIntervalRef.current = null
      }
      cleanupCallbacksRef.current.clear()
    }
  }, [validateAdmin, subscribeActivity, handleActivity, unsubscribeActivity, clearInactivityTimer])

  return (
    <AdminSessionContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        authError,
        logout,
        registerCleanup,
        unregisterCleanup,
      }}
    >
      {children}
    </AdminSessionContext.Provider>
  )
}
