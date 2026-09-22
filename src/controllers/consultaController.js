const Consulta = require('../models/consultaModel');
const Exame = require('../models/exameModel'); 


exports.criarConsulta = async (req, res) => {
    try {
        const { idGravida, idObstetra, dataConsulta, horarioConsulta } = req.body;
        const data = new Date(dataConsulta);
        const agora = new Date();

       
        const hojeZero = new Date(agora);
        hojeZero.setHours(0, 0, 0, 0);
        const dataZero = new Date(data);
        dataZero.setHours(0, 0, 0, 0);

        if (dataZero < hojeZero) {
            return res.status(400).json({ mensagem: "Não é possível marcar uma consulta para uma data que já passou!" });
        }

       
        if (dataZero.getTime() === hojeZero.getTime()) {
            const horaAtual = agora.getHours();
            const minutoAtual = agora.getMinutes();

            if (horaAtual > 18 || (horaAtual === 18 && minutoAtual >= 30)) {
                return res.status(400).json({ mensagem: "Não é possível marcar uma consulta para hoje. A hora limite para agendamentos é 18:30." });
            }
        }

        
        const inicioDoDia = new Date(dataZero);
        const fimDoDia = new Date(inicioDoDia);
        fimDoDia.setDate(fimDoDia.getDate() + 1);

       
        const exameExistente = await Exame.findOne({
            idGravida: idGravida,
            dataExame: { $gte: inicioDoDia, $lt: fimDoDia },
            horarioExame: horarioConsulta
        });
        if (exameExistente) return res.status(400).json({ mensagem: "Já tens um Exame marcado para esta hora!" });

        
        const consultaGravidaExistente = await Consulta.findOne({
            idGravida: idGravida,
            dataConsulta: { $gte: inicioDoDia, $lt: fimDoDia },
            horarioConsulta: horarioConsulta
        });
        if (consultaGravidaExistente) return res.status(400).json({ mensagem: "Já tens outra Consulta marcada para esta hora!" });

       
        const consultaObstetraExistente = await Consulta.findOne({
            idObstetra: idObstetra,
            dataConsulta: { $gte: inicioDoDia, $lt: fimDoDia },
            horarioConsulta: horarioConsulta
        });
        if (consultaObstetraExistente) return res.status(400).json({ mensagem: "O Obstetra já tem uma consulta agendada para este horário." });
        

        const novaConsulta = new Consulta(req.body);
        await novaConsulta.save();
        res.status(201).json({ mensagem: "Consulta agendada com sucesso!", dados: novaConsulta });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao agendar consulta", erro: error.message });
    }
};

exports.listarTodas = async (req, res) => {
    try {
        const { idObstetra, dataConsulta } = req.query;
        const query = {};

        if (idObstetra) {
            query.idObstetra = idObstetra;
        }

        if (dataConsulta) {
            const data = new Date(dataConsulta);
            if (!isNaN(data.getTime())) {
                const inicioDoDia = new Date(data.setHours(0, 0, 0, 0));
                const fimDoDia = new Date(inicioDoDia);
                fimDoDia.setDate(fimDoDia.getDate() + 1);
                query.dataConsulta = { $gte: inicioDoDia, $lt: fimDoDia };
            }
        }

        const consultas = await Consulta.find(query)
            .populate('idGravida', 'nome email')
            .populate('idObstetra', 'nome numeroOrdem');

        res.status(200).json(consultas);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao procurar consultas", erro: error.message });
    }
};

