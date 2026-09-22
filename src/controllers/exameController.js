const Exame = require('../models/exameModel');


exports.criarExame = async (req, res) => {
    try {
        const novoExame = new Exame(req.body);
        const exameGuardado = await novoExame.save();
        res.status(201).json({ mensagem: "Exame registado com sucesso!", dados: exameGuardado });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao registar exame", erro: error.message });
    }
};


exports.listarTodos = async (req, res) => {
    try {
        const exames = await Exame.find()
            .populate('idGravida', 'nome email semanasGestacao')
            .populate('idProfissional', 'nomeProfissional tipoProfissional');
        res.status(200).json(exames);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao procurar exames", erro: error.message });
    }
};


exports.editarExame = async (req, res) => {
    try {
        const { id } = req.params;
        const exameAtualizado = await Exame.findByIdAndUpdate(id, req.body, { new: true });
        if (!exameAtualizado) {
            return res.status(404).json({ mensagem: "Exame não encontrado" });
        }
        res.status(200).json({ mensagem: "Exame atualizado com sucesso!", dados: exameAtualizado });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao atualizar exame", erro: error.message });
    }
};


exports.eliminarExame = async (req, res) => {
    try {
        const { id } = req.params;
        const exameEliminado = await Exame.findByIdAndDelete(id);
        if (!exameEliminado) {
            return res.status(404).json({ mensagem: "Exame não encontrado" });
        }
        res.status(200).json({ mensagem: "Exame eliminado do sistema com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao eliminar exame", erro: error.message });
    }
};

exports.listarExamesPorGravida = async (req, res) => {
    try {
        const { id } = req.params;
        const exames = await Exame.find({ idGravida: id })
            .populate('idProfissional', 'nomeProfissional tipoProfissional');
        res.status(200).json(exames);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao buscar exames" });
    }
};


exports.desmarcarExame = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        if (!motivo || !motivo.trim()) {
            return res.status(400).json({ mensagem: "Por favor, fornece um motivo para a desmarcação." });
        }

        const exameAtualizado = await Exame.findByIdAndUpdate(
            id,
            { motivoDesmarcacao: motivo, estado: 2 }, 
            { new: true }
        );

        if (!exameAtualizado) {
            return res.status(404).json({ mensagem: "Exame não encontrado" });
        }

        res.status(200).json({ 
            mensagem: "Exame desmarcado com sucesso!", 
            dados: exameAtualizado 
        });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao desmarcar exame", erro: error.message });
    }
};