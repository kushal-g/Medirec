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

        ancestral_geneticDisorders:[],

        allergies:{
            names: [String],
            approved:Boolean
        },

        disabilities:{
            names: [String],
            approved:Boolean
        },

        Entries:[{
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

//--------------------------------------------------------
//-------------------SCHEMA HOOKS-------------------------
//--------------------------------------------------------

/* userSchema.post("updateOne",function(doc,next){
    console.log(this.getUpdate());
    if('medical_rec.ancestral_geneticDisorders' in this.getUpdate()){
        console.log("Ancestral Genetic Disorder updated")
        this.findOne((err,user)=>{
            console.log(user);
            if(err){
                console.log(err);
            }else{
                 //update the family tree
                console.log()
                
            }
        })
        
    }
    else if('$addToSet' in this.getUpdate()){
        if('medical_rec.geneticDisorders.names' in this.getUpdate().$addToSet){
            this.findOne((err,user)=>{
                console.log(user);
                if(err){
                    console.log(err);
                }
                else if(user.medical_rec.geneticDisorders.approved){
                    console.log("Genetic Disorder updated");
                    //update the family tree
                }
            })
        }
    }
    else if('medical_rec.geneticDisorders.approved' in this.getUpdate()){
        if(this.getUpdate()["medical_rec.geneticDisorders.approved"]){
            console.log("Genetic Disorder approved");
            this.findOne((err,user)=>{
                
                if(err){
                    console.log(err);
                }else{
                     //update the family tree
                }
            })
        }
    }
    next();
}) */

const User = mongoose.model('userAccount',userSchema);



//--------------------------------------------------------
//---------------PASSPORT STRATEGIES----------------------
//--------------------------------------------------------

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
//---------------FUNCTIONS AND PROMISES-------------------
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

const findParentAndUpdate=(parentUsername,childID)=>{
    return new Promise((resolve,reject)=>{
        User.findOneAndUpdate({username:parentUsername},{$addToSet:{"medical_rec.children":childID}},(err,foundUser)=>{
            if(err){
                reject(err);
            }else{
                resolve(foundUser)
            }
        });
    })
}


//--------------------------------------------------------
//--------------------GET REQUESTS------------------------
//--------------------------------------------------------
generateAccessToken().catch(err=>{
    console.log(err);
})

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
    console.log(req.body);
    const allergyPresent = 'allergyCheck' in  req.body;
    const disabilityPresent = 'disabilityCheck' in req.body;
    const geneticDisorderPresent = 'geneticDisorderCheck' in req.body;

    if(allergyPresent){
        
        const allergies = _.trim(req.body.allergyName,", ").split(", ");
        console.log(allergies);
        User.updateOne({_id:req.user.id},{
            $addToSet:{"medical_rec.allergies.names":{$each:allergies}},
            "medical_rec.allergies.approved":false
        },err=>{
            if(err){console.log(err)}
        })
    }
    if(disabilityPresent){
        const disabilities = _.trim(req.body.disabilityName,", ").split(", ");
        console.log(disabilities);
        User.updateOne({_id:req.user.id},{
            $addToSet:{"medical_rec.disabilities.names":{$each:disabilities}},
            "medical_rec.disabilities.approved":false
        },err=>{
            if(err){console.log(err)}
        })
    }
    if(geneticDisorderPresent){
        const geneticDisorders = _.trim(req.body.geneticDisorderName,", ").split(", ");
        console.log(geneticDisorders);
        User.updateOne({_id:req.user.id},{
            $addToSet:{"medical_rec.geneticDisorders.names":{$each:geneticDisorders}},
            "medical_rec.geneticDisorders.approved":false
        },err=>{
            if(err){console.log(err)}
        })
    }
    
    res.redirect("/addParentDetails");
});

