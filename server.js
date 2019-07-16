const express=require("express");
const bodyParser=require("body-parser");
const request=require("request");

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
})

app.post("/signup",(req,res)=>{
    res.redirect("/signup");
})
app.listen(3000,()=>{
    console.log("Server running at port 3000");
})