const { handleLogin, handleRegister } = require("../models/auth");

exports.postLogin = async (req, res, next) => {
    const { username, password } = req.body;

    try {
        const response = await handleLogin(username, password)    
        res.status(200).send(response)
    } catch (err) {
        next(err)
    }
}

exports.postRegister = async (req, res, next) => {
    const { username, password } = req.body;

    try {
        const response = await handleRegister(username, password)
        res.status(201).send(response)
    } catch (err) {
        next(err)
    }
}