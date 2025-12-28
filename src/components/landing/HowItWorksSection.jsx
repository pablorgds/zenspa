import React from "react";

const HowItWorksSection = () => {
    return (
        <section
            id="como-funciona"
            className="section"
            style={{ background: "#eef2f7" }}
        >
            <div className="container">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">Como funciona</h2>
                        <p className="section-subtitle">
                            Do primeiro clique ao momento em que você sai da maca renovado: o
                            fluxo foi desenhado para ser simples e sem fricção.
                        </p>
                    </div>
                </div>

                <div className="steps-grid">
                    <div className="step">
                        <div className="step-number">1</div>
                        <div className="step-title">Escolha o serviço</div>
                        <p>
                            Selecione o tipo de massagem ou tratamento estético, o local
                            (salão ou em casa) e o período desejado.
                        </p>
                    </div>

                    <div className="step">
                        <div className="step-number">2</div>
                        <div className="step-title">Defina horário e profissional</div>
                        <p>
                            Veja horários em tempo real, compare avaliações dos profissionais
                            e confirme o melhor encaixe.
                        </p>
                    </div>

                    <div className="step">
                        <div className="step-number">3</div>
                        <div className="step-title">Pague e relaxe</div>
                        <p>
                            Finalize com Pix, cartão ou pagamento no local. Você recebe
                            lembretes automáticos antes da sessão.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
