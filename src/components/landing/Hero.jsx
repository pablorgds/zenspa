import React from "react";
import "../../styles/hero.css";
import { useNavigate } from "react-router-dom";

const Hero = () => {
    const navigate = useNavigate();

    return (
        <div className="hero-left">
            <div className="badge">
                <span className="badge-dot"></span>
                Horários em tempo real · Profissionais verificados
            </div>
            <h1 className="hero-title">
                Agende sua próxima <span>massagem</span> em menos de 1 minuto.
            </h1>
            <p className="hero-subtitle">
                Um único lugar para encontrar, comparar e reservar massagens e serviços
                de estética com horários confirmados, sem ligação e sem espera.
            </p>

            <div className="hero-actions">
                <button 
                    className="btn btn-primary"
                    onClick={() => navigate("/agendar")}
                >
                    Começar agendamento
                </button>
                <button className="btn btn-outline">Ver profissionais</button>
            </div>

            <div className="hero-meta">
                <div>
                    <strong>+3.200</strong>
                    <br />
                    atendimentos agendados
                </div>
                <div>
                    <strong>4,9/5</strong>
                    <br />
                    média de satisfação
                </div>
                <div>
                    <strong>Cancelamento fácil</strong>
                    <br />
                    até 2h antes do horário
                </div>
            </div>
        </div>
    );
};

export default Hero;
