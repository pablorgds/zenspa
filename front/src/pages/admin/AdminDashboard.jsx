import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import "../../styles/sections.css";

const AdminDashboard = () => {
    const [services, setServices] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("services");
    const [bookings, setBookings] = useState([]);
    const [bookingFilters, setBookingFilters] = useState({
        professional_id: "",
        status: "",
        date: ""
    });

    // Modal Service
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [serviceFormData, setServiceFormData] = useState({
        name: "", tag: "", description: "", duration_minutes: 60, price: 0,
    });

    // Modal Professional
    const [isProModalOpen, setIsProModalOpen] = useState(false);
    const [editingPro, setEditingPro] = useState(null);
    const [proFormData, setProFormData] = useState({
        name: "", role: "", rating: 5.0, specialties: "",
    });

    // Modal Reschedule/Booking
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [bookingFormData, setBookingFormData] = useState({
        professional_id: "", date: "", time: "", status: ""
    });
    const [bookingError, setBookingError] = useState("");

    // Financial
    const [financialPeriod, setFinancialPeriod] = useState("daily");
    const [financialSummary, setFinancialSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [transactionsPage, setTransactionsPage] = useState(1);
    const [transactionsMeta, setTransactionsMeta] = useState(null);
    const [loadingFinancial, setLoadingFinancial] = useState(false);

    // Availabilities
    const [selectedProForAvail, setSelectedProForAvail] = useState(null);
    const [availabilities, setAvailabilities] = useState([]);
    const [loadingAvail, setLoadingAvail] = useState(false);
    const [isAvailModalOpen, setIsAvailModalOpen] = useState(false);
    const [editingAvail, setEditingAvail] = useState(null);
    const [availFormData, setAvailFormData] = useState({
        day_of_week: 1, start_time: "09:00", end_time: "18:00", slot_duration: 60,
    });
    const [availError, setAvailError] = useState("");

    async function loadData() {
        setLoading(true);
        const [servs, pros] = await Promise.all([
            api.getServices(),
            api.getProfessionals()
        ]);
        setServices(servs);
        setProfessionals(pros);
        setLoading(false);
    }

    async function loadBookings() {
        const data = await api.adminGetBookings(bookingFilters);
        setBookings(data);
    }

    async function loadFinancial() {
        setLoadingFinancial(true);
        const [summary, txData] = await Promise.all([
            api.adminGetFinancialSummary(financialPeriod),
            api.adminGetTransactions(transactionsPage),
        ]);
        setFinancialSummary(summary);
        setTransactions(txData.data);
        setTransactionsMeta(txData);
        setLoadingFinancial(false);
    }

    async function loadAvailabilities(proId) {
        setLoadingAvail(true);
        const data = await api.adminGetAvailabilities(proId);
        setAvailabilities(data);
        setLoadingAvail(false);
    }

    useEffect(() => {
        void Promise.resolve().then(() => loadData());
    }, []);

    useEffect(() => {
        if (activeTab === "bookings") {
            void Promise.resolve().then(() => loadBookings());
        }
    }, [activeTab, bookingFilters]);

    useEffect(() => {
        if (activeTab === "availabilities" && selectedProForAvail) {
            void Promise.resolve().then(() => loadAvailabilities(selectedProForAvail));
        }
    }, [activeTab, selectedProForAvail]);

    useEffect(() => {
        if (activeTab === "financial") {
            void Promise.resolve().then(() => loadFinancial());
        }
    }, [activeTab, financialPeriod, transactionsPage]);

    const handleOpenBookingModal = (booking) => {
        setEditingBooking(booking);
        setBookingFormData({
            professional_id: booking.professional_id,
            date: booking.date,
            time: booking.time,
            status: booking.status
        });
        setBookingError("");
        setIsBookingModalOpen(true);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setBookingError("");
        try {
            await api.adminUpdateBooking(editingBooking.id, bookingFormData);
            setIsBookingModalOpen(false);
            loadBookings();
        } catch (error) {
            setBookingError(error.message || "Não foi possível salvar o agendamento.");
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm("Cancelar agendamento?")) {
            await api.adminCancelBooking(id);
            loadBookings();
        }
    };

    const handleDeleteBooking = async (id) => {
        if (window.confirm("Excluir agendamento permanentemente?")) {
            await api.adminDeleteBooking(id);
            loadBookings();
        }
    };

    const handleOpenServiceModal = (service = null) => {
        if (service) {
            setEditingService(service);
            setServiceFormData(service);
        } else {
            setEditingService(null);
            setServiceFormData({ name: "", tag: "", description: "", duration_minutes: 60, price: 0 });
        }
        setIsServiceModalOpen(true);
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        if (editingService) {
            await api.adminUpdateService(editingService.id, serviceFormData);
        } else {
            await api.adminCreateService(serviceFormData);
        }
        setIsServiceModalOpen(false);
        loadData();
    };

    const handleOpenProModal = (pro = null) => {
        if (pro) {
            setEditingPro(pro);
            setProFormData({ ...pro, specialties: pro.specialties.join(", ") });
        } else {
            setEditingPro(null);
            setProFormData({ name: "", role: "", rating: 5.0, specialties: "" });
        }
        setIsProModalOpen(true);
    };

    const handleProSubmit = async (e) => {
        e.preventDefault();
        const data = {
            ...proFormData,
            specialties: proFormData.specialties.split(",").map(s => s.trim())
        };
        if (editingPro) {
            await api.adminUpdateProfessional(editingPro.id, data);
        } else {
            await api.adminCreateProfessional(data);
        }
        setIsProModalOpen(false);
        loadData();
    };

    const handleDeleteService = async (id) => {
        if (window.confirm("Excluir serviço?")) {
            await api.adminDeleteService(id);
            loadData();
        }
    };

    const handleDeletePro = async (id) => {
        if (window.confirm("Excluir profissional?")) {
            await api.adminDeleteProfessional(id);
            loadData();
        }
    };

    const handleOpenAvailModal = (avail = null) => {
        setAvailError("");
        if (avail) {
            setEditingAvail(avail);
            setAvailFormData({
                day_of_week: avail.day_of_week,
                start_time: avail.start_time.slice(0, 5),
                end_time: avail.end_time.slice(0, 5),
                slot_duration: avail.slot_duration,
            });
        } else {
            setEditingAvail(null);
            setAvailFormData({ day_of_week: 1, start_time: "09:00", end_time: "18:00", slot_duration: 60 });
        }
        setIsAvailModalOpen(true);
    };

    const handleAvailSubmit = async (e) => {
        e.preventDefault();
        setAvailError("");
        try {
            if (editingAvail) {
                await api.adminUpdateAvailability(selectedProForAvail, editingAvail.id, availFormData);
            } else {
                await api.adminCreateAvailability(selectedProForAvail, availFormData);
            }
            setIsAvailModalOpen(false);
            loadAvailabilities(selectedProForAvail);
        } catch (err) {
            setAvailError(err?.message || "Erro ao salvar disponibilidade.");
        }
    };

    const handleDeleteAvail = async (availId) => {
        if (window.confirm("Excluir esta faixa de horário?")) {
            await api.adminDeleteAvailability(selectedProForAvail, availId);
            loadAvailabilities(selectedProForAvail);
        }
    };

    if (loading) return <div className="container" style={{ padding: 40 }}>Carregando painel...</div>;

    return (
        <section className="section">
            <div className="container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                    <div>
                        <h2 className="section-title">Painel Administrativo</h2>
                        <p className="section-subtitle">Gerencie o catálogo do Spa</p>
                    </div>
                    <Link to="/" className="btn btn-outline" style={{ textDecoration: "none" }}>
                        Voltar ao Início
                    </Link>
                </div>

                <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                    <button 
                        className={`btn ${activeTab === "services" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setActiveTab("services")}
                    >
                        Serviços
                    </button>
                    <button 
                        className={`btn ${activeTab === "pros" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setActiveTab("pros")}
                    >
                        Profissionais
                    </button>
                    <button
                        className={`btn ${activeTab === "bookings" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setActiveTab("bookings")}
                    >
                        Agendamentos
                    </button>
                    <button
                        className={`btn ${activeTab === "availabilities" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setActiveTab("availabilities")}
                    >
                        Disponibilidades
                    </button>
                    <button
                        className={`btn ${activeTab === "financial" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setActiveTab("financial")}
                    >
                        Financeiro
                    </button>
                </div>

                {activeTab === "services" && (
                    <div className="card" style={{ overflowX: "auto" }}>
                        <div style={{ padding: 16, display: "flex", justifyContent: "flex-end" }}>
                            <button className="btn btn-primary" onClick={() => handleOpenServiceModal()}>Novo Serviço</button>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                                    <th style={{ padding: 16 }}>Serviço</th>
                                    <th style={{ padding: 16 }}>Duração</th>
                                    <th style={{ padding: 16 }}>Preço</th>
                                    <th style={{ padding: 16 }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map(s => (
                                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td style={{ padding: 16 }}>
                                            <strong>{s.name}</strong><br/>
                                            <small style={{ color: "var(--muted)" }}>{s.tag}</small>
                                        </td>
                                        <td style={{ padding: 16 }}>{s.duration_minutes} min</td>
                                        <td style={{ padding: 16 }}>R$ {s.price}</td>
                                        <td style={{ padding: 16 }}>
                                            <button className="btn btn-outline" style={{ padding: "4px 8px", marginRight: 8, fontSize: 12 }} onClick={() => handleOpenServiceModal(s)}>Editar</button>
                                            <button className="btn btn-outline" style={{ padding: "4px 8px", fontSize: 12, color: "red" }} onClick={() => handleDeleteService(s.id)}>Excluir</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "pros" && (
                    <div className="card" style={{ overflowX: "auto" }}>
                        <div style={{ padding: 16, display: "flex", justifyContent: "flex-end" }}>
                            <button className="btn btn-primary" onClick={() => handleOpenProModal()}>Novo Profissional</button>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                                    <th style={{ padding: 16 }}>Nome</th>
                                    <th style={{ padding: 16 }}>Especialidades</th>
                                    <th style={{ padding: 16 }}>Avaliação</th>
                                    <th style={{ padding: 16 }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {professionals.map(p => (
                                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td style={{ padding: 16 }}>
                                            <strong>{p.name}</strong><br/>
                                            <small style={{ color: "var(--muted)" }}>{p.role}</small>
                                        </td>
                                        <td style={{ padding: 16 }}>{p.specialties.join(", ")}</td>
                                        <td style={{ padding: 16 }}>⭐ {p.rating}</td>
                                        <td style={{ padding: 16 }}>
                                            <button className="btn btn-outline" style={{ padding: "4px 8px", marginRight: 8, fontSize: 12 }} onClick={() => handleOpenProModal(p)}>Editar</button>
                                            <button className="btn btn-outline" style={{ padding: "4px 8px", fontSize: 12, color: "red" }} onClick={() => handleDeletePro(p.id)}>Excluir</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "bookings" && (
                    <div className="card" style={{ overflowX: "auto" }}>
                        <div style={{ padding: 16, display: "flex", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <label style={{ fontSize: 12, marginBottom: 4 }}>Profissional</label>
                                <select 
                                    className="input" 
                                    value={bookingFilters.professional_id} 
                                    onChange={e => setBookingFilters({...bookingFilters, professional_id: e.target.value})}
                                >
                                    <option value="">Todos</option>
                                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <label style={{ fontSize: 12, marginBottom: 4 }}>Status</label>
                                <select 
                                    className="input" 
                                    value={bookingFilters.status} 
                                    onChange={e => setBookingFilters({...bookingFilters, status: e.target.value})}
                                >
                                    <option value="">Todos</option>
                                    <option value="pendente">Pendente</option>
                                    <option value="confirmado">Confirmado</option>
                                    <option value="cancelado">Cancelado</option>
                                    <option value="concluído">Concluído</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <label style={{ fontSize: 12, marginBottom: 4 }}>Data</label>
                                <input 
                                    type="date" 
                                    className="input" 
                                    value={bookingFilters.date} 
                                    onChange={e => setBookingFilters({...bookingFilters, date: e.target.value})} 
                                />
                            </div>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                                    <th style={{ padding: 16 }}>Data/Hora</th>
                                    <th style={{ padding: 16 }}>Cliente</th>
                                    <th style={{ padding: 16 }}>Serviço/Pro</th>
                                    <th style={{ padding: 16 }}>Status</th>
                                    <th style={{ padding: 16 }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map(b => (
                                    <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td style={{ padding: 16 }}>
                                            {b.date}<br/>
                                            <small style={{ color: "var(--muted)" }}>{b.time}</small>
                                        </td>
                                        <td style={{ padding: 16 }}>{b.user?.name || "N/A"}</td>
                                        <td style={{ padding: 16 }}>
                                            {b.service?.name}<br/>
                                            <small style={{ color: "var(--muted)" }}>{b.professional?.name}</small>
                                        </td>
                                        <td style={{ padding: 16 }}>
                                            <span style={{ 
                                                padding: "4px 8px", 
                                                borderRadius: 12, 
                                                fontSize: 10, 
                                                textTransform: "uppercase",
                                                backgroundColor: b.status === "cancelado" ? "#fee2e2" : b.status === "confirmado" ? "#dcfce7" : "#fef9c3",
                                                color: b.status === "cancelado" ? "#991b1b" : b.status === "confirmado" ? "#166534" : "#854d0e"
                                            }}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: 16 }}>
                                            <button className="btn btn-outline" style={{ padding: "4px 8px", marginRight: 8, fontSize: 12 }} onClick={() => handleOpenBookingModal(b)}>Gerenciar</button>
                                            <button className="btn btn-outline" style={{ padding: "4px 8px", fontSize: 12, color: "red" }} onClick={() => handleDeleteBooking(b.id)}>Excluir</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "financial" && (
                    <div>
                        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                            <button
                                className={`btn ${financialPeriod === "daily" ? "btn-primary" : "btn-outline"}`}
                                onClick={() => { setFinancialPeriod("daily"); setTransactionsPage(1); }}
                            >
                                Hoje
                            </button>
                            <button
                                className={`btn ${financialPeriod === "monthly" ? "btn-primary" : "btn-outline"}`}
                                onClick={() => { setFinancialPeriod("monthly"); setTransactionsPage(1); }}
                            >
                                Este mês
                            </button>
                        </div>

                        {loadingFinancial ? (
                            <p style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</p>
                        ) : financialSummary && (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                                    <div className="card" style={{ padding: 20, textAlign: "center" }}>
                                        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                                            Faturamento ({financialPeriod === "daily" ? "hoje" : "este mês"})
                                        </p>
                                        <strong style={{ fontSize: 22 }}>
                                            R$ {Number(financialSummary.revenue).toFixed(2)}
                                        </strong>
                                    </div>
                                    <div className="card" style={{ padding: 20, textAlign: "center" }}>
                                        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                                            Agendamentos ({financialPeriod === "daily" ? "hoje" : "este mês"})
                                        </p>
                                        <strong style={{ fontSize: 22 }}>{financialSummary.bookings_count}</strong>
                                    </div>
                                    <div className="card" style={{ padding: 20, textAlign: "center" }}>
                                        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Faturamento total</p>
                                        <strong style={{ fontSize: 22 }}>
                                            R$ {Number(financialSummary.total_revenue).toFixed(2)}
                                        </strong>
                                    </div>
                                    <div className="card" style={{ padding: 20, textAlign: "center" }}>
                                        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Total de agendamentos</p>
                                        <strong style={{ fontSize: 22 }}>{financialSummary.total_bookings}</strong>
                                    </div>
                                </div>

                                <div className="card" style={{ overflowX: "auto" }}>
                                    <div style={{ padding: "16px 16px 0" }}>
                                        <strong style={{ fontSize: 14 }}>Transações</strong>
                                    </div>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                                                <th style={{ padding: 16 }}>Data</th>
                                                <th style={{ padding: 16 }}>Descrição</th>
                                                <th style={{ padding: 16 }}>Cliente</th>
                                                <th style={{ padding: 16 }}>Serviço</th>
                                                <th style={{ padding: 16 }}>Tipo</th>
                                                <th style={{ padding: 16 }}>Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>
                                                        Nenhuma transação encontrada.
                                                    </td>
                                                </tr>
                                            ) : transactions.map(tx => (
                                                <tr key={tx.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                                    <td style={{ padding: 16, fontSize: 13 }}>
                                                        {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                                                    </td>
                                                    <td style={{ padding: 16, fontSize: 13 }}>{tx.description}</td>
                                                    <td style={{ padding: 16, fontSize: 13 }}>{tx.booking?.user?.name || "—"}</td>
                                                    <td style={{ padding: 16, fontSize: 13 }}>{tx.booking?.service?.name || "—"}</td>
                                                    <td style={{ padding: 16 }}>
                                                        <span style={{
                                                            padding: "3px 8px", borderRadius: 10, fontSize: 10, textTransform: "uppercase",
                                                            backgroundColor: tx.type === "entrada" ? "#dcfce7" : "#fee2e2",
                                                            color: tx.type === "entrada" ? "#166534" : "#991b1b",
                                                        }}>
                                                            {tx.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: 16, fontSize: 13, fontWeight: 600 }}>
                                                        R$ {Number(tx.amount).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {transactionsMeta && transactionsMeta.last_page > 1 && (
                                        <div style={{ padding: 16, display: "flex", gap: 8, justifyContent: "center" }}>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: "4px 12px", fontSize: 12 }}
                                                disabled={transactionsPage === 1}
                                                onClick={() => setTransactionsPage(p => p - 1)}
                                            >
                                                Anterior
                                            </button>
                                            <span style={{ fontSize: 13, alignSelf: "center" }}>
                                                {transactionsPage} / {transactionsMeta.last_page}
                                            </span>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: "4px 12px", fontSize: 12 }}
                                                disabled={transactionsPage === transactionsMeta.last_page}
                                                onClick={() => setTransactionsPage(p => p + 1)}
                                            >
                                                Próxima
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {isServiceModalOpen && (
                    <div className="modal-overlay">
                        <div className="card modal-content" style={{ width: 400, padding: 32 }}>
                            <h3>{editingService ? "Editar" : "Novo"} Serviço</h3>
                            <form onSubmit={handleServiceSubmit} style={{ marginTop: 20 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Nome</label>
                                    <input type="text" className="input" style={{ width: "100%", padding: 8 }} value={serviceFormData.name} onChange={e => setServiceFormData({...serviceFormData, name: e.target.value})} required />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Tag</label>
                                    <input type="text" className="input" style={{ width: "100%", padding: 8 }} value={serviceFormData.tag} onChange={e => setServiceFormData({...serviceFormData, tag: e.target.value})} required />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Duração (min)</label>
                                    <input type="number" className="input" style={{ width: "100%", padding: 8 }} value={serviceFormData.duration_minutes} onChange={e => setServiceFormData({...serviceFormData, duration_minutes: e.target.value})} required />
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Preço (R$)</label>
                                    <input type="number" step="0.01" className="input" style={{ width: "100%", padding: 8 }} value={serviceFormData.price} onChange={e => setServiceFormData({...serviceFormData, price: e.target.value})} required />
                                </div>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar</button>
                                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsServiceModalOpen(false)}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isProModalOpen && (
                    <div className="modal-overlay">
                        <div className="card modal-content" style={{ width: 400, padding: 32 }}>
                            <h3>{editingPro ? "Editar" : "Novo"} Profissional</h3>
                            <form onSubmit={handleProSubmit} style={{ marginTop: 20 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Nome</label>
                                    <input type="text" className="input" style={{ width: "100%", padding: 8 }} value={proFormData.name} onChange={e => setProFormData({...proFormData, name: e.target.value})} required />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Cargo/Role</label>
                                    <input type="text" className="input" style={{ width: "100%", padding: 8 }} value={proFormData.role} onChange={e => setProFormData({...proFormData, role: e.target.value})} required />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Especialidades (separadas por vírgula)</label>
                                    <input type="text" className="input" style={{ width: "100%", padding: 8 }} value={proFormData.specialties} onChange={e => setProFormData({...proFormData, specialties: e.target.value})} required />
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Avaliação</label>
                                    <input type="number" step="0.1" max="5" min="0" className="input" style={{ width: "100%", padding: 8 }} value={proFormData.rating} onChange={e => setProFormData({...proFormData, rating: e.target.value})} required />
                                </div>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar</button>
                                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsProModalOpen(false)}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === "availabilities" && (
                    <div>
                        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                            <label style={{ fontSize: 12, marginBottom: 6, display: "block" }}>Selecione o profissional</label>
                            <select
                                className="input"
                                value={selectedProForAvail || ""}
                                onChange={e => setSelectedProForAvail(Number(e.target.value))}
                            >
                                <option value="">-- Escolha --</option>
                                {professionals.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedProForAvail && (
                            <div className="card" style={{ overflowX: "auto" }}>
                                <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <strong style={{ fontSize: 14 }}>
                                        Horários de {professionals.find(p => p.id === selectedProForAvail)?.name}
                                    </strong>
                                    <button className="btn btn-primary" onClick={() => handleOpenAvailModal()}>
                                        + Novo Horário
                                    </button>
                                </div>

                                {loadingAvail ? (
                                    <p style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>Carregando...</p>
                                ) : availabilities.length === 0 ? (
                                    <p style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>
                                        Nenhuma faixa de horário cadastrada.
                                    </p>
                                ) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                                                <th style={{ padding: 12 }}>Dia</th>
                                                <th style={{ padding: 12 }}>Início</th>
                                                <th style={{ padding: 12 }}>Fim</th>
                                                <th style={{ padding: 12 }}>Slot (min)</th>
                                                <th style={{ padding: 12 }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {availabilities.map(av => (
                                                <tr key={av.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                                    <td style={{ padding: 12 }}>
                                                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][av.day_of_week]}
                                                    </td>
                                                    <td style={{ padding: 12 }}>{av.start_time.slice(0, 5)}</td>
                                                    <td style={{ padding: 12 }}>{av.end_time.slice(0, 5)}</td>
                                                    <td style={{ padding: 12 }}>{av.slot_duration} min</td>
                                                    <td style={{ padding: 12 }}>
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: "4px 8px", marginRight: 8, fontSize: 12 }}
                                                            onClick={() => handleOpenAvailModal(av)}
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: "4px 8px", fontSize: 12, color: "red" }}
                                                            onClick={() => handleDeleteAvail(av.id)}
                                                        >
                                                            Excluir
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {isAvailModalOpen && (
                    <div className="modal-overlay">
                        <div className="card modal-content" style={{ width: 400, padding: 32 }}>
                            <h3>{editingAvail ? "Editar" : "Nova"} Faixa de Horário</h3>
                            {availError && (
                                <p style={{ color: "red", fontSize: 13, marginTop: 8 }}>{availError}</p>
                            )}
                            <form onSubmit={handleAvailSubmit} style={{ marginTop: 20 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Dia da semana</label>
                                    <select
                                        className="input"
                                        style={{ width: "100%", padding: 8 }}
                                        value={availFormData.day_of_week}
                                        onChange={e => setAvailFormData({ ...availFormData, day_of_week: Number(e.target.value) })}
                                        required
                                    >
                                        <option value={0}>Domingo</option>
                                        <option value={1}>Segunda-feira</option>
                                        <option value={2}>Terça-feira</option>
                                        <option value={3}>Quarta-feira</option>
                                        <option value={4}>Quinta-feira</option>
                                        <option value={5}>Sexta-feira</option>
                                        <option value={6}>Sábado</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Hora início</label>
                                    <input
                                        type="time"
                                        className="input"
                                        style={{ width: "100%", padding: 8 }}
                                        value={availFormData.start_time}
                                        onChange={e => setAvailFormData({ ...availFormData, start_time: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Hora fim</label>
                                    <input
                                        type="time"
                                        className="input"
                                        style={{ width: "100%", padding: 8 }}
                                        value={availFormData.end_time}
                                        onChange={e => setAvailFormData({ ...availFormData, end_time: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Duração do slot (minutos)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        style={{ width: "100%", padding: 8 }}
                                        value={availFormData.slot_duration}
                                        min={1}
                                        onChange={e => setAvailFormData({ ...availFormData, slot_duration: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar</button>
                                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsAvailModalOpen(false)}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isBookingModalOpen && (
                    <div className="modal-overlay">
                        <div className="card modal-content" style={{ width: 400, padding: 32 }}>
                            <h3>Gerenciar Agendamento</h3>
                            {bookingError && (
                                <p role="alert" style={{ color: "red", fontSize: 13, marginTop: 8 }}>{bookingError}</p>
                            )}
                            <form onSubmit={handleBookingSubmit} style={{ marginTop: 20 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Profissional</label>
                                    <select 
                                        className="input" 
                                        style={{ width: "100%", padding: 8 }}
                                        value={bookingFormData.professional_id}
                                        onChange={e => setBookingFormData({...bookingFormData, professional_id: e.target.value})}
                                        required
                                    >
                                        {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Data</label>
                                    <input 
                                        type="date" 
                                        className="input" 
                                        style={{ width: "100%", padding: 8 }}
                                        value={bookingFormData.date}
                                        onChange={e => setBookingFormData({...bookingFormData, date: e.target.value})}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Hora</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        style={{ width: "100%", padding: 8 }}
                                        value={bookingFormData.time}
                                        onChange={e => setBookingFormData({...bookingFormData, time: e.target.value})}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", fontSize: 12 }}>Status</label>
                                    <select 
                                        className="input" 
                                        style={{ width: "100%", padding: 8 }}
                                        value={bookingFormData.status}
                                        onChange={e => setBookingFormData({...bookingFormData, status: e.target.value})}
                                        required
                                    >
                                        <option value="pendente">Pendente</option>
                                        <option value="confirmado">Confirmado</option>
                                        <option value="cancelado">Cancelado</option>
                                        <option value="concluído">Concluído</option>
                                    </select>
                                </div>
                                <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                                    <button type="submit" className="btn btn-primary">Salvar Alterações</button>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline" 
                                        style={{ color: "red" }} 
                                        onClick={() => handleCancelBooking(editingBooking.id)}
                                    >
                                        Cancelar Agendamento
                                    </button>
                                    <button type="button" className="btn btn-outline" onClick={() => setIsBookingModalOpen(false)}>Fechar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    backgroundColor: rgba(0,0,0,0.5); display: flex; justifyContent: center; alignItems: center;
                    zIndex: 1000;
                }
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </section>
    );
};

export default AdminDashboard;