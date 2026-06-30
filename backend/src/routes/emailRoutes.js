const express=require("express");

const router=express.Router();

const email=require("../controllers/emailController");

router.get("/",email.getInbox);

router.post("/send",email.sendMail);

module.exports=router;