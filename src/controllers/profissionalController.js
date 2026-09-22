const Profissional = require('../models/profissionalModel');


exports.listarTodos = async (req, res) => {
    try {
        const profissionais = await Profissional.find(); 
        res.status(200).json(profissionais);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao procurar profissionais", erro: error.message });
    }
};


exports.registarProfissional = async (req, res) => {
    try {
        const novoProfissional = new Profissional(req.body); 
        await novoProfissional.save(); 
        res.status(201).json({ mensagem: "Profissional registado com sucesso!", dados: novoProfissional });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao registar profissional", erro: error.message });
    }
};


exports.editarProfissional = async (req, res) => {
    try {
        const { id } = req.params; 
        const dadosAtualizados = req.body; 

      
        const profissionalAtualizado = await Profissional.findByIdAndUpdate(id, dadosAtualizados, { new: true });

        if (!profissionalAtualizado) {
            return res.status(404).json({ mensagem: "Profissional não encontrado" });
        }

        res.status(200).json({ mensagem: "Profissional atualizado com sucesso!", dados: profissionalAtualizado });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao atualizar profissional", erro: error.message });
    }
};


exports.eliminarProfissional = async (req, res) => {
    try {
        const { id } = req.params; 

        const profissionalEliminado = await Profissional.findByIdAndDelete(id);

        if (!profissionalEliminado) {
            return res.status(404).json({ mensagem: "Profissional não encontrado" });
        }

        res.status(200).json({ mensagem: "Profissional eliminado do sistema com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao eliminar profissional", erro: error.message });
    }
};