const pageToPath = {
  home: "/",
  about: "/about",
  services: "/services",
  bridal: "/bridal-services",
  gallery: "/gallery",
  reviews: "/reviews",
  book: "/book-appointment",
  contact: "/contact"
};

const categoryLabels = {
  hair: "Hair",
  makeup: "Makeup",
  skin: "Skin",
  nails: "Nails",
  bridal: "Bridal"
};

const categoryDescriptions = {
  hair: "Cuts, styling, color and restorative care for polished hair days.",
  makeup: "Event artistry, brows and lashes with a refined luxury finish.",
  skin: "Glow-focused rituals that leave skin feeling fresh and cared for.",
  nails: "Elegant nail grooming for everyday polish and special occasions.",
  bridal: "Wedding beauty experiences designed to look elevated in person and on camera."
};

const cache = {};
let revealObserver;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const siteData = await getSiteData();
    renderHeader(siteData);
    renderFooter(siteData);
    initHeaderState();
    initStickyCta();

    await Promise.all([
      renderHomeServices(),
      renderServicesPage(),
      renderBridalServices(),
      renderGallerySections(),
      renderReviewSections(),
      renderFaq(siteData),
      renderInstagram(siteData),
      initBookingWizard(),
      initContactForm()
    ]);

    initLightbox();
    observeReveals();
  } catch (error) {
    console.error(error);
  } finally {
    window.requestAnimationFrame(() => {
      document.body.classList.add("is-ready");
    });
  }
});

