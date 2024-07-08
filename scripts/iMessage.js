// Private globals
var GlobalSocket;
var CurrentChatNumber;
var ChatsOffset;
var WebsocketURL;
var Password;

try {
    let ServerSettings = JSON.parse(localStorage.getItem("serverSettings"))
    if (!ServerSettings.hasOwnProperty("host")) throw "Invalid settings"
    if (!ServerSettings.hasOwnProperty("port")) throw "Invalid settings"
    if (!ServerSettings.hasOwnProperty("password")) throw "Invalid settings"
    if (!ServerSettings.hasOwnProperty("useHttps")) throw "Invalid settings"
    let ClientSettings = JSON.parse(localStorage.getItem("clientSettings"))
    if (!ClientSettings.hasOwnProperty("uiPrivate")) throw "Invalid settings"
    if (!ClientSettings.hasOwnProperty("uiDark")) throw "Invalid settings"
    if (!ClientSettings.hasOwnProperty("uiReadReceipts")) throw "Invalid settings"
    if (!ClientSettings.hasOwnProperty("uiSubjectField")) throw "Invalid settings"
    if (!ClientSettings.hasOwnProperty("uiSendTyping")) throw "Invalid settings"
}
catch {
    localStorage.setItem("serverSettings", JSON.stringify({
        host: "",
        port: "",
        password: "",
        useHttps: false
    }))
    localStorage.setItem("clientSettings", JSON.stringify({
        uiPrivate: false,
        uiDark: false,
        uiReadReceipts: false,
        uiSubjectField: false,
        uiSendTyping: true
    }))
}
const DownloadFile = (url, filename) => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

const GetPrefetchedMessages = (ContactPhoneNumber) => {
    try {
        JSON.parse(localStorage.getItem("cachedConversations"))
    }
    catch {
        localStorage.setItem("cachedConversations", JSON.stringify([]))
    }
    let PrefetchedMessages = JSON.parse(localStorage.getItem("cachedConversations"))
    if (PrefetchedMessages) {
        for (const Item of PrefetchedMessages) {
            if (Item.phone == ContactPhoneNumber) {
                return Item.data
            }
        }
    }
}

const SetPrefetchedMessage = (ContactPhoneNumber, Data) => {
    try {
        JSON.parse(localStorage.getItem("cachedConversations"))
    }
    catch {
        localStorage.setItem("cachedConversations", JSON.stringify([]))
    }
    let PrefetchedMessages = JSON.parse(localStorage.getItem("cachedConversations"))
    if (PrefetchedMessages) {
        for (const Item of PrefetchedMessages) {
            if (Item.phone == ContactPhoneNumber) {
                PrefetchedMessages.splice(PrefetchedMessages.indexOf(Item), 1)
            }
        }
    }
    else {
        PrefetchedMessages = []
    }
    PrefetchedMessages.push({
        phone: ContactPhoneNumber,
        data: Data
    })
    localStorage.setItem("cachedConversations", JSON.stringify(PrefetchedMessages))
    return Data;
}

const GetPrefetchedContacts = () => {
    try {
        JSON.parse(localStorage.getItem("cachedContacts"))
    }
    catch {
        localStorage.setItem("cachedContacts", JSON.stringify([]))
    }
    return JSON.parse(localStorage.getItem("cachedContacts"))
}

const SetPrefetchedContacts = (Data) => {
    localStorage.setItem("cachedContacts", JSON.stringify(Data))
}

let LastContactsScrollTop = 0;
let ContactsContainer = document.getElementById("homepage-contacts")
ContactsContainer.addEventListener("scroll", (event) => {
    let diff = ContactsContainer.scrollTop - LastContactsScrollTop;
    if (diff < 0) {
        document.getElementsByClassName("search-box")[0].removeAttribute("disabled")
    }
    else {
        document.getElementsByClassName("search-box")[0].setAttribute("disabled", true)
    }
    LastContactsScrollTop = ContactsContainer.scrollTop
})

let ContactImgCache = []
const GetCachedContactImg = (docid) => {
    for (const Elem of ContactImgCache) {
        if (Elem.docid == docid)
            return Elem
    }
}
const AddCachedContactImg = (docid, imageResponse) => {
    let Contains = false;
    for (const Elem of ContactImgCache) {
        if (Elem.docid == docid)
            Contains = true;
    }
    if (!Contains) {
        ContactImgCache.push({
            docid: docid,
            imageResponse: imageResponse
        })
    }
}

const SupportJavascriptInterfaces = true

const Refresh = () => {
    ConnectToServer();
}

