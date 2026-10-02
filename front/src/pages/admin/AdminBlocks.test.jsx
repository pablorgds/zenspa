import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../services/api";
import AdminDashboard from "./AdminDashboard";

vi.mock("../../services/api", () => ({
  api: {
    getServices: vi.fn(),
    getProfessionals: vi.fn(),
    adminGetBookings: vi.fn(),
    adminUpdateBooking: vi.fn(),
    adminGetAvailabilities: vi.fn(),
    adminGetBlocks: vi.fn(),
    adminCreateBlock: vi.fn(),
    adminUpdateBlock: vi.fn(),
    adminDeleteBlock: vi.fn(),
  },
}));

const block = {
  id: 9,
  professional_id: 1,
  starts_at: "2026-10-05 12:00:00",
  ends_at: "2026-10-05 14:00:00",
  reason: "Folga",
};

async function openAvailabilities(user) {
  await user.click(
    await screen.findByRole("button", { name: "Disponibilidades" }),
  );
  await user.selectOptions(screen.getByRole("combobox"), "1");
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getServices.mockResolvedValue([]);
  api.getProfessionals.mockResolvedValue([{ id: 1, name: "Ana" }]);
  api.adminGetAvailabilities.mockResolvedValue([]);
  api.adminGetBlocks.mockResolvedValue([]);
});

function renderAdmin() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>,
  );
}

describe("blocks_tab_shows_interval_and_reason", () => {
  it("blocks_tab_shows_interval_and_reason", async () => {
    api.adminGetBlocks.mockResolvedValue([block]);
    const user = userEvent.setup();
    renderAdmin();
    await openAvailabilities(user);
    expect(await screen.findByText("2026-10-05 12:00:00")).toBeInTheDocument();
    expect(screen.getByText("2026-10-05 14:00:00")).toBeInTheDocument();
    expect(screen.getByText("Folga")).toBeInTheDocument();
    expect(api.adminGetBlocks).toHaveBeenCalledWith(1);
  });
});

describe("blocks_tab_shows_empty", () => {
  it("blocks_tab_shows_empty", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await openAvailabilities(user);
    expect(
      await screen.findByText("Nenhum bloqueio cadastrado."),
    ).toBeInTheDocument();
  });
});

describe("blocks_tab_shows_loading", () => {
  it("blocks_tab_shows_loading", async () => {
    api.adminGetBlocks.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderAdmin();
    await openAvailabilities(user);
    expect(
      await screen.findByText("Carregando bloqueios..."),
    ).toBeInTheDocument();
  });
});

describe("blocks_tab_shows_load_error", () => {
  it("blocks_tab_shows_load_error", async () => {
    api.adminGetBlocks.mockRejectedValue({ message: "falhou" });
    const user = userEvent.setup();
    renderAdmin();
    await openAvailabilities(user);
    expect(
      await screen.findByText("Não foi possível carregar os bloqueios."),
    ).toBeInTheDocument();
  });
});

describe("blocks_form_posts_starts_ends_reason", () => {
  it("blocks_form_posts_starts_ends_reason", async () => {
    api.adminCreateBlock.mockResolvedValue(block);
    const user = userEvent.setup();
    renderAdmin();
    await openAvailabilities(user);
    await user.click(
      await screen.findByRole("button", { name: "+ Novo bloqueio" }),
    );
    await user.clear(screen.getByLabelText("Motivo"));
    await user.type(screen.getByLabelText("Motivo"), "Folga");
    await user.click(screen.getByRole("button", { name: "Salvar bloqueio" }));
    expect(api.adminCreateBlock).toHaveBeenCalledWith(1, {
      starts_at: "2026-10-05 12:00:00",
      ends_at: "2026-10-05 14:00:00",
      reason: "Folga",
    });
  });
});

describe("blocks_form_puts_starts_ends_reason", () => {
  it("blocks_form_puts_starts_ends_reason", async () => {
    api.adminGetBlocks.mockResolvedValue([block]);
    api.adminUpdateBlock.mockResolvedValue({
      ...block,
      reason: "Consulta médica",
    });
    const user = userEvent.setup();
    renderAdmin();
    await openAvailabilities(user);
    await user.click(
      await screen.findByRole("button", { name: "Editar bloqueio" }),
    );
    await user.clear(screen.getByLabelText("Motivo"));
    await user.type(screen.getByLabelText("Motivo"), "Consulta médica");
    await user.click(screen.getByRole("button", { name: "Salvar bloqueio" }));
    expect(api.adminUpdateBlock).toHaveBeenCalledWith(1, 9, {
      starts_at: "2026-10-05 12:00:00",
      ends_at: "2026-10-05 14:00:00",
      reason: "Consulta médica",
    });
  });
});

describe("blocks_form_stays_open_on_422", () => {
  it("blocks_form_stays_open_on_422", async () => {
    api.adminCreateBlock.mockRejectedValue({
      message: "Intervalo com agendamento ativo.",
    });
    const user = userEvent.setup();
    renderAdmin();
    await openAvailabilities(user);
    await user.click(
      await screen.findByRole("button", { name: "+ Novo bloqueio" }),
    );
    await user.clear(screen.getByLabelText("Motivo"));
    await user.type(screen.getByLabelText("Motivo"), "Folga");
    await user.click(screen.getByRole("button", { name: "Salvar bloqueio" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Intervalo com agendamento ativo.",
    );
    expect(
      screen.getByRole("heading", { name: "Novo bloqueio" }),
    ).toBeInTheDocument();
  });
});

describe("blocks_confirm_delete_calls_delete", () => {
  it("blocks_confirm_delete_calls_delete", async () => {
    api.adminGetBlocks.mockResolvedValue([block]);
    api.adminDeleteBlock.mockResolvedValue(true);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderAdmin();
    await openAvailabilities(user);
    await user.click(
      await screen.findByRole("button", { name: "Excluir bloqueio" }),
    );
    expect(api.adminDeleteBlock).toHaveBeenCalledWith(1, 9);
  });
});
