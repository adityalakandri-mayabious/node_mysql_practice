import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashedpassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

export const comparepassword = async (password, existingPassword) => {
  const compare = await bcrypt.compare(password, existingPassword);
  return compare;
};

export const AuthCheck = async (req, res, next) => {
  const token = req.headers["x-access-token"] || req.headers["authorization"];

  if (!token) {
    return res.status(400).json({
      status: false,
      message: "Token is required for authorization.",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    // console.log(req.user)
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "Invalid token.",
    });
  }
  return next();
};
export const RoleCheck = (allowedRoles=[]) => {
  return async (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: false,
        message: "Access Denied. You are not authorized.",
      });
    }
    next();
  };
};
