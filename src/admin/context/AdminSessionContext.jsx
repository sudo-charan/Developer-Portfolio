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
  const [loading, setLoading] = useState(auth ? true : false)
  const [authError, setAuthError] = useState('')
  const navigate = useNavigate()

  const inactivityTimerRef = useRef(null)
  const tokenCheckIntervalRef = useRef(null)
  const activitySubscribedRef = useRef(false)
  const cleanupCallbacksRef = useRef(new Set())
  const signOutAndRedirectRef = useRef(null)
  const isAdminRef = useRef(false)
  const currentUserRef = useRef(null)
  const authChangeVersionRef = useRef(0)

  useEffect(() => {
    isAdminRef.current = isAdmin
  }, [isAdmin])

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
  }, [])

  const validateAdmin = useCallback(async (firebaseUser, version) => {
    currentUserRef.current = firebaseUser
    if (!firebaseUser) {
      if (version !== authChangeVersionRef.current) return false
      setIsAdmin(false)
      setUser(null)
      setLoading(false)
      return false
    }

    const rejectUser = async (message, error) => {
      if (version !== authChangeVersionRef.current || auth?.currentUser?.uid !== firebaseUser.uid) {
        return false
      }
      setIsAdmin(false)
      setUser(null)
      setAuthError(message)
      if (error) {
        console.error('[Admin] Claim check failed:', error)
      }
      try {
        await signOut(auth)
      } catch (signOutError) {
        console.error('[Admin] Unable to sign out unverified user:', signOutError)
      }
      return false
    }

    try {
      const tokenResult = await getIdTokenResult(firebaseUser, true)
      if (version !== authChangeVersionRef.current || auth?.currentUser?.uid !== firebaseUser.uid) {
        return false
      }
      const admin = tokenResult.claims.admin === true
      if (!admin) {
        return rejectUser('Missing admin claim. Re-authenticate or contact the owner.')
      }
      setIsAdmin(true)
      setUser(firebaseUser)
      setAuthError('')
      return admin
    } catch (error) {
      return rejectUser('Unable to verify admin access. Try signing in again.', error)
    } finally {
      if (version === authChangeVersionRef.current) {
        setLoading(false)
      }
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
      return signOutAndRedirectRef.current('You have been signed out.')
    }
    return Promise.resolve()
  }, [])

  const registerCleanup = useCallback((callback) => {
    cleanupCallbacksRef.current.add(callback)
  }, [])

  const unregisterCleanup = useCallback((callback) => {
    cleanupCallbacksRef.current.delete(callback)
  }, [])

  useEffect(() => {
    const cleanupCallbacks = cleanupCallbacksRef.current
    if (!auth) {
      return
    }

    let isMounted = true
    let validatedAdminUser = null
    let tokenCheckInFlight = false

    const revalidateAdmin = async () => {
      const firebaseUser = validatedAdminUser
      if (
        !firebaseUser ||
        tokenCheckInFlight ||
        auth.currentUser?.uid !== firebaseUser.uid ||
        currentUserRef.current?.uid !== firebaseUser.uid
      ) {
        return
      }

      tokenCheckInFlight = true
      try {
        const result = await getIdTokenResult(firebaseUser, true)
        if (!isMounted || validatedAdminUser?.uid !== firebaseUser.uid) return
        if (result.claims.admin !== true) {
          signOutAndRedirectRef.current?.('Your admin session expired. Please sign in again.')
        }
      } catch (error) {
        if (isMounted && validatedAdminUser?.uid === firebaseUser.uid) {
          console.error('[Admin] Session revalidation failed:', error)
          signOutAndRedirectRef.current?.('Your admin session expired. Please sign in again.')
        }
      } finally {
        tokenCheckInFlight = false
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        revalidateAdmin()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return

      const version = ++authChangeVersionRef.current
      validatedAdminUser = null
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current)
        tokenCheckIntervalRef.current = null
      }
      const admin = await validateAdmin(firebaseUser, version)
      if (!isMounted || version !== authChangeVersionRef.current) return

      if (admin && firebaseUser) {
        validatedAdminUser = firebaseUser
        subscribeActivity()
        handleActivity()
        tokenCheckIntervalRef.current = setInterval(revalidateAdmin, TOKEN_REVALIDATE_INTERVAL_MS)
      } else {
        validatedAdminUser = null
        unsubscribeActivity()
        clearInactivityTimer()
      }
    })

    return () => {
      isMounted = false
      authChangeVersionRef.current += 1
      unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      unsubscribeActivity()
      clearInactivityTimer()
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current)
        tokenCheckIntervalRef.current = null
      }
      cleanupCallbacks.clear()
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