let ATags = document.getElementsByTagName("a")
for (const ATag of ATags)
    ATag.setAttribute("tabindex", "-1")

const FormatPhoneNumber = (Number = "+18005551234") => {
    return `${Number.substring(0, Number.length - 4 - 3 - 3)
        } (${Number.substring(Number.length - 4 - 3 - 3, Number.length - 4 - 3)
        }) ${Number.substring(Number.length - 4 - 3, Number.length - 4)
        }-${Number.substring(Number.length - 4, Number.length)
        }`
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

const ConnectToServer = async () => {
    document.getElementById("server-connection-status").style.opacity = "1"
    document.getElementById("server-connection-status").style.color = "var(--accent-3)"
    document.getElementById("server-connection-status").textContent = "Inactive"

    return new Promise((resolve) => {

        // Create socket
        try {
            GlobalSocket = new WebSocket(WebsocketURL)

            // Socket event listener for connection
            GlobalSocket.onopen = async () => {
                document.getElementById("server-connection-status").style.opacity = "1"
                document.getElementById("server-connection-status").style.color = "var(--accent-2)"
                document.getElementById("server-connection-status").textContent = "Connected"
                GlobalSocket.send(JSON.stringify({
                    action: "fetchChats",
                    data: {
                        offset: "0",
                        limit: "9999"
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
            }

            GlobalSocket.onclose = (event) => {
                document.getElementById("server-connection-status").style.opacity = "1"
                document.getElementById("server-connection-status").style.color = "var(--accent-3)"
                document.getElementById("server-connection-status").textContent = "Disconnected"
            }

            GlobalSocket.onmessage = async (event) => {
                document.getElementById("server-connection-status").style.opacity = "1"
                document.getElementById("server-connection-status").style.color = "var(--accent-2)"
                document.getElementById("server-connection-status").textContent = "Active"
                const json = JSON.parse(await event.data.text())
                ProcessResponse(json)
            }
        }
        catch {
            // no biggie i guess
            document.getElementById("server-connection-status").style.opacity = "1"
            document.getElementById("server-connection-status").style.color = "var(--accent-3)"
            document.getElementById("server-connection-status").textContent = "Errored"
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
    let UIDark = document.getElementById("settings-option-usedarkmode").getAttribute("checked") == "true"
    let UIReadReceipts = document.getElementById("settings-option-usereadreceipts").getAttribute("checked") == "true"
    let UISubjectField = document.getElementById("settings-option-usesubjectline").getAttribute("checked") == "true"
    let UISendTyping = document.getElementById("settings-option-usetypingindicators").getAttribute("checked") == "true"
    let SettingsObj2 = {
        uiPrivate: UIPrivate,
        uiDark: UIDark,
        uiReadReceipts: UIReadReceipts,
        uiSubjectField: UISubjectField,
        uiSendTyping: UISendTyping
    }
    let TempWebsocketURL = `${UseHTTPS ? "wss" : "ws"}://${Host}:${Port}/auth=${((len) => {
        let out = ""
        for (let x = 0; x < len; x++)
            out += "•"
        return out;
    })(Password.length)}`
    document.getElementById("settings-option-showurl").innerHTML = `Socket address: ${TempWebsocketURL}`
    localStorage.setItem("serverSettings", JSON.stringify(SettingsObj))
    localStorage.setItem("clientSettings", JSON.stringify(SettingsObj2))
    LoadSettings();
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
        const SendEndpoint = `${UseHTTPS ? "https" : "http"}://${Host}:${Port}/attachments?path=${encodeURIComponent(`${Payload}${Path}`)}&type=${encodeURIComponent("text/plain")}&auth=${encodeURIComponent(Password)}&transcode=0`;

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
    document.getElementById("server-connection-build").textContent = ParsePlist(Plist, "ProductBuildVersion")
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
    }
    let ClientSettings = JSON.parse(localStorage.getItem("clientSettings"))
    if (ClientSettings) {
        document.getElementById("settings-option-useprivacymode").setAttribute("checked", ClientSettings.uiPrivate ? "true" : "false")
        document.documentElement.style.setProperty("--privacy-blur", ClientSettings.uiPrivate ? "7.5px" : "0px")
        document.getElementById("settings-option-usedarkmode").setAttribute("checked", ClientSettings.uiDark ? "true" : "false")
        document.documentElement.setAttribute('data-theme', ClientSettings.uiDark ? 'dark' : 'light');
        document.getElementById("message-input-subject").style.display = ClientSettings.uiSubjectField ? "inherit" : "none"
    }
}
LoadSettings();
ConnectToServer()

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

const HideReactionPopups = async () => {
    if (document.getElementsByClassName("reaction-popup")[0])
        document.getElementsByClassName("reaction-popup")[0].classList.remove("reaction-popup-visible")
    document.getElementsByClassName("backdrop-blur")[0].classList.add('backdrop-blur-hidden')
    await new Promise(r => setTimeout(r, 100));
    while (document.getElementsByClassName("message-clone")[0])
        document.getElementsByClassName("message-clone")[0].remove()
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
    if (GetPrefetchedMessages(Phone)) {
        await LoadFetchedMessages(GetPrefetchedMessages(Phone))
    }
    if (!GlobalSocket.OPEN)
        GlobalSocket = new WebSocket(WebsocketURL)
    if (GlobalSocket && GlobalSocket.OPEN) {
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
            limit: "9999"
        },
        password: Password
    }))
}

const MarkAsRead = (Phone) => {
    if (!JSON.parse(localStorage.getItem("clientSettings")).uiReadReceipts) return;
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
    let SubjectLine = document.getElementById("message-input-subject").value
    document.getElementById("message-input").value = ""
    document.getElementById("message-input-subject").value = ""
    document.activeElement = null

    // Create dummy element
    let Bubbles = CreateMessageBubble(false, {
        subject: SubjectLine.length > 0 ? SubjectLine : null
    }, TextMessage, 1, true);
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
                subject: SubjectLine.length > 0 ? SubjectLine : null,
            })
        })
    }
}
document.getElementById("message-input").addEventListener("keydown", (ev) => {
    if (ev.keyCode == 13)
        SendMessage()
})

