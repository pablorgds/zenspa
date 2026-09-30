import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { BookingProvider, useBooking } from "../../context/BookingContext";
import { api } from "../../services/api";
import Step3Confirm from "./Step3Confirm";

vi.mock("../../services/api", () => ({
    api: {
        createBooking: vi.fn(),
    },
}));

function SeedBooking() {
    const { setBookingData } = useBooking();
    useEffect(() => {
        setBookingData({
            categoria: "Spa",
            servico: "Massagem",
            data: "2026-10-05",
            professionalName: "Ana",
            horario: "09:00",
            price: 100,
            serviceId: 1,
            professionalId: 1,
        });
    }, [setBookingData]);
    return null;
}

describe("step3_shows_422_message_and_stays", () => {
    it("step3_shows_422_message_and_stays", async () => {
        api.createBooking.mockRejectedValue({ message: "Horário já reservado." });
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={["/agendar/confirmacao"]}>
                <BookingProvider>
                    <SeedBooking />
                    <Routes>
                        <Route path="/agendar/confirmacao" element={<Step3Confirm />} />
                        <Route path="/agendar/sucesso" element={<h1>pagina sucesso</h1>} />
                    </Routes>
                </BookingProvider>
            </MemoryRouter>,
        );

        await user.click(await screen.findByRole("button", { name: "Confirmar agendamento" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Horário já reservado.");
        expect(screen.queryByRole("heading", { name: "pagina sucesso" })).not.toBeInTheDocument();
    });
});
