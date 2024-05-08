const userCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('user='));
const tokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('tempjwttoken='));
async function getDashboardData() {
    console.log("USERCOOKIE: "+userCookie.id);
    console.log("TOKENCOOKIE: "+tokenCookie.token);

    if (userCookie && tokenCookie) {
        const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
        const userToken = JSON.parse(decodeURIComponent(tokenCookie.split('=')[1]));
        console.log("USER DATA: "+userData);
        console.log("TOKEN DATA: "+userToken)

        var imgElement = document.getElementById('profilePic');
        imgElement.src = userData.profilepic;

        var response = await fetch("/getchans/"+userData.id+"/"+userToken.token, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })
        response = await response.json()
        const el = document.getElementById('thingy');
        console.log(response)
        el.appendChild(document.createTextNode(JSON.stringify(response)));

        // AT THIS POINT CHANNELS HAVE BEEN LOADED

        var addChanBtn = document.getElementById("addChanBtn");
        var inpId = document.getElementById("inpId");
        var inpPass = document.getElementById("inpPass");

        addChanBtn.addEventListener("click", async function(){
            var chanID = inpId.value;
            var chanPass = inpPass.value;

            var response = await fetch("/addchan/"+userData.id+"/"+userToken.token+"/"+chanID+"/"+chanPass, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
            })

            if(response.status==606){
                window.alert("Channel already exists for another user");
            }

            if(response.status==605){
                window.alert("Channel already exists for your account. Updating that one instead");
            }

            if(response.status==607){
                window.alert("Max Channel Limit Reached. Delete a channel to add more");
            }

            

            // el.appendChild(document.createTextNode(JSON.stringify(response)));
        })

        var delChanBtn = document.getElementById("delChan");
        var inpDelChan = document.getElementById("inpChanDel");

        delChanBtn.addEventListener("click", async function(){
            var chanID = inpDelChan.value;

            var response = await fetch("/delchans/"+userData.id+"/"+userToken.token+"/"+chanID, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
            })
            if(response.status==604){
                window.alert("Channel does not exist");
            }
            console.log(response)
            // el.appendChild(document.createTextNode(JSON.stringify(response)));
        })
    }

    else{
        console.log("NO USER COOKIE");
        window.location.replace("/");
    }
}
getDashboardData();