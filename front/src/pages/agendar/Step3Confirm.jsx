import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext"
import { api } from "../../services/api";
import BookingConfirmStep from "../../components/booking/BookingConfirmStep";

const Step3Confirm = () => {
    const navigate = useNavigate();
    const { bookingData, setBookingData, setBookingStep } = useBooking();
    const [errorMessage, setErrorMessage] = useState("");

    const handleFinish = async (finalSelection) => {
        setErrorMessage("");
        try {
            await api.createBooking({
                service_id: finalSelection.serviceId,
                professional_id: finalSelection.professionalId,
                date: finalSelection.data,
                time: finalSelection.horario,
                payment_method: finalSelection.paymentMethod,
                price: finalSelection.price,
            });

            setBookingData(finalSelection);
            setBookingStep(4);
            navigate("/agendar/sucesso");
        } catch (error) {
            console.error("Erro ao finalizar agendamento:", error);
            setErrorMessage(error.message || "Ocorreu um erro ao salvar seu agendamento. Por favor, tente novamente.");
        }
    };

    return (
        <>
            {errorMessage && (
                <p role="alert" style={{ color: "var(--danger, #b91c1c)", margin: "16px auto", maxWidth: 720 }}>
                    {errorMessage}
                </p>
            )}
            <BookingConfirmStep
                bookingData={bookingData}
                onBack={() => navigate("/agendar/professional")}
                onFinish={handleFinish}
            />
        </>
    );
};

export default Step3Confirm;
