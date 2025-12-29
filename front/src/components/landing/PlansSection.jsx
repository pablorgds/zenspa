import React from "react";
import { PLANS } from "../../data/plans";
import { useNavigate } from "react-router-dom";

const PlansSection = () => {
    const navigate = useNavigate();

    return (
        <section id="planos" className="section">
            <div className="container">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">Planos de bem-estar</h2>
                        <p className="section-subtitle">
                            Para quem quer transformar autocuidado em hábito. Assine um plano
                            e garanta seus horários do mês.
                        </p>
                    </div>
                </div>

                <div className="plans-grid">
                    {PLANS.map((plan) => (
                        <article
                            key={plan.id}
                            className={`plan-card ${plan.highlight ? "plan-highlight" : ""}`}
                        >
                            {plan.highlight && (
                                <span className="plan-badge">Mais escolhido</span>
                            )}
                            <h3 className="plan-name">{plan.name}</h3>
                            <div className="plan-price">
                                {plan.price.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                })}{" "}
                                <span>/ mês</span>
                            </div>
                            <ul className="plan-list">
                                {plan.perks.map((perk) => (
                                    <li key={perk}>{perk}</li>
                                ))}
                            </ul>
                            <button
                                className={`btn ${
                                    plan.highlight ? "btn-primary" : "btn-outline"
                                }`}
                                style={plan.highlight ? { width: "100%" } : {}}
                                onClick={() => navigate("/agendar")}
                            >
                                Assinar {plan.name.split(" ")[1]}
                            </button>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PlansSection;
