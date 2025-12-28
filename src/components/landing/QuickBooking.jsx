import React from "react";
import "../../styles/quick-booking.css";

/**
 * onSubmit(data)
 * data = { categoria, servico, data, periodo }
 */
const QuickBooking = ({ onSubmit }) => {
    const today = new Date().toISOString().split("T")[0];
    const handleSubmit = (e) => {
        e.preventDefault();

        const form = e.target;

        const data = {
            categoria: form.tipoServico.value,
            servico: form.servico.value,
            data: form.data.value,
            periodo: form.periodo.value,
        };

        if (onSubmit) {
            onSubmit(data);
        }
    };

    return (
        <aside className="hero-card" aria-label="Agendamento rápido">
            <div className="hero-card-header">
                <div>
                    <div className="hero-card-title">Agendamento rápido</div>
                    <div className="hero-card-sub">
                        Escolha o básico e veja horários disponíveis.
                    </div>
                </div>
                <span className="hero-card-badge">Em menos de 60s</span>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-field">
                        <label htmlFor="tipoServico">Categoria</label>
                        <select id="tipoServico" name="tipoServico" defaultValue="" required>
                            <option value="" disabled>
                                Selecione...
                            </option>
                            <option>Massagem</option>
                            <option>Estética facial</option>
                            <option>Estética corporal</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="servico">Serviço</label>
                        <select id="servico" name="servico" defaultValue="" required>
                            <option value="" disabled>
                                Escolha um serviço
                            </option>
                            <option>Massagem relaxante</option>
                            <option>Drenagem linfática</option>
                            <option>Limpeza de pele</option>
                            <option>Pacote combo spa</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="data">Data</label>
                        <input id="data" name="data" type="date" required min={today} />
                    </div>

                    <div className="form-field">
                        <label htmlFor="periodo">Período</label>
                        <select id="periodo" name="periodo" defaultValue="" required>
                            <option value="" disabled>
                                Qualquer horário
                            </option>
                            <option>Manhã</option>
                            <option>Tarde</option>
                            <option>Noite</option>
                        </select>
                    </div>
                </div>

                <div className="hero-card-footer">
                    <small>
                        Você poderá escolher o profissional e o local de atendimento na
                        próxima etapa.
                    </small>
                    <button type="submit" className="btn btn-primary">
                        Ver horários
                    </button>
                </div>
            </form>
        </aside>
    );
};

export default QuickBooking;
