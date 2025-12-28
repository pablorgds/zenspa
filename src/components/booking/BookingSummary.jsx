import React from "react";
import "../../styles/sections.css"; // reutiliza estilo de card, botões etc.

const BookingSummary = ({ data, onBack, onNext }) => {
    if (!data) return null;

    return (
        <section className="section">
            <div className="container">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">Resumo do seu agendamento</h2>
                        <p className="section-subtitle">
                            Confira os detalhes antes de escolher o profissional.
                        </p>
                    </div>
                </div>

                <div
                    className="card"
                    style={{
                        maxWidth: 420,
                        margin: "0 auto",
                        padding: 18,
                        borderRadius: 20,
                    }}
                >
                    <p>
                        <strong>Categoria:</strong> {data.categoria}
                    </p>
                    <p>
                        <strong>Serviço:</strong> {data.servico}
                    </p>
                    <p>
                        <strong>Data:</strong> {data.data}
                    </p>
                    <p>
                        <strong>Período:</strong> {data.periodo}
                    </p>

                    <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                        <button className="btn btn-outline" onClick={onBack}>
                            Editar
                        </button>
                        <button className="btn btn-primary" onClick={onNext}>
                            Escolher profissional
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BookingSummary;
