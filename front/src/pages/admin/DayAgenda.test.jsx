import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../services/api";
import AdminDashboard from "./AdminDashboard";
import DayAgenda from "./DayAgenda";

vi.mock("../../services/api", () => ({
    api: {
        getServices: vi.fn(),
        getProfessionals: vi.fn(),
        adminGetBookings: vi.fn(),
        adminUpdateBooking: vi.fn(),
        adminCancelBooking: vi.fn(),
        adminGetAgenda: vi.fn(),
        adminCreateBooking: vi.fn(),
    },
}));

const ana = {
    id: 1,
    name: "Ana",
    bookings: [],
    free_slots: [],
};

function agendaWith(professionals) {
    api.adminGetAgenda.mockResolvedValue({
        date: "2026-10-05",
        professionals,
    });
}

function renderAgenda() {
    return render(
        <MemoryRouter>
            <DayAgenda />
        </MemoryRouter>,
    );
}

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

beforeEach(() => {
    vi.clearAllMocks();
    api.getServices.mockResolvedValue([{ id: 1, name: "Massagem" }]);
    api.getProfessionals.mockResolvedValue([{ id: 1, name: "Ana" }]);
    agendaWith([ana]);
});

describe("agenda_do_dia_link_goes_to_agenda", () => {
    it("agenda_do_dia_link_goes_to_agenda", async () => {
        api.adminGetAgenda.mockReturnValue(new Promise(() => {}));
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={["/admin"]}>
                <Routes>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/agenda" element={<DayAgenda />} />
                </Routes>
            </MemoryRouter>,
        );

        await user.click(await screen.findByRole("link", { name: "Agenda do dia" }));
        expect(await screen.findByText("Carregando agenda...")).toBeInTheDocument();
    });
});

describe("agenda_shows_loading", () => {
    it("agenda_shows_loading", () => {
        api.adminGetAgenda.mockReturnValue(new Promise(() => {}));
        renderAgenda();
        expect(screen.getByText("Carregando agenda...")).toBeInTheDocument();
    });
});

describe("agenda_shows_error_without_booking_time", () => {
    it("agenda_shows_error_without_booking_time", async () => {
        api.adminGetAgenda.mockRejectedValue({ message: "Data inválida." });
        renderAgenda();
        expect(await screen.findByText("Data inválida.")).toBeInTheDocument();
        expect(screen.queryByText("09:00")).not.toBeInTheDocument();
    });
});

describe("agenda_shows_empty_day", () => {
    it("agenda_shows_empty_day", async () => {
        agendaWith([ana]);
        renderAgenda();
        expect(await screen.findByText("Nenhum horário neste dia.")).toBeInTheDocument();
    });
});

