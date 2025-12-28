// src/data/professionals.js
export const PROFESSIONALS = [
    {
        id: "ana",
        name: "Ana Paula",
        specialties: ["Massagem relaxante", "Drenagem linfática"],
        rating: 4.9,
        totalReviews: 124,
        nextSlots: {
            Manhã: ["09:00", "10:30"],
            Tarde: ["14:00", "16:00"],
            Noite: [],
        },
    },
    {
        id: "bruno",
        name: "Bruno Oliveira",
        specialties: ["Massagem desportiva", "Massagem relaxante"],
        rating: 4.8,
        totalReviews: 98,
        nextSlots: {
            Manhã: [],
            Tarde: ["13:30", "15:00", "17:30"],
            Noite: ["19:00"],
        },
    },
    {
        id: "carla",
        name: "Carla Mendes",
        specialties: ["Limpeza de pele profunda", "Tratamentos faciais"],
        rating: 5.0,
        totalReviews: 210,
        nextSlots: {
            Manhã: ["08:30", "10:00"],
            Tarde: ["14:30"],
            Noite: ["18:30", "20:00"],
        },
    },
];
