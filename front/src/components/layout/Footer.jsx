import React from "react";
import "../../styles/footer.css";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer>
            <div className="container">
                <div className="footer-grid">
                    <div>
                        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="footer-title">ZenSpa</div>
                        </Link>
                        <p style={{ color: "#9ca3af", maxWidth: 320 }}>
                            Plataforma de agendamento de massagens e estética focada em
                            experiência, organização de agenda e bem-estar contínuo.
                        </p>
                    </div>

                    <div>
                        <div className="footer-title">Navegação</div>
                        <ul className="footer-links">
                            <li>
                                <a href="/#servicos">Serviços</a>
                            </li>
                            <li>
                                <a href="/#como-funciona">Como funciona</a>
                            </li>
                            <li>
                                <a href="/#planos">Planos</a>
                            </li>
                            <li>
                                <Link to="/meus-agendamentos">Meus Agendamentos</Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <div className="footer-title">Contato</div>
                        <ul className="footer-links">
                            <li>
                                <a href="mailto:contato@zenspa.com.br">contato@zenspa.com.br</a>
                            </li>
                            <li>WhatsApp: (11) 99999-0000</li>
                            <li>Atendimento: seg a sáb, 8h às 20h</li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <span>© 2025 ZenSpa. Todos os direitos reservados.</span>
                    <span>Política de privacidade · Termos de uso</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
