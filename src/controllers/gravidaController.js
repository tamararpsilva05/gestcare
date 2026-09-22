const Gravida = require('../models/gravidaModel');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const { create } = require('xmlbuilder2');
const libxmljs = require('libxmljs2');
const fs = require('fs');
const path = require('path');

const gerarSenhaTemporaria = (tamanho = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let senha = '';
    for (let i = 0; i < tamanho; i++) {
        senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return senha;
};


exports.registarGravida = async (req, res) => {
    try {
        const senhaTemporaria = gerarSenhaTemporaria();

        
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(senhaTemporaria, salt);

       
        const novaGravida = new Gravida({
            ...req.body,
            password: passwordEncriptada,
            mustChangePassword: true
        });

        await novaGravida.save(); 
        res.status(201).json({ mensagem: "Grávida registada com sucesso!", dados: novaGravida, senhaTemporaria });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao registar", erro: error.message });
    }
};


exports.listarTodas = async (req, res) => {
    try {
        
        const gravidas = await Gravida.find().populate('idObstetra', 'nome numeroOrdem'); 
        res.status(200).json(gravidas);
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao procurar grávidas", erro: error.message });
    }
}


exports.obterGravidaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const gravida = await Gravida.findById(id).populate('idObstetra', 'nome numeroOrdem');

        if (!gravida) {
            return res.status(404).json({ mensagem: "Grávida não encontrada" });
        }

        res.status(200).json({ dados: gravida });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao procurar grávida", erro: error.message });
    }
}

exports.editarGravida = async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizar = { ...req.body };

        if (dadosAtualizar.password) {
            const salt = await bcrypt.genSalt(10);
            dadosAtualizar.password = await bcrypt.hash(dadosAtualizar.password, salt);
            dadosAtualizar.mustChangePassword = false;
        }

        const gravidaAtualizada = await Gravida.findByIdAndUpdate(id, dadosAtualizar, { new: true });

        if (!gravidaAtualizada) {
            return res.status(404).json({ mensagem: "Grávida não encontrada" });
        }

        res.status(200).json({ mensagem: "Dados atualizados com sucesso!", dados: gravidaAtualizada });
    } catch (error) {
        res.status(400).json({ mensagem: "Erro ao atualizar dados", erro: error.message });
    }
};

exports.eliminarGravida = async (req, res) => {
    try {
        const { id } = req.params;

        const gravidaEliminada = await Gravida.findByIdAndDelete(id);

        if (!gravidaEliminada) {
            return res.status(404).json({ message: "Grávida não encontrada" });
        }

        res.status(200).json({ mensagem: "Grávida eliminada do sistema com sucesso!" });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao eliminar grávida", erro: error.message });
    }
};

exports.loginGravida = async (req, res) => {
    try {
        const { email, password } = req.body;

        const gravida = await Gravida.findOne({ email });
        if (!gravida) {
            return res.status(404).json({ mensagem: "Email não encontrado no sistema." });
        }

        
        const passwordCorreta = await bcrypt.compare(password, gravida.password);
        
        if (!passwordCorreta) {
            return res.status(401).json({ mensagem: "Password incorreta!" });
        }

      
        const token = jwt.sign(
            { id: gravida._id, tipoUtilizador: "Gravida" },
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }    
        );

        res.status(200).json({
            mensagem: `Bem-vinda, ${gravida.nome}!`,
            tipoUtilizador: "Gravida",
            token: token, 
          mustChangePassword: gravida.mustChangePassword || false,
          estado: gravida.estado !== undefined ? gravida.estado : 1,
          dados: { id: gravida._id, nome: gravida.nome, email: gravida.email }
        });

    } catch (erro) {
    console.log('ERRO IMPORTAR XML:', erro.message);
    console.log('STACK:', erro.stack);
    res.status(500).json({ mensagem: 'Erro ao importar XML', erro: erro.message });
}
};


exports.listarPorObstetra = async (req, res) => {
  try {
    
    const gravidas = await Gravida.find({ idObstetra: req.params.idObstetra, estado: 1 });
    res.json(gravidas);
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao listar grávidas', erro });
  }
};


