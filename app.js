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
const _ = require('lodash');
const socketio = require("socket.io");

const app=express();
let healthOSAccessToken;

app.use(bodyParser.urlencoded({extended:true})); //adds ability for server to read data recieved from forms
app.use(express.static(__dirname+'/public')); //serves files in public folder
app.use('/bower_components',  express.static(__dirname + '/bower_components')); //use bower modules in client side
app.use(session({   //session to start with these settings
    secret:process.env.SECRET_STRING,
    resave:false,
    saveUninitialized: false,
    cookie : {
        maxAge: 1000* 60 * 60 *24 * 365
    } //stores cookie for one year
}));
app.use(passport.initialize()); //initializes passport
app.use(passport.session());    //begins session

app.set('view engine','ejs');

mongoose.set('useNewUrlParser', true); //remove deprecation warning
mongoose.set('useFindAndModify', false); //remove deprecation warning
mongoose.set('useCreateIndex', true); //remove deprecation warning
mongoose.connect("mongodb://localhost:27017/MedirecDB"); //connects to mongodb


//--------------------------------------------------------
//--------------------USER SCHEMA-------------------------
//--------------------------------------------------------

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
    docAssignment_req:[{_id:String,
                        firstName:String,
                        lastName:String}],
    
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

    medical_rec:{
        
        pmh:[String], //past medical history
        sh:[String], //social history

        parent1Username: String,
        parent2Username:String,
        children: [String], 

        geneticDisorders:{ 
            names:[String],
            approved: Boolean
        },

        ancestral_geneticDisorder:[{
            name: String,
            relation: String,
        }],

        allergies:{
            names: [String],
            approved:Boolean
        },

        disabilities:{
            names: [String],
            approved:Boolean
        },

        Entry:[{
            dateofEntry: Date,
            entryLogger_id: String,
            entryLoggerName: String,
            entryLoggerUsername: String,
            entryLoggerPhoneNo: String,

            content:[{
                heading: String,
                contentUnderHeading:[{
                    subHeading:String,
                    body:String
                }]
            }]
        }]
    },
    profile_complete:Boolean
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('userAccount',userSchema);

passport.use(User.createStrategy()); //creates local strategy for login by using passportLocalMongoose plugin

passport.use(new GoogleStrategy({ //creates google strategy
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

passport.use(new FacebookStrategy({ //creates faceboook strategy
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

passport.serializeUser(function(user, done) { //sets user id as cookie in browser
    done(null, user.id);
});

passport.deserializeUser(function(id, done) { //gets id from cookie and then user is fetched from database
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

//--------------------------------------------------------
//---------------------FUNCTIONS--------------------------
//--------------------------------------------------------

const generateAccessToken = () =>{
    return new Promise((resolve,reject)=>{
        const options = {
            "method":"POST",
            "url" : " http://www.healthos.co/api/v1/oauth/token.json ",
            "headers": {
                "Content-Type": "application/json"
            },
            "body" :`{
                "grant_type": "client_credentials",
                "client_id": "${process.env.HEALTHOS_CLIENT_ID}",
                "client_secret":"${process.env.HEALTHOS_CLIENT_SECRET}",
                "scope": "public read write"
            }`
        };
    
        request(options,(err,response,body)=>{
            if(err){
                console.log(err);
                reject(err);
            }else{
                if(response.statusCode == 200){
                    const body_json = JSON.parse(body);
                    healthOSAccessToken = body_json.access_token;
                    console.log(healthOSAccessToken);
                    resolve(healthOSAccessToken);
                }else{
                    reject(response);
                }                
            }
        });
    }); 
}


//--------------------------------------------------------
//--------------------GET REQUESTS------------------------
//--------------------------------------------------------

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


app.get("/socialSignUp",(req,res)=>{
    if(req.isAuthenticated() && !req.user.profile_complete){
        res.render("socialSignUp",{loggedInAccount:req.user});
    }else{
        res.redirect("/");
    }
    
});

app.get("/addMedicalDetails",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("medicalDetails",{loggedInAccount:req.user});
    }else{
        res.redirect("/");
    }
});

app.get("/addParentDetails",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("addParentDetails",{loggedInAccount:req.user});
    }else{
        res.redirect("/");
    }
});

app.get("/settings",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("settings");
    }else{
        res.redirect("/");
    }
});

app.get("/home",(req,res)=>{
    if(req.isAuthenticated()){

        if(req.user.profile_complete){
            if(req.user.doc_acc){
                res.render("docHome",{loggedInAccount:req.user});
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



//--------------------------------------------------------
//-------------------POST REQUESTS------------------------
//--------------------------------------------------------

app.post("/settings",(req,res)=>{
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
                res.redirect("/addMedicalDetails");
            });
        }
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
            foundUser.profile.phoneNo = req.body.phoneNo;
            foundUser.profile.addrLine1 = req.body.addrLine1;
            foundUser.profile.addrLine2 = req.body.addrLine2;
            foundUser.profile_complete=true;
            foundUser.doc_acc=false;
            foundUser.save(err=>{
                if(err){
                    console.log(err);
                }else{
                res.redirect("/addMedicalDetails");
                }
            });
        }
    });
});

app.post("/addMedicalDetails",(req,res)=>{
    const allergiesPresent = "allergyCheck" in req.body;
    const disabiltiesPresent = "disabilityCheck" in req.body;
    const geneticDisordersPresent = "geneticDisorderCheck" in req.body;

    /* medical_rec:{
        
        pmh:[String], //past medical history
        sh:[String], //social history

        parent1Username: String,
        parent2Username:String, 

        geneticDisorders:{ 
            names:[String],
            approved: Boolean
        },

        ancestral_geneticDisorder:[{
            name: String,
            relation: String,
        }],

        allergies:{
            names: [String],
            approved:Boolean
        },

        disabilities:{
            names: [String],
            approved:Boolean
        }, */


    User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            
            if(allergiesPresent){
                foundUser.medical_rec.allergies={
                    names:req.body.allergyName,
                    approved:false
                }
            }

            if(disabiltiesPresent){
                foundUser.medical_rec.disabilities={
                    names:req.body.disabilityName,
                    approved:false
                }
            }

            if(geneticDisordersPresent){
                foundUser.medical_rec.geneticDisorders={
                    names:req.body.geneticDisorderName,
                    approved:false
                }
            }

            foundUser.save(err=>{
                if(err){console.log(err)}
                else{res.redirect("/settings")};
            })
        }
    })
});

