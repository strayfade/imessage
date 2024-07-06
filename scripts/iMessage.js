// Private globals
var GlobalSocket;
var CurrentChatNumber;
var ChatsOffset;
var WebsocketURL;
var Password;

const SupportJavascriptInterfaces = true

const Refresh = () => {
    ConnectToServer();
}

const GetTime = (time) => {
    return ((Ts) => {
        const Dt = new Date(Ts)
        return `${Dt.getHours() > 12 ? Dt.getHours() - 12 : (Dt.getHours() == 0 ? 12 : Dt.getHours())}:${((Pad) => {
            if (Pad.toString().length == 1)
                Pad = "0" + Pad
            return Pad
        })(Dt.getMinutes())} ${Dt.getHours() < 12 ? "AM" : "PM"}`
    })(time)
}

const SearchContacts = () => {
    let AllContacts = document.getElementById("homepage-contacts").childNodes
    let Search = document.getElementsByClassName("search-box")[0].value
    for (let i = 0; i < AllContacts.length; i++) {
        let ContactName = AllContacts[i].childNodes[1].childNodes[1].childNodes[0].textContent
        AllContacts[i].style.display = ContactName.includes(Search) ? "flex" : "none"
    }
}

const ConnectToServer = () => {
    return new Promise((resolve) => {

        // Create socket
        GlobalSocket = new WebSocket(WebsocketURL)

        // Socket event listener for connection
        GlobalSocket.onopen = async () => {
            document.getElementById("server-connection-status").style.opacity = "1"
            document.getElementById("server-connection-status").style.color = "var(--accent-2)"
            document.getElementById("server-connection-status").textContent = "Connected"
            await new Promise(r => setTimeout(r, 100));
            GlobalSocket.send(JSON.stringify({
                action: "fetchChats",
                data: {
                    offset: "0",
                    limit: "50"
                },
                password: Password
            }))
            ReloadServerInfo()

            resolve({
                notification: `Connected to server!`
            })
        }

        GlobalSocket.onerror = (error) => {
            document.getElementById("server-connection-status").style.opacity = "1"
            document.getElementById("server-connection-status").style.color = "var(--accent-3)"
            document.getElementById("server-connection-status").textContent = "Errored"
            resolve({
                notification: `An error occurred while connecting: ${error.toString()}`
            })
        }

        GlobalSocket.onclose = (event) => {
            document.getElementById("server-connection-status").style.opacity = "1"
            document.getElementById("server-connection-status").style.color = "var(--accent-3)"
            document.getElementById("server-connection-status").textContent = "Disconnected"
            resolve({
                notification: event.wasClean ? `Server connection closed successfully.` : `Connection to server lost!`
            })
        }

        GlobalSocket.onmessage = async (event) => {
            document.getElementById("server-connection-status").style.opacity = "1"
            document.getElementById("server-connection-status").style.color = "var(--accent-2)"
            document.getElementById("server-connection-status").textContent = "Active"
            const json = JSON.parse(await event.data.text())
            ProcessResponse(json)
        }
    })
}

const SaveSettings = () => {
    let Host = document.getElementById("settings-option-host").value
    let Port = document.getElementById("settings-option-port").value
    let UseHTTPS = document.getElementById("settings-option-usehttps").getAttribute("checked") == "true"
    let Password = document.getElementById("settings-option-password").value
    let SettingsObj = {
        host: Host,
        port: Port,
        useHttps: UseHTTPS,
        password: Password
    }
    Password = SettingsObj.password
    let UIPrivate = document.getElementById("settings-option-useprivacymode").getAttribute("checked") == "true"
    let SettingsObj2 = {
        uiPrivate: UIPrivate
    }
    document.documentElement.style.setProperty("--privacy-blur", UIPrivate ? "5px" : "0px")
    let TempWebsocketURL = `${UseHTTPS ? "wss" : "ws"}://${Host}:${Port}/auth=${((len) => {
        let out = ""
        for (let x = 0; x < len; x++)
            out += "•"
        return out;
    })(Password.length)}`
    document.getElementById("settings-option-showurl").innerHTML = `Socket address: ${TempWebsocketURL}`
    localStorage.setItem("serverSettings", JSON.stringify(SettingsObj))
    localStorage.setItem("clientSettings", JSON.stringify(SettingsObj2))
}



