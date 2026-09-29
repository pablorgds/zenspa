import React, { createContext, useContext, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (storedUser && token) {
            return JSON.parse(storedUser);
        }
        return null;
    });
    const [loading] = useState(false);

    const login = async (email, password) => {
        const data = await api.login(email, password);
        if (data.user) {
            setUser(data.user);
            return { success: true };
        }
        return { success: false, message: data.message || "Erro ao fazer login" };
    };

    const register = async (name, email, password, passwordConfirmation) => {
        const data = await api.register(name, email, password, passwordConfirmation);
        if (data.user) {
            setUser(data.user);
            return { success: true };
        }
        return { success: false, message: data.message || "Erro ao registrar" };
    };

    const logout = async () => {
        await api.logout();
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    const isAdmin = () => {
        return user && (user.is_admin === 1 || user.is_admin === true);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, register, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
