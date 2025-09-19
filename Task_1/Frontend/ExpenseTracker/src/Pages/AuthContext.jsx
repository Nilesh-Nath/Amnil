import { useState, useEffect, createContext, useCallback, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

    // eslint-disable-next-line
export const AuthContext = createContext({
    accessToken: null,
    setAccessToken: () => {},
    refresh: async () => {},
    user: null,
    setUser: () => {},
});

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const isRefreshing = useRef(false);
    const refreshPromise = useRef(null);

    const refresh = useCallback(async () => {
        if (isRefreshing.current && refreshPromise.current) {
            return refreshPromise.current;
        }

        isRefreshing.current = true;
        refreshPromise.current = axios.post(
            "http://localhost:5000/refresh",
            {},
            { withCredentials: true }
        )
        .then((response) => {
            if (!response.data.success) throw new Error("Refresh failed");

            setAccessToken(response.data.accessToken);
            setUser(response.data.user.username);
            return response.data.accessToken;

        }).catch((err) => {
            setAccessToken(null);
            setUser(null);
            console.error("Refresh error:", err);
            return null;

        }).finally(() => {
            isRefreshing.current = false;
            refreshPromise.current = null;
        });

        return refreshPromise.current;
    }, []);

    useEffect(() => {
        const publicPaths =['/login','/Signup','/forget-password'];
        
        if(publicPaths.includes(location.pathname) || location.pathname.toLowerCase().match(/^\/reset-password(\/.*)?$/)){
            setLoading(false);
            return;
        }

        refresh().then((token) => {
            if (!token) {
                navigate("/login");
            }
        }).finally(() => setLoading(false));
    }, [refresh, navigate,location]);

    if (loading) return <p>Loading...</p>;

    return (
        <AuthContext.Provider value={{ accessToken, setAccessToken, refresh, user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
