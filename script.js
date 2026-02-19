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

  // Gallery Carousel - Responsive (3 desktop, 2 tablet, 1 mobile)
  const galleryCarousel = document.getElementById("galleryCarousel");
  const galleryGrid = document.getElementById("galleryGrid");
  const carouselPrev = document.getElementById("carouselPrev");
  const carouselNext = document.getElementById("carouselNext");
  const carouselDots = document.getElementById("carouselDots");

  if (galleryGrid && galleryCarousel) {
    const items = galleryGrid.querySelectorAll(".gallery-item");
    const totalItems = items.length;
    let currentPage = 0;

    // Get items per view based on screen width
    function getItemsPerView() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }

    // Calculate total pages
    function getTotalPages() {
      const itemsPerView = getItemsPerView();
      return Math.ceil(totalItems / itemsPerView);
    }

    // Create/update dots
    function createDots() {
      if (!carouselDots) return;
      carouselDots.innerHTML = '';
      const totalPages = getTotalPages();

      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.classList.add("carousel-dot");
        if (i === 0) dot.classList.add("active");
        dot.setAttribute("aria-label", `Go to page ${i + 1}`);
        dot.addEventListener("click", () => goToPage(i));
        carouselDots.appendChild(dot);
      }
    }

    // Update carousel position
    function updateCarousel() {
      const itemsPerView = getItemsPerView();
      const gap = 16; // 1rem gap in pixels
      const containerWidth = galleryCarousel.offsetWidth;
      const itemWidth = (containerWidth - (gap * (itemsPerView - 1))) / itemsPerView;
      const translateX = -currentPage * (itemWidth + gap) * itemsPerView;

      galleryGrid.style.transform = `translateX(${translateX}px)`;

      // Update dots
      document.querySelectorAll(".carousel-dot").forEach((dot, i) => {
        dot.classList.toggle("active", i === currentPage);
      });
    }

    function goToPage(index) {
      const totalPages = getTotalPages();
      currentPage = Math.max(0, Math.min(index, totalPages - 1));
      updateCarousel();
    }

    function nextPage() {
      const totalPages = getTotalPages();
      currentPage = (currentPage + 1) % totalPages;
      updateCarousel();
    }

    function prevPage() {
      const totalPages = getTotalPages();
      currentPage = (currentPage - 1 + totalPages) % totalPages;
      updateCarousel();
    }

    // Event listeners
    carouselNext?.addEventListener("click", nextPage);
    carouselPrev?.addEventListener("click", prevPage);

    // Touch/swipe support
    let touchStartX = 0;
    galleryCarousel.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    galleryCarousel.addEventListener("touchend", (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextPage();
        else prevPage();
      }
    }, { passive: true });

    // Keyboard navigation
    galleryCarousel.setAttribute("tabindex", "0");
    galleryCarousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") prevPage();
      if (e.key === "ArrowRight") nextPage();
    });

    // Handle resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const totalPages = getTotalPages();
        if (currentPage >= totalPages) {
          currentPage = totalPages - 1;
        }
        createDots();
        updateCarousel();
      }, 150);
    });

    // Initialize
    createDots();
    updateCarousel();
  }

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

  // Dynamic footer year
  const footerYear = document.getElementById("footerYear");
  if (footerYear) footerYear.textContent = new Date().getFullYear();
})();
