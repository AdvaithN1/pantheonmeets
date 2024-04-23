let APP_ID = ""

var socket;

// import {
//     HandLandmarker,
//     FilesetResolver
//   } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

let handLandmarker = undefined;
let runningMode = "VIDEO";
var timer;

const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: runningMode,
      numHands: 1 // CHANGE THIS
    });
    await handLandmarker.setOptions({ runningMode: "VIDEO" });
};


import('./tasks-vision/vision_bundle.mjs').then(x => {
    HandLandmarker=x.HandLandmarker;
    FilesetResolver=x.FilesetResolver;
    createHandLandmarker();
    },
    err => {
        console.error("ERROR IN IMPORTING VISION BUNDLE: "+err);
    }
)


const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'});


var signalingEngine = null;
let channel;

let localTracks = [];
let remoteUsers = {};

var recogStopped = true

let username = "";

var externalWhiteboardTrigger = false;

let speechRestartAttempts = 0;
const maxSpeechRestartAttempts = 300;

const url = window.location.href;
const pathSegments = url.split("/");
const meetingId = pathSegments[pathSegments.length - 1];

var isScreenShared = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

var whiteboardOpen = false;

var whiteboardArr = [];

var canvas;
var dpr = window.devicePixelRatio || 1;
var ctx;

var currentcaps
var currentspeak

var langDict = {
    "1": "en-US",
    "2": "es-ES",
    "3": "fr-FR",
    "4": "zh-CN",
    "5": "ar-EG",
}

var currentlang = "en-US";


// Pusher.logToConsole = true;
// var pusher;
// var pusherChan;

// async function initiatePusher(){
//     pusher = await new Pusher('290cff21990128325751', {
//         cluster: 'us3',
//         channelAuthorization: { endpoint: "/pusher/auth"}  
//       });

//     pusherChan = await pusher.subscribe('presence-my-channel');

//     await pusherChan.bind('client-my-event', function(data) {
//         console.error(JSON.stringify(data));
//     });

//     setInterval(function() {
//         pusherChan.trigger('client-my-event', {channel: channel, text: 'message sent FROM CLIENT HERE'});
//     }, 1000);
// }

// initiatePusher();
    //         pusherChan.trigger('client-my-event', {channel: channel, text: 'message sent FROM CLIENT HERE'});
    //     }, 1000);

setInterval(function() {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/recog", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("dat", "hello world");
    
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                console.log(xhr.responseText); // Print received data
            } else {
                console.error('Error:', xhr.responseText);
            }
        }
    };
    
    xhr.send(JSON.stringify({}));
}, 1000);

document.getElementById('join-meeting-btn').addEventListener('click', () => {
    username = document.getElementById('username').value;
    if(username==""){
        return
    }
    // Hide the login form and show the video area
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('stream-wrapper').style.display = 'block';
    document.getElementById('stream-controls').style.display = 'flex';
    document.getElementById('erase-btn').style.display = 'none';
    document.getElementById('save-btn').style.display = 'none';
    joinStream(meetingId); 
});


function startSpeechRecognition() {
    document.querySelector(".lang") 
		.addEventListener("change", function(evt){ 
            console.error("LANGUAGE CHANGED TO: "+langDict[evt.target.value])
            currentlang = langDict[evt.target.value]
			recognition.lang = langDict[evt.target.value]
            try{
                recognition.stop();
                recognition.start();
            }
            catch(err){}
	}) 

    recogStopped = false
    recognition.lang = currentlang; // Set the language as needed en-US
    console.log("CHANGING LANG IN START RECOG")

    recognition.onresult = (event) => { // This used to be after recognition.start
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            // if(transcript!=""){updateCaptions(transcript)}
            if (event.results[i].isFinal && transcript!="") {
                updateCaptions(transcript);
            } else {
                interimTranscript += transcript;
            }
        }
        // Optionally display interim results
        // document.getElementById("interimCaptions").innerText = interimTranscript;
    };

    recognition.onended = (event) => {
        console.error("SPEECH RECOG ENDED")
        speechRestartAttempts++
        if(speechRestartAttempts<maxSpeechRestartAttempts && !recogStopped){
            startSpeechRecognition()
        }
    }

    recognition.start();

    recognition.onerror = (event) => {
        // console.error('Speech recognition error:', event.error, ' Attempting to restart');
        speechRestartAttempts++
        if(speechRestartAttempts<maxSpeechRestartAttempts){
            try{
                recognition.start();
            }
            catch(err){}
        }
    };
}

