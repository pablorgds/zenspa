import React, { useState } from "react";
import "../../styles/sections.css"; // reaproveita card, btn, etc.
import { getServicePrice } from "../../data/services";

const formatCurrency = (value) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const BookingConfirmStep = ({ bookingData, onBack, onFinish }) => {
    if (!bookingData) return null;

    const [paymentMethod, setPaymentMethod] = useState("pix");

    const {
        categoria,
        servico,
        data,
        periodo,
        professionalName,
        horario,
    } = bookingData;

    const basePrice = getServicePrice(servico);
    const servicePrice = basePrice;
    const servicePriceLabel = formatCurrency(servicePrice);

    const handleConfirm = () => {
        if (!paymentMethod) {
            alert("Selecione uma forma de pagamento para continuar.");
            return;
        }

        const finalSelection = {
            ...bookingData,
            paymentMethod,
            price: servicePrice,
        };

        if (onFinish) {
            onFinish(finalSelection);
        }
    };

    const PaymentOption = ({ value, label, description }) => {
        const isActive = paymentMethod === value;
        return (
            <button
                type="button"
                onClick={() => setPaymentMethod(value)}
                className="chip"
                style={{
                    padding: "8px 14px",
                    borderRadius: 12,
                    borderColor: isActive ? "transparent" : "rgba(148,163,184,0.6)",
                    backgroundColor: isActive ? "var(--primary)" : "#fff",
                    color: isActive ? "#fff" : "inherit",
                    textAlign: "left",
                    flex: "1 1 120px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 2,
                }}
            >
                <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
                {description && (
                    <span style={{ fontSize: 11, opacity: 0.9 }}>{description}</span>
                )}
            </button>
        );
    };

    return (
        <section className="section">
            <div className="container">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">Confirme seu agendamento</h2>
                        <p className="section-subtitle">
                            Revise os detalhes, escolha a forma de pagamento e finalize sua
                            reserva.
                        </p>
                    </div>
                    <button className="btn btn-outline" onClick={onBack}>
                        Voltar para escolha de profissional
                    </button>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
                        gap: 18,
                    }}
                >
                    {/* Resumo do agendamento */}
                    <div className="card" style={{ borderRadius: 20, padding: 18 }}>
                        <h3
                            className="card-title"
                            style={{ marginBottom: 8, fontSize: 16 }}
                        >
                            Detalhes do agendamento
                        </h3>
                        <p style={{ fontSize: 13, marginBottom: 6 }}>
                            <strong>Serviço:</strong> {servico}{" "}
                            <span style={{ color: "var(--muted)" }}>({categoria})</span>
                        </p>
                        <p style={{ fontSize: 13, marginBottom: 6 }}>
                            <strong>Profissional:</strong> {professionalName}
                        </p>
                        <p style={{ fontSize: 13, marginBottom: 6 }}>
                            <strong>Data:</strong> {data}
                        </p>
                        <p style={{ fontSize: 13, marginBottom: 6 }}>
                            <strong>Horário:</strong> {horario}{" "}
                            {periodo && (
                                <span style={{ color: "var(--muted)" }}>
                  ({periodo.toLowerCase()})
                </span>
                            )}
                        </p>
                        <p style={{ fontSize: 13, marginBottom: 6 }}>
                            <strong>Local:</strong> A definir (salão parceiro ou em domicílio)
                        </p>
                    </div>

                    {/* Pagamento e preço */}
                    <div className="card" style={{ borderRadius: 20, padding: 18 }}>
                        <h3
                            className="card-title"
                            style={{ marginBottom: 8, fontSize: 16 }}
                        >
                            Pagamento
                        </h3>

                        <div
                            style={{
                                fontSize: 13,
                                marginBottom: 10,
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>Valor do serviço</span>
                            <strong>{servicePriceLabel}</strong>
                        </div>

                        <div
                            style={{
                                fontSize: 11,
                                color: "var(--muted)",
                                marginBottom: 10,
                            }}
                        >
                            Não se preocupe: você só será cobrado após a confirmação do
                            atendimento pelo profissional.
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                                marginBottom: 12,
                            }}
                        >
                            <PaymentOption
                                value="pix"
                                label="Pix"
                                description="Confirmação rápida, chave enviada após agendamento."
                            />
                            <PaymentOption
                                value="card"
                                label="Cartão de crédito"
                                description="Pague online e garanta seu horário."
                            />
                            <PaymentOption
                                value="local"
                                label="Pagar no local"
                                description="Combine o pagamento diretamente com o espaço."
                            />
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: "100%", marginTop: 6 }}
                            onClick={handleConfirm}
                        >
                            Confirmar agendamento
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BookingConfirmStep;
