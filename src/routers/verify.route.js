import { verifyOTP } from "../controllers/verifyOTP.controller.js";
import express from "express";

const route = express.Router();

route.post("/verify-otp", verifyOTP);

export default route;