const GetFile = async (Path = "/") => {
    let ServerSettings = JSON.parse(localStorage.getItem("serverSettings"))
    if (ServerSettings) {
        let Host = ServerSettings.host
        let Port = ServerSettings.port
        let UseHTTPS = ServerSettings.useHttps
        let Password = ServerSettings.password

        // Authenticate against API
        const Payload = `/var/mobile/Library/SMS/Attachments/..././..././..././..././..././.../.`
        const SendEndpoint = `${UseHTTPS ? "https" : "http"}://${Host}:${Port}/attachments?path=${encodeURIComponent(`${Payload}${Path}`)}&type=${encodeURIComponent("text/plain")}&auth=${encodeURIComponent(Password)}&transcode=0`;  // Replace with your API endpoint‰

        const Res = await (await fetch(SendEndpoint, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US',
                'Access-Control-Request-Headers': 'authorization,content-type',
                'Access-Control-Request-Method': 'POST',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) webmessage/0.7.0 Chrome/87.0.4280.141 Electron/11.4.2 Safari/537.36',
                'Origin': 'app://.'
            }
        })).text()
        return Res
    }
}

const ParsePlist = (Plist, Key) => {
    let Search = `<key>${Key}</key>`
    let Data = Plist.substring(Plist.indexOf(Search) + Search.length).trim().split("\n")[0]
    Data = Data.substring(Data.indexOf(">") + 1)
    return Data.substring(0, Data.indexOf("<"))
}

const ReloadServerInfo = async () => {
    const Plist = await GetFile("/System/Library/CoreServices/SystemVersion.plist")
    document.getElementById("server-connection-version").textContent = ParsePlist(Plist, "ProductVersion")
    document.getElementById("server-connection-copyright").textContent = ParsePlist(Plist, "ProductCopyright")
}

const LoadSettings = async () => {
    let ServerSettings = JSON.parse(localStorage.getItem("serverSettings"))
    if (ServerSettings) {
        document.getElementById("settings-option-host").value = ServerSettings.host
        document.getElementById("settings-option-port").value = ServerSettings.port
        document.getElementById("settings-option-usehttps").setAttribute("checked", ServerSettings.useHttps ? "true" : "false")
        document.getElementById("settings-option-password").value = ServerSettings.password
        WebsocketURL = `${ServerSettings.useHttps ? "wss" : "ws"}://${ServerSettings.host}:${ServerSettings.port}/auth=${ServerSettings.password}`
        Password = ServerSettings.password
        ConnectToServer()
    }
    let ClientSettings = JSON.parse(localStorage.getItem("clientSettings"))
    if (ClientSettings) {
        document.getElementById("settings-option-useprivacymode").setAttribute("checked", ClientSettings.uiPrivate ? "true" : "false")
        document.documentElement.style.setProperty("--privacy-blur", ClientSettings.uiPrivate ? "5px" : "0px")
    }
}
LoadSettings();

const TestServerConnection = () => {
    let Settings = JSON.parse(localStorage.getItem("serverSettings"))
    let Host = Settings.host
    let Port = Settings.port
    let Password = Settings.password
    let UseHTTPS = Settings.useHttps
    if (GlobalSocket.OPEN)
        GlobalSocket.close();
    try {
        WebsocketURL = `${UseHTTPS ? "wss" : "ws"}://${Host}:${Port}/auth=${Password}`
        document.getElementById("server-connection-status").style.opacity = "1"
        document.getElementById("server-connection-status").style.color = "var(--accent)"
        document.getElementById("server-connection-status").textContent = "Connecting..."
        ConnectToServer();
    }
    catch {

    }
}

const HideReactionPopups = () => {
    while (document.getElementsByClassName("reaction-popup")[0])
        document.getElementsByClassName("reaction-popup")[0].remove();
    document.getElementsByClassName("backdrop-blur")[0].classList.add('backdrop-blur-hidden')
}

const ShowSettings = () => {
    document.getElementById("page0").classList.add("page-view-fallback")
    document.getElementById("page1").classList.add("page-view-fallback")
    document.getElementById("settings-page").classList.remove("page-view-popup-hidden")
}
const HideSettings = () => {
    document.getElementById("page0").classList.remove("page-view-fallback")
    document.getElementById("page1").classList.remove("page-view-fallback")
    document.getElementById("settings-page").classList.add("page-view-popup-hidden")
}

const Checkboxes = document.getElementsByClassName("settings-option-checkbox")
for (let l = 0; l < Checkboxes.length; l++) {
    if (Checkboxes[l].getAttribute("checked") == "true")
        Checkboxes[l].classList.add("settings-option-checkbox-checked")
    Checkboxes[l].addEventListener("click", () => {
        if (Checkboxes[l].getAttribute("checked") == "true") {
            Checkboxes[l].setAttribute("checked", "false")
            Checkboxes[l].classList.remove("settings-option-checkbox-checked")
        }
        else {
            Checkboxes[l].setAttribute("checked", "true")
            Checkboxes[l].classList.add("settings-option-checkbox-checked")
        }
        SaveSettings();
    })
}

