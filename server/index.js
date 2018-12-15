//Port config
const PORT = 8080;

//Requires and main server objects
const redis = require('redis');
const redisClient = redis.createClient();
const express = require("express");
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(PORT);

app.use(express.static("dist"));

//This object will contain all the channels being listened to.
const global_channels = {};

//Server Logic goes here
io.on('connection', function(socketconnection){

  //All the channels this connection subscribes to
  socketconnection.connected_channels = {}

  socketconnection.on('message', message => {


    Object.keys(socketconnection.connected_channels).forEach(channel_name => {
      // store the state in redis
      redisClient.get(channel_name, function(err, response) {
        if(response) {
          response = JSON.parse(response);
          let data = {
            text: this.text || response.text,
            lastChangedByUser: this.lastChangedByUser || response.lastChangedByUser,
            lockAcquiredBy: this.lockAcquiredBy || response.lockAcquiredBy
          }

          console.log("response got here", response)
          console.log("data", data)
          console.log("saving upar channel_name", channel_name);
          redisClient.set(channel_name, JSON.stringify(data));
        }
      }.bind(message));

      Object.keys(global_channels[channel_name].listeners).forEach(function(key){
        global_channels[channel_name].listeners[key].send(message);
      });
    })
  });

  //Subscribe request from client
  socketconnection.on('subscribe', function(channel_name){
    //Set up Redis Channel
    if (global_channels.hasOwnProperty(channel_name)){
      //If channel is already present, make this socket connection one of its listeners
      global_channels[channel_name].listeners[socketconnection.id] = socketconnection;

      // get the board state from redis
      redisClient.get(channel_name, (err, response) => {
        console.log("response while sending", response)
        let data = JSON.parse(response);
        data.type = "init";
        console.log("data there", data)
        if(response) socketconnection.send(data);
      });
    }
    else{
      console.log("it is a new board")
      //Else, initialize new Redis Client as a channel and make it subscribe to channel_name
      global_channels[channel_name] = redis.createClient();
      global_channels[channel_name].subscribe(channel_name);
      global_channels[channel_name].listeners = {};
      //Add this connection to the listeners
      global_channels[channel_name].listeners[socketconnection.id] = socketconnection;
      //Tell this new Redis client to send published messages to all of its listeners
      global_channels[channel_name].on('message', function(channel, message){
        Object.keys(global_channels[channel_name].listeners).forEach(function(key){
          global_channels[channel_name].listeners[key].send(message);
        });
      });
    }

    socketconnection.connected_channels[channel_name] = global_channels[channel_name];
    let data = {
      text: "",
      lastChangedByUser: null,
      lockAcquiredBy: null
    }

    // store the state in redis
    console.log("saveingchannel_name", channel_name);
    redisClient.set(channel_name, JSON.stringify(data));
  });

  //Unsubscribe request from client
  socketconnection.on('unsubscribe', function(message){
    let channel_name = message.board;
    let user = message.user;
    if (socketconnection.connected_channels.hasOwnProperty(channel_name)){
      redisClient.get(channel_name, function(err, response) {
        if(response) {
          response = JSON.parse(response);
          if(response.lockAcquiredBy === user) response.lockAcquiredBy = null;

          redisClient.set(channel_name, JSON.stringify(response));
        }
      }.bind(message));
      //If this connection is indeed subscribing to channel_name
      //Delete this connection from the Redis Channel's listeners
      delete global_channels[channel_name].listeners[socketconnection.id];
      //Delete channel from this connection's connected_channels
      delete socketconnection.connected_channels[channel_name];
    }
  });

  //Disconnect request from client
  socketconnection.on('disconnect', function(){
    //Remove this connection from listeners' lists of all channels it subscribes to
    Object.keys(socketconnection.connected_channels).forEach(function(channel_name) {
      delete global_channels[channel_name].listeners[socketconnection.id];
    });
  });
});
