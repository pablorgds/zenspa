import React from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext"
import { api } from "../../services/api";
import BookingConfirmStep from "../../components/booking/BookingConfirmStep";

const Step3Confirm = () => {
    const navigate = useNavigate();
    const { bookingData, setBookingData, setBookingStep } = useBooking();

    const handleFinish = async (finalSelection) => {
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
            alert("Ocorreu um erro ao salvar seu agendamento. Por favor, tente novamente.");
        }
    };

    return (
        <BookingConfirmStep
            bookingData={bookingData}
            onBack={() => navigate("/agendar/professional")}
            onFinish={handleFinish}
        />
    );
};

export default Step3Confirm;