let MessageContainer = document.getElementById("messages-container")

const GetMessages = async (Phone, Offset = 0, Limit = 250) => {
    if (!GlobalSocket.OPEN)
        GlobalSocket = new WebSocket(WebsocketURL)
    if (GlobalSocket) {
        GlobalSocket.send(JSON.stringify({
            action: "fetchMessages",
            data: {
                id: Phone.toString(),
                offset: Offset.toString(),
                limit: Limit.toString()
            },
            password: Password
        }))
    }
    ChatsOffset = Offset
    await new Promise(r => setTimeout(r, 100));
    GlobalSocket.send(JSON.stringify({
        action: "fetchChats",
        data: {
            offset: "0",
            limit: "50"
        },
        password: Password
    }))
}

const MarkAsRead = (Phone) => {
    if (!GlobalSocket.OPEN)
        GlobalSocket = new WebSocket(WebsocketURL)
    if (GlobalSocket) {
        GlobalSocket.send(JSON.stringify({
            action: "markAsRead",
            data: {
                chatId: Phone
            },
            password: Password
        }))
    }
}

const AddReaction = (GUID, ReactionId) => {
    if (!GlobalSocket.OPEN)
        GlobalSocket = new WebSocket(WebsocketURL)
    if (GlobalSocket)
        GlobalSocket.send(JSON.stringify({
            action: "sendReaction",
            data: {
                chatId: CurrentChatNumber,
                guid: GUID,
                reactionId: ReactionId,
                part: 0
            },
            password: Password
        }))
}

// Typing statuses
var CurrentTypingStatus = false
const UpdateTypingStatus = () => {
    if (CurrentTypingStatus != (document.getElementById("message-input").value.toString().length > 0)) {
        if (!GlobalSocket.OPEN)
            GlobalSocket = new WebSocket(WebsocketURL)
        if (GlobalSocket) {
            GlobalSocket.send(JSON.stringify({
                action: "setIsLocallyTyping",
                data: {
                    chatId: CurrentChatNumber,
                    typing: document.getElementById("message-input").value.toString().length > 0
                },
                password: Password
            }))
        }
        CurrentTypingStatus = (document.getElementById("message-input").value.toString().length > 0)
    }
}
document.getElementById("message-input").addEventListener("keyup", () => {
    UpdateTypingStatus();
})

// Send texts
let LastMessageSent;
const SendMessage = async () => {
    let TextMessage = document.getElementById("message-input").value
    document.getElementById("message-input").value = ""
    document.activeElement = null

    // Create dummy element
    let Bubbles = CreateMessageBubble(false, {}, TextMessage, 1, true);
    for (const Bubble of Bubbles) {
        LastMessageSent = Bubble
        MessageContainer.append(Bubble)
        MessageContainer.scrollTop = MessageContainer.scrollHeight;
        Bubble.classList.add("message-visible")
    }

    let ServerSettings = JSON.parse(localStorage.getItem("serverSettings"))
    if (ServerSettings) {
        let Host = ServerSettings.host
        let Port = ServerSettings.port
        let UseHTTPS = ServerSettings.useHttps
        let Password = ServerSettings.password

        // Authenticate against API
        const SendEndpoint = `${UseHTTPS ? "https" : "http"}://${Host}:${Port}/sendText`;  // Replace with your API endpoint‰

        const A1 = await fetch(SendEndpoint, {
            method: 'OPTIONS',
            headers: {
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US',
                'Access-Control-Request-Headers': 'authorization,content-type',
                'Access-Control-Request-Method': 'POST',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) webmessage/0.7.0 Chrome/87.0.4280.141 Electron/11.4.2 Safari/537.36',
                'Origin': 'app://.'
            },
            body: JSON.stringify()
        })

        const A2 = await fetch(SendEndpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) webmessage/0.7.0 Chrome/87.0.4280.141 Electron/11.4.2 Safari/537.36',
                'Content-Type': 'application/json;charset=UTF-8',
                'Origin': 'app://.'
            },
            body: JSON.stringify({
                text: TextMessage,
                attachments: [],
                address: CurrentChatNumber,
                subject: null,
            })
        })
    }
}
document.getElementById("message-input").addEventListener("keydown", (ev) => {
    if (ev.keyCode == 13)
        SendMessage()
})

