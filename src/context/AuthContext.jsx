import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback
} from 'react';

import { setToken, getToken, db } from '../utils/storage';

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const AuthContext = createContext(null);

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: 'no-store'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
   * Always validate the token against MongoDB.
   * Never trust localStorage user/role information.
   */
  const refreshUser = useCallback(async () => {
    try {
      const result = await api('/auth/me');

      setUser(result.user);

      /*
       * Always refresh customer data from MongoDB.
       */
      await db.hydrate();

      /*
       * If the server says this is an admin,
       * refresh admin data from MongoDB as well.
       */
      if (result.user.role === 'admin') {
        await db.hydrateAdmin();
      }

      return result.user;
    } catch (error) {
      setToken(null);
      setUser(null);
      throw error;
    }
  }, []);

  /*
   * Runs every time the application is loaded/refreshed.
   */
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        if (getToken()) {
          await refreshUser();
        } else {
          /*
           * Public data only.
           */
          await db.hydrate();
        }
      } catch {
        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  const register = useCallback(async (form) => {
    try {
      const result = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      setToken(result.token);
      setUser(result.user);

      await db.hydrate();

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error.message
      };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      });

      setToken(result.token);
      setUser(result.user);

      /*
       * Fresh MongoDB data after login.
       */
      await db.hydrate();

      if (result.user.role === 'admin') {
        await db.hydrateAdmin();
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error.message
      };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);

    /*
     * Remove cached application data when logging out.
     */
    db.clearCache();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      register,
      login,
      logout,
      refreshUser
    }),
    [
      user,
      loading,
      register,
      login,
      logout,
      refreshUser
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}