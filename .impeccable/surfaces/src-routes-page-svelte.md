---
version: 1
slug: "src-routes-page-svelte"
primary_target: "src/routes/+page.svelte"
related_targets: ["src/routes/+page.server.ts"]
---

# Start page (Übersicht)

Mode: Operate. Audience: members on their phones first; organisers second. Job: answer the next date and open my part, both without scrolling. Constraints: organisers' open work never pushes the next date down; the page list stays, compact; not a generic dashboard (no stat tiles, no grid of equal cards).

## Direction contract

THESIS: Read at the top, act at the bottom. The next date is read in the upper half; the two things a member does with it (answer, open their part) sit in a dock right above the tab bar, where the thumb already is. Refuses the stacked-cards hub where every card carries its own buttons.

OWN-WORLD: The Stand Folder as in DESIGN.md: paper page, white card, Poster Black greeting band with the brand gold, deep-gold pill for Meine Noten, status-tinted answer buttons, condensed display face for the greeting and the date only.

STORY: The member sees who's greeted and how far the concert is, reads the next date as a sentence (Samstag, 31. Oktober), answers with one tap in the dock and opens their parts from the same place. Later dates and the rest of the app wait below.

FIRST VIEWPORT: At 390×844: top bar; a compact dark greeting band; the next date card with the date as a large display heading, title and relative time, time and place, what's rehearsed as chips; docked above the tab bar: the question naming the day, three answer buttons, a full-width Meine Noten button. Answered: the dock shrinks to one answer line plus Meine Noten. Desktop: no dock; the same actions sit inside the card, the following date and open work in a second column.

FORM: "In thumb reach", position 7 of 7 on the ordered list, dealt as the lead of the re-roll. seed:b8b73b7ee04fa90e

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
