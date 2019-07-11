const express=require("express");
const bodyParser=require("body-parser");
const request=require("request");

const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));


app.get("/",(req,res)=>{
    res.sendFile(__dirname+"/index.html");
    
})

app.get("/login",(req,res)=>{
    res.sendFile(__dirname+"/logInPage.html");
});

app.get("/signup",(req,res)=>{
    res.sendFile(__dirname+"/signUpPage.html");
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