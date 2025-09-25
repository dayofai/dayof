# Apple Wallet Event Ticket Pass (Poster Event Ticket) — Full Reference and Example

This guide explains the structure of an Apple Wallet Event Ticket (poster event ticket-capable) `pass.json`, including required vs optional fields, constraints, and a complete example you can adapt with real data. It also covers multievent “Upcoming Pass Information” (iOS 19+).

## Overview

- Target pass type: Event Ticket (poster event ticket; inherits PassFields)

- Signing: Must be signed with your Pass Type ID certificate

- Scope: Event ticket passes and multievent upcoming entries

## Minimum Required Keys (top level)

- `formatVersion` = 1

- `passTypeIdentifier`

- `serialNumber`

- `teamIdentifier`

- `organizationName`

- `description`

- `eventTicket` (object with one or more field groups)

Highly recommended:

- `barcodes` (at least one)

- Colors (`backgroundColor`, `foregroundColor`, `labelColor`) or `useAutomaticColors` (poster)

- `semantics` (event info)

- `relevantDates` and/or `locations`/`beacons` (to surface the pass)

## Full Example `pass.json`

Notes:

- Replace placeholder values with real data.

- JSON does not allow comments; remove any explanatory remarks before production.

```json
{
  "formatVersion": 1,

  "passTypeIdentifier": "pass.com.example.event-ticket-concert",

  "serialNumber": "UNIQUE_SERIAL_NUMBER_12345",

  "teamIdentifier": "YOUR_TEAM_ID",

  "webServiceURL": "https://example.com/passes/",

  "authenticationToken": "YOUR_AUTHENTICATION_TOKEN",

  "organizationName": "The Grand Venue",

  "description": "Ticket for the Annual Grand Concert",

  "logoText": "The Grand Venue",

  "foregroundColor": "rgb(255, 255, 255)",

  "backgroundColor": "rgb(45, 50, 65)",

  "labelColor": "rgb(215, 215, 215)",

  "useAutomaticColors": false,

  "groupingIdentifier": "CONCERT_SERIES_2025",

  "suppressStripShine": false,

  "sharingProhibited": false,

  "voided": false,

  "expirationDate": "2025-12-31T23:59:59Z",

  "locations": [
    {
      "longitude": -122.398768,

      "latitude": 37.779335,

      "relevantText": "You are near The Grand Venue!"
    }
  ],

  "maxDistance": 500,

  "beacons": [
    {
      "proximityUUID": "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",

      "major": 1,

      "minor": 2,

      "relevantText": "Welcome to the VIP entrance!"
    }
  ],

  "relevantDates": [
    {
      "date": "2025-09-15T18:00:00-08:00",

      "end": "2025-09-15T23:00:00-08:00",

      "relevantText": "Doors are now open for the concert."
    }
  ],

  "barcodes": [
    {
      "message": "12345678901234567890",

      "format": "PKBarcodeFormatQR",

      "messageEncoding": "iso-8859-1",

      "altText": "1234567890"
    },

    {
      "message": "A1B2C3D4E5F6",

      "format": "PKBarcodeFormatCode128",

      "messageEncoding": "iso-8859-1",

      "altText": "A1B2C3D4E5F6"
    }
  ],

  "nfc": {
    "message": "BASE64_OR_ASCII_PAYLOAD",

    "encryptionPublicKey": "BASE64_X9_62_PUBLIC_KEY"
  },

  "userInfo": {
    "customerId": "customer-id-54321",

    "customData": "any valid JSON object"
  },

  "appLaunchURL": "example-app://events/12345",

  "associatedStoreIdentifiers": [123456789],

  "semantics": {
    "eventName": "Annual Grand Concert",

    "venueName": "The Grand Venue",

    "venueLocation": { "longitude": -122.398768, "latitude": 37.779335 },

    "eventStartDate": "2025-09-15T20:00:00-08:00",

    "eventEndDate": "2025-09-15T23:00:00-08:00",

    "totalPrice": { "amount": "99.50", "currencyCode": "USD" },

    "seats": [
      {
        "seatSection": "A",

        "seatRow": "10",

        "seatNumber": "5",

        "seatIdentifier": "A-10-5"
      }
    ]
  },

  "eventLogoText": "Grand Concert",

  "footerBackgroundColor": "rgb(60, 65, 80)",

  "suppressHeaderDarkening": false,

  "accessibilityURL": "https://example.com/venue/accessibility",

  "addOnURL": "https://example.com/events/12345/addons",

  "auxiliaryStoreIdentifiers": [987654321],

  "bagPolicyURL": "https://example.com/venue/bag-policy",

  "contactVenueEmail": "contact@grandvenue.com",

  "contactVenuePhoneNumber": "+1-800-555-1234",

  "contactVenueWebsite": "https://grandvenue.com",

  "directionsInformationURL": "https://example.com/venue/directions",

  "merchandiseURL": "https://example.com/merch/concert2025",

  "orderFoodURL": "https://example.com/venue/food",

  "parkingInformationURL": "https://example.com/venue/parking-info",

  "purchaseParkingURL": "https://example.com/venue/parking-purchase",

  "sellURL": "https://example.com/resell/ticket/XYZ",

  "transferURL": "https://example.com/transfer/ticket/XYZ",

  "transitInformationURL": "https://example.com/venue/transit",

  "changeSeatURL": "https://example.com/flight/changeseat",

  "entertainmentURL": "https://example.com/flight/entertainment",

  "purchaseAdditionalBaggageURL": "https://example.com/flight/baggage",

  "purchaseLoungeAccessURL": "https://example.com/flight/lounge",

  "purchaseWifiURL": "https://example.com/flight/wifi",

  "upgradeURL": "https://example.com/flight/upgrade",

  "managementURL": "https://example.com/manage-booking",

  "registerServiceAnimalURL": "https://example.com/flight/service-animal",

  "reportLostBagURL": "https://example.com/flight/lost-bag",

  "requestWheelchairURL": "https://example.com/flight/wheelchair",

  "transitProviderEmail": "support@exampletransit.com",

  "transitProviderPhoneNumber": "+1-888-555-7433",

  "transitProviderWebsiteURL": "https://exampletransit.com",

  "eventTicket": {
    "headerFields": [
      {
        "key": "event-time",

        "label": "STARTS",

        "value": "2025-09-15T20:00:00-08:00",

        "dateStyle": "PKDateStyleShort",

        "timeStyle": "PKDateStyleShort",

        "isRelative": false,

        "ignoresTimeZone": false
      }
    ],

    "primaryFields": [
      {
        "key": "event-name",

        "label": "EVENT",

        "value": "Annual Grand Concert"
      }
    ],

    "secondaryFields": [
      {
        "key": "artist",

        "label": "ARTIST",

        "value": "The Gemini Experience"
      },

      {
        "key": "venue",

        "label": "VENUE",

        "value": "The Grand Venue"
      }
    ],

    "auxiliaryFields": [
      {
        "key": "section",

        "label": "SECTION",

        "value": "A",

        "textAlignment": "PKTextAlignmentLeft"
      },

      {
        "key": "row",

        "label": "ROW",

        "value": "10",

        "textAlignment": "PKTextAlignmentCenter"
      },

      {
        "key": "seat",

        "label": "SEAT",

        "value": "5",

        "textAlignment": "PKTextAlignmentRight"
      },

      {
        "key": "ticket-type",

        "label": "TYPE",

        "value": "General Admission",

        "row": 1
      }
    ],

    "backFields": [
      {
        "key": "terms",

        "label": "Terms and Conditions",

        "value": "This ticket is non-refundable. Resale is prohibited. Visit our website for full terms.",

        "dataDetectorTypes": ["PKDataDetectorTypeLink"]
      },

      {
        "key": "contact-link",

        "label": "Contact Us",

        "attributedValue": "<a href='https://grandvenue.com/contact'>Contact Support</a>",

        "changeMessage": "The contact info has changed: %@"
      }
    ],

    "additionalInfoFields": [
      {
        "key": "entry-gate",

        "label": "Entry Gate",

        "value": "Gate C"
      }
    ]
  },

  "upcomingPassInformation": [
    {
      "identifier": "UPCOMING_EVENT_1",

      "name": "Opening Act: The Vectors",

      "type": "event",

      "isActive": true,

      "auxiliaryStoreIdentifiers": [112233445],

      "semantics": {
        "eventName": "Opening Act: The Vectors",

        "eventStartDate": "2025-09-15T19:00:00-08:00"
      },

      "dateInformation": {
        "date": "2025-09-15T19:00:00-08:00",

        "isAllDay": false,

        "ignoreTimeComponents": false,

        "isUnannounced": false,

        "isUndetermined": false,

        "timeZone": "America/Los_Angeles"
      },

      "images": {
        "headerImage": {
          "url": "https://example.com/images/opening_act_header.png",

          "url2x": "https://example.com/images/opening_act_header@2x.png",

          "url3x": "https://example.com/images/opening_act_header@3x.png"
        },

        "venueMap": {
          "url": "https://example.com/images/venue_map.png"
        }
      },

      "URLs": {
        "accessibilityURL": "https://example.com/venue/accessibility",

        "addOnURL": "https://example.com/events/12345/addons/opening-act",

        "bagPolicyURL": "https://example.com/venue/bag-policy",

        "contactVenueEmail": "contact@grandvenue.com",

        "contactVenuePhoneNumber": "+1-800-555-1234",

        "contactVenueWebsite": "https://grandvenue.com",

        "directionsInformationURL": "https://example.com/venue/directions",

        "merchandiseURL": "https://example.com/merch/vectors",

        "orderFoodURL": "https://example.com/venue/food",

        "parkingInformationURL": "https://example.com/venue/parking-info",

        "purchaseParkingURL": "https://example.com/venue/parking-purchase",

        "sellURL": "https://example.com/resell/ticket/XYZ",

        "transferURL": "https://example.com/transfer/ticket/XYZ",

        "transitInformationURL": "https://example.com/venue/transit"
      },

      "backFields": [
        {
          "key": "opening-act-info",

          "label": "About The Vectors",

          "value": "The Vectors are an up-and-coming band known for their energetic performances."
        }
      ],

      "additionalInfoFields": [
        {
          "key": "stage-info",

          "label": "Stage",

          "value": "Main Stage"
        }
      ]
    }
  ]
}
```

