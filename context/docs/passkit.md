Directory Structure:

└── ./
    ├── examples
    │   ├── models
    │   │   ├── posterEventTicketWithAdmissionLevel.pass
    │   │   │   └── pass.json
    │   │   └── posterEventTicketWithNewSeats.pass
    │   │       └── pass.json
    │   ├── self-hosted
    │   │   ├── src
    │   │   │   ├── fields.ts
    │   │   │   ├── index.ts
    │   │   │   ├── localize.ts
    │   │   │   ├── PKPass.from.ts
    │   │   │   ├── PKPasses.ts
    │   │   │   ├── scratch.ts
    │   │   │   ├── setBarcodes.ts
    │   │   │   ├── setExpirationDate.ts
    │   │   │   ├── shared.ts
    │   │   │   └── webserver.ts
    │   │   ├── package.json
    │   │   ├── README.md
    │   │   └── tsconfig.json
    │   └── serverless
    │       ├── src
    │       │   ├── functions
    │       │   │   ├── barcodes.ts
    │       │   │   ├── expirationDate.ts
    │       │   │   ├── fields.ts
    │       │   │   ├── index.ts
    │       │   │   ├── localize.ts
    │       │   │   ├── pkpasses.ts
    │       │   │   └── scratch.ts
    │       │   ├── index.ts
    │       │   └── shared.ts
    │       ├── .gitignore
    │       ├── config.json
    │       ├── package.json
    │       ├── README.md
    │       ├── serverless.yml
    │       └── tsconfig.json
    ├── specs
    │   ├── PKPass.spec.mjs
    │   └── utils.spec.mjs
    └── src
        ├── schemas
        │   ├── Barcode.ts
        │   ├── Beacon.ts
        │   ├── Certificates.ts
        │   ├── Field.ts
        │   ├── index.ts
        │   ├── Location.ts
        │   ├── NFC.ts
        │   ├── PassFields.ts
        │   ├── Personalize.ts
        │   ├── regexps.ts
        │   ├── Semantics.ts
        │   └── SemanticTagType.ts
        ├── Bundle.ts
        ├── FieldsArray.ts
        ├── getModelFolderContents.ts
        ├── index.ts
        ├── messages.ts
        ├── PKPass.ts
        ├── Signature.ts
        ├── StringsUtils.ts
        └── utils.ts



---
File: /examples/models/posterEventTicketWithAdmissionLevel.pass/pass.json
---

{
	"formatVersion": 1,
	"passTypeIdentifier": "pass.com.passkitgenerator",
	"teamIdentifier": "F53WB8AE67",
	"groupingIdentifier": "ticket-demo",
	"description": "Description",
	"organizationName": "Something",
	"backgroundColor": "rgb(255, 255, 255)",
	"foregroundColor": "rgb(0, 0, 0)",
	"labelColor": "rgb(0, 0, 0)",
	"logoText": "iOS18 EventTicket Demo",
	"preferredStyleSchemes": ["posterEventTicket", "eventTicket"],
	"eventTicket": {
		"headerFields": [
			{
				"key": "event_date",
				"label": "event-date",
				"value": "26.09.2024"
			}
		]
	},
	"semantics": {
		"venueParkingLotsOpenDate": "2024-10-04T09:00:00+00:00",
		"venueGatesOpenDate": "2024-10-06T20:00:00+00:00",
		"eventType": "PKEventTypeLivePerformance",
		"eventName": "Secret meeting place",
		"admissionLevel": "VIP Access",
		"venueRegionName": "Undisclosed location",
		"performerNames": ["Lady Gaga"],
		"venueBoxOfficeOpenDate": "2024-10-06T20:15:00+00:00",
		"venueCloseDate": "2024-10-06T23:59:59+00:00",
		"venueDoorsOpenDate": "2024-10-06T20:00:00+00:00",
		"venueFanZoneOpenDate": "2024-10-06T19:30:00+00:00",
		"updatedEventStartDate": "2024-10-06T21:30:00+00:00",
		"updatedEventEndDate": "2024-10-07T01:30:00+00:00",
		"admissionLevelAbbreviation": "VIP A.",
		"venueEntranceDoor": "15A",
		"venueEntrancePortal": "7B",
		"albumIDs": ["1440818588"],
		"additionalTicketAttributes": "3,4,5",
		"entranceDescription": "Event at The Stadium",
		"venueLocation": {
			"latitude": 51.555557,
			"longitude": 0.238041
		}
	},
	"parkingInformationURL": "https://www.southbayjazzfestival.com/parking",
	"directionsInformationURL": "https://apple.co/mapsapvc",
	"contactVenueEmail": "rsvp_events@apple.com",
	"relevantDates": [
		{
			"startDate": "2024-10-03T17:00:00+01:00",
			"endDate": "2024-10-03T23:00:00+01:00"
		},
		{
			"startDate": "2024-10-06T00:00:00+00:00",
			"endDate": "2024-10-06T19:00:00+01:00"
		}
	],
	"nfc": {
		"message": "message",
		"encryptionPublicKey": "MDkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDIgADwKMBv29ByaSLiGF0FctuyB+Hs2oZ1kDIYhTVllPexNE="
	}
}



---
File: /examples/models/posterEventTicketWithNewSeats.pass/pass.json
---

{
	"formatVersion": 1,
	"passTypeIdentifier": "pass.com.passkitgenerator",
	"teamIdentifier": "F53WB8AE67",
	"groupingIdentifier": "ticket-demo",
	"description": "Description",
	"organizationName": "A some kind of event happening tomorrow",
	"backgroundColor": "#ffffff",
	"foregroundColor": "#000000",
	"labelColor": "#FF0000",
	"logoText": "Demo",
	"preferredStyleSchemes": ["posterEventTicket", "eventTicket"],
	"eventTicket": {
		"headerFields": [
			{
				"key": "event_date",
				"label": "event-date",
				"value": "26.09.2024"
			}
		],
		"primaryFields": [
			{ "key": "event_name", "label": "event-name", "value": "Dune" }
		],
		"additionalInfoFields": [
			{
				"key": "additionalInfo-1",
				"label": "Additional Info 1",
				"value": "The text to show"
			},
			{
				"key": "additionalInfo-2",
				"label": "Additional Info 2",
				"value": "The text to show 2"
			},
			{
				"key": "lineItem3",
				"label": "Emergency Contact",
				"value": "+1 8716 12736131",
				"dataDetectorTypes": ["PKDataDetectorTypePhoneNumber"]
			},
			{
				"key": "lineItem4",
				"label": "Test link",
				"value": "https://apple.com",
				"dataDetectorTypes": ["PKDataDetectorTypeLink"],
				"attributedValue": "<a href=\"https://apple.com\">Used literally on iPhone, used correctly on Watch</a>"
			}
		]
	},
	"semantics": {
		"venueParkingLotsOpenDate": "2024-10-09T04:00:00+00:00",
		"venueGatesOpenDate": "2024-10-09T06:00:00+00:00",
		"eventLiveMessage": "This event is going to start soon! Try to relax your anus (cit.)",
		"eventType": "PKEventTypeLivePerformance",
		"eventName": "South Bay Jazz Festival",
		"entranceDescription": "Event at The Stadium",
		"venueLocation": {
			"latitude": 51.555557,
			"longitude": 0.238041
		},
		"venueName": "The Stadium",
		"performerNames": ["Lady Gaga"],
		"eventStartDate": "2024-10-08T22:00:00+00:00",
		"eventEndDate": "2024-10-09T23:59:59+00:00",
		"tailgatingAllowed": true,
		"seats": [
			{
				"seatNumber": "5",
				"seatRow": "3",
				"seatSection": "100",
				"seatSectionColor": "#FFD700"
			}
		],
		"artistIDs": ["984117861"]
	},
	"directionsInformationURL": "https://www.displaysomeinfoexample.com",
	"contactVenueWebsite": "https://www.venueexample.com",
	"relevantDates": [
		{
			"startDate": "2024-10-09T17:00:00+01:00",
			"endDate": "2024-10-09T23:59:59+01:00"
		},
		{
			"startDate": "2024-10-10T17:00:00+00:00",
			"endDate": "2024-10-10T19:00:00+00:00"
		},
		{
			"startDate": "2024-10-11T17:00:00+00:00",
			"endDate": "2024-10-11T19:00:00+00:00"
		}
	],
	"nfc": {
		"message": "message",
		"encryptionPublicKey": "MDkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDIgADwKMBv29ByaSLiGF0FctuyB+Hs2oZ1kDIYhTVllPexNE="
	}
}



---
File: /examples/self-hosted/src/fields.ts
---

/**
 * Fields pushing dimostration
 * To see all the included Fields, just open the pass
 * Refer to https://apple.co/2Nvshvn to see how passes
 * have their fields disposed.
 *
 * In this example we are going to imitate an EasyJet boarding pass
 *
 * @Author: Alexander P. Cerutti
 */

import path from "node:path";
import { PKPass } from "passkit-generator";
import { app } from "./webserver.js";
import { getCertificates } from "./shared.js";

app.route("/fields/:modelName").get(async (request, response) => {
	const passName =
		"exampleBooking" +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	const certificates = await getCertificates();

	try {
		const pass = await PKPass.from(
			{
				model: path.resolve(__dirname, "../../models/exampleBooking"),
				certificates: {
					wwdr: certificates.wwdr,
					signerCert: certificates.signerCert,
					signerKey: certificates.signerKey,
					signerKeyPassphrase: certificates.signerKeyPassphrase,
				},
			},
			request.body || request.params || request.query,
		);

		pass.transitType = "PKTransitTypeAir";

		pass.headerFields.push(
			{
				key: "header1",
				label: "Data",
				value: "25 mag",
				textAlignment: "PKTextAlignmentCenter",
			},
			{
				key: "header2",
				label: "Volo",
				value: "EZY997",
				textAlignment: "PKTextAlignmentCenter",
			},
		);

		pass.primaryFields.push(
			{
				key: "IATA-source",
				value: "NAP",
				label: "Napoli",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "IATA-destination",
				value: "VCE",
				label: "Venezia Marco Polo",
				textAlignment: "PKTextAlignmentRight",
			},
		);

		pass.secondaryFields.push(
			{
				key: "secondary1",
				label: "Imbarco chiuso",
				value: "18:40",
				textAlignment: "PKTextAlignmentCenter",
			},
			{
				key: "sec2",
				label: "Partenze",
				value: "19:10",
				textAlignment: "PKTextAlignmentCenter",
			},
			{
				key: "sec3",
				label: "SB",
				value: "Sì",
				textAlignment: "PKTextAlignmentCenter",
			},
			{
				key: "sec4",
				label: "Imbarco",
				value: "Anteriore",
				textAlignment: "PKTextAlignmentCenter",
			},
		);

		pass.auxiliaryFields.push(
			{
				key: "aux1",
				label: "Passeggero",
				value: "MR. WHO KNOWS",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "aux2",
				label: "Posto",
				value: "1A*",
				textAlignment: "PKTextAlignmentCenter",
			},
		);

		pass.backFields.push(
			{
				key: "document number",
				label: "Numero documento:",
				value: "- -",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "You're checked in, what next",
				label: "Hai effettuato il check-in, Quali sono le prospettive",
				value: "",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "Check In",
				label: "1. check-in✓",
				value: "",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "checkIn",
				label: "",
				value: "Le uscite d'imbarco chiudono 30 minuti prima della partenza, quindi sii puntuale. In questo aeroporto puoi utilizzare la corsia Fast Track ai varchi di sicurezza.",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "2. Bags",
				label: "2. Bagaglio",
				value: "",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "Require special assistance",
				label: "Assistenza speciale",
				value: "Se hai richiesto assistenza speciale, presentati a un membro del personale nell'area di Consegna bagagli almeno 90 minuti prima del volo.",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "3. Departures",
				label: "3. Partenze",
				value: "",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "photoId",
				label: "Un documento d’identità corredato di fotografia",
				value: "è obbligatorio su TUTTI i voli. Per un viaggio internazionale è necessario un passaporto valido o, dove consentita, una carta d’identità.",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "yourSeat",
				label: "Il tuo posto:",
				value: "verifica il tuo numero di posto nella parte superiore. Durante l’imbarco utilizza le scale anteriori e posteriori: per le file 1-10 imbarcati dalla parte anteriore; per le file 11-31 imbarcati dalla parte posteriore. Colloca le borse di dimensioni ridotte sotto il sedile davanti a te.",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "Pack safely",
				label: "Bagaglio sicuro",
				value: "Fai clic http://easyjet.com/it/articoli-pericolosi per maggiori informazioni sulle merci pericolose oppure visita il sito CAA http://www.caa.co.uk/default.aspx?catid=2200",
				textAlignment: "PKTextAlignmentLeft",
			},
			{
				key: "Thank you for travelling easyJet",
				label: "Grazie per aver viaggiato con easyJet",
				value: "",
				textAlignment: "PKTextAlignmentLeft",
			},
		);

		const stream = pass.getAsStream();

		response.set({
			"Content-type": pass.mimeType,
			"Content-disposition": `attachment; filename=${passName}.pkpass`,
		});

		stream.pipe(response);
	} catch (err) {
		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	}
});



---
File: /examples/self-hosted/src/index.ts
---

import "./fields.js";
import "./localize.js";
import "./PKPass.from.js";
import "./PKPasses.js";
import "./scratch.js";
import "./setBarcodes.js";
import "./setExpirationDate.js";



---
File: /examples/self-hosted/src/localize.ts
---

/**
 * .localize() methods example
 * To see all the included languages, you have to unzip the
 * .pkpass file and check for .lproj folders
 */

import path from "node:path";
import { PKPass } from "passkit-generator";
import { app } from "./webserver.js";
import { getCertificates } from "./shared.js";

app.route("/localize/:modelName").get(async (request, response) => {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	const certificates = await getCertificates();

	try {
		const pass = await PKPass.from(
			{
				model: path.resolve(
					__dirname,
					`../../models/${request.params.modelName}`,
				),
				certificates: {
					wwdr: certificates.wwdr,
					signerCert: certificates.signerCert,
					signerKey: certificates.signerKey,
					signerKeyPassphrase: certificates.signerKeyPassphrase,
				},
			},
			request.body || request.params || request.query,
		);

		// Italian, already has an .lproj which gets included...
		pass.localize("it", {
			EVENT: "Evento",
			LOCATION: "Dove",
		});

		// ...while German doesn't, so it gets created
		pass.localize("de", {
			EVENT: "Ereignis",
			LOCATION: "Ort",
		});

		// This language does not exist but is still added as .lproj folder
		pass.localize("zu", {});

		console.log("Added languages", Object.keys(pass.languages).join(", "));

		if (pass.type === "boardingPass" && !pass.transitType) {
			// Just to not make crash the creation if we use a boardingPass
			pass.transitType = "PKTransitTypeAir";
		}

		const stream = pass.getAsStream();

		response.set({
			"Content-type": pass.mimeType,
			"Content-disposition": `attachment; filename=${passName}.pkpass`,
		});

		stream.pipe(response);
	} catch (err) {
		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	}
});



---
File: /examples/self-hosted/src/PKPass.from.ts
---

/**
 * PKPass.from static method example.
 * Here it is showed manual model reading and
 * creating through another PKPass because in the other
 * examples, creation through templates is already shown
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import { PKPass } from "passkit-generator";
import { app } from "./webserver.js";
import { getCertificates } from "./shared.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ******************************************** //
// *** CODE FROM GET MODEL FOLDER INTERNALS *** //
// ******************************************** //

/**
 * Removes hidden files from a list (those starting with dot)
 *
 * @params from - list of file names
 * @return
 */

export function removeHidden(from: Array<string>): Array<string> {
	return from.filter((e) => e.charAt(0) !== ".");
}

async function readFileOrDirectory(filePath: string) {
	if ((await fs.lstat(filePath)).isDirectory()) {
		return Promise.all(await readDirectory(filePath));
	}

	const fileBuffer = await fs.readFile(filePath);

	return getObjectFromModelFile(filePath, fileBuffer, 1);
}

/**
 * Returns an object containing the parsed fileName
 * from a path along with its content.
 *
 * @param filePath
 * @param content
 * @param depthFromEnd - used to preserve localization lproj content
 * @returns
 */

function getObjectFromModelFile(
	filePath: string,
	content: Buffer,
	depthFromEnd: number,
) {
	const fileComponents = filePath.split(path.sep);
	const fileName = fileComponents
		.slice(fileComponents.length - depthFromEnd)
		.join("/");

	return { [fileName]: content };
}

/**
 * Reads a directory and returns all the files in it
 * as an Array<Promise>
 *
 * @param filePath
 * @returns
 */

async function readDirectory(filePath: string) {
	const dirContent = await fs.readdir(filePath).then(removeHidden);

	return dirContent.map(async (fileName) => {
		const content = await fs.readFile(path.resolve(filePath, fileName));
		return getObjectFromModelFile(
			path.resolve(filePath, fileName),
			content,
			2,
		);
	});
}

// *************************** //
// *** EXAMPLE FROM NOW ON *** //
// *************************** //

const passTemplate = new Promise<PKPass>(async (resolve) => {
	const modelPath = path.resolve(__dirname, `../../models/examplePass.pass`);
	const [modelFilesList, certificates] = await Promise.all([
		fs.readdir(modelPath),
		getCertificates(),
	]);

	const modelRecords = (
		await Promise.all(
			/**
			 * Obtaining flattened array of buffer records
			 * containing file name and the buffer itself.
			 *
			 * This goes also to read every nested l10n
			 * subfolder.
			 */

			modelFilesList.map((fileOrDirectoryPath) => {
				const fullPath = path.resolve(modelPath, fileOrDirectoryPath);

				return readFileOrDirectory(fullPath);
			}),
		)
	)
		.flat(1)
		.reduce((acc, current) => ({ ...acc, ...current }), {});

	/** Creating a PKPass Template */

	return resolve(
		new PKPass(modelRecords, {
			wwdr: certificates.wwdr,
			signerCert: certificates.signerCert,
			signerKey: certificates.signerKey,
			signerKeyPassphrase: certificates.signerKeyPassphrase,
		}),
	);
});

app.route("/pkpassfrom/:modelName").get(async (request, response) => {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	const templatePass = await passTemplate;

	try {
		const pass = await PKPass.from(
			templatePass,
			request.body || request.params || request.query,
		);

		if (pass.type === "boardingPass" && !pass.transitType) {
			// Just to not make crash the creation if we use a boardingPass
			pass.transitType = "PKTransitTypeAir";
		}

		const stream = pass.getAsStream();

		response.set({
			"Content-type": pass.mimeType,
			"Content-disposition": `attachment; filename=${passName}.pkpass`,
		});

		stream.pipe(response);
	} catch (err) {
		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	}
});



---
File: /examples/self-hosted/src/PKPasses.ts
---

/**
 * PKPasses generation through PKPass.pack static method
 * example.
 * Here it is showed manual model reading and
 * creating through another PKPass because in the other
 * examples, creation through templates is already shown
 *
 * PLEASE NOTE THAT, AT TIME OF WRITING, THIS EXAMPLE WORKS
 * ONLY IF PASSES ARE DOWNLOADED FROM SAFARI, due to the
 * support of PKPasses archives. To test this, you might
 * need to open a tunnel through NGROK if you cannot access
 * to your local machine (in my personal case, developing
 * under WSL is a pretty big limitation sometimes).
 *
 * PLEASE ALSO NOTE that, AT TIME OF WRITING (iOS 15.0 - 15.2)
 * Pass Viewer suffers of a really curious bug: issuing several
 * passes within the same pkpasses archive, all with the same
 * serialNumber, will lead to have a broken view and to add
 * just one pass. You can see the screenshots below:
 *
 * https://imgur.com/bDTbcDg.jpg
 * https://imgur.com/Y4GpuHT.jpg
 * https://i.imgur.com/qbJMy1d.jpg
 *
 * - "Alberto, come to look at APPLE."
 * **Alberto looks**
 * - "MAMMA MIA!""
 *
 * A feedback to Apple have been sent for this.
 */

import { app } from "./webserver.js";
import { getCertificates } from "./shared.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PKPass } from "passkit-generator";

// *************************** //
// *** EXAMPLE FROM NOW ON *** //
// *************************** //

function getRandomColorPart() {
	return Math.floor(Math.random() * 255);
}

async function generatePass(props: Object) {
	const [iconFromModel, certificates] = await Promise.all([
		fs.readFile(
			path.resolve(
				__dirname,
				"../../models/exampleBooking.pass/icon.png",
			),
		),
		getCertificates(),
	]);

	const pass = new PKPass(
		{},
		{
			wwdr: certificates.wwdr,
			signerCert: certificates.signerCert,
			signerKey: certificates.signerKey,
			signerKeyPassphrase: certificates.signerKeyPassphrase,
		},
		{
			...props,
			description: "Example Apple Wallet Pass",
			passTypeIdentifier: "pass.com.passkitgenerator",
			// Be sure to issue different serialNumbers or you might incur into the bug explained above
			serialNumber: `nmyuxofgna${Math.random()}`,
			organizationName: `Test Organization ${Math.random()}`,
			teamIdentifier: "F53WB8AE67",
			foregroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
			labelColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
			backgroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
		},
	);

	pass.type = "boardingPass";
	pass.transitType = "PKTransitTypeAir";

	pass.setBarcodes({
		message: "123456789",
		format: "PKBarcodeFormatQR",
	});

	pass.headerFields.push(
		{
			key: "header-field-test-1",
			value: "Unknown",
		},
		{
			key: "header-field-test-2",
			value: "unknown",
		},
	);

	pass.primaryFields.push(
		{
			key: "primaryField-1",
			value: "NAP",
		},
		{
			key: "primaryField-2",
			value: "VCE",
		},
	);

	/**
	 * Required by Apple. If one is not available, a
	 * pass might be openable on a Mac but not on a
	 * specific iPhone model
	 */

	pass.addBuffer("icon.png", iconFromModel);
	pass.addBuffer("icon@2x.png", iconFromModel);
	pass.addBuffer("icon@3x.png", iconFromModel);

	return pass;
}

app.route("/pkpasses/:modelName").get(async (request, response) => {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	try {
		const passes = await Promise.all([
			generatePass(request.body || request.params || request.query),
			generatePass(request.body || request.params || request.query),
			generatePass(request.body || request.params || request.query),
			generatePass(request.body || request.params || request.query),
		]);

		const pkpasses = PKPass.pack(...passes);

		response.set({
			"Content-type": pkpasses.mimeType,
			"Content-disposition": `attachment; filename=${passName}.pkpasses`,
		});

		const stream = pkpasses.getAsStream();

		stream.pipe(response);
	} catch (err) {
		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	}
});



