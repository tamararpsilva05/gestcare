const Notificacao = require('../models/notificacaoModel');


exports.criarNotificacao = async (req, res) => {
    try {
        const novaNotificacao = new Notificacao(req.body);
        await novaNotificacao.save();
        res.status(201).json({ mensagem: "Notificação gerada com sucesso!", dados: novaNotificacao });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao gerar notificação", erro: error.message });
    }
};


exports.listarTodas = async (req, res) => {
    try {
        const notificacoes = await Notificacao.find()
            .populate('idGravida', 'nome email')
            .populate('idConsulta', 'dataConsulta horarioConsulta') 
            .populate('idExame', 'tipoExame dataExame') 
            .populate('idQuestionario', 'dataQuestionario'); 

        res.status(200).json(notificacoes);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao procurar notificações", erro: error.message });
    }
};


exports.editarNotificacao = async (req, res) => {
    try {
        const { id } = req.params;
        const notificacaoAtualizada = await Notificacao.findByIdAndUpdate(id, req.body, { new: true });

        if (!notificacaoAtualizada) {
            return res.status(404).json({ mensagem: "Notificação não encontrada" });
        }

        res.status(200).json({ mensagem: "Notificação atualizada com sucesso!", dados: notificacaoAtualizada });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao atualizar notificação", erro: error.message });
    }
};


exports.eliminarNotificacao = async (req, res) => {
    try {
        const { id } = req.params;
        const notificacaoEliminada = await Notificacao.findByIdAndDelete(id);

        if (!notificacaoEliminada) {
            return res.status(404).json({ mensagem: "Notificação não encontrada" });
        }

        res.status(200).json({ mensagem: "Notificação eliminada com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao eliminar notificação", erro: error.message });
    }
};

exports.listarPorGravida = async (req, res) => {
    try {
        const notificacoes = await Notificacao.find({ idGravida: req.params.id })
            .populate('idConsulta', 'dataConsulta horarioConsulta')
            .populate('idExame', 'tipoExame dataExame')
            .sort({ dataEnvio: -1 });
        res.status(200).json(notificacoes);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao procurar notificações", erro: error.message });
    }
};


exports.listarPorObstetra = async (req, res) => {
    try {
        const notificacoes = await Notificacao.find({ idObstetra: req.params.id })
            .populate('idGravida', 'nome email')
            .populate('idConsulta', 'dataConsulta horarioConsulta')
            .sort({ dataEnvio: -1 });
        res.status(200).json(notificacoes);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao procurar notificações", erro: error.message });
    }
};