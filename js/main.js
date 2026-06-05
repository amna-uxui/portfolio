const isRecording = new URLSearchParams(window.location.search).has('recording');
if (isRecording) {
  document.documentElement.classList.add('is-recording');
}

function updateSiteChrome() {
  const navbar = document.getElementById('contact-bar');
  const banner = document.getElementById('banner');
  if (navbar && banner) {
    const chrome = navbar.offsetHeight + banner.offsetHeight;
    document.documentElement.style.setProperty('--site-chrome', `${chrome}px`);
  }
}

// Contact bar expand / collapse
const contactBar = document.getElementById('contact-bar');
const contactButton = document.getElementById('contact-button');
const contactDetails = document.getElementById('contact-details');

const CONTACT_COLLAPSED_HEIGHT = 56;
let isContactCollapsing = false;

function animateContactHeight(from, to) {
  contactBar.style.height = `${from}px`;
  contactBar.offsetHeight;
  contactBar.style.height = `${to}px`;
}

function measureContactHeight() {
  contactBar.style.height = 'auto';
  return contactBar.offsetHeight;
}

function expandContactBar() {
  const startHeight = contactBar.offsetHeight;
  contactDetails.hidden = false;
  contactBar.classList.add('is-expanded');
  contactBar.setAttribute('aria-expanded', 'true');
  const endHeight = measureContactHeight();
  contactBar.style.height = `${startHeight}px`;
  animateContactHeight(startHeight, endHeight);
}

function collapseContactBar() {
  const startHeight = contactBar.offsetHeight;
  contactBar.style.height = `${startHeight}px`;
  contactBar.setAttribute('aria-expanded', 'false');
  isContactCollapsing = true;
  animateContactHeight(startHeight, CONTACT_COLLAPSED_HEIGHT);
}

contactButton.addEventListener('click', (event) => {
  event.stopPropagation();
  if (contactBar.classList.contains('is-expanded')) {
    collapseContactBar();
  } else {
    expandContactBar();
  }
});

contactBar.addEventListener('click', () => {
  if (contactBar.classList.contains('is-expanded') && !isContactCollapsing) {
    collapseContactBar();
  }
});

contactDetails.addEventListener('click', (event) => {
  event.stopPropagation();
});

contactBar.addEventListener('transitionend', (event) => {
  if (event.propertyName !== 'height') return;
  if (isContactCollapsing) {
    isContactCollapsing = false;
    contactBar.classList.remove('is-expanded');
    contactDetails.hidden = true;
    contactBar.style.height = `${CONTACT_COLLAPSED_HEIGHT}px`;
    updateSiteChrome();
    updateColumnScroll();
    return;
  }
  if (contactBar.classList.contains('is-expanded')) {
    contactBar.style.height = 'auto';
  }
  updateSiteChrome();
  updateColumnScroll();
});

// Banner expand / collapse
const banner = document.getElementById('banner');
const bannerName = document.getElementById('banner-name');
const bannerGreeting = document.getElementById('banner-greeting');

const COLLAPSED_HEIGHT = 56;
const COLLAPSED_GREETING = 'Salut, I am';
const EXPANDED_GREETING = 'Salut! I am';
const COLLAPSED_NAME = 'Amna.';
const EXPANDED_NAME = 'Amna,';

let isCollapsing = false;

function animateHeight(from, to) {
  banner.style.height = `${from}px`;
  banner.offsetHeight;
  banner.style.height = `${to}px`;
}

function measureFullHeight() {
  banner.style.height = 'auto';
  return banner.offsetHeight;
}

function expandBanner() {
  const startHeight = banner.offsetHeight;
  bannerGreeting.textContent = EXPANDED_GREETING;
  bannerName.textContent = EXPANDED_NAME;
  banner.classList.add('is-expanded');
  banner.setAttribute('aria-expanded', 'true');
  const endHeight = measureFullHeight();
  banner.style.height = `${startHeight}px`;
  animateHeight(startHeight, endHeight);
}