describe("agenda_shows_09_before_11", () => {
    it("agenda_shows_09_before_11", async () => {
        agendaWith([{
            ...ana,
            bookings: [
                { id: 1, time: "09:00", status: "pendente", user: { name: "Cliente" }, service: { name: "Massagem" } },
                { id: 2, time: "11:00", status: "pendente", user: { name: "Cliente" }, service: { name: "Massagem" } },
            ],
        }]);
        renderAgenda();
        const nine = await screen.findByText("09:00");
        const eleven = screen.getByText("11:00");
        expect(nine.compareDocumentPosition(eleven) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
});

describe("agenda_pendente_shows_confirmar_and_cancelar", () => {
    it("agenda_pendente_shows_confirmar_and_cancelar", async () => {
        agendaWith([{
            ...ana,
            bookings: [{ id: 7, time: "09:00", status: "pendente", user: { name: "Cliente" }, service: { name: "Massagem" } }],
        }]);
        renderAgenda();
        expect(await screen.findByRole("button", { name: "Confirmar" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    });
});

describe("agenda_confirmado_shows_concluir_and_cancelar", () => {
    it("agenda_confirmado_shows_concluir_and_cancelar", async () => {
        agendaWith([{
            ...ana,
            bookings: [{ id: 7, time: "09:00", status: "confirmado", user: { name: "Cliente" }, service: { name: "Massagem" } }],
        }]);
        renderAgenda();
        expect(await screen.findByRole("button", { name: "Concluir" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    });
});

describe("agenda_concluido_shows_no_action_buttons", () => {
    it("agenda_concluido_shows_no_action_buttons", async () => {
        agendaWith([{
            ...ana,
            bookings: [{ id: 7, time: "09:00", status: "concluído", user: { name: "Cliente" }, service: { name: "Massagem" } }],
        }]);
        renderAgenda();
        expect(await screen.findByText("concluído")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Confirmar" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Concluir" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    });
});

describe("agenda_confirmar_shows_confirmado", () => {
    it("agenda_confirmar_shows_confirmado", async () => {
        api.adminUpdateBooking.mockResolvedValue({ status: "confirmado" });
        agendaWith([{
            ...ana,
            bookings: [{ id: 7, time: "09:00", status: "pendente", user: { name: "Cliente" }, service: { name: "Massagem" } }],
        }]);
        const user = userEvent.setup();
        renderAgenda();
        await user.click(await screen.findByRole("button", { name: "Confirmar" }));
        expect(await screen.findByText("confirmado")).toBeInTheDocument();
    });
});

describe("agenda_concluir_shows_concluido", () => {
    it("agenda_concluir_shows_concluido", async () => {
        api.adminUpdateBooking.mockResolvedValue({ status: "concluído" });
        agendaWith([{
            ...ana,
            bookings: [{ id: 7, time: "09:00", status: "confirmado", user: { name: "Cliente" }, service: { name: "Massagem" } }],
        }]);
        const user = userEvent.setup();
        renderAgenda();
        await user.click(await screen.findByRole("button", { name: "Concluir" }));
        expect(await screen.findByText("concluído")).toBeInTheDocument();
    });
});

describe("agenda_cancel_drops_booking", () => {
    it("agenda_cancel_drops_booking", async () => {
        api.adminCancelBooking.mockResolvedValue({});
        vi.spyOn(window, "confirm").mockReturnValue(true);
        agendaWith([{
            ...ana,
            bookings: [{ id: 7, time: "09:00", status: "pendente", user: { name: "Cliente" }, service: { name: "Massagem" } }],
        }]);
        const user = userEvent.setup();
        renderAgenda();
        await user.click(await screen.findByRole("button", { name: "Cancelar" }));
        expect(window.confirm).toHaveBeenCalledWith("Cancelar agendamento?");
        expect(screen.queryByText("09:00")).not.toBeInTheDocument();
    });
});

describe("agenda_encaixar_opens_form_for_09", () => {
    it("agenda_encaixar_opens_form_for_09", async () => {
        agendaWith([{ ...ana, free_slots: ["09:00"] }]);
        const user = userEvent.setup();
        renderAgenda();
        await user.click(await screen.findByRole("button", { name: "Encaixar" }));
        const form = screen.getByRole("form", { name: "Encaixe" });
        expect(within(form).getByText("09:00")).toBeInTheDocument();
        const status = within(form).getByLabelText("Status");
        expect([...status.options].map((option) => option.value)).toEqual(["pendente", "confirmado"]);
    });
});

describe("agenda_encaixe_rejects_client_without_post", () => {
    it("agenda_encaixe_rejects_client_without_post", async () => {
        agendaWith([{ ...ana, free_slots: ["09:00"] }]);
        const user = userEvent.setup();
        renderAgenda();
        await user.click(await screen.findByRole("button", { name: "Encaixar" }));
        await user.type(screen.getByLabelText("Cliente"), "cliente");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        expect(screen.getByText("Informe o e-mail ou o id do cliente.")).toBeInTheDocument();
        expect(api.adminCreateBooking).not.toHaveBeenCalled();
    });
});

describe("agenda_encaixe_shows_salvando_once", () => {
    it("agenda_encaixe_shows_salvando_once", async () => {
        api.adminCreateBooking.mockReturnValue(new Promise(() => {}));
        agendaWith([{ ...ana, free_slots: ["09:00"] }]);
        const user = userEvent.setup();
        renderAgenda();
        await user.click(await screen.findByRole("button", { name: "Encaixar" }));
        await user.type(screen.getByLabelText("Cliente"), "cliente@example.com");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        expect(await screen.findByRole("button", { name: "Salvando..." })).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Salvando..." }));
        expect(api.adminCreateBooking).toHaveBeenCalledTimes(1);
    });
});

describe("agenda_encaixe_stays_open_on_422", () => {
    it("agenda_encaixe_stays_open_on_422", async () => {
        api.adminCreateBooking.mockRejectedValue({ message: "Horário já reservado." });
        agendaWith([{ ...ana, free_slots: ["09:00"] }]);
        const user = userEvent.setup();
        renderAgenda();
        await user.click(await screen.findByRole("button", { name: "Encaixar" }));
        await user.type(screen.getByLabelText("Cliente"), "cliente@example.com");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        expect(await screen.findByText("Horário já reservado.")).toBeInTheDocument();
        expect(screen.getByLabelText("Status")).toBeInTheDocument();
    });
});

describe("agenda_encaixe_closes_on_201", () => {
    it("agenda_encaixe_closes_on_201", async () => {
        api.adminCreateBooking.mockResolvedValue({ id: 9, status: "pendente", time: "09:00" });
        agendaWith([{ ...ana, free_slots: ["09:00"] }]);
        const user = userEvent.setup();
        renderAgenda();
        await user.click(await screen.findByRole("button", { name: "Encaixar" }));
        await user.type(screen.getByLabelText("Cliente"), "cliente@example.com");
        await user.click(screen.getByRole("button", { name: "Salvar" }));
        expect(await screen.findByText("09:00")).toBeInTheDocument();
        expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();
    });
});

describe("agenda_date_defaults_to_local_day", () => {
    it("agenda_date_defaults_to_local_day", () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 9, 5, 15, 0, 0));
        agendaWith([]);
        renderAgenda();
        expect(screen.getByLabelText("Data")).toHaveValue("2026-10-05");
        vi.useRealTimers();
    });
});