exports.exportarXML = async (req, res) => {
  try {
    const { idObstetra } = req.params;
    const gravidas = await Gravida.find({ idObstetra });

    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('gravidasExport', {
        exportedAt: new Date().toISOString(),
        totalGravidas: gravidas.length,
        idObstetra: idObstetra
      });

    for (const g of gravidas) {
      const gravidaEl = root.ele('gravida', { id: g._id.toString() });
      gravidaEl.ele('nome').txt(g.nome || '');
      gravidaEl.ele('email').txt(g.email || '');
      gravidaEl.ele('idade').txt(String(g.idade || 0));
      gravidaEl.ele('semanasGestacao').txt(String(g.semanasGestacao || 0));
      gravidaEl.ele('grupoSanguineo').txt(g.grupoSanguineo || '');
      gravidaEl.ele('dataInicioGravidez').txt(g.dataInicioGravidez ? g.dataInicioGravidez.toISOString().split('T')[0] : '');
      gravidaEl.ele('alergias').txt(g.alergias || '');
      gravidaEl.ele('morada').txt(g.morada || '');
    }

    const xml = root.end({ prettyPrint: true });

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="gravidas.xml"');
    res.send(xml);

  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao exportar XML', erro: erro.message });
  }
};


exports.importarXML = async (req, res) => {
  try {
    const xmlTexto = req.body.xmlContent;
    const idObstetra = req.body.idObstetra;

    if (!xmlTexto) {
      return res.status(400).json({ mensagem: 'Nenhum conteúdo XML recebido.' });
    }

  
    const xmlDoc = libxmljs.parseXml(xmlTexto);
    const root = xmlDoc.root();

    
    const erros = [];

    if (root.name() !== 'gravidasExport') {
      erros.push('Elemento raiz deve ser <gravidasExport>');
    }

    if (!root.attr('exportedAt')) erros.push('Atributo exportedAt em falta');
    if (!root.attr('totalGravidas')) erros.push('Atributo totalGravidas em falta');
    if (!root.attr('idObstetra')) erros.push('Atributo idObstetra em falta');

    const gravidas = root.childNodes().filter(n => n.name() === 'gravida');

    for (let i = 0; i < gravidas.length; i++) {
      const g = gravidas[i];
      const num = i + 1;

      const getId = (tag) => {
        const node = g.get(tag);
        return node ? node.text().trim() : null;
      };

      const nome = getId('nome');
      const email = getId('email');
      const idade = parseInt(getId('idade'));
      const semanas = parseInt(getId('semanasGestacao'));
      const grupo = getId('grupoSanguineo');

      if (!nome) erros.push(`Grávida ${num}: nome em falta`);
      if (!email) erros.push(`Grávida ${num}: email em falta`);
      if (isNaN(idade) || idade < 16 || idade > 55) erros.push(`Grávida ${num}: idade inválida (deve ser entre 16 e 55)`);
      if (isNaN(semanas) || semanas < 0 || semanas > 42) erros.push(`Grávida ${num}: semanas de gestação inválidas (deve ser entre 0 e 42)`);

      const gruposValidos = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (grupo !== null && !gruposValidos.includes(grupo)) {
        erros.push(`Grávida ${num}: grupo sanguíneo inválido (${grupo})`);
      }
    }

    if (erros.length > 0) {
      return res.status(422).json({ mensagem: 'XML inválido', erros });
    }

   
    let criadas = 0;
    let atualizadas = 0;

    for (const g of gravidas) {
      const getId = (tag) => {
        const node = g.get(tag);
        return node ? node.text().trim() : '';
      };

      const email = getId('email');
      const dados = {
        nome: getId('nome'),
        email,
        idade: parseInt(getId('idade')),
        semanasGestacao: parseInt(getId('semanasGestacao')),
        grupoSanguineo: getId('grupoSanguineo'),
        alergias: getId('alergias'),
        morada: getId('morada'),
        idObstetra,
        dataInicioGravidez: getId('dataInicioGravidez') || new Date().toISOString()
      };

      const existente = await Gravida.findOne({ email });
      if (existente) {
        await Gravida.findByIdAndUpdate(existente._id, dados);
        atualizadas++;
      } else {
       
        const senhaTemporaria = gerarSenhaTemporaria();
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(senhaTemporaria, salt);
        const estadoCriacao = parseInt(getId('estado')) || 1;
        await new Gravida({ ...dados, password: passwordEncriptada, mustChangePassword: true, estado: estadoCriacao }).save();
        criadas++;
      }
    }

    res.status(200).json({
      mensagem: `Importação concluída. ${criadas} criada(s), ${atualizadas} atualizada(s).`,
      criadas,
      atualizadas
    });

  } catch (erro) {
    console.log('ERRO:', erro.message);
    res.status(500).json({ mensagem: 'Erro ao importar XML', erro: erro.message });
  }
};

