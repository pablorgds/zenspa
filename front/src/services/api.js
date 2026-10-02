const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  async login(email, password) {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
  },
  async register(name, email, password, password_confirmation) {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name, email, password, password_confirmation }),
    });
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
  },
  async logout() {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: getHeaders(),
    });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  async getServices() {
    const res = await fetch(`${API_URL}/services`, { headers: getHeaders() });
    return res.json();
  },
  async getProfessionals() {
    const res = await fetch(`${API_URL}/professionals`, {
      headers: getHeaders(),
    });
    return res.json();
  },
  async getBookings() {
    const res = await fetch(`${API_URL}/bookings`, { headers: getHeaders() });
    return res.json();
  },
  async getAvailableSlots(professionalId, date) {
    const res = await fetch(
      `${API_URL}/professionals/${professionalId}/slots?date=${date}`,
      {
        headers: getHeaders(),
      },
    );
    return res.json();
  },
  async createBooking(data) {
    const res = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw { status: res.status, ...body };
    return body;
  },
  async getBooking(id) {
    const res = await fetch(`${API_URL}/bookings/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Agendamento não encontrado.");
    return res.json();
  },
  async cancelBooking(id) {
    const res = await fetch(`${API_URL}/bookings/${id}/cancel`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Não foi possível cancelar o agendamento.");
    return res.json();
  },
  // Admin Actions
  async adminCreateService(data) {
    const res = await fetch(`${API_URL}/admin/services`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async adminUpdateService(id, data) {
    const res = await fetch(`${API_URL}/admin/services/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async adminDeleteService(id) {
    const res = await fetch(`${API_URL}/admin/services/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return res.status === 204;
  },
  // Admin Professionals
  async adminCreateProfessional(data) {
    const res = await fetch(`${API_URL}/admin/professionals`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async adminUpdateProfessional(id, data) {
    const res = await fetch(`${API_URL}/admin/professionals/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async adminDeleteProfessional(id) {
    const res = await fetch(`${API_URL}/admin/professionals/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return res.status === 204;
  },
  // Admin Bookings
  async adminGetBookings(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_URL}/admin/bookings?${queryParams}`, {
      headers: getHeaders(),
    });
    return res.json();
  },
  async adminGetAgenda(date, professionalId) {
    const params = new URLSearchParams({ date });
    if (professionalId) params.set("professional_id", professionalId);
    const res = await fetch(`${API_URL}/admin/agenda?${params}`, {
      headers: getHeaders(),
    });
    const body = await res.json();
    if (!res.ok) throw { status: res.status, ...body };
    return body;
  },
  async adminCreateBooking(data) {
    const res = await fetch(`${API_URL}/admin/bookings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw { status: res.status, ...body };
    return body;
  },
  async adminUpdateBooking(id, data) {
    const res = await fetch(`${API_URL}/admin/bookings/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) throw { status: res.status, ...body };
    return body;
  },
  async adminCancelBooking(id) {
    const res = await fetch(`${API_URL}/admin/bookings/${id}/cancel`, {
      method: "POST",
      headers: getHeaders(),
    });
    return res.json();
  },
  async adminDeleteBooking(id) {
    const res = await fetch(`${API_URL}/admin/bookings/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return res.json();
  },
  // Admin Availabilities
  async adminGetAvailabilities(professionalId) {
    const res = await fetch(
      `${API_URL}/admin/professionals/${professionalId}/availabilities`,
      {
        headers: getHeaders(),
      },
    );
    return res.json();
  },
  async adminCreateAvailability(professionalId, data) {
    const res = await fetch(
      `${API_URL}/admin/professionals/${professionalId}/availabilities`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    const body = await res.json();
    if (!res.ok) throw body;
    return body;
  },
  async adminUpdateAvailability(professionalId, availabilityId, data) {
    const res = await fetch(
      `${API_URL}/admin/professionals/${professionalId}/availabilities/${availabilityId}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    const body = await res.json();
    if (!res.ok) throw body;
    return body;
  },
  async adminDeleteAvailability(professionalId, availabilityId) {
    const res = await fetch(
      `${API_URL}/admin/professionals/${professionalId}/availabilities/${availabilityId}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      },
    );
    return res.status === 204;
  },
  async adminGetBlocks(professionalId) {
    const res = await fetch(
      `${API_URL}/admin/professionals/${professionalId}/blocks`,
      {
        headers: getHeaders(),
      },
    );
    const body = await res.json();
    if (!res.ok) throw body;
    return body;
  },
  async adminCreateBlock(professionalId, data) {
    const res = await fetch(
      `${API_URL}/admin/professionals/${professionalId}/blocks`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    const body = await res.json();
    if (!res.ok) throw body;
    return body;
  },
  async adminUpdateBlock(professionalId, blockId, data) {
    const res = await fetch(
      `${API_URL}/admin/professionals/${professionalId}/blocks/${blockId}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    const body = await res.json();
    if (!res.ok) throw body;
    return body;
  },
  async adminDeleteBlock(professionalId, blockId) {
    const res = await fetch(
      `${API_URL}/admin/professionals/${professionalId}/blocks/${blockId}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw body;
    }
    return res.status === 204;
  },
  // Admin Financial
  async adminGetFinancialSummary(period = "daily") {
    const res = await fetch(
      `${API_URL}/admin/financial/summary?period=${period}`,
      {
        headers: getHeaders(),
      },
    );
    return res.json();
  },
  async adminGetTransactions(page = 1) {
    const res = await fetch(
      `${API_URL}/admin/financial/transactions?page=${page}`,
      {
        headers: getHeaders(),
      },
    );
    return res.json();
  },
};
