import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  sessionToken: string;
  username: string;
  login: (token: string, user: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [username, setUsername] = useState('');

  // ✅ Load from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('sessionToken');
    const storedUser = localStorage.getItem('username');

    if (storedToken && storedUser) {
      setSessionToken(storedToken);
      setUsername(storedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (token: string, user: string) => {
    setSessionToken(token);
    setUsername(user);
    setIsAuthenticated(true);
    localStorage.setItem('sessionToken', token);
    localStorage.setItem('username', user);
  };

  const logout = () => {
    setSessionToken('');
    setUsername('');
    setIsAuthenticated(false);
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, sessionToken, username, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