function stopSpeechRecognition() {
    recogStopped = true
    recognition.stop();
}


async function updateCaptions(newCaptions) {
    const captionsContainer = document.getElementById("captions");

    captionsContainer.innerHTML = captionsContainer.innerHTML + "\n\n<br>"+`${username}: ${newCaptions}</br>\n`;
    
    /*
    const scrollCaps = document.getElementsByClassName("capContainer2");

    const currentPosition = captionsContainer.scrollTop;    
    console.error("CURRENT POSITION: "+ currentPosition);
    
    for (const scrollCap of scrollCaps) {        
        scrollCap.scroll(0, scrollCap.scrollHeight);    
    }*/

    
    for (const userId in remoteUsers) {
        try { 
            console.error("TRYING TO SEND MESSAGE TEXT: "+`${username}: ${newCaptions}`+" TO USER: "+userId);
            // await signalingEngine.sendMessageToPeer(meetingId, newCaptions);
            await channel.sendMessage({text: `${username}: ${newCaptions}`}, userId);
        } catch (err) {
        console.error("PUBLISH MESSAGE ERROR: "+err);
        }
    }
}
function spam() {
    for (i = 0; i < 100; i++) {
        updateCaptions("SPAM");
    }
}

async function updateCaptionsCustom(newCaptions) {
    const captionsContainer = document.getElementById("captions");

    captionsContainer.innerHTML = captionsContainer.innerHTML + "\n\n<br>"+`\n${newCaptions}</br>`;

    for (const userId in remoteUsers) {
        try { 
            console.error("TRYING TO SEND MESSAGE TEXT: "+`\n${newCaptions}\n`+" TO USER: "+userId);
            // await signalingEngine.sendMessageToPeer(meetingId, newCaptions);
            await channel.sendMessage({text: newCaptions}, userId);
        } catch (err) {
        console.error("PUBLISH MESSAGE ERROR: "+err);
        }
    }
}

function updateExternalCaptions(user, caps){
    const captionsContainer = document.getElementById("captions");
    captionsContainer.innerText = captionsContainer.innerText+"\n"+caps;

    if ((user == "Yufan Wang" || user == "Advaith")&& (caps == "okay" || caps == "Yufan Wang: okay")) {
        var audioPlayer = document.getElementById("audioPlayer");
        audioPlayer.play();
    }

    captionsContainer.innerHTML = captionsContainer.innerHTML + "\n\n<br>"+`${username}: ${newCaptions}</br>\n`;
    

    const scrollCaps = document.getElementsByClassName("capContainer2");

    /*
    const currentPosition = captionsContainer.scrollTop;    
    console.error("CURRENT POSITION: "+ currentPosition);
    
    for (const scrollCap of scrollCaps) {        
        scrollCap.scroll(0, scrollCap.scrollHeight);    
    }*/
}

// setInterval(() => {
//     const exampleCaptions = " [ASL]: This is an example caption. " + Date.now();
//     updateCaptions(exampleCaptions); 
//   }, 5000); 

