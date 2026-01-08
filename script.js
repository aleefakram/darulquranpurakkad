(() => {
  // Theme Toggle
  const themeBtn = document.getElementById("themeBtn");
  const themeIcon = document.getElementById("themeIcon");
  const html = document.documentElement;

  const moonPath = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z";
  const sunPath = "M12 7a5 5 0 100 10 5 5 0 000-10zM2 13h2M12 2v2M22 13h-2M12 22v-2M5.6 5.6l1.4 1.4M16.9 16.9l1.4 1.4M5.6 18.4l1.4-1.4M16.9 7.1l1.4-1.4";

  function setTheme(dark) {
    html.classList.toggle("dark", dark);
    themeIcon.innerHTML = `<path d="${dark ? sunPath : moonPath}"></path>`;
    themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { }
  }

  const stored = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme:dark)").matches;
  setTheme(stored ? stored === "dark" : prefersDark);

  themeBtn?.addEventListener("click", () => setTheme(!html.classList.contains("dark")));

  // Mobile Menu
  const menuBtn = document.getElementById("menuBtn");
  const mobileNav = document.getElementById("mobileNav");

  menuBtn?.addEventListener("click", () => {
    const open = mobileNav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  mobileNav?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      menuBtn?.setAttribute("aria-expanded", "false");
    })
  );

  // Image fallback (replaces inline onerror)
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.addEventListener("error", () => {
      const fb = img.getAttribute("data-fallback");
      if (fb && img.src !== fb) img.src = fb;
    }, { once: true });
  });

  // Gallery Tabs
  const galleryTabs = document.querySelectorAll(".gallery-tab");
  const galleryPanels = document.querySelectorAll(".gallery-panel");

  galleryTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Update tabs
      galleryTabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      // Update panels
      const targetId = tab.getAttribute("aria-controls");
      galleryPanels.forEach((panel) => {
        if (panel.id === targetId) {
          panel.classList.add("active");
          panel.removeAttribute("hidden");
        } else {
          panel.classList.remove("active");
          panel.setAttribute("hidden", "");
        }
      });
    });
  });

  // Dynamic Gallery Loading
  const galleryGrid = document.getElementById("galleryGrid");
  const eventsGrid = document.getElementById("eventsGrid");

  // Gallery file manifest (updated when CMS adds images)
  const galleryFiles = [
    "_data/gallery/classroom-session.json",
    "_data/gallery/mosque-area.json",
    "_data/gallery/library.json",
    "_data/gallery/student-studying.json"
  ];

  const eventFiles = [
    "_data/events/sample-event-2024.json"
  ];

  // Helper to create gallery item HTML
  function createGalleryItem(item) {
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.setAttribute("role", "button");
    div.setAttribute("tabindex", "0");
    div.setAttribute("data-full", item.image);
    div.setAttribute("data-alt", item.alt || item.title);
    div.innerHTML = `
      <img src="${item.image}" alt="${item.alt || item.title}" loading="lazy" decoding="async" />
      <div class="gallery-overlay" aria-hidden="true">
        <svg class="zoom-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      </div>
    `;
    return div;
  }

  // Helper to create event card HTML
  function createEventCard(event) {
    const div = document.createElement("div");
    div.className = "event-card";
    div.setAttribute("role", "button");
    div.setAttribute("tabindex", "0");
    const date = new Date(event.date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const imageCount = event.images?.length || 0;
    div.innerHTML = `
      <img src="${event.cover}" alt="${event.title}" class="event-card-image" loading="lazy" />
      <div class="event-card-content">
        <h3 class="event-card-title">${event.title}</h3>
        <p class="event-card-date">${date}</p>
        <p class="event-card-count">${imageCount} photo${imageCount !== 1 ? "s" : ""}</p>
      </div>
    `;
    // Click to open event lightbox gallery
    div.addEventListener("click", () => openEventGallery(event));
    div.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openEventGallery(event);
      }
    });
    return div;
  }

  // Load general gallery
  async function loadGallery() {
    if (!galleryGrid) return;
    
    try {
      const items = [];
      for (const file of galleryFiles) {
        try {
          const res = await fetch("/" + file);
          if (res.ok) {
            const data = await res.json();
            items.push(data);
          }
        } catch { }
      }
      
      // Sort by order
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (items.length > 0) {
        galleryGrid.innerHTML = "";
        items.forEach((item) => {
          const el = createGalleryItem(item);
          galleryGrid.appendChild(el);
          // Bind lightbox
          bindGalleryItemLightbox(el);
        });
      }
    } catch (err) {
      console.error("Failed to load gallery:", err);
    }
  }

  // Load events
  async function loadEvents() {
    if (!eventsGrid) return;
    
    try {
      const events = [];
      for (const file of eventFiles) {
        try {
          const res = await fetch("/" + file);
          if (res.ok) {
            const data = await res.json();
            events.push(data);
          }
        } catch { }
      }
      
      // Sort by date (newest first)
      events.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (events.length > 0) {
        eventsGrid.innerHTML = "";
        events.forEach((event) => {
          eventsGrid.appendChild(createEventCard(event));
        });
      } else {
        eventsGrid.innerHTML = '<p class="gallery-loading">No events yet. Check back soon!</p>';
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  }

  // Event gallery viewer
  let currentEventImages = [];
  let currentEventIndex = 0;

  function openEventGallery(event) {
    if (!event.images || event.images.length === 0) return;
    currentEventImages = event.images;
    currentEventIndex = 0;
    openLightbox(event.images[0].src, event.images[0].alt);
  }

  // Helper to bind lightbox to dynamically created items
  function bindGalleryItemLightbox(item) {
    const img = item.querySelector("img");
    const src = item.getAttribute("data-full") || img?.getAttribute("src");
    const alt = item.getAttribute("data-alt") || img?.getAttribute("alt") || "Image";
    
    item.addEventListener("click", () => openLightbox(src, alt, item));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(src, alt, item);
      }
    });
  }

  // Initialize galleries
  loadGallery();
  loadEvents();

  // Netlify Form (AJAX + validation)
  const form = document.getElementById("contactForm");
  if (form) {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const mobileInput = document.getElementById("mobile");
    const messageInput = document.getElementById("message");

    const nameError = document.getElementById("nameError");
    const emailError = document.getElementById("emailError");
    const mobileError = document.getElementById("mobileError");
    const messageError = document.getElementById("messageError");

    const formSuccess = document.getElementById("formSuccess");
    const formFail = document.getElementById("formFail");
    const submitBtn = document.getElementById("submitBtn");

    function showError(el, errEl, msg) {
      el?.setAttribute("aria-invalid", "true");
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.add("show");
      }
    }
    function clearError(el, errEl) {
      el?.removeAttribute("aria-invalid");
      if (errEl) {
        errEl.textContent = "";
        errEl.classList.remove("show");
      }
    }

    // Validate Indian and GCC mobile numbers
    function isValidMobile(phone) {
      // Remove all spaces, dashes, and parentheses
      const cleaned = phone.replace(/[\s\-\(\)]/g, '');

      // Indian mobile: +91 followed by 10 digits starting with 6-9
      const indianPattern = /^\+91[6-9]\d{9}$/;

      // GCC patterns:
      // UAE: +971 followed by 9 digits
      // Saudi Arabia: +966 followed by 9 digits  
      // Kuwait: +965 followed by 8 digits
      // Qatar: +974 followed by 8 digits
      // Bahrain: +973 followed by 8 digits
      // Oman: +968 followed by 8 digits
      const uaePattern = /^\+971\d{9}$/;
      const saudiPattern = /^\+966\d{9}$/;
      const kuwaitPattern = /^\+965\d{8}$/;
      const qatarPattern = /^\+974\d{8}$/;
      const bahrainPattern = /^\+973\d{8}$/;
      const omanPattern = /^\+968\d{8}$/;

      return indianPattern.test(cleaned) ||
        uaePattern.test(cleaned) ||
        saudiPattern.test(cleaned) ||
        kuwaitPattern.test(cleaned) ||
        qatarPattern.test(cleaned) ||
        bahrainPattern.test(cleaned) ||
        omanPattern.test(cleaned);
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      formSuccess?.classList.remove("show");
      formFail?.classList.remove("show");

      // Honeypot
      const botField = form.querySelector('[name="bot-field"]');
      if (botField && botField.value) return;

      let valid = true;

      if (!nameInput.value.trim()) { showError(nameInput, nameError, "Please enter your name."); valid = false; }
      else { clearError(nameInput, nameError); }

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
      if (!emailOk) { showError(emailInput, emailError, "Please enter a valid email."); valid = false; }
      else { clearError(emailInput, emailError); }

      if (!mobileInput.value.trim()) {
        showError(mobileInput, mobileError, "Please enter your mobile number.");
        valid = false;
      } else if (!isValidMobile(mobileInput.value)) {
        showError(mobileInput, mobileError, "Please enter a valid Indian or GCC mobile number (e.g., +91 98765 43210).");
        valid = false;
      } else {
        clearError(mobileInput, mobileError);
      }

      if (!messageInput.value.trim()) { showError(messageInput, messageError, "Please enter a message."); valid = false; }
      else { clearError(messageInput, messageError); }

      if (!valid) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      const formData = new FormData(form);

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
      })
        .then(() => {
          formSuccess?.classList.add("show");
          form.reset();
          setTimeout(() => formSuccess?.classList.remove("show"), 5000);
        })
        .catch(() => {
          formFail?.classList.add("show");
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Inquiry";
        });
    });
  }

  // Lightbox (A11y: focus restore + alt)
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");
  let lastActiveEl = null;

  function openLightbox(src, alt, triggerEl) {
    lastActiveEl = triggerEl || document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "Image";
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
    lightboxClose?.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
    setTimeout(() => { lightboxImg.src = ""; }, 200);
    if (lastActiveEl && typeof lastActiveEl.focus === "function") lastActiveEl.focus();
  }

  // bind gallery items
  document.querySelectorAll(".gallery-item").forEach((item) => {
    const img = item.querySelector("img");
    const src = item.getAttribute("data-full") || img?.getAttribute("src");
    const alt = item.getAttribute("data-alt") || img?.getAttribute("alt") || "Image";

    item.addEventListener("click", () => openLightbox(src, alt, item));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(src, alt, item);
      }
    });
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox?.classList.contains("active")) closeLightbox();
  });

  // UPI QR Code Modal
  const qrModal = document.getElementById("upiQrModal");
  const qrModalClose = document.getElementById("qrModalClose");
  const upiQrBtn = document.getElementById("upiQrBtn");
  let lastQrActiveEl = null;

  function openQrModal(triggerEl) {
    lastQrActiveEl = triggerEl || document.activeElement;
    qrModal?.classList.add("active");
    document.body.style.overflow = "hidden";
    qrModalClose?.focus();
  }

  function closeQrModal() {
    qrModal?.classList.remove("active");
    document.body.style.overflow = "";
    if (lastQrActiveEl && typeof lastQrActiveEl.focus === "function") lastQrActiveEl.focus();
  }

  upiQrBtn?.addEventListener("click", () => openQrModal(upiQrBtn));
  qrModalClose?.addEventListener("click", closeQrModal);
  qrModal?.addEventListener("click", (e) => {
    if (e.target === qrModal) closeQrModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && qrModal?.classList.contains("active")) closeQrModal();
  });
})();