---
File: /examples/self-hosted/src/scratch.ts
---

/**
 * This examples shows how you can create a PKPass from scratch,
 * by adding files later and not adding pass.json
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { PKPass } from "passkit-generator";
import { app } from "./webserver.js";
import { getCertificates } from "./shared.js";

function getRandomColorPart() {
	return Math.floor(Math.random() * 255);
}

app.route("/scratch/:modelName").get(async (request, response) => {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	const [iconFromModel, certificates] = await Promise.all([
		fs.readFile(
			path.resolve(
				__dirname,
				"../../models/exampleBooking.pass/icon.png",
			),
		),
		getCertificates(),
	]);

	try {
		const pass = new PKPass(
			{},
			{
				wwdr: certificates.wwdr,
				signerCert: certificates.signerCert,
				signerKey: certificates.signerKey,
				signerKeyPassphrase: certificates.signerKeyPassphrase,
			},
			{
				...(request.body || request.params || request.query),
				description: "Example Apple Wallet Pass",
				passTypeIdentifier: "pass.com.passkitgenerator",
				serialNumber: "nmyuxofgna",
				organizationName: `Test Organization ${Math.random()}`,
				teamIdentifier: "F53WB8AE67",
				foregroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
				labelColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
				backgroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
			},
		);

		pass.type = "boardingPass";
		pass.transitType = "PKTransitTypeAir";

		pass.headerFields.push(
			{
				key: "header-field-test-1",
				value: "Unknown",
			},
			{
				key: "header-field-test-2",
				value: "unknown",
			},
		);

		pass.primaryFields.push(
			{
				key: "primaryField-1",
				value: "NAP",
			},
			{
				key: "primaryField-2",
				value: "VCE",
			},
		);

		/**
		 * Required by Apple. If one is not available, a
		 * pass might be openable on a Mac but not on a
		 * specific iPhone model
		 */

		pass.addBuffer("icon.png", iconFromModel);
		pass.addBuffer("icon@2x.png", iconFromModel);
		pass.addBuffer("icon@3x.png", iconFromModel);

		const stream = pass.getAsStream();

		response.set({
			"Content-type": pass.mimeType,
			"Content-disposition": `attachment; filename=${passName}.pkpass`,
		});

		stream.pipe(response);
	} catch (err) {
		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	}
});



---
File: /examples/self-hosted/src/setBarcodes.ts
---

/**
 * .barcodes() methods example
 * Here we set the barcode. To see all the results, you can
 * both unzip .pkpass file or check the properties before
 * generating the whole bundle
 *
 * Pass ?alt=true as querystring to test a barcode generate
 * by a string
 */

import { PKPass } from "passkit-generator";
import path from "node:path";
import { app } from "./webserver.js";
import { getCertificates } from "./shared.js";

app.route("/barcodes/:modelName").get(async (request, response) => {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	const certificates = await getCertificates();

	try {
		const pass = await PKPass.from(
			{
				model: path.resolve(
					__dirname,
					`../../models/${request.params.modelName}`,
				),
				certificates: {
					wwdr: certificates.wwdr,
					signerCert: certificates.signerCert,
					signerKey: certificates.signerKey,
					signerKeyPassphrase: certificates.signerKeyPassphrase,
				},
			},
			request.body || request.params || request.query || {},
		);

		if (request.query.alt === "true") {
			// After this, pass.props["barcodes"] will have support for all the formats
			pass.setBarcodes("Thank you for using this package <3");

			console.log(
				"Barcodes support is autocompleted:",
				pass.props["barcodes"],
			);
		} else {
			// After this, pass.props["barcodes"] will have support for just two of three
			// of the passed format (the valid ones);

			pass.setBarcodes(
				{
					message: "Thank you for using this package <3",
					format: "PKBarcodeFormatCode128",
				},
				{
					message: "Thank you for using this package <3",
					format: "PKBarcodeFormatPDF417",
				},
			);
		}

		if (pass.type === "boardingPass" && !pass.transitType) {
			// Just to not make crash the creation if we use a boardingPass
			pass.transitType = "PKTransitTypeAir";
		}

		const stream = pass.getAsStream();

		response.set({
			"Content-type": pass.mimeType,
			"Content-disposition": `attachment; filename=${passName}.pkpass`,
		});

		stream.pipe(response);
	} catch (err) {
		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	}
});



---
File: /examples/self-hosted/src/setExpirationDate.ts
---

/**
 * .expiration() method and voided prop example
 * To check if a ticket is void, look at the barcode;
 * If it is grayed, the ticket is voided. May not be showed on macOS.
 *
 * To check if a ticket has an expiration date, you'll
 * have to wait two minutes.
 */

import path from "node:path";
import { PKPass } from "passkit-generator";
import { app } from "./webserver.js";
import { getCertificates } from "./shared.js";

app.route("/expirationDate/:modelName").get(async (request, response) => {
	if (!request.query.fn) {
		response.send(
			"<a href='?fn=void'>Generate a voided pass.</a><br><a href='?fn=expiration'>Generate a pass with expiration date</a>",
		);
		return;
	}

	const certificates = await getCertificates();

	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	try {
		const pass = await PKPass.from(
			{
				model: path.resolve(
					__dirname,
					`../../models/${request.params.modelName}`,
				),
				certificates: {
					wwdr: certificates.wwdr,
					signerCert: certificates.signerCert,
					signerKey: certificates.signerKey,
					signerKeyPassphrase: certificates.signerKeyPassphrase,
				},
			},
			Object.assign(
				{
					voided: request.query.fn === "void",
				},
				{ ...(request.body || request.params || request.query || {}) },
			),
		);

		if (request.query.fn === "expiration") {
			// 2 minutes later...
			const d = new Date();
			d.setMinutes(d.getMinutes() + 2);

			// setting the expiration
			pass.setExpirationDate(d);
			console.log(
				"EXPIRATION DATE EXPECTED:",
				pass.props["expirationDate"],
			);
		}

		if (pass.type === "boardingPass" && !pass.transitType) {
			// Just to not make crash the creation if we use a boardingPass
			pass.transitType = "PKTransitTypeAir";
		}

		const stream = pass.getAsStream();

		response.set({
			"Content-type": pass.mimeType,
			"Content-disposition": `attachment; filename=${passName}.pkpass`,
		});

		stream.pipe(response);
	} catch (err) {
		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	}
});



---
File: /examples/self-hosted/src/shared.ts
---

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Cache {
	certificates:
		| {
				signerCert: Buffer | string;
				signerKey: Buffer | string;
				wwdr: Buffer | string;
				signerKeyPassphrase: string;
		  }
		| undefined;
}

const cache: Cache = {
	certificates: undefined,
};

export async function getCertificates(): Promise<
	Exclude<Cache["certificates"], undefined>
> {
	if (cache.certificates) {
		return cache.certificates;
	}

	const [signerCert, signerKey, wwdr, signerKeyPassphrase] =
		await Promise.all([
			fs.readFile(
				path.resolve(__dirname, "../../../certificates/signerCert.pem"),
				"utf-8",
			),
			fs.readFile(
				path.resolve(__dirname, "../../../certificates/signerKey.pem"),
				"utf-8",
			),
			fs.readFile(
				path.resolve(__dirname, "../../../certificates/WWDR.pem"),
				"utf-8",
			),
			Promise.resolve("123456"),
		]);

	cache.certificates = {
		signerCert,
		signerKey,
		wwdr,
		signerKeyPassphrase,
	};

	return cache.certificates;
}



---
File: /examples/self-hosted/src/webserver.ts
---

/*
 * Generic webserver instance for the examples
 * @Author Alexander P. Cerutti
 * Requires express to run
 */

import express from "express";
export const app = express();

app.use(express.json());

app.listen(8080, "0.0.0.0", () => {
	console.log("Webserver started.");
});



---
File: /examples/self-hosted/package.json
---

{
	"name": "examples-self-hosted",
	"version": "0.0.0",
	"private": true,
	"description": "Passkit-generator self-hosted examples",
	"author": "Alexander P. Cerutti <cerutti.alexander@gmail.com>",
	"license": "ISC",
	"type": "module",
	"scripts": {
		"clear:deps": "rm -rf node_modules",
		"example": "pnpm tsx src/index.ts",
		"example:debug": "pnpm tsx --inspect-brk src/index.ts"
	},
	"peerDependencies": {
		"passkit-generator": "workspace:*"
	},
	"dependencies": {
		"express": "^5.0.1",
		"node-fetch": "^3.2.3",
		"passkit-generator": "workspace:*",
		"tslib": "^2.7.0"
	},
	"devDependencies": {
		"@types/express": "5.0.0",
		"@types/express-serve-static-core": "^5.0.4",
		"tsx": "^4.19.2",
		"typescript": "^5.7.3",
		"@types/node": "^20.0.0"
	}
}



---
File: /examples/self-hosted/README.md
---

# Examples

This is examples folder. These examples are used to test new features and as sample showcases.

Each example owns an endpoint where a pass can be reached. This project is built upon Express.js.

Typescript compilation is done automatically through `tsx`.

Before generating a new pass, you'll have to override the `passTypeIdentifier` and `teamIdentifier` for them to match the data in your certificates. This can be done in two ways:

    a) Edit manually the `pass.json` of the model you are going to run;
    b) Pass the two fields in the query string of the example you are running when querying it;

Omitting this step, will make your pass unopenable.

Install the dependencies from wherever path you are with `pnpm install`. Installing the dependencies will link passkit-generator in the parent workspace, so to reflect any change, it will be enough to build passkit-generator and restart the example.

Then be sure to be placed in this folder (`examples/self-hosted`) and run this command to run the web server:

```sh
$ pnpm example;
```

Certificates paths in examples are linked to a folder `certificates` in the root of this project which is not provided.
To make them work, you'll have to edit both certificates and model path.

Every example runs on `0.0.0.0:8080`. Visit `http://localhost:8080/:example/:modelName`, by replacing `:example` with one of the following and `:modelName` with one inside models folder.

Please note that `field.js` example is hardcoded to download `exampleBooking.pass`.

| Example name   | Endpoint name     | Additional notes                                                                                                            |
| -------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| localize       | `/localize`       | -                                                                                                                           |
| fields         | `/fields`         | -                                                                                                                           |
| expirationDate | `/expirationDate` | Accepts a required parameter in query string `fn`, which can be either `expiration` or `void`, to switch generated example. |
| scratch        | `/scratch`        | -                                                                                                                           |
| PKPass.from    | `/pkpassfrom`     | -                                                                                                                           |
| barcodes       | `/barcodes`       | Using `?alt=true` query parameter, will lead to barcode string message usage instead of selected ones                       |
| pkpasses       | `/pkpasses`       | -                                                                                                                           |

---

Every contribution is really appreciated. ❤️ Thank you!



---
File: /examples/self-hosted/tsconfig.json
---

{
	"extends": "../../tsconfig.json",
	"compilerOptions": {
		"target": "ESNext",
		"outDir": "build",
		"sourceMap": true,
		"useUnknownInCatchVariables": false
	},
	"include": ["src/**/*"]
}



---
File: /examples/serverless/src/functions/barcodes.ts
---

import { ALBEvent, ALBResult } from "aws-lambda";
import { PKPass } from "passkit-generator";
import {
	throwClientErrorWithoutModelName,
	createPassGenerator,
} from "../shared.js";

/**
 * Lambda for barcodes example
 */

export async function barcodes(event: ALBEvent) {
	try {
		throwClientErrorWithoutModelName(event);
	} catch (err) {
		return err;
	}

	const { modelName, alt, ...passOptions } = event.queryStringParameters;

	const passGenerator = createPassGenerator(modelName, passOptions);

	const pass = (await passGenerator.next()).value as unknown as PKPass;

	if (alt === "true") {
		// After this, pass.props["barcodes"] will have support for all the formats
		pass.setBarcodes("Thank you for using this package <3");

		console.log(
			"Barcodes support is autocompleted:",
			pass.props["barcodes"],
		);
	} else {
		// After this, pass.props["barcodes"] will have support for just two of three
		// of the passed format (the valid ones);

		pass.setBarcodes(
			{
				message: "Thank you for using this package <3",
				format: "PKBarcodeFormatCode128",
			},
			{
				message: "Thank you for using this package <3",
				format: "PKBarcodeFormatPDF417",
			},
		);
	}

	return (await passGenerator.next()).value as ALBResult;
}



---
File: /examples/serverless/src/functions/expirationDate.ts
---

import { ALBEvent, ALBResult, Context } from "aws-lambda";
import { PKPass } from "passkit-generator";
import {
	throwClientErrorWithoutModelName,
	createPassGenerator,
} from "../shared.js";

/**
 * Lambda for expirationDate example
 */

export async function expirationDate(event: ALBEvent, context: Context) {
	try {
		throwClientErrorWithoutModelName(event);
	} catch (err) {
		return err;
	}

	const { modelName, ...passOptions } = event.queryStringParameters;

	const passGenerator = createPassGenerator(modelName, passOptions);

	const pass = (await passGenerator.next()).value as PKPass;

	// 2 minutes later...
	const d = new Date();
	d.setMinutes(d.getMinutes() + 2);

	// setting the expiration
	(pass as PKPass).setExpirationDate(d);
	console.log(
		"EXPIRATION DATE EXPECTED:",
		(pass as PKPass).props["expirationDate"],
	);

	return (await passGenerator.next(pass as PKPass)).value as ALBResult;
}



---
File: /examples/serverless/src/functions/fields.ts
---

import { ALBEvent, ALBResult } from "aws-lambda";
import { PKPass } from "passkit-generator";
import { createPassGenerator } from "../shared.js";

/**
 * Lambda for fields example
 */

export async function fields(event: ALBEvent) {
	const { modelName, ...passOptions } = event.queryStringParameters;

	const passGenerator = createPassGenerator("exampleBooking", passOptions);

	const pass = (await passGenerator.next()).value as PKPass;

	pass.transitType = "PKTransitTypeAir";

	pass.headerFields.push(
		{
			key: "header1",
			label: "Data",
			value: "25 mag",
			textAlignment: "PKTextAlignmentCenter",
		},
		{
			key: "header2",
			label: "Volo",
			value: "EZY997",
			textAlignment: "PKTextAlignmentCenter",
		},
	);

	pass.primaryFields.push(
		{
			key: "IATA-source",
			value: "NAP",
			label: "Napoli",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "IATA-destination",
			value: "VCE",
			label: "Venezia Marco Polo",
			textAlignment: "PKTextAlignmentRight",
		},
	);

	pass.secondaryFields.push(
		{
			key: "secondary1",
			label: "Imbarco chiuso",
			value: "18:40",
			textAlignment: "PKTextAlignmentCenter",
		},
		{
			key: "sec2",
			label: "Partenze",
			value: "19:10",
			textAlignment: "PKTextAlignmentCenter",
		},
		{
			key: "sec3",
			label: "SB",
			value: "Sì",
			textAlignment: "PKTextAlignmentCenter",
		},
		{
			key: "sec4",
			label: "Imbarco",
			value: "Anteriore",
			textAlignment: "PKTextAlignmentCenter",
		},
	);

	pass.auxiliaryFields.push(
		{
			key: "aux1",
			label: "Passeggero",
			value: "MR. WHO KNOWS",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "aux2",
			label: "Posto",
			value: "1A*",
			textAlignment: "PKTextAlignmentCenter",
		},
	);

	pass.backFields.push(
		{
			key: "document number",
			label: "Numero documento:",
			value: "- -",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "You're checked in, what next",
			label: "Hai effettuato il check-in, Quali sono le prospettive",
			value: "",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "Check In",
			label: "1. check-in✓",
			value: "",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "checkIn",
			label: "",
			value: "Le uscite d'imbarco chiudono 30 minuti prima della partenza, quindi sii puntuale. In questo aeroporto puoi utilizzare la corsia Fast Track ai varchi di sicurezza.",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "2. Bags",
			label: "2. Bagaglio",
			value: "",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "Require special assistance",
			label: "Assistenza speciale",
			value: "Se hai richiesto assistenza speciale, presentati a un membro del personale nell'area di Consegna bagagli almeno 90 minuti prima del volo.",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "3. Departures",
			label: "3. Partenze",
			value: "",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "photoId",
			label: "Un documento d’identità corredato di fotografia",
			value: "è obbligatorio su TUTTI i voli. Per un viaggio internazionale è necessario un passaporto valido o, dove consentita, una carta d’identità.",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "yourSeat",
			label: "Il tuo posto:",
			value: "verifica il tuo numero di posto nella parte superiore. Durante l’imbarco utilizza le scale anteriori e posteriori: per le file 1-10 imbarcati dalla parte anteriore; per le file 11-31 imbarcati dalla parte posteriore. Colloca le borse di dimensioni ridotte sotto il sedile davanti a te.",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "Pack safely",
			label: "Bagaglio sicuro",
			value: "Fai clic http://easyjet.com/it/articoli-pericolosi per maggiori informazioni sulle merci pericolose oppure visita il sito CAA http://www.caa.co.uk/default.aspx?catid=2200",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "Thank you for travelling easyJet",
			label: "Grazie per aver viaggiato con easyJet",
			value: "",
			textAlignment: "PKTextAlignmentLeft",
		},
	);

	return (await passGenerator.next(pass as PKPass)).value as ALBResult;
}



---
File: /examples/serverless/src/functions/index.ts
---

export * from "./barcodes.js";
export * from "./expirationDate.js";
export * from "./fields.js";
export * from "./localize.js";
export * from "./pkpasses.js";
export * from "./scratch.js";



---
File: /examples/serverless/src/functions/localize.ts
---

import {
	throwClientErrorWithoutModelName,
	createPassGenerator,
} from "../shared.js";
import type { ALBEvent, ALBResult } from "aws-lambda";
import type { PKPass } from "passkit-generator";

/**
 * Lambda for localize example
 */

export async function localize(event: ALBEvent) {
	try {
		throwClientErrorWithoutModelName(event);
	} catch (err) {
		return err;
	}

	const { modelName, ...passOptions } = event.queryStringParameters;

	const passGenerator = createPassGenerator(modelName, passOptions);

	const pass = (await passGenerator.next()).value as PKPass;

	/**
	 * Italian and German already has an .lproj which gets included
	 * but it doesn't have translations
	 */
	pass.localize("it", {
		EVENT: "Evento",
		LOCATION: "Dove",
	});

	pass.localize("de", {
		EVENT: "Ereignis",
		LOCATION: "Ort",
	});

	// ...while Norwegian doesn't, so it gets created
	pass.localize("nn", {
		EVENT: "Begivenhet",
		LOCATION: "plassering",
	});

	console.log("Added languages", Object.keys(pass.languages).join(", "));

	return (await passGenerator.next(pass as PKPass)).value as ALBResult;
}



---
File: /examples/serverless/src/functions/pkpasses.ts
---

/**
 * PKPasses generation through PKPass.pack static method
 * example.
 * Here it is showed manual model reading and
 * creating through another PKPass because in the other
 * examples, creation through templates is already shown
 *
 * PLEASE NOTE THAT, AT TIME OF WRITING, THIS EXAMPLE WORKS
 * ONLY IF PASSES ARE DOWNLOADED FROM SAFARI, due to the
 * support of PKPasses archives. To test this, you might
 * need to open a tunnel through NGROK if you cannot access
 * to your local machine (in my personal case, developing
 * under WSL is a pretty big limitation sometimes).
 *
 * PLEASE ALSO NOTE that, AT TIME OF WRITING (iOS 15.0 - 15.2)
 * Pass Viewer suffers of a really curious bug: issuing several
 * passes within the same pkpasses archive, all with the same
 * serialNumber, will lead to have a broken view and to add
 * just one pass. You can see the screenshots below:
 *
 * https://imgur.com/bDTbcDg.jpg
 * https://imgur.com/Y4GpuHT.jpg
 * https://i.imgur.com/qbJMy1d.jpg
 *
 * - "Alberto, come to look at APPLE."
 * **Alberto looks**
 * - "MAMMA MIA!""
 *
 * A feedback to Apple have been sent for this.
 */

import { ALBEvent } from "aws-lambda";
import { PKPass } from "passkit-generator";
import {
	getCertificates,
	getSpecificFileInModel,
	getS3Instance,
	getRandomColorPart,
	throwClientErrorWithoutModelName,
} from "../shared.js";
import config from "../../config.json";

/**
 * Lambda for PkPasses example
 */

export async function pkpasses(event: ALBEvent) {
	try {
		throwClientErrorWithoutModelName(event);
	} catch (err) {
		return err;
	}

	const [certificates, iconFromModel, s3] = await Promise.all([
		getCertificates(),
		getSpecificFileInModel(
			"icon.png",
			event.queryStringParameters.modelName,
		),
		getS3Instance(),
	]);

	function createPass() {
		const pass = new PKPass({}, certificates, {
			description: "Example Apple Wallet Pass",
			passTypeIdentifier: "pass.com.passkitgenerator",
			// Be sure to issue different serialNumbers or you might incur into the bug explained above
			serialNumber: `nmyuxofgna${Math.random()}`,
			organizationName: `Test Organization ${Math.random()}`,
			teamIdentifier: "F53WB8AE67",
			foregroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
			labelColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
			backgroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
		});

		pass.type = "boardingPass";
		pass.transitType = "PKTransitTypeAir";

		pass.headerFields.push(
			{
				key: "header-field-test-1",
				value: "Unknown",
			},
			{
				key: "header-field-test-2",
				value: "unknown",
			},
		);

		pass.primaryFields.push(
			{
				key: "primaryField-1",
				value: "NAP",
			},
			{
				key: "primaryField-2",
				value: "VCE",
			},
		);

		/**
		 * Required by Apple. If one is not available, a
		 * pass might be openable on a Mac but not on a
		 * specific iPhone model
		 */

		pass.addBuffer("icon.png", iconFromModel);
		pass.addBuffer("icon@2x.png", iconFromModel);
		pass.addBuffer("icon@3x.png", iconFromModel);

		return pass;
	}

	const passes = await Promise.all([
		Promise.resolve(createPass()),
		Promise.resolve(createPass()),
		Promise.resolve(createPass()),
		Promise.resolve(createPass()),
	]);

	const pkpasses = PKPass.pack(...passes);

	/**
	 * Although the other passes are served as files, in this example
	 * we are uploading on s3 (local) just see how it works.
	 */

	const buffer = pkpasses.getAsBuffer();
	const passName = `GeneratedPass-${Math.random()}.pkpasses`;

	const { Location } = await s3
		.upload({
			Bucket: config.PASSES_S3_TEMP_BUCKET,
			Key: passName,
			ContentType: pkpasses.mimeType,
			/** Marking it as expiring in 5 minutes, because passes should not be stored */
			Expires: new Date(Date.now() + 5 * 60 * 1000),
			Body: buffer,
		})
		.promise();

	/**
	 * Please note that redirection to `Location` does not work
	 * if you open this code in another device if this is is running
	 * offline. This because `Location` is on localhost. Didn't
	 * find yet a way to solve this.
	 */

	return {
		statusCode: 302,
		headers: {
			"Content-Type": pkpasses.mimeType,
			Location,
		},
	};
}