## Section-by-Section Guidance

### 1) Top-level identity and security

- `formatVersion` (required): always `1`.

- `passTypeIdentifier` (required): must match your Pass Type ID and the certificate used to sign.

- `serialNumber` (required): unique per `pass`.

- `teamIdentifier` (required): your Apple Developer Team ID.

- `webServiceURL` + `authenticationToken` (optional but recommended): enable updates/personalization.

- `organizationName` (required): shown to users.

- `description` (required): short accessibility description.

- `sharingProhibited` (optional): hides Share button (does not prevent copying by other means).

### 2) Visual styling

- `backgroundColor`, `foregroundColor`, `labelColor`: CSS `rgb(r, g, b)`.

- `useAutomaticColors` (poster only): if `true`, Wallet computes text colors from background image and ignores `foregroundColor`/`labelColor`.

- `footerBackgroundColor` (poster only): footer color.

- `eventLogoText` (poster only): text near logo.

- `suppressStripShine`: legacy aesthetic.

- `suppressHeaderDarkening` (poster only): disables top gradient.

### 3) Relevance and surfacing

- `locations` (0–10): { latitude, longitude, relevantText }.

- `maxDistance`: meters for relevance radius.

- `beacons`: BLE beacons { proximityUUID, major, minor, relevantText }.

