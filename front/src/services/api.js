const API_URL = "http://localhost:8000/api";

export const api = {
    async getServices() {
        const res = await fetch(`${API_URL}/services`);
        return res.json();
    },
    async getProfessionals() {
        const res = await fetch(`${API_URL}/professionals`);
        return res.json();
    },
    async getBookings() {
        const res = await fetch(`${API_URL}/bookings`);
        return res.json();
    },
    async createBooking(data) {
        const res = await fetch(`${API_URL}/bookings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return res.json();
    },
};
