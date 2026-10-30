# Phone and offline

Most members use Sheetmanagement on a phone, at rehearsal or on the way there.

- **Install it:** the app has a web manifest, so "Add to Home Screen" (Safari) or "Install app" (Chrome) puts it on the home screen.
- **Offline:** a service worker keeps the pages a member opened, and **Save offline** on *My parts* keeps their parts, for rehearsal halls without reception. Signing out deletes both.
- **Updates:** after a deploy, an open app offers to reload within a few minutes; nothing reloads by itself.
- **Own calendar:** each member can create a personal calendar link on the profile page (`/kalender/<token>.ics`) with the orchestra's dates, their own answer and what's rehearsed. It's signed with `SESSION_SECRET` and can be renewed or revoked.
- **Notifications:** turned on per device under **Profile**; reminders for unanswered dates and rented music that's due.

<p>
<img src="https://raw.githubusercontent.com/lgreil/sheetmanagement/main/docs/screenshots/phone-overview.png" width="250" alt="Overview on a phone">
<img src="https://raw.githubusercontent.com/lgreil/sheetmanagement/main/docs/screenshots/phone-rehearsal.png" width="250" alt="A rehearsal on a phone">
</p>
