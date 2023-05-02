const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listLabels(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.labels.list({
        userId: 'me',
    });
    const labels = res.data.labels;
    if (!labels || labels.length === 0) {
        console.log('No labels found.');
        return;
    }
    console.log('Labels:');
    for (const label of labels) {
        const labelId = label.id;
        const labelRes = await gmail.users.labels.get({
            userId: 'me',
            id: labelId,
        });
        const labelObj = labelRes.data;
        const labelName = labelObj.name;
        const messagesTotal = labelObj.messagesTotal;
        const messagesUnread = labelObj.messagesUnread;
        // console.log(`${labelName} - Total Messages: ${messagesTotal}, Unread Messages: ${messagesUnread}`);
        const messagesRes = await gmail.users.messages.list({
            userId: 'me',
            q: 'label:CATEGORY_UPDATES',
            maxResults: 20
        });

        console.log(messagesRes.data)

        if (labelName === 'CATEGORY_UPDATES') {
            const messagesRes = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 10
            });
            // console.log(messagesRes.data.messages)

            const mes = messagesRes.data.messages
            console.log(mes[0].id)
            const messageData = await gmail.users.messages.get({
                userId: 'me',
                id: mes[0].id,
            });
            console.log(messageData);
            for (const message of mes) {
                const res = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id,
                });
                const messageData = res.data;
                const messageId = messageData.id
                const labelIds = messageData.labelIds
                const snippet = messageData.snippet
                console.log(`${messageId} - Labels: ${labelIds}, Body Snippet: ${snippet}`);
            }
        }
    }
}

async function readUpdateMessages(messages) {
    for (const message of messages) {
        messageData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
        });
        console.log(messageData.data);
    }
}

authorize()
    .then(listLabels)
    .catch(console.error);