const userCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('user='));

if (userCookie) {
    
    const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
    if(userData.username){ // CHECKING IF USER IS LOGGED IN (because username will exist for logged in user)
        document.getElementById('logintxt').innerText = `Welcome, ${userData.username}!`;
        document.getElementById('loginbtnstuff').href = '';
        document.getElementById('signoutlink').style.display = 'block';
        document.getElementById('signoutlink').addEventListener('click', () => {
            document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
            location.reload();
        })
    }
    else{ // USER NOT LOGGED IN
        document.getElementById('signoutlink').style.display = 'none';
        document.getElementById('logintxt').innerHTML = 'Login with Google';
        document.getElementById('loginbtnstuff').href = '/auth/google';
    }
    document.getElementById('usernameInp').value = userData.tempname;
}
else{
    document.getElementById('logintxt').innerHTML = 'Login with Google';
    document.getElementById('loginbtnstuff').href = '/auth/google';
    document.getElementById('signoutlink').style.display = 'none';
}



document.getElementById('join-meeting-btn').addEventListener("click", handler, false);
												
document.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        handler();
    }
});

function handler(event) {
    newUsername = document.getElementById("usernameInp").value;
    if(newUsername == ""){
        return;
    }
    const userCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('user='));
    if (userCookie) {
        const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
        userData.tempname=newUsername
        const updatedUserDataString = JSON.stringify(userData);
        document.cookie = `user=${encodeURIComponent(updatedUserDataString)}; path=/`;
    }
    else{
        const rand = ""+Math.ceil(Math.random()*1000000000)+Math.ceil(Math.random()*1000000000)
        const userData = {
            tempname: newUsername,
            id: rand,
            email: "None"
        }
        const userDataString = JSON.stringify(userData);
        document.cookie = `user=${encodeURIComponent(userDataString)}; path=/`;
    }
    console.log("NEXT PRESSED");
    const input = document.getElementById("meetingID");
    const inputValue = input.value;
    if(inputValue==""){
        return;
    }
    window.location.replace("/meeting/" + inputValue);
}
