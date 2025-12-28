// src/data/services.js
export const SERVICE_CATEGORIES = [
    { id: "massagens", label: "Massagens" },
    { id: "estetica_facial", label: "Estética facial" },
    { id: "estetica_corporal", label: "Estética corporal" },
];

export const SERVICES = [
    {
        id: "massagem_relaxante",
        categoryId: "massagens",
        name: "Massagem relaxante",
        description:
            "Alivia estresse, reduz tensão muscular e melhora a qualidade do sono em uma única sessão.",
        durationMinutes: 60,
        price: 160,
        tag: "Relaxamento",
    },
    {
        id: "limpeza_pele_profunda",
        categoryId: "estetica_facial",
        name: "Limpeza de pele profunda",
        description:
            "Protocolo completo com esfoliação, extração suave e máscara calmante.",
        durationMinutes: 75,
        price: 190,
        tag: "Estética",
    },
    {
        id: "combo_spa_day",
        categoryId: "massagens",
        name: "Combo Spa Day",
        description:
            "Massagem relaxante + máscara facial hidratante + escalda-pés aromático.",
        durationMinutes: 120,
        price: 320,
        tag: "Bem-estar",
    },
];

export const getServicePrice = (serviceName) => {
    const svc = SERVICES.find((s) => s.name === serviceName);
    return svc?.price ?? 160;
};