function collapseBanner() {
  const startHeight = banner.offsetHeight;
  banner.style.height = `${startHeight}px`;
  banner.setAttribute('aria-expanded', 'false');
  isCollapsing = true;
  animateHeight(startHeight, COLLAPSED_HEIGHT);
}

bannerName.addEventListener('click', (event) => {
  if (!banner.classList.contains('is-expanded')) {
    event.stopPropagation();
    expandBanner();
  }
});

banner.addEventListener('click', () => {
  if (banner.classList.contains('is-expanded') && !isCollapsing) {
    collapseBanner();
  }
});

banner.addEventListener('transitionend', (event) => {
  if (event.propertyName !== 'height') return;
  if (isCollapsing) {
    isCollapsing = false;
    banner.classList.remove('is-expanded');
    bannerGreeting.textContent = COLLAPSED_GREETING;
    bannerName.textContent = COLLAPSED_NAME;
    banner.style.height = `${COLLAPSED_HEIGHT}px`;
    updateSiteChrome();
    updateColumnScroll();
    return;
  }
  if (banner.classList.contains('is-expanded')) {
    banner.style.height = 'auto';
  }
  updateSiteChrome();
  updateColumnScroll();
});

banner.setAttribute('aria-expanded', 'false');

// ----- Three-way column scroll -----
const mainContent = document.querySelector('.main-content');
const columns = document.querySelector('.columns');
const columnTracks = document.querySelectorAll('.columns__track');
const columnLanes = document.querySelectorAll('.columns__lane');
const projectItems = document.querySelectorAll('.columns__project');
const expandedColumnClasses = ['is-left-expanded', 'is-middle-expanded', 'is-right-expanded'];
const mobileQuery = window.matchMedia('(max-width: 768px)');

function updateColumnScroll() {
  if (!mainContent) return;

  if (mobileQuery.matches) {
    columnTracks.forEach((track) => {
      track.style.transform = '';
    });
    return;
  }

  const mainTop = mainContent.offsetTop;
  const scrollRange = mainContent.offsetHeight - window.innerHeight;
  if (scrollRange <= 0) return;
  const progress = Math.min(1, Math.max(0, (window.scrollY - mainTop) / scrollRange));

  columnTracks.forEach((track) => {
    if (track.classList.contains('is-deep-dive-frozen')) {
      return;
    }

    const lane = track.parentElement;
    const speed = parseFloat(track.dataset.speed) || 1;
    const maxMove = track.offsetHeight - lane.offsetHeight;
    if (maxMove <= 0) return;
    const offset = progress * maxMove * speed;
    track.style.transform = `translateY(${-offset}px)`;
  });
}

function toggleUnicosDeepDive(panel) {
  const deepDive = panel.querySelector('.columns__deep-dive');
  if (!deepDive) return false;

  const track = panel.closest('.columns__track');
  const lane = track?.parentElement;
  const isOpen = panel.classList.toggle('has-deep-dive');
  deepDive.hidden = !isOpen;

  if (isOpen && track) {
    track.classList.add('is-deep-dive-frozen');
    lane?.classList.add('is-deep-dive-lane');
  } else if (track) {
    track.classList.remove('is-deep-dive-frozen');
    lane?.classList.remove('is-deep-dive-lane');
  }

  return isOpen;
}

function isUnicosDeepDiveTarget(target) {
  if (mobileQuery.matches) return false;

  const lane = target.closest('.columns__lane--middle');
  const selectedProject = lane?.querySelector('.columns__project.is-selected');
  const panel = target.closest('.columns__panel');
  const isDeepDiveTrigger =
    target.closest('.columns__project-detail') ||
    target.closest('.columns__project-image') ||
    target.closest('.columns__project-video');

  return Boolean(
    isDeepDiveTrigger &&
    selectedProject &&
    selectedProject.dataset.project === 'unicos' &&
    panel?.querySelector('.columns__deep-dive')
  );
}

