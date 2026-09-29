import React, { useEffect, useMemo, useState } from "react";
import "../../styles/sections.css"; // reaproveita estilos de cards/botões
import { api } from "../../services/api";

const ProfessionalCard = ({ pro, bookingData, selectedProId, selectedTime, onSelectSlot, normalizedPeriod }) => {
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(true);

    useEffect(() => {
        // Assume data no formato YYYY-MM-DD vindo do bookingData
        // Se estiver em outro formato, precisaremos converter
        let apiDate = bookingData.data;
        if (apiDate.includes('/')) {
            const [d, m, y] = apiDate.split('/');
            apiDate = `${y}-${m}-${d}`;
        }

        api.getAvailableSlots(pro.id, apiDate).then(data => {
            setSlots(data);
            setLoadingSlots(false);
        }).catch(err => {
            console.error("Erro ao carregar slots:", err);
            setLoadingSlots(false);
        });
    }, [pro.id, bookingData.data]);

    const categorizedSlots = {
        Manhã: slots.filter(s => parseInt(s.split(':')[0]) < 12),
        Tarde: slots.filter(s => parseInt(s.split(':')[0]) >= 12 && parseInt(s.split(':')[0]) < 18),
        Noite: slots.filter(s => parseInt(s.split(':')[0]) >= 18),
    };

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
                {loadingSlots ? (
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>Carregando horários...</p>
                ) : slots.length === 0 ? (
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>Sem horários disponíveis para este dia.</p>
                ) : (
                    periodsToShow.map((per) => {
                        const periodSlots = categorizedSlots[per] || [];
                        if (!periodSlots.length) return null;

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
                                    {periodSlots.map((slot) => {
                                        const isSelected =
                                            selectedProId === pro.id && selectedTime === slot;
                                        return (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => onSelectSlot(pro.id, slot)}
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
                    })
                )}
            </div>
        </article>
    );
};

const BookingProfessionalStep = ({ bookingData, onBack, onConfirm }) => {
    const [selectedProId, setSelectedProId] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [professionalsList, setProfessionalsList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProfessionals().then(data => {
            setProfessionalsList(data);
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao carregar profissionais:", err);
            setLoading(false);
        });
    }, []);

    const filteredProfessionals = useMemo(() => {
        if (!bookingData || professionalsList.length === 0) {
            return [];
        }

        return professionalsList.filter((pro) => {
            // Normaliza nomes para comparação caso haja diferenças de acentuação/case
            const matchesService = pro.specialties.some(s =>
                s.toLowerCase().trim() === bookingData.servico.toLowerCase().trim()
            );
            return matchesService;
        });
    }, [professionalsList, bookingData]);

    // Normaliza período
    const normalizedPeriod =
        bookingData?.periodo === "Qualquer horário" || bookingData?.periodo === "" ? null : bookingData?.periodo;

    if (!bookingData || loading) return null;

    const { servico, data } = bookingData;

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
                    {filteredProfessionals.map((pro) => (
                        <ProfessionalCard 
                            key={pro.id}
                            pro={pro}
                            bookingData={bookingData}
                            selectedProId={selectedProId}
                            selectedTime={selectedTime}
                            onSelectSlot={handleSelectSlot}
                            normalizedPeriod={normalizedPeriod}
                        />
                    ))}
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
