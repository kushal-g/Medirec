require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const request=require("request");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate=require("mongoose-findorcreate");
var _ = require('lodash');

const app=express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+'/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use(session({
    secret:process.env.SECRET_STRING,
    resave:false,
    saveUninitialized: false
}));
app.use(passport.initialize()); //initializes passport
app.use(passport.session());    //begins session

app.set('view engine','ejs');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect("mongodb://localhost:27017/MedirecDB");


const userSchema=new mongoose.Schema({
    googleID:String,
    facebookID:String,
    username: String,
    doc_acc:Boolean,

    settings:{
        remindersOn:Boolean,
        autoOrderOn:Boolean 
    },

    assigned_doctor_id:[String],
    docAssignment_req:[String],
    
    profile:{
        
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
        dob:String,
    },

    profile_complete:Boolean
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('userAccount',userSchema);

passport.use(User.createStrategy());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/medirec"
    },
    function(accessToken, refreshToken, profile, cb) {

        request({uri:"https://people.googleapis.com/v1/people/me", headers:{Authorization:` Bearer ${accessToken}`},qs:{personFields:"birthdays,genders"}},(err,response,body)=>{
            if(err){
                console.log(err);
            }else{
                const googleJSONProfile = JSON.parse(body);            
                User.findOne({$or:[{username:profile.emails[0].value},{googleID: profile.id}]},(err,user)=>{
                    if(err){
                        return cb(err);
                    }
                    if(!user){
                        user = new User({
                            googleID: profile.id,
                            username:profile.emails[0].value,
                            profile:{
                                
                                firstName:_.capitalize(profile.name.givenName), 
                                lastName:_.capitalize(profile.name.familyName),
                                sex:googleJSONProfile.genders[0].value,
                                dob:`${googleJSONProfile.birthdays[1].date.year}-${googleJSONProfile.birthdays[1].date.month.toLocaleString('en-US',{minimumIntegerDigits:2})}-${googleJSONProfile.birthdays[1].date.day.toLocaleString('en-US',{minimumIntegerDigits:2})}`
                            },
                            profile_complete:false
                        });

                        user.save(err=>{
                            if(err){
                                console.log(err);
                            }
                            return cb(err,user);
                        })
                    }else{
                        if(user.googleID==null){
                            user.googleID = profile.id;
                            user.save(err=>{
                                if(err){
                                    console.log(err);
                                }
                                return cb(err,user);
                            });
                        }else{
                            return cb(err,user);
                        }
                        
                    }
                })
            }
        } )
        
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/medirec",
    profileFields:['email','gender','name','birthday']
    },
    function(accessToken, refreshToken, profile, cb) {
    
        birthday_array=profile._json.birthday.split('/');
        User.findOne({$or:[{username:profile._json.email},{facebookID:profile.id}]},(err,user)=>{
            if(err){
                return cb(err);
            }
            if(!user){
                user = new User({
                    facebookID:profile.id,
                    username: profile._json.email,
                    profile:{
                        
                        firstName:_.capitalize(profile._json.first_name),
                        lastName:_.capitalize(profile._json.last_name),
                        sex:profile._json.gender,
                        dob:`${birthday_array[2]}-${birthday_array[0]}-${birthday_array[1]}`
                    },
                    profile_complete:false
                });
                user.save(err=>{
                    if(err){
                        console.log(err);
                    }
                    return cb(err,user);
                })
            }else{
                if(user.facebookID==null){
                    user.facebookID = profile.id;
                    user.save(err=>{
                        if(err){
                            console.log(err);
                        }
                        return cb(err,user);
                    });
                }else{
                    return cb(err,user);
                }
                
            }
        })
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});


app.get("/",(req,res)=>{
    if(req.isAuthenticated()){
        res.redirect("/home");
    }else{
        res.render("index");
    }
})


app.get("/signup",(req,res)=>{
    res.render("signUpPage");
});

app.get("/home",(req,res)=>{
    if(req.isAuthenticated()){
        if(req.user.profile_complete){
            if(req.user.doc_acc){
                res.render("docHome",{loggedInAccount:req.user,jScript:"js/docHome.js"});
            }else{
                res.render("userHome",{loggedInAccount:req.user});
            }
        }else{
            res.redirect("/socialSignUp");
        }
        
    }else{
        res.redirect("/");
    }
    
});

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
});

app.get("/success",(req,res)=>{
    res.render("allSet");
});

app.get("/auth/google",
    passport.authenticate("google", { scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/user.addresses.read",
        "https://www.googleapis.com/auth/user.birthday.read"    
    ] })
);

app.get("/auth/google/medirec", 
    passport.authenticate("google", { failureRedirect: "/" }),
    function(req, res) {
        if(req.user.profile_complete){
            res.redirect("/home");
        }else{
            res.redirect("/socialSignUp");
        }
    });

app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['email','user_birthday','user_gender'] }));

app.get('/auth/facebook/medirec',
    passport.authenticate("facebook", { failureRedirect: "/" }),
    function(req, res) {
        if(req.user.profile_complete){
            res.redirect("/home");
        }else{
            res.redirect("/socialSignUp");
        }
    });


app.get("/socialSignUp",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("socialSignUp",{loggedInAccount:req.user});
    }else{
        res.redirect("/");
    }
    
});

app.post("/signup/page2",(req,res)=>{
    const settings = {
        remindersOn:"reminders" in req.body,
        autoOrderOn:"autoOrder" in req.body
    }
    
    User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            foundUser.settings=settings;
            foundUser.save(()=>{
                res.redirect("/success");
            });
        }
    });
});

app.post("/signup",(req,res)=>{
    const newUser = {
        username: req.body.username,
        profile:{
            firstName:_.capitalize(req.body.firstName),
            lastName:_.capitalize(req.body.lastName),
            nationality:_.capitalize(req.body.nationality),
            IDno:req.body.IDno,
            maritalStatus:req.body.maritalStatus,
            sex:req.body.sex,
            disability:req.body.disability,
            phoneNo: req.body.phoneNo,
            addrLine1:req.body.addrLine1,
            addrLine2:req.body.addrLine2,
            dob:req.body.dob,
        },
        doc_acc:false,
        profile_complete:true
    };

    const password = req.body.password;

    User.register(newUser, password , (err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/signup");
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.render("signUpPage2");
            });
        }
    })
});

app.post("/login",(req,res)=>{
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });

    passport.authenticate('local',{failureRedirect:"/",failureMessage:"Incorrect Email or Password"})(req,res,()=>{
        res.redirect("/home");
    })
});

app.post("/socialSignUp",(req,res)=>{
    User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
           foundUser.profile.nationality =_.capitalize(req.body.nationality);
           foundUser.profile.IDno = req.body.IDno;
           foundUser.profile.maritalStatus = req.body.maritalStatus;
           foundUser.profile.sex = req.body.sex;
           foundUser.profile.disability = req.body.disability;
           foundUser.profile.phoneNo = req.body.phoneNo;
           foundUser.profile.addrLine1 = req.body.addrLine1;
           foundUser.profile.addrLine2 = req.body.addrLine2;
           foundUser.profile_complete=true;
           foundUser.save(err=>{
               if(err){
                   console.log(err);
               }else{
                   res.redirect("/home");
               }
           });
        }
    });
});

app.listen(3000,()=>{
    console.log("Server running at port 3000");
});