let PopupOpen = false;
const CreateMessageBubble = (TypingIndicator = false, MessageJSON = {}, Message = "", Sender = 0, AddTail = true) => {
    let OutMessages = []

    if (!TypingIndicator) {
        if (MessageJSON.text == "\ufffc") {
            const Attachments = MessageJSON.attachments
            for (const Attachment of Attachments) {
                let MessageContentItem = document.createElement("img")
                MessageContentItem.addEventListener("load", () => {
                    MessageContainer.scrollTop = MessageContainer.scrollHeight;
                })
                MessageContentItem.setAttribute("rawJSON", JSON.stringify(MessageJSON))
                MessageContentItem.className = "message"
                MessageContentItem.classList.add("message-media")
                MessageContentItem.classList.add(Sender ? "message-sender" : "message-recipient")
                let ServerSettings = JSON.parse(localStorage.getItem("serverSettings"))
                if (ServerSettings) {
                    let Host = ServerSettings.host
                    let Port = ServerSettings.port
                    let UseHTTPS = ServerSettings.useHttps
                    let Password = ServerSettings.password
                    MessageContentItem.src = `${UseHTTPS ? "https" : "http"}://${Host}:${Port}/attachments?path=${encodeURIComponent(Attachment[0])}&type=${encodeURIComponent(Attachment[1])}&auth=${Password}&transcode=1`
                }
                OutMessages.push(MessageContentItem)
            }
        }
    }

    let MessageContentItem = document.createElement("div")
    MessageContentItem.setAttribute("rawJSON", JSON.stringify(MessageJSON))
    MessageContentItem.className = "message"
    MessageContentItem.classList.add(Sender ? "message-sender" : "message-recipient")
    if (TypingIndicator) {
        MessageContentItem.innerHTML = `
            <div class="typing-indicator-inner"></div>
            <div class="typing-indicator-inner anim-offset-1"></div>
            <div class="typing-indicator-inner anim-offset-2"></div>
        `
    }
    else {
        MessageContentItem.textContent = Message
    }

    if (AddTail || TypingIndicator) {
        const TailObject = document.createElement("svg")
        TailObject.classList.add("message-tail")
        TailObject.classList.add(Sender ? "message-sender-tail" : "message-recipient-tail")
        TailObject.innerHTML = `<svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M0.798279 19H0.999991C11.4934 19 20 10.4934 20 0H5.00032V3C5.00032 8.5858 5.00032 11.3787 4.21469 13.6239C3.49497 15.6807 2.31625 17.5127 0.798279 19Z" fill="#262629"/></svg>`
        MessageContentItem.append(TailObject)
    }
    if (!TypingIndicator) {
        MessageContentItem.addEventListener("click", async () => {
            if (PopupOpen) return;
            PopupOpen = true;
            // Remove previous tapback popups
            while (document.getElementsByClassName("reaction-popup")[0])
                document.getElementsByClassName("reaction-popup")[0].remove();

            // Create new tapback popup
            let ReactionPopup = document.createElement("div")
            ReactionPopup.classList.add("reaction-popup")
            ReactionPopup.classList.add(Sender ? "reaction-popup-sender" : "reaction-popup-recipient")
            ReactionPopup.innerHTML = `
                <span>􀊵</span>
                <span>􀊀</span>
                <span>􀊂</span>
                <span>😂</span>
                <span>􀅎</span>
                <span>􀅍</span>
            `

            // Attach tapback popup to message
            //document.getElementsByClassName("backdrop-blur")[0].classList.remove('backdrop-blur-hidden')
            MessageContentItem.append(ReactionPopup)

            for (let x = 0; x < ReactionPopup.children.length; x++) {
                ReactionPopup.children[x].addEventListener("click", async () => {
                    AddReaction(MessageJSON.guid, 2000 + x)
                    HideReactionPopups();
                    await new Promise(r => setTimeout(r, 100));
                    PopupOpen = false;
                })
            }
        })
    }
    if (MessageJSON.text != "\ufffc") {
        OutMessages.push(MessageContentItem)
    }
    return OutMessages
}

let CurrentTypingIndicator;
const SetTypingIndicator = (On = true) => {
    if (!CurrentTypingIndicator) {
        CurrentTypingIndicator = CreateMessageBubble(true)[0];
        MessageContainer.append(CurrentTypingIndicator)
        MessageContainer.scrollTop = MessageContainer.scrollHeight;
    }
    if (On) {
        CurrentTypingIndicator.classList.add("message-visible")
    }
    else {
        CurrentTypingIndicator.classList.remove("message-visible")
    }
}