function clearProjectDetails(lane) {
  const scope = lane ? lane : document;

  scope.querySelectorAll('.columns__project-inline').forEach((inline) => {
    inline.remove();
  });

  scope.querySelectorAll('.columns__project').forEach((p) => p.classList.remove('is-selected'));
  scope.querySelectorAll('.columns__project-detail').forEach((d) => {
    d.hidden = true;
    d.textContent = '';
    d.dataset.image = '';
  });
  scope.querySelectorAll('.columns__project-image').forEach((img) => {
    img.hidden = true;
    img.src = '';
  });
  scope.querySelectorAll('.columns__project-video').forEach((video) => {
    video.hidden = true;
    video.pause();
    video.currentTime = 0;
    video.removeAttribute('src');
    video.load();
  });
  scope.querySelectorAll('.columns__detail-offset').forEach((o) => {
    o.style.height = '0';
  });
  scope.querySelectorAll('.columns__panel').forEach((panel) => {
    panel.classList.remove('has-deep-dive');
  });
  scope.querySelectorAll('.columns__deep-dive').forEach((deepDive) => {
    deepDive.hidden = true;
  });
  scope.querySelectorAll('.columns__track.is-deep-dive-frozen').forEach((track) => {
    track.classList.remove('is-deep-dive-frozen');
  });
  scope.querySelectorAll('.columns__lane.is-deep-dive-lane').forEach((deepLane) => {
    deepLane.classList.remove('is-deep-dive-lane');
  });

  if (lane) {
    lane.classList.remove('has-selected-project');
  } else {
    columnLanes.forEach((l) => l.classList.remove('has-selected-project'));
  }
}

function alignDescription(project) {
  const panelBottom = project.closest('.columns__panel-bottom');
  const projectsList = panelBottom.querySelector('.columns__projects');
  const offsetEl = panelBottom.querySelector('.columns__detail-offset');

  const projectTop = project.getBoundingClientRect().top;
  const listTop = projectsList.getBoundingClientRect().top;
  offsetEl.style.height = `${projectTop - listTop}px`;
}

function showMobileProjectDetails(project) {
  const lane = project.closest('.columns__lane');
  const existingInline = project.querySelector('.columns__project-inline');
  const currentInline = lane.querySelector('.columns__project-inline');

  if (existingInline) {
    existingInline.classList.add('is-leaving');
    setTimeout(() => {
      clearProjectDetails(lane);
    }, 220);
    return;
  }

  if (currentInline) {
    currentInline.classList.add('is-leaving');
    setTimeout(() => {
      clearProjectDetails(lane);
      showMobileProjectDetails(project);
    }, 220);
    return;
  }

  clearProjectDetails(lane);

  const inline = document.createElement('div');
  inline.className = 'columns__project-inline';

  const description = document.createElement('p');
  description.className = 'columns__project-inline-text';
  description.textContent = project.dataset.description;
  inline.appendChild(description);

  if (project.dataset.video) {
    const video = document.createElement('video');
    video.className = 'columns__project-inline-media';
    video.src = project.dataset.video;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = true;
    inline.appendChild(video);
    video.play().catch(() => {
      // Controls still let the visitor play it if autoplay is blocked.
    });
  } else if (project.dataset.image) {
    const image = document.createElement('img');
    image.className = 'columns__project-inline-media';
    image.src = project.dataset.image;
    image.alt = project.querySelector('.columns__project-name').textContent;
    inline.appendChild(image);
  }

  project.classList.add('is-selected');
  project.appendChild(inline);
}

function toggleColumnExpansion(columnName) {
  const className = `is-${columnName}-expanded`;
  const isAlreadyExpanded = columns.classList.contains(className);

  clearProjectDetails();
  columns.classList.remove('is-expanded', ...expandedColumnClasses);
  columnLanes.forEach((lane) => {
    lane.classList.remove('is-hovered');
    lane.querySelector('.columns__track')?.classList.remove('is-hovered');
  });

  if (!isAlreadyExpanded) {
    columns.classList.add('is-expanded', className);
  }

  setTimeout(updateColumnScroll, 650);
}

window.addEventListener('scroll', updateColumnScroll, { passive: true });
window.addEventListener('resize', () => {
  updateSiteChrome();
  updateColumnScroll();
});

