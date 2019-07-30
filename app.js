const express=require("express");
const bodyParser=require("body-parser");
const request=require("request");
const mongoose = require("mongoose");
var logInCondition = false;
var loggedInAccount;
var patientsList;

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.connect("mongodb://localhost:27017/MedirecDB");


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
    doc_acc:Boolean,
    settings:{
        remindersOn:Boolean,
        autoOrderOn:Boolean
    },
    assigned_doctor_id:[String],
    docAssignment_req:[String]
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
        if(!loggedInAccount.doc_acc){
            res.render("userHome.ejs",{loggedInAccount:loggedInAccount});
        }else{
           userAccount.find({assigned_doctor_id:loggedInAccount._id},(err,foundAccounts)=>{
                if(err){
                    console.log(err);
                }else{
                    patientsList=foundAccounts;
                    res.render("docHome.ejs",{loggedInAccount:loggedInAccount,patientsList:patientsList,jScript:"js/docHome.js",result:""});
                }
           });
        }
        
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
                console.log(newUser);
                newUser.save(err => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Successfully added");
                        res.render("signUpPage2",{accountID:newUser._id});
                        
                    }
                });
            }
        }
    });
});

app.post("/new-user-settings",(req,res)=>{
    const userSettings={
        remindersOn:("reminders" in req.body),
        autoOrderOn:("autoOrder" in req.body)
    };
    console.log(req.body);
    userAccount.findOneAndUpdate({_id:req.body.accountID},{settings:userSettings},{new:true},(err,foundAccount)=>{
        if(err){
            console.log(err);
        }else{
            logInCondition = true;
            loggedInAccount = foundAccount;
            res.render("allSet");
        }
    })

});

app.post("/home",(req,res)=>{
    const names=req.body.searchQuery.split(" ");
    if(names.length==1)
    {
        userAccount.find({$or:[{firstName:names[0]},{lastName:names[0]}]},(err,foundAccounts)=>{
            if(err){
                console.log(err);
            }else{
                res.render("docHome.ejs",{loggedInAccount:loggedInAccount,patientsList:patientsList,jScript:"js/docHomeSearch.js",result:foundAccounts});
            }
        });
    }
    else if(names.length=2) 
    {
        userAccount.find({$or:[{$and:[{firstName:names[0]},{lastName:names[1]}]},{$and:[{firstName:names[1]},{lastName:names[0]}]}]},(err,foundAccounts)=>{
            if(err){
                console.log(err);
            }else{
                res.render("docHome.ejs",{loggedInAccount:loggedInAccount,patientsList:patientsList,jScript:"js/docHomeSearch.js",result:foundAccounts});
            }
        })
    }

});

app.post("/home/addPatient",(req,res)=>{
    console.log(req.body);
    userAccount.updateOne({_id:req.body.patient_id},{$push:{docAssignment_req:loggedInAccount._id}},(err)=>{
        if(err){
            console.log(err);
        }
    });
});
app.listen(3000,()=>{
    console.log("Server running at port 3000");
});