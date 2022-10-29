exports.handleCustomError = (err, req, res, next) => {
    if(err.status === 400 || err.status === 403 || err.status === 404 || err.status === 422 || err.status === 401){
        res.status(err.status).send({ status: "error", message: err.message })
        return
    }
    next(err)
}

exports.handlePSQLerror = (err, req, res, next) => {
    if(err.code === "23503"){
        res.status(500).send({ status: "error", message: "Database Error", code: err.code })
        return
    }

    if(err.code === "23502"){
        res.status(500).send({ status: "error", message: "No Null Values", code: err.code })
        return
    }

    if(err.code === "23505"){
        res.status(500).send({ status: "error", message: "No Duplicate Values", code: err.code })
        return
    }

    next(err)
}

exports.uncaughtError = (err, req, res, next) => {
    console.log(err, "<<", err.code)
    res.status(500).send({ status: "error", message: 'Server Error', error: err })
}