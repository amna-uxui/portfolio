// Smooth multi-speed scrolling:
// one mouse-wheel scroll moves all three columns, each at its own speed
// (set by data-speed in index.html). Instead of jumping, each column glides
// toward where it should be, which gives the smooth "butter" feel.

const EASE = 0.1;           // lower = smoother and slower to settle, higher = snappier
const HOVER_SLOWDOWN = 0.4; // hovered column moves at 40% of its normal speed
const OPEN_SPEED = 1.5;     // speed of an open column (project list or page)
const GALLERY_SPEED = 2.5;  // sideways galleries move faster, their slides are wide

// Phones get their own layout (the "Phones" part of home.css): sections stacked,
// the page scrolling normally, and a placeholder page instead of case studies
const phone = window.matchMedia("(max-width: 767px)");

// Keep track of each column's position
const columns = [...document.querySelectorAll(".column")].map((column) => ({
  box: column,
  content: column.querySelector(".column-inner"),
  speed: Number(column.dataset.speed),
  target: 0,  // where the column should end up
  current: 0, // where it is right now
}));

// Sideways galleries being scrolled, with their own target/current positions
const galleries = new Map();

window.addEventListener(
  "wheel",
  (event) => {
    if (phone.matches) return; // phones scroll the page normally
    event.preventDefault(); // stop the browser's normal scroll

    // Over a sideways gallery: scroll it left/right instead, until it reaches its end
    const gallery = event.target.closest(".gallery");
    if (gallery) {
      const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (scrollGallery(gallery, wheelPixels(event, sideways) * GALLERY_SPEED)) return;
    }

    const distance = wheelPixels(event, event.deltaY);
    const anyOpen = columns.some((col) => col.box.classList.contains("is-expanded"));

    columns.forEach((col) => {
      const isOpen = col.box.classList.contains("is-expanded");

      // While a column is open, only it scrolls; the narrow side columns stay still
      if (anyOpen && !isOpen) return;

      const maxScroll = Math.max(0, col.content.offsetHeight - col.box.clientHeight);

      // The open column scrolls faster so long pages are easy to read.
      // On the home view each column uses its own speed, slowed down under the mouse.
      let speed = isOpen ? OPEN_SPEED : col.speed;
      if (!isOpen && col.box.matches(":hover")) speed *= HOVER_SLOWDOWN;

      col.target = clamp(col.target + distance * speed, 0, maxScroll);
    });
  },
  { passive: false } // needed so preventDefault() is allowed
);

// Some mice/browsers report scrolling in lines or pages; turn it into pixels
function wheelPixels(event, delta) {
  if (event.deltaMode === 1) return delta * 40;               // lines
  if (event.deltaMode === 2) return delta * window.innerHeight; // pages
  return delta;                                               // already pixels
}