---
File: /examples/serverless/src/functions/scratch.ts
---

import { ALBEvent, ALBResult } from "aws-lambda";
import { PKPass } from "passkit-generator";
import {
	createPassGenerator,
	getRandomColorPart,
	getSpecificFileInModel,
} from "../shared.js";

/**
 * Lambda for scratch example
 */

export async function scratch(event: ALBEvent) {
	const passGenerator = createPassGenerator(undefined, {
		description: "Example Apple Wallet Pass",
		passTypeIdentifier: "pass.com.passkitgenerator",
		serialNumber: "nmyuxofgna",
		organizationName: `Test Organization ${Math.random()}`,
		teamIdentifier: "F53WB8AE67",
		foregroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
		labelColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
		backgroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
	});

	const [{ value }, iconFromModel] = await Promise.all([
		passGenerator.next(),
		getSpecificFileInModel(
			"icon.png",
			event.queryStringParameters.modelName,
		),
	]);

	const pass = value as PKPass;

	pass.type = "boardingPass";
	pass.transitType = "PKTransitTypeAir";

	pass.headerFields.push(
		{
			key: "header-field-test-1",
			value: "Unknown",
		},
		{
			key: "header-field-test-2",
			value: "unknown",
		},
	);

	pass.primaryFields.push(
		{
			key: "primaryField-1",
			value: "NAP",
		},
		{
			key: "primaryField-2",
			value: "VCE",
		},
	);

	/**
	 * Required by Apple. If one is not available, a
	 * pass might be openable on a Mac but not on a
	 * specific iPhone model
	 */

	pass.addBuffer("icon.png", iconFromModel);
	pass.addBuffer("icon@2x.png", iconFromModel);
	pass.addBuffer("icon@3x.png", iconFromModel);

	return (await passGenerator.next(pass as PKPass)).value as ALBResult;
}



---
File: /examples/serverless/src/index.ts
---

export * from "./functions/index.js";



---
File: /examples/serverless/src/shared.ts
---

import { ALBEvent, ALBResult } from "aws-lambda";
import AWS from "aws-sdk";
import fs from "node:fs/promises";
import path from "node:path";
import { Buffer } from "node:buffer";
import config from "../config.json";
import { PKPass } from "passkit-generator";

const S3: { instance: AWS.S3 } = { instance: undefined };

export function throwClientErrorWithoutModelName(event: ALBEvent) {
	if (!event.queryStringParameters?.modelName) {
		throw {
			statusCode: 400,
			body: JSON.stringify({
				message: "modelName is missing in query params",
			}),
		};
	}
}

export function getRandomColorPart() {
	return Math.floor(Math.random() * 255);
}

export async function getModel(
	modelName: string,
): Promise<string | { [key: string]: Buffer }> {
	if (process.env.IS_OFFLINE === "true") {
		console.log("model offline retrieving");

		const standardModelName = modelName.endsWith(".pass")
			? modelName
			: `${modelName}.pass`;

		return path.resolve(
			__dirname,
			"../../../",
			`models/${standardModelName}`,
		);
	}

	const s3 = await getS3Instance();

	const result = await s3
		.getObject({ Bucket: config.MODELS_S3_BUCKET, Key: modelName })
		.promise();

	return {}; // @TODO, like when it is run on s3
}

export async function getCertificates(): Promise<{
	signerCert: string | Buffer;
	signerKey: string | Buffer;
	wwdr: string | Buffer;
	signerKeyPassphrase?: string;
}> {
	let signerCert: string;
	let signerKey: string;
	let wwdr: string;
	let signerKeyPassphrase: string;

	if (process.env.IS_OFFLINE) {
		console.log("Fetching Certificates locally");

		// ****************************************************************** //
		// *** Execution path offline is `examples/serverless/.build/src` *** //
		// ****************************************************************** //

		[signerCert, signerKey, wwdr, signerKeyPassphrase] = await Promise.all([
			fs.readFile(
				path.resolve(
					__dirname,
					"../../../../",
					"certificates/signerCert.pem",
				),
				"utf-8",
			),
			fs.readFile(
				path.resolve(
					__dirname,
					"../../../../",
					"certificates/signerKey.pem",
				),
				"utf-8",
			),
			fs.readFile(
				path.resolve(
					__dirname,
					"../../../../",
					"certificates/WWDR.pem",
				),
				"utf-8",
			),
			Promise.resolve(config.SIGNER_KEY_PASSPHRASE),
		]);
	} else {
		// @TODO
	}

	return {
		signerCert,
		signerKey,
		wwdr,
		signerKeyPassphrase,
	};
}

export async function getS3Instance() {
	if (S3.instance) {
		return S3.instance;
	}

	const instance = new AWS.S3({
		s3ForcePathStyle: true,
		accessKeyId: process.env.IS_OFFLINE ? "S3RVER" : config.ACCESS_KEY_ID, // This specific key is required when working offline
		secretAccessKey: config.SECRET_ACCESS_KEY,
		endpoint: new AWS.Endpoint("http://localhost:4569"),
	});

	S3.instance = instance;

	try {
		/** Trying to create a new bucket. If it fails, it already exists (at least in theory) */
		await instance
			.createBucket({ Bucket: config.PASSES_S3_TEMP_BUCKET })
			.promise();
	} catch (err) {}

	return instance;
}

export async function getSpecificFileInModel(
	fileName: string,
	modelName: string,
) {
	const model = await getModel(modelName);

	if (typeof model === "string") {
		return fs.readFile(path.resolve(model, fileName));
	}

	return model[fileName];
}

export async function* createPassGenerator(
	modelName?: string,
	passOptions?: Object,
): AsyncGenerator<PKPass, ALBResult, PKPass> {
	const [template, certificates, s3] = await Promise.all([
		modelName
			? getModel(modelName)
			: Promise.resolve({} as ReturnType<typeof getModel>),
		getCertificates(),
		getS3Instance(),
	]);

	let pass: PKPass;

	if (template instanceof Object) {
		pass = new PKPass(template, certificates, passOptions);
	} else if (typeof template === "string") {
		pass = await PKPass.from(
			{
				model: template,
				certificates,
			},
			passOptions,
		);
	}

	if (pass.type === "boardingPass" && !pass.transitType) {
		// Just to not make crash the creation if we use a boardingPass
		pass.transitType = "PKTransitTypeAir";
	}

	pass = yield pass;

	const buffer = pass.getAsBuffer();

	/**
	 * Please note that redirection to `Location` does not work
	 * if you open this code in another device if this is run
	 * offline. This because `Location` is on localhost. Didn't
	 * find yet a way to solve this.
	 */

	return {
		statusCode: 200,
		headers: {
			"Content-Type": pass.mimeType,
		},
		/**
		 * It is required for the file to be served
		 * as base64, so it won't be altered in AWS.
		 *
		 * @see https://aws.amazon.com/it/blogs/compute/handling-binary-data-using-amazon-api-gateway-http-apis/
		 * "For the response path, API Gateway inspects the isBase64Encoding flag returned from Lambda."
		 */
		body: buffer.toString("base64"),
		isBase64Encoded: true,
	};
}



---
File: /examples/serverless/.gitignore
---

# package directories
node_modules
jspm_packages

# Serverless directories
.serverless
.build
!*.js



---
File: /examples/serverless/config.json
---

{
	"SIGNER_KEY_PASSPHRASE": "123456",
	"PASSES_S3_TEMP_BUCKET": "pkge-test",
	"ACCESS_KEY_ID": "S3RVER",
	"SECRET_ACCESS_KEY": "S3RVER",
	"MODELS_S3_BUCKET": "pkge-mdbk"
}



---
File: /examples/serverless/package.json
---

{
	"name": "examples-aws-lambda",
	"version": "0.0.0",
	"private": true,
	"description": "Passkit-generator examples for running in AWS Lambda",
	"author": "Alexander P. Cerutti <cerutti.alexander@gmail.com>",
	"license": "ISC",
	"main": "src/index.js",
	"type": "module",
	"scripts": {
		"clear:deps": "rm -rf node_modules",
		"example": "pnpm serverless offline --host 0.0.0.0; :'specifying host due to WSL limits'"
	},
	"dependencies": {
		"aws-sdk": "^2.1692.0",
		"tslib": "^2.8.1",
		"passkit-generator": "workspace:*"
	},
	"devDependencies": {
		"@types/aws-lambda": "^8.10.147",
		"serverless-offline": "^8.8.1",
		"serverless-plugin-typescript": "^2.1.5",
		"serverless-s3-local": "^0.8.5",
		"typescript": "^5.7.3",
		"@types/node": "^20"
	}
}



---
File: /examples/serverless/README.md
---

# Serverless Examples

This is a sample project for showing passkit-generator being used on cloud functions.

Typescript compilation happens automatically through `serverless-plugin-typescript` when serverless is started.

Before generating a new pass, you'll have to override the `passTypeIdentifier` and `teamIdentifier` for them to match the data in your certificates. This can be done in two ways:

    a) Edit manually the `pass.json` of the model you are going to run;
    b) Pass the two fields in the query string of the example you are running when querying it;

Omitting this step, will make your pass unopenable.

## Configuration

These examples are basically made for being executed locally. In the file `config.json`, some constants can be customized.

```json
	/** Passkit signerKey passphrase **/
	"SIGNER_KEY_PASSPHRASE": "123456",

	/** Bucket name where a pass is saved before being served. */
	"PASSES_S3_TEMP_BUCKET": "pkge-test",

	/** S3 Access key ID - "S3RVER" is default for `serverless-s3-local`. If this example is run offline, "S3RVER" will always be used. */
	"ACCESS_KEY_ID": "S3RVER",

	/** S3 Secret - "S3RVER" is default for `serverless-s3-local` */
	"SECRET_ACCESS_KEY": "S3RVER",

	/** Bucket that contains pass models **/
	"MODELS_S3_BUCKET": "pkge-mdbk"
```

## Run examples

Install the dependencies from wherever path you are and run serverless. Installing the dependencies will link passkit-generator in the parent workspace, so to reflect any change, it will be enough to build passkit-generator and restart the example.

```sh
$ pnpm install;
$ pnpm example;
```

This will start `serverless offline` with an additional host option (mainly for WSL environment).
Serverless will start, by default, on `0.0.0.0:8080`.

### Available examples

All the examples, except fields ones, require a `modelName` to be passed in queryString. The name will be checked against local FS or S3 bucket if example is deployed.
Pass in queryString all the pass props you want to apply them to the final result.

| Example name   | Endpoint name     | Additional notes                                                                                                                  |
| -------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| localize       | `/localize`       | -                                                                                                                                 |
| fields         | `/fields`         | -                                                                                                                                 |
| expirationDate | `/expirationDate` | -                                                                                                                                 |
| scratch        | `/scratch`        | -                                                                                                                                 |
| barcodes       | `/barcodes`       | Using `?alt=true` query parameter, will lead to barcode string message usage instead of selected ones                             |
| pkpasses       | `/pkpasses`       | This example shows how to upload the pkpasses file on S3, even if it is discouraged. It has been done just to share the knowledge |



---
File: /examples/serverless/serverless.yml
---

service: passkit-generator-test-lambda
frameworkVersion: "3"

plugins:
    - serverless-offline
    - serverless-plugin-typescript
    - serverless-s3-local

provider:
    name: aws
    runtime: nodejs14.x
    lambdaHashingVersion: "20201221"

functions:
    fields:
        handler: src/index.fields
        events:
            - httpApi:
                  path: /fields
                  method: get
    expiration:
        handler: src/index.expirationDate
        events:
            - httpApi:
                  path: /expirationDate
                  method: get
    localize:
        handler: src/index.localize
        events:
            - httpApi:
                  path: /localize
                  method: get
    barcodes:
        handler: src/index.barcodes
        events:
            - httpApi:
                  path: /barcodes
                  method: get
    scratch:
        handler: src/index.scratch
        events:
            - httpApi:
                  path: /scratch
                  method: get
    pkpasses:
        handler: src/index.pkpasses
        events:
            - httpApi:
                  path: /pkpasses
                  method: get

custom:
    serverless-offline:
        httpPort: 8080
    s3:
        directory: /tmp



---
File: /examples/serverless/tsconfig.json
---

{
	"extends": "../../tsconfig.json",
	"compilerOptions": {
		"target": "ESNext",
		"outDir": "build",
		"resolveJsonModule": true
	},
	"include": ["src/**/*"]
}



---
File: /specs/PKPass.spec.mjs
---

// @ts-check
import { beforeEach, beforeAll, expect, it, describe } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import forge from "node-forge";
import { PKPass } from "passkit-generator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @returns {[cert: Buffer, key: Buffer]}
 */

function generateCertificateAndPrivateKey() {
	const keys = forge.pki.rsa.generateKeyPair(2048);
	const cert = forge.pki.createCertificate();

	cert.publicKey = keys.publicKey;

	cert.serialNumber = "01";
	cert.validity.notBefore = new Date();
	cert.validity.notAfter = new Date();
	cert.validity.notAfter.setFullYear(
		cert.validity.notBefore.getFullYear() + 1,
	);

	const attrs = [
		{
			name: "commonName",
			value: "example.org",
		},
		{
			name: "countryName",
			value: "TS",
		},
		{
			shortName: "ST",
			value: "Test",
		},
		{
			name: "localityName",
			value: "Test",
		},
		{
			name: "organizationName",
			value: "Test",
		},
		{
			shortName: "OU",
			value: "Test",
		},
	];

	cert.setIssuer(attrs);
	cert.setSubject(attrs);
	cert.sign(keys.privateKey);

	return [
		Buffer.from(forge.pki.certificateToPem(cert)),
		Buffer.from(forge.pki.privateKeyToPem(keys.privateKey)),
	];
}

const [signerCertBuffer, privateKeyBuffer] = generateCertificateAndPrivateKey();

/**
 * SIGNER_CERT, SIGNER_KEY, WWDR and SIGNER_KEY_PASSPHRASE are also set
 * as secrets in Github for run tests on Github Actions
 */

const SIGNER_CERT = process.env.SIGNER_CERT || signerCertBuffer;
const SIGNER_KEY = process.env.SIGNER_KEY || privateKeyBuffer;
const WWDR =
	process.env.WWDR ||
	fs.readFileSync(path.resolve(__dirname, "../certificates/WWDR.pem"));
const SIGNER_KEY_PASSPHRASE = process.env.SIGNER_KEY_PASSPHRASE || "123456";

/**
 * @type {Record<string, Buffer>}
 */

const modelFiles = {};

const EXAMPLE_PATH_RELATIVE = "../examples/models/examplePass.pass";

/**
 * @param {string} folder
 * @returns
 */

function unpackFolder(folder) {
	const entryList = fs.readdirSync(path.resolve(__dirname, folder));

	const fileList = {};

	for (let entry of entryList) {
		const relativeFilePath = path.resolve(__dirname, folder, entry);

		const stats = fs.lstatSync(relativeFilePath);

		if (stats.isDirectory()) {
			const directoryFilesList = Object.entries(
				unpackFolder(relativeFilePath),
			);
			Object.assign(
				fileList,
				directoryFilesList.reduce((acc, [file, content]) => {
					return {
						...acc,
						[`${entry}/${file}`]: content,
					};
				}, {}),
			);
		} else {
			fileList[entry] = fs.readFileSync(relativeFilePath);
		}
	}

	return fileList;
}

function getGeneratedPassJson(pkpass) {
	const buffers = pkpass.getAsRaw();
	return JSON.parse(buffers["pass.json"].toString("utf-8"));
}

