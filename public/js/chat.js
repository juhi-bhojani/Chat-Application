const socket = io()

// elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $sendLocation = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

// templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

socket.on("message",(text)=>{
    const html = Mustache.render(messageTemplate,{
        user:text.username,
        message:text.text,
        createdAt:moment(text.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML("beforeend",html)
})

socket.on("locationMessage",(text)=>{
    const html = Mustache.render(locationTemplate,{
        user:text.username,
        link:text.url,
        createdAt:moment(text.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML("beforeend",html)
})

socket.on("roomData",({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener("submit",(e)=>{
    e.preventDefault()
    // disable submitting form as processing is ongoing
    $messageFormButton.setAttribute("disabled","disabled")

    const message = e.target.elements.message.value
    // the 3rd function is a callback function which runs when server acknowledges that msg was recived
    socket.emit("sendMessage",message,(err)=>{
        // enable form again as form is working again
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ""
        $messageFormInput.focus()

        if(err){
            return console.log(err)
        }
        console.log("message delivered!")
    })
})

$sendLocation.addEventListener("click",()=>{
    if(!navigator.geolocation){
        return alert("Unable to get your location")
    }

    $sendLocation.setAttribute("disabled","disabled")
    navigator.geolocation.getCurrentPosition((position)=>{
        const coords = {
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        }
        socket.emit("sendLocation",coords,()=>{
            // enable button again
            $sendLocation.removeAttribute("disabled")
            console.log("Location shared!")
        })

    })
})

socket.emit("join",{username,room},(error)=>{
    if(error){
        alert(error)
        location.href = "/"
    }
})