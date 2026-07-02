import React, { createContext, useContext, useEffect, useState } from "react";

import { clearAccessToken, fetchCurrentUser, hasValidAccessToken, login, onAuthExpired, setAccessToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(hasValidAccessToken());

  function resetAuthState() {
    clearAccessToken();
    setUser(null);
    setAuthenticated(false);
  }

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthExpired(() => {
      if (active) {
        resetAuthState();
        setLoading(false);
      }
    });

    async function bootstrap() {
      if (!hasValidAccessToken()) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (active) {
          setUser(currentUser);
          setAuthenticated(true);
        }
      } catch {
        if (active) {
          resetAuthState();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function signIn(credentials) {
    const tokenResponse = await login(credentials);
    setAccessToken(tokenResponse.access);
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    setAuthenticated(true);
    return currentUser;
  }

  function signOut() {
    resetAuthState();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
