/*
 * Phantom Limbs — site content.
 *
 * This is the only file you edit to update the site. Save it, commit, and the
 * page picks the changes up. Anything left empty is hidden on the page (its
 * section and its nav link disappear), so nothing unfinished goes live.
 */
window.PL = {
  /*
   * SHOWS
   * One entry per show, in any order. The page sorts them, moves past dates
   * into "Past Performances" on its own, and fills the "Next show" line
   * in the hero.
   *
   *   date    "YYYY-MM-DD"                      required
   *   venue   "Venue name"                      required
   *   city    "Dallas, TX"                      required
   *   time    "8:00 PM"                         optional
   *   url     "https://tickets.example/..."     optional (ticket or event link)
   *   linkText "Details"                        optional, the link's words (default "Tickets")
   *   status  "confirmed" | "sold-out" | "cancelled"   optional, default "confirmed"
   *
   * Example:
   *   { date: "2027-01-16", venue: "Venue name", city: "Dallas, TX", time: "8:00 PM", url: "", status: "confirmed" },
   */
  shows: [
    { date: "2026-11-14", venue: "Guitars & Growlers", city: "Flower Mound, TX", time: "7–10 PM",
      url: "https://www.facebook.com/photo?fbid=122098164825549757&set=a.122098165113549757", linkText: "Details", status: "confirmed" }
  ],

  /*
   * PHOTOGRAPHY
   * The gallery appears once there is at least one photo here.
   *
   *   src     "assets/img/gallery/live-01.jpg"  required
   *   width / height  pixel size of the file    required (stops the page jumping)
   *   alt     short description of the photo    required
   *   credit  "Photographer name"               optional, shown in the viewer
   */
  photos: [
    { src: "assets/img/group-1091.jpg", width: 1091, height: 1442, alt: "Phantom Limbs, all five members, seated on a staircase", credit: "" }
  ],

  /*
   * LISTEN (Phase 2)
   * One entry per track. Players load only when the visitor presses play.
   *
   *   title   "Track title"
   *   credits "optional line"
   *   embed   the player's embed URL (Spotify, Bandcamp, SoundCloud, ...)
   */
  listen: [],

  /*
   * WATCH (Phase 2)
   * YouTube video ids. The first one is the featured video.
   *
   *   id      "dQw4w9WgXcQ"   (the part after v= in the YouTube link)
   *   title   "Video title"
   */
  watch: [],

  /*
   * PRESS (Phase 2)
   * Path or URL of the press kit PDF, plus an optional short intro.
   */
  press: {
    kitUrl: "",
    intro: ""
  },

  /*
   * SOCIAL LINKS
   * The band's profile URLs. An empty link hides its icon everywhere
   * (header, phone menu and footer).
   */
  social: {
    instagram: "https://www.instagram.com/phantomlimbsdallas/",
    youtube: "https://www.youtube.com/@phantomlimbsdallas",
    facebook: "https://www.facebook.com/phantomlimbsdallas"
  },

  /*
   * CONTACT FORM
   * endpoint: URL of a form service that accepts a POST (Formspree, Basin,
   * Netlify Forms, a serverless function, ...). While this is empty the form
   * opens the visitor's own email app with the message filled in.
   */
  contact: {
    email: "phantomlimbs62@gmail.com",
    endpoint: ""
  }
};
