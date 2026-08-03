import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ProfileNotFoundError, buildApplicationUser, getProfileForUser, logout, setApplicationSession, signInWithPassword } from "../services/authService.js";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

function AuthLoading() {
  return <div className="auth-loading-screen" role="status" aria-live="polite"><span className="auth-loading-spinner" aria-hidden="true" /><strong>Restoring secure session</strong><p>Connecting to your NovaFleet workspace.</p></div>;
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ session: null, user: null, profile: null, applicationUser: null, profileState: "idle", error: null, isLoading: true });
  const mounted = useRef(true);

  const clearIdentity = useCallback(() => {
    setApplicationSession(null);
    if (mounted.current) setState((current) => ({ ...current, user: null, profile: null, applicationUser: null, profileState: "idle", error: null }));
  }, []);

  const resolveProfile = useCallback(async (authUser) => {
    if (!authUser) { clearIdentity(); return null; }
    if (mounted.current) setState((current) => ({ ...current, user: authUser, profile: null, applicationUser: null, profileState: "loading", error: null }));
    try {
      const profile = await getProfileForUser(authUser);
      const applicationUser = buildApplicationUser(authUser, profile);
      setApplicationSession(applicationUser);
      if (mounted.current) setState((current) => ({ ...current, user: authUser, profile, applicationUser, profileState: "ready", error: null }));
      return profile;
    } catch (error) {
      setApplicationSession(null);
      const profileState = error instanceof ProfileNotFoundError ? "missing" : "error";
      if (mounted.current) setState((current) => ({ ...current, user: authUser, profile: null, applicationUser: null, profileState, error }));
      return null;
    }
  }, [clearIdentity]);

  const refreshProfile = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) { clearIdentity(); return null; }
    return resolveProfile(data.user);
  }, [clearIdentity, resolveProfile]);

  useEffect(() => {
    mounted.current = true;
    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) clearIdentity();
      else {
        if (mounted.current) setState((current) => ({ ...current, session: data.session }));
        await resolveProfile(data.session.user);
      }
      if (mounted.current) setState((current) => ({ ...current, isLoading: false }));
    };
    initialize();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      window.setTimeout(() => {
        if (!mounted.current) return;
        setState((current) => ({ ...current, session: session || null }));
        if (event === "SIGNED_OUT" || !session) clearIdentity();
        else resolveProfile(session.user);
      }, 0);
    });
    return () => { mounted.current = false; subscription.unsubscribe(); };
  }, [clearIdentity, resolveProfile]);

  const signIn = useCallback(async (credentials) => {
    const data = await signInWithPassword(credentials);
    await resolveProfile(data.user);
    return data.user;
  }, [resolveProfile]);

  const signOut = useCallback(async () => {
    try { await logout(); } finally { clearIdentity(); if (mounted.current) setState((current) => ({ ...current, session: null })); }
  }, [clearIdentity]);

  const value = useMemo(() => ({ ...state, role: state.profile?.role || null, isAuthenticated: Boolean(state.session?.user), signIn, signOut, refreshProfile }), [state, signIn, signOut, refreshProfile]);
  return <AuthContext.Provider value={value}>{state.isLoading ? <AuthLoading /> : children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}