let joinAndDisplayLocalStream = async (meetingId, token, rtmtoken) => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);
    client.on('user-unpublished', handleUserUnpublished);
    console.log("joining with client...");
    let UID = await client.join(APP_ID, meetingId, token, username); //meetingId used to be Channel ("main")  client.join(APP ID, CHANNEL_NAME, TOKEN)
    console.log("UID: "+UID);
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    let player = `<div class="video-container" id="user-container-${UID}">
                        <div class="video-player" id="user-${UID}">
                            <div class="user-uid">Username: ${username} (You)</div> 
                        </div>
                        <canvas class="output_canvas" id="output_canvas"></canvas>
                  </div>`;

    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);

    localTracks[1].play(`user-${UID}`);

    await client.publish([localTracks[0], localTracks[1]]);

    startSpeechRecognition();



    //INITIALIZING MESSAGING SYSTEM
    // signalingEngine = new AgoraRTM.RTM(APP_ID, username, { token: rtmtoken });
    signalingEngine = AgoraRTM.createInstance(APP_ID);
    
    try{
        // await signalingEngine.login({'uid':username, 'token':token})
        // RTM TOKEN IS UNDEFINED
        await signalingEngine.login({token: rtmtoken, uid: username});// GIVES ERROR
    }

    catch(err){
        console.error({ err }, 'ERROR AT LOGIN.'); 
    }

    channel = signalingEngine.createChannel(meetingId);
    await channel.join() 

    // channel.on('message', (eventArgs) => {
    //     // console.log(`${eventArgs.publisher}: ${eventArgs.message}`);
    //     updateExternalCaptions(eventArgs.publisher, eventArgs.message);
    //     console.error("RECEIVED MESSAGE: "+eventArgs);
    // })
    // channel.on('MessageFromPeer', (eventArgs) => {
    //     updateExternalCaptions(eventArgs.publisher, eventArgs.message);
    //     console.error("RECEIVED MESSAGE: "+eventArgs);
    // })



    channel.on('ChannelMessage', ({
        text
    }, senderId) => {
        console.error("RECEIVED MESSAGE: "+text)
        console.error("SENDER ID: "+senderId)
        if(text.trim() == "Whiteboard closed by "+senderId){
            if(whiteboardOpen){
                console.error("TOGGLING WHITEBOARD EXTERNALLY")
                // toggleWhiteboard();
                externalWhiteboardTrigger = true;
                const get= document.getElementById('whiteboard-btn');  
                get.click();  
                
                updateExternalCaptions(senderId, text)
                return
            }
        }
        if(text.trim() == "Whiteboard opened by "+senderId){
            if(!whiteboardOpen){
                console.error("TOGGLING WHITEBOARD EXTERNALLY")
                // toggleWhiteboard();
                externalWhiteboardTrigger = true
                const get= document.getElementById('whiteboard-btn');  
                get.click();  
                updateExternalCaptions(senderId, text)
                return
            }
        }
        if(text.trim() == senderId+" joined the call."){
            if(whiteboardOpen){
                console.error("TOGGLING WHITEBOARD DUE TO USER JOIN")
                updateExternalCaptions(senderId, text+" Closing whiteboard due to user joining.");
                externalWhiteboardTrigger = true
                const get= document.getElementById('whiteboard-btn');  
                get.click();
                return
            }
            updateExternalCaptions(senderId, text);
        }
        try{
            tempArr = JSON.parse(JSON.parse(text).whiteboardArr);
            for(var i = 0; i < tempArr.length; i++){
                item = tempArr[i].text
                console.error("THIS SHOULD BE A WHITEBOARD UPDATE LIST: "+JSON.stringify(item))
                if (item.drawing == true) {
                    if (item.erasing == true) {
                        console.log("Erasing for others.");
                        color = "#FFFFFF";
                        ctx.strokeStyle = "#FFFFFF";
                        try{
                            ctx.lineWidth = 50;
                        }
                        catch(err){
                            console.error("ERROR IN ERASING LINEWIDTH: "+err);
                        }
                        ctx.beginPath();
                        ctx.moveTo(item.lastPosNow.x, item.lastPosNow.y);
                        ctx.lineTo(item.mousePosNow.x, item.mousePosNow.y);
                        ctx.stroke();
                        item.lastPosNow = item.mousePosNow;
                        ctx.closePath();
                        if(canvas!=null){
                            dataUrl = canvas.toDataURL();
                        }
                    }
                    else {
                        console.log("Drawing for others.");
                        try{
                            ctx.lineWidth = 4;
                        }
                        catch(err){
                            console.error("ERROR IN Drawing LINEWIDTH: "+err);
                        }
                        ctx.strokeStyle = item.color;
                        ctx.beginPath();
                        ctx.moveTo(item.lastPosNow.x, item.lastPosNow.y);
                        ctx.lineTo(item.mousePosNow.x, item.mousePosNow.y);
                        ctx.stroke();
                        item.lastPosNow = item.mousePosNow;
                        ctx.closePath();
                        if(canvas!=null){
                            dataUrl = canvas.toDataURL();
                        }
                    }
                }
            }
        }

        catch(err){
            console.error("ERROR IN JSON PARSING: "+err);
            updateExternalCaptions(senderId, text);
        }
    });
    
    const captionsContainer = document.getElementById("captions");
    captionsContainer.innerText += `\n${username} joined the call.`;

    for (const userId in remoteUsers) {
        try { 
            // console.error("TRYING TO SEND MESSAGE TEXT: "+`${username}: ${newCaptions}`+" TO USER: "+userId);
            await channel.sendMessage({text: `${username} joined the call.`}, userId);
        } catch (err) {
        console.error("PUBLISH MESSAGE ERROR: "+err);
        }
    }
}