- `relevantDates` (preferred; replaces deprecated `relevantDate`):

- Each: `date` (ISO 8601), optional `end`, optional `relevantText`.

- Controls when Wallet surfaces the pass.

### 4) Codes and NFC

- `barcodes` (array): Wallet chooses the first displayable for the device.

- `message`: string payload,

- `format`: one of `PKBarcodeFormatQR|PDF417|Aztec|Code128`,

- `messageEncoding`: e.g., `iso-8859-1` or `utf-8`,

- `altText`: optional human-readable.

- `barcode` is deprecated — don’t use it.

- `nfc` (optional; VAS):

- `message`: payload,

- `encryptionPublicKey`: issuer/Apple-provided key per VAS program.

### 5) App linkage

- `associatedStoreIdentifiers` (array of numeric App Store IDs): Wallet offers app link; first compatible wins.

- `appLaunchURL`: deep link passed on app launch from Wallet (not on watchOS).

- `auxiliaryStoreIdentifiers` (poster only): app links inside event guide.

### 6) Poster event ticket deep-link URLs

- `accessibilityURL`, `addOnURL`, `bagPolicyURL`, `directionsInformationURL`,

`merchandiseURL`, `orderFoodURL`, `parkingInformationURL`, `purchaseParkingURL`,

`sellURL`, `transferURL`, `transitInformationURL`.

- HTTPS recommended. You can update links during the journey (e.g., pre/post entry) via pass updates.

### 7) Flight/transit-style URLs (rarely used for events)

- `changeSeatURL`, `entertainmentURL`, `purchaseAdditionalBaggageURL`,

`purchaseLoungeAccessURL`, `purchaseWifiURL`, `upgradeURL`, `managementURL`,

`registerServiceAnimalURL`, `reportLostBagURL`, `requestWheelchairURL`,

`transitProviderEmail`, `transitProviderPhoneNumber`, `transitProviderWebsiteURL`.

- Use only if relevant to your experience.

### 8) Semantics (machine-readable metadata)

- Improves suggestions (Focus, directions, etc.).

- Typical for events: `eventName`, `venueName`, `venueLocation`, `eventStartDate`, `eventEndDate`, `seats[]`, `totalPrice`.

