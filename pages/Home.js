const fs = require('fs').promises
const path = require('path')
const { Log, LogColors } = require("../Log")
const Home = async () => {
    return `
    <!DOCTYPE html>
    <style>${
        await (async() => {
            Log(`Embedding file "../build/production.css" into HTML document!`, LogColors.Success)
            return await fs.readFile(path.join(__dirname, "../build/production.css"), { encoding: "utf-8" })    
        })()
    }</style>
    <title>Messages</title>
    <main> 
        <div class="page-view tab-visible" id="page0">
            <div class="fullscreen-scroll">
            
                <div class="page-padding" style="flex: 0 1 auto;">
                    <div class="homepage-toolbar">
                        <p class="edit-list" onclick="Refresh()">
                            Refresh
                        </p>
                        <p class="new-message">
                            <span class="settings-button" onclick="ShowSettings()">􀍟</span>
                            <!-- <span class="new-message-button">􀈎</span> --!>
                        </p>
                    </div>
                    <h1 class="app-header" style="margin-bottom: -20px;">Messages</h1>
                    <input tabindex="-1" class="search-box" type="text" onkeyup="SearchContacts()" value="" placeholder="􀊫 Search"/>
                </div>
                <div id="homepage-contacts" style="overflow-y: scroll; flex: 1 1 auto;">
                
                </div>
            </div>
        </div>
        <div class="page-view tab-hidden" id="page1">
            
            <div class="messaging-toolbar">
                <div class="page-padding">
                    <div class="homepage-toolbar">
                        <p class="edit-list" style="min-width: 25px;" onclick="SwapTab(0)">
                            􀆉
                        </p>
                        <div>
                            <div id="user-avatar-container">
                            </div>
                            <p id="avatar-name">
                                <span id="contact-name" class="privacy-hidden">
                                    Unknown
                                </span>
                                <span id="contact-chevron">
                                    􀆊
                                </span>
                            </p>
                        </div>
                        <p class="new-message-button" style="margin-left: auto;" onclick="ShowSettings()">
                        􀍟
                        </p>
                    </div>
                </div>
                <div class="separator-fullwidth">
                </div>
            </div>
            <div id="messages-container" style="flex: 1 1 auto;">

            </div>
            <div id="send-toolbar">
                <div id="send-toolbar-inner">
                    <div id="send-inputs-container">
                        <input tabindex="-1" class="message-input message-input-subject" type="text" placeholder="Subject" id="message-input-subject">
                        <input tabindex="-1" class="message-input" type="text" placeholder="iMessage" id="message-input">
                    </div>
                </div>
            </div>

        </div>
        <div class="page-view page-view-popup page-view-popup-hidden" id="settings-page">
            <div class="settings-scroll">
                <div class="page-padding">
                    <div class="page-view-handle" onclick="HideSettings()">
                    </div>
                    <div class="homepage-toolbar homepage-toolbar-settings">
                        <p class="edit-list" onclick="HideSettings()">
                            Close
                        </p>
                        <p class="new-message" onclick="Refresh()">
                            Force Refresh
                        </p>
                    </div>
                    <h1 class="app-header">Settings</h1>
                    <div class="settings-option-container">
                        <div class="settings-option">
                            <p class="settings-option-name">IP Address</p>
                            <input tabindex="-1" class="settings-option-input privacy-hidden" id="settings-option-host" type="text" placeholder="192.168.1.1" onkeyup="SaveSettings()" />
                            <p class="settings-option-chevron">􀆊</p>
                        </div>
                        <div class="settings-option-separator">
                        </div>
                        <div class="settings-option">
                            <p class="settings-option-name">Port</p>
                            <input tabindex="-1" class="settings-option-input privacy-hidden" id="settings-option-port" type="text" placeholder="8080" onkeyup="SaveSettings()" />
                            <p class="settings-option-chevron">􀆊</p>
                        </div>
                        <div class="settings-option-separator">
                        </div>
                        <div class="settings-option">
                            <p class="settings-option-name">Password</p>
                            <input tabindex="-1" class="settings-option-input" id="settings-option-password" type="password" placeholder="Optional" onkeyup="SaveSettings()"/>
                            <p class="settings-option-chevron">􀆊</p>
                        </div>
                        <div class="settings-option-separator">
                        </div>
                        <div class="settings-option">
                            <p class="settings-option-name">HTTPS</p>
                            <div class="settings-option-checkbox" id="settings-option-usehttps" checked="false">
                                <div class="settings-option-checkbox-inner">
                                </div>
                            </div>
                        </div>
                        <!-- <div class="settings-option" onclick="TestServerConnection()">
                            <p class="settings-option-name">Reconnect</p>
                            <p class="settings-option-value"></p>
                            <p class="settings-option-chevron">􀆊</p>
                        </div> -->
                        <div class="settings-option-separator">
                        </div>
                        <div class="settings-option">
                            <p class="settings-option-name">Current Status</p>
                            <p class="settings-option-value" id="server-connection-status" style="opacity: 1; color: var(--accent-3);">Inactive</p>
                        </div>
                    </div>
                    <div class="settings-option-footer privacy-hidden" style="display: none;" id="settings-option-showurl">
                        Socket address:
                    </div>
                    
                    <div class="settings-option-header">
                        Client Settings
                    </div>
                    <div class="settings-option-container">
                        <div class="settings-option">
                            <p class="settings-option-name">Dark Mode</p>
                            <div class="settings-option-checkbox" id="settings-option-usedarkmode" checked="false">
                                <div class="settings-option-checkbox-inner">
                                </div>
                            </div>
                        </div>
                        <div class="settings-option-separator">
                        </div>
                        <div class="settings-option">
                            <p class="settings-option-name">Privacy Mode</p>
                            <div class="settings-option-checkbox" id="settings-option-useprivacymode" checked="false">
                                <div class="settings-option-checkbox-inner">
                                </div>
                            </div>
                        </div>
                        <div class="settings-option-separator">
                        </div>
                        <div class="settings-option">
                            <p class="settings-option-name">Send Read Receipts</p>
                            <div class="settings-option-checkbox" id="settings-option-usereadreceipts" checked="false">
                                <div class="settings-option-checkbox-inner">
                                </div>
                            </div>
                        </div>
                        <div class="settings-option-separator">
                        </div>
                        <div class="settings-option">
                            <p class="settings-option-name">Send Typing Indicators</p>
                            <div class="settings-option-checkbox" id="settings-option-usetypingindicators" checked="false">
                                <div class="settings-option-checkbox-inner">
                                </div>
                            </div>
                        </div>
                        <div class="settings-option-separator">
                        </div>
                        <div class="settings-option">
                            <p class="settings-option-name">Show Subject Field</p>
                            <div class="settings-option-checkbox" id="settings-option-usesubjectline" checked="false">
                                <div class="settings-option-checkbox-inner">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="settings-option-header">
                        Server Information
                    </div>
                    <div class="settings-option-container">
                        <div class="settings-option">
                            <p class="settings-option-name">iOS Version</p>
                            <p class="settings-option-value" id="server-connection-version">Unknown</p>
                        </div>
                        <div class="settings-option-separator">
                        </div>
                        <div class="settings-option">
                            <p class="settings-option-name">iOS Build</p>
                            <p class="settings-option-value" id="server-connection-build">Unknown</p>
                        </div>
                    </div>

                    <div class="settings-option-header">
                        About
                    </div>
                    <div class="settings-option-container">
                        <div class="settings-option">
                            <p class="settings-option-name">Developer</p>
                            <p class="settings-option-value">strayfade</p>
                        </div>
                        <div class="settings-option-separator">
                        </div>
                        <div class="settings-option">
                            <p class="settings-option-name">GitHub</p>
                            <p class="settings-option-value" style="opacity: 1;">
                                <a href="https://github.com/strayfade">https://github.com/strayfade</a>
                            </p>
                        </div>
                    </div>
                    <div class="settings-option-footer">
                        Made with <3 by strayfade
                    </div>
                </div>
            </div>
        </div>
    </main>

    <div class="backdrop-blur backdrop-blur-hidden" onclick="HideReactionPopups()"></div>
    
    <script>${
        await (async() => {
            Log(`Embedding file "../build/production.js" into HTML document!`, LogColors.Success)
            return await fs.readFile(path.join(__dirname, "../build/production.js"), { encoding: "utf-8" })    
        })()
    }</script>
    `
}
module.exports = { Home }