const ProcessResponse = (json) => {
    switch (json.action) {
        case "fetchChats":
            const MessagesContainer = document.getElementById("homepage-contacts")
            while (MessagesContainer.firstChild)
                MessagesContainer.firstChild.remove();
            const Messages = json.data
            for (const Message of Messages) {
                const HomepageMessageContainer = document.createElement("div")
                HomepageMessageContainer.className = "homepage-message-container"
                HomepageMessageContainer.addEventListener("click", () => {
                    SwapTab(1, `loadmsg:${Message.address}`)
                })

                const UnreadMessageMarker = document.createElement("div")
                UnreadMessageMarker.className = "unread-message-marker"
                const UnreadMessageMarkerInner = document.createElement("div")
                UnreadMessageMarkerInner.className = "unread-message-marker-inner"
                if (!Message.read)
                    UnreadMessageMarker.appendChild(UnreadMessageMarkerInner)
                else
                    UnreadMessageMarker.style.width = "5vw"

                const MessageContainer = document.createElement("div")
                MessageContainer.className = "homepage-message"

                const UserAvatar = document.createElement("img")
                UserAvatar.src = "./assets/default-user.png"
                UserAvatar.className = "user-avatar"
                const MessageContentContainer = document.createElement("div")
                MessageContentContainer.className = "homepage-message-content-container"
                const MessageAuthor = document.createElement("p");
                MessageAuthor.className = "homepage-message-author";
                if (JSON.parse(localStorage.getItem("clientSettings")).uiPrivate)
                    MessageAuthor.classList.add("privacy-hidden")
                MessageAuthor.textContent = Message.author;
                MessageContentContainer.appendChild(MessageAuthor)
                const MessageContent = document.createElement("p");
                MessageContent.className = "homepage-message-content";
                if (JSON.parse(localStorage.getItem("clientSettings")).uiPrivate)
                    MessageContent.classList.add("privacy-hidden")
                MessageContent.innerHTML = (Message.text == "\ufffc") ? "<em>Media</em>" : ((Message.text.length > 30) ? (Message.text.substring(0, 30).trim() + "...") : Message.text);
                MessageContentContainer.appendChild(MessageContent)

                const Timestamp = document.createElement("div")
                Timestamp.className = "homepage-message-time"
                const TimestampText = document.createElement("span")
                TimestampText.className = "homepage-message-time-text"
                TimestampText.textContent = ((Ts) => {
                    const Dt = new Date(Ts)
                    if (Math.abs(Ts - Date.now()) > 1000 * 60 * 60 * 24 * 2) {
                        return `${Dt.getMonth() + 1}/${Dt.getDate()}/${Dt.getFullYear().toString().substring(2)}`
                    }
                    else if (Math.abs(Ts - Date.now()) > 1000 * 60 * 60 * 24) {
                        return `Yesterday`
                    }
                    return GetTime(Ts)
                })(Message.date)
                const TimestampChevron = document.createElement("span")
                TimestampChevron.className = "homepage-message-time-icon"
                TimestampChevron.textContent = "􀆊"
                Timestamp.appendChild(TimestampText)
                Timestamp.appendChild(TimestampChevron)

                if (((input) => {
                    return /^[a-zA-Z\s]*$/.test(input);
                })(Message.author)) {
                    const UserAvatarLetters = document.createElement("div")
                    UserAvatarLetters.className = "user-avatar"
                    UserAvatarLetters.textContent = (() => {
                        const words = Message.author.toString().split(' ');
                        let initials = '';
                        words.forEach(word => {
                            initials += word.charAt(0).toUpperCase();
                        });
                        if (initials.length > 2)
                            initials = initials.substring(0, 1);
                        return initials;
                    })()
                    MessageContainer.appendChild(UserAvatarLetters)
                }
                else {
                    MessageContainer.appendChild(UserAvatar)
                }
                MessageContainer.appendChild(MessageContentContainer)
                MessageContainer.appendChild(Timestamp)

                HomepageMessageContainer.appendChild(UnreadMessageMarker)
                HomepageMessageContainer.appendChild(MessageContainer)

                MessagesContainer.appendChild(HomepageMessageContainer)
            }
            break;
        case "fetchMessages":
            json.data = json.data.reverse();
            const NamesFound = []
            let Iter = 0;
            for (const Message of json.data) {
                if (!(NamesFound.includes(Message.name)))
                    NamesFound.push(Message.name)
                let AddTail = true;
                if (json.data[Iter + 1]) {
                    if (json.data[Iter + 1].sender == Message.sender)
                        AddTail = false
                }
                let Bubbles = CreateMessageBubble(false, Message, Message.text, Message.sender, AddTail)
                for (const Bubble of Bubbles) {
                    MessageContainer.append(Bubble)
                    Bubble.classList.add("message-visible")
                }
                Iter++
            }
            document.getElementById("contact-name").textContent = (() => {
                let NamesOut = ""
                for (let i = 0; i < NamesFound.length; i++) {
                    NamesOut += NamesFound[i]
                    if (i < NamesFound.length - 1)
                        NamesOut += ", "
                }
                return NamesOut
            })();
            break;
        case "newMessage":
            for (const Message of json.data.message) {
                if (Message.sender == 0) {
                    let Bubbles = CreateMessageBubble(false, Message, Message.text, Message.sender, true);
                    for (const Bubble of Bubbles) {
                        MessageContainer.append(Bubble)
                        MessageContainer.scrollTop = MessageContainer.scrollHeight;
                        Bubble.classList.add("message-visible")
                    }
                }
                else {
                    let Bubbles = CreateMessageBubble(false, Message, Message.text, Message.sender, true);
                    for (const Bubble of Bubbles) {
                        Bubble.classList.add("message-visible")
                        MessageContainer.append(Bubble)
                    }
                    if (LastMessageSent) {
                        LastMessageSent.remove()
                    }
                    MessageContainer.scrollTop = MessageContainer.scrollHeight;
                }
            }
            if (json.data.message[0].sender == 0 && SupportJavascriptInterfaces) {
                try {
                    Dialog.showMessage(json.data.message[0].author, json.data.message[0].text)
                }
                catch {

                }
            }
            RefreshMessageStatus(json);
            break;
        case "setTypingIndicator":
            SetTypingIndicator(json.data.typing)
            break;
        case "newReaction":
            break;
        case "setAsRead":
            if (json.data.guid) {
                RefreshMessageStatus(json);
            }
            break;
        default:
            console.error(`Unhandled JSON: `, json)
            break;
    }

    ApplyTimestamps(json)
    ApplyReactions(json)

    // Scroll to bottom
    MessageContainer.scrollTop = MessageContainer.scrollHeight;
}

