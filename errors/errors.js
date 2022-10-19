exports.handleError = (err, req, res, next) => {
    if(err.type === "PSQL"){
        res.status(err.status).send({ status: "error", message: err.message })
        return
    }


    res.status(err.status).send({ status: "error", message: err.message })
}