window.addEventListener('load', () => {
  updateSiteChrome();
  updateColumnScroll();
  if (isRecording) {
    window.scrollTo(0, 0);
  }
});

updateSiteChrome();
updateColumnScroll();

columnLanes.forEach((lane) => {
  lane.addEventListener('click', (event) => {
    if (event.target.closest('.columns__project') ||
        event.target.closest('.columns__project-detail') ||
        event.target.closest('.columns__project-image') ||
        event.target.closest('.columns__project-video') ||
        event.target.closest('.columns__deep-dive')) {
      return;
    }
    toggleColumnExpansion(lane.dataset.column);
  });
});

function initRecordingHover() {
  if (!document.documentElement.classList.contains('is-recording')) return;

  columnLanes.forEach((lane) => {
    const track = lane.querySelector('.columns__track');
    if (!track) return;

    const setHovered = (isHovered) => {
      if (columns.classList.contains('is-expanded')) {
        lane.classList.remove('is-hovered');
        track.classList.remove('is-hovered');
        return;
      }
      lane.classList.toggle('is-hovered', isHovered);
      track.classList.toggle('is-hovered', isHovered);
    };

    lane.addEventListener('mouseenter', () => setHovered(true));
    lane.addEventListener('mouseleave', () => setHovered(false));
    track.addEventListener('mouseenter', () => setHovered(true));
    track.addEventListener('mouseleave', () => setHovered(false));
  });
}

initRecordingHover();

function showProjectDetails(project) {
  const lane = project.closest('.columns__lane');
  const detail = lane.querySelector('.columns__project-detail');
  const image = lane.querySelector('.columns__project-image');
  const video = lane.querySelector('.columns__project-video');
  const panel = project.closest('.columns__panel');
  const deepDive = panel.querySelector('.columns__deep-dive');

  lane.querySelectorAll('.columns__project').forEach((item) => {
    item.classList.remove('is-selected');
  });
  panel.classList.remove('has-deep-dive');
  if (deepDive) deepDive.hidden = true;

  const track = panel.closest('.columns__track');
  if (track) track.classList.remove('is-deep-dive-frozen');
  lane.classList.remove('is-deep-dive-lane');

  project.classList.add('is-selected');
  lane.classList.add('has-selected-project');
  detail.textContent = project.dataset.description;
  detail.hidden = false;

  image.hidden = true;
  image.src = '';
  video.hidden = true;
  video.pause();
  video.currentTime = 0;
  video.removeAttribute('src');
  video.load();

  if (project.dataset.video) {
    video.src = project.dataset.video;
    video.hidden = false;
    video.load();
    video.play().catch(() => {
      // Some browsers block autoplay; controls still let the visitor play it.
    });
  } else if (project.dataset.image) {
    image.src = project.dataset.image;
    image.alt = project.querySelector('.columns__project-name').textContent;
    image.hidden = false;
  }

  image.dataset.project = project.dataset.project || '';
  video.dataset.project = project.dataset.project || '';

  alignDescription(project);
}

projectItems.forEach((project) => {
  project.addEventListener('click', (event) => {
    event.stopPropagation();

    if (mobileQuery.matches) {
      showMobileProjectDetails(project);
      return;
    }

    const lane = project.closest('.columns__lane');
    const isAlreadySelected = project.classList.contains('is-selected');

    if (isAlreadySelected) {
      clearProjectDetails(lane);
      return;
    }

    showProjectDetails(project);
  });
});

function handleUnicosDeepDiveClick(event) {
  if (!isUnicosDeepDiveTarget(event.target)) {
    return;
  }

  event.stopPropagation();
  const panel = event.target.closest('.columns__panel');
  toggleUnicosDeepDive(panel);
}

document.querySelectorAll('.columns__project-detail').forEach((detail) => {
  detail.addEventListener('click', handleUnicosDeepDiveClick);
});

document.querySelectorAll('.columns__project-image, .columns__project-video').forEach((media) => {
  media.addEventListener('click', handleUnicosDeepDiveClick);
});
