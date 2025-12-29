import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

/* ===========================
   Utils
   =========================== */

const formatCurrency = (value) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusLabel = (status) => {
    if (status === "confirmed") return "Confirmado";
    if (status === "completed") return "Concluído";
    if (status === "cancelled") return "Cancelado";
    return "Desconhecido";
};

const statusStyle = (status) => {
    if (status === "confirmed") {
        return {
            background: "var(--primary-light)",
            color: "var(--primary)",
            border: "1px solid rgba(46, 111, 108, 0.25)",
        };
    }
    if (status === "completed") {
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

/* ===========================
   Card
   =========================== */

const BookingCard = ({ booking, onReschedule, onCancel, onViewDetails }) => {
    return (
        <article className="card" style={{ borderRadius: 20, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 className="card-title" style={{ marginBottom: 2 }}>
                            {booking.service?.name}
                        </h3>
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
                    </div>

                    <p className="card-text" style={{ marginTop: 2 }}>
                        Profissional: <strong>{booking.professional?.name}</strong>
                    </p>
                </div>

                <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>
                        {formatCurrency(Number(booking.price))}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {booking.date} • {booking.time}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
                <div>
                    <strong style={{ color: "var(--text)" }}>Local:</strong>{" "}
                    {booking.location}
                </div>
                <div>
                    <strong style={{ color: "var(--text)" }}>Código:</strong> {booking.id}
                </div>
            </div>

            <div
                style={{
                    marginTop: 12,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => onViewDetails?.(booking)}
                >
                    Ver detalhes
                </button>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => onReschedule(booking)}
                        disabled={booking.status !== "confirmed"}
                    >
                        Reagendar
                    </button>

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => onCancel(booking)}
                        disabled={booking.status !== "confirmed"}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </article>
    );
};

/* ===========================
   Page
   =========================== */

const MyBookingsPage = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getBookings().then(data => {
            setBookings(data);
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao carregar agendamentos:", err);
            setLoading(false);
        });
    }, []);

    const [statusFilter, setStatusFilter] = useState("all");
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return bookings.filter((b) => {
            const matchesStatus =
                statusFilter === "all" ? true : b.status === statusFilter;
            if (!matchesStatus) return false;

            if (!q) return true;

            const haystack = `${b.service?.name} ${b.professional?.name} ${b.location} ${b.id}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [bookings, statusFilter, query]);

    const counts = useMemo(() => {
        const base = {
            all: bookings.length,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
        };
        for (const b of bookings) base[b.status] += 1;
        return base;
    }, [bookings]);

    const handleViewDetails = (booking) => {
        navigate(`/meus-agendamentos/${booking.id}`);
    };

    const handleReschedule = () => {
        navigate("/agendar");
    };

    const handleCancel = (booking) => {
        const ok = window.confirm(
            `Deseja cancelar o agendamento ${booking.id}?\n\n` +
            `Serviço: ${booking.service?.name}\n` +
            `Data: ${booking.date} às ${booking.time}`
        );

        if (ok) {
            alert("Função de cancelamento via API será implementada em breve.");
        }
    };

    return (
        <main className="section">
            <div className="container">
                <div className="section-header">
                    <div>
                        <h1 className="section-title">Meus agendamentos</h1>
                        <p className="section-subtitle">
                            Acompanhe seus próximos horários, histórico e cancelamentos.
                        </p>
                    </div>

                    <button className="btn btn-primary" onClick={() => navigate("/agendar")}>
                        Novo agendamento
                    </button>
                </div>

                {/* Filtros */}
                <div
                    className="card"
                    style={{
                        borderRadius: 20,
                        padding: 14,
                        marginBottom: 16,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div className="chips" style={{ gap: 6 }}>
                        <button
                            className={`chip ${statusFilter === "all" ? "active" : ""}`}
                            onClick={() => setStatusFilter("all")}
                        >
                            Todos ({counts.all})
                        </button>
                        <button
                            className={`chip ${statusFilter === "confirmed" ? "active" : ""}`}
                            onClick={() => setStatusFilter("confirmed")}
                        >
                            Confirmados ({counts.confirmed})
                        </button>
                        <button
                            className={`chip ${statusFilter === "completed" ? "active" : ""}`}
                            onClick={() => setStatusFilter("completed")}
                        >
                            Concluídos ({counts.completed})
                        </button>
                        <button
                            className={`chip ${statusFilter === "cancelled" ? "active" : ""}`}
                            onClick={() => setStatusFilter("cancelled")}
                        >
                            Cancelados ({counts.cancelled})
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por serviço, profissional, local..."
                            style={{
                                borderRadius: 999,
                                border: "1px solid rgba(148, 163, 184, 0.7)",
                                padding: "8px 12px",
                                minWidth: 260,
                                background: "#fff",
                                outline: "none",
                            }}
                        />
                        <button type="button" className="btn btn-outline" onClick={() => setQuery("")}>
                            Limpar
                        </button>
                    </div>
                </div>

                {/* Lista */}
                {filtered.length === 0 ? (
                    <div className="card" style={{ borderRadius: 20, padding: 18 }}>
                        <h3 className="card-title" style={{ marginBottom: 6 }}>
                            Nenhum agendamento encontrado
                        </h3>
                        <p className="card-text">
                            Ajuste os filtros ou faça um novo agendamento.
                        </p>
                        <div style={{ marginTop: 10 }}>
                            <button className="btn btn-primary" onClick={() => navigate("/agendar")}>
                                Agendar agora
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="cards-grid"
                        style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
                    >
                        {filtered.map((b) => (
                            <BookingCard
                                key={b.id}
                                booking={b}
                                onViewDetails={handleViewDetails}
                                onReschedule={handleReschedule}
                                onCancel={handleCancel}
                            />
                        ))}
                    </div>
                )}

                {/* Responsivo */}
                <style>
                    {`
            @media (max-width: 900px) {
              .cards-grid { grid-template-columns: 1fr !important; }
            }
          `}
                </style>
            </div>
        </main>
    );
};

export default MyBookingsPage;
