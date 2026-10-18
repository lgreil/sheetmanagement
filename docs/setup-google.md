# Connecting Google Drive, Calendar and Sheets

The app reads your sheet music from Google Drive and your dates from Google Calendar through a **service account**: a separate Google identity that only sees what you share with it. Everything here is free. You don't need a billing account or a credit card.

It takes about 15 minutes. Afterwards, open `/status` in the app to check each connection.

## 1. Create a Google Cloud project

1. Open the [Google Cloud console](https://console.cloud.google.com/), ideally signed in with the account that owns the sheet-music folder and the calendar.
2. Create a new project (project picker at the top → **New project**). Any name works, e.g. "Notenarchiv".

If Google asks you to set up billing, you can skip it: the APIs used here are free.

## 2. Turn on the three APIs

In **APIs & Services → Library**, search for each of these and click **Enable**:

- Google Drive API
- Google Calendar API
- Google Sheets API

## 3. Create the service account and its key

1. **IAM & Admin → Service Accounts → Create service account.** Name it e.g. "notenarchiv-app". Skip the optional steps (it needs no roles).
2. Open the new service account → **Keys → Add key → Create new key → JSON**. A `.json` file downloads.
3. Note the service account's email address (`…@….iam.gserviceaccount.com`). You'll share things with it next.

**Treat the key file like a password.** Don't put it in the project folder, and never commit it. If it leaks, delete the key in the console and create a new one.

> Using a Google Workspace organisation? If key creation is blocked, an admin has to allow it for this project (policy `iam.disableServiceAccountKeyCreation`). Personal Gmail accounts aren't affected.

## 4. Share your folders and calendar with the service account

Share with the service account's email, like you would with a person:

| What | Where | Access |
|---|---|---|
| The sheet-music archive folder | Drive → right-click the folder → **Share** | Viewer |
| The "current programme" folder (if separate) | same | Viewer |
| The rehearsal/concert calendar | Calendar → ⋮ next to the calendar → **Settings and sharing → Share with specific people** | See all event details |
| The repertoire sheet (from phase 4 on) | Sheets → **Share** | Editor |

Drive may warn that the address is outside your organisation. That's expected.

## 5. Collect the ids

- **Folder id:** open the folder in Drive. The id is the last part of the URL: `drive.google.com/drive/folders/<this part>`. If the "current programme" folder is separate, note its id too (`DRIVE_CURRENT_PROGRAM_FOLDER_ID`, optional).
- **Calendar id:** Calendar → **Settings and sharing → Integrate calendar → Calendar ID**. For a Gmail account's main calendar, it's the email address.

The **Kalender abonnieren** link on the concerts page opens this calendar in the member's own Google Calendar. That only works if they can see the calendar: either make it public (**Settings and sharing → Access permissions → Make available to public**) or share it with each member. The app itself only needs the service-account share from step 4.

## 6. Give the app the key and the ids

The key is easiest to handle as one line of base64, since that avoids quoting problems:

```powershell
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\key.json"))
```

```bash
# macOS / Linux
base64 -w0 path/to/key.json   # macOS: base64 -i path/to/key.json
```

(Pasting the key file's JSON as is also works.)

**For local development**, put the values into `.dev.vars` (copy `.dev.vars.example`; the file is git-ignored):

```
GOOGLE_SERVICE_ACCOUNT_JSON="<the base64 line>"
DRIVE_ARCHIVE_FOLDER_ID="<folder id>"
# DRIVE_CURRENT_PROGRAM_FOLDER_ID="<folder id>"   (optional)
CALENDAR_ID="<calendar id>"
```

**For the deployed app**, store each value as a Cloudflare secret. Wrangler asks for the value, so it never ends up in your shell history:

```bash
pnpm wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
pnpm wrangler secret put DRIVE_ARCHIVE_FOLDER_ID
pnpm wrangler secret put CALENDAR_ID
```

If you deploy under a different name (`pnpm run deploy -- --name …`), add the same `--name …` to each `secret put`.

## 7. Check

Open `/status` in the app. Each line should say **Verbunden**:

- **Google-Dienstkonto:** the key works.
- **Notenarchiv:** shows how many pieces and files were found.
- **Probenkalender:** shows the upcoming dates.
- **Repertoire-Tabelle:** stays "Nicht eingerichtet" until phase 4.

The archive is re-read automatically every 5 minutes. **Archiv neu einlesen** on the status page forces it right away.

## Troubleshooting

| Message | Cause |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON is neither valid JSON nor base64…` | The key was cut off or got extra quotes. Use the base64 form. |
| `Invalid grant: account not found` | The service account was deleted, or the key belongs to another project. Create a new key. |
| `Invalid JWT Signature` | The key was deleted or replaced in the console. Create a new key. |
| `Kein Zugriff auf … (404)` or `(403)` | Wrong id, or not shared with the service account's email (step 4). |
| API "has not been used in project … or it is disabled" | Step 2 is missing for that API. Enabling can take a minute to apply. |
