// src/utils/bookingsStorage.js

const STORAGE_KEY = "zenspa_bookings_v1";

const safeParse = (value, fallback) => {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

export const loadBookings = (fallback = []) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = safeParse(raw, fallback);
    return Array.isArray(parsed) ? parsed : fallback;
};

export const saveBookings = (bookings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

export const addBooking = (booking) => {
    const current = loadBookings([]);
    const next = [booking, ...current];
    saveBookings(next);
    return next;
};

export const updateBookingStatus = (bookingId, status) => {
    const current = loadBookings([]);
    const next = current.map((b) => (b.id === bookingId ? { ...b, status } : b));
    saveBookings(next);
    return next;
};