const CreateMessageBubble = (TypingIndicator = false, MessageJSON = {}, Message = "", Sender = 0, AddTail = true, AllowReactions = true) => {
    let OutMessages = []

    let ServerSettings = JSON.parse(localStorage.getItem("serverSettings"))
    if (!TypingIndicator) {
        if (MessageJSON.text == "\ufffc") {
            const Attachments = MessageJSON.attachments
            for (const Attachment of Attachments) {
                let Type = Attachment[1].includes("image") ? "img" : (Attachment[1].includes("video") ? "video" : "div");
                let MessageContentItem = document.createElement(Type)
                MessageContentItem.addEventListener("load", () => {
                    MessageContainer.scrollTop = MessageContainer.scrollHeight;
                })
                MessageContentItem.setAttribute("rawJSON", JSON.stringify(MessageJSON))
                MessageContentItem.className = "message"
                MessageContentItem.classList.add("message-media")
                MessageContentItem.classList.add(Sender ? "message-sender" : "message-recipient")
                if (ServerSettings && Type == "img") {
                    MessageContentItem.src = `${ServerSettings.useHttps ? "https" : "http"}://${ServerSettings.host}:${ServerSettings.port}/attachments?path=${encodeURIComponent(Attachment[0])}&type=${encodeURIComponent(Attachment[1])}&auth=${ServerSettings.password}&transcode=1`
                }
                else if (ServerSettings && Type == "video") {
                    let SourceObject = document.createElement("source")
                    SourceObject.src = `${ServerSettings.useHttps ? "https" : "http"}://${ServerSettings.host}:${ServerSettings.port}/attachments?path=${encodeURIComponent(Attachment[0])}&type=${encodeURIComponent(Attachment[1])}&auth=${ServerSettings.password}&transcode=1`
                    SourceObject.type = Attachment[1]
                    MessageContentItem.appendChild(SourceObject)
                    MessageContentItem.setAttribute("controls", true)
                }
                else if (ServerSettings) {
                    let FileTypeIconText = document.createElement("p")
                    FileTypeIconText.className = "file-type-icon-text"
                    FileTypeIconText.textContent = Attachment[0].split(".")[Attachment[0].split(".").length - 1]
                    let FileTypeIcon = document.createElement("img")
                    FileTypeIcon.src = "./assets/file.png"
                    let FileName = document.createElement("p")
                    FileName.textContent = Attachment[0].split("/")[Attachment[0].split("/").length - 1]
                    FileName.className = "file-name"
                    MessageContentItem.classList.add("message-file")
                    MessageContentItem.appendChild(FileTypeIcon)
                    MessageContentItem.appendChild(FileTypeIconText)
                    MessageContentItem.appendChild(FileName)
                    MessageContentItem.addEventListener("click", () => {
                        DownloadFile(`${ServerSettings.useHttps ? "https" : "http"}://${ServerSettings.host}:${ServerSettings.port}/attachments?path=${encodeURIComponent(Attachment[0])}&type=${encodeURIComponent(Attachment[1])}&auth=${ServerSettings.password}&transcode=0`, Attachment[0].split("/")[Attachment[0].split("/").length - 1])
                    })
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
        if (MessageJSON.subject) {
            let P1 = document.createElement("p")
            P1.className = "message-content-partial message-content-subject"
            P1.textContent = MessageJSON.subject
            let P2 = document.createElement("p")
            P2.className = "message-content-partial"
            P2.textContent = Message
            MessageContentItem.appendChild(P1)
            MessageContentItem.appendChild(P2)
        }
        else {
            if (!MessageJSON.payload) {
                MessageContentItem.textContent = Message
            }
            else if (MessageJSON.payload && MessageJSON.payload != 0) {
                const DecodedAttachmentPayload = atob(MessageJSON.payload)
                let MessageSubtitle = DecodedAttachmentPayload.substring(DecodedAttachmentPayload.indexOf("") + 2)
                MessageSubtitle = MessageSubtitle.substring(0, MessageSubtitle.indexOf("HIJKZ$classname") - 1).trim()
                if (MessageSubtitle) {
                    MessageContentItem.classList.add("message-payload")
                    const MessageSub1 = document.createElement("img")
                    const MessageSub2 = document.createElement("p")
                    const MessageSub3 = document.createElement("p")
                    MessageSub3.classList.add("message-payload-notice")
                    const Attachment = MessageJSON.attachments[0]
                    if (Attachment && ServerSettings) {
                        MessageSub1.src = `${ServerSettings.useHttps ? "https" : "http"}://${ServerSettings.host}:${ServerSettings.port}/attachments?path=${encodeURIComponent(Attachment[0])}&type=${encodeURIComponent(Attachment[1])}&auth=${ServerSettings.password}&transcode=1`
                        MessageContentItem.appendChild(MessageSub1)
                    }
                    MessageSub2.textContent = MessageSubtitle
                    MessageSub3.textContent = "Unsupported Interaction"
                    MessageContentItem.appendChild(MessageSub2)
                    MessageContentItem.appendChild(MessageSub3)
                }
            }
        }
    }

    if (AddTail || TypingIndicator) {
        const TailObject = document.createElement("svg")
        TailObject.classList.add("message-tail")
        TailObject.classList.add(Sender ? "message-sender-tail" : "message-recipient-tail")
        TailObject.innerHTML = `<svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M0.798279 19H0.999991C11.4934 19 20 10.4934 20 0H5.00032V3C5.00032 8.5858 5.00032 11.3787 4.21469 13.6239C3.49497 15.6807 2.31625 17.5127 0.798279 19Z" fill="#262629"/></svg>`
        MessageContentItem.append(TailObject)
    }
    if (!TypingIndicator && AllowReactions) {
        MessageContentItem.addEventListener("click", async () => {
            // Remove previous tapback popups
            while (document.getElementsByClassName("reaction-popup")[0])
                document.getElementsByClassName("reaction-popup")[0].remove();

            const MessageArea = MessageContentItem.getBoundingClientRect()

            // Create new tapback popup
            let ReactionPopup = document.createElement("div")
            ReactionPopup.classList.add("reaction-popup")

            if (Sender)
                ReactionPopup.style.right = "10px"
            else
                ReactionPopup.style.left = "10px"
            ReactionPopup.style.top = `${MessageArea.top - 65}px`

            ReactionPopup.innerHTML = `
                <span>􀊵</span>
                <span>􀊀</span>
                <span>􀊂</span>
                <span style="opacity: 1; color: white;">😂</span>
                <span>􀅎</span>
                <span>􀅍</span>
            `

            // Attach tapback popup to message
            document.getElementsByClassName("backdrop-blur")[0].classList.remove('backdrop-blur-hidden')
            document.body.appendChild(ReactionPopup)

            // Clone current message to display on top-level
            const CloneMessage = CreateMessageBubble(TypingIndicator, MessageJSON, Message, Sender, AddTail, false)[0]
            CloneMessage.classList.add("message-clone")

            if (document.getElementsByClassName("message-clone")[0])
                document.getElementsByClassName("message-clone")[0].remove()
            document.getElementsByClassName("reaction-popup")[0].parentElement.insertBefore(CloneMessage, document.getElementsByClassName("reaction-popup")[0])
            CloneMessage.style.top = `${MessageArea.top - 6}px`
            if (Sender)
                CloneMessage.style.right = `${window.visualViewport.width - MessageArea.right - 12}px`
            else
                CloneMessage.style.left = `${MessageArea.left - 12}px`
            await new Promise(r => setTimeout(r, 100));
            CloneMessage.classList.add("message-clone-visible")

            const OrbContainer = document.createElement("div")
            OrbContainer.className = "popup-orb-container"
            OrbContainer.classList.add(Sender ? "message-orb-container-sender" : "message-orb-container-recipient")
            ReactionPopup.appendChild(OrbContainer)
            const Orb1 = document.createElement("div")
            Orb1.className = "popup-orb popup-orb-1"
            OrbContainer.appendChild(Orb1)
            const Orb2 = document.createElement("div")
            Orb2.className = "popup-orb popup-orb-2"
            OrbContainer.appendChild(Orb2)
            const GetX = () => {
                let MessageBounds = CloneMessage.getBoundingClientRect();
                return MessageBounds.right - MessageBounds.left
            }
            if (Sender) {
                Orb1.style.right = `${GetX() - 4}px`
                Orb2.style.right = `${GetX() + 13}px`
            }
            else {
                Orb1.style.left = `${GetX() - 4}px`
                Orb2.style.left = `${GetX() + 13}px`
            }

            let CurrentReactions = JSON.parse(MessageContentItem.getAttribute("rawjson")).reactions
            for (let x = 0; x < CurrentReactions.length; x++) {
                if (CurrentReactions[x].sender == 1 && CurrentReactions[x].reactionType < 3000) {
                    ReactionPopup.children[CurrentReactions[x].reactionType - 2000].classList.add("reaction-popup-selected")
                }
            }
            for (let x = 0; x < ReactionPopup.children.length; x++) {
                ReactionPopup.children[x].addEventListener("click", async () => {
                    AddReaction(MessageJSON.guid, (ReactionPopup.children[x].classList.contains("reaction-popup-selected") ? 3000 : 2000) + x)
                    HideReactionPopups();
                    await new Promise(r => setTimeout(r, 100));
                })
            }

            await new Promise(r => setTimeout(r, 100));
            ReactionPopup.classList.add("reaction-popup-visible")
        })
    }
    if (MessageJSON.text != "\ufffc") {
        OutMessages.push(MessageContentItem)
    }
    return OutMessages
}

let CurrentTypingIndicator;
const SetTypingIndicator = (On = true) => {
    if (!JSON.parse(localStorage.getItem("clientSettings")).uiSendTyping) return;
    if (!CurrentTypingIndicator) {
        let StartingHeight = MessageContainer.scrollHeight
        CurrentTypingIndicator = CreateMessageBubble(true)[0];
        MessageContainer.append(CurrentTypingIndicator)
        let EndingHeight = MessageContainer.scrollHeight
        MessageContainer.scrollTop += EndingHeight - StartingHeight;
    }
    if (On) {
        CurrentTypingIndicator.classList.add("message-visible")
    }
    else {
        CurrentTypingIndicator.classList.remove("message-visible")
    }
}

const LoadFetchedMessages = async (json) => {

    while (MessageContainer.firstChild)
        MessageContainer.firstChild.remove()

    let Settings = JSON.parse(localStorage.getItem("serverSettings"))
    json.data = json.data.reverse();

    const NamesFound = []
    let Iter = 0;
    let docid = -1
    let StartingHeight = MessageContainer.scrollHeight
    let ForceLastMessage;
    for (const Message of json.data) {
        if (!(NamesFound.includes(Message.name)))
            NamesFound.push(Message.name)
        docid = Message.docid
        let AddTail = true;
        if (json.data[Iter + 1]) {
            if (json.data[Iter + 1].sender == Message.sender)
                AddTail = false
        }
        let Bubbles = CreateMessageBubble(false, Message, Message.text, Message.sender, AddTail)
        for (const Bubble of Bubbles) {
            Bubble.classList.add("message-visible")
            if (Message.sender == 1)
                ForceLastMessage = Bubble
            MessageContainer.append(Bubble)
        }
        Iter++
    }
    let EndingHeight = MessageContainer.scrollHeight
    MessageContainer.scrollTop += EndingHeight - StartingHeight;

    const UserImageContainer = document.getElementById("user-avatar-container")
    while (UserImageContainer.firstChild)
        UserImageContainer.firstChild.remove()


    const ContactImageEndpoint = `${Settings.useHttps ? "https" : "http"}://${Settings.host}:${Settings.port}/contactimg?docid=${docid}`;
    const UserAvatar = document.createElement("img")
    UserAvatar.src = ContactImageEndpoint
    UserAvatar.className = "user-avatar message-user-avatar privacy-hidden"
    UserAvatar.addEventListener("error", () => {
        if (((input) => {
            return /^[a-zA-Z\s]*$/.test(input);
        })(NamesFound[0])) {
            const UserAvatarLetters = document.createElement("div")
            UserAvatarLetters.className = "user-avatar message-user-avatar privacy-hidden"
            UserAvatarLetters.textContent = (() => {
                const words = NamesFound[0].toString().split(' ');
                let initials = '';
                words.forEach(word => {
                    initials += word.charAt(0).toUpperCase();
                });
                if (initials.length > 2)
                    initials = initials.substring(0, 1);
                return initials;
            })()
            UserImageContainer.appendChild(UserAvatarLetters)
            UserAvatar.remove()
        }
        else {
            UserAvatar.src = "./assets/default-user.png"
        }
    })
    UserImageContainer.appendChild(UserAvatar)

    document.getElementById("contact-name").textContent = (() => {
        let NamesOut = ""
        for (let i = 0; i < NamesFound.length; i++) {
            NamesOut += /^[\d+]+$/.test(NamesFound[i]) ? FormatPhoneNumber(NamesFound[i]) : NamesFound[i]
            if (i < NamesFound.length - 1)
                NamesOut += ", "
        }
        return NamesOut
    })();

    RefreshMessageStatus(json, ForceLastMessage)
    ApplyTimestamps(json)
    ApplyReactions(json)
}

const LoadFetchedChats = async (json) => {
    let Settings = JSON.parse(localStorage.getItem("serverSettings"))
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

        const ContactImageEndpoint = `${Settings.useHttps ? "https" : "http"}://${Settings.host}:${Settings.port}/contactimg?docid=${Message.docid}`;
        UserAvatar.src = ContactImageEndpoint
        UserAvatar.addEventListener("error", () => {
            if (((input) => {
                return /^[a-zA-Z\s]*$/.test(input);
            })(Message.author)) {
                const UserAvatarLetters = document.createElement("div")
                UserAvatarLetters.className = "user-avatar privacy-hidden"
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
                MessageContainer.insertBefore(UserAvatarLetters, UserAvatar)
                UserAvatar.remove()
            }
            else {
                UserAvatar.src = "./assets/default-user.png"
            }
        })
        UserAvatar.className = "user-avatar privacy-hidden"
        MessageContainer.appendChild(UserAvatar)

        const MessageContentContainer = document.createElement("div")
        MessageContentContainer.className = "homepage-message-content-container"
        const MessageAuthor = document.createElement("p");
        MessageAuthor.className = "homepage-message-author";
        if (JSON.parse(localStorage.getItem("clientSettings")).uiPrivate)
            MessageAuthor.classList.add("privacy-hidden")
        MessageAuthor.textContent = /^[\d+]+$/.test(Message.author) ? FormatPhoneNumber(Message.author) : Message.author;
        MessageContentContainer.appendChild(MessageAuthor)
        const MessageContent = document.createElement("p");
        MessageContent.className = "homepage-message-content";
        if (JSON.parse(localStorage.getItem("clientSettings")).uiPrivate)
            MessageContent.classList.add("privacy-hidden")
        MessageContent.innerHTML = (Message.text == "\ufffc") ? "<em>Attachment</em>" : ((Message.text.length > 30) ? (Message.text.substring(0, 30).trim() + "...") : Message.text);
        MessageContentContainer.appendChild(MessageContent)

        const Timestamp = document.createElement("div")
        Timestamp.className = "homepage-message-time"
        const TimestampText = document.createElement("span")
        TimestampText.className = "homepage-message-time-text"
        TimestampText.textContent = ((Ts) => {
            const Dt = new Date(Ts)
            if (Date.now() - Ts > 1000 * 60 * 60 * 24 * 7) {
                return `${Dt.getMonth() + 1}/${Dt.getDate()}/${Dt.getFullYear().toString().substring(2)}`
            }
            else if (Date.now() - Ts > 1000 * 60 * 60 * 24 * 2) {
                return `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Dt.getDay()]}`
            }
            else if (Date.now() - Ts > 1000 * 60 * 60 * 24) {
                return `Yesterday`
            }
            else {
                return GetTime(Ts)
            }
        })(Message.date)
        const TimestampChevron = document.createElement("span")
        TimestampChevron.className = "homepage-message-time-icon"
        TimestampChevron.textContent = "􀆊"
        Timestamp.appendChild(TimestampText)
        Timestamp.appendChild(TimestampChevron)

        MessageContainer.appendChild(MessageContentContainer)
        MessageContainer.appendChild(Timestamp)

        HomepageMessageContainer.appendChild(UnreadMessageMarker)
        HomepageMessageContainer.appendChild(MessageContainer)
        HomepageMessageContainer.classList.add("homepage-message-container-visible")
        MessagesContainer.appendChild(HomepageMessageContainer)
    }
}

const ProcessResponse = async (json) => {
    switch (json.action) {
        case "fetchChats":

            SetPrefetchedContacts(json)
            await LoadFetchedChats(json)

            break;
        case "fetchMessages":

            SetPrefetchedMessage(CurrentChatNumber, json)
            await LoadFetchedMessages(json)

            break;
        case "newMessage":
            for (const Message of json.data.message) {
                if (Message.chatId == CurrentChatNumber) {
                    if (Message.sender == 0) {
                        let StartingHeight = MessageContainer.scrollHeight
                        let Bubbles = CreateMessageBubble(false, Message, Message.text, Message.sender, true);
                        for (const Bubble of Bubbles) {
                            MessageContainer.append(Bubble)
                            Bubble.classList.add("message-visible")
                        }
                        let EndingHeight = MessageContainer.scrollHeight
                        MessageContainer.scrollTop += EndingHeight - StartingHeight;
                    }
                    else {
                        let StartingHeight = MessageContainer.scrollHeight
                        let Bubbles = CreateMessageBubble(false, Message, Message.text, Message.sender, true);
                        for (const Bubble of Bubbles) {
                            Bubble.classList.add("message-visible")
                            MessageContainer.append(Bubble)
                        }
                        if (LastMessageSent) {
                            LastMessageSent.remove()
                        }
                        let EndingHeight = MessageContainer.scrollHeight
                        MessageContainer.scrollTop += EndingHeight - StartingHeight;
                    }
                }
                else {
                    GlobalSocket.send(JSON.stringify({
                        action: "fetchChats",
                        data: {
                            offset: "0",
                            limit: "9999"
                        },
                        password: Password
                    }))
                }
            }
            if (json.data.message[0].sender == 0 && SupportJavascriptInterfaces) {
                try {
                    Dialog.showMessage(json.data.message[0].author, json.data.message[0].text)
                }
                catch {

                }
            }
            break;
        case "setTypingIndicator":
            SetTypingIndicator(json.data.typing)
            break;
        case "newReaction":
            ApplyReactions(json)
            break;
        case "setAsRead":
            RefreshMessageStatus(json)
            break;
        default:
            console.error(`Unhandled JSON: `, json)
            break;
    }

    // Scroll to bottom
    //MessageContainer.scrollTop = MessageContainer.scrollHeight;
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
            document.getElementById("message-input-subject").value = ""
            document.getElementById("message-input").value = ""
            UpdateTypingStatus()
            CurrentChatNumber = Phone
            document.getElementById("message-input-subject").setAttribute("tabIndex", "1")
            document.getElementById("message-input").setAttribute("tabIndex", "2")
        }
    }
    else {
        document.getElementById("message-input-subject").setAttribute("tabIndex", "-1")
        document.getElementById("message-input").setAttribute("tabIndex", "-1")
    }
}

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

