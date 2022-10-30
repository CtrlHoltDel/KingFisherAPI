const jwt = require("jsonwebtoken");
const EM = require("../utils/errorMessages");

exports.validateToken = (req, res, next) => {

    const openPaths = ['/auth/login', '/auth/register']

    if(openPaths.includes(req.path)) {
        return next()
    };

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