let joinStream = async () => {
    console.log("Username: "+username);
    const response = await fetch(`/rte/${meetingId}/publisher/uid/${username}`);  // CHANGE 0 TO ${meetingId}
    const data = await response.json();
    const token = data.rtcToken;
    const rtmtoken = data.rtmToken;
    APP_ID = data.appid;

    await joinAndDisplayLocalStream(meetingId, token, rtmtoken);

    document.getElementById('stream-controls').style.display = 'flex';
}

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    // updateCaptions(`USER JOINED ${mediaType}`);
    await client.subscribe(user, mediaType);

    if (mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`);
        if (player != null){
            player.remove();
        }

        player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}">
                            <div class="user-uid">Username: ${user.uid}</div> 
                        </div> 
                 </div>`

        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

        user.videoTrack.play(`user-${user.uid}`)
    }

    if (mediaType === 'audio'){
        user.audioTrack.play()
    }
}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let handleUserUnpublished = async (user, mediaType) => {
    if(mediaType == 'audio'){
        return
    }

    delete remoteUsers[user.uid]
    // document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
    stopSpeechRecognition();
    const lan = document.getElementById('language');
    const capsT = document.getElementById('captionTitle');
    const chat = document.getElementById('chatbox');
    const caps = document.getElementById('captions');
    const capsC = document.getElementById('captions-column');
    lan.style.opacity = '0';
    caps.style.opacity = '0';
    capsC.style.opacity = '0';
    capsT.style.opacity = '0';
    chat.style.opacity = '0';

    if(isScreenShared){
        toggleScreenShare();
    }
    
    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    try{const currentPosition = captionsContainer.scrollTop;
    console.error("CURRENT POSITION: "+ currentPosition)

    for (const scrollCap of scrollCaps) {
        scrollCap.scroll(0, scrollCap.scrollHeight);
    }
        await client.leave()
        
        await channel.leave()
        await signalingEngine.logout()
    }
    
    catch(err){
        console.error(err)
    }

    remoteUsers = []

    // document.getElementById('join-btn').style.display = 'block'
    document.getElementById('stream-controls').style.display = 'none'
    document.getElementById('video-streams').innerHTML = ''

    document.getElementById('login-form').style.display = 'block';
    document.getElementById('stream-wrapper').style.display = 'none';
}

let toggleMic = async (e) => {
    if (localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.innerText = 'Mic On'
        e.target.style.backgroundColor = '#3D5154'
        e.target.style.border = '3px solid transparent'
        e.target.style.color = 'white'

        startSpeechRecognition();
    }else{
        await localTracks[0].setMuted(true)
        e.target.innerText = 'Mic Off'
        e.target.style.backgroundColor = 'transparent'
        e.target.style.border = '3px solid #EE4B2B'
        e.target.style.color = '#EE4B2B';
        // toggleCamera()
        // toggleCamera()

        stopSpeechRecognition();
    }
}

let toggleCamera = async (e) => {
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.innerText = 'Camera On'
        e.target.style.backgroundColor = '#3D5154'
        e.target.style.border = '3px solid transparent'
        e.target.style.color = 'white'
    }
    else{
        await localTracks[1].setMuted(true)
        e.target.innerText = 'Camera Off'
        e.target.style.backgroundColor = 'transparent'
        e.target.style.border = '3px solid #EE4B2B'
        e.target.style.color = '#EE4B2B';
    }
}

