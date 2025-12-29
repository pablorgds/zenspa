import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { api } from "../../services/api";

const ServicesSection = () => {
    const navigate = useNavigate();
    const { setBookingData, setBookingStep } = useBooking();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getServices().then(data => {
            setServices(data);
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao carregar serviços:", err);
            setLoading(false);
        });
    }, []);

    const handleBookService = (svc) => {
        setBookingData({
            serviceId: svc.id,
            categoria: svc.tag,
            servico: svc.name,
            data: "",
            periodo: ""
        });
        setBookingStep(1);
        navigate("/agendar");
    };

    if (loading) return null; // ou um esqueleto de loading

    return (
        <section id="servicos" className="section">
            <div className="container">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">Serviços mais buscados</h2>
                        <p className="section-subtitle">
                            Monte sua experiência de spa escolhendo massagens e tratamentos de
                            estética em uma mesma reserva.
                        </p>
                    </div>
                </div>

                <div className="cards-grid">
                    {services.map((svc) => (
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
                                        {svc.duration_minutes} minutos
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