- Use ISO 8601 with time-zone offsets.

### 9) EventTicket fields (Pass.EventTicket inherits PassFields)

Each field group is an array of PassFieldContent unless noted:

- `headerFields`: few, short items; often dates.

- `primaryFields`: 1–2 (1 recommended); big text (event name).

- `secondaryFields`: typically up to 2; supporting info (artist, venue).

- `auxiliaryFields`: up to 4 per row; poster supports `row: 1` to add a second row (so up to 8 if layout fits).

- `backFields`: any number; shown in details/back; supports `dataDetectorTypes`.

- `additionalInfoFields` (poster only): any number; shows below the pass.

PassFieldContent properties:

- `key` (required): unique per field.

- `value` (required): string, ISO 8601 date (include time zone), or number.

- `label`: visible label.

- `attributedValue`: only supports `<a href="...">` links; ignored on watchOS.

- `changeMessage`: localizable string with `%@` placeholder (alerts on updates).

- `dateStyle`, `timeStyle`: `PKDateStyleNone|Short|Medium|Long|Full`.

- `numberStyle`: `PKNumberStyleDecimal|Percent|Scientific|SpellOut`.

- `textAlignment`: `PKTextAlignmentLeft|Center|Right|Natural` (invalid for primary/back fields).

- `currencyCode`: ISO 4217 (use with numeric money values).

- `dataDetectorTypes` (back fields only): `[PKDataDetectorTypePhoneNumber|Link|Address|CalendarEvent]`.

- `ignoresTimeZone`, `isRelative`: presentation only (no impact on relevance).

### 10) UpcomingPassInformation (iOS 19+/iPadOS 19+/watchOS 12+)

For multievent passes; each entry appears in the details experience.

- `upcomingPassInformation`: ordered array of entries.

- Each entry:

- `identifier` (required): unique within the list.

- `name` (required): entry name.

- `type` (required): `"event"`.

- `isActive`: default `false`.

- `auxiliaryStoreIdentifiers`: app links scoped to this entry.

- `semantics`: entry-level metadata (e.g., `eventStartDate`).

- `dateInformation`:

- `date` (ISO 8601) — omit for TBD,

- `isAllDay`, `ignoreTimeComponents`, `isUnannounced` (TBA), `isUndetermined` (TBD),

- `timeZone` (IANA tz id), else device time zone is used.

- `images`:

- `headerImage`: filename or remote object with `url[/2x/3x]`,

- `venueMap`: filename or remote `url` (events only).

- `URLs`: same poster-event URL set but scoped to the entry.

- `backFields`, `additionalInfoFields`: same PassFieldContent rules.

## Cardinality and Constraints (Quick Reference)

- Colors: strings in CSS `rgb(r, g, b)`

- `locations`: 0–10

- `beacons`: 0–many (practical/device limits apply)

- `barcodes`: 1–many; first displayable is shown

- `eventTicket` field groups:

- `primaryFields`: 1–2 (1 recommended)

- `secondaryFields`: up to ~2 typical

- `auxiliaryFields`: up to 4 per row; poster supports `row: 1` for second row

- `headerFields`: few; keep short

- `backFields`: any number

- `additionalInfoFields` (poster only): any number

- `upcomingPassInformation`: ordered array; each entry `type: "event"`

## Dates and Time Zones

- Use ISO 8601 with offset or `Z` (e.g., `2025-09-15T20:00:00-08:00`).

- Field `value` with dateStyle/timeStyle should include a time zone.

- Presentation vs relevance:

- `ignoresTimeZone` / `isRelative` affect display only.

- Use `relevantDates` to control surfacing windows.

## Localization

- Any “localizable string” can be localized via `pass.strings`.

- Localize labels/values/attributedValue consistently; keep keys stable.

## Validation and Testing

- `preferredStyleSchemes` (optional): validation schemes; system falls back to designed type.

- Use Apple’s signing/verification tools; test on real devices.

- Ensure deep links and HTTPS endpoints work and are environment-aware.

- Poster event features: verify Additional Info and Event Guide render properly.

## Common Pitfalls

- Use `barcodes`, not deprecated `barcode`.

- `attributedValue` supports only the `<a href>` tag.

- `appLaunchURL` and Store Identifier features are not supported on watchOS.

- `useAutomaticColors` ignores `foregroundColor` and `labelColor` when `true`.

- `additionalInfoFields` is only for poster event tickets (iOS 18+/watchOS 11+).

- `upcomingPassInformation` requires iOS 19+/watchOS 12+; silently ignored on older OS.

- Change notifications require both a pass update and
