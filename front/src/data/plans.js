// src/data/plans.js
export const PLANS = [
    {
        id: "bronze",
        name: "Plano Bronze",
        price: 149,
        perks: [
            "1 massagem de 60 minutos por mês",
            "5% de desconto em serviços extras",
            "Reagendamento sem taxa até 4h antes",
        ],
    },
    {
        id: "prata",
        name: "Plano Prata",
        price: 279,
        highlight: true,
        perks: [
            "2 massagens de 60 minutos por mês",
            "10% de desconto em qualquer serviço",
            "Prioridade em horários de sexta e sábado",
        ],
    },
    {
        id: "ouro",
        name: "Plano Ouro",
        price: 499,
        perks: [
            "4 sessões mensais combinando massagens e estética",
            "15% de desconto para acompanhantes",
            "Atendimento em domicílio em datas selecionadas",
        ],
    },
];
