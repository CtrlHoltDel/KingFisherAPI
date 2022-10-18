exports.handleError = (err, req, res, next) => {

    if(err.type === "PSQL"){
        res.status(err.status).send({ ...err })
        return
    }


    res.status(err.status).send(err.message)
}