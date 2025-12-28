import React from "react";
import { SERVICES } from "../../data/services";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";

const ServicesSection = () => {
    const navigate = useNavigate();
    const { setBookingData, setBookingStep } = useBooking();

    const handleBookService = (svc) => {
        setBookingData({
            categoria: svc.tag,
            servico: svc.name,
            data: "", // O usuário escolhe depois ou podemos deixar em branco
            periodo: ""
        });
        setBookingStep(1); // Garante que comece do início se for via Landing
        navigate("/agendar");
    };

    return (
        <section id="servicos" className="section">
            <div className="container">
                {/* header igual... */}
                <div className="section-header">
                    <div>
                        <h2 className="section-title">Serviços mais buscados</h2>
                        <p className="section-subtitle">
                            Monte sua experiência de spa escolhendo massagens e tratamentos de
                            estética em uma mesma reserva.
                        </p>
                    </div>
                    <div className="chips">
                        <button className="chip active">Todos</button>
                        <button className="chip">Massagens</button>
                        <button className="chip">Estética facial</button>
                        <button className="chip">Estética corporal</button>
                    </div>
                </div>

                <div className="cards-grid">
                    {SERVICES.map((svc) => (
                        <article key={svc.id} className="card">
                            <span className="card-tag">{svc.tag}</span>
                            <h3 className="card-title">{svc.name}</h3>
                            <p className="card-text">{svc.description}</p>
                            <div className="card-footer">
                                <div>
                                    <div className="price">
                                        {svc.price.toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                        })}
                                    </div>
                                    <div className="duration">
                                        {svc.durationMinutes} minutos
                                    </div>
                                </div>
                                <button
                                    className="btn btn-outline"
                                    style={{ fontSize: 11, padding: "4px 10px" }}
                                    onClick={() => handleBookService(svc)}
                                >
                                    Agendar
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;
