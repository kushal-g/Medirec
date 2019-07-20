const express=require("express");
const bodyParser=require("body-parser");
const request=require("request");
const mongoose = require("mongoose");
var logInCondition = false;
var loggedInAccount;

mongoose.connect("mongodb://localhost:27017/MedirecDB",{useNewUrlParser:true});

const userSchema=new mongoose.Schema({
    firstName:String,
    lastName:String,
    nationality:String,
    IDno:String,
    maritalStatus:String,
    sex:String,
    disability:String,
    phoneNo: String,
    addrLine1:String,
    addrLine2:String,
    dob:Date,
    email:String,
    password:String,
    doc_acc:Boolean
});

const userAccount = mongoose.model('userAccount',userSchema);

const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+'/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.set('view engine','ejs');

app.get("/",(req,res)=>{
    if(logInCondition){
        res.redirect("/home");
    }else{
        res.render("index");
    }
})

app.get("/login",(req,res)=>{
    res.render("logInPage",{noAccountMessage:""});
});

app.get("/signup",(req,res)=>{
    res.render("signUpPage",{accountExistsWarning:""});
});

app.get("/home",(req,res)=>{
    if(logInCondition){
        res.render("userHome.ejs",{loggedInAccount:loggedInAccount});
    }else{
        res.redirect("/");
    }
    
});

app.get("/logout",(req,res)=>{
    logInCondition=false;
    loggedInAccount=null;
    res.redirect("/");
})

app.post("/login",(req,res)=>{

     userAccount.findOne({email:req.body.inputEmail, password: req.body.inputPassword},(err,account)=>{
         if(err){
             console.log(err);
         }else{
             if(account==null){
                res.render("logInPage",{noAccountMessage:"No such account exists"});
             }else{
                 logInCondition=true;
                 loggedInAccount=account;
                 res.redirect("/home");
             }
         }
     })
});

app.post("/signup", (req, res) => {
    const user_data = req.body;
    user_data.doc_acc = false;
    let check1=false;
    let check2=false;
    //check if account already exists by checking identity card no, email address
    

    userAccount.findOne({$or:[{email: user_data.email},{IDno: user_data.IDno}]}, (err, foundAccount) => {
        if (err) {
            console.log(err);
        } else {
            if (foundAccount) {
                console.log("Account already exists");
                res.render("signUpPage",{accountExistsWarning:"Account with that identity card or email address already exists"})
            } else {
                const newUser = new userAccount(user_data);
                newUser.save(err => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Successfully added");
                        res.render("signUpPage2");
                    }
                });
            }
        }
    });

    
});

app.listen(3000,()=>{
    console.log("Server running at port 3000");
})