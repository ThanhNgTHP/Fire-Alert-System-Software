const express = require('express');
var WebSocket = require('ws');
const {connectDatabase, addDatabase} = require('./database');

const app = express();
var server = app.listen(3000, ()=>{
    console.log('server listening on port 3000');
});

var arduinoDeviceState = {
    buttonState: "TAT",
    buzzerState: "IM",
    motionSensorState: "kCD"
};

var ws = new WebSocket.Server({server});
var clients = [];

connectDatabase();

function getDateTimeNow(){
    const date = new Date(Date.now());

    // Tháng bắt đầu từ 0
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

ws.on('connection', (socket, req)=>{
    
    clients.push({
        socket,
        req
    });

    receiveRequest(socket, (client, message)=>{
        // chỉ có 1 esp 
    }, (client, message)=>{

        console.log(`browser: ` + message.buttonState);
        console.log(`browser: ` + message.buzzerState);
        console.log(`browser: ` + message.motionSensorState);

        client.socket.send(message.buttonState);
        client.socket.send(message.buzzerState);
        client.socket.send(message.motionSensorState);
    }, (client, message)=>{},
    arduinoDeviceState);

    console.log(`connection`);
    
    socket.on('message', (message)=>{
        receiveRequest(socket, receiveRequestESP, receiveRequestBrowser, (client, message)=>{}, message);
    });

    socket.on('close', ()=>{
        
        clients = clients.filter((client)=>{
            return client.socket != socket;
        });

        console.log(`${getDateTimeNow()} : disconnect`);
    });

    socket.on('error', ()=>{
        console.log(`${getDateTimeNow()} : error`);
    });
});


function broadcastSendRequest(socket, sendRequestESP, sendRequestBrowser, sendRequestSharp, message, exception = ()=>{}){
    clients.forEach((client)=>{
        if(client.socket != socket){
            const user_agent = client.req.headers['user-agent'];

            if(user_agent.includes('Chrome')){
                sendRequestBrowser(client, message);
            }
            else if(user_agent.includes('arduino')){
                sendRequestESP(client, message);
            }
            else if(user_agent.includes('websocket-sharp')){
                sendRequestSharp(client, message);
            }
            else{
                exception();
            }
        }
    });
}

function receiveRequestESP(client, message) {

    arduinoDeviceState = JSON.parse(message);

    console.log(`${getDateTimeNow()}: ${arduinoDeviceState.buttonState} ${arduinoDeviceState.buzzerState} ${arduinoDeviceState.motionSensorState}`);
    addDatabase(arduinoDeviceState);
    
    broadcastSendRequest(client.socket, (client, message)=>{ 
       // chỉ có một esp
    }, 
    (client, message)=>{ // message == arduinoDeviceState
        client.socket.send(message.buttonState);
        client.socket.send(message.buzzerState);
        client.socket.send(message.motionSensorState);
    }, (client, message)=>{},
    arduinoDeviceState);
} 

function receiveRequestBrowser(client, message) {
    broadcastSendRequest(client.socket, (client, message)=>{
        var data = {
            command: message,
        };
                
        var json = JSON.stringify(data); // Chuyển đổi thành chuỗi
    
        client.socket.send(json);
    }, 
    (client, message)=>{
        client.socket.send(message);
    }, ()=>{client, message}, 
    message.toString());
} 


function receiveRequest(socket, receiveRequestESP, receiveRequestBrowser, receiveRequestSharp, message, exception = ()=>{}) {
    clients.forEach((client)=>{
        if(client.socket == socket){
            const user_agent = client.req.headers['user-agent'];
            if(user_agent.includes('Chrome')){
                receiveRequestBrowser(client, message);
            }
            else if(user_agent.includes('arduino')){
                receiveRequestESP(client, message);
            }
            else if(user_agent.includes('websocket-sharp')){
                receiveRequestSharp(client, message);
            }
            else{
                exception();
            }
        }
    }); 
}