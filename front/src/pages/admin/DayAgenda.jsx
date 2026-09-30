import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import "../../styles/sections.css";

function localDay(now = new Date()) {
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
}

const DayAgenda = () => {
    const [date, setDate] = useState(localDay);
    const [professionals, setProfessionals] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [form, setForm] = useState(null);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        api.getServices()
            .then((list) => {
                if (!cancelled) setServices(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                if (!cancelled) setServices([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");
        api.adminGetAgenda(date)
            .then((data) => {
                if (cancelled) return;
                setProfessionals(data.professionals ?? []);
                setLoading(false);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.message || "Erro ao carregar a agenda.");
                setProfessionals([]);
                setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [date]);

    const dayEmpty = professionals.every(
        (pro) => pro.bookings.length === 0 && pro.free_slots.length === 0,
    );

    async function changeStatus(booking, status) {
        const updated = await api.adminUpdateBooking(booking.id, { status });
        setProfessionals((prev) => prev.map((pro) => ({
            ...pro,
            bookings: pro.bookings.map((item) => (
                item.id === booking.id ? { ...item, status: updated.status } : item
            )),
        })));
    }

    async function cancelBooking(booking) {
        if (!window.confirm("Cancelar agendamento?")) return;
        await api.adminCancelBooking(booking.id);
        setProfessionals((prev) => prev.map((pro) => ({
            ...pro,
            bookings: pro.bookings.filter((item) => item.id !== booking.id),
        })));
    }

    function openSlot(pro, time) {
        setFormError("");
        setForm({
            professionalId: pro.id,
            time,
            client: "",
            status: "pendente",
            serviceId: services[0] ? String(services[0].id) : "",
            payment: "pix",
        });
    }

    async function submitEncaixe(event) {
        event.preventDefault();
        if (!form || savingRef.current) return;

        const raw = form.client.trim();
        const isEmail = raw.includes("@");
        const isId = /^\d+$/.test(raw);
        if (!isEmail && !isId) {
            setFormError("Informe o e-mail ou o id do cliente.");
            return;
        }

        savingRef.current = true;
        setSaving(true);
        setFormError("");
        const payload = {
            service_id: Number(form.serviceId),
            professional_id: form.professionalId,
            date,
            time: form.time,
            payment_method: form.payment,
            status: form.status,
        };
        if (isEmail) payload.email = raw;
        else payload.user_id = Number(raw);

        try {
            const created = await api.adminCreateBooking(payload);
            const time = created.time || form.time;
            setProfessionals((prev) => prev.map((pro) => {
                if (pro.id !== form.professionalId) return pro;
                return {
                    ...pro,
                    bookings: [...pro.bookings, {
                        id: created.id,
                        time,
                        status: created.status || form.status,
                        user: created.user || { name: raw },
                        service: created.service || services.find((item) => String(item.id) === form.serviceId) || { name: "" },
                    }],
                    free_slots: pro.free_slots.filter((slot) => slot !== time),
                };
            }));
            setForm(null);
        } catch (err) {
            setFormError(err?.message || "Não foi possível encaixar.");
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    }

    return (
        <section className="section">
            <div className="container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h2 className="section-title">Agenda do dia</h2>
                    <Link to="/admin" className="btn btn-outline" style={{ textDecoration: "none" }}>Voltar</Link>
                </div>
                <label style={{ display: "block", marginBottom: 24 }}>
                    Data
                    <input
                        aria-label="Data"
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        style={{ display: "block", marginTop: 8 }}
                    />
                </label>
                {loading && <p>Carregando agenda...</p>}
                {error && <p role="alert">{error}</p>}
                {!loading && !error && dayEmpty && <p>Nenhum horário neste dia.</p>}
                {!loading && !error && professionals.map((pro) => (
                    <article key={pro.id} className="card" style={{ padding: 16, marginBottom: 16 }}>
                        <h3>{pro.name}</h3>
                        {pro.bookings.map((booking) => (
                            <div key={booking.id} style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                                <span>{booking.time}</span>
                                <span>{booking.status}</span>
                                <span>{booking.user?.name}</span>
                                <span>{booking.service?.name}</span>
                                {booking.status === "pendente" && (
                                    <button type="button" className="btn btn-primary" onClick={() => changeStatus(booking, "confirmado")}>
                                        Confirmar
                                    </button>
                                )}
                                {booking.status === "confirmado" && (
                                    <button type="button" className="btn btn-primary" onClick={() => changeStatus(booking, "concluído")}>
                                        Concluir
                                    </button>
                                )}
                                {(booking.status === "pendente" || booking.status === "confirmado") && (
                                    <button type="button" className="btn btn-outline" onClick={() => cancelBooking(booking)}>
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        ))}
                        {pro.free_slots.map((time) => (
                            <div key={time} style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                                <span>{time}</span>
                                <button type="button" className="btn btn-outline" onClick={() => openSlot(pro, time)}>
                                    Encaixar
                                </button>
                            </div>
                        ))}
                    </article>
                ))}
                {form && (
                    <form aria-label="Encaixe" onSubmit={submitEncaixe} className="card" style={{ padding: 16 }}>
                        <p>{form.time}</p>
                        <label style={{ display: "block", marginBottom: 12 }}>
                            Cliente
                            <input
                                aria-label="Cliente"
                                value={form.client}
                                onChange={(event) => setForm({ ...form, client: event.target.value })}
                                style={{ display: "block", marginTop: 8 }}
                            />
                        </label>
                        <label style={{ display: "block", marginBottom: 12 }}>
                            Status
                            <select
                                aria-label="Status"
                                value={form.status}
                                onChange={(event) => setForm({ ...form, status: event.target.value })}
                                style={{ display: "block", marginTop: 8 }}
                            >
                                <option value="pendente">pendente</option>
                                <option value="confirmado">confirmado</option>
                            </select>
                        </label>
                        <label style={{ display: "block", marginBottom: 12 }}>
                            Serviço
                            <select
                                aria-label="Serviço"
                                value={form.serviceId}
                                onChange={(event) => setForm({ ...form, serviceId: event.target.value })}
                                style={{ display: "block", marginTop: 8 }}
                            >
                                {services.map((service) => (
                                    <option key={service.id} value={service.id}>{service.name}</option>
                                ))}
                            </select>
                        </label>
                        <label style={{ display: "block", marginBottom: 12 }}>
                            Pagamento
                            <select
                                aria-label="Pagamento"
                                value={form.payment}
                                onChange={(event) => setForm({ ...form, payment: event.target.value })}
                                style={{ display: "block", marginTop: 8 }}
                            >
                                <option value="pix">pix</option>
                                <option value="cartao_credito">cartao_credito</option>
                                <option value="cartao_debito">cartao_debito</option>
                                <option value="dinheiro">dinheiro</option>
                            </select>
                        </label>
                        {formError && <p role="alert">{formError}</p>}
                        <button type="submit" className="btn btn-primary">
                            {saving ? "Salvando..." : "Salvar"}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
};

export default DayAgenda;
