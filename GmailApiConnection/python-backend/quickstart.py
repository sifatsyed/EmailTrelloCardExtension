from __future__ import print_function

import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from email_data import Email_Data

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']


def main():
    """Shows basic usage of the Gmail API.
    Lists the user's Gmail labels.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server()
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        # Call the Gmail API
        service = build('gmail', 'v1', credentials=creds)
        results = service.users().labels().list(userId='me').execute()
        labels = results.get('labels', [])

        # if not labels:
        #     print('No labels found.')
        #     return
        # print('Labels:')
        # for label in labels:
        #     labelId = label['id']
        #     labelRes = service.users().labels().get(userId='me', id=labelId).execute()

        #     labelName = labelRes['name']
        #     messagesTotal = labelRes['messagesTotal']
        #     messagesUnread = labelRes['messagesUnread']
        #     query = "Thank you"
        #     print(f"{labelName} - Total Messages: {messagesTotal}, Unread Messages: {messagesUnread}")

        messagesRes = service.users().messages().list(
            userId='me', maxResults=30).execute()
        # print(messagesRes)
        messages = messagesRes['messages']

        print(len(messages))
        
        i = 0;        
        for message in messages:
            res = service.users().messages().get(userId='me', id=message['id']).execute()
            emailData = Email_Data(res['id'], res['threadId'], res['labelIds'], res['snippet'])
            # print(emailData)        

            if 'CATEGORY_UPDATES' in emailData.labelIds:
                print(i)
                print(emailData)
                i += 1

            
            # print(update_messages['snippet'])

            # for i in range(len(update_messages)):
            #     print(update_messages[i])

            # for message in messages:
            #     res = service.users().messages().get(userId='me', id=message['id']).execute()
            #     messageId = res['id']
            #     labelIds = res['labelIds']
            #     snippet = res['snippet']
            #     print(f"{messageId} - Labels: {labelIds}, Body Snippet: {snippet}")

    except HttpError as error:
        # TODO(developer) - Handle errors from gmail API.
        print('An error occurred: {error}')


if __name__ == '__main__':
    main()