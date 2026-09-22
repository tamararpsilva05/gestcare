
const Admin = require('../models/adminModel');
const Obstetra = require('../models/obstetraModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Gravida = require('../models/gravidaModel');

const gerarSenhaTemporaria = (tamanho = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let senha = '';
    for (let i = 0; i < tamanho; i++) {
        senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return senha;
};


exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ mensagem: 'Email não encontrado.' });
        }

        const passwordCorreta = await bcrypt.compare(password, admin.password);
        if (!passwordCorreta) {
            return res.status(401).json({ mensagem: 'Password incorreta.' });
        }

        const token = jwt.sign(
            { id: admin._id, tipoUtilizador: 'Admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            mensagem: `Bem-vindo, ${admin.nome}!`,
            tipoUtilizador: 'Admin',
            token,
            dados: { id: admin._id, nome: admin.nome, email: admin.email }
        });

    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao fazer login', erro: error.message });
    }
};

exports.registarAdmin = async (req, res) => {
    try {
        const { password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        const novoAdmin = new Admin({
            ...req.body,
            password: passwordEncriptada
        });

        await novoAdmin.save();
        res.status(201).json({ mensagem: 'Administrador criado com sucesso!', dados: novoAdmin });
    } catch (error) {
        res.status(400).json({ mensagem: 'Erro ao criar administrador', erro: error.message });
    }
};

exports.criarMedico = async (req, res) => {
    try {
        
        const emailExiste = await Obstetra.findOne({ email: req.body.email });
        if (emailExiste) {
            return res.status(400).json({ mensagem: 'Já existe um médico com este email.' });
        }

       
        const ordemExiste = await Obstetra.findOne({ numeroOrdem: req.body.numeroOrdem });
        if (ordemExiste) {
            return res.status(400).json({ mensagem: 'Já existe um médico com este número de ordem.' });
        }

        const senhaTemporaria = gerarSenhaTemporaria();
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(senhaTemporaria, salt);

        const novoMedico = new Obstetra({
            ...req.body,
            password: passwordEncriptada,
            mustChangePassword: true
        });

        await novoMedico.save();
        res.status(201).json({ mensagem: 'Médico criado com sucesso!', dados: novoMedico, senhaTemporaria });
    } catch (error) {
        res.status(400).json({ mensagem: 'Erro ao criar médico', erro: error.message });
    }
};

exports.listarMedicos = async (req, res) => {
    try {
        const medicos = await Obstetra.find().select('-password');
        res.status(200).json(medicos);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao listar médicos', erro: error.message });
    }
};

exports.eliminarMedico = async (req, res) => {
    try {
        const { id } = req.params;
        const medicoEliminado = await Obstetra.findByIdAndDelete(id);

        if (!medicoEliminado) {
            return res.status(404).json({ mensagem: 'Médico não encontrado' });
        }

        res.status(200).json({ mensagem: 'Médico eliminado com sucesso!' });
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao eliminar médico', erro: error.message });
    }
};


exports.listarGravidas = async (req, res) => {
    try {
        const gravidas = await Gravida.find().select('-password').populate('idObstetra', 'nome');
        res.status(200).json(gravidas);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao listar grávidas', erro: error.message });
    }
};

exports.eliminarGravida = async (req, res) => {
    try {
        const { id } = req.params;
        const gravidaEliminada = await Gravida.findByIdAndDelete(id);

        if (!gravidaEliminada) {
            return res.status(404).json({ mensagem: 'Grávida não encontrada' });
        }

        res.status(200).json({ mensagem: 'Grávida eliminada com sucesso!' });
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao eliminar grávida', erro: error.message });
    }
};

exports.alterarEstadoGravida = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body; 

        if (estado !== 0 && estado !== 1 && estado !== '0' && estado !== '1') {
            return res.status(400).json({ mensagem: 'Estado inválido. Use 0 (desativada) ou 1 (ativa).' });
        }

        const novaGravida = await Gravida.findByIdAndUpdate(id, { estado: Number(estado) }, { new: true }).select('-password').populate('idObstetra', 'nome');

        if (!novaGravida) {
            return res.status(404).json({ mensagem: 'Grávida não encontrada' });
        }

        res.status(200).json({ mensagem: 'Estado atualizado com sucesso', dados: novaGravida });
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao alterar estado', erro: error.message });
    }
};