// Move a gallery's target sideways. Returns false when it's already at
// that end, so the page scrolls instead.
function scrollGallery(gallery, distance) {
  const maxLeft = gallery.scrollWidth - gallery.clientWidth;
  const state = galleries.get(gallery) || { target: gallery.scrollLeft, current: gallery.scrollLeft };

  const atEnd = distance > 0 ? state.target >= maxLeft - 1 : state.target <= 0;
  if (atEnd) return false;

  state.target = clamp(state.target + distance, 0, maxLeft);
  galleries.set(gallery, state);
  return true;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Every frame: move each column and gallery a small step closer to its target
function animate() {
  columns.forEach((col) => {
    col.current += (col.target - col.current) * EASE;
    col.content.style.transform = `translateY(${-col.current}px)`;
  });

  galleries.forEach((state, gallery) => {
    state.current += (state.target - state.current) * EASE;
    gallery.scrollLeft = state.current;
  });

  requestAnimationFrame(animate);
}

animate();


// Intro: clicking "Amna" opens the full intro in the greeting strip,
// clicking anywhere on the beige strip closes it again.
const greeting = document.querySelector(".greeting");
const nameButton = document.querySelector(".name-button");

greeting.addEventListener("click", (event) => {
  if (event.target.closest("a")) return; // CERN / Logitech links just open

  if (event.target.closest(".back-button")) {
    // "← Go back" returns to the home view (on phones: leaves the placeholder page,
    // like the phone's own back gesture)
    if (document.body.classList.contains("shows-placeholder")) history.back();
    else closeColumn();
    return;
  }

  if (greeting.classList.contains("is-open")) {
    setIntroOpen(false);
  } else if (event.target.closest(".name-button")) {   // the name, its "." or its arrow
    setIntroOpen(true);
  }
});

// Open or close the intro, gliding the strip from its old height to its new one
function setIntroOpen(open) {
  const startHeight = greeting.offsetHeight;   // height before the change
  greeting.classList.toggle("is-open", open);  // CSS swaps the text
  nameButton.setAttribute("aria-expanded", open); // tells screen readers the intro is open
  const endHeight = greeting.offsetHeight;     // height after the change

  greeting.animate(
    { height: [`${startHeight}px`, `${endHeight}px`] },
    { duration: 600, easing: "cubic-bezier(0.65, 0, 0.35, 1)" } // gentle start and landing
  );
}


// Expanding columns: clicking a column that has projects widens it and
// shows them. Clicking one of the narrow columns (or pressing Esc) goes back.
// The widening, text resizing and fades are all CSS transitions in home.css;
// here we only switch classes.
const columnsWrap = document.querySelector(".columns");

columns.forEach((col) => {
  col.box.addEventListener("click", async (event) => {
    if (col.box.classList.contains("is-expanded")) {
      // Phones: tapping an open section's title or text folds it again
      if (phone.matches && event.target.closest(".column-summary")) closeColumn();
      return;
    }

    const hasProjects = col.box.querySelector(".column-projects") !== null;

    // Close whichever is open (if any). When switching straight to another
    // column, we're not going home, so "← Go back" stays put.
    await closeColumn({ goingHome: !hasProjects });
    if (hasProjects) openColumn(col);

    // Phones: if folding the section above moved this one off the top of the
    // screen, bring it back into view
    if (phone.matches && col.box.getBoundingClientRect().top < 0) {
      col.box.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeColumn();
});

function openColumn(col) {
  if (greeting.classList.contains("is-open")) setIntroOpen(false); // tuck the intro away
  greeting.classList.add("shows-back");   // greeting becomes "← Go back"

  columnsWrap.dataset.expanded = col.box.dataset.name;
  col.box.classList.add("is-expanded");
  scrollAllToTop();
}

// Fade out what's showing (project list or page) first, then let the column narrow back
async function closeColumn({ goingHome = true } = {}) {
  const openBox = document.querySelector(".column.is-expanded");
  if (!openBox) return;

  if (goingHome) {
    greeting.classList.remove("shows-back"); // "← Go back" becomes the greeting again
  }

  const leavingPage = openBox.classList.contains("shows-page");
  const showing = leavingPage
    ? openBox.querySelector(".column-page")
    : openBox.querySelector(".column-projects");

  await fadeOutThen(showing, () => {
    if (leavingPage) markResizing();
    openBox.classList.remove("is-expanded", "shows-page");
    openBox.querySelector(".column-page").innerHTML = ""; // unload the page (stops its videos)
    delete columnsWrap.dataset.expanded;
    delete columnsWrap.dataset.view;
  });
  scrollAllToTop();
}

// Fade an element out, run `change` while it's invisible, then clear the fade
// so the element can show again next time
async function fadeOutThen(element, change) {
  const fade = element.animate(
    { opacity: [1, 0] },
    { duration: 250, easing: "ease", fill: "forwards" }
  );
  await fade.finished;
  change();
  fade.cancel();
}

// Columns glide back to the top when the layout changes
function scrollAllToTop() {
  columns.forEach((col) => (col.target = 0));
}

// While the columns resize back from a project page, they're marked as resizing:
// CSS then lays the narrow columns' text out at its final width (so the widening
// strips reveal it instead of re-wrapping it) and lets the list fade straight in.
// Calling again restarts the wait.
const EXPAND_TIME =
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--expand-time")) * 1000;
let resizeTimer;

function markResizing() {
  columnsWrap.classList.add("is-resizing");
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(
    () => columnsWrap.classList.remove("is-resizing"),
    EXPAND_TIME + 50 // a little after the columns have settled
  );
}


// Project pages: clicking a project in the list loads its page (a separate
// HTML file, e.g. projects/unicos-branding.html) into the open column.
document.addEventListener("click", (event) => {
  const projectLink = event.target.closest(".project-link");
  const backToList = event.target.closest(".page-back");
  const gotoLink = event.target.closest("[data-goto]");
  const soundButton = event.target.closest(".sound-button");

  // Sound button on a video: only one video can have sound at a time,
  // so mute them all first, then turn this one on (if it was off)
  if (soundButton) {
    const wrap = soundButton.closest(".video-wrap");
    const turnOn = wrap.querySelector("video").muted;
    document.querySelectorAll(".video-wrap").forEach((w) => setSound(w, false));
    if (turnOn) setSound(wrap, true);
    return;
  }

  if (projectLink) {
    event.preventDefault();
    if (phone.matches) return openPlaceholder(); // case studies aren't laid out for phones yet
    const url = projectLink.getAttribute("href");
    if (url !== "#") openProject(url); // "#" = page not built yet
  } else if (backToList) {
    closeProject();
  } else if (gotoLink) {
    // Link to another column, e.g. data-goto="tech", optionally straight to one
    // of its pages, e.g. data-page="projects/unicos-framework.html"
    event.preventDefault();
    goToColumn(gotoLink.dataset.goto, gotoLink.dataset.page);
  }
});

// Close the open column, open another one and, if given, load one of its pages
async function goToColumn(name, pageUrl) {
  const col = columns.find((c) => c.box.dataset.name === name);
  await closeColumn({ goingHome: false });
  openColumn(col);
  if (pageUrl) await openProject(pageUrl);
}

async function openProject(url) {
  const openBox = document.querySelector(".column.is-expanded");
  const page = openBox.querySelector(".column-page");

  // Load the page file. "no-cache" makes the browser check for a newer version
  // every time, so edits to a project page always show up.
  page.innerHTML = await (await fetch(url, { cache: "no-cache" })).text();
  galleries.clear();      // forget galleries from a previously opened page
  addSoundButtons(page);  // every video gets a sound button

  columnsWrap.dataset.view = "page"; // column starts widening (CSS)
  scrollAllToTop();
  await fadeOutThen(openBox.querySelector(".column-projects"), () => {
    openBox.classList.add("shows-page"); // list out, page fades in (CSS)
  });
}

// Put a sound button (speaker icons on a circle) on every video in a page.
// Videos start muted: browsers only autoplay silent videos.
function addSoundButtons(page) {
  page.querySelectorAll(".video-wrap").forEach((wrap) => {
    wrap.insertAdjacentHTML("beforeend", `
      <button class="sound-button" type="button" aria-label="Turn sound on">
        <img class="sound-icon sound-icon--off" src="assets/icons/sound-high.svg" alt="">
        <img class="sound-icon sound-icon--on" src="assets/icons/sound-high-solid.svg" alt="">
      </button>`);
  });
}

// Switch one video's sound on or off, and show the matching icon
function setSound(wrap, on) {
  wrap.querySelector("video").muted = !on;
  const button = wrap.querySelector(".sound-button");
  button.classList.toggle("is-on", on);
  button.setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on");
}

// ---------- Phones: slideshows and the placeholder page ----------
const placeholder = document.querySelector(".mobile-placeholder");
const placeholderReel = placeholder.querySelector(".project-reel");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const REEL_INTERVAL = 500; // how long each image stays before the next one (ms)

// The slideshow images, in order: squares exported at 3x (300×300, sharp on phone
// screens) from the "mobile version" Figma frames (Rectangle 7–17), copied to
// assets/Photo/reel/ as 01–11.png
const REEL_FOLDER = "assets/Photo/reel/";
const REEL_IMAGES = ["01.png", "02.png", "03.png", "04.png", "05.png", "06.png",
                     "07.png", "08.png", "09.png", "10.png", "11.png"];

// Fill a slideshow with the images (stacked, see CSS), the first one showing.
// "lazy": on desktop the slideshows are hidden, so their images never load there.
function fillReel(reel) {
  reel.innerHTML = REEL_IMAGES
    .map((name) => `<img src="${REEL_FOLDER + name}" alt="" loading="lazy">`).join("");
  reel.firstElementChild.classList.add("is-shown");
}

// One slideshow under each section's project list, and one on the placeholder page
document.querySelectorAll(".column-projects").forEach((projects) => {
  const reel = document.createElement("div");
  reel.className = "project-reel";
  reel.setAttribute("aria-hidden", "true");
  fillReel(reel);
  projects.append(reel);
});
fillReel(placeholderReel);

// Every half second, each slideshow on screen switches to its next image.
// Visitors who prefer less motion keep seeing one still image.
setInterval(() => {
  if (reducedMotion.matches) return;
  document.querySelectorAll(".project-reel").forEach((reel) => {
    if (!reel.offsetParent) return; // not on screen
    const shown = reel.querySelector(".is-shown");
    const next = shown.nextElementSibling || reel.firstElementChild;
    shown.classList.remove("is-shown");
    next.classList.add("is-shown");
  });
}, REEL_INTERVAL);

// Tapping a project on a phone shows the placeholder page. It gets a history
// entry, so the phone's back gesture closes it.
let scrollBeforePlaceholder = 0;

function openPlaceholder() {
  scrollBeforePlaceholder = window.scrollY;
  document.body.classList.add("shows-placeholder");
  greeting.classList.add("shows-back");
  window.scrollTo(0, 0);
  history.pushState({ placeholder: true }, "");
}

function closePlaceholder() {
  if (!document.body.classList.contains("shows-placeholder")) return;
  document.body.classList.remove("shows-placeholder");
  window.scrollTo(0, scrollBeforePlaceholder); // back to where the list was
}

window.addEventListener("popstate", closePlaceholder);

// "laptop or desktop": sends the site's address on (the phone's share sheet, e.g.
// to AirDrop or email it to yourself), or copies it where sharing isn't available.
// Both only work on https; otherwise (e.g. testing on http) the link is shown instead.
const shareNote = placeholder.querySelector(".share-note");

placeholder.querySelector(".share-link").addEventListener("click", async () => {
  const url = location.href.split("#")[0];
  try {
    if (navigator.share) {
      await navigator.share({ title: document.title, url });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      shareNote.textContent = "Link copied, open it on your computer.";
    } else {
      shareNote.textContent = `Open ${url} on your computer.`;
    }
  } catch {
    // the share sheet was closed without sharing
  }
});


// "← Design projects": back from the page to the project list
async function closeProject() {
  const openBox = document.querySelector(".column.shows-page");
  if (!openBox) return;

  scrollAllToTop();
  const page = openBox.querySelector(".column-page");
  await fadeOutThen(page, () => {
    markResizing();
    openBox.classList.remove("shows-page");
    page.innerHTML = ""; // unload the page (stops its videos)
    delete columnsWrap.dataset.view; // column narrows back (CSS)
  });
}
