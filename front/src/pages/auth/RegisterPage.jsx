import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/sections.css";

const RegisterPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (name.trim().length < 2) {
            setError("Informe seu nome completo.");
            return;
        }

        if (password.length < 8) {
            setError("A senha deve ter pelo menos 8 caracteres.");
            return;
        }

        if (password !== passwordConfirm) {
            setError("As senhas não coincidem.");
            return;
        }

        setLoading(true);
        try {
            const result = await register(name, email, password, passwordConfirm);
            if (result.success) {
                navigate("/");
            } else {
                setError(result.message || "Erro ao criar conta.");
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
                    <h2 className="section-title">Criar Conta</h2>
                    <p className="section-subtitle">Junte-se ao ZenSpa e agende seu relaxamento</p>
                </div>

                <div className="card" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>Nome Completo</label>
                            <input
                                type="text"
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                            />
                        </div>
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
                        <div style={{ marginBottom: 16 }}>
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
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>Confirmar Senha</label>
                            <input
                                type="password"
                                className="input"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                required
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                            />
                        </div>

                        {error && (
                            <p style={{ color: "red", fontSize: 13, marginBottom: 16 }}>{error}</p>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                            {loading ? "Criando conta..." : "Criar Conta"}
                        </button>
                    </form>

                    <div style={{ marginTop: 24, textAlign: "center", fontSize: 14 }}>
                        <p>Já tem uma conta? <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Faça Login</Link></p>
                    </div>
                </div>

                <div style={{ textAlign: "center", marginTop: 24 }}>
                    <Link to="/" style={{ fontSize: 14, color: "var(--muted)" }}>Voltar para a Home</Link>
                </div>
            </div>
        </section>
    );
};

export default RegisterPage;