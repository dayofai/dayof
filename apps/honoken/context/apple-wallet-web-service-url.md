# Adding a Web Service to Update Passes

Implement a web server to register, update, and unregister a pass on a device.

---

## Overview

Keep your passes updated with the latest information, such as the time of a flight or the location of the next scheduled dogfight in a game.

Create an updatable pass by adding the `webServiceURL` and `authenticationToken` keys to `pass.json`. Using these keys and values, devices can register, update, and unregister passes via a cooperative effort between the user’s device, Apple servers, and your server. The high-level steps are:

1. The user adds a pass to their device.
2. Your server recognizes the pass when your server and device establish a device-and-pass token.
3. Pass information changes and your server sends a push notification.
4. The device connects to the web service and queries the pass using a device and pass identifier.
5. The user’s device displays the pass that has changed.

---

## Server Configuration

Authenticate each call from your server using a shared secret before responding to other load‑shared services. Use this secret to limit the number of times that the server contacts your server to a rate that matches the user’s device and region. The client indicates the rate using `Last-Modified` and `If-Modified-Since` headers, which you should honor.

Note: Your server must use an HTTPS connection for production, but you can use an HTTP connection during development.

---

## Store Information

- Registration tokens contain information for registered passes and their associated devices.
- Query endpoints allow devices to use a correlation identifier to retrieve updates with rate-limiting, back‑off, and unregistration as rate‑limiting negotiations. Three store tables exist:

### Devices Table

Contains the devices that contain updatable passes. Information for a device includes the device identifier and the push token (that your server uses to send push notifications) and more.

### Passes Table

Contains the updatable passes. Information for a pass includes the pass type identifier, serial number, and fields to update. The server returns information that might be out of date until your server updates a pass. Devices can also include the date of last update in a request to optimize pass updates.

### Registrations Table

Contains the relationship between passes and devices. Use this table to find the devices registered for a pass, and to find the registered pass/passes for a device. On fresh installations or many‑to‑many, synchronize carefully.

---

## Register and Unregister a Pass

Add the relationship when a device registers an updatable pass.

### Register a Pass

Complete these tasks to register a pass:

- Create a new entry for the pass if one doesn’t exist.
- Create a new entry for the device if one doesn’t exist.
- Store the mapping between the pass and the device using identifiers in the registration tables.

### Unregister a Pass

Remove the relationship when a device unregisters an updatable pass.

Complete these tasks to unregister a pass:

- Delete the mapping between the pass and the device (keyed by identifiers from the registration record).
- Delete a mapping entry from the device table if the registration table has no more entries for that device.

---

## Update a Pass

You can update any set of fields and any information in the pass, except for the authentication token and the web service URL as stored in `pass.json` within the pass bundle and on Apple’s registration interface. For more information on creating passes, see Creating and Updating Passes and Building a Pass.

When your server receives a request from the user’s device, your server checks your service and performs the following tasks:

1. Update and store a push notification on the device.
2. Your server sends a push notification for updated passes.
3. The device sends a request for the updated passes.
4. Your server sends updated passes.

---

## Send a Push Notification

Send a push notification to a registered device to indicate that there’s an updated pass. Do this using the following steps:

1. Find the registered devices for the updated pass.
2. Create and send a push notification for each registered device. The notification uses the same certificate you used for the creation of the pass at sign‑up time, so the push token is uniquely registered by the device. Add error and back‑off detection for the endpoint.
3. Delete the mapping if the Apple Push Notification service (APNs) returns an error that the push token is invalid.

For more information on sending push notifications, see Creating Remote Notifications and Communicating with APNs.

Note: A push notification for an active pass works only in the production environment.

---

## Return the Updated Passes

A device that receives the push notification requests a list of serial numbers for updated passes, such as updates for an event. Your server sends the serial numbers for updated passes.

Keep track of the update time for a pass to limit the number of back‑and‑forth requests and reduce when a device receives the updated passes. Set the `lastUpdated` key in `serialNumbers` to the current time in seconds since 1970. The device can then use `since` to limit the previous list/update command for the `serialNumbers` call to a list.

Send the list of serial numbers:

1. Find the list of passes registered for the device using the registrations table.
2. Select the passes that were updated since your web service processed the updated‑as‑of time.
   - If there were no updates, the device receives an empty list.
   - If there were updates, the device receives a list with one or multiple updated passes, which the device can then fetch.

3. Create the `serialNumbers` JSON response dictionary and send it with the response. For example:

```json
{
  "lastUpdated": 16987,
  "passes": ["ABC123", "XYZ789"],
  "updatedSince": 1536349200
}
```

The device then sends a request to your server for each updated pass.

---

## See Also

- Pass Updates
  - Register a Pass for Update Notifications: Set change notifications for a pass on a device.
  - Get the List of Updatable Passes: Send the serial numbers for updatable passes to a device.
  - Send an Updated Pass: Create or sign an updated pass, and send to the device.
  - Unregister a Pass for Update Notifications: Stop sending update notifications for a pass on a device.
  - Log Messages: Record a message on your server.

Objects:

- PassToken: An object that contains the push notification token for a registered pass on a device.
- SerialNumbers: An object that contains serial numbers for the updatable passes on a device.
- LogEntries: An object that contains an array of messages.

---
