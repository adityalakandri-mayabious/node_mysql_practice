import express from "express";
import userImage from "../helper/userImage.js";
import {
  createUser,
  dashboard,
  getUsers,
  loginUser,
  resetPassword,
  resetPasswordLink,
  verifyOtp,
} from "../controller/UserController.js";
import { AuthCheck } from "../middleware/Auth.js";

const router = express.Router();

router.post("/create-user", userImage, createUser);
router.get("/get-users", getUsers);
router.post("/verify-otp", verifyOtp);
router.post("/login-user", loginUser);
router.get("/dashboard", AuthCheck, dashboard);
router.post("/reset-password-link", resetPasswordLink);
router.post("/reset-password/:id/:token",resetPassword)

export default router;
