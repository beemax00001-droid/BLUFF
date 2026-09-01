import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    get,
    update,
    onValue,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


// ================= FIREBASE =================

const firebaseConfig = {
    apiKey: "AIzaSyDGeaJMGgZVUH4f9rAZCvHJQEMY1H_FTSw",
    authDomain: "bluff-7fe92.firebaseapp.com",
    databaseURL: "https://bluff-7fe92-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "bluff-7fe92",
    storageBucket: "bluff-7fe92.firebasestorage.app",
    messagingSenderId: "428194636094",
    appId: "1:428194636094:web:887077ab81757d499ccc6f"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// ================= STATE =================

let currentUser = null;
let roomId = "";
let playerNumber = 0;
let playerName = "";
let currentRound = 1;


// ================= HELPERS =================

const $ = (id) => document.getElementById(id);


function showScreen(id){

    document
    .querySelectorAll(".screen")
    .forEach(s => s.classList.add("hidden"));

    const el = $(id);

    if(el){
        el.classList.remove("hidden");
    }
}


function generateRoomCode(){

    const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for(let i=0;i<6;i++){

        code += chars[
            Math.floor(Math.random()*chars.length)
        ];

    }

    return code;
}


// ================= LOGIN =================


signInAnonymously(auth);


onAuthStateChanged(auth,user=>{

    if(user){

        currentUser = user;

        if($("connectionStatus")){
            $("connectionStatus").textContent =
            "🟢 متصل به سرور";
        }

    }

});


// ================= CREATE ROOM =================


$("createRoomBtn").onclick = async()=>{


    playerName =
    $("playerName").value.trim();


    if(!playerName){

        alert("اسم وارد کن");

        return;
    }


    if(!currentUser){

        alert("اتصال هنوز آماده نیست");

        return;
    }


    roomId = generateRoomCode();

    playerNumber = 1;


    await set(
        ref(db,`rooms/${roomId}`),
        {

            status:"waiting",

            round:1,

            players:{

                player1:{

                    uid:currentUser.uid,

                    name:playerName,

                    score:0
                }

            },

            createdAt:serverTimestamp()

        }
    );


    openLobby();

};



// ================= JOIN ROOM =================


$("joinRoomBtn").onclick = async()=>{


    playerName =
    $("playerName").value.trim();


    const code =
    $("roomCodeInput")
    .value.trim()
    .toUpperCase();


    if(!playerName || !code){

        alert("اطلاعات ناقصه");

        return;
    }


    const roomRef =
    ref(db,`rooms/${code}`);


    const snap =
    await get(roomRef);


    if(!snap.exists()){

        alert("اتاق پیدا نشد");

        return;
    }


    const room =
    snap.val();


    if(room.players.player2){

        alert("اتاق پره");

        return;
    }


    roomId = code;

    playerNumber = 2;


    await update(
        roomRef,
        {

            "players/player2":{

                uid:currentUser.uid,

                name:playerName,

                score:0

            },

            status:"ready"

        }
    );


    openLobby();

};



// ================= LOBBY =================


function openLobby(){


    showScreen("lobby");


    $("roomCodeDisplay").textContent =
    roomId;


    $("lobbyRoomCode").textContent =
    roomId;


    listenRoom();

}



function listenRoom(){


    onValue(
        ref(db,`rooms/${roomId}`),
        snap=>{


            if(!snap.exists()) return;


            const room =
            snap.val();


            $("player1Name").textContent =
            room.players.player1?.name || "---";


            $("player2Name").textContent =
            room.players.player2?.name ||
            "منتظر حریف...";


            if(
                room.players.player1 &&
                room.players.player2
            ){

                $("lobbyMessage").textContent =
                "🔥 هر دو بازیکن آماده‌اند";

                setTimeout(()=>{

                    startGame(room);

                },1000);

            }

        }
    );

}
// ================= START ROUND =================


function startGame(room){

    currentRound = room.round || 1;


    $("roundNumber").textContent =
    currentRound;


    const writer =
    currentRound % 2 === 1 ? 1 : 2;


    if(playerNumber === writer){

        showScreen("write");

    }else{

        showScreen("guess");

        waitForStatements();

    }

}



// ================= SUBMIT STATEMENTS =================


$("submitStatementsBtn").onclick =
async ()=>{


    const s1 =
    $("sentence1").value.trim();


    const s2 =
    $("sentence2").value.trim();


    const s3 =
    $("sentence3").value.trim();



    if(!s1 || !s2 || !s3){

        alert("هر سه جمله رو بنویس");

        return;
    }



    await update(

        ref(
            db,
            `rooms/${roomId}/rounds/${currentRound}`
        ),

        {

            writer:playerNumber,


            statements:{

                1:s1,

                2:s2,

                3:s3

            },


            state:"chooseLie"

        }

    );



    showScreen("chooseLie");


    showLieButtons([
        s1,
        s2,
        s3
    ]);

};




// ================= CHOOSE LIE =================


function showLieButtons(list){


    const box =
    $("myStatements");


    box.innerHTML="";



    list.forEach((text,index)=>{


        const btn =
        document.createElement("button");


        btn.className="choice";


        btn.textContent =
        `${index+1} - ${text}`;



        btn.onclick=()=>{

            chooseLie(index+1);

        };



        box.appendChild(btn);


    });

}





async function chooseLie(number){


    await update(

        ref(
            db,
            `rooms/${roomId}/rounds/${currentRound}`
        ),

        {

            lie:number,

            state:"waitingGuess"

        }

    );



    alert("دروغ ثبت شد 🔒");


}



// ================= WAIT STATEMENTS =================


function waitForStatements(){


    onValue(

        ref(
            db,
            `rooms/${roomId}/rounds/${currentRound}`
        ),


        snap=>{


            if(!snap.exists())
            return;


            const data =
            snap.val();



            if(
                data.statements &&
                data.state==="waitingGuess"
            ){

                showOpponentStatements(
                    data.statements
                );

            }


        }

    );


}




function showOpponentStatements(data){


    const box =
    $("opponentStatements");


    box.innerHTML="";



    [1,2,3].forEach(i=>{


        const btn =
        document.createElement("button");



        btn.className="choice";


        btn.textContent =
        `${i} - ${data[i]}`;



        btn.onclick=()=>{

            makeGuess(i);

        };



        box.appendChild(btn);


    });

}
// ================= INITIAL GUESS =================


async function makeGuess(number){


    await update(

        ref(
            db,
            `rooms/${roomId}/rounds/${currentRound}`
        ),

        {

            guess:number,

            state:"chat"

        }

    );


    openChat();

}




// ================= CHAT =================


function openChat(){


    showScreen("chat");


    listenMessages();

}




function listenMessages(){


    onValue(

        ref(
            db,
            `rooms/${roomId}/rounds/${currentRound}/messages`
        ),


        snap=>{


            const box =
            $("chatMessages");


            box.innerHTML="";



            snap.forEach(item=>{


                const msg =
                item.val();



                const div =
                document.createElement("div");


                div.className =
                msg.player === playerNumber
                ? "message mine"
                : "message";



                div.textContent =
                msg.text;



                box.appendChild(div);


            });


        }

    );

}




$("sendMessageBtn").onclick =
async ()=>{


    const input =
    $("messageInput");


    const text =
    input.value.trim();



    if(!text)
    return;



    await set(

        push(

            ref(
                db,
                `rooms/${roomId}/rounds/${currentRound}/messages`
            )

        ),

        {

            player:playerNumber,

            text:text,

            time:serverTimestamp()

        }

    );



    input.value="";


};




// ================= FINAL GUESS =================


$("finalGuessBtn").onclick =
async ()=>{


    const answer =
    prompt(
        "شماره جمله دروغ را وارد کن (1 تا 3)"
    );



    if(
        !["1","2","3"].includes(answer)
    )
    return;



    const snap =
    await get(

        ref(
            db,
            `rooms/${roomId}/rounds/${currentRound}`
        )

    );



    const round =
    snap.val();



    const correct =
    Number(answer) === Number(round.lie);



    const player =
    `players/player${playerNumber}/score`;



    const room =
    await get(
        ref(db,`rooms/${roomId}`)
    );


    const old =
    room.val()
    .players[`player${playerNumber}`]
    .score || 0;



    const updates = {};



    if(correct){

        updates[player] =
        old + 1;

    }



    updates[
    `rounds/${currentRound}/result`
    ] = correct;



    updates[
    `rounds/${currentRound}/state`
    ] = "result";



    await update(

        ref(db,`rooms/${roomId}`),

        updates

    );



    showResultPage(correct,round);


};




// ================= RESULT =================


function showResultPage(correct,round){


    showScreen("result");



    $("resultIcon").textContent =
    correct ? "🎯" : "😂";



    $("resultTitle").textContent =
    correct
    ? "درست حدس زدی!"
    : "گولت زد!";



    $("resultDescription").textContent =
    `جمله شماره ${round.lie} دروغ بود`;

}
// ================= NEXT ROUND =================


$("nextRoundBtn").onclick =
async ()=>{


    const next =
    currentRound + 1;



    if(next > 10){

        finishGame();

        return;

    }



    currentRound = next;



    await update(

        ref(
            db,
            `rooms/${roomId}`
        ),

        {

            round:currentRound,

            status:"ready"

        }

    );



    startGame({

        round:currentRound

    });


};





// ================= FINISH GAME =================


async function finishGame(){


    const snap =
    await get(
        ref(db,`rooms/${roomId}`)
    );


    const room =
    snap.val();



    const p1 =
    room.players.player1;


    const p2 =
    room.players.player2;



    $("finalPlayer1").textContent =
    p1.name;


    $("finalScore1").textContent =
    p1.score || 0;



    $("finalPlayer2").textContent =
    p2.name;


    $("finalScore2").textContent =
    p2.score || 0;




    if(
        p1.score > p2.score
    ){

        $("winnerTitle").textContent =
        "🏆 بازیکن ۱ برنده شد";

    }
    else if(
        p2.score > p1.score
    ){

        $("winnerTitle").textContent =
        "🏆 بازیکن ۲ برنده شد";

    }
    else{

        $("winnerTitle").textContent =
        "🤝 مساوی شدید";

    }



    showScreen("final");


}




// ================= COPY ROOM =================


$("copyRoomBtn").onclick =
async ()=>{


    await navigator.clipboard
    .writeText(roomId);



    $("copyRoomBtn").textContent =
    "✅ کپی شد";



    setTimeout(()=>{

        $("copyRoomBtn").textContent =
        "📋 کپی کد";

    },1500);



};