app.post("/addParentDetails",(req,res)=>{
    const parentsOnMedirec = 'parentsCheck' in req.body;
    if(parentsOnMedirec){
        if(req.body.numOfParents === '1'){

            let geneticDisordersInFamily = [];

            //finds parent and inserts child in the array
            findParentAndUpdate(req.body.parent1Username,req.user.id).then(parent=>{

                //inserts all genetical disorders and ancestral genetical disorders in an array
                //TODO: test if this works when the fields are absent
                geneticDisordersInFamily.push(parent.medical_rec.ancestral_geneticDisorders);
                if(parent.medical_rec.geneticDisorders.approved){
                    geneticDisordersInFamily.push(parent.medical_rec.geneticDisorders.names)
                }
                geneticDisordersInFamily = _.uniq(_.flatten(geneticDisordersInFamily));


                //saves the parent in user's data and make ancestral genetic disorder data field equal to new array
                User.updateOne({_id:req.user.id},{
                    "medical_rec.parent1Username":req.body.parent1Username,
                    "medical_rec.ancestral_geneticDisorders":geneticDisordersInFamily
                },err=>{
                    if(err){console.log(err)}
                    else{res.redirect("/settings")}
                })

            }).catch(err=>{
                console.log(err);
            })
            
        }else if(req.body.numOfParents==='2'){

            let geneticDisordersInFamily = [];

            //pushes child in parent 1's data
            findParentAndUpdate(req.body.parent1Username,req.user.id).then(parent1=>{

                //inserts all genetical disorders and ancestral genetical disorders of parent 1 in an array
                geneticDisordersInFamily.push(parent1.medical_rec.ancestral_geneticDisorders);
                if(parent1.medical_rec.geneticDisorders.approved){
                    geneticDisordersInFamily.push(parent1.medical_rec.geneticDisorders.names)
                }

                //pushes child in parent 2's data
                findParentAndUpdate(req.body.parent2Username,req.user.id).then(parent2=>{

                    //inserts all genetical disorders and ancestral genetical disorders of parent 2 in an array
                    geneticDisordersInFamily.push(parent2.medical_rec.ancestral_geneticDisorders);
                    if(parent2.medical_rec.geneticDisorders.approved){
                        geneticDisordersInFamily.push(parent2.medical_rec.geneticDisorders.names)
                    }

                    geneticDisordersInFamily = _.uniq(_.flatten(geneticDisordersInFamily));

                     //saves the parent in user's data and make ancestral genetic disorder data field equal to new array
                    User.updateOne({_id:req.user.id},{
                        "medical_rec.parent1Username":req.body.parent1Username,
                        "medical_rec.parent2Username":req.body.parent2Username,
                        "medical_rec.ancestral_geneticDisorders":geneticDisordersInFamily
                    },err=>{
                        if(err){console.log(err)}
                        else{res.redirect("/settings")}
                    })

                })
            }).catch(err=>{
                console.log(err);
            })
        }
    }else{
        res.redirect("/settings");
    }
    
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

//--------------------------------------------------------
//----------------------API CALLS-------------------------
//--------------------------------------------------------

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

app.get("/diseases/allergies", (req, res) => {
    if (req.query.term != "") {
        console.log(req.query.term);
        const options = {
            url: `http://www.healthos.co/api/v1/autocomplete/diseases/${req.query.term}`,
            timeout:0,
            pool:{
                maxSockets: 100
            },
            headers: {
                Authorization: `Bearer ${healthOSAccessToken}`
            }
        }
        request.get(options, (error, response, body) => {
            
            if (error) {
                console.log(error);
                res.send("Autocomplete not available");
            } else {
                if(response.statusCode==200){
                    body = JSON.parse(body);
                    const filteredResponse = body.reduce((acc, disease) => {
                        if (disease.disease_cat.includes('Immune diseases')) {
                            acc.push(disease.disease_name.replace(",",""));
                        }
                        return acc;
                    }, []);
                    console.log(filteredResponse);
                    res.send(filteredResponse);
                }
            }
        })
    }
});

app.get("/diseases/disabilities", (req, res) => {
    if (req.query.term != "") {
        console.log(req.query.term);
        const options = {
            url: `http://www.healthos.co/api/v1/autocomplete/diseases/${req.query.term}`,
            timeout:0,
            pool:{
                maxSockets: 100
            },
            headers: {
                Authorization: `Bearer ${healthOSAccessToken}`
            }
        }
        request.get(options, (error, response, body) => {
            console.log(response.statusCode);
            if (error) {
                console.log(error);
                res.send("Autocomplete not available");
            } else {
                if(response.statusCode==200){
                    body = JSON.parse(body);
                    console.log(body);
                    const filteredResponse = body.reduce((acc, disease) => {
                        acc.push(disease.disease_name.replace(",",""));
                        return acc;
                    }, []);
                    console.log(filteredResponse);
                    res.send(filteredResponse);
                }
            }
        })
    }
});

app.get("/diseases/geneticDisorders", (req, res) => {
    if (req.query.term != "") {
        console.log(req.query.term);
        const options = {
            url: `http://www.healthos.co/api/v1/autocomplete/diseases/${req.query.term}`,
            timeout:0,
            pool:{
                maxSockets: 100
            },
            headers: {
                Authorization: `Bearer ${healthOSAccessToken}`
            }
        }
        request.get(options, (error, response, body) => {
            console.log(response.statusCode);
            if (error) {
                console.log(error);
                res.send("Autocomplete not available");
            } else {
                if(response.statusCode==200){
                    body = JSON.parse(body);
                    const filteredResponse = body.reduce((acc, disease) => {
                        if (disease.disease_cat.includes('Genetic diseases')) {
                            acc.push(disease.disease_name.replace(",",""));
                        }
                        return acc;
                    }, []);
                    console.log(filteredResponse);
                    res.send(filteredResponse);
                }
            }
        })
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

        const sameSexChecker = function(username) {
            return new Promise(function(resolve, reject) {
                User.findOne({username:username},(err,foundUser)=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(foundUser.profile.sex);
                    }
                })
            });
        }

        sameSexChecker(data.parent1Username).then(parent1Sex=>{
            sameSexChecker(data.parent2Username).then(parent2Sex=>{
                fn(parent1Sex==parent2Sex);
            })
        }).catch(err=>{
            console.log(err);
        })
    })

});
