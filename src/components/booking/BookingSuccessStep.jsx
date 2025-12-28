// src/components/booking/BookingSuccessStep.jsx
import React from "react";
import "../../styles/sections.css";

const BookingSuccessStep = ({ bookingData, onBackHome, onViewBookings }) => {
    if (!bookingData) return null;

    const {
        servico,
        professionalName,
        data,
        horario,
        paymentMethod,
        price,
    } = bookingData;

    const paymentLabel =
        paymentMethod === "pix"
            ? "Pix"
            : paymentMethod === "card"
                ? "Cartão de crédito"
                : "Pagamento no local";

    return (
        <section className="section">
            <div className="container">
                <div className="card" style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                        <div
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: "50%",
                                margin: "0 auto 8px",
                                backgroundColor: "var(--primary-light)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 28,
                            }}
                        >
                            ✓
                        </div>
                        <h2 className="section-title" style={{ marginBottom: 4 }}>
                            Agendamento confirmado!
                        </h2>
                        <p className="section-subtitle">
                            Enviamos um e-mail com todos os detalhes da sua sessão.
                        </p>
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 12 }}>
                        <p>
                            <strong>Serviço:</strong> {servico}
                        </p>
                        <p>
                            <strong>Profissional:</strong> {professionalName}
                        </p>
                        <p>
                            <strong>Data e horário:</strong> {data} às {horario}
                        </p>
                        <p>
                            <strong>Forma de pagamento:</strong> {paymentLabel}
                        </p>
                        {price && (
                            <p>
                                <strong>Valor:</strong>{" "}
                                {price.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                })}
                            </p>
                        )}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 10,
                            justifyContent: "center",
                            marginTop: 10,
                        }}
                    >
                        <button className="btn btn-outline" onClick={onBackHome}>
                            Voltar para início
                        </button>
                        <button className="btn btn-primary" onClick={onViewBookings}>
                            Ver meus agendamentos
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BookingSuccessStep;