const RefreshMessageStatus = async (json, ForceLastMessage) => {
    if (json.action == "setAsRead" && json.data.read == 0)
        return;

    if (json.action == "fetchMessages") {
        while (document.getElementsByClassName("message-receipt-delivered")[0])
            document.getElementsByClassName("message-receipt-delivered")[0].remove()
        while (document.getElementsByClassName("message-receipt-read")[0])
            document.getElementsByClassName("message-receipt-read")[0].remove()
        const Messages = document.getElementsByClassName("message")
        let LastDelivered;
        let LastRead;
        for (let x = 0; x < Messages.length; x++) {
            const RawData = JSON.parse(Messages[x].getAttribute("rawjson"))
            if (RawData.sender == 1) {
                if (RawData.dateRead)
                    LastRead = Messages[x]
                if (RawData.dateDelivered)
                    LastDelivered = Messages[x]
            }
        }
        if (LastRead) {
            const NewIndicator = document.createElement("div")
            NewIndicator.className = "message-receipt message-receipt-read"
            const NewIndicatorPart1 = document.createElement("span")
            const NewIndicatorPart2 = document.createElement("span")
            NewIndicatorPart2.className = "message-receipt-time"
            NewIndicatorPart1.textContent = "Read"
            NewIndicatorPart2.textContent = GetTime(JSON.parse(LastRead.getAttribute("rawjson")).dateRead)
            NewIndicator.appendChild(NewIndicatorPart1)
            NewIndicator.appendChild(NewIndicatorPart2)
            NewIndicator.classList.add("message-receipt-visible")
            if (LastRead.nextSibling)
                MessageContainer.insertBefore(NewIndicator, LastRead.nextSibling)
            else
                MessageContainer.appendChild(NewIndicator)
        }
        if (ForceLastMessage)
            LastDelivered = ForceLastMessage
        if (LastDelivered && (LastRead != LastDelivered)) {
            const NewIndicator = document.createElement("div")
            NewIndicator.className = "message-receipt message-receipt-delivered"
            const NewIndicatorPart1 = document.createElement("span")
            NewIndicatorPart1.textContent = "Delivered"
            NewIndicator.appendChild(NewIndicatorPart1)
            NewIndicator.classList.add("message-receipt-visible")
            if (LastDelivered.nextSibling)
                MessageContainer.insertBefore(NewIndicator, LastDelivered.nextSibling)
            else
                MessageContainer.appendChild(NewIndicator)
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
}

const ApplyReactions = async (json) => {
    await HideReactionPopups();
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
    let StartingHeight = MessageContainer.scrollTop
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
                let Dot1 = document.createElement("div")
                Dot1.className = "message-reaction-dot message-reaction-dot-1"
                MessageReactionObject.appendChild(Dot1)
                let Dot2 = document.createElement("div")
                Dot2.className = "message-reaction-dot message-reaction-dot-2"
                MessageReactionObject.appendChild(Dot2)
                let TextContainer = document.createElement("div")
                TextContainer.textContent = ((text) => {
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
                MessageReactionObject.appendChild(TextContainer)
                if (json.action != "newReaction") {
                    MessageReactionObject.classList.add("message-reaction-visible")
                }
                Messages[i].appendChild(MessageReactionObject)
                if (json.action == "newReaction") {
                    await new Promise(r => setTimeout(r, 1000));
                    MessageReactionObject.classList.add("message-reaction-visible")
                }
            }
        }
    }
    let EndingHeight = MessageContainer.scrollHeight
    MessageContainer.scrollTop += EndingHeight - StartingHeight;
}

const ApplyTimestamps = (json) => {
    while (document.getElementsByClassName("message-timestamp-header")[0])
        document.getElementsByClassName("message-timestamp-header")[0].remove();
    let StartingHeight = MessageContainer.scrollTop
    let Messages = document.getElementsByClassName("message")
    let LastMessageTimestamp = 0
    for (let i = 0; i < Messages.length; i++) {
        let json = JSON.parse(Messages[i].getAttribute("rawjson"))
        if (json.date <= 0) continue;
        if ((json.date - LastMessageTimestamp) > 1000 * 60 * 60) { // > 1hr
            let MessageTimestampContainer = document.createElement("div")
            MessageTimestampContainer.className = "message-timestamp-header"

            let MessageTimestampDate = document.createElement("span")
            MessageTimestampDate.className = "message-date"
            MessageTimestampDate.textContent = ((Ts) => {
                const Dt = new Date(Ts)
                if (Date.now() - Ts > 1000 * 60 * 60 * 24 * 7) {
                    return `${Dt.getMonth() + 1}/${Dt.getDate()}/${Dt.getFullYear().toString().substring(2)}`
                }
                else if (Date.now() - Ts > 1000 * 60 * 60 * 24 * 2) {
                    return `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Dt.getDay()]
                        }`
                }
                else if (Date.now() - Ts > 1000 * 60 * 60 * 24) {
                    return `Yesterday`
                }
                else {
                    return `Today`
                }
            })(json.date)
            let MessageTimestampTime = document.createElement("span")
            MessageTimestampTime.textContent = ` ${GetTime(json.date)}`

            MessageTimestampContainer.appendChild(MessageTimestampDate)
            MessageTimestampContainer.appendChild(MessageTimestampTime)
            MessageContainer.insertBefore(MessageTimestampContainer, Messages[i])
        }
        else if ((json.date - LastMessageTimestamp) > 1000 * 60 * 10) { // > 10min
            let MessageTimestampContainer = document.createElement("div")
            MessageTimestampContainer.className = "message-timestamp-header"
            MessageContainer.insertBefore(MessageTimestampContainer, Messages[i])
        }

        LastMessageTimestamp = json.date
    }
    let EndingHeight = MessageContainer.scrollHeight
    MessageContainer.scrollTop += EndingHeight - StartingHeight;
}

SwapTab(0)

setInterval(() => {
    if (GlobalSocket.OPEN) {
        try {
            GlobalSocket.send(JSON.stringify({
                action: "fetchChats",
                data: {
                    offset: "0",
                    limit: "9999"
                },
                password: Password
            }))
        }
        catch {

        }
    }
}, 60000);

if (GetPrefetchedContacts()) {
    LoadFetchedChats(GetPrefetchedContacts())
}