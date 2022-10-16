const jwt = require("jsonwebtoken");
const EM = require("../utils/errorMessages");

exports.validateToken = async (req, res, next) => {
    const bearerHeader = req.headers["authorization"];

    if (!bearerHeader) return next({ status: 403, message: "Restricted" });
  
    try {
        const user = await jwt.verify(
            bearerHeader.split(" ")[1] + "broken",
            process.env.JWT_SECRET
        );

        req.user = user
        next();
    } catch (error) {
        console.log("Unauthorised User")
        next(EM.unauthorised)
    }

    next();
}