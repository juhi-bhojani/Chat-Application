const express = require("express")
const http = require("http")
const path = require("path")
// const {Filter} = require("bad-words")
// this module returns a function
const socket = require("socket.io")
const {generateMessage,generateLocationMessage} = require("./utils/messages")
const {addUser,removeUser,getUser,getUsersInRoom} = require("./utils/users")


const publicDirectoryPath = path.join(__dirname,"../public")

const app = express()
const server =http.createServer(app)
const io = socket(server)

app.use(express.static(publicDirectoryPath))

// app.get("/",(req,res)=>{
//     res.send()
// })

let count = 0

// listening to connection event
io.on("connection",(socket)=>{
    // console.log("New web socket connection!")

    

    socket.on("join",(options,callback)=>{
        // add user
        const {error,user} = addUser({id:socket.id,...options})

        if(error){
            return callback(error)
        }

        // allows us to join a particular room
        socket.join(user.room)

        // emitting an event
        socket.emit("message",generateMessage("admin","Welcome!!!"))

        // emitting event to all other than the newly joined client
        // will emit this to everyone in the room
        socket.broadcast.to(user.room).emit('message',generateMessage("admin",`${user.username} has joined!`))


        // Emitting information about room to all users
        io.to(user.room).emit("roomData",{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })

    // listening to event
    socket.on("sendMessage",(data,callback)=>{
        const user = getUser(socket.id)
        
        if(data.includes("fuck")){
            return callback("Profanity isn't allowed!")
        }
        // emitting event to all the available connection
        io.to(user.room).emit("message",generateMessage(user.username,data))
        // calling callback in order to acknowledge that message was recieved
        callback()
    })

    // builtin event
    socket.on("disconnect",()=>{
        // remove user here
        const user = removeUser(socket.id)

        if(user){
            // as current user is disconnected and hence won't recieve message
            io.emit("message",generateMessage("admin",`${user.username} has left the chat!`))

            // Emitting information about room to all users
            io.to(user.room).emit("roomData",{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }

        
    })

    // snedlocation event
    socket.on("sendLocation",(coords,callback)=>{
        const user = getUser(socket.id)
        const url = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
        io.to(user.room).emit("locationMessage",generateLocationMessage(user.username,url))
        callback()
    })
})


server.listen(3000,()=>{
    console.log("Server is up and running")
})

// websocts allow for full duplex communication
// web socket proctocol is quite different from http
// Provides persistent connection between client and server 