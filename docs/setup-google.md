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
| The current-programme folders ("Programm A-Orchester" …) | same | Viewer |
| The rehearsal/concert calendar | Calendar → ⋮ next to the calendar → **Settings and sharing → Share with specific people** | See all event details |
| The Repertoire sheet (create it first, see below) | Sheets → **Share** | Editor |

Drive may warn that the address is outside your organisation. That's expected.

**The Repertoire sheet** holds what neither Drive nor Calendar knows: concert programmes, the orchestra's past concerts and extra details per piece. Create an empty Google Sheet for it, e.g. `91 | Repertoire` in the sheet-music folder, and share it as above. Leave it empty: the app fills it in step 8.

## 5. Collect the ids

- **Folder id:** open the folder in Drive. The id is the last part of the URL: `drive.google.com/drive/folders/<this part>`.
- **Current programmes** (optional): the ids of the folders with what each orchestra is playing now, e.g. "Programm A-Orchester", "Programm Ehemaligenorchester". Put them into `DRIVE_CURRENT_PROGRAM_FOLDER_ID`, separated by commas. Their pieces show up in the app with a tag per programme, taken from the folder name ("Programm A-Orchester" → "A-Orchester"). A "Programm …" folder (or a shortcut to one) inside another programme folder counts for both: if the Ehemaligenorchester's folder links to the A-Orchester's, those pieces get both tags.
- **Calendar id:** Calendar → **Settings and sharing → Integrate calendar → Calendar ID**. For a Gmail account's main calendar, it's the email address.
- **Sheet id:** open the sheet. The id is the long part of the URL: `docs.google.com/spreadsheets/d/<this part>/edit`.

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
REPERTOIRE_SHEET_ID="<sheet id>"
```

**For the deployed app**, store each value as a Cloudflare secret. Wrangler asks for the value, so it never ends up in your shell history:

```bash
pnpm wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
pnpm wrangler secret put DRIVE_ARCHIVE_FOLDER_ID
pnpm wrangler secret put CALENDAR_ID
pnpm wrangler secret put REPERTOIRE_SHEET_ID
```


The secrets go to the worker named in `wrangler.toml` (`name = "noten"`). If you deploy under another name, change it there, so deploys and secrets always go to the same worker. (Passing `--name` on the command line works for `wrangler` directly, but `pnpm run deploy -- --name …` does not reach it.)

## 7. Check

Open `/status` in the app. Each line should say **Verbunden**:

- **Google-Dienstkonto:** the key works.
- **Notenarchiv:** shows how many pieces and files were found.
- **Probenkalender:** shows the upcoming dates.
- **Repertoire-Tabelle:** says "Nicht eingerichtet" until step 8.

The archive is re-read automatically every 5 minutes. **Archiv neu einlesen** on the status page forces it right away.

## 8. Set up the Repertoire sheet

Open `/setup` in the app (or **Tabelle einrichten** on the status page) and click **Jetzt einrichten**. The app adds three tabs:

- **Stücke:** one row per piece. Every folder in the archive is added automatically, with title and composer read from the folder name. Fix a wrongly read name here, not in Drive. Pieces without sheet music (e.g. from old programmes) are rows without a Drive-Ordner-ID.
- **Konzerte:** one row per concert. Confirmed concerts from the calendar are added automatically. Add past concerts by hand; **Datum** may be just a year (`1957`) or a month (`1957-12`).
- **Programm:** one row per piece in a concert. Pick **Konzert** and **Stück** from the dropdowns; **Nr.** is the order and may stay empty.

The grey id columns are what the app uses to recognise rows. Don't edit them. Columns can be reordered, and you can add your own. Changes show up in the app within a minute. Running setup again is safe: it only adds what's missing.

If the setup page lists **Hinweise zur Tabelle** (e.g. a piece name in "Programm" that isn't in "Stücke"), fix those rows in the sheet.

## 9. Turn on sign-in

Until this step, the app is open to anyone with the link and nobody can change anything in it. With sign-in on, only members see the app, and admins hand out rights. Members sign in with their own Google account. This is free too.

**Run `/setup` once more first** if your sheet is from before sign-in existed. It adds the tabs **Mitglieder**, **Gruppen**, **Rechte** and **Zugangsanfragen**.

1. In the Cloud console (same project as in step 1): **APIs & Services → OAuth consent screen**.
   - User type **External**. App name e.g. "Notenarchiv", your email as support and developer contact.
   - **Branding:** leave out the logo and the app-domain fields (home page, privacy policy, terms, authorized domains). They're only needed for *brand verification*, which shows your app name and logo on Google's sign-in screen. Brand verification needs a domain you own, which a free `workers.dev` address isn't. Without it, sign-in works the same; Google just shows a plainer screen.
     - The app still has its own privacy notice and terms (`/datenschutz`, `/nutzungsbedingungen`), linked on every page. Fill in who is responsible, as secrets like in step 6: `LEGAL_NAME` (defaults to `ORCHESTRA_NAME`) and `LEGAL_EMAIL`, optionally `LEGAL_ADDRESS`. The texts describe what the app does, but they're a template, not legal advice: have someone in the club check them.
     - With your own domain later, you can fill in the fields with these pages and verify the brand.
   - Scopes: add none. The app only asks for name and email (`openid email profile`), which are non-sensitive: Google requires no verification for them.
   - Under **Audience** (or **Publishing status**), click **Publish app** so the status is **In production**. Brand verification isn't needed for that. While the app is in "Testing", only the test users listed there (at most 100) can sign in.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type **Web application**.
   - **Authorized redirect URIs:** your app's address plus `/auth/callback`, e.g. `https://notenarchiv.<account>.workers.dev/auth/callback`. For local development also add `http://localhost:5173/auth/callback`. The status page shows the exact address.
   - Note the **Client ID** and **Client secret**.