let toggleScreenShare = async (e) => {
    if(isScreenShared){
        // for(let i = 0; localTracks.length > i; i++){
        //     localTracks[i].stop()
        //     localTracks[i].close()
        // }


        var localTracks2 = localTracks;

        isScreenShared = false;

        e.target.innerText = 'Screenshare';
        e.target.style.backgroundColor = '#3D5154'
        e.target.style.border = '3px solid transparent'
        e.target.style.color = 'white'
        
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        // chrome
        client.unpublish(localTracks2);

        document.getElementById(`user-container-${username}`).remove();

        document.getElementById('camera-btn').style.display = 'block';
        
        let player = `<div class="video-container" id="user-container-${username}">
                        <div class="video-player" id="user-${username}">
                            <div class="user-uid">Username: ${username} (You)</div> 
                        </div>
                  </div>`

        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
        // for(let i = 0; localTracks.length > i; i++){
        //     localTracks[i].play(`user-${username}`)
        // }
        localTracks[1].play(`user-${username}`)
        // localTracks[1].play(`user-${UID}`)
        // localTracks[0].play(`user-${UID}`)

        await client.publish([localTracks[0], localTracks[1]])
    }

    else{
        videoTrack = localTracks[1]

        try{
            localTracks[1] = await AgoraRTC.createScreenVideoTrack()
            localTracks[1].onended = function () {
                toggleScreenShare()
            };
            client.unpublish(videoTrack)
        }
        catch(err){
            console.error(`ERROR FOR SCREEN SHARING: ${err}`)
            updateCaptions(`ERROR FOR SCREEN SHARING: ${err}`)
            return
        }

        isScreenShared = true
        
        e.target.innerText = 'Stop Screenshare'
        e.target.style.backgroundColor = 'transparent'
        e.target.style.border = '3px solid #EE4B2B'
        e.target.style.color = '#EE4B2B';
        
        // for(let i = 0; localTracks.length > i; i++){
        //     localTracks[i].stop()
        //     localTracks[i].close()
        // }

        document.getElementById(`user-container-${username}`).remove();

        document.getElementById('camera-btn').style.display = 'none';

        let player = `<div class="video-container" id="user-container-${username}">
            <div class="video-player" id="user-${username}">
                <div class="user-uid">Username: ${username} (You)</div> 
            </div>
        </div>`

        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
        // for(let i = 0; localTracks.length > i; i++){
        //     localTracks[i].play(`user-${username}`)
        // }
        localTracks[1].play(`user-${username}`)

        // localTracks[1].play(`user-${UID}`)
        // localTracks[0].play(`user-${UID}`)
        
        await client.publish(localTracks[1])
        
    }
}

// Color Variable
var color = "#000000";

// Set up the canvas
// var canvas = document.getElementById("whiteboard-canvas");
// var dpr = window.devicePixelRatio || 1;
// var ctx = canvas.getContext("2d");
// ctx.canvas.width = window.innerWidth * dpr;
// ctx.canvas.height = window.innerHeight * dpr;
// ctx.strokeStyle = color;
// ctx.lineWidth = 4;
// Color Variable


// Get the position of the mouse relative to the canvas
function getMousePos(canvasDom, mouseEvent) {
    var rect = canvasDom.getBoundingClientRect(); // rect.width, rect.height
    var totx = window.screenX;
    var toty = window.screenY;
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
    };
    
}

// Set up mouse events for drawing
var drawing = false;
var erasing = false;
var x, y;
var mousePos = { x: x, y: y };
var lastPos = mousePos;

// Get the position of a touch relative to the canvas
function getTouchPos(canvasDom, touchEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: 2 * (touchEvent.touches[0].clientX - rect.left),
        y: touchEvent.touches[0].clientY - rect.top
    };
}

// Prevent scrolling when touching the canvas
document.body.addEventListener("touchstart", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, false);

document.body.addEventListener("touchend", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, false);

document.body.addEventListener("touchmove", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, false);

var dataUrl;

