"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: AuthError | null; session: Session | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: AuthError | null; user: User | null; session: Session | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: null, session: null }),
  signUp: async () => ({ error: null, user: null, session: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
});

function syncSessionCookie(session: Session | null) {
  if (typeof document === "undefined") return;
  if (session) {
    document.cookie = "privacyflow_session=1; path=/; max-age=2592000; SameSite=Lax";
  } else {
    document.cookie = "privacyflow_session=; path=/; max-age=0; SameSite=Lax";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session && isMounted) {
          setSession(data.session);
          setUser(data.session.user);
          syncSessionCookie(data.session);
        } else if (isMounted) {
          setSession(null);
          setUser(null);
          syncSessionCookie(null);
        }
      } catch (err) {
        console.warn("Error checking auth session:", err);
        if (isMounted) {
          setSession(null);
          setUser(null);
          syncSessionCookie(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkCurrentSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      syncSessionCookie(currentSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, rememberMe = true) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!error && data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        syncSessionCookie(data.session);
      }

      return { error, session: data?.session ?? null };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata,
        },
      });

      if (!error && data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        syncSessionCookie(data.session);
      }

      return {
        error,
        user: data?.user ?? null,
        session: data?.session ?? null,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      syncSessionCookie(null);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: origin ? `${origin}/reset-password` : undefined,
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
