[Skip Navigation](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications#app-main)

- [Wallet Passes](https://developer.apple.com/documentation/walletpasses)
- Register a Pass for Update Notifications

Web Service Endpoint

# Register a Pass for Update Notifications

Set up change notifications for a pass on a device.

iOS 10.0+iPadOS 6.0+watchOS 2.0+

## [URL](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications\#url)

```
POST https://yourpasshost.example.com/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
```

## [Path Parameters](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications\#path-parameters)

`deviceLibraryIdentifier`

`string`

(Required)

A unique identifier you use to identify and authenticate the device.

`passTypeIdentifier`

`string`

(Required)

The pass type identifier of the pass to register for update notifications. This value corresponds to the value of the `passTypeIdentifier` key of the pass.

`serialNumber`

`string`

(Required)

The serial number of the pass to register. This value corresponds to the `serialNumber` key of the pass.

## [Header Parameters](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications\#header-parameters)

`Authorization`

`string`

The authentication for a pass. The value is the word `ApplePass`, followed by a space, followed by the `authenticationToken` key of the pass.

Value: `ApplePass {passAuthorizationToken}`

## [HTTP Body](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications\#http-body)

`PushToken`

An object that contains the push notification token for the registered pass on the device.

Content-Type: application/json

## [Response Codes](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications\#response-codes)

`200 Serial Number Already Registered for Device`

`Serial Number Already Registered for Device`

The serial number is already registered for the device.

`201 Registration Successful`

`Registration Successful`

The registration is successful.

`401 Request Not Authorized`

`Request Not Authorized`

The request isn’t authorized.

## [See Also](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications\#see-also)

### [Pass Updates](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications\#Pass-Updates)

[Adding a Web Service to Update Passes](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes)

Implement a web server to register, update, and unregister a pass on a device.

[`Get the List of Updatable Passes`](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes)

Send the serial numbers for updated passes to a device.

[`Send an Updated Pass`](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass)

Create and sign an updated pass, and send it to the device.

[`Unregister a Pass for Update Notifications`](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications)

Stop sending update notifications for a pass on a device.

[`Log a Message`](https://developer.apple.com/documentation/walletpasses/log-a-message)

Record a message on your server.

[`object PushToken`](https://developer.apple.com/documentation/walletpasses/pushtoken)

An object that contains the push notification token for a registered pass on a device.

[`object SerialNumbers`](https://developer.apple.com/documentation/walletpasses/serialnumbers)

An object that contains serial numbers for the updatable passes on a device.

[`object LogEntries`](https://developer.apple.com/documentation/walletpasses/logentries)

An object that contains an array of messages.

Current page is Register a Pass for Update Notifications

---

[Skip Navigation](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes#app-main)

- [Wallet Passes](https://developer.apple.com/documentation/walletpasses)
- Get the List of Updatable Passes

Web Service Endpoint

# Get the List of Updatable Passes

Send the serial numbers for updated passes to a device.

iOS 10.0+iPadOS 6.0+watchOS 2.0+

## [URL](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes\#url)

```
GET https://yourpasshost.example.com/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}?passesUpdatedSince={previousLastUpdated}
```

## [Path Parameters](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes\#path-parameters)

`deviceLibraryIdentifier`

`string`

(Required)

The unique identifier for the device.

`passTypeIdentifier`

`string`

(Required)

The pass type identifier of the pass to check for updates. This value corresponds to the value of the `passTypeIdentifier` key of the pass.

`previousLastUpdated`

`string`

(Required)

The value of the `lastUpdated` key from the [`SerialNumbers`](https://developer.apple.com/documentation/walletpasses/serialnumbers) object returned in a previous request. This value limits the results of the current request to the passes updated since that previous request.

## [Response Codes](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes\#response-codes)

`200 Return Matching Passes`

`SerialNumbers`

`Return Matching Passes`

On success, the call returns an object that contains the serial numbers for the matching passes.

Content-Type: application/json

`204 No Matching Passes`

`No Matching Passes`

There are no matching passes.

## [Mentioned in](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes\#mentions)

[Adding a Web Service to Update Passes](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes)

## [See Also](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes\#see-also)

### [Pass Updates](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes\#Pass-Updates)

[Adding a Web Service to Update Passes](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes)

Implement a web server to register, update, and unregister a pass on a device.

[`Register a Pass for Update Notifications`](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications)

Set up change notifications for a pass on a device.

[`Send an Updated Pass`](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass)

Create and sign an updated pass, and send it to the device.

[`Unregister a Pass for Update Notifications`](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications)

Stop sending update notifications for a pass on a device.

[`Log a Message`](https://developer.apple.com/documentation/walletpasses/log-a-message)

Record a message on your server.

[`object PushToken`](https://developer.apple.com/documentation/walletpasses/pushtoken)

An object that contains the push notification token for a registered pass on a device.

[`object SerialNumbers`](https://developer.apple.com/documentation/walletpasses/serialnumbers)

An object that contains serial numbers for the updatable passes on a device.

[`object LogEntries`](https://developer.apple.com/documentation/walletpasses/logentries)

An object that contains an array of messages.

Current page is Get the List of Updatable Passes

---

[Skip Navigation](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes#app-main)

- [Wallet Passes](https://developer.apple.com/documentation/walletpasses)
- Adding a Web Service to Update Passes

Article

# Adding a Web Service to Update Passes

Implement a web server to register, update, and unregister a pass on a device.

## [Overview](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes\#overview)

Keep your users’ pass updated with the latest information, such as the time of a flight or the location of the next geocached object in a game.

![A diagram of the client and server flow for a user to update a pass. The server creates a pass which the user installs. Some time later the pass is updated, the server and client go through the update flow, and at some later time the user views the pass.](https://docs-assets.developer.apple.com/published/6a8e13984b4c1a7bdf413aed9e357a55/media-3737830%402x.png)

Create an updatable pass by adding the `webServiceURL` and `authenticationToken` keys to [`Pass`](https://developer.apple.com/documentation/walletpasses/pass). The system calls your server endpoints using the base URL you provide. Updating a pass is a cooperative effort between the user’s device, Apple servers, and your server. The high-level steps are:

1. The user installs a pass that supports updates on their device.

2. The user’s device registers the pass with your server and provides a device identifier and a push token.

3. Pass information changes and your server sends a push notification.

4. The user’s device receives the notification and queries your server for updated passes.

5. The user’s device requests each pass that has changed.

### [Server Configuration](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes\#Server-Configuration)

Authenticate each call to your server using a shared secret before responding using one of two shared secrets. Use the value of `authenticationToken` for the pass to authenticate the calls that register and unregister a pass, and to send an updated pass. The other shared secret is the _device library ID_, a value that’s sent by the device when the device registers a pass. Use this secret to authenticate the call for the serial numbers of updated passes.

#### [Store Information](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes\#Store-Information)

Updating passes requires storing information for the registered passes and for their associated devices. One way you can store these details is to use a traditional relational database with two entities – devices and passes – and one relationship, registrations. The three tables are:

Device table

Contains the devices that contain updatable passes. Information for a device includes the device library identifier and the push token that your server uses to send update notifications.

Pass table

Contains the updatable passes. Information for a pass includes the pass type identifier, serial number, and a last-update tag. You define the contents of this tag and use it to track when you last updated a pass. The table can also include other data that you require to generate an updated pass.

Registration table

Contains the relationships between passes and devices. Use this table to find the devices registered for a pass, and to find all the registered passes for a device. Both relationships are many-to-many.

### [Register and Unregister a Pass](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes\#Register-and-Unregister-a-Pass)

Add the relationship when a device registers an updatable pass.

![An illustration that shows the call to register a pass. The client sends the server a pass type ID, serial number, authentication token, device library ID, and a push token.](https://docs-assets.developer.apple.com/published/844b5602687e1b03836d55f776daf84e/media-3737836%402x.png)

Complete these tasks to register a pass:

- Create a new entry for the pass if one doesn’t exist.

- Create a new entry for the device if one doesn’t exist.

- Store the mapping between the pass and the device library identifier in the registrations table.

Remove the relationship when a device unregisters an updateable pass.

![An illustration that shows the call to unregister a pass. The client sends the server a pass type ID, serial number, authentication token, and device library ID.](https://docs-assets.developer.apple.com/published/8229d2e7d19a0a591cf90929469c6c89/media-3737831%402x.png)

Complete these tasks to unregister a pass:

- Delete the mapping between the pass and the device library identifier from the registrations table.

- Delete the device entry from the device table if the registration table has no more entries for that device.

### [Update a Pass](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes\#Update-a-Pass)

You can update any type of pass and any information in the pass, except for the authentication token and the serial number. An updated pass is a new pass with the same pass type identifier and serial number. For more information on creating a pass, see [Creating the Source for a Pass](https://developer.apple.com/documentation/walletpasses/creating-the-source-for-a-pass) and [Building a Pass](https://developer.apple.com/documentation/walletpasses/building-a-pass).

Updating the pass involves several steps for both your server and the client device that contains the pass:

- Your server sends a push notification to the device.

- The device requests the serial numbers for updated passes.

- Your server sends the serial numbers for the updated passes.

- The device requests a specific pass.

- Your server sends the updated pass.

#### [Send a Push Notification](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes\#Send-a-Push-Notification)

![An illustration that shows the flow of sending an update notification to a client device. The server sends an Apple Push Notification for a pass type ID using the push token for the device.](https://docs-assets.developer.apple.com/published/01e4d374e824d44b0fef1464bae944df/media-3737835%402x.png)

Send a push notification to a registered device to indicate that there’s an updated pass. Do this using the following steps:

- Find the registered devices for the updated pass.

- Create and send a push notification for each registered device. The notification uses the same certificate and private key that the creator of the pass used to sign the original, the push token registered by the device, and an empty JSON dictionary for the payload.

Delete a device if the Apple Push Notification service (APNs) returns an error that the push token is invalid.

For more information on sending push notifications, see [Sending notification requests to APNs](https://developer.apple.com/documentation/UserNotifications/sending-notification-requests-to-apns).

#### [Return the Updated Passes](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes\#Return-the-Updated-Passes)

A device that receives the push notification requests a list of serial numbers for updated passes, such as a tickets to an event. Your server sends the serial numbers for updated passes.

![An illustration that shows the flow of updating a pass. The client sends the pass type ID, device library ID, and an update tag to request the updated passes. The server then sends the updated serial numbers with an update tag. The client then requests an updated pass sending a pass type ID, serial number and authentication. Finally the server sends the pass data.](https://docs-assets.developer.apple.com/published/62440eba4f5b58a5b78a014a1a00d490/media-3737834%402x.png)

Keep track of the update time of a pass to limit the number of serial numbers your server sends when a device requests the updated passes. Set the `lastUpdated` key of [`SerialNumbers`](https://developer.apple.com/documentation/walletpasses/serialnumbers) to the last update time. The device saves the value and uses it to set the `previousLastUpdated` command line argument of [`Get the List of Updatable Passes`](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes).

To send the list of serial numbers:

1. Find the list of passes registered for the device using the registrations table.

2. Select the passes that have been updated since your web service provided the `updated` tag, or all passes when there’s no tag. If there are multiple updates to a pass, select the one with the most recent update.

3. Create the [`SerialNumbers`](https://developer.apple.com/documentation/walletpasses/serialnumbers) JSON response dictionary and send it with the response. For example:

```
{
    "serialNumbers" : ["001", "020", "3019"],
    "lastUpdated" : "1351981923"
}

```

The device then sends a request to your server for each updated pass.

## [See Also](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes\#see-also)

### [Pass Updates](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes\#Pass-Updates)

[`Register a Pass for Update Notifications`](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications)

Set up change notifications for a pass on a device.

[`Get the List of Updatable Passes`](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes)

Send the serial numbers for updated passes to a device.

[`Send an Updated Pass`](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass)

Create and sign an updated pass, and send it to the device.

[`Unregister a Pass for Update Notifications`](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications)

Stop sending update notifications for a pass on a device.

[`Log a Message`](https://developer.apple.com/documentation/walletpasses/log-a-message)

Record a message on your server.

[`object PushToken`](https://developer.apple.com/documentation/walletpasses/pushtoken)

An object that contains the push notification token for a registered pass on a device.

[`object SerialNumbers`](https://developer.apple.com/documentation/walletpasses/serialnumbers)

An object that contains serial numbers for the updatable passes on a device.

[`object LogEntries`](https://developer.apple.com/documentation/walletpasses/logentries)

An object that contains an array of messages.

Current page is Adding a Web Service to Update Passes

---

[Skip Navigation](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications#app-main)

- [Wallet Passes](https://developer.apple.com/documentation/walletpasses)
- Unregister a Pass for Update Notifications

Web Service Endpoint

# Unregister a Pass for Update Notifications

Stop sending update notifications for a pass on a device.

iOS 10.0+iPadOS 6.0+watchOS 2.0+

## [URL](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications\#url)

```
DELETE https://yourpasshost.example.com/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
```

## [Path Parameters](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications\#path-parameters)

`deviceLibraryIdentifier`

`string`

(Required)

The identifier for the device that’s making the request.

`passTypeIdentifier`

`string`

(Required)

The pass type identifier of the pass to unregister. This value corresponds to the value of the `passTypeIdentifier` key of the pass.

`serialNumber`

`string`

(Required)

The serial number of the pass to unregister. This value corresponds to the `serialNumber` key of the pass.

## [Header Parameters](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications\#header-parameters)

`Authorization`

`string`

The authentication for a pass. The value is the word `ApplePass`, followed by a space, followed by the `authenticationToken` key of the pass.

Value: `ApplePass {passAuthorizationToken}`

## [Response Codes](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications\#response-codes)

`200 Device Unregistered`

`Device Unregistered`

The pass unregistration is successful.

`401 Request Not Authorized`

`Request Not Authorized`

The request isn’t authorized.

## [See Also](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications\#see-also)

### [Pass Updates](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications\#Pass-Updates)

[Adding a Web Service to Update Passes](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes)

Implement a web server to register, update, and unregister a pass on a device.

[`Register a Pass for Update Notifications`](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications)

Set up change notifications for a pass on a device.

[`Get the List of Updatable Passes`](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes)

Send the serial numbers for updated passes to a device.

[`Send an Updated Pass`](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass)

Create and sign an updated pass, and send it to the device.

[`Log a Message`](https://developer.apple.com/documentation/walletpasses/log-a-message)

Record a message on your server.

[`object PushToken`](https://developer.apple.com/documentation/walletpasses/pushtoken)

An object that contains the push notification token for a registered pass on a device.

[`object SerialNumbers`](https://developer.apple.com/documentation/walletpasses/serialnumbers)

An object that contains serial numbers for the updatable passes on a device.

[`object LogEntries`](https://developer.apple.com/documentation/walletpasses/logentries)

An object that contains an array of messages.

Current page is Unregister a Pass for Update Notifications

---

[Skip Navigation](https://developer.apple.com/documentation/walletpasses/log-a-message#app-main)

- [Wallet Passes](https://developer.apple.com/documentation/walletpasses)
- Log a Message

Web Service Endpoint

# Log a Message

Record a message on your server.

iOS 10.0+iPadOS 6.0+watchOS 2.0+

## [URL](https://developer.apple.com/documentation/walletpasses/log-a-message\#url)

```
POST https://yourpasshost.example.com/v1/log
```

## [HTTP Body](https://developer.apple.com/documentation/walletpasses/log-a-message\#http-body)

`LogEntries`

An object that contains an array of messages.

Content-Type: application/json

## [Response Codes](https://developer.apple.com/documentation/walletpasses/log-a-message\#response-codes)

`200 OK`

`OK`

The request is successful.

## [See Also](https://developer.apple.com/documentation/walletpasses/log-a-message\#see-also)

### [Pass Updates](https://developer.apple.com/documentation/walletpasses/log-a-message\#Pass-Updates)

[Adding a Web Service to Update Passes](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes)

Implement a web server to register, update, and unregister a pass on a device.

[`Register a Pass for Update Notifications`](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications)

Set up change notifications for a pass on a device.

[`Get the List of Updatable Passes`](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes)

Send the serial numbers for updated passes to a device.

[`Send an Updated Pass`](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass)

Create and sign an updated pass, and send it to the device.

[`Unregister a Pass for Update Notifications`](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications)

Stop sending update notifications for a pass on a device.

[`object PushToken`](https://developer.apple.com/documentation/walletpasses/pushtoken)

An object that contains the push notification token for a registered pass on a device.

[`object SerialNumbers`](https://developer.apple.com/documentation/walletpasses/serialnumbers)

An object that contains serial numbers for the updatable passes on a device.

[`object LogEntries`](https://developer.apple.com/documentation/walletpasses/logentries)

An object that contains an array of messages.

Current page is Log a Message

---

[Skip Navigation](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass#app-main)

- [Wallet Passes](https://developer.apple.com/documentation/walletpasses)
- Send an Updated Pass

Web Service Endpoint

# Send an Updated Pass

Create and sign an updated pass, and send it to the device.

iOS 10.0+iPadOS 6.0+watchOS 2.0+

## [URL](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass\#url)

```
GET https://yourpasshost.example.com/v1/passes/{passTypeIdentifier}/{serialNumber}
```

## [Path Parameters](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass\#path-parameters)

`passTypeIdentifier`

`string`

(Required)

The pass type identifier of the pass to update. This value corresponds to the value of the `passTypeIdentifier` key of the pass.

`serialNumber`

`string`

(Required)

The serial number of the pass to update. This value corresponds to the `serialNumber` key of the pass.

## [Header Parameters](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass\#header-parameters)

`Authorization`

`string`

The authentication for a pass. The value is the word `ApplePass`, followed by a space, followed by the `authenticationToken` key of the pass.

Value: `ApplePass {passAuthorizationToken}`

## [Response Codes](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass\#response-codes)

`200 OK`

`OK`

The request is successful and returns the updated pass.

Content-Type: application/vnd.apple.pkpass

`401 Request Not Authorized`

`Request Not Authorized`

The request isn’t authorized.

## [See Also](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass\#see-also)

### [Pass Updates](https://developer.apple.com/documentation/walletpasses/send-an-updated-pass\#Pass-Updates)

[Adding a Web Service to Update Passes](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes)

Implement a web server to register, update, and unregister a pass on a device.

[`Register a Pass for Update Notifications`](https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications)

Set up change notifications for a pass on a device.

[`Get the List of Updatable Passes`](https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes)

Send the serial numbers for updated passes to a device.

[`Unregister a Pass for Update Notifications`](https://developer.apple.com/documentation/walletpasses/unregister-a-pass-for-update-notifications)

Stop sending update notifications for a pass on a device.

[`Log a Message`](https://developer.apple.com/documentation/walletpasses/log-a-message)

Record a message on your server.

[`object PushToken`](https://developer.apple.com/documentation/walletpasses/pushtoken)

An object that contains the push notification token for a registered pass on a device.

[`object SerialNumbers`](https://developer.apple.com/documentation/walletpasses/serialnumbers)

An object that contains serial numbers for the updatable passes on a device.

[`object LogEntries`](https://developer.apple.com/documentation/walletpasses/logentries)

An object that contains an array of messages.

Current page is Send an Updated Pass
