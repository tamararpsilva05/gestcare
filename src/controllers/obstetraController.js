const Obstetra = require('../models/obstetraModel');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

const gerarSenhaTemporaria = (tamanho = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let senha = '';
    for (let i = 0; i < tamanho; i++) {
        senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return senha;
};


exports.registarObstetra = async (req, res) => {
    try {
        let { password } = req.body;
        const senhaTemporaria = password || gerarSenhaTemporaria();

       
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(senhaTemporaria, salt);

        
        const novoObstetra = new Obstetra({
            ...req.body,
            password: passwordEncriptada,
            mustChangePassword: true
        });

        await novoObstetra.save();
        res.status(201).json({ mensagem: "Obstetra registado com sucesso!", dados: novoObstetra, senhaTemporaria });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao registar obstetra", erro: error.message });
    }
};

exports.listarTodos = async (req, res) => {
    try {
        const obstetras = await Obstetra.find();
        res.status(200).json(obstetras);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao procurar obstetras", erro: error.message });
    }
};

exports.editarObstetra = async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizar = { ...req.body };

        
        if (dadosAtualizar.password) {
            const salt = await bcrypt.genSalt(10);
            dadosAtualizar.password = await bcrypt.hash(dadosAtualizar.password, salt);
            dadosAtualizar.mustChangePassword = false;
        }

        const obstetraAtualizado = await Obstetra.findByIdAndUpdate(id, dadosAtualizar, { new: true });

        if (!obstetraAtualizado) {
            return res.status(404).json({ mensagem: "Obstetra não encontrado" });
        }

        res.status(200).json({ mensagem: "Dados atualizados!", dados: obstetraAtualizado });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao atualizar", erro: error.message });
    }
};


exports.eliminarObstetra = async (req, res) => {
    try {
        const { id } = req.params;
        const obstetraEliminado = await Obstetra.findByIdAndDelete(id);

        if (!obstetraEliminado) {
            return res.status(404).json({ mensagem: "Obstetra não encontrado" });
        }
        res.status(200).json({ mensagem: "Obstetra eliminado do sistema com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao eliminar", erro: error.message });
    }
};

exports.obterObstetraPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const obstetra = await Obstetra.findById(id);

        if (!obstetra) {
            return res.status(404).json({ mensagem: "Obstetra não encontrado" });
        }

        res.status(200).json({ dados: obstetra });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao procurar obstetra", erro: error.message });
    }
};

exports.loginObstetra = async (req, res) => {
    try {
        const { email, password } = req.body;

        const obstetra = await Obstetra.findOne({ email });
        if (!obstetra) {
            return res.status(404).json({ mensagem: "Email do obstetra não encontrado." });
        }

        const passwordCorreta = await bcrypt.compare(password, obstetra.password);
        if (!passwordCorreta) {
            return res.status(401).json({ mensagem: "Password incorreta!" });
        }

       
        const token = jwt.sign(
            { id: obstetra._id, tipoUtilizador: "Profissional" },
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        
        res.status(200).json({
            mensagem: `Bem-vindo(a) ao painel clínico, ${obstetra.nome}!`,
            tipoUtilizador: "Profissional",
            token: token, 
            mustChangePassword: obstetra.mustChangePassword || false,
            dados: {
                id: obstetra._id,
                nome: obstetra.nome,
                email: obstetra.email
            }
        });

    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao tentar fazer login", erro: error.message });
    }
};