// Get a regular interval for drawing to the screen
window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimaitonFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Draw to the canvas
function renderCanvas() {
    if (drawing) {
        console.error("CTX: "+ctx)
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        lastPos = mousePos;
        ctx.closePath();
    }
}

// Allow for animation
(function drawLoop() {
    requestAnimFrame(drawLoop);
    renderCanvas();
})();

// Color picker stroke color
function changeColor() {
    erasing = false;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    document.getElementById("colorPicker").click();
    document.getElementById("colorPicker").onchange = function () {
        color = this.value;
        console.log("Color changed to: " + color);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
    }
}

let toggleWhiteboard = async (e) => {
    if(whiteboardOpen){
        e.target.innerText = 'Start Whiteboard';
        e.target.style.backgroundColor = '#3D5154'
        e.target.style.border = '3px solid transparent'
        e.target.style.color = 'white'
        

        console.error("WHITEBOARD CLOSED: "+dataUrl)
        if(externalWhiteboardTrigger){
            externalWhiteboardTrigger = false;
        }
        else{
            updateCaptionsCustom("Whiteboard closed by "+username)
        }

        whiteboardOpen = false;
        
        document.getElementById('whiteboard').style.display = 'none';
        document.getElementById('erase-btn').style.display = 'none';
        document.getElementById('save-btn').style.display = 'none';
    }
    else{
        whiteboardOpen = true;

        if(externalWhiteboardTrigger){
            externalWhiteboardTrigger = false;
        }
        else{
            updateCaptionsCustom("Whiteboard opened by "+username)
        }
        e.target.innerText = 'Stop Whiteboard'
        e.target.style.backgroundColor = 'transparent'
        e.target.style.border = '3px solid #EE4B2B'
        e.target.style.color = '#EE4B2B';

        document.getElementById('erase-btn').style.display = 'flex';
        document.getElementById('save-btn').style.display = 'flex';

        let whiteboard = `<div class="video-container" id="whiteboard">
        <canvas id="whiteboard-canvas" class="video-player white"></canvas>
        </div>`

        if(document.getElementById('whiteboard') == null) {
            console.error("CREATING NEW WHITEBOARD")
            document.getElementById('video-streams').insertAdjacentHTML('beforeend', whiteboard)
            document.getElementById('whiteboard').style.display = "initial";
        }
        else {
            document.getElementById('whiteboard').style.display = "initial";
        }
        
        var canvas = document.getElementById("whiteboard-canvas");
        var dpr = window.devicePixelRatio || 1;
        console.error("GETTING CTX")

        ctx = canvas.getContext("2d");
        console.error(ctx);
        ctx.canvas.width = document.getElementById('whiteboard').clientWidth * dpr;
        ctx.canvas.height = document.getElementById('whiteboard').clientHeight * dpr;
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;

        canvas.addEventListener("mousedown", function () {
            // Mouse Move
            canvas.addEventListener("mousemove", function () {
                if (drawing == true) {
                    // Mouse Positions
                    var lastPosNow = { x: lastPos.x, y: lastPos.y };
                    var mousePosNow = { x: mousePos.x, y: mousePos.y };
                    // Final Message
                    var finalMsg = { lastPosNow: lastPosNow, mousePosNow: mousePosNow, drawing: drawing, color: color, erasing: erasing };
                    // console.log(finalMsg);
                    msg = { description: 'Coordinates where drawing is taking place.', messageType: 'TEXT', rawMessage: undefined, text: finalMsg }
                    whiteboardArr.push(msg);
                    // channel.sendMessage(msg).then(() => {
                    //     console.log("Your message was: " + JSON.stringify(finalMsg) + " by " + accountName);
                    // }).catch(error => {
                    //     console.log("Message wasn't sent due to an error: ", error);
                    // });
                }
            });
        });


        canvas.addEventListener("mousedown", function (e) {
            drawing = true;
            lastPos = getMousePos(canvas, e);
            canvas.addEventListener("mousemove", function (e) {
                mousePos = getMousePos(canvas, e);
            }, false);
            dataUrl = canvas.toDataURL();
        }, false);
        canvas.addEventListener("mouseup", function (e) {
            drawing = false;
            dataUrl = canvas.toDataURL();
        }, false);

        // Set up touch events for mobile, etc
        canvas.addEventListener("touchstart", function (e) {
            mousePos = getTouchPos(canvas, e);
            var touch = mousePos[0];
            var mouseEvent = new MouseEvent("mousedown", {
                clientX: touch[0],
                clientY: touch[1]
            });
            canvas.dispatchEvent(mouseEvent);
        }, false);
        canvas.addEventListener("touchend", function (e) {
            var mouseEvent = new MouseEvent("mouseup", {});
            canvas.dispatchEvent(mouseEvent);
            dataUrl = canvas.toDataURL();
        }, false);
        canvas.addEventListener("touchmove", function (e) {
            var touch = mousePos[0];
            var mouseEvent = new MouseEvent("mousemove", {
                clientX: touch[0],
                clientY: touch[1]
            });
            canvas.dispatchEvent(mouseEvent);
        }, false);
        dataUrl = canvas.toDataURL();
    }
}

