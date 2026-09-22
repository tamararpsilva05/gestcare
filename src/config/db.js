// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        
        const url = 'mongodb+srv://admin:admin123@clusterinfme.zt91tab.mongodb.net/InfmeDB?retryWrites=true&w=majority&appName=ClusterInfme';
        
        const conn = await mongoose.connect(url);
        
        console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Erro ao ligar ao MongoDB: ${error.message}`);
        process.exit(1); 
    }
};

module.exports = connectDB;