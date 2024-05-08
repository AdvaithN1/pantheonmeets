const express = require('express');
const path = require('path');
const dotenv = require('dotenv'); 
dotenv.config();
const session = require('express-session');
var cookies = require("cookie-parser");
const nodemailer = require('nodemailer');

const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion } = require('mongodb');

const expTimeSeconds = 86400;

const uri = process.env.MONGO_URI;
const pass = process.env.MONGO_PASS;

const adminemail = process.env.EMAIL;
const email_pass = process.env.EMAIL_PASS;

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: adminemail,
      pass: email_pass
  }
});

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri);
const mongolink = "mongodb://localhost:27017/32" // Originally localhost:27017/32   Use mongodb://meets.pantheonlabs.org:27017/32 for production

async function getUserInfo(userId) {
  try {
    console.log("Connecting...")
    await client.connect(mongolink, "AdvaithN", pass);
    console.log("Connected")
    const database = client.db("Channels");
    const collection = database.collection("Channel-info");
    const thingy = await collection.find({ id: String(userId) });
    // console.log(user);
    const matches = [];
    await thingy.forEach(match => {
      matches.push(match);
    });

    return matches;
  } finally {
    // await client.close();
  }
}

async function addUser(userId, username, email, profilepic) {
  console.log("Connecting...")
  await client.connect(mongolink);
  console.log("Connected")
  const database = client.db("Accounts");
  const collection = database.collection("Accounts-info");
  var numstuff = 0;
  const thingy = await collection.find({ id: String(userId) });
  await thingy.forEach(match => {
    numstuff++;
  });
  if(numstuff>0){
    return
  }

  var mailtex = 'Hello '+username+',\n\nWelcome to Pantheon Meets, a video calling platform with ASL and multi-lingual support. If you have any questions or concerns, please feel free to reach out to us by replying to this email. \n\nSincerely,\nAdvaith Narayanan\nPantheon Meets\nhttps://meets.pantheonlabs.org'

  let mailOptions = {
    from: adminemail,
    to: email,
    subject: 'Welcome to Pantheon Meets!',
    text: mailtex
  };

  await transporter.sendMail(mailOptions);

  console.log("ADDING USER: "+userId+" "+username+" "+email)
  var timenow = new Date().getTime();

  var doc = {
    id: userId,
    username: username,
    email: email,
    pic: profilepic,
    creationDate: timenow
  }
  

  await collection.insertOne(doc);



  // console.log(user);



}

async function addChannel(userId, channelName, channelPassword, res) {
  try {
    console.log("Attempting to connect...")
    await client.connect(mongolink);
    console.log("Connected")
    const database = client.db("Channels");
    const collection = database.collection("Channel-info");
    var numstuff = 0;
    numstuff = 0;
    const thingy = await collection.find({ id: String(userId), channelName: channelName });
    await thingy.forEach(match => {
      numstuff++;
    });
    
    if(numstuff>0){
      await collection.updateOne(
        { id: String(userId), channelName: channelName }, // Filter criteria
        { $set: { channelPassword: channelPassword } } // Update the password
      );

      res.status(605).send({message: "Channel already exists for your account. Updating that one instead"})
      console.log("Channel already exists for your account. Updating that one instead")
      return
    }
    
    numstuff = 0;
    var thingy0 = await collection.find({ id: String(userId) });
    await thingy0.forEach(match => {
      numstuff++;
    });
    if(numstuff>=4){
      console.log("MAX LIMIT REACHED")
      res.status(607).send({message: "Max Channel Limit Reached. Delete a channel to add more"})
      return
    }
    numstuff=0;
    var thingy2 = await collection.find({ channelName: channelName });
    await thingy2.forEach(match => {
      numstuff++;
    });
    if(numstuff>0){
      res.status(606).send({message: "Channel already exists for another user"})
      return
    }

    console.log("ADDING CHANNEL: "+userId+" "+channelName+" "+channelPassword)

    const expirationTime = new Date();
    expirationTime.setSeconds(expirationTime.getSeconds() + expTimeSeconds);

    var doc = {
      id: userId,
      channelName: channelName,
      channelPassword: channelPassword,
      createdAt: new Date(), 
      expireAt: expirationTime
    }

    await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: expTimeSeconds });


    await collection.insertOne(doc);

    // console.log(user);

  } 
  catch(err){
    console.log(err)
  
  } finally {
    // await client.close();
  }
}

async function deleteChannel(channelName, id, res){
  await client.connect(mongolink);
  const database = client.db("Channels");
  const collection = database.collection("Channel-info");
  var doc = {
    id: id,
    channelName: channelName,
  }
  const result = await collection.deleteMany(doc);
  if(result.deletedCount==0){
    res.status(604).send({message: "Channel does not exist"})
    return
  }
  console.log("DELETED CHANNEL: "+channelName+" count"+result.deletedCount)
}

async function deleteAll(){
  // await client.connect(mongolink);
  // const database = client.db("Channels");
  // const collection = database.collection("Channel-info");
  // await collection.deleteMany({});
  // console.log("DELETED EVERYTHING")
}

