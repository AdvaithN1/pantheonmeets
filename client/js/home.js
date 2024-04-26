const userCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('user='));

if (userCookie) {
    
    const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
    if(userData.username){
        document.getElementById('logintxt').innerText = `Welcome, ${userData.username}!`;
        document.getElementById('loginbtnstuff').href = '';
        document.getElementById('signoutlink').style.display = 'block';
        document.getElementById('signoutlink').addEventListener('click', () => {
            document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
            location.reload();
        })
    }
    else{
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

