# iMessage

> [!WARNING]  
> **This repository is currently not being maintained**, as I have personally started using OpenBubbles with phone number registration. Many features are incomplete, though base functionality should still work.

### What is this?
This is an alternate web-based frontend/app for the [WebMessage tweak by sgtaziz](https://github.com/sgtaziz/WebMessage-Tweak) (backend) which aims to directly imitate Apple's "Messages" app.

### Why?
The current solution to allow sending/receiving iMessages from an Android device is through BlueBubbles using [bluebubbles-server](https://github.com/BlueBubblesApp/bluebubbles-server). There are a few other methods, but ultimately they all rely on having a Mac device connected to the internet to act as a server to send iMessages from. As this Mac will send iMessages using an Apple ID by default, adding phone number registration is another step that requires an iPhone with a duplicate SIM card. This iPhone also needs to be connected to the internet and turned on at all times to keep the phone number registered to the Apple ID.

Using this frontend, alongside [WebMessage-Tweak](https://github.com/sgtaziz/WebMessage-Tweak), **a Mac device is not required at all**. The same iPhone used for phone number registration can also be used as the messaging server. **A separate SIM card is not required** if you choose to install [SIMLessPNRGateway](https://github.com/AwesomeIndustry/SIMLessPNRGateway) on the iPhone.

# Usage

### 1. Dummy iPhone configuration

This setup requires a jailbroken iPhone with root access. For my tests and development, I used an iPhone 5S running iOS 12.4.1.

> Before compiling/installing [WebMessage-Tweak](https://github.com/sgtaziz/WebMessage-Tweak), you may wish to first install and use [SIMLessPNRGateway](https://github.com/AwesomeIndustry/SIMLessPNRGateway) to register a phone number to your Apple ID without needing a separate SIM card. For installation instructions, check AwesomeIndustry's repo.

1. Add the repo https://sgtaziz.github.io/repo to Cydia (or your preferred package manager) to make the WebMessage tweak available.
2. Install the **WebMessage** tweak on the jailbroken iPhone and respring if necessary.
    - **NOTE:** This repo utilizes a directory traversal [vulnerability](https://github.com/sgtaziz/WebMessage-Tweak/blob/5a7373e92e4d9d493feef39f2ea51a64c97544a5/WebMessage/WebMessageServer.swift#L470C7-L470C68) in **WebMessage-Tweak** to retrieve the iOS version from the server. I doubt that this will be fixed in a future update, but in case it is, [here](https://github.com/sgtaziz/WebMessage-Tweak/tree/5a7373e92e4d9d493feef39f2ea51a64c97544a5) is the commit I compiled and used on my iPhone.
3. Open the **Settings** app and scroll to the **WebMessage** panel to perform additional configuration.
    - Here, you can add a password to the WebMessage server.
    - You can also change the port that WebMessage communicates over.
      - **NOTE:** If you want to be able to send messages from anywhere, this port will need to be forwarded through your router software.

### 2. Frontend configuration

> Before we begin, this project requires Node (and therefore NPM) to compile. If you don't already have it, [download and install Node](https://nodejs.org/en/download/prebuilt-installer/current).

1. Clone this repository and `cd` into it.
    - You may need to clone recursively to fetch the `/fonts` submodule.
2. Install required dependencies by running the command `npm i`
3. Run `npm run build` to generate files.
4. Your output files are in the `/build` directory.
    - Note that all subdirectories of `/build` are **dependencies** of the HTML file.
5. Port the output HTML to any platform with a web renderer!

### 3. Usage
1. Open the iMessage settings pane by clicking the gear icon in the top-right corner.
2. Enter the IP address of your iPhone server running WebMessage
    - This will be your public IP address if you chose to port-forward, and it will be the private IP address of the iPhone if you chose not to.
3. Enter the port that WebMessage-Tweak is running on
4. If you are running WebMessage through an HTTPS proxy such as Cloudflare or WebMessage-Tweak's websocket would require a secure connection for any reason, enable the "HTTPS" toggle.
5. Enter in your server's password, if necessary.
6. Restart iMessage either by refreshing the page or by clicking the "Force Refresh" button.

### Special Thanks
- [sgtaziz](https://github.com/sgtaziz) for creating `WebMessage-Tweak`

# Feature Support

### Basic functionality
- [x] Sending iMessages
- [x] Receiving iMessages

### Typing indicators
- [x] Receive/view typing indicators
- [x] Send typing indicators (optional)

### Reactions
- [x] Add reactions
- [x] Remove reactions
- [x] View reactions from others

### Receipts
- [x] Message "Delivered" receipts 
- [x] Receive "Read" receipts
- [x] Send read receipts (optional) 

### Contacts
- [x] Contact names
- [x] Contact profile pictures
  - [x] Custom picture support
  - [x] Placeholder images using contact name initials

### Additional iMessage features
- [x] Receive/view messages with Subject line
- [x] Send messages with Subject line
- [ ] iMessage Apps/Games
  - See *Note 2*.
- [ ] Pinned/favorited contacts

### Message attachments
- Images
  - [x] Receive/display
    - See *Note 1*.
  - [ ] Send
- Video
  - [x] Receive/display
    - See *Note 1*.
  - [ ] Send
- Other media types
  - [x] Receive/download
  - [ ] Send
  
### Message editing/deleting
- [x] Recipient edits messages
- [x] Recipient deletes messages
- [ ] Editing own messages
- [ ] Deleting own messages
- *Cannot be implemented as message editing/deletion is not supported on iOS 12. This client still shows a "Edited '<message>'" or "Deleted '<message>'" but this cannot be changed/fixed as these messages are sent from the recipient iPhone when it detects that the server device does not support these features.*

### Notes
1. Images and other media content will refuse to load on browsers that force upgrading insecure (http) requests. Should work fine in http-only contexts, or when using a custom certificate.
2. iMessage apps/games modals are displayed correctly in this client, but currently cannot be interacted with.

### Known bugs/other
1. Messages currently do not continue to load after scrolling upward.
2. All forms of message notifications are unavailable, as each implementation is highly platform-dependent.