async function getPassword(channelName){
  try {
    await client.connect(mongolink);
    const database = client.db("Channels");
    const collection = database.collection("Channel-info");
    const thingy = await collection.find({ channelName: channelName });
    const matches = [];
    await thingy.forEach(match => {
      matches.push(match);
    });
    return matches;
  }
  finally {

  }
}

function generateToken(userId) {
  const secretKey = process.env.JWT_KEY;
  const expiration = '1h'; // Token expires in 1 hour

  const payload = { userId };
  const token = jwt.sign(payload, secretKey, { expiresIn: expiration });

  return token;
}

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

console.log("Creating new server instance")
const app = express();

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET, // @TODO : CHANGE THIS LINK to 'https://meets.pantheonlabs.org/auth/google/callback'
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

app.use(cookies());

app.use(session({
  secret: GOOGLE_CLIENT_SECRET, // <-- Add a secret key here
  resave: false,
  saveUninitialized: true, // Ensure session is saved even if it's uninitialized
}));

const publicPath = path.join(__dirname, '..', 'client');
app.use(express.static(publicPath, { index: 'index.html' }));

app.use(passport.initialize());
app.use(passport.session());

// Configure Google Strategy

app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email']})
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    async (req, res) => {      
    const user = {
        id: req.user.id,
        username: req.user.displayName,
        email: req.user.emails[0].value,
        tempname:  req.user.displayName,
        profilepic: req.user.photos[0].value
    };
    var tok = generateToken(req.user.id);
    res.cookie('user', JSON.stringify(user)); // Save user data in a cookie
    res.cookie('tempjwttoken', JSON.stringify({token: tok})); // Save user data in a cookie
    await addUser(user.id, user.username, user.email, user.profilepic);
    res.redirect('/dashboard');
    // res.sendFile(path.join(__dirname, '..', 'client', 'dashboard.html'));
    // res.json(user);
    // await client.close();
    }
);

app.post('/addchan/:uid/:token/:cname/:cpass', async (req, res) => {
  var token = req.params.token;
  var thisid = req.params.uid;
  var uid;
  var thisid;
  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) {
      res.redirect('/auth/google')
      return
    } else {
      uid = decoded.userId;
    }
  });
  if(uid==thisid){
    console.log("UID IN ADDCHAN: "+uid)
    var cname = req.params.cname;
    var cpass = req.params.cpass;
    await addChannel(uid, cname, cpass, res);
  }
  else{
    res.status(401).send('Invalid token');
    return
  }
})

app.post('/getchans/:uid/:token', async (req, res) => {
  var token = req.params.token;
  var thisid = req.params.uid;
  var uid;
  var thisid;
  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) {
      res.status(401).send('Invalid token');
      return
    } else {
      uid = decoded.userId;
    }
  });
  if(uid==thisid){
    console.log("UID IN GETCHANS: "+uid)
    var uinfo = await getUserInfo(uid);
    // console.log("ChanInfo: "+uinfo)
    res.send(uinfo);
  }
  else{
    res.status(401).send('Invalid token');
    return
  }
})

app.post('/delchans/:uid/:token/:cname', async (req, res) => {
  var token = req.params.token;
  var thisid = req.params.uid;
  var uid;
  var thisid;
  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) {
      res.redirect('/auth/google')
      return
    } else {
      uid = decoded.userId;
    }
  });
  if(uid==thisid){
    console.log("UID IN delCHAN: "+uid)
    var cname = req.params.cname;
    deleteChannel(cname, uid, res);
  }
  else{
    res.status(401).send('Invalid token');
    return
  }
})

app.get("/checkpass/:cname/:cpass", async (req, res) => {
  var cname = req.params.cname;
  var cpass = req.params.cpass;
  var uinfo = await getPassword(cname);
  // console.log("ChanInfo: "+uinfo)
  if(uinfo.length==0){
    res.status(404).send({message: "Channel does not exist"})
    return
  }
  if(uinfo[0].channelPassword==cpass){
    res.status(200).send({message: "Correct password"})
  }
  else{
    res.status(401).send({message: "Incorrect password"})
  }
})

app.get('/verifytoken/:token', (req, res) => {
  const token = req.params.token;
  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) {
      res.status(401).send('Invalid token');
    } else {
      var uid = decoded.userId;
      res.status(200).send('Valid token, decoded uid: '+uid);
    }
  });
})

app.get('/deleteall', async (req, res) => {
  await deleteAll();
  res.send("Deleted EVERYTHING (No i didn't lol)");
})

app.get('/meeting/:param', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'meeting.html'));
})



