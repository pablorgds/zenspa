import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { api } from "../../services/api";
import AdminDashboard from "./AdminDashboard";

vi.mock("../../services/api", () => ({
    api: {
        getServices: vi.fn(),
        getProfessionals: vi.fn(),
        adminGetBookings: vi.fn(),
        adminUpdateBooking: vi.fn(),
    },
}));

const booking = {
    id: 7,
    professional_id: 1,
    date: "2026-10-05",
    time: "09:00",
    status: "pendente",
    service: { name: "Massagem" },
    user: { name: "Cliente" },
    professional: { name: "Ana" },
};

describe("admin_modal_stays_open_on_422", () => {
    it("admin_modal_stays_open_on_422", async () => {
        api.getServices.mockResolvedValue([]);
        api.getProfessionals.mockResolvedValue([{ id: 1, name: "Ana" }]);
        api.adminGetBookings.mockResolvedValue([booking]);
        api.adminUpdateBooking.mockRejectedValue({ message: "Horário já reservado." });
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminDashboard />
            </MemoryRouter>,
        );

        await user.click(await screen.findByRole("button", { name: "Agendamentos" }));
        await user.click(await screen.findByRole("button", { name: "Gerenciar" }));
        expect(await screen.findByRole("heading", { name: "Gerenciar Agendamento" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Salvar Alterações" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Horário já reservado.");
        expect(screen.getByRole("heading", { name: "Gerenciar Agendamento" })).toBeInTheDocument();
    });
});
