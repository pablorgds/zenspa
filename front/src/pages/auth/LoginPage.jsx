import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/sections.css";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("A senha deve ter pelo menos 8 caracteres.");
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                navigate("/");
            } else {
                setError(result.message || "Credenciais inválidas.");
            }
        } catch {
            setError("Erro de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="section" style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
            <div className="container" style={{ maxWidth: 400 }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <h2 className="section-title">Login no ZenSpa</h2>
                    <p className="section-subtitle">Entre para gerenciar seus agendamentos</p>
                </div>

                <div className="card" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>E-mail</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                            />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>Senha</label>
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                            />
                        </div>

                        {error && (
                            <p style={{ color: "red", fontSize: 13, marginBottom: 16 }}>{error}</p>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>

                    <div style={{ marginTop: 24, textAlign: "center", fontSize: 14 }}>
                        <p>Não tem uma conta? <Link to="/registrar" style={{ color: "var(--primary)", fontWeight: 600 }}>Crie uma agora</Link></p>
                    </div>
                </div>

                <div style={{ textAlign: "center", marginTop: 24 }}>
                    <Link to="/" style={{ fontSize: 14, color: "var(--muted)" }}>Voltar para a Home</Link>
                </div>
            </div>
        </section>
    );
};

export default LoginPage;