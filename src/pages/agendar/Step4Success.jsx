import React from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import BookingSuccessStep from "../../components/booking/BookingSuccessStep";

const Step4Success = () => {
    const navigate = useNavigate();
    const { bookingData, resetBooking } = useBooking();

    return (
        <BookingSuccessStep
            bookingData={bookingData}
            onBackHome={() => {
                resetBooking();
                navigate("/");
            }}
            onViewBookings={() => {
                resetBooking();
                navigate("/meus-agendamentos");
            }}
        />
    );
};

export default Step4Success;
