# pair-chavrutas

This project was bootstrapped with [Create Wix App](https://www.npmjs.com/package/@wix/create-app).  
Read more about it in the [Wix CLI for Apps
 documentation](https://dev.wix.com/docs/build-apps/developer-tools/cli/get-started/about-the-wix-cli-for-apps).

📖 New to this codebase? See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for
a full walkthrough of the domain model, data layer, and the role/logic of
every page and modal.

## 📘 User Guide (for staff, no technical knowledge needed)

This app helps you manage Shalhevet users and pair them up into learning
partnerships ("Chavrutas"). It lives inside your Wix dashboard as a set of
pages, listed on the left-hand menu.

### Users page
A list of everyone who registered. For each person you can:
- **View details** (click the eye icon) — see all their preferences and answers.
- **Contact details** — see their phone/email, with a button to copy them.
- **Edit** — update any of their information.
- **Notes** — write a private note about this person.
- **Archive** — move someone to the archived list if they're no longer active (use the "Active/Archived" switch at the top to see archived users). Archiving can be undone.
- **Delete** — permanently remove a user. This cannot be undone, so only use it if you're certain.

You can filter by registration year, location (Israel / not from Israel), and
whether they already have a Chavruta, and search by name at the top of the table.

### Matches page
This is where you pair people up:
1. Click on a person in the left table to select them.
2. The right table fills in with everyone who could be paired with them,
   sorted by how good a match they are (match %). If someone can't be paired,
   the "First Blocker" column tells you why (e.g. country, gender preference,
   no shared learning track, no overlapping available time).
3. Click **Pair** on the person you want to match with. If they share exactly
   one learning track it will pair immediately; otherwise you'll be asked to
   pick a track from a dropdown first.
4. Click on any row to open a full side-by-side comparison of the two people.

New pairs created here start out as **Pending**.

### Pending Matches page
Pairs that were just created but haven't been confirmed yet.
- **Activate** — confirm the pair is good to go. You'll be asked if you want
  to send both people a notification email introducing them to each other.
- **Discard** — cancel the pending pair (for example if you matched the
  wrong people). This frees both people up to be matched again.

### Chavrutas page
The full list of active learning pairs. Here you can:
- See both participants, when the pair was created, their learning track,
  and their status (Standby, Active, Learning).
- Change the **track** or **status** directly from the table.
- Click the eye icon to see both participants' contact info and add a note
  about the pair.
- **Delete** a pair (you'll be asked to give a reason first). Deleted pairs
  move to the **Archived** view (toggle at the top), where you can still see
  the delete reason and date.

### Typical workflow
1. A new person registers → shows up in **Users**.
2. Go to **Matches**, select them, and pair them with a compatible person →
   they now appear in **Pending Matches**.
3. Review the pending pair and **Activate** it (optionally emailing both
   sides) → it moves to the **Chavrutas** page as an active pair.
4. Track their progress and status from the **Chavrutas** page; if the pair
   ever needs to end, delete it there with a reason.

## Setup 🔧

##### Install dependencies:

```console
npm install
```

## Available Scripts

In the project directory, you can run:

```console
npm run dev
```
