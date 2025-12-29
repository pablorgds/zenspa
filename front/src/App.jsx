import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// CONTEXT
import { BookingProvider } from "./context/BookingContext";

// PÁGINAS
import LandingPage from "./pages/LandingPage";
import Step1Start from "./pages/agendar/Step1Start";
import Step2Professional from "./pages/agendar/Step2Professional";
import Step3Confirm from "./pages/agendar/Step3Confirm";
import Step4Success from "./pages/agendar/Step4Success";

import MyBookingsPage from "./pages/MyBookingsPage";
import BookingDetailsPage from "./pages/BookingDetailsPage";

import "./styles/global.css";

function App() {
    return (
        <BookingProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />

                    {/* AGENDAMENTO */}
                    <Route path="/agendar" element={<Step1Start />} />
                    <Route path="/agendar/profissional" element={<Step2Professional />} />
                    <Route path="/agendar/confirmacao" element={<Step3Confirm />} />
                    <Route path="/agendar/sucesso" element={<Step4Success />} />

                    {/* PÁGINA DE AGENDAMENTOS */}
                    <Route path="/meus-agendamentos" element={<MyBookingsPage />} />
                    <Route path="/meus-agendamentos/:id" element={<BookingDetailsPage />} />
                </Routes>
            </BrowserRouter>
        </BookingProvider>
    );
}

export default App;