describe("PKPass", () => {
	beforeAll(() => {
		Object.assign(modelFiles, unpackFolder(EXAMPLE_PATH_RELATIVE));
	});

	/**
	 * @type {PKPass}
	 */
	let pkpass;

	beforeEach(() => {
		pkpass = new PKPass(modelFiles, {
			signerCert: SIGNER_CERT,
			signerKey: SIGNER_KEY,
			wwdr: WWDR,
			signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
		});
	});

	it("should throw an error if certificates provided are not complete or invalid", () => {
		expect(() => {
			// @ts-expect-error
			pkpass.certificates = {
				signerCert: "",
			};
		}).toThrow();

		expect(() => {
			pkpass.certificates = {
				// @ts-expect-error
				signerCert: 5,
				// @ts-expect-error
				signerKey: 3,
				wwdr: "",
			};
		}).toThrow();

		expect(() => {
			pkpass.certificates = {
				// @ts-expect-error
				signerCert: undefined,
				// @ts-expect-error
				signerKey: null,
				wwdr: "",
			};
		}).toThrow();
	});

	it("should own pkpass mimetype", () => {
		expect(pkpass.mimeType).toBe("application/vnd.apple.pkpass");
	});

	it("should throw error if a non recognized type is assigned", () => {
		expect(
			() =>
				// @ts-expect-error
				(pkpass.type = "asfdg"),
		).toThrowError();
	});

	it("should throw if fields getters are accessed without specifying a type first", () => {
		/** Resetting pass.json */
		const passjson = modelFiles["pass.json"];
		const changedPassJson = Buffer.from(
			JSON.stringify(
				Object.assign({}, JSON.parse(passjson.toString("utf-8")), {
					eventTicket: undefined,
					boardingPass: undefined,
					coupon: undefined,
					storeCard: undefined,
					generic: undefined,
					transitType: undefined,
				}),
			),
			"utf-8",
		);

		pkpass = new PKPass(
			Object.assign({}, modelFiles, { "pass.json": changedPassJson }),
			{
				signerCert: SIGNER_CERT,
				signerKey: SIGNER_KEY,
				wwdr: WWDR,
				signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
			},
		);

		expect(() => pkpass.headerFields).toThrowError();
		expect(() => pkpass.primaryFields).toThrowError();
		expect(() => pkpass.auxiliaryFields).toThrowError();
		expect(() => pkpass.secondaryFields).toThrowError();
		expect(() => pkpass.backFields).toThrowError();
		expect(() => pkpass.transitType).toThrowError();
	});

	it("should throw if transitType is set on a non-boardingPass", () => {
		pkpass.type = "eventTicket";
		expect(() => (pkpass.transitType = "PKTransitTypeAir")).toThrowError();
		expect(() => pkpass.transitType).toThrowError();
	});

	it("should throw if transitType is not specified on a boardingPass", () => {
		pkpass.type = "boardingPass";
		expect(() => pkpass.getAsRaw()).toThrowError();
	});

	it("should include the transitType if generating a boardingPass", () => {
		pkpass.type = "boardingPass";
		pkpass.transitType = "PKTransitTypeAir";

		expect(pkpass.transitType).toBe("PKTransitTypeAir");

		const passjsonGenerated = getGeneratedPassJson(pkpass);
		expect(passjsonGenerated.boardingPass).not.toBeUndefined();
		expect(passjsonGenerated.boardingPass.transitType).toBe(
			"PKTransitTypeAir",
		);
	});

	it("should import transitType and fields from a pass.json", () => {
		pkpass = new PKPass(
			{
				...modelFiles,
				"pass.json": Buffer.from(
					JSON.stringify({
						...modelFiles["pass.json"],
						boardingPass: {
							transitType: "PKTransitTypeAir",
							primaryFields: [
								{
									key: "blue",
									value: "not-blue",
								},
							],
							headerFields: [
								{
									key: "red",
									value: "not-red",
								},
							],
						},
					}),
				),
			},
			{
				signerCert: SIGNER_CERT,
				signerKey: SIGNER_KEY,
				signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
				wwdr: WWDR,
			},
		);

		const passjsonGenerated = getGeneratedPassJson(pkpass);

		expect(passjsonGenerated.boardingPass).not.toBeUndefined();
		expect(passjsonGenerated.boardingPass.transitType).toBe(
			"PKTransitTypeAir",
		);
		expect(passjsonGenerated.boardingPass.primaryFields).toBeInstanceOf(
			Array,
		);
		expect(passjsonGenerated.boardingPass.primaryFields.length).toBe(1);
	});

	it("should include fields modifications inside final pass.json", () => {
		/** Resetting fields */
		pkpass.type = "eventTicket";

		pkpass.primaryFields.push({
			key: "testField-pf",
			value: "test",
		});
		pkpass.headerFields.push({
			key: "testField-hf",
			value: "test",
		});
		pkpass.auxiliaryFields.push({
			key: "testField-af",
			value: "test",
		});
		pkpass.secondaryFields.push({
			key: "testField-sf",
			value: "test",
		});
		pkpass.backFields.push({
			key: "testField-bf",
			value: "test",
		});

		const passjsonGenerated = getGeneratedPassJson(pkpass);

		const {
			headerFields,
			primaryFields,
			auxiliaryFields,
			secondaryFields,
			backFields,
		} = passjsonGenerated.eventTicket;

		expect(primaryFields[0]).toEqual({
			key: "testField-pf",
			value: "test",
		});
		expect(headerFields[0]).toEqual({
			key: "testField-hf",
			value: "test",
		});
		expect(auxiliaryFields[0]).toEqual({
			key: "testField-af",
			value: "test",
		});
		expect(secondaryFields[0]).toEqual({
			key: "testField-sf",
			value: "test",
		});
		expect(backFields[0]).toEqual({
			key: "testField-bf",
			value: "test",
		});
	});

	it("should maintain fields addition order", () => {
		/** Resetting fields */
		pkpass.type = "eventTicket";

		pkpass.primaryFields.push(
			{
				key: "testField-pf0",
				value: "test",
			},
			{
				key: "testField-pf1",
				value: "test",
			},
			{
				key: "testField-pf2",
				value: "test",
			},
		);

		const passjsonGenerated = getGeneratedPassJson(pkpass);

		const { primaryFields } = passjsonGenerated.eventTicket;

		expect(primaryFields[0]).toEqual({
			key: "testField-pf0",
			value: "test",
		});

		expect(primaryFields[1]).toEqual({
			key: "testField-pf1",
			value: "test",
		});

		expect(primaryFields[2]).toEqual({
			key: "testField-pf2",
			value: "test",
		});
	});

	it("should omit fields with the same keys in final pass.json", () => {
		/** Resetting fields */
		pkpass.type = "eventTicket";

		pkpass.primaryFields.push({
			key: "testField-pf",
			value: "test",
		});

		pkpass.headerFields.push({
			key: "testField-pf",
			value: "test",
		});

		const passjsonGenerated = getGeneratedPassJson(pkpass);
		expect(passjsonGenerated.eventTicket.headerFields.length).toBe(0);
	});

	it("should include row property in auxiliary fields but omit it in others", () => {
		/** Resetting fields */
		pkpass.type = "eventTicket";

		pkpass.primaryFields.push({
			key: "testField-pf",
			value: "test",
			// @ts-expect-error
			row: 0,
		});

		pkpass.auxiliaryFields.push({
			key: "testField-pf",
			value: "test",
			row: 1,
		});

		const passjsonGenerated = getGeneratedPassJson(pkpass);

		expect(passjsonGenerated.eventTicket.auxiliaryFields).toBeInstanceOf(
			Array,
		);

		expect(passjsonGenerated.eventTicket.auxiliaryFields.length).toBe(1);
		expect(passjsonGenerated.eventTicket.auxiliaryFields[0].row).toBe(1);
		expect(passjsonGenerated.eventTicket.primaryFields).toBeInstanceOf(
			Array,
		);
		expect(passjsonGenerated.eventTicket.primaryFields.length).toBe(0);
	});

	it("should reset clear all the fields if the type changes", () => {
		pkpass.type = "boardingPass";

		pkpass.primaryFields.push({
			key: "testField-pf",
			value: "test",
		});
		pkpass.headerFields.push({
			key: "testField-hf",
			value: "test",
		});
		pkpass.auxiliaryFields.push({
			key: "testField-af",
			value: "test",
		});
		pkpass.secondaryFields.push({
			key: "testField-sf",
			value: "test",
		});
		pkpass.backFields.push({
			key: "testField-bf",
			value: "test",
		});

		pkpass.transitType = "PKTransitTypeAir";
		pkpass.type = "eventTicket";

		const passjsonGenerated = getGeneratedPassJson(pkpass);

		const {
			headerFields,
			primaryFields,
			secondaryFields,
			auxiliaryFields,
			backFields,
		} = passjsonGenerated.eventTicket;

		expect(headerFields).toBeInstanceOf(Array);
		expect(headerFields.length).toBe(0);

		expect(primaryFields).toBeInstanceOf(Array);
		expect(primaryFields.length).toBe(0);

		expect(secondaryFields).toBeInstanceOf(Array);
		expect(secondaryFields.length).toBe(0);

		expect(auxiliaryFields).toBeInstanceOf(Array);
		expect(auxiliaryFields.length).toBe(0);

		expect(backFields).toBeInstanceOf(Array);
		expect(backFields.length).toBe(0);
	});

	it("should export a buffer when getAsBuffer is used", () => {
		expect(pkpass.getAsBuffer()).toBeInstanceOf(Buffer);
	});

	describe("pkpass should get frozen once an export is done", () => {
		it("getAsRaw", () => {
			pkpass.getAsRaw();

			/** We might want to test all the methods, but methods might change... so should we? */
			expect(() => pkpass.localize("en", { a: "b" })).toThrowError();
		});

		it("getAsBuffer", () => {
			pkpass.getAsBuffer();

			/** We might want to test all the methods, but methods might change... so should we? */
			expect(() => pkpass.localize("en", { a: "b" })).toThrowError();
		});

		it("getAsStream", () => {
			pkpass.getAsStream();

			/** We might want to test all the methods, but methods might change... so should we? */
			expect(() => pkpass.localize("en", { a: "b" })).toThrowError();
		});
	});

	describe("localize and languages", () => {
		it("should delete a language, all of its translations and all of its files, when null is passed as parameter", () => {
			pkpass.addBuffer("it.lproj/icon@3x.png", Buffer.alloc(0));
			pkpass.addBuffer("en.lproj/icon@3x.png", Buffer.alloc(0));

			pkpass.localize("it", null);
			pkpass.localize("en", null);

			const buffers = pkpass.getAsRaw();

			expect(pkpass.languages.length).toBe(0);
			expect(buffers["it.lproj/icon@3x.png"]).toBeUndefined();
			expect(buffers["en.lproj/icon@3x.png"]).toBeUndefined();
		});

		it("should throw if lang is not a string", () => {
			// @ts-expect-error
			expect(() => pkpass.localize(null)).toThrowError();

			// @ts-expect-error
			expect(() => pkpass.localize(undefined)).toThrowError();

			// @ts-expect-error
			expect(() => pkpass.localize(5)).toThrowError();

			// @ts-expect-error
			expect(() => pkpass.localize(true)).toThrowError();

			// @ts-expect-error
			expect(() => pkpass.localize({})).toThrowError();
		});

		it("should create a new pass.strings from passed translations", () => {
			pkpass.localize("en", {
				mimmo: "Domenic",
			});

			const buffers = pkpass.getAsRaw();

			expect(buffers["en.lproj/pass.strings"].toString("utf-8")).toBe(
				'"mimmo" = "Domenic";',
			);
		});
	});

	describe("addBuffer", () => {
		it("should include a file buffer inside the final pass", () => {
			pkpass.addBuffer("icon@3x.png", modelFiles["icon.png"]);

			const buffers = pkpass.getAsRaw();

			expect(buffers["icon@3x.png"]).not.toBeUndefined();
			expect(buffers["icon@3x.png"]).toBe(modelFiles["icon.png"]);
		});

		it("should include localized files buffer inside final pass", () => {
			pkpass.addBuffer("it.lproj/icon@3x.png", modelFiles["icon.png"]);

			const buffers = pkpass.getAsRaw();

			expect(buffers["it.lproj/icon@3x.png"]).not.toBeUndefined();
			expect(buffers["it.lproj/icon@3x.png"]).toBe(
				modelFiles["icon.png"],
			);
		});

		it("should ignore further pass.json addition if already available", () => {
			expect(modelFiles["pass.json"]).not.toBeUndefined();

			pkpass.addBuffer(
				"pass.json",
				Buffer.from(
					JSON.stringify({
						boardingPass: {},
					}),
				),
			);

			const passjsonGenerated = getGeneratedPassJson(pkpass);
			expect(passjsonGenerated.boardingPass).toBeUndefined();
			expect(passjsonGenerated.eventTicket).toBeInstanceOf(Object);
		});

		it("should accept a pass.json if not already added", () => {
			const modelFilesCopy = Object.assign({}, modelFiles, {
				"pass.json": undefined,
			});

			pkpass = new PKPass(modelFilesCopy, {
				signerCert: SIGNER_CERT,
				signerKey: SIGNER_KEY,
				wwdr: WWDR,
				signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
			});

			pkpass.addBuffer(
				"pass.json",
				Buffer.from(
					JSON.stringify({
						boardingPass: {
							primaryFields: [
								{
									key: "test",
									value: "meh",
								},
							],
							transitType: "PKTransitTypeAir",
						},
						description: "my testing pass",
					}),
				),
			);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.boardingPass).not.toBeUndefined();
			expect(passjsonGenerated.boardingPass.primaryFields[0]).toEqual({
				key: "test",
				value: "meh",
			});
			expect(passjsonGenerated.boardingPass.transitType).toBe(
				"PKTransitTypeAir",
			);
		});

		it("should accept personalization files if nfc data is added", () => {
			pkpass.setNFC({
				encryptionPublicKey: "fakeEPK",
				message: "Not-a-valid-message-but-we-dont-care",
			});

			pkpass.addBuffer(
				"personalization.json",
				Buffer.from(
					JSON.stringify({
						requiredPersonalizationFields: [
							"PKPassPersonalizationFieldName",
						],
						description: "reward enrollement test",
					}),
				),
			);

			pkpass.addBuffer(
				"personalizationLogo@2x.png",
				modelFiles["icon.png"],
			);

			const buffers = pkpass.getAsRaw();

			expect(buffers["personalization.json"]).not.toBeUndefined();
			expect(
				JSON.parse(buffers["personalization.json"].toString("utf-8"))
					.requiredPersonalizationFields,
			).not.toBeUndefined();
			expect(
				JSON.parse(buffers["personalization.json"].toString("utf-8"))
					.requiredPersonalizationFields.length,
			).toBe(1);
			expect(
				JSON.parse(buffers["personalization.json"].toString("utf-8"))
					.requiredPersonalizationFields[0],
			).toBe("PKPassPersonalizationFieldName");
		});

		it("should remove personalization files if nfc data is not specified", () => {
			pkpass.addBuffer(
				"personalization.json",
				Buffer.from(
					JSON.stringify({
						requiredPersonalizationFields: [
							"PKPassPersonalizationFieldName",
						],
						description: "reward enrollement test",
					}),
				),
			);

			pkpass.addBuffer(
				"personalizationLogo@2x.png",
				modelFiles["icon.png"],
			);

			const buffers = pkpass.getAsRaw();

			expect(buffers["personalization.json"]).toBeUndefined();
			expect(buffers["personalizationLogo@2x.png"]).toBeUndefined();
		});

		it("should convert Windows paths to unix paths", () => {
			/**
			 * This should not be reassignable, but we are actually able to set it.
			 * And this is fine for testing Windows-like behavior.
			 */

			// @ts-ignore
			path.sep = "\\";

			pkpass.addBuffer("it.lproj\\icon@2x.png", modelFiles["icon.png"]);

			const buffers = pkpass.getAsRaw();

			expect(
				JSON.parse(buffers["manifest.json"].toString("utf-8"))[
					"it.lproj/icon@2x.png"
				],
			).not.toBeUndefined();

			/** Resetting for the next tests */
			// @ts-ignore
			path.sep = "/";
		});

		it("should merge translations files with translations", () => {
			const translationFile = `"MY_DESCRIPTION" = "test";
"MY_DESCRIPTION_2" = "test";`;

			pkpass.addBuffer(
				"en.lproj/pass.strings",
				Buffer.from(translationFile),
			);

			expect(pkpass.languages.length).toBe(1);

			const buffers = pkpass.getAsRaw();

			expect(buffers["en.lproj/pass.strings"]).not.toBeUndefined();
			expect(buffers["en.lproj/pass.strings"].toString("utf-8")).toBe(
				translationFile,
			);
		});

		it("should ignore invalid l10n files", () => {
			const invalidTranslationStrings = `
"Insert Element"="Insert Element
"ErrorString_1= "An unknown error occurred."
			`;

			pkpass.addBuffer(
				"en.lproj/pass.strings",
				Buffer.from(invalidTranslationStrings),
			);

			expect(pkpass.files["en.lproj/pass.strings"]).toBeUndefined();

			const buffers = pkpass.getAsRaw();

			expect(buffers["en.lproj/pass.strings"]).toBeUndefined();
		});
	});

	describe("expiration date", () => {
		it("should set a pass expiration date", () => {
			pkpass.setExpirationDate(new Date("2023-04-09T17:00-07:00"));

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.expirationDate).toBe(
				"2023-04-10T00:00:00.000Z",
			);
		});

		it("should reset an expiration date", () => {
			pkpass.setExpirationDate(new Date(2023, 3, 10));
			pkpass.setExpirationDate(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.expirationDate).toBeUndefined();
		});

		it("should throw if an invalid date is received", () => {
			expect(() =>
				// @ts-expect-error
				pkpass.setExpirationDate("32/18/228317"),
			).toThrowError();
			// @ts-expect-error
			expect(() => pkpass.setExpirationDate(undefined)).toThrowError();
			// @ts-expect-error
			expect(() => pkpass.setExpirationDate(5)).toThrowError();
			// @ts-expect-error
			expect(() => pkpass.setExpirationDate({})).toThrowError();
		});
	});

	describe("beacons", () => {
		it("should set pass beacons", () => {
			pkpass.setBeacons({
				proximityUUID: "0000000000",
				relevantText: "immabeacon",
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.beacons.length).toBe(1);
			expect(passjsonGenerated.beacons).toEqual([
				{
					proximityUUID: "0000000000",
					relevantText: "immabeacon",
				},
			]);
		});

		it("should reset beacons", () => {
			pkpass.setBeacons({
				proximityUUID: "0000000000",
				relevantText: "immabeacon",
			});
			pkpass.setBeacons(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.beacons).toBeUndefined();
		});
	});

	describe("locations", () => {
		it("should set pass locations", () => {
			pkpass.setLocations({
				latitude: 0,
				longitude: 0,
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.locations.length).toBe(1);
			expect(passjsonGenerated.locations).toEqual([
				{
					latitude: 0,
					longitude: 0,
				},
			]);
		});

		it("should reset locations", () => {
			pkpass.setLocations({
				latitude: 0,
				longitude: 0,
			});
			pkpass.setLocations(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.locations).toBeUndefined();
		});
	});

	describe("Date relevancy", () => {
		describe("(deprecated iOS 18) (root).relevantDate", () => {
			it("should set pass relevant date", () => {
				pkpass.setRelevantDate(new Date("2023-04-11T00:15+10:00"));

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				expect(passjsonGenerated.relevantDate).toBe(
					"2023-04-10T14:15:00.000Z",
				);
			});

			it("should reset relevant date", () => {
				pkpass.setRelevantDate(new Date(2023, 3, 10, 14, 15));
				pkpass.setRelevantDate(null);

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				expect(passjsonGenerated.relevantDate).toBeUndefined();
			});

			it("should throw if an invalid date is received", () => {
				expect(() =>
					// @ts-expect-error
					pkpass.setRelevantDate("32/18/228317"),
				).toThrowError();
				// @ts-expect-error
				expect(() => pkpass.setRelevantDate(undefined)).toThrowError();
				// @ts-expect-error
				expect(() => pkpass.setRelevantDate(5)).toThrowError();
				// @ts-expect-error
				expect(() => pkpass.setRelevantDate({})).toThrowError();
			});
		});

		describe("setRelevantDates", () => {
			it("should accept strings", () => {
				pkpass.setRelevantDates([
					{
						startDate: "2025-01-08T22:17:30.000Z",
						endDate: "2025-01-08T23:58:25.000Z",
					},
					{
						relevantDate: "2025-01-08T22:17:30.000Z",
					},
				]);

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				expect(passjsonGenerated.relevantDates).toMatchObject([
					{
						startDate: "2025-01-08T22:17:30.000Z",
						endDate: "2025-01-08T23:58:25.000Z",
					},
					{
						relevantDate: "2025-01-08T22:17:30.000Z",
					},
				]);
			});

			it("should accept dates", () => {
				pkpass.setRelevantDates([
					{
						startDate: new Date(2025, 1, 8, 23, 58, 25),
						endDate: new Date(2025, 1, 8, 23, 58, 25),
					},
					{
						relevantDate: new Date(2025, 1, 8, 23, 58, 25),
					},
				]);

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				expect(passjsonGenerated.relevantDates).toMatchObject([
					{
						startDate: "2025-02-08T22:58:25.000Z",
						endDate: "2025-02-08T22:58:25.000Z",
					},
					{
						relevantDate: "2025-02-08T22:58:25.000Z",
					},
				]);
			});

			it("should allow resetting", () => {
				pkpass.setRelevantDates([
					{
						startDate: "2025-01-08T22:17:30.000Z",
						endDate: "2025-01-08T23:58:25.000Z",
					},
					{
						relevantDate: "2025-01-08T22:17:30.000Z",
					},
				]);

				pkpass.setRelevantDates(null);

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				expect(passjsonGenerated.relevantDates).toBeUndefined();
			});
		});
	});

	describe("barcodes", () => {
		it("should create all barcode structures if a message is used", () => {
			pkpass.setBarcodes("a test barcode");

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.barcode).toBeUndefined();
			expect(passjsonGenerated.barcodes).toBeInstanceOf(Array);
			expect(passjsonGenerated.barcodes.length).toBe(4);
			expect(passjsonGenerated.barcodes).toEqual([
				{
					format: "PKBarcodeFormatQR",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
				{
					format: "PKBarcodeFormatPDF417",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
				{
					format: "PKBarcodeFormatAztec",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
				{
					format: "PKBarcodeFormatCode128",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
			]);
		});

		it("should use only the barcode structure provided", () => {
			pkpass.setBarcodes({
				format: "PKBarcodeFormatQR",
				message: "a test barcode",
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.barcode).toBeUndefined();
			expect(passjsonGenerated.barcodes).toBeInstanceOf(Array);
			expect(passjsonGenerated.barcodes.length).toBe(1);
			expect(passjsonGenerated.barcodes).toEqual([
				{
					format: "PKBarcodeFormatQR",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
			]);
		});

		it("should ignore objects and values that not comply with Schema.Barcodes", () => {
			/**
			 * @type {Parameters<typeof pkpass["setBarcodes"]>}
			 */

			const setBarcodesArguments = [
				// @ts-expect-error
				5,
				// @ts-expect-error
				10,
				// @ts-expect-error
				15,
				{
					message: "28363516282",
					format: "PKBarcodeFormatPDF417",
				},
				// @ts-expect-error
				{
					format: "PKBarcodeFormatPDF417",
				},
				// @ts-expect-error
				7,
				// @ts-expect-error
				1,
			];

			pkpass.setBarcodes(...setBarcodesArguments);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.barcodes).toBeInstanceOf(Array);
			expect(passjsonGenerated.barcodes.length).toBe(1);
			expect(passjsonGenerated.barcodes[0]).toEqual({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "iso-8859-1",
			});
		});
	});

	describe("nfc", () => {
		it("should set pass nfc", () => {
			pkpass.setNFC({
				encryptionPublicKey: "blabla",
				message: "nfc data",
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.nfc).toEqual({
				encryptionPublicKey: "blabla",
				message: "nfc data",
			});
		});

		it("should reset nfc data", () => {
			pkpass.setNFC({
				encryptionPublicKey: "blabla",
				message: "nfc data",
			});
			pkpass.setNFC(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.nfc).toBeUndefined();
		});
	});

	describe("props getter", () => {
		it("should return a copy of all props", () => {
			pkpass.setBarcodes({
				format: "PKBarcodeFormatQR",
				message: "a test barcode",
			});

			const firstPropsCheck = pkpass.props;

			pkpass.setBarcodes(null);

			expect(firstPropsCheck.barcodes).toEqual([
				{
					format: "PKBarcodeFormatQR",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
			]);
		});
	});

	describe("PKPass.from", () => {
		it("should clone the properties and the buffers of another pkpass", async () => {
			const passcopy = await PKPass.from(pkpass);
			expect(pkpass).not.toBe(passcopy);

			const buffers1 = pkpass.getAsRaw();
			const buffers2 = passcopy.getAsRaw();

			const fileNames = new Set([
				...Object.keys(buffers1),
				...Object.keys(buffers2),
			]);

			for (let key in fileNames) {
				expect(buffers1[key]).not.toBeUndefined();
				expect(buffers2[key]).not.toBeUndefined();
				expect(buffers1[key]).not.toBe(buffers2[key]);
				expect(buffers1[key]).toEqual(buffers2[key]);
			}

			const passjsonGenerated1 = getGeneratedPassJson(pkpass);
			const passjsonGenerated2 = getGeneratedPassJson(passcopy);
			expect(passjsonGenerated1.eventTicket).toEqual(
				passjsonGenerated2.eventTicket,
			);
		});

		it("should throw error when falsy value is passed as source", () => {
			expect.assertions(5);

			// @ts-expect-error
			expect(PKPass.from(null)).rejects.not.toBeUndefined();
			// @ts-expect-error
			expect(PKPass.from(false)).rejects.not.toBeUndefined();
			// @ts-expect-error
			expect(PKPass.from(undefined)).rejects.not.toBeUndefined();
			// @ts-expect-error
			expect(PKPass.from("")).rejects.not.toBeUndefined();
			// @ts-expect-error
			expect(PKPass.from({})).rejects.not.toBeUndefined();
		});

		it("should read all the files from a fs model", async () => {
			pkpass = await PKPass.from({
				model: path.resolve(__dirname, EXAMPLE_PATH_RELATIVE),
				certificates: {
					signerCert: SIGNER_CERT,
					signerKey: SIGNER_KEY,
					signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
					wwdr: WWDR,
				},
			});

			const buffers = pkpass.getAsRaw();

			for (let fileName of Object.keys(buffers)) {
				/** Skipping generated files */
				if (
					fileName === "signature" ||
					fileName === "manifest.json" ||
					fileName === "pass.json"
				) {
					continue;
				}

				expect(modelFiles[fileName]).not.toBeUndefined();
				expect(modelFiles[fileName]).toEqual(buffers[fileName]);
			}
		});

		it("should throw an error if a model folder doesn't exist", () => {
			expect(() =>
				PKPass.from({
					model: path.resolve(
						__dirname,
						"this/model/doesnt/exists.pass",
					),
				}),
			).rejects.toBeInstanceOf(Error);
		});

		it("should enforce .pass model extension", async () => {
			expect(
				async () =>
					await PKPass.from({
						model: path.resolve(
							__dirname,
							"../examples/models/examplePass",
						),
						certificates: {
							signerCert: SIGNER_CERT,
							signerKey: SIGNER_KEY,
							signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
							wwdr: WWDR,
						},
					}),
			).not.toThrow();
		});

		it("should silently filter out manifest and signature files", async () => {
			pkpass = await PKPass.from({
				model: path.resolve(__dirname, EXAMPLE_PATH_RELATIVE),
				certificates: {
					signerCert: SIGNER_CERT,
					signerKey: SIGNER_KEY,
					signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
					wwdr: WWDR,
				},
			});

			pkpass.addBuffer("manifest.json", Buffer.alloc(0));
			pkpass.addBuffer("signature", Buffer.alloc(0));

			expect(pkpass.files["manifest.json"]).toBeUndefined();
			expect(pkpass.files["signature"]).toBeUndefined();
		});

		it("should accept additional properties to be added to new buffer and ignore unknown props", async () => {
			const newPass = await PKPass.from(pkpass, {
				description: "mimmoh",
				serialNumber: "626621523738123",
				// @ts-expect-error
				insert_here_invalid_unknown_parameter_name: false,
			});

			expect(newPass.props.description).toBe("mimmoh");
			expect(newPass.props.serialNumber).toBe("626621523738123");
			expect(
				// @ts-expect-error
				newPass.props.insert_here_invalid_unknown_parameter_name,
			).toBeUndefined();

			const passjsonGenerated = getGeneratedPassJson(newPass);

			expect(passjsonGenerated.description).toBe("mimmoh");
			expect(passjsonGenerated.serialNumber).toBe("626621523738123");
			expect(
				passjsonGenerated.insert_here_invalid_unknown_parameter_name,
			).toBeUndefined();
		});
	});

	describe("PKPass.pack", () => {
		it("should should throw error if not all the files passed are PKPasses", () => {
			expect(
				// @ts-expect-error
				() => PKPass.pack(pkpass, "pass.json", pkpass),
			).toThrowError();
		});

		it("should output a frozen bundle of frozen bundles", () => {
			const pkPassesBundle = PKPass.pack(pkpass, pkpass);

			const buffers = pkPassesBundle.getAsRaw();

			expect(buffers["packed-pass-1.pkpass"]).toBeInstanceOf(Buffer);
			expect(buffers["packed-pass-2.pkpass"]).toBeInstanceOf(Buffer);
			expect(pkpass.isFrozen).toBe(true);
			expect(pkPassesBundle.isFrozen).toBe(true);
		});

		it("should output a bundle with pkpasses mimetype", () => {
			const pkPassesBundle = PKPass.pack(pkpass, pkpass);
			expect(pkPassesBundle.mimeType).toBe(
				"application/vnd.apple.pkpasses",
			);
		});
	});

	describe("eventTicket new layout", () => {
		it("should contain preferredStyleSchemes if coming from an imported pass json", () => {
			const passjson = modelFiles["pass.json"];
			const changedPassJson = Buffer.from(
				JSON.stringify(
					Object.assign({}, JSON.parse(passjson.toString("utf-8")), {
						preferredStyleSchemes: [
							"posterEventTicket",
							"eventTicket",
						],
						eventTicket: {},
					}),
				),
				"utf-8",
			);

			pkpass = new PKPass(
				Object.assign({}, modelFiles, { "pass.json": changedPassJson }),
				{
					signerCert: SIGNER_CERT,
					signerKey: SIGNER_KEY,
					wwdr: WWDR,
					signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
				},
			);

			expect(pkpass.preferredStyleSchemes).toEqual([
				"posterEventTicket",
				"eventTicket",
			]);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.preferredStyleSchemes).not.toBeUndefined();
			expect(passjsonGenerated.preferredStyleSchemes).toEqual([
				"posterEventTicket",
				"eventTicket",
			]);
		});

		it("should contain preferredStyleSchemes if coming from the setter (legacy order)", () => {
			pkpass.type = "eventTicket";

			pkpass.preferredStyleSchemes = ["eventTicket", "posterEventTicket"];

			expect(pkpass.preferredStyleSchemes).toEqual([
				"eventTicket",
				"posterEventTicket",
			]);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.preferredStyleSchemes).not.toBeUndefined();
			expect(passjsonGenerated.preferredStyleSchemes).toEqual([
				"eventTicket",
				"posterEventTicket",
			]);
		});

		it("should contain preferredStyleSchemes if coming from the setter (new order)", () => {
			pkpass.type = "eventTicket";

			pkpass.preferredStyleSchemes = ["posterEventTicket", "eventTicket"];

			expect(pkpass.preferredStyleSchemes).toEqual([
				"posterEventTicket",
				"eventTicket",
			]);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.preferredStyleSchemes).not.toBeUndefined();
			expect(passjsonGenerated.preferredStyleSchemes).toEqual([
				"posterEventTicket",
				"eventTicket",
			]);
		});
	});

	it("preferredStyleSchemes setter should throw if pass is not an eventTicket", () => {
		pkpass.type = "boardingPass";

		expect(() => {
			pkpass.preferredStyleSchemes = ["posterEventTicket", "eventTicket"];
		}).toThrowError();
	});

	it("preferredStyleSchemes getter should throw if pass is not an eventTicket", () => {
		pkpass.type = "boardingPass";

		expect(() => {
			pkpass.preferredStyleSchemes;
		}).toThrowError();
	});
});



---
File: /specs/utils.spec.mjs
---

import { describe, expect, it } from "@jest/globals";
import { processDate, removeHidden } from "../lib/esm/utils.js";

describe("Utils", () => {
	describe("removeHidden", () => {
		it("should remove files that start with dot", () => {
			const filesList = [
				"a.png",
				"b.png",
				".DS_Store",
				"not_the_droids_you_are_looking_for.txt",
			];

			expect(removeHidden(filesList)).toEqual([
				"a.png",
				"b.png",
				"not_the_droids_you_are_looking_for.txt",
			]);
		});
	});

	describe("processDate", () => {
		it("should throw Invalid date if args[0] is not a date", () => {
			//@ts-expect-error
			expect(() => processDate(5)).toThrow("Invalid date");
			//@ts-expect-error
			expect(() => processDate({})).toThrow("Invalid date");
			//@ts-expect-error
			expect(() => processDate("ciao")).toThrow("Invalid date");
			//@ts-expect-error
			expect(() => processDate(true)).toThrow("Invalid date");
		});

		it("should convert a Date object to a valid W3C date", () => {
			expect(processDate(new Date("2020-07-01T02:00+02:00"))).toBe(
				"2020-07-01T00:00:00.000Z",
			);
		});
	});
});



---
File: /src/schemas/Barcode.ts
---

import Joi from "joi";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/barcodes
 */

export type BarcodeFormat =
	| "PKBarcodeFormatQR"
	| "PKBarcodeFormatPDF417"
	| "PKBarcodeFormatAztec"
	| "PKBarcodeFormatCode128";

export interface Barcode {
	altText?: string;
	messageEncoding?: string;
	format: BarcodeFormat;
	message: string;
}

export const Barcode = Joi.object<Barcode>().keys({
	altText: Joi.string(),
	messageEncoding: Joi.string().default("iso-8859-1"),
	format: Joi.string()
		.required()
		.regex(
			/(PKBarcodeFormatQR|PKBarcodeFormatPDF417|PKBarcodeFormatAztec|PKBarcodeFormatCode128)/,
			"barcodeType",
		),
	message: Joi.string().required(),
});



---
File: /src/schemas/Beacon.ts
---

import Joi from "joi";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/beacons
 */

export interface Beacon {
	major?: number;
	minor?: number;
	relevantText?: string;
	proximityUUID: string;
}

export const Beacon = Joi.object<Beacon>().keys({
	major: Joi.number().integer().min(0).max(65535),
	minor: Joi.number().integer().min(0).max(65535),
	proximityUUID: Joi.string().required(),
	relevantText: Joi.string(),
});



---
File: /src/schemas/Certificates.ts
---

import { Buffer } from "node:buffer";
import Joi from "joi";

export interface CertificatesSchema {
	wwdr: string | Buffer;
	signerCert: string | Buffer;
	signerKey: string | Buffer;
	signerKeyPassphrase?: string;
}

/**
 * Joi.binary is not available in browser-like environments (like Cloudflare workers)
 * so we fallback to manual checking. Buffer must be polyfilled.
 */

const binary = Joi.binary
	? Joi.binary()
	: Joi.custom((obj) => Buffer.isBuffer(obj));

export const CertificatesSchema = Joi.object<CertificatesSchema>()
	.keys({
		wwdr: Joi.alternatives(binary, Joi.string()).required(),
		signerCert: Joi.alternatives(binary, Joi.string()).required(),
		signerKey: Joi.alternatives(binary, Joi.string()).required(),
		signerKeyPassphrase: Joi.string(),
	})
	.required();



---
File: /src/schemas/Field.ts
---

import Joi from "joi";
import { Semantics } from "./Semantics.js";

export type PKDataDetectorType =
	| "PKDataDetectorTypePhoneNumber"
	| "PKDataDetectorTypeLink"
	| "PKDataDetectorTypeAddress"
	| "PKDataDetectorTypeCalendarEvent";

export type PKTextAlignmentType =
	| "PKTextAlignmentLeft"
	| "PKTextAlignmentCenter"
	| "PKTextAlignmentRight"
	| "PKTextAlignmentNatural";

export type PKDateStyleType =
	| "PKDateStyleNone"
	| "PKDateStyleShort"
	| "PKDateStyleMedium"
	| "PKDateStyleLong"
	| "PKDateStyleFull";

export type PKNumberStyleType =
	| "PKNumberStyleDecimal"
	| "PKNumberStylePercent"
	| "PKNumberStyleScientific"
	| "PKNumberStyleSpellOut";

/**
 * @see https://developer.apple.com/documentation/walletpasses/passfieldcontent
 */

export interface Field {
	attributedValue?: string | number | Date;
	changeMessage?: string;
	dataDetectorTypes?: PKDataDetectorType[];
	label?: string;
	textAlignment?: PKTextAlignmentType;
	key: string;
	value: string | number | Date;
	semantics?: Semantics;
	dateStyle?: PKDateStyleType;
	ignoresTimeZone?: boolean;
	isRelative?: boolean;
	timeStyle?: PKDateStyleType;
	currencyCode?: string;
	numberStyle?: PKNumberStyleType;
}

export interface FieldWithRow extends Field {
	row?: 0 | 1;
}

export const Field = Joi.object<Field>().keys({
	attributedValue: Joi.alternatives(
		Joi.string().allow(""),
		Joi.number(),
		Joi.date().iso(),
	),
	changeMessage: Joi.string(),
	dataDetectorTypes: Joi.array().items(
		Joi.string().regex(
			/(PKDataDetectorTypePhoneNumber|PKDataDetectorTypeLink|PKDataDetectorTypeAddress|PKDataDetectorTypeCalendarEvent)/,
			"dataDetectorType",
		),
	),
	label: Joi.string().allow(""),
	textAlignment: Joi.string().regex(
		/(PKTextAlignmentLeft|PKTextAlignmentCenter|PKTextAlignmentRight|PKTextAlignmentNatural)/,
		"graphic-alignment",
	),
	key: Joi.string().required(),
	value: Joi.alternatives(
		Joi.string().allow(""),
		Joi.number(),
		Joi.date().iso(),
	).required(),
	semantics: Semantics,
	// date fields formatters, all optionals
	dateStyle: Joi.string().regex(
		/(PKDateStyleNone|PKDateStyleShort|PKDateStyleMedium|PKDateStyleLong|PKDateStyleFull)/,
		"date style",
	),
	ignoresTimeZone: Joi.boolean(),
	isRelative: Joi.boolean(),
	timeStyle: Joi.string().regex(
		/(PKDateStyleNone|PKDateStyleShort|PKDateStyleMedium|PKDateStyleLong|PKDateStyleFull)/,
		"date style",
	),
	// number fields formatters, all optionals
	currencyCode: Joi.string().when("value", {
		is: Joi.number(),
		otherwise: Joi.string().forbidden(),
	}),
	numberStyle: Joi.string()
		.regex(
			/(PKNumberStyleDecimal|PKNumberStylePercent|PKNumberStyleScientific|PKNumberStyleSpellOut)/,
		)
		.when("value", {
			is: Joi.number(),
			otherwise: Joi.string().forbidden(),
		}),
});

export const FieldWithRow = Field.concat(
	Joi.object<FieldWithRow>().keys({
		row: Joi.number().min(0).max(1),
	}),
);



---
File: /src/schemas/index.ts
---

export * from "./Barcode.js";
export * from "./Beacon.js";
export * from "./Location.js";
export * from "./Field.js";
export * from "./NFC.js";
export * from "./Semantics.js";
export * from "./PassFields.js";
export * from "./Personalize.js";
export * from "./Certificates.js";

import Joi from "joi";
import type { Buffer } from "node:buffer";

import { Barcode } from "./Barcode.js";
import { Location } from "./Location.js";
import { Beacon } from "./Beacon.js";
import { NFC } from "./NFC.js";
import { PassFields, TransitType } from "./PassFields.js";
import { Semantics } from "./Semantics.js";
import { CertificatesSchema } from "./Certificates.js";

import * as Messages from "../messages.js";
import { RGB_HEX_COLOR_REGEX, URL_REGEX } from "./regexps.js";

export type PreferredStyleSchemes = ("posterEventTicket" | "eventTicket")[];

export const PreferredStyleSchemes = Joi.array().items(
	"posterEventTicket",
	"eventTicket",
) satisfies Joi.Schema<PreferredStyleSchemes>;

/**
 * A single interval can span at most 24 hours
 */
export interface RelevancyInterval {
	startDate: string | Date;
	endDate: string | Date;
}

export interface RelevancyEntry {
	relevantDate: string | Date;
}

/**
 * @iOSVersion 18
 *
 * Using a RelevancyInterval, will trigger a live activity on
 * new event ticket passes.
 *
 * Using a RelevancyEntry, will match the behavior of the
 * currently deprecated property `relevantDate`.
 */

export type RelevantDate = RelevancyInterval | RelevancyEntry;

export const RelevantDate = Joi.alternatives(
	Joi.object<RelevancyInterval>().keys({
		startDate: Joi.alternatives(
			Joi.string().isoDate(),
			Joi.date().iso(),
		).required(),
		endDate: Joi.alternatives(
			Joi.string().isoDate(),
			Joi.date().iso(),
		).required(),
	}),
	Joi.object<RelevancyEntry>().keys({
		relevantDate: Joi.alternatives(
			Joi.string().isoDate(),
			Joi.date().iso(),
		).required(),
	}),
);

export interface FileBuffers {
	[key: string]: Buffer;
}

export interface PassProps {
	formatVersion?: 1;
	serialNumber?: string;
	description?: string;
	organizationName?: string;
	passTypeIdentifier?: string;
	teamIdentifier?: string;
	appLaunchURL?: string;
	voided?: boolean;
	userInfo?: { [key: string]: any };
	sharingProhibited?: boolean;
	groupingIdentifier?: string;
	suppressStripShine?: boolean;
	logoText?: string;
	maxDistance?: number;
	semantics?: Semantics;

	webServiceURL?: string;
	associatedStoreIdentifiers?: Array<number>;
	authenticationToken?: string;

	backgroundColor?: string;
	foregroundColor?: string;
	labelColor?: string;

	/**
	 * Undocumented feature:
	 * Color of primary fields value when
	 * rendered on top of a strip.
	 */
	stripColor?: string;

	nfc?: NFC;
	beacons?: Beacon[];
	barcodes?: Barcode[];

	/**
	 * @deprecated starting from iOS 18
	 * Use `relevantDates`
	 */
	relevantDate?: string;

	relevantDates?: RelevantDate[];

	expirationDate?: string;
	locations?: Location[];

	boardingPass?: PassFields & { transitType: TransitType };
	eventTicket?: PassFields;
	coupon?: PassFields;
	generic?: PassFields;
	storeCard?: PassFields;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	preferredStyleSchemes?: PreferredStyleSchemes;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain event guide" must be used.
	 */
	bagPolicyURL?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	orderFoodURL?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	parkingInformationURL?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	directionsInformationURL?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * URL to a resource to buy or access
	 * the parking spot.
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	purchaseParkingURL?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * URL to a resource to buy the
	 * merchandise.
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	merchandiseURL?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * URL to a resource about public or
	 * private transportation to reach the
	 * venue.
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	transitInformationURL?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * URL to a resource about accessibility
	 * in the events venue.
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	accessibilityURL?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * An URL to link experiences to the
	 * pass (upgrades and more).
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	addOnURL?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	contactVenueEmail?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	contactVenuePhoneNumber?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	contactVenueWebsite?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Menu dropdown
	 *
	 * @description
	 *
	 * Will add a button among options near "share"
	 */
	transferURL?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Menu dropdown
	 *
	 * @description
	 *
	 * Will add a button among options near "share"
	 */
	sellURL?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * Will remove an automatic shadow in the new
	 * event ticket layouts.
	 */
	suppressHeaderDarkening?: boolean;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * By default, the chin is colored with a
	 * blur. Through this option, it is possible
	 * to specify a different and specific color
	 * for it.
	 */
	footerBackgroundColor?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * Enables the automatic calculation of the
	 * `foregroundColor` and `labelColor` based
	 * on the background image in the new event
	 * ticket passes.
	 *
	 * If enabled, `foregroundColor` and `labelColor`
	 * are ignored.
	 */
	useAutomaticColor?: boolean;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * Applications AppStore Identifiers
	 * related to the event ticket.
	 *
	 * It is not mandatory for the app to
	 * be related to the pass issuer.
	 *
	 * Such applications won't be able to read
	 * the passes users has (probably differently
	 * by `associatedStoreIdentifiers`).
	 */
	auxiliaryStoreIdentifiers?: number[];
}

/**
 * These are the properties passkit-generator will
 * handle through its methods
 */

type PassMethodsProps =
	| "nfc"
	| "beacons"
	| "barcodes"
	| "relevantDate"
	| "relevantDates"
	| "expirationDate"
	| "locations"
	| "preferredStyleSchemes";

export type PassTypesProps =
	| "boardingPass"
	| "eventTicket"
	| "coupon"
	| "generic"
	| "storeCard";

export type OverridablePassProps = Omit<
	PassProps,
	PassMethodsProps | PassTypesProps
>;
export type PassPropsFromMethods = { [K in PassMethodsProps]: PassProps[K] };
export type PassKindsProps = { [K in PassTypesProps]: PassProps[K] };

export type PassColors = Pick<
	OverridablePassProps,
	"backgroundColor" | "foregroundColor" | "labelColor" | "stripColor"
>;

export const PassPropsFromMethods = Joi.object<PassPropsFromMethods>({
	nfc: NFC,
	beacons: Joi.array().items(Beacon),
	barcodes: Joi.array().items(Barcode),
	relevantDate: Joi.string().isoDate(),
	relevantDates: Joi.array().items(RelevantDate),
	expirationDate: Joi.string().isoDate(),
	locations: Joi.array().items(Location),
	preferredStyleSchemes: PreferredStyleSchemes,
});

export const PassKindsProps = Joi.object<PassKindsProps>({
	coupon: PassFields.disallow("transitType"),
	generic: PassFields.disallow("transitType"),
	storeCard: PassFields.disallow("transitType"),
	eventTicket: PassFields.disallow("transitType"),
	boardingPass: PassFields,
});

export const PassType = Joi.string().regex(
	/(boardingPass|coupon|eventTicket|storeCard|generic)/,
);

export const OverridablePassProps = Joi.object<OverridablePassProps>({
	formatVersion: Joi.number().default(1),
	semantics: Semantics,
	voided: Joi.boolean(),
	logoText: Joi.string(),
	description: Joi.string(),
	serialNumber: Joi.string(),
	appLaunchURL: Joi.string(),
	teamIdentifier: Joi.string(),
	organizationName: Joi.string(),
	passTypeIdentifier: Joi.string(),
	sharingProhibited: Joi.boolean(),
	groupingIdentifier: Joi.string(),
	suppressStripShine: Joi.boolean(),
	maxDistance: Joi.number().positive(),
	authenticationToken: Joi.string().min(16),
	labelColor: Joi.string().regex(RGB_HEX_COLOR_REGEX),
	stripColor: Joi.string().regex(RGB_HEX_COLOR_REGEX),
	backgroundColor: Joi.string().regex(RGB_HEX_COLOR_REGEX),
	foregroundColor: Joi.string().regex(RGB_HEX_COLOR_REGEX),
	associatedStoreIdentifiers: Joi.array().items(Joi.number()),
	userInfo: Joi.alternatives(Joi.object().unknown(), Joi.array()),
	webServiceURL: Joi.string().regex(URL_REGEX),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	bagPolicyURL: Joi.string().regex(URL_REGEX),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	orderFoodURL: Joi.string().regex(URL_REGEX),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	parkingInformationURL: Joi.string().regex(URL_REGEX),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	directionsInformationURL: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * URL to a resource to buy or access
	 * the parking spot.
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	purchaseParkingURL: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * URL to a resource to buy the
	 * merchandise.
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	merchandiseURL: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * URL to a resource about public or
	 * private transportation to reach the
	 * venue.
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	transitInformationURL: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * URL to a resource about accessibility
	 * in the events venue.
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	accessibilityURL: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * An URL to link experiences to the
	 * pass (upgrades and more).
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	addOnURL: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	contactVenueEmail: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	contactVenuePhoneNumber: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain Event Guide
	 *
	 * @description
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@passDomain Event Guide" must be used.
	 */
	contactVenueWebsite: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * Will add a button among options near "share"
	 */
	transferURL: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * Will add a button among options near "share"
	 */
	sellURL: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * Will remove an automatic shadow in the new
	 * event ticket layouts.
	 */
	suppressHeaderDarkening: Joi.boolean(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * By default, the chin is colored with a
	 * blur. Through this option, it is possible
	 * to specify a different and specific color
	 * for it.
	 */
	footerBackgroundColor: Joi.string().regex(RGB_HEX_COLOR_REGEX),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * Enables the automatic calculation of the
	 * `foregroundColor` and `labelColor` based
	 * on the background image in the new event
	 * ticket passes.
	 *
	 * If enabled, `foregroundColor` and `labelColor`
	 * are ignored.
	 */
	useAutomaticColor: Joi.boolean(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * Applications AppStore Identifiers
	 * related to the event ticket.
	 *
	 * It is not mandatory for the app to
	 * be related to the pass issuer.
	 *
	 * Such applications won't be able to read
	 * the passes users has (probably differently
	 * by `associatedStoreIdentifiers`).
	 */
	auxiliaryStoreIdentifiers: Joi.array().items(Joi.number()),
}).with("webServiceURL", "authenticationToken");

export const PassProps = Joi.object<
	OverridablePassProps & PassKindsProps & PassPropsFromMethods
>()
	.concat(OverridablePassProps)
	.concat(PassKindsProps)
	.concat(PassPropsFromMethods);

export interface Template {
	model: string;
	certificates?: CertificatesSchema;
}

export const Template = Joi.object<Template>({
	model: Joi.string().required(),
	certificates: Joi.object().required(),
});

// --------- UTILITIES ---------- //

/**
 * Performs validation of a schema on an object.
 * If it fails, will throw an error.
 *
 * @param schema
 * @param data
 */

export function assertValidity<T>(
	schema: Joi.Schema<T>,
	data: T,
	customErrorMessage?: string,
): void {
	const validation = schema.validate(data);

	if (validation.error) {
		if (customErrorMessage) {
			console.warn(validation.error);
			throw new TypeError(
				`${validation.error.name} happened. ${Messages.format(
					customErrorMessage,
					validation.error.message,
				)}`,
			);
		}

		throw new TypeError(validation.error.message);
	}
}

/**
 * Performs validation and throws the error if there's one.
 * Otherwise returns a (possibly patched) version of the specified
 * options (it depends on the schema)
 *
 * @param schema
 * @param options
 * @returns
 */

export function validate<T extends Object>(
	schema: Joi.Schema<T>,
	options: T,
): T {
	const validationResult = schema.validate(options, {
		stripUnknown: true,
		abortEarly: true,
	});

	if (validationResult.error) {
		throw validationResult.error;
	}

	return validationResult.value;
}

export function filterValid<T extends Object>(
	schema: Joi.ObjectSchema<T>,
	source: T[],
): T[] {
	if (!source) {
		return [];
	}

	return source.reduce<T[]>((acc, current) => {
		try {
			return [...acc, validate(schema, current)];
		} catch (err) {
			console.warn(Messages.format(Messages.FILTER_VALID.INVALID, err));
			return [...acc];
		}
	}, []);
}



---
File: /src/schemas/Location.ts
---

import Joi from "joi";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/locations
 */

export interface Location {
	relevantText?: string;
	altitude?: number;
	latitude: number;
	longitude: number;
}

export const Location = Joi.object<Location>().keys({
	altitude: Joi.number(),
	latitude: Joi.number().required(),
	longitude: Joi.number().required(),
	relevantText: Joi.string(),
});



---
File: /src/schemas/NFC.ts
---

import Joi from "joi";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/nfc
 */

export interface NFC {
	message: string;
	encryptionPublicKey: string;
	requiresAuthentication?: boolean;
}

export const NFC = Joi.object<NFC>().keys({
	message: Joi.string().required().max(64),
	encryptionPublicKey: Joi.string().required(),
	requiresAuthentication: Joi.boolean(),
});



---
File: /src/schemas/PassFields.ts
---

import Joi from "joi";
import { Field, FieldWithRow } from "./Field.js";

export type TransitType =
	| "PKTransitTypeAir"
	| "PKTransitTypeBoat"
	| "PKTransitTypeBus"
	| "PKTransitTypeGeneric"
	| "PKTransitTypeTrain";

export const TransitType = Joi.string().regex(
	/(PKTransitTypeAir|PKTransitTypeBoat|PKTransitTypeBus|PKTransitTypeGeneric|PKTransitTypeTrain)/,
);

export interface PassFields {
	auxiliaryFields: FieldWithRow[];
	backFields: Field[];
	headerFields: Field[];
	primaryFields: Field[];
	secondaryFields: Field[];
	transitType?: TransitType;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain dashboard
	 *
	 * @see \<undiclosed>
	 */
	additionalInfoFields?: Field[];
}

export const PassFields = Joi.object<PassFields>().keys({
	auxiliaryFields: Joi.array().items(FieldWithRow),
	backFields: Joi.array().items(Field),
	headerFields: Joi.array().items(Field),
	primaryFields: Joi.array().items(Field),
	secondaryFields: Joi.array().items(Field),
	transitType: TransitType,

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain dashboard
	 *
	 * @see \<undiclosed>
	 */
	additionalInfoFields: Joi.array().items(Field),
});



---
File: /src/schemas/Personalize.ts
---

import Joi from "joi";

/**
 * @see https://developer.apple.com/documentation/walletpasses/personalize
 */

type RequiredPersonalizationFields =
	| "PKPassPersonalizationFieldName"
	| "PKPassPersonalizationFieldPostalCode"
	| "PKPassPersonalizationFieldEmailAddress"
	| "PKPassPersonalizationFieldPhoneNumber";

export interface Personalize {
	description: string;
	requiredPersonalizationFields: RequiredPersonalizationFields[];
	termsAndConditions?: string;
}

export const Personalize = Joi.object<Personalize>().keys({
	description: Joi.string().required(),
	requiredPersonalizationFields: Joi.array()
		.items(
			"PKPassPersonalizationFieldName",
			"PKPassPersonalizationFieldPostalCode",
			"PKPassPersonalizationFieldEmailAddress",
			"PKPassPersonalizationFieldPhoneNumber",
		)
		.required(),
	termsAndConditions: Joi.string(),
});



---
File: /src/schemas/regexps.ts
---

export const RGB_HEX_COLOR_REGEX =
	/(?:\#[a-fA-F0-9]{3,6}|rgb\(\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*,\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*,\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*\))/;
export const URL_REGEX = /https?:\/\/(?:[a-z0-9]+\.?)+(?::\d{2,})?(?:\/[\S]+)*/;



---
File: /src/schemas/Semantics.ts
---

import Joi from "joi";
import * as SemanticTagType from "./SemanticTagType.js";

/**
 * For a better description of every single field,
 * please refer to Apple official documentation.
 *
 * @see https://developer.apple.com/documentation/walletpasses/semantictags
 */

/**
 * Alphabetical order
 * @see https://developer.apple.com/documentation/walletpasses/semantictags
 */

export interface Semantics {
	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	admissionLevel?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	admissionLevelAbbreviation?: string;

	airlineCode?: string;
	artistIDs?: string[];

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	albumIDs?: string[];

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	airplay?: {
		airPlayDeviceGroupToken: string;
	}[];

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	attendeeName?: string;

	awayTeamAbbreviation?: string;
	awayTeamLocation?: string;
	awayTeamName?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	additionalTicketAttributes?: string;

	balance?: SemanticTagType.CurrencyAmount;
	boardingGroup?: string;
	boardingSequenceNumber?: string;

	carNumber?: string;
	confirmationNumber?: string;
	currentArrivalDate?: string;
	currentBoardingDate?: string;
	currentDepartureDate?: string;

	departureAirportCode?: string;
	departureAirportName?: string;
	departureGate?: string;
	departureLocation?: SemanticTagType.Location;
	departureLocationDescription?: string;
	departurePlatform?: string;
	departureStationName?: string;
	departureTerminal?: string;
	destinationAirportCode?: string;
	destinationAirportName?: string;
	destinationGate?: string;
	destinationLocation?: SemanticTagType.Location;
	destinationLocationDescription?: string;
	destinationPlatform?: string;
	destinationStationName?: string;
	destinationTerminal?: string;
	duration?: number;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	entranceDescription?: string;

	eventEndDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * Shows a message in the live activity
	 * when the activity starts.
	 */
	eventLiveMessage?: string;

	eventName?: string;
	eventStartDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout).
	 *
	 * Can be used as an alternative way to
	 * show show start date, with more control
	 * on time and timeZone details and as
	 * a way to show the event guide, both
	 * instead of `eventStartDate`.
	 */
	eventStartDateInfo?: SemanticTagType.EventDateInfo;

	/**
	 * @iOSVersion < 18
	 * Since iOS 18, for the event tickets these determine
	 * the template to be used when rendering the pass.
	 *
	 * - Generic Template
	 * 		- "PKEventTypeGeneric"
	 * 		- "PKEventTypeMovie"
	 * 		- "PKEventTypeConference"
	 * 		- "PKEventTypeConvention"
	 * 		- "PKEventTypeWorkshop"
	 * 		- "PKEventTypeSocialGathering"
	 * - Sport Template
	 * 		- "PKEventTypeSports"
	 * - Live Performance Template
	 * 		- "PKEventTypeLivePerformance";
	 */

	eventType?:
		| "PKEventTypeGeneric"
		| "PKEventTypeMovie"
		| "PKEventTypeConference"
		| "PKEventTypeConvention"
		| "PKEventTypeWorkshop"
		| "PKEventTypeSocialGathering"
		| "PKEventTypeSports"
		| "PKEventTypeLivePerformance";

	flightCode?: string;
	flightNumber?: number;

	genre?: string;

	homeTeamAbbreviation?: string;
	homeTeamLocation?: string;
	homeTeamName?: string;
	leagueAbbreviation?: string;
	leagueName?: string;

	membershipProgramName?: string;
	membershipProgramNumber?: string;

	originalArrivalDate?: string;
	originalBoardingDate?: string;
	originalDepartureDate?: string;

	passengerName?: SemanticTagType.PersonNameComponents;
	performerNames?: string[];
	priorityStatus?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	playlistIDs?: string[];

	seats?: SemanticTagType.Seat[];
	securityScreening?: string;
	silenceRequested?: boolean;
	sportName?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	tailgatingAllowed?: boolean;

	totalPrice?: SemanticTagType.CurrencyAmount;
	transitProvider?: string;
	transitStatus?: string;
	transitStatusReason?: string;

	vehicleName?: string;
	vehicleNumber?: string;
	vehicleType?: string;

	venueEntrance?: string;
	venueLocation?: SemanticTagType.Location;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueGatesOpenDate?: string;

	venueName?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueParkingLotsOpenDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueBoxOfficeOpenDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueDoorsOpenDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueFanZoneOpenDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueOpenDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueCloseDate?: string;

	venuePhoneNumber?: string;
	venueRoom?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueRegionName?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntranceGate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntranceDoor?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntrancePortal?: string;

	wifiAccess?: SemanticTagType.WifiNetwork[];
}

export const Semantics = Joi.object<Semantics>().keys({
	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	admissionLevel: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	admissionLevelAbbreviation: Joi.string(),

	airlineCode: Joi.string(),
	artistIDs: Joi.array().items(Joi.string()),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	albumIDs: Joi.array().items(Joi.string()),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	airplay: Joi.array().items({
		airplayDeviceGroupToken: Joi.string(),
	}),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	attendeeName: Joi.string(),

	awayTeamAbbreviation: Joi.string(),
	awayTeamLocation: Joi.string(),
	awayTeamName: Joi.string(),

	additionalTicketAttributes: Joi.string(),

	balance: SemanticTagType.CurrencyAmount,
	boardingGroup: Joi.string(),
	boardingSequenceNumber: Joi.string(),

	carNumber: Joi.string(),
	confirmationNumber: Joi.string(),
	currentArrivalDate: Joi.string(),
	currentBoardingDate: Joi.string(),
	currentDepartureDate: Joi.string(),

	departureAirportCode: Joi.string(),
	departureAirportName: Joi.string(),
	departureGate: Joi.string(),
	departureLocation: SemanticTagType.Location,
	departureLocationDescription: Joi.string(),
	departurePlatform: Joi.string(),
	departureStationName: Joi.string(),
	departureTerminal: Joi.string(),
	destinationAirportCode: Joi.string(),
	destinationAirportName: Joi.string(),
	destinationGate: Joi.string(),
	destinationLocation: SemanticTagType.Location,
	destinationLocationDescription: Joi.string(),
	destinationPlatform: Joi.string(),
	destinationStationName: Joi.string(),
	destinationTerminal: Joi.string(),
	duration: Joi.number(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	entranceDescription: Joi.string(),

	eventEndDate: Joi.string(),
	eventName: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * Shows a message in the live activity
	 * when the activity starts.
	 */
	eventLiveMessage: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout).
	 *
	 * Can be used as an alternative way to
	 * show show start date, with more control
	 * on time and timeZone details and as
	 * a way to show the event guide, both
	 * instead of `eventStartDate`.
	 */
	eventStartDateInfo: SemanticTagType.EventDateInfo,

	eventStartDate: Joi.string(),
	eventType: Joi.string().regex(
		/(PKEventTypeGeneric|PKEventTypeLivePerformance|PKEventTypeMovie|PKEventTypeSports|PKEventTypeConference|PKEventTypeConvention|PKEventTypeWorkshop|PKEventTypeSocialGathering)/,
	),

	flightCode: Joi.string(),
	flightNumber: Joi.number(),

	genre: Joi.string(),

	homeTeamAbbreviation: Joi.string(),
	homeTeamLocation: Joi.string(),
	homeTeamName: Joi.string(),
	leagueAbbreviation: Joi.string(),
	leagueName: Joi.string(),

	membershipProgramName: Joi.string(),
	membershipProgramNumber: Joi.string(),

	originalArrivalDate: Joi.string(),
	originalBoardingDate: Joi.string(),
	originalDepartureDate: Joi.string(),

	passengerName: SemanticTagType.PersonNameComponents,
	performerNames: Joi.array().items(Joi.string()),
	priorityStatus: Joi.string(),

	playlistIDs: Joi.array().items(Joi.string()),

	seats: Joi.array().items(SemanticTagType.Seat),
	securityScreening: Joi.string(),
	silenceRequested: Joi.boolean(),
	sportName: Joi.string(),

	tailgatingAllowed: Joi.boolean(),

	totalPrice: SemanticTagType.CurrencyAmount,
	transitProvider: Joi.string(),
	transitStatus: Joi.string(),
	transitStatusReason: Joi.string(),

	vehicleName: Joi.string(),
	vehicleNumber: Joi.string(),
	vehicleType: Joi.string(),

	venueEntrance: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueGatesOpenDate: Joi.string(),

	venueLocation: SemanticTagType.Location,
	venueName: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueParkingLotsOpenDate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueBoxOfficeOpenDate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueDoorsOpenDate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueFanZoneOpenDate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueOpenDate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueCloseDate: Joi.string(),

	venuePhoneNumber: Joi.string(),
	venueRoom: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueRegionName: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntranceGate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntranceDoor: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntrancePortal: Joi.string(),

	wifiAccess: Joi.array().items(SemanticTagType.WifiNetwork),
});



---
File: /src/schemas/SemanticTagType.ts
---

import Joi from "joi";
import { RGB_HEX_COLOR_REGEX } from "./regexps.js";

/**
 * These couple of structures are organized alphabetically,
 * according to the order on the developer documentation.
 *
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype
 */

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/currencyamount-data.dictionary
 */
export interface CurrencyAmount {
	currencyCode?: string; // ISO 4217 currency code
	amount?: string;
}

export const CurrencyAmount = Joi.object<CurrencyAmount>().keys({
	currencyCode: Joi.string(),
	amount: Joi.string(),
});

/**
 * @iOSVersion 18
 * @passStyle eventTicket (new layout)
 *
 * @see \<undiclosed>
 */

export interface EventDateInfo {
	date: string;
	ignoreTimeComponents?: boolean;
	timeZone?: string;
}

export const EventDateInfo = Joi.object<EventDateInfo>().keys({
	date: Joi.string().isoDate().required(),
	ignoreTimeComponents: Joi.boolean(),
	timeZone: Joi.string(),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/location-data.dictionary
 */
export interface Location {
	latitude: number;
	longitude: number;
}

export const Location = Joi.object<Location>().keys({
	latitude: Joi.number().required(),
	longitude: Joi.number().required(),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/personnamecomponents-data.dictionary
 */
export interface PersonNameComponents {
	familyName?: string;
	givenName?: string;
	middleName?: string;
	namePrefix?: string;
	nameSuffix?: string;
	nickname?: string;
	phoneticRepresentation?: string;
}

export const PersonNameComponents = Joi.object<PersonNameComponents>().keys({
	givenName: Joi.string(),
	familyName: Joi.string(),
	middleName: Joi.string(),
	namePrefix: Joi.string(),
	nameSuffix: Joi.string(),
	nickname: Joi.string(),
	phoneticRepresentation: Joi.string(),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/seat-data.dictionary
 */
export interface Seat {
	seatSection?: string;
	seatRow?: string;
	seatNumber?: string;
	seatIdentifier?: string;
	seatType?: string;
	seatDescription?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	seatAisle?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	seatLevel?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	seatSectionColor?: string;
}

export const Seat = Joi.object<Seat>().keys({
	seatSection: Joi.string(),
	seatRow: Joi.string(),
	seatNumber: Joi.string(),
	seatIdentifier: Joi.string(),
	seatType: Joi.string(),
	seatDescription: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	seatAisle: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	seatLevel: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	seatSectionColor: Joi.string().regex(RGB_HEX_COLOR_REGEX),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/wifinetwork-data.dictionary
 */
export interface WifiNetwork {
	password: string;
	ssid: string;
}

export const WifiNetwork = Joi.object<WifiNetwork>().keys({
	password: Joi.string().required(),
	ssid: Joi.string().required(),
});



---
File: /src/Bundle.ts
---

import { Readable, Stream } from "node:stream";
import { Buffer } from "node:buffer";
import { toArray as zipToArray } from "do-not-zip";
import * as Messages from "./messages.js";

export const filesSymbol = Symbol("bundleFiles");
export const freezeSymbol = Symbol("bundleFreeze");
export const mimeTypeSymbol = Symbol("bundleMimeType");

namespace Mime {
	export type type = string;
	export type subtype = string;
}

/**
 * Defines a container ready to be distributed.
 * If no mimeType is passed to the constructor,
 * it will throw an error.
 */

export default class Bundle {
	private [filesSymbol]: { [key: string]: Buffer } = {};
	private [mimeTypeSymbol]: string;

	public constructor(mimeType: `${Mime.type}/${Mime.subtype}`) {
		if (!mimeType) {
			throw new Error(Messages.BUNDLE.MIME_TYPE_MISSING);
		}

		this[mimeTypeSymbol] = mimeType;
	}

	/**
	 * Creates a bundle and exposes the
	 * function to freeze it manually once
	 * completed.
	 *
	 * This was made to not expose freeze
	 * function outside of Bundle class.
	 *
	 * Normally, a bundle would get freezed
	 * when using getAsBuffer or getAsStream
	 * but when creating a PKPasses archive,
	 * we need to freeze the bundle so the
	 * user cannot add more files (we want to
	 * allow them to only the selected files)
	 * but also letting them choose how to
	 * export it.
	 *
	 * @param mimeType
	 * @returns
	 */

	public static freezable(
		mimeType: `${Mime.type}/${Mime.subtype}`,
	): [Bundle, Function] {
		const bundle = new Bundle(mimeType);
		return [bundle, () => bundle[freezeSymbol]()];
	}

	/**
	 * Retrieves bundle's mimeType
	 */

	public get mimeType() {
		return this[mimeTypeSymbol];
	}

	/**
	 * Freezes the bundle so no more files
	 * can be added any further.
	 */

	private [freezeSymbol]() {
		if (this.isFrozen) {
			return;
		}

		Object.freeze(this[filesSymbol]);
	}

	/**
	 * Tells if this bundle still allows files to be added.
	 * @returns false if files are allowed, true otherwise
	 */

	public get isFrozen() {
		return Object.isFrozen(this[filesSymbol]);
	}

	/**
	 * Returns a copy of the current list of buffers
	 * that have been added to the class.
	 *
	 * It does not include translation files, manifest
	 * and signature.
	 *
	 * Final files list might differ due to export
	 * conditions.
	 */

	public get files() {
		return Object.keys(this[filesSymbol]);
	}

	/**
	 * Allows files to be added to the bundle.
	 * If the bundle is closed, it will throw an error.
	 *
	 * @param fileName
	 * @param buffer
	 */

	public addBuffer(fileName: string, buffer: Buffer) {
		if (this.isFrozen) {
			throw new Error(Messages.BUNDLE.CLOSED);
		}

		this[filesSymbol][fileName] = buffer;
	}

	/**
	 * Closes the bundle and returns it as a Buffer.
	 * Once closed, the bundle does not allow files
	 * to be added any further.
	 *
	 * @returns Buffer
	 */

	public getAsBuffer(): Buffer {
		this[freezeSymbol]();
		return Buffer.from(zipToArray(createZipFilesMap(this[filesSymbol])));
	}

	/**
	 * Closes the bundle and returns it as a stream.
	 * Once closed, the bundle does not allow files
	 * to be added any further.
	 *
	 * @returns
	 */

	public getAsStream(): Stream {
		this[freezeSymbol]();
		return Readable.from(
			Buffer.from(zipToArray(createZipFilesMap(this[filesSymbol]))),
		);
	}

	/**
	 * Closes the bundle and returns it as an object.
	 * This allows developers to choose a different way
	 * of serving, analyzing or zipping the file, outside the
	 * default compression system.
	 *
	 * @returns a frozen object containing files paths as key
	 * 		and Buffers as content.
	 */

	public getAsRaw(): { [filePath: string]: Buffer } {
		this[freezeSymbol]();
		return Object.freeze({ ...this[filesSymbol] });
	}
}

/**
 * Creates a files map for do-not-zip
 *
 * @param files
 * @returns
 */

function createZipFilesMap(files: { [key: string]: Buffer }) {
	return Object.entries(files).map(([path, data]) => ({
		path,
		data,
	}));
}



---
File: /src/FieldsArray.ts
---

import type PKPass from "./PKPass.js";
import * as Schemas from "./schemas/index.js";
import * as Utils from "./utils.js";
import * as Messages from "./messages.js";

/**
 * Class to represent lower-level keys pass fields
 * @see https://apple.co/2wkUBdh
 */

const passInstanceSymbol = Symbol("passInstance");
const sharedKeysPoolSymbol = Symbol("keysPool");
const fieldSchemaSymbol = Symbol("fieldSchema");

export default class FieldsArray extends Array<Schemas.Field> {
	private [passInstanceSymbol]: InstanceType<typeof PKPass>;
	private [sharedKeysPoolSymbol]: Set<string>;

	constructor(
		passInstance: InstanceType<typeof PKPass>,
		keysPool: Set<string>,
		fieldSchema: typeof Schemas.Field | typeof Schemas.FieldWithRow,
		...args: Schemas.Field[]
	) {
		super(...args);
		this[fieldSchemaSymbol] = fieldSchema;
		this[passInstanceSymbol] = passInstance;
		this[sharedKeysPoolSymbol] = keysPool;
	}

	push(...items: Schemas.Field[]): number {
		const validItems = registerWithValidation(this, ...items);
		return super.push(...validItems);
	}

	pop(): Schemas.Field {
		return unregisterItems(this, () => super.pop());
	}

	splice(
		start: number,
		deleteCount: number,
		...items: Schemas.Field[]
	): Schemas.Field[] {
		// Perfoming frozen check, validation and getting valid items
		const validItems = registerWithValidation(this, ...items);

		for (let i = start; i < start + deleteCount; i++) {
			this[sharedKeysPoolSymbol].delete(this[i].key);
		}

		return super.splice(start, deleteCount, ...validItems);
	}

	shift() {
		return unregisterItems(this, () => super.shift());
	}

	unshift(...items: Schemas.Field[]) {
		const validItems = registerWithValidation(this, ...items);
		return super.unshift(...validItems);
	}
}

function registerWithValidation(
	instance: InstanceType<typeof FieldsArray>,
	...items: Schemas.Field[]
) {
	Utils.assertUnfrozen(instance[passInstanceSymbol]);

	let validItems: Schemas.Field[] = [];

	for (const field of items) {
		if (!field) {
			console.warn(Messages.format(Messages.FIELDS.INVALID, field));
			continue;
		}

		try {
			Schemas.assertValidity(
				instance[fieldSchemaSymbol],
				field,
				Messages.FIELDS.INVALID,
			);

			if (instance[sharedKeysPoolSymbol].has(field.key)) {
				throw new TypeError(
					Messages.format(Messages.FIELDS.REPEATED_KEY, field.key),
				);
			}

			instance[sharedKeysPoolSymbol].add(field.key);
			validItems.push(field);
		} catch (err) {
			if (err instanceof Error) {
				console.warn(err.message ? err.message : err);
			} else {
				console.warn(err);
			}
		}
	}

	return validItems;
}

function unregisterItems(
	instance: InstanceType<typeof FieldsArray>,
	removeFn: Function,
) {
	Utils.assertUnfrozen(instance[passInstanceSymbol]);

	const element: Schemas.Field = removeFn();
	instance[sharedKeysPoolSymbol].delete(element.key);
	return element;
}



---
File: /src/getModelFolderContents.ts
---

import * as path from "node:path";
import { promises as fs } from "node:fs";
import type { Buffer } from "node:buffer";
import * as Utils from "./utils.js";
import * as Messages from "./messages.js";

/**
 * Reads the model folder contents
 *
 * @param model
 * @returns A promise of an object containing all
 * 		filePaths and the relative buffer
 */

export default async function getModelFolderContents(
	model: string,
): Promise<{ [filePath: string]: Buffer }> {
	try {
		const modelPath = `${model}${(!path.extname(model) && ".pass") || ""}`;
		const modelFilesList = await fs.readdir(modelPath);

		// No dot-starting files, manifest and signature and only files with an extension
		const modelSuitableRootPaths = Utils.removeHidden(
			modelFilesList,
		).filter(
			(f) =>
				!/(manifest|signature)/i.test(f) &&
				/.+$/.test(path.parse(f).ext),
		);

		const modelRecords = await Promise.all(
			modelSuitableRootPaths.map((fileOrDirectoryPath) =>
				readFileOrDirectory(
					path.resolve(modelPath, fileOrDirectoryPath),
				),
			),
		);

		return Object.fromEntries(modelRecords.flat(1));
	} catch (err) {
		if (!isErrorErrNoException(err) || !isMissingFileError(err)) {
			throw err;
		}

		if (isFileReadingFailure(err)) {
			throw new Error(
				Messages.format(
					Messages.MODELS.FILE_NO_OPEN,
					JSON.stringify(err),
				),
			);
		}

		if (isDirectoryReadingFailure(err)) {
			throw new Error(
				Messages.format(Messages.MODELS.DIR_NOT_FOUND, err.path),
			);
		}

		throw err;
	}
}

function isErrorErrNoException(err: unknown): err is NodeJS.ErrnoException {
	return Object.prototype.hasOwnProperty.call(err, "errno");
}

function isMissingFileError(
	err: unknown,
): err is NodeJS.ErrnoException & { code: "ENOENT" } {
	return (err as NodeJS.ErrnoException).code === "ENOENT";
}

function isDirectoryReadingFailure(
	err: NodeJS.ErrnoException,
): err is NodeJS.ErrnoException & { syscall: "scandir" } {
	return err.syscall === "scandir";
}

function isFileReadingFailure(
	err: NodeJS.ErrnoException,
): err is NodeJS.ErrnoException & { syscall: "open" } {
	return err.syscall === "open";
}

/**
 * Allows reading both a whole directory or a set of
 * file in the same flow
 *
 * @param filePath
 * @returns
 */

async function readFileOrDirectory(
	filePath: string,
): Promise<[key: string, content: Buffer][]> {
	const stats = await fs.lstat(filePath);

	if (stats.isDirectory()) {
		return readFilesInDirectory(filePath);
	} else {
		return getFileContents(filePath).then((result) => [result]);
	}
}

/**
 * Reads a directory and returns all
 * the files in it
 *
 * @param filePath
 * @returns
 */

async function readFilesInDirectory(
	filePath: string,
): Promise<Awaited<ReturnType<typeof getFileContents>>[]> {
	const dirContent = await fs.readdir(filePath).then(Utils.removeHidden);

	return Promise.all(
		dirContent.map((fileName) =>
			getFileContents(path.resolve(filePath, fileName), 2),
		),
	);
}

/**
 * @param filePath
 * @param pathSlicesDepthFromEnd used to preserve localization lproj content
 * @returns
 */

async function getFileContents(
	filePath: string,
	pathSlicesDepthFromEnd: number = 1,
): Promise<[key: string, content: Buffer]> {
	const fileComponents = filePath.split(path.sep);
	const fileName = fileComponents
		.slice(fileComponents.length - pathSlicesDepthFromEnd)
		.join("/");

	const content = await fs.readFile(filePath);

	return [fileName, content];
}



---
File: /src/index.ts
---

export { default as PKPass } from "./PKPass.js";

// ***************************************** //
// *** Exporting only schemas interfaces *** //
// ***************************************** //

export type {
	Barcode,
	Beacon,
	Field,
	Location,
	NFC,
	PassProps,
	Semantics,
	TransitType,
	Personalize,
	OverridablePassProps,
} from "./schemas/index.js";



---
File: /src/messages.ts
---

export const INIT = {
	INVALID_BUFFERS:
		"Cannot set buffers in constructor: expected object but received %s",
} as const;

export const CERTIFICATES = {
	INVALID:
		"Invalid certificate(s) loaded. %s. Please provide valid WWDR certificates and developer signer certificate and key (with passphrase).\nRefer to docs to obtain them",
} as const;

export const TRANSIT_TYPE = {
	UNEXPECTED_PASS_TYPE:
		"Cannot set transitType on a pass with type different from boardingPass.",
	INVALID:
		"Cannot set transitType because not compliant with Apple specifications. Refer to https://apple.co/3DHuAG4 for more - %s",
} as const;

export const PREFERRED_STYLE_SCHEMES = {
	UNEXPECTED_PASS_TYPE_SET:
		"Cannot set preferredStyleSchemes on a pass with type different from eventTicket.",
	UNEXPECTED_PASS_TYPE_GET:
		"Cannot get preferredStyleSchemes on a pass with type different from eventTicket.",
	INVALID:
		"Cannot set preferredStyleSchemes because not compliant with Apple specifications - %s",
} as const;

export const PASS_TYPE = {
	INVALID:
		"Cannot set type because not compliant with Apple specifications. Refer to https://apple.co/3aFpSfg for a list of valid props - %s",
} as const;

export const TEMPLATE = {
	INVALID: "Cannot create pass from a template. %s",
} as const;

export const FILTER_VALID = {
	INVALID: "Cannot validate property. %s",
} as const;

export const FIELDS = {
	INVALID: "Cannot add field. %s",
	REPEATED_KEY:
		"Cannot add field with key '%s': another field already owns this key. Ignored.",
} as const;

export const RELEVANT_DATE = {
	INVALID: "Cannot set relevant date. Date format is invalid",
} as const;

export const DATE = {
	INVALID: "Cannot set %s. Invalid date %s",
} as const;

export const LANGUAGES = {
	INVALID_LANG:
		"Cannot set localization. Expected a string for 'lang' but received %s",
	NO_TRANSLATIONS:
		"Cannot create or use language %s. If your itention was to just add a language (.lproj) folder to the bundle, both specify some translations or use .addBuffer to add some media.",
} as const;

export const BARCODES = {
	INVALID_POST: "",
} as const;

export const PASS_SOURCE = {
	INVALID: "Cannot add pass.json to bundle because it is invalid. %s",
	UNKNOWN_TYPE:
		"Cannot find a valid type in pass.json. You won't be able to set fields until you won't set explicitly one.",
	JOIN: "The imported pass.json's properties will be joined with the current setted props. You might lose some data.",
} as const;

export const PERSONALIZE = {
	INVALID:
		"Cannot add personalization.json to bundle because it is invalid. %s",
} as const;

export const JSON = {
	INVALID: "Cannot parse JSON. Invalid file",
} as const;

export const CLOSE = {
	MISSING_TYPE: "Cannot proceed creating the pass because type is missing.",
	MISSING_ICON:
		"At least one icon file is missing in your bundle. Your pass won't be openable by any Apple Device.",
	PERSONALIZATION_REMOVED:
		"Personalization file '%s' have been removed from the bundle as the requirements for personalization are not met.",
	MISSING_TRANSIT_TYPE:
		"Cannot proceed creating the pass because transitType is missing on your boardingPass.",
} as const;

export const MODELS = {
	DIR_NOT_FOUND: "Cannot import model: directory %s not found.",
	FILE_NO_OPEN: "Cannot open model file. %s",
} as const;

export const BUNDLE = {
	MIME_TYPE_MISSING: "Cannot build Bundle. MimeType is missing",
	CLOSED: "Cannot add file or set property. Bundle is closed.",
} as const;

export const FROM = {
	MISSING_SOURCE: "Cannot create PKPass from source: source is '%s'",
} as const;

export const PACK = {
	INVALID: "Cannot pack passes. Only PKPass instances allowed",
} as const;

/**
 * Creates a message with replaced values
 * @param messageName
 * @param values
 */

export function format(messageName: string, ...values: any[]) {
	// reversing because it is better popping than shifting.
	const replaceValues = values.reverse();
	return messageName.replace(/%s/g, () => replaceValues.pop());
}



---
File: /src/PKPass.ts
---

import { Stream } from "node:stream";
import { Buffer } from "node:buffer";
import path from "node:path";
import FieldsArray from "./FieldsArray.js";
import Bundle, { filesSymbol } from "./Bundle.js";
import getModelFolderContents from "./getModelFolderContents.js";
import * as Schemas from "./schemas/index.js";
import * as Signature from "./Signature.js";
import * as Strings from "./StringsUtils.js";
import * as Utils from "./utils.js";
import * as Messages from "./messages.js";

const propsSymbol = Symbol("props");
const localizationSymbol = Symbol("pass.l10n");
const importMetadataSymbol = Symbol("import.pass.metadata");
const createManifestSymbol = Symbol("pass.manifest");
const closePassSymbol = Symbol("pass.close");
const passTypeSymbol = Symbol("pass.type");
const certificatesSymbol = Symbol("pass.certificates");

const RegExps = {
	PASS_JSON: /pass\.json/,
	MANIFEST_OR_SIGNATURE: /manifest|signature/,
	PERSONALIZATION: {
		JSON: /personalization\.json/,
		LOGO: /personalizationLogo@(?:.{2})/,
	} as const,
	PASS_STRINGS: /(?<lang>[a-zA-Z-]{2,}).lproj\/pass\.strings/,
	PASS_ICON: /icon(?:@\d{1}x)?/,
} as const;

export default class PKPass extends Bundle {
	private [certificatesSymbol]: Schemas.CertificatesSchema;
	private [propsSymbol]: Schemas.PassProps = {};
	private [localizationSymbol]: {
		[lang: string]: {
			[placeholder: string]: string;
		};
	} = {};
	private [passTypeSymbol]: Schemas.PassTypesProps | undefined = undefined;

	/**
	 * Either create a pass from another one
	 * or a disk path.
	 *
	 * @param source
	 * @returns
	 */

	public static async from<S extends PKPass | Schemas.Template>(
		source: S,
		props?: Schemas.OverridablePassProps,
	): Promise<PKPass> {
		let certificates: Schemas.CertificatesSchema | undefined = undefined;
		let buffers: Schemas.FileBuffers | undefined = undefined;

		if (!source) {
			throw new TypeError(
				Messages.format(Messages.FROM.MISSING_SOURCE, source),
			);
		}

		if (source instanceof PKPass) {
			/** Cloning is happening here */
			certificates = source[certificatesSymbol];
			buffers = {};

			const buffersEntries = Object.entries(source[filesSymbol]);

			/** Cloning all the buffers to prevent unwanted edits */
			for (let i = 0; i < buffersEntries.length; i++) {
				const [fileName, contentBuffer] = buffersEntries[i];

				buffers[fileName] = Buffer.alloc(contentBuffer.length);
				contentBuffer.copy(buffers[fileName]);
			}

			/**
			 * Moving props to pass.json instead of overrides
			 * because many might get excluded when passing
			 * through validation
			 */

			buffers["pass.json"] = Buffer.from(
				JSON.stringify(source[propsSymbol]),
			);
		} else {
			Schemas.assertValidity(
				Schemas.Template,
				source,
				Messages.TEMPLATE.INVALID,
			);

			buffers = await getModelFolderContents(source.model);
			certificates = source.certificates;
		}

		return new PKPass(buffers, certificates, props);
	}

	/**
	 * Creates a Bundle made of PKPass to be distributed
	 * as a `.pkpasses` zip file. Returns a Bundle instance
	 * so it can be outputted both as stream or as a buffer.
	 *
	 * Using this will freeze all the instances passed as
	 * parameter.
	 *
	 * Throws if not all the files are instance of PKPass.
	 *
	 * @param passes
	 */

	public static pack(...passes: PKPass[]): Bundle {
		const [bundle, freezeBundle] = Bundle.freezable(
			"application/vnd.apple.pkpasses",
		);

		for (let i = 0; i < passes.length; i++) {
			const pass = passes[i];

			if (!(pass instanceof PKPass)) {
				throw new Error(Messages.PACK.INVALID);
			}

			bundle.addBuffer(`packed-pass-${i + 1}.pkpass`, pass.getAsBuffer());
		}

		freezeBundle();

		return bundle;
	}

	// **************** //
	// *** INSTANCE *** //
	// **************** //

	public constructor(
		buffers?: Schemas.FileBuffers,
		certificates?: Schemas.CertificatesSchema,
		props?: Schemas.OverridablePassProps,
	) {
		super("application/vnd.apple.pkpass");

		if (buffers && typeof buffers === "object") {
			const buffersEntries = Object.entries(buffers);

			for (
				let i = buffersEntries.length, buffer: [string, Buffer];
				(buffer = buffersEntries[--i]);

			) {
				const [fileName, contentBuffer] = buffer;
				this.addBuffer(fileName, contentBuffer);
			}
		} else {
			console.warn(
				Messages.format(Messages.INIT.INVALID_BUFFERS, typeof buffers),
			);
		}

		if (props) {
			/** Overrides validation and pushing in props */
			const overridesValidation = Schemas.validate(
				Schemas.OverridablePassProps,
				props,
			);

			Object.assign(this[propsSymbol], overridesValidation);
		}

		if (certificates) {
			this.certificates = certificates;
		}
	}

	/**
	 * Allows changing the certificates, if needed.
	 * They are actually expected to be received in
	 * the constructor, but they can get overridden
	 * here for whatever purpose.
	 *
	 * When using this setter, all certificates are
	 * expected to be received, or an exception will
	 * be thrown.
	 *
	 * @param certs
	 */

	public set certificates(certs: Schemas.CertificatesSchema) {
		Utils.assertUnfrozen(this);

		Schemas.assertValidity(
			Schemas.CertificatesSchema,
			certs,
			Messages.CERTIFICATES.INVALID,
		);

		this[certificatesSymbol] = certs;
	}

	/**
	 * Allows retrieving current languages
	 */

	public get languages() {
		return Object.keys(this[localizationSymbol]);
	}

	/**
	 * Allows getting an image of the props
	 * that are composing your pass instance.
	 */

	public get props(): Schemas.PassProps {
		return Utils.cloneRecursive(this[propsSymbol]);
	}

	/**
	 * Allows accessing to iOS 18 new Event Ticket
	 * property `preferredStyleSchemes`.
	 *
	 * @throws if current type is not "eventTicket".
	 */

	public get preferredStyleSchemes(): Schemas.PreferredStyleSchemes {
		if (this.type !== "eventTicket") {
			throw new TypeError(
				Messages.PREFERRED_STYLE_SCHEMES.UNEXPECTED_PASS_TYPE_GET,
			);
		}

		return this[propsSymbol].preferredStyleSchemes;
	}

	/**
	 * Allows setting a preferredStyleSchemes property
	 * for a eventTicket.
	 *
	 * @throws if current type is not "eventTicket".
	 * @param value
	 */

	public set preferredStyleSchemes(value: Schemas.PreferredStyleSchemes) {
		Utils.assertUnfrozen(this);

		if (this.type !== "eventTicket") {
			throw new TypeError(
				Messages.PREFERRED_STYLE_SCHEMES.UNEXPECTED_PASS_TYPE_SET,
			);
		}

		Schemas.assertValidity(
			Schemas.PreferredStyleSchemes,
			value,
			Messages.PREFERRED_STYLE_SCHEMES.INVALID,
		);

		this[propsSymbol].preferredStyleSchemes = value;
	}

	/**
	 * Allows setting a transitType property
	 * for a boardingPass.
	 *
	 * @throws if current type is not "boardingPass".
	 * @param value
	 */

	public set transitType(value: Schemas.TransitType) {
		Utils.assertUnfrozen(this);

		if (this.type !== "boardingPass") {
			throw new TypeError(Messages.TRANSIT_TYPE.UNEXPECTED_PASS_TYPE);
		}

		Schemas.assertValidity(
			Schemas.TransitType,
			value,
			Messages.TRANSIT_TYPE.INVALID,
		);

		this[propsSymbol]["boardingPass"].transitType = value;
	}

	/**
	 * Allows getting the current transitType
	 * from pass props.
	 *
	 * @throws (automatically) if current type is not "boardingPass".
	 */

	public get transitType() {
		return this[propsSymbol]["boardingPass"].transitType;
	}

	/**
	 * Allows accessing to primaryFields object.
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 * 		instance has not a valid type set yet.
	 */

	public get primaryFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].primaryFields;
	}

	/**
	 * Allows accessing to secondaryFields object
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 * 		instance has not a valid type set yet.
	 */

	public get secondaryFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].secondaryFields;
	}

	/**
	 * Allows accessing to auxiliaryFields object
	 *
	 * For Typescript users: this signature allows
	 * in any case to add the 'row' field, but on
	 * runtime they are only allowed on "eventTicket"
	 * passes.
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 * 		instance has not a valid type set yet.
	 */

	public get auxiliaryFields(): Schemas.FieldWithRow[] {
		return this[propsSymbol][this.type].auxiliaryFields;
	}

	/**
	 * Allows accessing to headerFields object
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 * 		instance has not a valid type set yet.
	 */

	public get headerFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].headerFields;
	}

	/**
	 * Allows accessing to backFields object
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 * 		instance has not a valid type set yet.
	 */

	public get backFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].backFields;
	}

	/**
	 * Allows accessing to new iOS 18
	 * event ticket additional fields
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 *		type is not "eventTicket".
	 */

	public get additionalInfoFields(): Schemas.Field[] {
		return this[propsSymbol]["eventTicket"].additionalInfoFields;
	}

	/**
	 * Allows setting a pass type.
	 *
	 * **Warning**: setting a type with this setter,
	 * will reset all the fields (primaryFields,
	 * secondaryFields, headerFields, auxiliaryFields, backFields),
	 * both imported or manually set.
	 */

	public set type(nextType: Schemas.PassTypesProps | undefined) {
		Utils.assertUnfrozen(this);

		Schemas.assertValidity(
			Schemas.PassType,
			nextType,
			Messages.PASS_TYPE.INVALID,
		);

		/** Shut up, typescript strict mode! */
		const type = nextType as Schemas.PassTypesProps;

		if (this.type) {
			/**
			 * Removing reference to previous type and its content because
			 * we might have some differences between types. It is way easier
			 * to reset everything instead of making checks.
			 */

			this[propsSymbol][this.type] = undefined;
			this[propsSymbol].preferredStyleSchemes = undefined;
		}

		const sharedKeysPool = new Set<string>();

		this[passTypeSymbol] = type;
		this[propsSymbol][type] = {
			headerFields /******/: new FieldsArray(
				this,
				sharedKeysPool,
				Schemas.Field,
			),
			primaryFields /*****/: new FieldsArray(
				this,
				sharedKeysPool,
				Schemas.Field,
			),
			secondaryFields /***/: new FieldsArray(
				this,
				sharedKeysPool,
				Schemas.Field,
			),
			auxiliaryFields /***/: new FieldsArray(
				this,
				sharedKeysPool,
				type === "eventTicket" ? Schemas.FieldWithRow : Schemas.Field,
			),
			backFields /********/: new FieldsArray(
				this,
				sharedKeysPool,
				Schemas.Field,
			),
			additionalInfoFields: new FieldsArray(
				this,
				sharedKeysPool,
				Schemas.Field,
			),
			transitType: undefined,
		};
	}

	public get type(): Schemas.PassTypesProps | undefined {
		return this[passTypeSymbol] ?? undefined;
	}

	// **************************** //
	// *** ASSETS SETUP METHODS *** //
	// **************************** //

	/**
	 * Allows adding a new asset inside the pass / bundle with
	 * the following exceptions:
	 *
	 * - Empty buffers are ignored;
	 * - `manifest.json` and `signature` files will be ignored;
	 * - `pass.json` will be read validated and merged in the
	 * 	current instance, if it wasn't added previously.
	 * 	It's properties will overwrite the instance ones.
	 * 	You might loose data;
	 * - `pass.strings` files will be read, parsed and merged
	 * 	with the current translations. Comments will be ignored;
	 * - `personalization.json` will be read, validated and added.
	 * 	They will be stripped out when exporting the pass if
	 * 	it won't have NFC details or if any of the personalization
	 * 	files is missing;
	 *
	 * @param pathName
	 * @param buffer
	 */

	public addBuffer(pathName: string, buffer: Buffer): void {
		if (!buffer?.length) {
			return;
		}

		if (RegExps.MANIFEST_OR_SIGNATURE.test(pathName)) {
			return;
		}

		if (RegExps.PASS_JSON.test(pathName)) {
			if (this[filesSymbol]["pass.json"]) {
				/**
				 * Ignoring any further addition. In a
				 * future we might consider merging instead
				 */
				return;
			}

			try {
				this[importMetadataSymbol](
					validateJSONBuffer(buffer, Schemas.PassProps),
				);
			} catch (err) {
				console.warn(
					Messages.format(Messages.PASS_SOURCE.INVALID, err),
				);
				return;
			}

			/**
			 * Adding an empty buffer just for reference
			 * that we received a valid pass.json file.
			 * It will be reconciliated in export phase.
			 */

			return super.addBuffer(pathName, Buffer.alloc(0));
		}

		if (RegExps.PERSONALIZATION.JSON.test(pathName)) {
			/**
			 * We are still allowing `personalizationLogo@XX.png`
			 * to be added to the bundle, but we'll delete it
			 * once the pass is getting closed, if needed.
			 */

			try {
				validateJSONBuffer(buffer, Schemas.Personalize);
			} catch (err) {
				console.warn(
					Messages.format(Messages.PERSONALIZE.INVALID, err),
				);
				return;
			}

			return super.addBuffer(pathName, buffer);
		}

		/**
		 * Converting Windows path to Unix path
		 * @example de.lproj\\icon.png => de.lproj/icon.png
		 */

		const normalizedPathName = pathName.replace(path.sep, "/");

		/**
		 * If a new pass.strings file is added, we want to
		 * prevent it from being merged and, instead, save
		 * its translations for later
		 */

		let match: RegExpMatchArray | null;

		if ((match = normalizedPathName.match(RegExps.PASS_STRINGS))) {
			const [, lang] = match;

			const parsedTranslations = Strings.parse(buffer).translations;

			if (!parsedTranslations.length) {
				return;
			}

			this.localize(lang, Object.fromEntries(parsedTranslations));

			return;
		}

		return super.addBuffer(normalizedPathName, buffer);
	}

	/**
	 * Given data from a pass.json, reads them to bring them
	 * into the current pass instance.
	 *
	 * @param data
	 */

	private [importMetadataSymbol](data: Schemas.PassProps) {
		const possibleTypes = [
			"boardingPass",
			"coupon",
			"eventTicket",
			"storeCard",
			"generic",
		] as Schemas.PassTypesProps[];

		const type = possibleTypes.find((type) => Boolean(data[type]));

		const {
			boardingPass,
			coupon,
			storeCard,
			generic,
			eventTicket,
			...otherPassData
		} = data;

		if (Object.keys(this[propsSymbol]).length) {
			console.warn(Messages.PASS_SOURCE.JOIN);
		}

		Object.assign(this[propsSymbol], otherPassData);

		if (!type) {
			if (!this[passTypeSymbol]) {
				console.warn(Messages.PASS_SOURCE.UNKNOWN_TYPE);
			}
		} else {
			this.type = type;

			const {
				headerFields = [],
				primaryFields = [],
				secondaryFields = [],
				auxiliaryFields = [],
				backFields = [],
				transitType,
				additionalInfoFields = [],
			} = data[type] || {};

			this.headerFields.push(...headerFields);
			this.primaryFields.push(...primaryFields);
			this.secondaryFields.push(...secondaryFields);
			this.auxiliaryFields.push(...auxiliaryFields);
			this.backFields.push(...backFields);

			if (this.type === "boardingPass") {
				this.transitType = transitType;
			}

			if (this.type === "eventTicket") {
				this.additionalInfoFields.push(...additionalInfoFields);
			}
		}
	}

	/**
	 * Creates the manifest starting from files
	 * added to the bundle
	 */

	private [createManifestSymbol](): Buffer {
		const manifest = Object.entries(this[filesSymbol]).reduce<{
			[key: string]: string;
		}>(
			(acc, [fileName, buffer]) => ({
				...acc,
				[fileName]: Signature.createHash(buffer),
			}),
			{},
		);

		return Buffer.from(JSON.stringify(manifest));
	}

	/**
	 * Applies the last validation checks against props,
	 * applies the props to pass.json and creates l10n
	 * files and folders and creates manifest and
	 * signature files
	 */

	private [closePassSymbol]() {
		if (!this.type) {
			throw new TypeError(Messages.CLOSE.MISSING_TYPE);
		}

		const fileNames = Object.keys(this[filesSymbol]);

		const passJson = Buffer.from(JSON.stringify(this[propsSymbol]));
		super.addBuffer("pass.json", passJson);

		if (!fileNames.some((fileName) => RegExps.PASS_ICON.test(fileName))) {
			console.warn(Messages.CLOSE.MISSING_ICON);
		}

		// *********************************** //
		// *** LOCALIZATION FILES CREATION *** //
		// *********************************** //

		const localizationEntries = Object.entries(this[localizationSymbol]);

		for (let i = localizationEntries.length - 1; i >= 0; i--) {
			const [lang, translations] = localizationEntries[i];

			const stringsFile = Strings.create(translations);

			if (stringsFile.length) {
				super.addBuffer(`${lang}.lproj/pass.strings`, stringsFile);
			}
		}

		// *********************** //
		// *** PERSONALIZATION *** //
		// *********************** //

		const meetsPersonalizationRequirements = Boolean(
			this[propsSymbol]["nfc"] &&
				this[filesSymbol]["personalization.json"] &&
				fileNames.find((file) =>
					RegExps.PERSONALIZATION.LOGO.test(file),
				),
		);

		if (!meetsPersonalizationRequirements) {
			/**
			 * Looking for every personalization file
			 * and removing it
			 */

			for (let i = 0; i < fileNames.length; i++) {
				if (fileNames[i].includes("personalization")) {
					console.warn(
						Messages.format(
							Messages.CLOSE.PERSONALIZATION_REMOVED,
							fileNames[i],
						),
					);

					delete this[filesSymbol][fileNames[i]];
				}
			}
		}

		// ******************************** //
		// *** BOARDING PASS VALIDATION *** //
		// ******************************** //

		if (this.type === "boardingPass" && !this.transitType) {
			throw new TypeError(Messages.CLOSE.MISSING_TRANSIT_TYPE);
		}

		// ****************************** //
		// *** SIGNATURE AND MANIFEST *** //
		// ****************************** //

		const manifestBuffer = this[createManifestSymbol]();
		super.addBuffer("manifest.json", manifestBuffer);

		const signatureBuffer = Signature.create(
			manifestBuffer,
			this[certificatesSymbol],
		);
		super.addBuffer("signature", signatureBuffer);
	}

	// ************************* //
	// *** EXPORTING METHODS *** //
	// ************************* //

	/**
	 * Exports the pass as a zip buffer. When this method
	 * is invoked, the bundle will get frozen and, thus,
	 * no files will be allowed to be added any further.
	 *
	 * @returns
	 */

	public getAsBuffer(): Buffer {
		if (!this.isFrozen) {
			this[closePassSymbol]();
		}

		return super.getAsBuffer();
	}

	/**
	 * Exports the pass as a zip stream. When this method
	 * is invoked, the bundle will get frozen and, thus,
	 * no files will be allowed to be added any further.
	 *
	 * @returns
	 */

	public getAsStream(): Stream {
		if (!this.isFrozen) {
			this[closePassSymbol]();
		}

		return super.getAsStream();
	}

	/**
	 * Exports the pass as a list of file paths and buffers.
	 * When this method is invoked, the bundle will get
	 * frozen and, thus, no files will be allowed to be
	 * added any further.
	 *
	 * This allows developers to choose a different way
	 * of serving, analyzing or zipping the file, outside the
	 * default compression system.
	 *
	 * @returns a frozen object containing files paths as key
	 * 		and Buffers as content.
	 */

	public getAsRaw(): { [filePath: string]: Buffer } {
		if (!this.isFrozen) {
			this[closePassSymbol]();
		}

		return super.getAsRaw();
	}

	// ************************** //
	// *** DATA SETUP METHODS *** //
	// ************************** //

	/**
	 * Allows to add a localization details to the
	 * final bundle with some translations.
	 *
	 * If the language already exists, translations will be
	 * merged with the existing ones.
	 *
	 * Setting `translations` to `null` fully deletes a language,
	 * its translations and its files.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/creating_the_source_for_a_pass#3736718
	 * @param lang
	 * @param translations
	 */

	public localize(
		lang: string,
		translations: { [key: string]: string } | null,
	) {
		Utils.assertUnfrozen(this);

		if (typeof lang !== "string") {
			throw new TypeError(
				Messages.format(Messages.LANGUAGES.INVALID_LANG, typeof lang),
			);
		}

		if (translations === null) {
			delete this[localizationSymbol][lang];

			const allFilesKeys = Object.keys(this[filesSymbol]);
			const langFolderIdentifier = `${lang}.lproj`;

			for (let i = allFilesKeys.length - 1; i >= 0; i--) {
				const filePath = allFilesKeys[i];

				if (filePath.startsWith(langFolderIdentifier)) {
					delete this[filesSymbol][filePath];
				}
			}

			return;
		}

		if (!translations || !Object.keys(translations).length) {
			console.warn(
				Messages.format(Messages.LANGUAGES.NO_TRANSLATIONS, lang),
			);
			return;
		}

		this[localizationSymbol][lang] ??= {};

		if (typeof translations === "object" && !Array.isArray(translations)) {
			Object.assign(this[localizationSymbol][lang], translations);
		}
	}

	/**
	 * Allows to specify an expiration date for the pass.
	 *
	 * Pass `null` to remove the expiration date.
	 *
	 * @param date
	 * @throws if pass is frozen due to previous export
	 * @returns
	 */

	public setExpirationDate(date: Date | null) {
		Utils.assertUnfrozen(this);

		if (date === null) {
			delete this[propsSymbol]["expirationDate"];
			return;
		}

		try {
			this[propsSymbol]["expirationDate"] = Utils.processDate(date);
		} catch (err) {
			throw new TypeError(
				Messages.format(Messages.DATE.INVALID, "expirationDate", date),
			);
		}
	}

	/**
	 * Allows setting some beacons the OS should
	 * react to and show this pass.
	 *
	 * Pass `null` to remove them at all.
	 *
	 * @example
	 * ```ts
	 *		PKPassInstance.setBeacons(null)
	 *		PKPassInstance.setBeacons({
	 *			proximityUUID: "00000-000000-0000-00000000000",
	 *		});
	 * ```
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/beacons
	 * @param beacons
	 * @throws if pass is frozen due to previous export
	 * @returns
	 */

	public setBeacons(beacons: null): void;
	public setBeacons(...beacons: Schemas.Beacon[]): void;
	public setBeacons(...beacons: (Schemas.Beacon | null)[]) {
		Utils.assertUnfrozen(this);

		if (beacons[0] === null) {
			delete this[propsSymbol]["beacons"];
			return;
		}

		this[propsSymbol]["beacons"] = Schemas.filterValid(
			Schemas.Beacon,
			beacons as Schemas.Beacon[],
		);
	}

	/**
	 * Allows setting some locations the OS should
	 * react to and show this pass.
	 *
	 * Pass `null` to remove them at all.
	 *
	 * @example
	 * ```ts
	 *		PKPassInstance.setLocations(null)
	 *		PKPassInstance.setLocations({
	 *			latitude: 0.5333245342
	 *			longitude: 0.2135332252
	 *		});
	 * ```
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/locations
	 * @param locations
	 * @throws if pass is frozen due to previous export
	 * @returns
	 */

	public setLocations(locations: null): void;
	public setLocations(...locations: Schemas.Location[]): void;
	public setLocations(...locations: (Schemas.Location | null)[]): void {
		Utils.assertUnfrozen(this);

		if (locations[0] === null) {
			delete this[propsSymbol]["locations"];
			return;
		}

		this[propsSymbol]["locations"] = Schemas.filterValid(
			Schemas.Location,
			locations as Schemas.Location[],
		);
	}

	/**
	 * Allows setting a series of relevancy intervals or
	 * relevancy entries for the pass.
	 *
	 * @param {Schemas.RelevantDate[] | null} relevancyEntries
	 * @returns {void}
	 */

	public setRelevantDates(
		relevancyEntries: Schemas.RelevantDate[] | null,
	): void {
		Utils.assertUnfrozen(this);

		if (relevancyEntries === null) {
			this[propsSymbol]["relevantDates"] = undefined;
			return;
		}

		const processedDateEntries = relevancyEntries.reduce<
			Schemas.RelevantDate[]
		>((acc, entry) => {
			try {
				Schemas.validate(Schemas.RelevantDate, entry);

				if (isRelevantEntry(entry)) {
					acc.push({
						relevantDate: Utils.processDate(
							new Date(entry.relevantDate),
						),
					});

					return acc;
				}

				acc.push({
					startDate: Utils.processDate(new Date(entry.startDate)),
					endDate: Utils.processDate(new Date(entry.endDate)),
				});
			} catch (err) {
				console.warn(new TypeError(Messages.RELEVANT_DATE.INVALID));
			}

			return acc;
		}, []);

		this[propsSymbol]["relevantDates"] = processedDateEntries;
	}

	/**
	 * Allows setting a relevant date in which the OS
	 * should show this pass.
	 *
	 * Pass `null` to remove relevant date from this pass.
	 *
	 * @param {Date | null} date
	 * @throws if pass is frozen due to previous export
	 *
	 * @warning `relevantDate` property has been deprecated in iOS 18
	 * in order to get replaced by `relevantDates` array of intervals
	 * (`relevantDates[].startDate` + `relevantDates[].endDate`)
	 * or single date (`relevantDates[].relevantDate`).
	 */

	public setRelevantDate(date: Date | null): void {
		Utils.assertUnfrozen(this);

		if (date === null) {
			delete this[propsSymbol]["relevantDate"];
			return;
		}

		try {
			this[propsSymbol]["relevantDate"] = Utils.processDate(date);
		} catch (err) {
			throw new TypeError(
				Messages.format(Messages.DATE.INVALID, "relevantDate", date),
			);
		}
	}

	/**
	 * Allows to specify some barcodes formats.
	 * As per the current specifications, only the first
	 * will be shown to the user, without any possibility
	 * to change it.
	 *
	 * It accepts either a string from which all formats will
	 * be generated or a specific set of barcodes objects
	 * to be validated and used.
	 *
	 * Pass `null` to remove all the barcodes.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/barcodes
	 * @param barcodes
	 * @throws if pass is frozen due to previous export
	 * @returns
	 */

	public setBarcodes(barcodes: null): void;
	public setBarcodes(message: string): void;
	public setBarcodes(...barcodes: Schemas.Barcode[]): void;
	public setBarcodes(...barcodes: (Schemas.Barcode | string | null)[]): void {
		Utils.assertUnfrozen(this);

		if (!barcodes.length) {
			return;
		}

		if (barcodes[0] === null) {
			delete this[propsSymbol]["barcodes"];
			return;
		}

		let finalBarcodes: Schemas.Barcode[];

		if (typeof barcodes[0] === "string") {
			/**
			 * A string has been received instead of objects. We can
			 * only auto-fill them all with the same data.
			 */

			const supportedFormats: Array<Schemas.BarcodeFormat> = [
				"PKBarcodeFormatQR",
				"PKBarcodeFormatPDF417",
				"PKBarcodeFormatAztec",
				"PKBarcodeFormatCode128",
			];

			finalBarcodes = supportedFormats.map((format) =>
				Schemas.validate(Schemas.Barcode, {
					format,
					message: barcodes[0],
				} as Schemas.Barcode),
			);
		} else {
			finalBarcodes = Schemas.filterValid(
				Schemas.Barcode,
				barcodes as Schemas.Barcode[],
			);
		}

		this[propsSymbol]["barcodes"] = finalBarcodes;
	}

	/**
	 * Allows to specify details to make this, an
	 * NFC-capable pass.
	 *
	 * Pass `null` as parameter to remove it at all.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/nfc
	 * @param data
	 * @throws if pass is frozen due to previous export
	 * @returns
	 */

	public setNFC(nfc: Schemas.NFC | null): void {
		Utils.assertUnfrozen(this);

		if (nfc === null) {
			delete this[propsSymbol]["nfc"];
			return;
		}

		this[propsSymbol]["nfc"] =
			Schemas.validate(Schemas.NFC, nfc) ?? undefined;
	}
}

function validateJSONBuffer(
	buffer: Buffer,
	schema: Parameters<typeof Schemas.validate>[0],
): Schemas.PassProps {
	let contentAsJSON: Schemas.PassProps;

	try {
		contentAsJSON = JSON.parse(buffer.toString("utf8"));
	} catch (err) {
		throw new TypeError(Messages.JSON.INVALID);
	}

	return Schemas.validate(schema, contentAsJSON);
}

function isRelevantEntry(
	entry: Schemas.RelevantDate,
): entry is Schemas.RelevancyEntry {
	return Object.prototype.hasOwnProperty.call(entry, "relevantDate");
}



---
File: /src/Signature.ts
---

import forge from "node-forge";
import type * as Schemas from "./schemas/index.js";
import { Buffer } from "node:buffer";

/**
 * Creates an hash for a buffer. Used by manifest
 *
 * @param buffer
 * @returns
 */

export function createHash(buffer: Buffer) {
	const hashFlow = forge.md.sha1.create();
	hashFlow.update(buffer.toString("binary"));

	return hashFlow.digest().toHex();
}

/**
 * Generates the PKCS #7 cryptografic signature for the manifest file.
 *
 * @method create
 * @params manifest
 * @params certificates
 * @returns
 */

export function create(
	manifestBuffer: Buffer,
	certificates: Schemas.CertificatesSchema,
): Buffer {
	const signature = forge.pkcs7.createSignedData();

	signature.content = new forge.util.ByteStringBuffer(manifestBuffer);

	const { wwdr, signerCert, signerKey } = parseCertificates(
		getStringCertificates(certificates),
	);

	signature.addCertificate(wwdr);
	signature.addCertificate(signerCert);

	/**
	 * authenticatedAttributes belong to PKCS#9 standard.
	 * It requires at least 2 values:
	 * • content-type (which is a PKCS#7 oid) and
	 * • message-digest oid.
	 *
	 * Wallet requires a signingTime.
	 */

	signature.addSigner({
		key: signerKey,
		certificate: signerCert,
		digestAlgorithm: forge.pki.oids.sha1,
		authenticatedAttributes: [
			{
				type: forge.pki.oids.contentType,
				value: forge.pki.oids.data,
			},
			{
				type: forge.pki.oids.messageDigest,
			},
			{
				type: forge.pki.oids.signingTime,
			},
		],
	});

	/**
	 * We are creating a detached signature because we don't need the signed content.
	 * Detached signature is a property of PKCS#7 cryptography standard.
	 */

	signature.sign({ detached: true });

	/**
	 * Signature here is an ASN.1 valid structure (DER-compliant).
	 * Generating a non-detached signature, would have pushed inside signature.contentInfo
	 * (which has type 16, or "SEQUENCE", and is an array) a Context-Specific element, with the
	 * signed content as value.
	 *
	 * In fact the previous approach was to generating a detached signature and the pull away the generated
	 * content.
	 *
	 * That's what happens when you copy a fu****g line without understanding what it does.
	 * Well, nevermind, it was funny to study BER, DER, CER, ASN.1 and PKCS#7. You can learn a lot
	 * of beautiful things. ¯\_(ツ)_/¯
	 */

	return Buffer.from(
		forge.asn1.toDer(signature.toAsn1()).getBytes(),
		"binary",
	);
}

/**
 * Parses the PEM-formatted passed text (certificates)
 *
 * @param element - Text content of .pem files
 * @param passphrase - passphrase for the key
 * @returns The parsed certificate or key in node forge format
 */

function parseCertificates(certificates: Schemas.CertificatesSchema) {
	const { signerCert, signerKey, wwdr, signerKeyPassphrase } = certificates;

	return {
		signerCert: forge.pki.certificateFromPem(signerCert.toString("utf-8")),
		wwdr: forge.pki.certificateFromPem(wwdr.toString("utf-8")),
		signerKey: forge.pki.decryptRsaPrivateKey(
			signerKey.toString("utf-8"),
			signerKeyPassphrase,
		),
	};
}

function getStringCertificates(
	certificates: Schemas.CertificatesSchema,
): Record<
	keyof Omit<Schemas.CertificatesSchema, "signerKeyPassphrase">,
	string
> & { signerKeyPassphrase?: string } {
	return {
		signerKeyPassphrase: certificates.signerKeyPassphrase,
		wwdr: Buffer.from(certificates.wwdr).toString("utf-8"),
		signerCert: Buffer.from(certificates.signerCert).toString("utf-8"),
		signerKey: Buffer.from(certificates.signerKey).toString("utf-8"),
	};
}



---
File: /src/StringsUtils.ts
---

import { EOL } from "node:os";
import { Buffer } from "node:buffer";

// ************************************ //
// *** UTILS FOR PASS.STRINGS FILES *** //
// ************************************ //

/**
 * Parses a string file to convert it to
 * an object
 *
 * @param buffer
 * @returns
 */

export function parse(buffer: Buffer) {
	const fileAsString = buffer.toString("utf8");
	const translationRowRegex = /"(?<key>.+)"\s+=\s+"(?<value>.+)";\n?/;
	const commentRowRegex = /\/\*\s*(.+)\s*\*\//;

	let translations: [placeholder: string, value: string][] = [];
	let comments: string[] = [];

	let blockStartPoint = 0;
	let blockEndPoint = 0;

	do {
		if (
			/** New Line, new life */
			/\n/.test(fileAsString[blockEndPoint]) ||
			/** EOF  */
			blockEndPoint === fileAsString.length
		) {
			let match: RegExpMatchArray | null;

			const section = fileAsString.substring(
				blockStartPoint,
				blockEndPoint + 1,
			);

			if ((match = section.match(translationRowRegex)) && match.groups) {
				const {
					groups: { key, value },
				} = match;

				translations.push([key, value]);
			} else if ((match = section.match(commentRowRegex))) {
				const [, content] = match;

				comments.push(content.trimEnd());
			}

			/** Skipping \n and going to the next block. */
			blockEndPoint += 2;
			blockStartPoint = blockEndPoint - 1;
		} else {
			blockEndPoint += 1;
		}
	} while (blockEndPoint <= fileAsString.length);

	return {
		translations,
		comments,
	};
}

/**
 * Creates a strings file buffer
 *
 * @param translations
 * @returns
 */

export function create(translations: { [key: string]: string }): Buffer {
	const stringContents = [];

	const translationsEntries = Object.entries(translations);

	for (let i = 0; i < translationsEntries.length; i++) {
		const [key, value] = translationsEntries[i];

		stringContents.push(`"${key}" = "${value}";`);
	}

	return Buffer.from(stringContents.join(EOL));
}



---
File: /src/utils.ts
---

import * as Messages from "./messages.js";
import type Bundle from "./Bundle.js";

/**
 * Converts a date to W3C / UTC string
 * @param date
 * @returns
 */

export function processDate(date: Date): string | undefined {
	if (!(date instanceof Date) || Number.isNaN(Number(date))) {
		throw "Invalid date";
	}

	/**
	 * @see https://www.w3.org/TR/NOTE-datetime
	 */

	return date.toISOString();
}

/**
 * Removes hidden files from a list (those starting with dot)
 *
 * @params from - list of file names
 * @return
 */

export function removeHidden(from: Array<string>): Array<string> {
	return from.filter((e) => e.charAt(0) !== ".");
}

/**
 * Clones recursively an object and all of its properties
 *
 * @param object
 * @returns
 */

export function cloneRecursive<T extends Object>(object: T) {
	const objectCopy = {} as Record<keyof T, any>;
	const objectEntries = Object.entries(object) as [keyof T, T[keyof T]][];

	for (let i = 0; i < objectEntries.length; i++) {
		const [key, value] = objectEntries[i];

		if (value && typeof value === "object") {
			if (Array.isArray(value)) {
				objectCopy[key] = value.slice();

				for (let j = 0; j < value.length; j++) {
					objectCopy[key][j] = cloneRecursive(value[j]);
				}
			} else {
				objectCopy[key] = cloneRecursive(value);
			}
		} else {
			objectCopy[key] = value;
		}
	}

	return objectCopy;
}

export function assertUnfrozen(
	instance: InstanceType<typeof Bundle>,
): asserts instance is Bundle & { isFrozen: false } {
	if (instance.isFrozen) {
		throw new Error(Messages.BUNDLE.CLOSED);
	}
}