function fetchJson(url) {
  return fetch(url, {
    headers: { Accept: "application/json" }
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed for ${url}`);
    }
    return response.json();
  });
}

function getSiteData() {
  cache.siteData ||= fetch("/data/site-data.json").then((response) => response.json());
  return cache.siteData;
}

function getServices() {
  cache.services ||= fetchJson("/services");
  return cache.services;
}

function getReviews() {
  cache.reviews ||= fetchJson("/reviews");
  return cache.reviews;
}

function getGallery() {
  cache.gallery ||= fetchJson("/gallery");
  return cache.gallery;
}

function renderHeader(siteData) {
  const headerTarget = document.querySelector("[data-site-header]");
  if (!headerTarget) {
    return;
  }

  const activePath = pageToPath[document.body.dataset.page] || window.location.pathname;
  const navItems = siteData.navigation
    .map((item) => {
      const isActive = item.href === activePath ? "is-active" : "";
      return `<a class="${isActive}" href="${item.href}">${escapeHtml(item.label)}</a>`;
    })
    .join("");

  headerTarget.innerHTML = `
    <header class="site-header">
      <div class="site-header__inner">
        <a class="brand" href="/">
          <span class="brand__mark">Lotus</span>
          <span class="brand__sub">Unisex Salon Sec.95</span>
        </a>
        <nav class="site-nav" aria-label="Primary navigation">
          ${navItems}
        </nav>
        <button type="button" class="nav-toggle" aria-expanded="false" aria-label="Open navigation">Menu</button>
      </div>
    </header>
  `;
}

function renderFooter(siteData) {
  const footerTarget = document.querySelector("[data-site-footer]");
  if (!footerTarget) {
    return;
  }

  const serviceLinks = Object.entries(categoryLabels)
    .map(([key, label]) => `<a href="/services#${key}">${label}</a>`)
    .join("");

  footerTarget.innerHTML = `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <div class="footer-grid">
          <div class="footer-list">
            <p class="eyebrow">Lotus Unisex Salon Sec.95</p>
            <h3>Luxury hair, beauty and bridal experiences in Gurgaon.</h3>
            <p>${escapeHtml(siteData.business.address)}</p>
          </div>
          <div class="footer-list">
            <strong>Explore</strong>
            <a href="/">Home</a>
            <a href="/about">About Salon</a>
            <a href="/gallery">Gallery</a>
            <a href="/reviews">Reviews</a>
          </div>
          <div class="footer-list">
            <strong>Services</strong>
            ${serviceLinks}
          </div>
          <div class="footer-list">
            <strong>Contact</strong>
            <a href="tel:${siteData.business.phoneHref}">${escapeHtml(siteData.business.phoneDisplay)}</a>
            <a href="${siteData.business.whatsapp}" target="_blank" rel="noreferrer">WhatsApp</a>
            <a href="${siteData.business.mapsLink}" target="_blank" rel="noreferrer">Google Maps</a>
            <a href="${siteData.business.instagramUrl}" target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>${escapeHtml(siteData.business.hours)}</span>
          <span>&copy; ${new Date().getFullYear()} Lotus Unisex Salon Sec.95</span>
        </div>
      </div>
    </footer>
  `;
}

function initHeaderState() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (!header || !toggle || !nav) {
    return;
  }

  const syncScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  };

  const closeMenu = () => {
    header.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const willOpen = !header.classList.contains("is-open");
    header.classList.toggle("is-open", willOpen);
    document.body.classList.toggle("nav-open", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 960) {
      closeMenu();
    }
  });

  window.addEventListener("scroll", syncScroll, { passive: true });
  syncScroll();
}

function initStickyCta() {
  const button = document.querySelector("[data-sticky-cta]");
  if (!button) {
    return;
  }

  if (document.body.dataset.page === "book") {
    button.hidden = true;
    return;
  }

  const toggleVisibility = () => {
    const threshold = Math.min(window.innerHeight * 0.55, 420);
    button.classList.toggle("is-visible", window.scrollY > threshold);
  };

  button.addEventListener("click", () => {
    window.location.href = "/book-appointment";
  });

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  window.addEventListener("resize", toggleVisibility);
  toggleVisibility();
}

async function renderHomeServices() {
  const container = document.querySelector("#home-services");
  if (!container) {
    return;
  }

  const services = await getServices();
  container.innerHTML = services
    .slice(0, 6)
    .map((service, index) => renderServiceCard(service, index))
    .join("");
}

async function renderServicesPage() {
  const container = document.querySelector("#services-groups");
  if (!container) {
    return;
  }

  const services = await getServices();
  const order = ["hair", "makeup", "skin", "nails", "bridal"];

  container.innerHTML = order
    .map((category, categoryIndex) => {
      const items = services.filter((service) => service.category === category);
      if (!items.length) {
        return "";
      }

      const cards = items.map((service, index) => renderServiceCard(service, categoryIndex + index)).join("");
      return `
        <section class="service-group" id="${category}">
          <div class="service-group__title reveal">
            <div>
              <h2>${categoryLabels[category]}</h2>
              <p>${categoryDescriptions[category]}</p>
            </div>
          </div>
          <div class="service-grid">${cards}</div>
        </section>
      `;
    })
    .join("");
}

async function renderBridalServices() {
  const container = document.querySelector("#bridal-services-list");
  if (!container) {
    return;
  }

  const services = await getServices();
  const featured = services.filter((service) =>
    ["Bridal Makeup Signature", "Bridal Hair Styling", "HD Makeup Artistry", "Skin Glow Therapy"].includes(service.name)
  );

  container.innerHTML = featured.map((service, index) => renderServiceCard(service, index)).join("");
}

function renderServiceCard(service, index) {
  const delayClass = index % 3 === 1 ? "reveal--delay" : index % 3 === 2 ? "reveal--delay-2" : "";

  return `
    <article class="service-card reveal ${delayClass}">
      <div class="service-card__image">
        <img src="${service.image}" alt="${escapeHtml(service.name)}" loading="lazy">
        <span class="service-card__badge">${categoryLabels[service.category]}</span>
      </div>
      <div class="service-card__content">
        <h3>${escapeHtml(service.name)}</h3>
        <p>${escapeHtml(service.description)}</p>
        <div class="service-meta">
          <span>${escapeHtml(service.price)}</span>
          <span>${escapeHtml(service.duration)}</span>
        </div>
        <a class="btn btn--ghost-dark" href="/book-appointment">Book This Service</a>
      </div>
    </article>
  `;
}

async function renderGallerySections() {
  const [homeContainer, pageContainer] = [document.querySelector("#home-gallery"), document.querySelector("#gallery-grid")];
  if (!homeContainer && !pageContainer) {
    return;
  }

  const gallery = await getGallery();

  if (homeContainer) {
    renderGalleryGrid(homeContainer, gallery.slice(0, 6));
  }

  if (pageContainer) {
    renderGalleryGrid(pageContainer, gallery);
    initGalleryFilters(gallery, pageContainer);
  }
}

function renderGalleryGrid(container, items) {
  container.innerHTML = items
    .map((item, index) => {
      const delayClass = index % 3 === 1 ? "reveal--delay" : index % 3 === 2 ? "reveal--delay-2" : "";
      return `
        <article class="gallery-card reveal ${delayClass}">
          <button
            type="button"
            data-lightbox-trigger
            data-image="${item.image}"
            data-caption="${escapeAttribute(item.title)}"
          >
            <img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy">
            <span class="gallery-card__overlay">
              <span class="gallery-card__category">${escapeHtml(item.category)}</span>
              <strong>${escapeHtml(item.title)}</strong>
            </span>
          </button>
        </article>
      `;
    })
    .join("");

  observeReveals();
}

function initGalleryFilters(items, container) {
  const filterWrap = document.querySelector("[data-gallery-filters]");
  if (!filterWrap) {
    return;
  }

  filterWrap.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) {
      return;
    }

    const filter = button.dataset.filter;
    const filtered = filter === "all" ? items : items.filter((item) => item.category === filter);

    filterWrap.querySelectorAll("button").forEach((itemButton) => {
      itemButton.classList.toggle("is-active", itemButton === button);
    });

    renderGalleryGrid(container, filtered);
  });
}

async function renderReviewSections() {
  const [homeSlider, reviewSlider, reviewGrid] = [
    document.querySelector("#home-reviews"),
    document.querySelector("#reviews-slider"),
    document.querySelector("#reviews-grid")
  ];

  if (!homeSlider && !reviewSlider && !reviewGrid) {
    return;
  }

  const reviews = await getReviews();
  const marqueeMarkup = buildReviewMarquee(reviews);

  if (homeSlider) {
    homeSlider.innerHTML = marqueeMarkup;
  }

  if (reviewSlider) {
    reviewSlider.innerHTML = marqueeMarkup;
  }

  if (reviewGrid) {
    reviewGrid.innerHTML = reviews
      .map((review, index) => {
        const delayClass = index % 3 === 1 ? "reveal--delay" : index % 3 === 2 ? "reveal--delay-2" : "";
        return renderReviewCard(review, true, delayClass);
      })
      .join("");
  }
}

function buildReviewMarquee(reviews) {
  const cards = reviews.map((review) => renderReviewCard(review, false, "")).join("");
  return `<div class="review-marquee__track">${cards}${cards}</div>`;
}

function renderReviewCard(review, light = false, delayClass = "") {
  const stars = "★".repeat(review.rating);
  return `
    <article class="review-card ${light ? "review-card--light" : ""} reveal ${delayClass}">
      <span class="review-card__stars" aria-label="${review.rating} star review">${stars}</span>
      <p>"${escapeHtml(review.text)}"</p>
      <span class="review-card__name">${escapeHtml(review.name)}</span>
    </article>
  `;
}

function renderFaq(siteData) {
  const container = document.querySelector("#faq-list");
  if (!container) {
    return;
  }

  container.innerHTML = siteData.faq
    .map((item, index) => {
      const delayClass = index % 2 === 1 ? "reveal--delay" : "";
      return `
        <details class="faq-item reveal ${delayClass}" ${index === 0 ? "open" : ""}>
          <summary>${escapeHtml(item.question)}</summary>
          <p>${escapeHtml(item.answer)}</p>
        </details>
      `;
    })
    .join("");
}

function renderInstagram(siteData) {
  const container = document.querySelector("#instagram-feed");
  if (!container) {
    return;
  }

  container.innerHTML = siteData.instagramPosts
    .map((post, index) => {
      const delayClass = index % 2 === 1 ? "reveal--delay" : "";
      return `
        <a class="instagram-card reveal ${delayClass}" href="${siteData.business.instagramUrl}" target="_blank" rel="noreferrer">
          <img src="${post.image}" alt="${escapeHtml(post.caption)}" loading="lazy">
          <span class="instagram-card__overlay">
            <span class="instagram-card__type">${escapeHtml(post.type)}</span>
            <strong>${escapeHtml(post.caption)}</strong>
          </span>
        </a>
      `;
    })
    .join("");
}

async function initBookingWizard() {
  const container = document.querySelector("#booking-wizard");
  if (!container) {
    return;
  }

  const services = await getServices();
  const today = getTodayIso();
  const timeOptions = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];

  container.innerHTML = `
    <div class="booking-card">
      <div class="booking-progress">
        <div class="booking-progress__bar"><span style="width: 25%"></span></div>
        <div class="booking-progress__labels">
          <span class="is-active">Service</span>
          <span>Date</span>
          <span>Details</span>
          <span>Confirm</span>
        </div>
      </div>
      <form id="booking-form" novalidate>
        <section class="booking-step is-active" data-step="0">
          <div>
            <p class="eyebrow">Step 1</p>
            <h2>Select Service</h2>
          </div>
          <div class="service-option-grid">
            ${services
              .map(
                (service, index) => `
                  <div class="service-option">
                    <input type="radio" id="service-${index}" name="service" value="${escapeAttribute(service.name)}">
                    <label for="service-${index}">
                      <strong>${escapeHtml(service.name)}</strong>
                      <span>${escapeHtml(service.price)} • ${escapeHtml(service.duration)}</span>
                      <span>${escapeHtml(service.description)}</span>
                    </label>
                  </div>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="booking-step" data-step="1">
          <div>
            <p class="eyebrow">Step 2</p>
            <h2>Choose Date</h2>
          </div>
          <div class="form-grid">
            <label>
              Preferred date
              <input type="date" name="date" min="${today}" required>
            </label>
            <label>
              Preferred time
              <select name="time" required>
                <option value="">Choose a time</option>
                ${timeOptions.map((time) => `<option value="${time}">${time}</option>`).join("")}
              </select>
            </label>
          </div>
        </section>

        <section class="booking-step" data-step="2">
          <div>
            <p class="eyebrow">Step 3</p>
            <h2>Enter Contact Details</h2>
          </div>
          <div class="form-grid">
            <label>
              Full name
              <input type="text" name="name" placeholder="Your full name" required>
            </label>
            <label>
              Phone number
              <input type="tel" name="phone" inputmode="numeric" placeholder="10-digit mobile number" required>
            </label>
            <label>
              Notes
              <textarea name="notes" rows="4" placeholder="Any event details or preferences"></textarea>
            </label>
          </div>
        </section>

        <section class="booking-step" data-step="3">
          <div>
            <p class="eyebrow">Step 4</p>
            <h2>Confirm Appointment</h2>
          </div>
          <div class="booking-summary" id="booking-summary"></div>
        </section>

        <p class="form-note" id="booking-note">Walk-ins are welcome, but appointments are recommended.</p>
        <div class="wizard-actions">
          <button type="button" class="btn btn--ghost" id="booking-back" hidden>Back</button>
          <button type="button" class="btn btn--primary" id="booking-next">Continue</button>
        </div>
      </form>
    </div>
  `;

  const form = document.querySelector("#booking-form");
  const steps = [...form.querySelectorAll(".booking-step")];
  const progressBar = document.querySelector(".booking-progress__bar span");
  const progressLabels = [...document.querySelectorAll(".booking-progress__labels span")];
  const backButton = document.querySelector("#booking-back");
  const nextButton = document.querySelector("#booking-next");
  const note = document.querySelector("#booking-note");
  const summary = document.querySelector("#booking-summary");
  let stepIndex = 0;

  const isCompactViewport = () => window.matchMedia("(max-width: 699px)").matches;

  const scrollBookingIntoView = () => {
    const headerOffset = isCompactViewport() ? 84 : 112;
    const top = container.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth"
    });
  };

  const readForm = () => ({
    service: form.elements.service.value.trim(),
    date: form.elements.date.value.trim(),
    time: form.elements.time.value.trim(),
    name: form.elements.name.value.trim(),
    phone: form.elements.phone.value.trim(),
    notes: form.elements.notes.value.trim()
  });

  const renderStep = () => {
    steps.forEach((step, index) => {
      step.classList.toggle("is-active", index === stepIndex);
    });

    progressLabels.forEach((label, index) => {
      label.classList.toggle("is-active", index === stepIndex);
    });

    progressBar.style.width = `${((stepIndex + 1) / steps.length) * 100}%`;
    backButton.hidden = stepIndex === 0;
    nextButton.textContent = stepIndex === steps.length - 1 ? "Confirm Appointment" : "Continue";

    if (stepIndex === steps.length - 1) {
      const values = readForm();
      const selectedService = services.find((service) => service.name === values.service);
      summary.innerHTML = `
        <div class="booking-summary__row"><span>Service</span><strong>${escapeHtml(values.service)}</strong></div>
        <div class="booking-summary__row"><span>Date</span><strong>${escapeHtml(formatDate(values.date))}</strong></div>
        <div class="booking-summary__row"><span>Time</span><strong>${escapeHtml(values.time)}</strong></div>
        <div class="booking-summary__row"><span>Guest</span><strong>${escapeHtml(values.name)}</strong></div>
        <div class="booking-summary__row"><span>Phone</span><strong>${escapeHtml(values.phone)}</strong></div>
        <div class="booking-summary__row"><span>Package</span><strong>${escapeHtml(selectedService ? selectedService.price : "Custom")}</strong></div>
      `;
    }
  };

  const validateStep = () => {
    const values = readForm();

    if (stepIndex === 0 && !values.service) {
      note.textContent = "Please choose a service to continue.";
      return false;
    }

    if (stepIndex === 1 && (!values.date || !values.time)) {
      note.textContent = "Please select your preferred date and time.";
      return false;
    }

    if (stepIndex === 2) {
      const phoneOk = /^[0-9]{10}$/.test(values.phone.replace(/\D/g, ""));
      if (!values.name || !phoneOk) {
        note.textContent = "Please enter your name and a valid 10-digit phone number.";
        return false;
      }
    }

    note.textContent = "Walk-ins are welcome, but appointments are recommended.";
    return true;
  };

  backButton.addEventListener("click", () => {
    stepIndex = Math.max(0, stepIndex - 1);
    renderStep();
    if (isCompactViewport()) {
      scrollBookingIntoView();
    }
  });

  nextButton.addEventListener("click", async () => {
    if (!validateStep()) {
      return;
    }

    if (stepIndex < steps.length - 1) {
      stepIndex += 1;
      renderStep();
      if (isCompactViewport()) {
        scrollBookingIntoView();
      }
      return;
    }

    const payload = readForm();
    nextButton.disabled = true;
    nextButton.textContent = "Submitting...";

    try {
      const response = await fetch("/book-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit the appointment.");
      }

      container.innerHTML = `
        <div class="success-card">
          <p class="eyebrow">Appointment Requested</p>
          <h2>Your premium salon booking is on its way.</h2>
          <p>Reference: <strong>${escapeHtml(result.appointment.id)}</strong></p>
          <p>${escapeHtml(result.message)}</p>
          <p>${result.persisted === false ? "Your selected slot is prepared for quick confirmation." : "We have received your request"} for ${escapeHtml(payload.service)} on ${escapeHtml(formatDate(payload.date))} at ${escapeHtml(payload.time)}. The salon can follow up on ${escapeHtml(payload.phone)} if needed.</p>
          <div class="hero__actions">
            <a class="btn btn--primary" href="/services">Explore More Services</a>
            <a class="btn btn--ghost" href="https://wa.me/919990060999" target="_blank" rel="noreferrer">Message on WhatsApp</a>
          </div>
        </div>
      `;
    } catch (error) {
      note.textContent = error.message;
      nextButton.disabled = false;
      nextButton.textContent = "Confirm Appointment";
    }
  });

  form.querySelectorAll('input[name="service"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (!isCompactViewport() || stepIndex !== 0) {
        return;
      }

      note.textContent = "Service selected. Moving you to date selection.";
      stepIndex = 1;
      renderStep();

      window.setTimeout(() => {
        note.textContent = "Walk-ins are welcome, but appointments are recommended.";
        scrollBookingIntoView();
      }, 80);
    });
  });

  renderStep();
}

