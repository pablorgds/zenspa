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

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import DayAgenda from "./pages/admin/DayAgenda";

import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";

import "./styles/global.css";

function App() {
    return (
        <AuthProvider>
            <BookingProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/registrar" element={<RegisterPage />} />

                        {/* ADMIN */}
                        <Route path="/admin" element={
                            <PrivateRoute adminOnly>
                                <AdminDashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/admin/agenda" element={
                            <PrivateRoute adminOnly>
                                <DayAgenda />
                            </PrivateRoute>
                        } />

                        {/* AGENDAMENTO */}
                        <Route path="/agendar" element={
                            <PrivateRoute>
                                <Step1Start />
                            </PrivateRoute>
                        } />
                        <Route path="/agendar/profissional" element={
                            <PrivateRoute>
                                <Step2Professional />
                            </PrivateRoute>
                        } />
                        <Route path="/agendar/confirmacao" element={
                            <PrivateRoute>
                                <Step3Confirm />
                            </PrivateRoute>
                        } />
                        <Route path="/agendar/sucesso" element={
                            <PrivateRoute>
                                <Step4Success />
                            </PrivateRoute>
                        } />

                        {/* PÁGINA DE AGENDAMENTOS */}
                        <Route path="/meus-agendamentos" element={
                            <PrivateRoute>
                                <MyBookingsPage />
                            </PrivateRoute>
                        } />
                        <Route path="/meus-agendamentos/:id" element={
                            <PrivateRoute>
                                <BookingDetailsPage />
                            </PrivateRoute>
                        } />
                    </Routes>
                </BrowserRouter>
            </BookingProvider>
        </AuthProvider>
    );
}

export default App;
