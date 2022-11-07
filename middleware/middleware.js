const jwt = require("jsonwebtoken");
const db = require("../db/connection");
const { restrictedError } = require("../utils/responses");
const openPaths = ['/auth/login', '/auth/register']

exports.validateToken = (req, res, next) => {

    if(openPaths.includes(req.path)) return next();

    const bearerHeader = req.headers["authorization"];

    if (!bearerHeader) return next({ status: 403, message: "Restricted" });

    try {
        const user = jwt.verify(
            bearerHeader.split(" ")[1],
            process.env.JWT_SECRET
        );

        req.user = user
        next();
    } catch (error) {
        next({ status: 403, message: "Restricted" })
    }
}

exports.groupValidation = async (req, res, next) => {
    const { username } = req.user
    const { group_id } = req.params

    try {
        const { rows } = await db.query(`SELECT username, validated, admin FROM note_group_junction WHERE username = $1 AND note_group = $2`, [username, group_id])
        if(!rows.length || !rows[0].validated) {
            res.status(400).send(restrictedError)
            return
        }
    } catch (error) {
        next({ status: 400, message: "Error Handling Request" })
    }

    next()
}

exports.playerValidation = async (req, res, next) => {
    const { player_id } = req.params
    const { username } = req.user

    try {
        if(!player_id) {
            res.status(400).send({ status: "error" })
            return
        }

        const { rows: validityCheck } = await db.query(`SELECT validated FROM note_group_junction ngj JOIN players ON players.note_group_id = ngj.note_group WHERE ngj.username = $1 AND players.id = $2`, [username, player_id]);

        if(!validityCheck.length || !validityCheck[0].validated){
            res.status(400).send(restrictedError)
            return
        }
    } catch (error) {
        next({ status: 400, message: "Error Handling Request" })
    }
    
    next();
}