async function initContactForm() {
  const form = document.querySelector("#contact-whatsapp-form");
  if (!form) {
    return;
  }

  const [siteData, services] = await Promise.all([getSiteData(), getServices()]);
  const serviceSelect = document.querySelector("#contact-service-select");
  const note = document.querySelector("#contact-form-note");
  const dateField = form.querySelector('input[name="date"]');

  serviceSelect.innerHTML = `
    <option value="">Choose a service</option>
    ${services.map((service) => `<option value="${escapeAttribute(service.name)}">${escapeHtml(service.name)}</option>`).join("")}
  `;
  dateField.min = getTodayIso();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const service = String(formData.get("service") || "").trim();
    const date = String(formData.get("date") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !service || !date) {
      note.textContent = "Please complete the required fields before continuing.";
      return;
    }

    const whatsappMessage = [
      `Hello Lotus Unisex Salon,`,
      `My name is ${name}.`,
      `I would like to enquire about ${service}.`,
      `Preferred date: ${formatDate(date)}.`,
      message ? `Message: ${message}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    note.textContent = "Opening WhatsApp with your prefilled message.";
    window.open(`${siteData.business.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`, "_blank", "noreferrer");
  });
}

function initLightbox() {
  const modal = document.querySelector("[data-lightbox]");
  if (!modal) {
    return;
  }

  const image = modal.querySelector(".lightbox__image");
  const caption = modal.querySelector(".lightbox__caption");
  const closeButton = modal.querySelector("[data-lightbox-close]");

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-lightbox-trigger]");
    if (trigger) {
      modal.hidden = false;
      document.body.classList.add("modal-open");
      image.src = trigger.dataset.image;
      image.alt = trigger.dataset.caption || "Salon gallery image";
      caption.textContent = trigger.dataset.caption || "";
      return;
    }

    if (event.target === modal) {
      close();
    }
  });

  closeButton?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      close();
    }
  });
}

function observeReveals() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
  }

  document.querySelectorAll(".reveal:not([data-reveal-bound])").forEach((element) => {
    element.dataset.revealBound = "true";
    revealObserver.observe(element);
  });
}

function getTodayIso() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
