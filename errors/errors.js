exports.handleCustomError = (err, req, res, next) => {
    if(err.status === 400 || err.status === 403 || err.status === 404 || err.status === 422){
        res.status(err.status).send({ status: "error", message: err.message })
    }
    next(err)
}

exports.handlePSQLerror = (err, req, res, next) => {
    if(err.code === "23503"){
        res.status(500).send({ status: "error", message: "Database Error", code: err.code })
    }

    if(err.code === "23502"){
        res.status(500).send({ status: "error", message: "No Null Values", code: err.code })
    }
    next(err)
}

exports.uncaughtError = (err, req, res, next) => {
    res.status(500).send({ status: "error", message: 'Server Error', error: err })
}