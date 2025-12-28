import React from "react";
import { useNavigate } from "react-router-dom";

const StudioCtaSection = () => {
    const navigate = useNavigate();

    return (
        <section id="contato" className="section" style={{ paddingBottom: 10 }}>
            <div className="container">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">
                            Quer levar o ZenSpa para o seu estúdio?
                        </h2>
                        <p className="section-subtitle">
                            Conecte seu espaço de bem-estar à nossa plataforma e tenha uma
                            agenda organizada, sem planilhas e sem overbooking.
                        </p>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate("/agendar")}
                    >
                        Sou profissional / salão
                    </button>
                </div>
            </div>
        </section>
    );
};

export default StudioCtaSection;