exports.editarConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const { idGravida, idObstetra, dataConsulta, horarioConsulta } = req.body;

        if (dataConsulta) {
            const data = new Date(dataConsulta);
            const agora = new Date();

            const hojeZero = new Date(agora);
            hojeZero.setHours(0, 0, 0, 0);
            const dataZero = new Date(data);
            dataZero.setHours(0, 0, 0, 0);

            if (dataZero < hojeZero) {
                return res.status(400).json({ mensagem: "Não é possível marcar uma consulta para uma data que já passou!" });
            }

            if (dataZero.getTime() === hojeZero.getTime()) {
                const horaAtual = agora.getHours();
                const minutoAtual = agora.getMinutes();

                if (horaAtual > 18 || (horaAtual === 18 && minutoAtual >= 30)) {
                    return res.status(400).json({ mensagem: "Não é possível marcar uma consulta para hoje. A hora limite para agendamentos é 18:30." });
                }
            }

            
            if (horarioConsulta) {
                const inicioDoDia = new Date(dataZero);
                const fimDoDia = new Date(inicioDoDia);
                fimDoDia.setDate(fimDoDia.getDate() + 1);

               
                const exameExistente = await Exame.findOne({
                    idGravida: idGravida,
                    dataExame: { $gte: inicioDoDia, $lt: fimDoDia },
                    horarioExame: horarioConsulta
                });
                if (exameExistente) return res.status(400).json({ mensagem: "Já tens um Exame marcado para esta hora!" });

                
                const consultaGravidaExistente = await Consulta.findOne({
                    _id: { $ne: id }, 
                    idGravida: idGravida,
                    dataConsulta: { $gte: inicioDoDia, $lt: fimDoDia },
                    horarioConsulta: horarioConsulta
                });
                if (consultaGravidaExistente) return res.status(400).json({ mensagem: "Já tens outra Consulta marcada para esta hora!" });

                
                const consultaObstetraExistente = await Consulta.findOne({
                    _id: { $ne: id }, 
                    idObstetra: idObstetra,
                    dataConsulta: { $gte: inicioDoDia, $lt: fimDoDia },
                    horarioConsulta: horarioConsulta
                });
                if (consultaObstetraExistente) return res.status(400).json({ mensagem: "O Obstetra já tem uma consulta agendada para este horário." });
            }
            
        }

        const consultaAtualizada = await Consulta.findByIdAndUpdate(id, req.body, { new: true });

        if (!consultaAtualizada) {
            return res.status(404).json({ mensagem: "Consulta não encontrada" });
        }

        res.status(200).json({ mensagem: "Consulta atualizada com sucesso!", dados: consultaAtualizada });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao atualizar consulta", erro: error.message });
    }
};

exports.obterProximaConsulta = async (req, res) => {
    try {
        const { idGravida } = req.params;
        const agora = new Date();
        agora.setHours(0, 0, 0, 0);

        
        const proximaConsulta = await Consulta.findOne({
            idGravida: idGravida,
            dataConsulta: { $gte: agora }
        })
        .sort({ dataConsulta: 1 }) 
        .populate('idObstetra', 'nome'); 

        if (!proximaConsulta) {
            return res.status(200).json({ mensagem: "Nenhuma consulta agendada", dados: null });
        }

        res.status(200).json({ dados: proximaConsulta });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao procurar próxima consulta", erro: error.message });
    }
};



exports.listarConsultasPorGravida = async (req, res) => {
    try {
        const { id } = req.params;
        
       
        const consultas = await Consulta.find({ idGravida: id })
            .populate('idObstetra', 'nome'); 

        res.status(200).json(consultas);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao buscar consultas" });
    }
};


exports.verificarDisponibilidade = async (req, res) => {
    try {
        const { idGravida, dataConsulta, horarioConsulta } = req.query;

        const data = new Date(dataConsulta);
        const inicioDoDia = new Date(data.setHours(0, 0, 0, 0));
        const fimDoDia = new Date(inicioDoDia);
        fimDoDia.setDate(fimDoDia.getDate() + 1);

        
        const consultaExistente = await Consulta.findOne({
            idGravida,
            dataConsulta: { $gte: inicioDoDia, $lt: fimDoDia },
            horarioConsulta
        });

        
        const Exame = require('../models/exameModel');
        const exameExistente = await Exame.findOne({
            idGravida,
            dataExame: { $gte: inicioDoDia, $lt: fimDoDia },
            horarioExame: horarioConsulta
        });

        res.status(200).json({
            disponivel: !consultaExistente && !exameExistente,
            conflito: consultaExistente ? 'consulta' : exameExistente ? 'exame' : null
        });

    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao verificar disponibilidade', erro: error.message });
    }
};

exports.eliminarConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const consultaEliminada = await Consulta.findByIdAndDelete(id);

        if (!consultaEliminada) {
            return res.status(404).json({ mensagem: "Consulta não encontrada" });
        }

        res.status(200).json({ mensagem: "Consulta eliminada com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao eliminar consulta", erro: error.message });
    }
};

exports.desmarcarConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        if (!motivo || !motivo.trim()) {
            return res.status(400).json({ mensagem: "Por favor, fornece um motivo para a desmarcação." });
        }

        const consultaAtualizada = await Consulta.findByIdAndUpdate(
            id,
            { motivoDesmarcacao: motivo, estado: 2 }, // estado 2 = desmarcada
            { new: true }
        );

        if (!consultaAtualizada) {
            return res.status(404).json({ mensagem: "Consulta não encontrada" });
        }

        res.status(200).json({ 
            mensagem: "Consulta desmarcada com sucesso!", 
            dados: consultaAtualizada 
        });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao desmarcar consulta", erro: error.message });
    }
};
