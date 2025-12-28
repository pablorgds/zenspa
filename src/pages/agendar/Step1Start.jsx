import React from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import QuickBooking from "../../components/landing/QuickBooking";

const Step1Start = () => {
    const navigate = useNavigate();
    const { setBookingData, setBookingStep } = useBooking();

    const handleSubmit = (data) => {
        setBookingData(data);
        setBookingStep(2);
        navigate("/agendar/profissional");
    };

    return (
        <section className="section">
            <div className="container" style={{ maxWidth: 520 }}>
                <h2 className="section-title">Agende seu atendimento</h2>
                <p className="section-subtitle">
                    Escolha serviço, data e período para encontrarmos profissionais disponíveis.
                </p>

                <div style={{ marginTop: 20 }}>
                    <QuickBooking onSubmit={handleSubmit} />
                </div>
            </div>
        </section>
    );
};

export default Step1Start;
