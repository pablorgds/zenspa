import React, { useEffect, useMemo, useState } from "react";
import "../../styles/sections.css"; // reaproveita estilos de cards/botões
import { api } from "../../services/api";

const BookingProfessionalStep = ({ bookingData, onBack, onConfirm }) => {
    const [selectedProId, setSelectedProId] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [professionalsList, setProfessionalsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredProfessionals, setFilteredProfessionals] = useState([]);

    useEffect(() => {
        api.getProfessionals().then(data => {
            setProfessionalsList(data);
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao carregar profissionais:", err);
            setLoading(false);
        });
    }, []);

    // Filtra profissionais por serviço e período
    useEffect(() => {
        if (!bookingData || professionalsList.length === 0) {
            setFilteredProfessionals([]);
            return;
        }

        const filtered = professionalsList.filter((pro) => {
            const matchesService = pro.specialties.includes(bookingData.servico);
            return matchesService;
        });
        setFilteredProfessionals(filtered);
    }, [professionalsList, bookingData]);

    // Normaliza período
    const normalizedPeriod =
        bookingData?.periodo === "Qualquer horário" || bookingData?.periodo === "" ? null : bookingData?.periodo;

    if (!bookingData || loading) return null;

    const { servico, periodo, data } = bookingData;

    // Horários Mockados (o banco de dados por enquanto não tem slots reais)
    const MOCK_SLOTS = {
        Manhã: ["09:00", "10:30"],
        Tarde: ["14:00", "16:00"],
        Noite: ["19:00", "20:30"],
    };

    const handleSelectSlot = (proId, time) => {
        setSelectedProId(proId);
        setSelectedTime(time);
    };

    const handleConfirm = () => {
        if (!selectedProId || !selectedTime) {
            alert("Selecione um profissional e um horário para continuar.");
            return;
        }

        const professional = professionalsList.find((p) => p.id === selectedProId);

        const selection = {
            ...bookingData,
            professionalId: professional.id,
            professionalName: professional.name,
            horario: selectedTime,
        };

        if (onConfirm) {
            onConfirm(selection);
        }
    };

    return (
        <section className="section">
            <div className="container">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">Escolha o profissional</h2>
                        <p className="section-subtitle">
                            Com base no serviço <strong>{servico}</strong> em{" "}
                            <strong>{data}</strong>
                            {normalizedPeriod && (
                                <>
                                    {" "}
                                    no período da <strong>{normalizedPeriod.toLowerCase()}</strong>
                                </>
                            )}
                            , selecione um profissional e um horário disponível.
                        </p>
                    </div>
                    <button className="btn btn-outline" onClick={onBack}>
                        Voltar ao resumo
                    </button>
                </div>

                {filteredProfessionals.length === 0 && (
                    <p style={{ fontSize: 14, color: "var(--muted)" }}>
                        Não encontramos profissionais com esse serviço e período. Tente
                        voltar e alterar o período ou serviço.
                    </p>
                )}

                <div className="cards-grid">
                    {filteredProfessionals.map((pro) => {
                        const periodsToShow = normalizedPeriod
                            ? [normalizedPeriod]
                            : ["Manhã", "Tarde", "Noite"];

                        return (
                            <article key={pro.id} className="card">
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div>
                                        <h3 className="card-title" style={{ marginBottom: 4 }}>
                                            {pro.name}
                                        </h3>
                                        <p className="card-text">
                                            {pro.specialties.join(" · ")}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "right", fontSize: 12 }}>
                                        <div>
                                            ⭐ {pro.rating.toFixed(1)}{" "}
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                                            Avaliações
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 10 }}>
                                    {periodsToShow.map((per) => {
                                        const slots = MOCK_SLOTS[per] || [];
                                        if (!slots.length) return null;

                                        return (
                                            <div key={per} style={{ marginBottom: 8 }}>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: "var(--muted)",
                                                        marginBottom: 4,
                                                    }}
                                                >
                                                    {per}
                                                </div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                    {slots.map((slot) => {
                                                        const isSelected =
                                                            selectedProId === pro.id && selectedTime === slot;
                                                        return (
                                                            <button
                                                                key={slot}
                                                                type="button"
                                                                onClick={() => handleSelectSlot(pro.id, slot)}
                                                                className="chip"
                                                                style={{
                                                                    fontSize: 11,
                                                                    padding: "4px 10px",
                                                                    borderRadius: 999,
                                                                    borderColor: isSelected
                                                                        ? "transparent"
                                                                        : "rgba(148, 163, 184, 0.6)",
                                                                    backgroundColor: isSelected
                                                                        ? "var(--primary)"
                                                                        : "#fff",
                                                                    color: isSelected ? "#fff" : "inherit",
                                                                }}
                                                            >
                                                                {slot}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                        );
                    })}
                </div>

                <div
                    style={{
                        marginTop: 20,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                        {selectedProId && selectedTime ? (
                            <>
                                Você selecionou{" "}
                                <strong>
                                    {
                                        professionalsList.find((p) => p.id === selectedProId)?.name
                                    }
                                </strong>{" "}
                                às <strong>{selectedTime}</strong>.
                            </>
                        ) : (
                            <>Selecione um profissional e um horário para continuar.</>
                        )}
                    </div>

                    <button className="btn btn-primary" onClick={handleConfirm}>
                        Confirmar profissional e horário
                    </button>
                </div>
            </div>
        </section>
    );
};

export default BookingProfessionalStep;
