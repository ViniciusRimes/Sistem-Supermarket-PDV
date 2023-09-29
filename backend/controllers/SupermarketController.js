const Supermarket = require('../models/Supermarket')
const {validationResult} = require('express-validator')
const bcryptjs = require('bcryptjs')
const createToken = require('../helpers/createUserToken')
const verifyToken = require('../helpers/verifyToken')
const getToken = require('../helpers/getToken')
const jwt = require('jsonwebtoken')
require('dotenv').config()
module.exports = class SupermarketController{
    //REGISTRO DE USUÁRIO COM VALIDACAO DE ERROS USANDO EXPRESS-VALIDATOR E SENHAS CRIPTOGRAFAS COM BCRYPTJS
    static async Register(req, res){ 
        
        const {name, proprietary, email, password, confirmPassword, phone, cnpj, state, city, zipcode} = req.body
        
        const salt = bcryptjs.genSaltSync(10)
        const passwordHash = bcryptjs.hashSync(password, salt)
        
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return res.status(422).json({message: errors})
        }
         if(password !== confirmPassword){
            return res.status(422).json({message: 'As senhas precisam ser iguais'})
        }
        const supermarketExists = await Supermarket.findOne({where:
        {email: email}})
        if(supermarketExists){
            res.status(422).json({message: 'E-mail já cadastrado, utilize outro ou entre em sua conta!'})
            return
        }
        const supermarket = {
            name: name,
            proprietary: proprietary,
            email: email,
            password: passwordHash,
            phone: phone,
            cnpj: cnpj,
            state: state,
            city: city,
            zipcode: zipcode
        }
        try{
            await Supermarket.create(supermarket) 
            await createToken(supermarket, req, res)
        }catch(error){
            return res.status(422).json({message: error})
        }
    }
    //LOGIN DE USUARIO USANDO EMAIL E SENHA
    static async Login(req, res){
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({message: errors})
        }
        const {email, password} = req.body
        const supermarket = await Supermarket.findOne({where: {email: email}})

        if(!supermarket){
            res.status(422).json({message: 'Não existe nenhum usuário com este e-mail, crie sua conta e tente novamente!'})
            return
        }
        
        const checkPassword = await bcryptjs.compare(password, supermarket.password)
        
        if(!checkPassword){
            res.status(422).json({message: 'Senha incorreta!'})
            return
        }
        try{
            await createToken(supermarket, req, res) 
        }catch(error){
            res.status(422).json({message: error})
        }
        
    }
    //BUSCA OS DADOS DO USUÁRIO LOGADO A PARTIR DO TOKEN
    static async getSupermarket(req, res){
        let currentSupermarket
        if(req.headers.authorization){
            const token = await getToken(req)
            const decoded = jwt.verify(token, process.env.SECRET)
            currentSupermarket = await Supermarket.findOne({where: { id: decoded.id}})
            currentSupermarket.password = ''
            if(!currentSupermarket){
                res.status(422).json({message: 'Usuário não encontrado!'})
                return
            }
            res.status(200).send(currentSupermarket)
        }
    }
    //EDICAO DE USUARIO
    static async editSupermarket(req, res){
        const id = req.params.id
        const {name, proprietary, email, password, confirmPassword, phone, cnpj, state, city, zipcode} = req.body
        
        if(password !== confirmPassword){
            return res.status(422).json({message: 'As senhas precisam ser iguais'})
        }
        
        const salt = bcryptjs.genSaltSync(10)
        const passwordHash = bcryptjs.hashSync(password, salt)
        
        const supermarket = {
            name: name,
            proprietary: proprietary,
            email: email,
            password: passwordHash,
            confirmPassword: passwordHash,
            phone: phone,
            cnpj: cnpj,
            state: state,
            city: city,
            zipcode: zipcode
        }
        const supermarketExists = await Supermarket.findOne({where:{email: email}})

        if(supermarketExists){
            res.status(422).json({message: "O e-mail já está sendo utilizado, escolha outro e tente novamente!"})
            return
        }
        try{
            await Supermarket.update(supermarket, {where: {id: id}}) 
            res.status(200).json({message: "Dados atualizados!"})
        }catch(error){
            return res.status(500).json({message: error})
        }
    }
}