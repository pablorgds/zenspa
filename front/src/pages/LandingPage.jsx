import React, { useState } from "react";
import "../styles/sections.css";
import Header from "../components/layout/Header";
import Hero from "../components/landing/Hero";
import QuickBooking from "../components/landing/QuickBooking";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import ServicesSection from "../components/landing/ServicesSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import PlansSection from "../components/landing/PlansSection";
import StudioCtaSection from "../components/landing/StudioCtaSection";
import Footer from "../components/layout/Footer";

const LandingPage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { setBookingData } = useBooking();
    
    const handleToggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

    const handleQuickBookingSubmit = (data) => {
        setBookingData(data);
        navigate("/agendar/profissional");
    };

    return (
        <div className="page">
            <Header isMenuOpen={isMenuOpen} onToggleMenu={handleToggleMenu} />

            <main>
                <section className="hero">
                    <div className="container">
                        <div className="hero-grid">
                            <Hero />
                            <QuickBooking onSubmit={handleQuickBookingSubmit} />
                        </div>
                    </div>
                </section>

                <ServicesSection />

                <HowItWorksSection />

                <PlansSection />

                <StudioCtaSection />

            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;