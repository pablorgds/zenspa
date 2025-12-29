// src/data/bookings.js
export const BOOKINGS = [
    {
        id: "bk_001",
        status: "confirmed", // confirmed | completed | cancelled
        service: "Massagem relaxante",
        professionalName: "Ana Paula",
        date: "2025-12-28",
        time: "10:30",
        location: "ZenSpa Studio - Centro",
        price: 160,
        createdAt: "2025-12-22",
    },
    {
        id: "bk_002",
        status: "completed",
        service: "Limpeza de pele profunda",
        professionalName: "Carla Mendes",
        date: "2025-12-10",
        time: "18:30",
        location: "ZenSpa Studio - Vila Mariana",
        price: 190,
        createdAt: "2025-12-05",
    },
    {
        id: "bk_003",
        status: "cancelled",
        service: "Drenagem linfática",
        professionalName: "Ana Paula",
        date: "2025-12-14",
        time: "14:00",
        location: "Em domicílio",
        price: 180,
        createdAt: "2025-12-10",
    },
];
