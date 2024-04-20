const express = require('express');
const path = require('path');
const dotenv = require('dotenv'); 
dotenv.config();

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

console.log(APP_ID, APP_CERTIFICATE)
const app = express();

const publicPath = path.join(__dirname, '..', 'client');
app.use(express.static(publicPath, { index: 'index.html' }));

// const server = http.createServer((req, res) => {})

app.get('/meeting/:param', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'meeting.html'));
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'templ.html'));
})

const PORT = process.env.PORT || 3002;

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
    expireTime = 36000;
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

const generateRTEToken = (req, resp) => {
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
  console.log(`App ID: ${APP_ID} App certificate: ${APP_CERTIFICATE} ChannelName: ${channelName} uid: ${uid} role ${role} expire ${privilegeExpireTime}`)
  const rtcToken = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, RtcRole.PUBLISHER, privilegeExpireTime);//role is 1
  const rtmToken = RtmTokenBuilder.buildToken(APP_ID, APP_CERTIFICATE, uid, role, privilegeExpireTime);
  // return the token
  return resp.json({ 'rtcToken': rtcToken, 'rtmToken': rtmToken, 'appid': APP_ID });
}

const rootDirectory = '../client'; // Change this to your root directory


app.options('*', cors());
app.get('/ping', nocache, ping)
app.get('/rtc/:channel/:role/:tokentype/:uid', nocache , generateRTCToken);
app.get('/rtm/:uid/', nocache , generateRTMToken);
app.get('/rte/:channel/:role/:tokentype/:uid', nocache , generateRTEToken);


app.get('*', function(req, res){
    res.status(404).sendFile(path.join(__dirname, '..', 'client', 'error.html'));
});

// const httpServer = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

module.exports = app