import {
  createContext,
  useState,
  useContext,
  useEffect
} from 'react';
import { useRouter } from 'next/router'

import Cookies from 'js-cookie';
import api from '../services/api';
import type { AuthContextType } from '@/types';


const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  authenticate: () => {}
});


export const AuthProvider = ({children}: {children: JSX.Element}) => {
  const [user, setUser] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const router = useRouter();
  let token = Cookies.get('token');

  const authenticate = async (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    let data = {username, password};

    const { data: { access_token } } = await api.post('auth/token',
      data,
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      }
    );
    if (access_token) {
        console.log(`Got token ${access_token}`);

        Cookies.set('token', access_token, { expires: 60 })
        api.defaults.headers.Authorization = `Bearer ${access_token}`
        const { data: user } = await api.get('users/me');
        setUser(user)
        console.log("Got user", user)
    }
  };

  const logout = (redirectLocation: string) => {
    Cookies.remove("token");
    setUser(null);
    setLoading(false);
    console.log("Redirecting");
    router.push(redirectLocation || "/login");
  };

  useEffect(() => {
    async function loadUserFromCookies() {
      let token = Cookies.get('token')
      if (token) {
          console.log("Got a token in the cookies, let's see if it is valid")
          api.defaults.headers.Authorization = `Bearer ${token}`
          const { data: user } = await api.get('users/me')
          if (user) {
            setUser(user);
          }
      }
      setLoading(false)
    }
    console.log("Inside use effect");
    loadUserFromCookies();
  }, []);


  let context_value: AuthContextType = {
    isAuthenticated: !!token,
    user,
    authenticate,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={context_value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