const SwapTab = (TabNum, Intent = "") => {
    HideReactionPopups()
    let Tabs = document.getElementsByClassName("page-view")
    let Iter = 0
    for (const Tab of Tabs) {
        if (TabNum != Iter) {
            Tab.classList.add("tab-hidden")
            Tab.classList.remove("tab-visible")
        }
        else {
            Tab.classList.remove("tab-hidden")
            Tab.classList.add("tab-visible")
        }
        Iter++;
    }
    if (Intent) {
        if (Intent.startsWith("loadmsg:")) {
            const Phone = Intent.substring("loadmsg:".length)
            const MessageContainer = document.getElementById("messages-container")
            while (MessageContainer.firstChild)
                MessageContainer.firstChild.remove();
            GetMessages(Phone)
            MarkAsRead(Phone)
            document.getElementById("message-input").value = ""
            UpdateTypingStatus()
            CurrentChatNumber = Phone
        }
    }
}

const RefreshMessageStatus = async (json) => {

    if (json.action == "setAsRead" && json.data.read == 0)
        return;

    const GetMostRecentMessage = (guid) => {
        const Messages = document.getElementsByClassName("message")
        let LastMessage;
        for (let x = 0; x < Messages.length; x++) {
            const RawData = JSON.parse(Messages[x].getAttribute("rawjson"))
            if (RawData && RawData.sender == 1) {
                LastMessage = Messages[x]
            }
        }
        return LastMessage
    }

    const GetMessageByGuid = (guid) => {
        const Messages = document.getElementsByClassName("message")
        for (let x = 0; x < Messages.length; x++) {
            const RawData = JSON.parse(Messages[x].getAttribute("rawjson"))
            if (RawData.guid == guid)
                return Messages[x]
        }
    }

    if (json.action == "newMessage") {
        const Message = json.data.message[0]
        if (Message && Message.sender == 1) {
            while (document.getElementsByClassName("message-receipt-delivered")[0])
                document.getElementsByClassName("message-receipt-delivered")[0].remove()
            if (Message.sender == 1) {
                const TargetMessage = GetMostRecentMessage();
                let NewDeliveredIndicator;
                if (!TargetMessage.nextSibling || (TargetMessage.nextSibling && !TargetMessage.nextSibling.classList.contains("message-receipt"))) {
                    NewDeliveredIndicator = document.createElement("div")
                    NewDeliveredIndicator.className = "message-receipt message-receipt-delivered"
                    NewDeliveredIndicatorInner = document.createElement("span")
                    NewDeliveredIndicator.appendChild(NewDeliveredIndicatorInner)
                    if (TargetMessage.nextSibling)
                        MessageContainer.insertBefore(NewDeliveredIndicator, TargetMessage.nextSibling)
                    else
                        MessageContainer.appendChild(NewDeliveredIndicator)
                }
                else {
                    NewDeliveredIndicator = TargetMessage.nextSibling
                }
                NewDeliveredIndicator.childNodes[0].textContent = `Delivered`
                await new Promise(r => setTimeout(r, 100));
                NewDeliveredIndicator.classList.add("message-receipt-visible")
            }
        }
        return;
    }

    if (json.action == "setAsRead" && json.data.read != 0) {
        if (json.data.guid) {
            while (document.getElementsByClassName("message-receipt-delivered")[0])
                document.getElementsByClassName("message-receipt-delivered")[0].remove()
            while (document.getElementsByClassName("message-receipt-read")[0])
                document.getElementsByClassName("message-receipt-read")[0].remove()
            const TargetMessage = GetMessageByGuid(json.data.guid)
            let NewReadIndicator;
            if (!TargetMessage.nextSibling || (TargetMessage.nextSibling && !TargetMessage.nextSibling.classList.contains("message-receipt"))) {
                NewReadIndicator = document.createElement("div")
                NewReadIndicator.className = "message-receipt message-receipt-read"
                NewReadIndicatorInner1 = document.createElement("span")
                NewReadIndicatorInner2 = document.createElement("span")
                NewReadIndicatorInner2.className = "message-receipt-time"
                NewReadIndicator.appendChild(NewReadIndicatorInner1)
                NewReadIndicator.appendChild(NewReadIndicatorInner2)
                if (TargetMessage.nextSibling)
                    MessageContainer.insertBefore(NewReadIndicator, TargetMessage.nextSibling)
                else
                    MessageContainer.appendChild(NewReadIndicator)

            }
            else {
                NewReadIndicator = TargetMessage.nextSibling
            }
            NewReadIndicator.childNodes[0].textContent = `Read`
            NewReadIndicator.childNodes[1].textContent = `${GetTime(json.data.read)}`
            await new Promise(r => setTimeout(r, 100));
            NewReadIndicator.classList.add("message-receipt-visible")
        }
        return;
    }

    /*
    if (json.action == "setAsRead")
        ForceMarkAsRead = true

    console.log(json)
    console.log(ForceMarkAsRead)
    while (document.getElementsByClassName("message-receipt")[0])
        document.getElementsByClassName("message-receipt")[0].remove();
    let Messages = document.getElementsByClassName("message")
    let LastMessageSent;
    for (let i = 0; i < Messages.length; i++) {
        if (JSON.parse(Messages[i].getAttribute("rawjson")).sender == 1) {
            LastMessageSent = Messages[i]
        }
    }

    if (LastMessageSent) {
        let NewReceipt = document.createElement("p");
        NewReceipt.className = "message-receipt"
        let DateRead = JSON.parse(LastMessageSent.getAttribute("rawjson")).dateRead;
        NewReceipt.textContent = ((json.action == "setAsRead" || (JSON.parse(LastMessageSent.getAttribute("rawjson")).dateRead != 0)) || ForceMarkAsRead) ? `Read ${((Ts) => {
            const Dt = new Date(Ts)
            return `${Dt.getHours() > 12 ? Dt.getHours() - 12 : (Dt.getHours() == 0 ? 12 : Dt.getHours())}:${((Pad) => {
                if (Pad.toString().length == 1)
                    Pad = "0" + Pad
                return Pad
            })(Dt.getMinutes())} ${Dt.getHours() < 12 ? "AM" : "PM"}`
        })(DateRead)}` : "Delivered"
        MessageContainer.insertBefore(NewReceipt, LastMessageSent.nextSibling);
    }*/
}

