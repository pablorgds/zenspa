import React from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import BookingProfessionalStep from "../../components/booking/BookingProfessionalStep";

const Step2Professional = () => {
    const navigate = useNavigate();
    const { bookingData, setBookingData, setBookingStep } = useBooking();

    const handleConfirm = (selection) => {
        setBookingData(selection);
        setBookingStep(3);
        navigate("/agendar/confirmacao");
    };

    return (
        <BookingProfessionalStep
            bookingData={bookingData}
            onBack={() => navigate("/agendar")}
            onConfirm={handleConfirm}
        />
    );
};

export default Step2Professional;