// Eraser
function startErasing() {
    color = "#FFFFFF";
    console.log("Erasing.");
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 50;
    erasing = true;
}

function stopErasing() {
    color = "#000000";
    console.log("Stopped erasing.");
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    erasing = false;
}

let toggleErase = async (e) => {
    if(erasing){
        stopErasing();
        e.target.innerText = 'Start Erasing';
        e.target.style.backgroundColor = '#3D5154'
        e.target.style.border = '3px solid transparent'
        e.target.style.color = 'white'
    }
    else{
        startErasing();
        e.target.innerText = 'Stop Erasing';
        e.target.style.backgroundColor = 'transparent'
        e.target.style.border = '3px solid #EE4B2B'
        e.target.style.color = '#EE4B2B';
    }
}

function sendWhiteboard () {
    if(whiteboardArr.length > 0){
        for (const userId in remoteUsers) {
            console.error("ATTEMPTING TO SEND WHITEBOARD INFO OF LENGTH "+whiteboardArr.length)
            channel.sendMessage({text: JSON.stringify({"whiteboardArr": JSON.stringify(whiteboardArr)}), description: 'Coordinates where drawing is taking place.', messageType: 'TEXT', rawMessage: undefined})
        }
    }
    whiteboardArr.length = 0;
}

var interval = setInterval(function () { 
    sendWhiteboard(); 
    // console.error("UPDATING WHITEBOARD IN SET INTERVAL")
}, 1);



function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    link.remove()
  }

let saveWhiteboard = async (e) => {
    // downloadURI(dataUrl, "whiteboard.png");
    navigator.clipboard.writeText(dataUrl)
}


function drawConnectors(recogCtx, landmarks, options){

    
    console.error("DRAWING CONNECTORS in DRAWCONNECTORS")
    var fro = landmarks[0];
    // console.error(fro)
    for(var i = 1; i<=4; i++){ // Drawing thumb
        fro=landmarks[i-1];
        t=landmarks[i];
        drawLine(recogCtx, fro, t, options)
    }

    // var data_aux = [];
    // for (let landmark in landmarks) {
    //     x_.append(landmark[0]);
    //     y_.append(landmark[1]);
    // }

    // for (let landmark in landmarks) {
    //     data_aux.append(landmark[0] - min(x_));
    //     data_aux.append(landmark[1] - min(y_));
    // }

    

    drawLine(recogCtx, landmarks[0], landmarks[5], options) // Drawing pointer finger
    drawLine(recogCtx, landmarks[5], landmarks[6], options)
    drawLine(recogCtx, landmarks[6], landmarks[7], options)
    drawLine(recogCtx, landmarks[7], landmarks[8], options)

    drawLine(recogCtx, landmarks[5], landmarks[9], options)
    drawLine(recogCtx, landmarks[9], landmarks[13], options)
    drawLine(recogCtx, landmarks[13], landmarks[17], options)
    drawLine(recogCtx, landmarks[0], landmarks[17], options)

    drawLine(recogCtx, landmarks[9], landmarks[10], options)// Middle Finger
    drawLine(recogCtx, landmarks[10], landmarks[11], options)
    drawLine(recogCtx, landmarks[11], landmarks[12], options)

    drawLine(recogCtx, landmarks[13], landmarks[14], options)// Ring Finger
    drawLine(recogCtx, landmarks[14], landmarks[15], options)
    drawLine(recogCtx, landmarks[15], landmarks[16], options)

    drawLine(recogCtx, landmarks[17], landmarks[18], options)// Pinky Finger
    drawLine(recogCtx, landmarks[18], landmarks[19], options)
    drawLine(recogCtx, landmarks[19], landmarks[20], options)

    // for(const connection of landmarks){
    //     const t = connection;
    //     if (fro && t) {
    //         recogCtx.lineWidth = options.lineWidth;
    //         recogCtx.strokeStyle = options.color;
    //         recogCtx.beginPath();
    //         recogCtx.moveTo(fro.x*recogCtx.canvas.width, fro.y*recogCtx.canvas.height);
    //         recogCtx.lineTo(t.x*recogCtx.canvas.width, t.y*recogCtx.canvas.height);
    //         recogCtx.stroke();
    //     }
    // }
}