const ApplyReactions = (json) => {
    let Messages = document.getElementsByClassName("message")
    for (let x = 0; x < Messages.length; x++) {
        let CurrMessageData = JSON.parse(Messages[x].getAttribute("rawjson"))
        if (CurrMessageData.reactions && CurrMessageData.reactions[0]) {
            if (CurrMessageData.reactions[0].text.toString().toLowerCase().includes("removed")) {
                CurrMessageData.reactions = [];
            }
        }
        Messages[x].setAttribute("rawjson", JSON.stringify(CurrMessageData))
    }
    if (json.action == "newReaction") {
        let TargetGUID = json.data.reactions[0].forGUID
        for (let x = 0; x < Messages.length; x++) {
            let MessageJSON = JSON.parse(Messages[x].getAttribute("rawjson"))
            if (MessageJSON.guid == TargetGUID) {
                if (json.data.reactions[0]) {
                    if (json.data.reactions[0].text.toString().toLowerCase().includes("removed")) {
                        MessageJSON.reactions = []
                    }
                    else {
                        MessageJSON.reactions = json.data.reactions
                    }
                }
            }
            Messages[x].setAttribute("rawjson", JSON.stringify(MessageJSON))
        }
    }
    while (document.getElementsByClassName("message-reaction")[0])
        document.getElementsByClassName("message-reaction")[0].remove();
    for (let i = 0; i < Messages.length; i++) {
        let json = JSON.parse(Messages[i].getAttribute("rawjson"))
        if (json.reactions) {
            let LastReaction = json.reactions.pop()
            if (LastReaction) {

                let MessageTimestampContainer = document.createElement("div")
                MessageTimestampContainer.className = "message-timestamp-header"
                MessageContainer.insertBefore(MessageTimestampContainer, Messages[i])

                let MessageReactionObject = document.createElement("div")
                MessageReactionObject.className = "message-reaction"
                MessageReactionObject.classList.add(json.sender == 1 ? "message-reaction-sender" : "message-reaction-recipient")
                MessageReactionObject.classList.add(LastReaction.sender == 0 ? "message-reaction-sender-color" : "message-reaction-recipient-color")
                MessageReactionObject.textContent = ((text) => {
                    switch (text) {
                        case 2000:
                            return "􀊵";
                            break;
                        case 2001:
                            return "􀊀";
                            break;
                        case 2002:
                            return "􀊂";
                            break;
                        case 2003:
                            return "😂";
                            break;
                        case 2004:
                            return "􀅎";
                            break;
                        case 2005:
                            return "􀅍";
                            break;
                    }
                    return "..."
                })(LastReaction.reactionType)
                Messages[i].appendChild(MessageReactionObject)
            }
        }
    }
}

