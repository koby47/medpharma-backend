import {verifyToken} from "../utils/jwt.js"
import User from "../models/User.js"

export const protect = async (req,res, next) => {
    try{
        const auth = req.headers.authorization ||"";
        const token = auth.startsWith("Bearer") ? auth.split("")[1] : null;
        if(!token) return res.status(401).json({message: "Not authorized"});

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id).select("-password");
        if(!user) return res.status(401).json({message: "User not found"});

        req.user = user;
        next();

    }catch{
        return res.status(401).json({message:"Invalid token"});
    }

};

export const authorize =(...roles) => (req,res,next) => {
    if (!roles.includes(req.user.role)){
        return res.status (403).json ({message:"Forbidden"});
    }
    next();
};