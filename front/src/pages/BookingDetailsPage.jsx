import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

const formatCurrency = (value) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusLabel = (status) => {
    if (status === "confirmado") return "Confirmado";
    if (status === "concluído") return "Concluído";
    if (status === "cancelado") return "Cancelado";
    if (status === "pendente") return "Pendente";
    return status ?? "Desconhecido";
};

const statusStyle = (status) => {
    if (status === "confirmado" || status === "pendente") {
        return {
            background: "var(--primary-light)",
            color: "var(--primary)",
            border: "1px solid rgba(46, 111, 108, 0.25)",
        };
    }
    if (status === "concluído") {
        return {
            background: "rgba(34,197,94,0.08)",
            color: "rgba(22,101,52,1)",
            border: "1px solid rgba(34,197,94,0.25)",
        };
    }
    return {
        background: "rgba(239,68,68,0.08)",
        color: "rgba(153,27,27,1)",
        border: "1px solid rgba(239,68,68,0.25)",
    };
};

const BookingDetailsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.getBooking(id)
            .then(setBooking)
            .catch(() => setError("Agendamento não encontrado ou você não tem permissão para visualizá-lo."))
            .finally(() => setLoading(false));
    }, [id]);

    const handleCancel = async () => {
        if (!window.confirm("Deseja cancelar este agendamento?")) return;
        try {
            const updated = await api.cancelBooking(id);
            setBooking(updated);
        } catch {
            setError("Não foi possível cancelar o agendamento. Tente novamente.");
        }
    };

    if (loading) {
        return (
            <main className="section">
                <div className="container" style={{ maxWidth: 760 }}>
                    <p className="section-subtitle">Carregando agendamento...</p>
                </div>
            </main>
        );
    }

    if (!booking) {
        return (
            <main className="section">
                <div className="container" style={{ maxWidth: 760 }}>
                    <div className="section-header">
                        <div>
                            <h1 className="section-title">Detalhes do agendamento</h1>
                            <p className="section-subtitle">
                                {error || "Não encontramos o agendamento solicitado."}
                            </p>
                        </div>
                        <button className="btn btn-outline" onClick={() => navigate("/meus-agendamentos")}>
                            Voltar
                        </button>
                    </div>

                    <div className="card" style={{ borderRadius: 20, padding: 18 }}>
                        <h3 className="card-title" style={{ marginBottom: 8 }}>
                            Agendamento não encontrado
                        </h3>
                        <p className="card-text">
                            O link pode estar incorreto ou o agendamento foi removido.
                        </p>
                        <div style={{ marginTop: 10 }}>
                            <button className="btn btn-primary" onClick={() => navigate("/agendar")}>
                                Novo agendamento
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="section">
            <div className="container" style={{ maxWidth: 860 }}>
                <div className="section-header">
                    <div>
                        <h1 className="section-title">Detalhes do agendamento</h1>
                        <p className="section-subtitle">
                            Visualize as informações completas e o status do seu horário.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="btn btn-outline" onClick={() => navigate("/meus-agendamentos")}>
                            Voltar
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate("/agendar")}>
                            Novo agendamento
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
                        gap: 16,
                    }}
                >
                    {/* Card principal */}
                    <div className="card" style={{ borderRadius: 20, padding: 18 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div>
                                <h2 className="card-title" style={{ fontSize: 18, marginBottom: 4 }}>
                                    {booking.service}
                                </h2>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                      style={{
                          ...statusStyle(booking.status),
                          fontSize: 11,
                          padding: "3px 10px",
                          borderRadius: 999,
                          whiteSpace: "nowrap",
                      }}
                  >
                    {statusLabel(booking.status)}
                  </span>
                                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    Código: <strong style={{ color: "var(--text)" }}>{booking.id}</strong>
                  </span>
                                </div>
                            </div>

                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 800, fontSize: 16 }}>
                                    {formatCurrency(booking.price)}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                                    {booking.date} • {booking.time}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 12, color: "var(--muted)" }}>Profissional</div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{booking.professionalName}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: 12, color: "var(--muted)" }}>Local</div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{booking.location}</div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Data</div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{booking.date}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Horário</div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{booking.time}</div>
                                </div>
                            </div>

                            {booking.paymentMethod && (
                                <div>
                                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Pagamento</div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                                        {booking.paymentMethod === "pix"
                                            ? "Pix"
                                            : booking.paymentMethod === "card"
                                                ? "Cartão de crédito"
                                                : "Pagamento no local"}
                                    </div>
                                </div>
                            )}

                            {booking.createdAt && (
                                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                                    Criado em: {booking.createdAt}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card lateral (ações / info extra) */}
                    <div className="card" style={{ borderRadius: 20, padding: 18 }}>
                        <h3 className="card-title" style={{ marginBottom: 8 }}>
                            Ações rápidas
                        </h3>

                        <div style={{ display: "grid", gap: 10 }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => navigate("/agendar")}
                                disabled={booking.status !== "confirmed"}
                                title={
                                    booking.status !== "confirmed"
                                        ? "Reagendamento disponível apenas para agendamentos confirmados."
                                        : ""
                                }
                            >
                                Reagendar
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={handleCancel}
                                disabled={booking.status !== "confirmado" && booking.status !== "pendente"}
                                title={
                                    booking.status !== "confirmado" && booking.status !== "pendente"
                                        ? "Cancelamento disponível apenas para agendamentos confirmados ou pendentes."
                                        : ""
                                }
                            >
                                Cancelar
                            </button>

                            {error && (
                                <p style={{ fontSize: 12, color: "rgba(153,27,27,1)", marginTop: 4 }}>{error}</p>
                            )}

                            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                                Em breve: reagendamento inteligente, comprovante e suporte via WhatsApp.
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    {`
            @media (max-width: 900px) {
              .container { max-width: 100% !important; }
              main .container > div[style*="gridTemplateColumns"] {
                grid-template-columns: 1fr !important;
              }
            }
          `}
                </style>
            </div>
        </main>
    );
};

export default BookingDetailsPage;