function drawLine(ct, landmark1, landmark2, options){
    fro=landmark1;
    t=landmark2;
    ct.lineWidth = options.lineWidth;
    ct.strokeStyle = options.color;
    ct.beginPath();
    // let {width, height} = localTracks[1].getSettings()
    // let canwidth = ct.canvas.width
    // let canheight = ct.canvas.height
    

    //const vid = document.getElementsByClassName("agora_video_player");

    ct.moveTo(ct.canvas.width-fro.x*ct.canvas.width, fro.y*ct.canvas.height);
    ct.lineTo(ct.canvas.width-t.x*ct.canvas.width, t.y*ct.canvas.height);
    // ct.moveTo(ct.canvas.width-fro.x*ct.canvas.width, fro.y*ct.canvas.height);
    // ct.lineTo(ct.canvas.width-t.x*ct.canvas.width, t.y*ct.canvas.height);
    ct.stroke();

    // ct.beginPath();
    // ct.arc(fro.x*ct.canvas.width, fro.y*ct.canvas.height, 5, 0, 2 * Math.PI);
    // ct.fillStyle = "red";
    // ct.fill();
    // // ct.lineWidth = 4;
    // // ct.strokeStyle = "blue";
    // ct.stroke();
}


let lastVideoTime = -1;
let results = undefined
async function predictWebcam() {
    var canvasRecog;
    var recogCtx;
    try{
        canvasRecog = document.getElementById(
            "output_canvas"
        );
        recogCtx = canvasRecog.getContext("2d");
    } catch(err){
        // console.error("ERROR IN GETTING CANVAS CONTEXT HAND RECOG: "+err)
        window.requestAnimationFrame(predictWebcam);
        return
    }

    let startTimeMs = performance.now();
    // if (lastVideoTime !== localTracks[1].currentTime) {
    //     lastVideoTime = localTracks[1].currentTime;
    //     results = handLandmarker.detectForVideo(localTracks[1], startTimeMs);
    // }
    imgSource = localTracks[1].getCurrentFrameData();
    results = handLandmarker.detectForVideo(imgSource, startTimeMs);

    recogCtx.save();
    recogCtx.clearRect(0, 0, canvasRecog.width, canvasRecog.height);
    if (results.landmarks) {
        for (const landmarks of results.landmarks) { // Each landmarks is a hand
            // console.error("LANDMARKS FOUND")
            drawConnectors(recogCtx, landmarks, {
            color: "#00FF00",
            lineWidth: 2
        });
        drawLandmarks(recogCtx, landmarks, {color: "#FF0000", lineWidth: 2});
        }
    } else{
        console.error("NO LANDMARKS FOUND")
    }
    // recogCtx.restore();
    // window.requestAnimationFrame(predictWebcam);
}

var intervalPredict = setInterval(function () { 
    predictWebcam(); 
}, 10);

// document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('screenshare-btn').addEventListener('click', toggleScreenShare)
document.getElementById('whiteboard-btn').addEventListener('click', toggleWhiteboard)
document.getElementById('erase-btn').addEventListener('click', toggleErase)
document.getElementById('save-btn').addEventListener('click', saveWhiteboard)