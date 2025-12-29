// src/context/BookingContext.jsx
import React, { createContext, useContext, useState } from "react";

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
    const [bookingStep, setBookingStep] = useState(1);
    const [bookingData, setBookingData] = useState(null);

    const resetBooking = () => {
        setBookingStep(1);
        setBookingData(null);
    };

    const value = {
        bookingStep,
        setBookingStep,
        bookingData,
        setBookingData,
        resetBooking,
    };

    return (
        <BookingContext.Provider value={value}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = () => {
    const ctx = useContext(BookingContext);
    if (!ctx) {
        throw new Error("useBooking deve ser usado dentro de BookingProvider");
    }
    return ctx;
};