app.get('/dashboard', (req, res) => {
  console.log(req.socket.remoteAddress)
  var token;
  var id;
  try{
    token = JSON.parse(req.cookies.tempjwttoken).token;
    id = JSON.parse(req.cookies.user).id;
  }
  catch{
    console.log("NO TOKEN OR ID FOUND")
    res.redirect('/auth/google')
    return
  }
  if (!token || token==null || token=="") {
    res.redirect('/auth/google')
  }
  else{
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      if (err) {
        console.log("INVALID TOKEN ERROR, AUTHORIZING AGAIN") // INVLAID TOKEN OR EXPIRED
        res.redirect('/auth/google')
      } else {
        var uid = id;
        // console.log("ACTUAL UID: "+id)
        if(id==uid){
          // console.log("Temp token: "+token)
          console.log("VALID TOKEN WITH DECODED UID: "+uid)

          res.sendFile(path.join(__dirname, '..', 'client', 'dashboard.html'));
        }
        else{
          console.log("INVALID TOKEN, authorizing again")
          res.redirect('/auth/google')
        }
      }
    });
  }
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
})

const cors = require('cors');
const {RtcTokenBuilder, RtcRole, RtmTokenBuilder, RtmRole} = require('agora-access-token');

const nocache = (_, resp, next) => {
  resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  resp.header('Expires', '-1');
  resp.header('Pragma', 'no-cache');
  next();
}

const ping = (req, resp) => {
  resp.send({message: 'pong'});
}

const generateRTCToken = (req, resp) => {
  // set response header
  resp.header('Access-Control-Allow-Origin', '*');
  // get channel name
  const channelName = req.params.channel;
  if (!channelName) {
    return resp.status(400).json({ 'error': 'channel is required' });
  }
  // get uid
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(400).json({ 'error': 'uid is required' });
  }
  // get role
  let role;
  if (req.params.role === 'publisher') {
    role = RtcRole.PUBLISHER;
  } else if (req.params.role === 'audience') {
    role = RtcRole.SUBSCRIBER
  } else {
    return resp.status(400).json({ 'error': 'role is incorrect' });
  }
  // get the expire time
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 36000;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  // build the token
  let token;
  console.log(`App ID: ${APP_ID} App certificate: ${APP_CERTIFICATE} ChannelName: ${channelName} uid: ${uid} role ${role} expire ${privilegeExpireTime}`)
  if (req.params.tokentype === 'userAccount') {
    token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
  } else if (req.params.tokentype === 'uid') {
    console.log("building token with Uid")
    token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
    console.log("token: "+token)
  } else {
    return resp.status(400).json({ 'error': 'token type is invalid' });
  }
  // return the token
  return resp.json({ 'rtcToken': token });
}

const generateRTMToken = (req, resp) => {
  // set response header
  resp.header('Access-Control-Allow-Origin', '*');

  // get uid
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(400).json({ 'error': 'uid is required' });
  }
  // get role
  let role = RtmRole.Rtm_User;
   // get the expire time
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  // build the token
  console.log(APP_ID, APP_CERTIFICATE, uid, role, privilegeExpireTime)
  const token = RtmTokenBuilder.buildToken(APP_ID, APP_CERTIFICATE, uid, role, privilegeExpireTime);
  // return the token
  return resp.json({ 'rtmToken': token });
}

const generateRTEToken = async (req, resp) => {
  // set response header

  resp.header('Access-Control-Allow-Origin', '*');
  // get channel name
  const channelName = req.params.channel;
  const pass = req.params.pass;

  var uinfo = await getPassword(channelName);
  // console.log("ChanInfo: "+uinfo)
  if(uinfo.length==0){
    resp.status(404).send({message: "Channel does not exist"})
    return
  }
  if(uinfo[0].channelPassword!=pass){
    resp.status(401).send({message: "Incorrect password"})
    return
    // res.status(200).send({message: "Correct password"})
  }
  if (!channelName) {
    return resp.status(400).json({ 'error': 'channel is required' });
  }
  // get uid
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(400).json({ 'error': 'uid is required' });
  }
  // get role
  let role;
  if (req.params.role === 'publisher') {
    role = RtcRole.PUBLISHER;
  } else if (req.params.role === 'audience') {
    role = RtcRole.SUBSCRIBER
  } else {
    return resp.status(400).json({ 'error': 'role is incorrect' });
  }
  // get the expire time
  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  
  // calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  // build the token
  console.log(`App ID: ${APP_ID} App certificate: ${APP_CERTIFICATE} ChannelName: ${channelName} uid: ${uid} role ${role} expire ${privilegeExpireTime}`)
  const rtcToken = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, RtcRole.PUBLISHER, privilegeExpireTime);//role is 1
  const rtmToken = RtmTokenBuilder.buildToken(APP_ID, APP_CERTIFICATE, uid, role, privilegeExpireTime);
  // return the token
  return resp.json({ 'rtcToken': rtcToken, 'rtmToken': rtmToken, 'appid': APP_ID });
}

app.options('*', cors());
app.get('/ping', nocache, ping)
// app.get('/rtc/:channel/:role/:tokentype/:uid', nocache , generateRTCToken);
// app.get('/rtm/:uid/', nocache , generateRTMToken);
app.get('/rte/:channel/:role/:tokentype/:uid/:pass', nocache , generateRTEToken);

app.get('/gettoken', nocache, (req, res) => {
  res.send({message: generateToken('117390884650221056112')});
})

app.get('*', function(req, res){
    res.status(404).sendFile(path.join(__dirname, '..', 'client', 'error.html'));
});

module.exports = app