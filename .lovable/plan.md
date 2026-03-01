

## Update Pitch Deck: Web App Messaging

Replace all references to "downloading an app" with web-app-first messaging. FocusTap is a browser-based platform that works on any device -- no app store, no downloads.

### Changes in `src/pages/PitchDeck.tsx`

**Slide 0 (Title) -- Line 93**
- Change subtitle from "NFC-Powered Classroom Engagement & Attendance" to "Browser-Based Classroom Engagement & Attendance"

**Slide 1 (Problem) -- Line 135**
- Update "App fatigue" item: change "Existing classroom tools are clunky, hard to use, and don't integrate with the LMS -- students abandon them fast" to reference that tools requiring downloads create friction and low adoption

**Slide 2 (Solution) -- Lines 156-206**
- Change "A dedicated mobile app" to "A web app" in the description paragraph
- Remove "download FocusTap" language -- replace with "open FocusTap in any browser"
- Update student feature "NFC Tap-In" description: remove "Download the app" and replace with "Open the web app on any device"
- Change the bottom stats row:
  - "1 App to download" becomes "0 Downloads" 
  - "NFC Tap to join" becomes "Any Device" (phone, laptop, iPad)
  - Keep "<3s Check-in time"

**Slide 4 (Go-to-Market) -- Line 251**
- Update Year 1 description: remove "Deploy NFC tags campus-wide" and replace with web-app deployment language (e.g., "Roll out web platform campus-wide")

These are purely text/content changes in a single file with no structural or logic modifications.