3. Make a random session secret (at least 32 characters):

   ```powershell
   # Windows PowerShell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   ```

   ```bash
   # macOS / Linux
   openssl rand -base64 32
   ```

4. Add the values like in step 6 (`.dev.vars` locally, `pnpm wrangler secret put …` for the deployed app):

   ```
   GOOGLE_OAUTH_CLIENT_ID="<client id>"
   GOOGLE_OAUTH_CLIENT_SECRET="<client secret>"
   SESSION_SECRET="<the random string>"
   BOOTSTRAP_ADMINS="you@example.org,second-admin@example.org"
   ```

   **BOOTSTRAP_ADMINS** always have every right, whatever the sheet says, so the app can't lock everyone out. Use two accounts, e.g. the orchestra's and your own.

5. Open the app and sign in with a bootstrap admin account. **Verwaltung** (`/admin`) now appears in the menu.

**How access works:**

- Anyone listed in **Mitglieder** can see everything. Someone who signs in but isn't listed can click **Zugang beantragen**; the request shows up under Verwaltung, where an admin approves it with one click.
- Extra rights are given in **Rechte**, to an email address or to a group from the **Gruppen** column in Mitglieder (e.g. `Vorstand`):

  | Right | Allows |
  |---|---|
  | `programme.bearbeiten` | Edit concert programmes in the app |
  | `mitglieder.verwalten` | Approve members and give rights (Verwaltung); set the status of wishes and answer them |
  | `stuecke.bearbeiten` | Look after problem reports on sheet music (**Meldungen**) and mark them as done |
  | `archiv.bearbeiten` | Reserved for an upcoming feature; edit the sheet directly for now |

- Every member can report a problem with a part (flag button on the piece page) and add wishes and +1s on **Wünsche**. Both are stored in their own tabs, **Meldungen** and **Wünsche**; an older sheet gets them when you run **Tabelle einrichten** again.

- Everything can also be edited directly in the sheet. Changes apply within a minute; removing someone from Mitglieder locks them out at once.
- App access and Drive access are separate: to open the PDFs, members still need access to the sheet-music folder in Drive.
- **Turning sign-in off again:** set `FORCE_AUTH` to `false` (`pnpm wrangler secret put FORCE_AUTH`). The other values stay, and deleting `FORCE_AUTH` turns sign-in back on. While it's off, the app works as before step 9: anyone with the link can view everything, including `/setup` and `/status`, and nobody can change anything, report problems or add wishes. Use it for an instance that should be public, or to get in while Google sign-in is broken.

## Troubleshooting

| Message | Cause |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON is neither valid JSON nor base64…` | The key was cut off or got extra quotes. Use the base64 form. |
| `Invalid grant: account not found` | The service account was deleted, or the key belongs to another project. Create a new key. |
| `Invalid JWT Signature` | The key was deleted or replaced in the console. Create a new key. |
| `Kein Zugriff auf … (404)` or `(403)` | Wrong id, or not shared with the service account's email (step 4). |
| API "has not been used in project … or it is disabled" | Step 2 is missing for that API. Enabling can take a minute to apply. |
| `The caller does not have permission (403)` on `/setup` | The sheet is shared as Viewer. The service account needs Editor. |
| Google says `redirect_uri_mismatch` when signing in | The address under **Authorized redirect URIs** (step 9) doesn't match exactly. Copy it from the status page. |
| Signed in, but always back on "Zugang beantragen" | The email isn't in **Mitglieder**, or is spelled differently there. |
