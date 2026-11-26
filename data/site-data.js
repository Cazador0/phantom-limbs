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
   *   support "Artist name"                     optional, shown as "with Artist name"
   *   status  "confirmed" | "sold-out" | "cancelled"   optional, default "confirmed"
   *
   * Example:
   *   { date: "2027-01-16", venue: "Venue name", city: "Dallas, TX", time: "8:00 PM", url: "", status: "confirmed" },
   */
  shows: [
    { date: "2026-11-14", venue: "Guitars & Growlers", city: "Flower Mound, TX", time: "7–10 PM",
      support: "Jeffrey Michael Widman",
      url: "https://www.facebook.com/photo?fbid=122098164825549757&set=a.122098165113549757", linkText: "Details", status: "confirmed" }
  ],

  /*
   * PHOTOGRAPHY
   * The gallery appears once there are at least two photos here.
   *
   *   src     "assets/img/gallery/live-01.jpg"  required
   *   width / height  pixel size of the file    required (stops the page jumping)
   *   alt     short description of the photo    required
   *   thumb   "assets/img/gallery/live-01-thumb.webp"  optional, a small version for the grid
   *           (about 800 px wide) so the page loads less; the viewer uses src
   *   credit  "Photographer name"               optional, shown in the viewer
   */
  photos: [
    { src: "assets/img/band-photo-1534.jpg", thumb: "assets/img/band-photo-960.webp", width: 1534, height: 1025, alt: "Phantom Limbs, all five members standing outdoors with their instruments in front of a mural", credit: "" }
  ],

  /*
   * PLAYLIST (Floating Music Player)
   * Songs for the floating "Spinning 45" player in the corner of the page.
   * Audio loads only when the visitor presses play. Leave empty to hide the player.
   * Put compressed .m4a or .mp3 files (160–192 kbps, ~3–5 MB each) in assets/audio/.
   *
   *   title        "Track title"                         required
   *   src          "assets/audio/track-slug.m4a"         required (local path under assets/audio/)
   *   credits      "Tiffany Baucum · Joren Cain"         optional subtitle
   *   duration     "3:48"                                optional display length before audio loads
   *   cover        "assets/img/covers/track.webp"        optional square sleeve art (defaults to PL monogram)
   *   streamUrl    "https://open.spotify.com/track/..."  optional streaming link shown in expanded card
   *   streamLabel  "Spotify"                             optional link label (inferred from URL when omitted)
   *   peaks        [0.25, 0.6, ...]                      optional 28 bar heights (0..1); auto-sculpted if omitted
   *
   * Example:
   *   { title: "Song title", src: "assets/audio/song-title.m4a", credits: "", duration: "3:48" },
   */
  playlist: [],

  /*
   * LISTEN (Phase 2)
   * One entry per track, album or playlist. Players load only when the
   * visitor presses play. The section appears once there is one entry.
   *
   *   title   "Track title"
   *   credits "optional line"
   *   url     the share link, copied from the app:
   *             Spotify      https://open.spotify.com/track/...  (album/playlist too)
   *             Apple Music  https://music.apple.com/us/album/...
   *             SoundCloud   https://soundcloud.com/artist/track
   *             Bandcamp     press Share/Embed on the track, then copy the
   *                          address inside src="..." (bandcamp.com/EmbeddedPlayer/...)
   *
   * Example:
   *   { title: "Track title", credits: "", url: "https://open.spotify.com/track/..." },
   *
   * Several bands share the name Phantom Limbs on streaming services:
   * copy links from the band's own profile.
   */
  listen: [],

  /*
   * WATCH (Phase 2)
   * YouTube videos and Shorts, in the order to show them. Standard videos
   * appear in a 16:9 grid; YouTube Shorts (/shorts/... links) automatically
   * appear in a vertical Reels row below (or add `reel: true` if a Short uses
   * a youtu.be link). The section appears once there is one entry.
   *
   *   url     the YouTube link (youtube.com/watch?v=..., youtu.be/..., or youtube.com/shorts/...)
   *   title   "Video title"                     optional
   *   reel    true | false                      optional (auto-detected from /shorts/ links)
   *
   * Examples:
   *   { title: "Live at ...", url: "https://www.youtube.com/watch?v=..." },
   *   { title: "Soundcheck clip", url: "https://www.youtube.com/shorts/..." },
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
   * The form opens the visitor's own email app with their message filled in,
   * addressed to this email. No outside email service is used.
   */
  contact: {
    email: "phantomlimbs62@gmail.com"
  }
};