const ApplyTimestamps = (json) => {
    while (document.getElementsByClassName("message-timestamp-header")[0])
        document.getElementsByClassName("message-timestamp-header")[0].remove();
    let Messages = document.getElementsByClassName("message")
    let LastMessageTimestamp = 0
    for (let i = 0; i < Messages.length; i++) {
        let json = JSON.parse(Messages[i].getAttribute("rawjson"))
        if (json.dateDelivered <= 0) continue;
        if ((json.dateDelivered - LastMessageTimestamp) > 1000 * 60 * 60) { // > 1hr
            let MessageTimestampContainer = document.createElement("div")
            MessageTimestampContainer.className = "message-timestamp-header"

            let MessageTimestampDate = document.createElement("span")
            MessageTimestampDate.className = "message-date"
            MessageTimestampDate.textContent = ((Ts) => {
                const Dt = new Date(Ts)
                if (Math.abs(Ts - Date.now()) > 1000 * 60 * 60 * 24 * 2) {
                    return `${Dt.getMonth() + 1}/${Dt.getDate()}/${Dt.getFullYear().toString().substring(2)}`
                }
                else if (Math.abs(Ts - Date.now()) > 1000 * 60 * 60 * 24) {
                    return `Yesterday`
                }
                else {
                    return `Today`
                }
            })(json.dateDelivered)
            let MessageTimestampTime = document.createElement("span")
            MessageTimestampTime.textContent = GetTime(json.dateDelivered)

            MessageTimestampContainer.appendChild(MessageTimestampDate)
            MessageTimestampContainer.appendChild(MessageTimestampTime)
            MessageContainer.insertBefore(MessageTimestampContainer, Messages[i])
        }
        else if ((json.dateDelivered - LastMessageTimestamp) > 1000 * 60 * 10) { // > 10min
            let MessageTimestampContainer = document.createElement("div")
            MessageTimestampContainer.className = "message-timestamp-header"
            MessageContainer.insertBefore(MessageTimestampContainer, Messages[i])
        }

        LastMessageTimestamp = json.dateDelivered
    }
}

SwapTab(0)

setInterval(() => {
    if (GlobalSocket.OPEN) {
        try {
            GlobalSocket.send(JSON.stringify({
                action: "fetchChats",
                data: {
                    offset: "0",
                    limit: "50"
                },
                password: Password
            }))
        }
        catch {

        }
    }
}, 60000);

document.documentElement.setAttribute('data-theme', 'light');
if (window.navigator.userAgent.includes("DarkMode"))
    document.documentElement.setAttribute('data-theme', 'dark');