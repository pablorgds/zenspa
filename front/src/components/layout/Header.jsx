import React from "react";
import "../../styles/header.css";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Header = ({ isMenuOpen, onToggleMenu }) => {
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <header>
            <div className="container">
                <div className="header-inner">
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="brand">
                            <div className="brand-logo">Z</div>
                            <div className="brand-text">
                                <span>ZenSpa</span>
                                <span>Bem-estar sob medida</span>
                            </div>
                        </div>
                    </Link>

                    <nav id="mainNav" className={isMenuOpen ? "is-open" : ""}>
                        <a href="/#servicos">Serviços</a>
                        <a href="/#como-funciona">Como funciona</a>
                        <a href="/#planos">Planos</a>
                        <a href="/#contato">Contato</a>
                        {user && <Link to="/meus-agendamentos">Meus Agendamentos</Link>}
                        {isAdmin() && <Link to="/admin" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Painel Admin</Link>}
                    </nav>

                    <div className="header-actions">
                        {user ? (
                            <>
                                <span style={{ fontSize: 14, fontWeight: 500 }}>Olá, {user.name.split(' ')[0]}</span>
                                <button className="btn btn-outline" onClick={handleLogout}>Sair</button>
                            </>
                        ) : (
                            <button className="btn btn-outline" onClick={() => navigate("/login")}>Entrar</button>
                        )}
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate("/agendar")}
                        >
                            Agendar agora
                        </button>
                        <button
                            className="menu-toggle"
                            aria-label="Alternar menu"
                            onClick={onToggleMenu}
                        >
                            <span></span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;