app.post("/addParentDetails",(req,res)=>{
    const parentsOnMedirec = 'parentsCheck' in req.body;
    if(parentsOnMedirec){
        if(req.body.numOfParents === '1'){

            User.findOne({username:req.body.parent1Username},(err,foundUser)=>{
                if(err){
                    console.log(err);
                }else{
                    console.log(foundUser);
                    //save found user (parent) in req.user
                    //find genetical disorders in family tree
                    //push all to [ancestral_geneticDisorder]
                    res.render("allSet");
                }
            })

        }else if(req.body.numOfParents==='2'){

        }
    }else{
        res.render("allSet");
    }
    console.log(req.body);
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

//API CALLS
app.get("/usercheck",(req,res)=>{
    if(req.query.username!=req.user.username){
        User.findOne({username:req.query.username},(err,foundUser)=>{
            if(err){
                console.log(err);
            }else{
                if(foundUser){
                    res.send(true);
                }else{
                    res.send(false);
                }
            }
        })
    }else{
        res.send(false);
    }
    
});
//--------------------------------------------------------
//----------------------LISTENER--------------------------
//--------------------------------------------------------

const expressServer = app.listen(3000,()=>{
    console.log("Server running at port 3000");
});


//--------------------------------------------------------
//---------------------SOCKETIO---------------------------
//--------------------------------------------------------

const io = socketio(expressServer,{pingInterval:5000});

io.on('connection',socket=>{

//--------------------------------------------------------
//------------------DOCTOR ACCOUNT------------------------
//--------------------------------------------------------

    //POPULATE 'YOUR PATIENT' LIST
    socket.on('sendMyPatients', (loggedInUser,fn)=>{
        User.find({assigned_doctor_id:{$in:[loggedInUser]}},(err,foundUsers)=>{
            if(err){
                console.log(err);
            }else{
                fn({data:foundUsers});
            }
        });
    });


    //SEARCH FOR PATIENT
    socket.on('sendSearchResults',(data,fn)=>{
        const names = data.searchQuery.split(" ");

        names.forEach((name,index)=>{
            names[index] = _.capitalize(name);
        });

        if(names.length==1){
            User.find({$and:[{_id:{$ne:data.loggedInUser}},{$or:[{"profile.firstName":names[0]},{"profile.lastName":names[0]}]}]},(err,foundAccounts)=>{
                if(err){
                    console.log(err);
                }else{
                    fn(foundAccounts);
                }
            });
        }else if(names.length=2) {
            User.find({$and:[{_id:{$ne:data.loggedInUser}},{$or:[{$and:[{"profile.firstName":names[0]},{"profile.lastName":names[1]}]},{$and:[{"profile.firstName":names[1]},{"profile.lastName":names[0]}]}]}]},(err,foundAccounts)=>{
                if(err){
                    console.log(err);
                }else{
                    fn(foundAccounts);
                }
            });
        }
    });

    //ADD PATIENT
    socket.on('addPatientRequest',(request,fn)=>{
        
        User.findByIdAndUpdate(request.patientID,{$push:{docAssignment_req:{
            _id: request.loggedInUser,
            firstName:request.loggedInUserFName,
            lastName:request.loggedInUserLName
            }}},(err,foundUser)=>{
            if(err){
                console.log(err);
            }else{
                fn(true);
            }
        })
    })

//--------------------------------------------------------
//------------------BOTH ACCOUNTS------------------------
//--------------------------------------------------------

    //SEND ACCESS TOKEN FOR HEALTHOS 
    socket.on('sendAccessToken',(data,fn) =>{
        console.log('Sent request');
        generateAccessToken().then(generatedToken=>{
            fn(generatedToken);
        }).catch(err=>{
            console.log(err);
        });
    });

    //POPULATE NOTIFICATIONS
    socket.on('notificationRequest',(loggedInUser,fn)=>{
        User.findById(loggedInUser,(err,foundUser)=>{
            if(err){
                console.log(err);
            }else{
                fn(foundUser);
            }
        });
    })
    
    //REJECT DOCTOR ADD REQUEST
    socket.on('rejectRequest',(data,fn)=>{
        User.findByIdAndUpdate(data.loggedInUser,{$pull: { docAssignment_req: { _id: data.rejectDoctor } }},err=>{
            if(err){console.log(err)}
            else{fn(true);}
        })
    })

    //ACCEPT DOCTOR ADD REQUEST
    socket.on('acceptRequest',(data,fn)=>{

        console.log(data);
        User.findByIdAndUpdate(data.loggedInUser,{$pull: { docAssignment_req: { _id: data.acceptDoctor } }},err=>{
            if(err){console.log(err)}
        })

        User.findByIdAndUpdate(data.loggedInUser,{$push: { assigned_doctor_id: { _id: data.acceptDoctor } }},err=>{
            if(err){console.log(err);}
            else{fn(true)};
        })
    });

    //CHECK IF SEX OF BOTH PARENTS IS SAME
    socket.on('checkSameSex',(data,fn)=>{
        console.log(data);
        fn(false);
    })

});
