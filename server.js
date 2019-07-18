const express=require("express");
const bodyParser=require("body-parser");
const request=require("request");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/user-accounts",{useNewUrlParser:true});

const userSchema={
    firstName:String,
    lastName:String,
    nationality:String,
    socSec:String,
    maritalStatus:String,
    sex:String,
    disability:String,
    phoneno: String,
    addrLine1:String,
    addrLine2:String,
    dob:Date,
    email:String,
    password:String,
    doc_acc:Boolean
};

const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('view engine','ejs');

app.get("/",(req,res)=>{
    res.render("index");
})

app.get("/login",(req,res)=>{
    res.render("logInPage");
});

app.get("/signup",(req,res)=>{
    res.render("signUpPage");
});

app.post("/login",(req,res)=>{
    res.redirect("/login");
});

app.post("/signup",(req,res)=>{
    res.redirect("/signup");
});

app.post("/landing-page",(req,res)=>{
     //get email pass from db and log in user
});

app.post("/new-user",(req,res)=>{
    //insert entry into database
    console.log("Hi");
});


app.listen(3000,()=>{
    console.log("Server running at port 3000");
})