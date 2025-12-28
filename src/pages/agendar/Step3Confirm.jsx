import React from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext"
import { addBooking } from "../../utils/bookingsStorage";
import BookingConfirmStep from "../../components/booking/BookingConfirmStep";

const Step3Confirm = () => {
    const navigate = useNavigate();
    const { bookingData, setBookingData, setBookingStep } = useBooking();

    return (
        <BookingConfirmStep
            bookingData={bookingData}
            onBack={() => navigate("/agendar/profissional")}
            onFinish={(finalSelection) => {
                // monta o objeto no formato usado em /meus-agendamentos
                const bookingToStore = {
                    id: `bk_${Date.now()}`,
                    status: "confirmed",
                    service: finalSelection.servico,
                    professionalName: finalSelection.professionalName,
                    date: finalSelection.data,
                    time: finalSelection.horario,
                    location: "A definir (salão parceiro ou em domicílio)",
                    price: finalSelection.price ?? 160,
                    createdAt: new Date().toISOString().split("T")[0],
                    paymentMethod: finalSelection.paymentMethod,
                };

                addBooking(bookingToStore);

                setBookingData(finalSelection);
                setBookingStep(4);
                navigate("/agendar/sucesso");
            }}
        />
    );
};

export default Step3Confirm;
