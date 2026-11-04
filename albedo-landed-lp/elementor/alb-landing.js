(function () {
  "use strict";

  var REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
  var ATTRIBUTION_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "gclid"];

  function prefersReducedMotion() {
    return typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches;
  }

  function pushEvent(payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }

  function nodesWithin(root, selector) {
    var nodes = [];
    if (root && typeof root.matches === "function" && root.matches(selector)) nodes.push(root);
    if (root && typeof root.querySelectorAll === "function") {
      nodes = nodes.concat(Array.prototype.slice.call(root.querySelectorAll(selector)));
    }
    return nodes;
  }

  function initSlider(slider) {
    if (!slider || slider.dataset.albReady === "true") return;
    slider.dataset.albReady = "true";

    var slides = Array.prototype.slice.call(slider.querySelectorAll(".alb-slide"));
    var segments = Array.prototype.slice.call(slider.querySelectorAll(".alb-slider-segment"));
    var counter = slider.querySelector(".alb-slider__counter");
    var caption = slider.querySelector(".alb-slider__caption-text");
    var projectLink = slider.querySelector(".alb-slider__project-link");
    var index = Math.max(0, slides.findIndex(function (slide) {
      return slide.classList.contains("is-active");
    }));
    var timer = null;
    var initialDelay = null;
    var autoplayStarted = false;
    var pointerStart = null;
    var hovering = false;
    var focusing = false;
    var userPaused = false;
    var playbackToggle = slider.querySelector(".alb-slider__toggle");

    function isPaused() {
      return userPaused || hovering || focusing || document.visibilityState === "hidden";
    }

    function updatePlaybackControl() {
      if (!playbackToggle) return;
      playbackToggle.setAttribute("aria-pressed", String(userPaused));
      playbackToggle.setAttribute(
        "aria-label",
        userPaused ? "Play project slideshow" : "Pause project slideshow"
      );
      slider.classList.toggle("is-user-paused", userPaused);
    }

    function hydrateSlide(slide) {
      var image = slide && slide.querySelector("img[data-src]");
      if (!image) return;
      image.src = image.dataset.src;
      image.removeAttribute("data-src");
    }

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      hydrateSlide(slides[index]);
      slides.forEach(function (slide, slideIndex) {
        var active = slideIndex === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });
      segments.forEach(function (segment, segmentIndex) {
        segment.classList.toggle("is-active", segmentIndex === index);
      });
      if (counter) {
        counter.textContent = String(index + 1).padStart(2, "0") + " / " +
          String(slides.length).padStart(2, "0") + " · Albedo project";
      }
      if (caption) caption.textContent = slides[index].dataset.caption || "";
      if (projectLink) projectLink.href = slides[index].dataset.project || "#projects";
    }

    function stop() {
      if (timer !== null) window.clearInterval(timer);
      if (initialDelay !== null) window.clearTimeout(initialDelay);
      timer = null;
      initialDelay = null;
    }

    function start() {
      stop();
      if (!prefersReducedMotion() && !isPaused() && slides.length > 1) {
        if (!autoplayStarted) {
          initialDelay = window.setTimeout(function () {
            initialDelay = null;
            autoplayStarted = true;
            start();
          }, 9000);
        } else {
          timer = window.setInterval(function () {
            show(index + 1);
          }, 6000);
        }
      }
    }

    function go(delta) {
      autoplayStarted = true;
      show(index + delta);
      start();
    }

    var previous = slider.querySelector(".alb-prev");
    var next = slider.querySelector(".alb-next");
    if (previous) previous.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    if (playbackToggle) {
      playbackToggle.addEventListener("click", function () {
        userPaused = !userPaused;
        autoplayStarted = true;
        updatePlaybackControl();
        if (userPaused) stop();
        else start();
      });
    }
    segments.forEach(function (segment) {
      segment.addEventListener("click", function () {
        autoplayStarted = true;
        show(Number(segment.dataset.slide));
        start();
      });
    });

    slider.addEventListener("mouseenter", function () {
      hovering = true;
      stop();
    });
    slider.addEventListener("mouseleave", function () {
      hovering = false;
      start();
    });
    slider.addEventListener("focusin", function () {
      focusing = true;
      stop();
    });
    slider.addEventListener("focusout", function (event) {
      if (!event.relatedTarget || !slider.contains(event.relatedTarget)) {
        focusing = false;
        start();
      }
    });
    slider.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      }
    });
    slider.addEventListener("pointerdown", function (event) {
      pointerStart = event.clientX;
    });
    slider.addEventListener("pointerup", function (event) {
      if (pointerStart === null) return;
      var delta = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(delta) >= 40) go(delta < 0 ? 1 : -1);
    });
    slider.addEventListener("pointercancel", function () {
      pointerStart = null;
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") stop();
      else start();
    });

    show(index);
    updatePlaybackControl();
    slider.classList.add("is-ready");
    start();
  }

  function findLocation(link) {
    var section = link.closest("[data-alb-section]");
    return section ? section.getAttribute("data-alb-section") : "unknown";
  }

  function scrollToEnquiry() {
    var target = document.querySelector("#enquire");
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start"
    });
    var firstField = target.querySelector("input:not([type='hidden']), select, textarea");
    if (firstField) firstField.focus({ preventScroll: true });
  }

  function initTracking() {
    if (document.documentElement.dataset.albTrackingReady === "true") return;
    document.documentElement.dataset.albTrackingReady = "true";
    window.dataLayer = window.dataLayer || [];

    document.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link) return;
      var href = link.getAttribute("href") || "";
      if (href.indexOf("https://wa.me/") === 0) {
        pushEvent({ event: "alb_whatsapp_click", location: findLocation(link) });
      } else if (href.indexOf("tel:") === 0) {
        pushEvent({ event: "alb_call_click", location: findLocation(link) });
      } else if (href === "#enquire") {
        event.preventDefault();
        pushEvent({
          event: "alb_cta_click",
          label: (link.textContent || "").trim().replace(/\s+/g, " ")
        });
        scrollToEnquiry();
      }
    });
  }

  function fieldSelector(name) {
    return '[name="' + name + '"], [name="form_fields[' + name + ']"], #form-field-' + name;
  }

  function initAttribution(root) {
    var params = new URLSearchParams(window.location.search);
    ATTRIBUTION_FIELDS.forEach(function (name) {
      var storageKey = "alb_" + name;
      var incoming = params.get(name);
      if (incoming) {
        try { window.sessionStorage.setItem(storageKey, incoming); } catch (error) {}
      }
      var value = incoming;
      if (!value) {
        try { value = window.sessionStorage.getItem(storageKey) || ""; } catch (error) { value = ""; }
      }
      nodesWithin(root, fieldSelector(name)).forEach(function (field) {
        field.value = value;
      });
    });
  }

  function leadPayload(form) {
    var propertyType = form.querySelector(fieldSelector("property_type"));
    var startWhen = form.querySelector(fieldSelector("start_when"));
    return {
      event: "alb_lead_submit",
      property_type: propertyType ? propertyType.value : "",
      start_when: startWhen ? startWhen.value : ""
    };
  }

  function initPreviewForm(form) {
    if (form.dataset.albReady === "true") return;
    form.dataset.albReady = "true";
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
      pushEvent(leadPayload(form));
      var status = form.querySelector('[role="status"]');
      if (status) {
        status.textContent = "Thank you! An Albedo designer will contact you shortly. Want a faster reply? WhatsApp us at 9669 9319.";
      }
    });
  }

  function initLazyImages(root) {
    nodesWithin(root, "img[data-alb-lazy]").forEach(function (image) {
      if (image.dataset.albLazyReady === "true") return;
      image.dataset.albLazyReady = "true";
      function hydrate() {
        if (!image.dataset.src) return;
        image.src = image.dataset.src;
        image.removeAttribute("data-src");
        image.removeAttribute("data-alb-lazy");
      }
      if (typeof window.IntersectionObserver !== "function") {
        hydrate();
        return;
      }
      var observer = new window.IntersectionObserver(function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        observer.disconnect();
        hydrate();
      }, { rootMargin: "300px 0px" });
      observer.observe(image);
    });
  }

  function installElementorSuccessBridge() {
    if (!window.jQuery || window.__albElementorSuccessReady) return;
    window.__albElementorSuccessReady = true;
    window.jQuery(document).on("submit_success", ".elementor-form", function () {
      pushEvent(leadPayload(this));
    });
  }

  function initElementor() {
    installElementorSuccessBridge();
    if (!window.elementorFrontend || !window.elementorFrontend.hooks) return;
    window.elementorFrontend.hooks.addAction("frontend/element_ready/html.default", function (scope) {
      initAll(scope && scope[0] ? scope[0] : scope);
    });
  }


  // ---------------------------------------------------------------------------
  // Real landed homes: type tabs, project detail dialogs, gallery, before/after.
  // ---------------------------------------------------------------------------
  function selectPropertyType(value) {
    if (!value) return;
    nodesWithin(document, fieldSelector("property_type")).forEach(function (field) {
      var match = Array.prototype.slice.call(field.options || []).some(function (option) {
        return (option.value || option.textContent) === value;
      });
      if (match) {
        field.value = value;
        field.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  function lockScroll(locked) {
    document.documentElement.style.overflow = locked ? "hidden" : "";
  }

  function openDialog(dialog, opener) {
    if (!dialog || dialog.open) return;
    dialog._albOpener = opener || document.activeElement;
    nodesWithin(dialog, "img[data-src]").forEach(function (image) {
      image.src = image.dataset.src;
      image.removeAttribute("data-src");
      image.removeAttribute("data-alb-lazy");
    });
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    lockScroll(true);
    var close = dialog.querySelector("[data-alb-dialog-close]");
    if (close) close.focus();
    pushEvent({ event: "alb_project_view", project: dialog.dataset.projectKey || dialog.id });
  }

  function closeDialog(dialog) {
    if (!dialog || !dialog.open) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    lockScroll(false);
  }

  function initDialog(dialog) {
    if (dialog.dataset.albReady === "true") return;
    dialog.dataset.albReady = "true";
    dialog.addEventListener("close", function () {
      lockScroll(false);
      var opener = dialog._albOpener;
      if (opener && typeof opener.focus === "function" && !dialog._albSkipFocus) opener.focus();
      dialog._albSkipFocus = false;
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeDialog(dialog);
      if (event.target.closest("[data-alb-dialog-close]")) closeDialog(dialog);
      var cta = event.target.closest("a[data-alb-property]");
      if (cta) {
        selectPropertyType(cta.dataset.albProperty);
        dialog._albSkipFocus = true;
        closeDialog(dialog);
      }
    });
    var track = dialog.querySelector(".alb-gallery__track");
    function step(direction) {
      if (!track) return;
      track.scrollBy({ left: direction * track.clientWidth, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
    var prev = dialog.querySelector(".alb-gallery__prev");
    var next = dialog.querySelector(".alb-gallery__next");
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
    nodesWithin(dialog, ".alb-compare").forEach(function (compare) {
      var range = compare.querySelector(".alb-compare__range");
      if (!range) return;
      function sync() { compare.style.setProperty("--alb-compare", range.value + "%"); }
      range.addEventListener("input", sync);
      sync();
    });
  }

  function initProjects(section) {
    if (section.dataset.albReady === "true") return;
    section.dataset.albReady = "true";
    var tabs = Array.prototype.slice.call(section.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute("aria-controls")); });
    if (!tabs.length || panels.some(function (panel) { return !panel; })) return;
    section.classList.add("is-tabbed");

    function activate(index, focus) {
      tabs.forEach(function (tab, i) {
        var selected = i === index;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.tabIndex = selected ? 0 : -1;
        panels[i].classList.toggle("is-active", selected);
        panels[i].hidden = !selected;
      });
      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { activate(index, false); });
      tab.addEventListener("keydown", function (event) {
        var target = null;
        if (event.key === "ArrowRight") target = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") target = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") target = 0;
        if (event.key === "End") target = tabs.length - 1;
        if (target === null) return;
        event.preventDefault();
        activate(target, true);
      });
    });

    nodesWithin(section, "dialog.alb-project-dialog").forEach(initDialog);
    section.addEventListener("click", function (event) {
      var opener = event.target.closest("[data-alb-dialog]");
      if (!opener) return;
      openDialog(document.getElementById(opener.getAttribute("data-alb-dialog")), opener);
    });

    function showProject(hash, scroll) {
      var index = panels.findIndex(function (panel) { return "#" + panel.id === hash; });
      if (index < 0) return false;
      activate(index, false);
      if (scroll) panels[index].scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      return true;
    }
    section._albShowProject = showProject;
    var initialIndex = panels.findIndex(function (panel) { return "#" + panel.id === window.location.hash; });
    activate(initialIndex >= 0 ? initialIndex : 0, false);
  }

  function initProjectLinks() {
    if (document.documentElement.dataset.albProjectLinksReady === "true") return;
    document.documentElement.dataset.albProjectLinksReady = "true";
    document.addEventListener("click", function (event) {
      var link = event.target.closest('a[href^="#project-"]');
      if (!link) return;
      var section = document.querySelector('[data-alb-section="projects"]');
      if (!section || typeof section._albShowProject !== "function") return;
      var hash = link.getAttribute("href");
      if (section._albShowProject(hash, true)) {
        event.preventDefault();
        if (window.history && typeof window.history.replaceState === "function") window.history.replaceState(null, "", hash);
      }
    });
  }

  function initAll(root) {
    var scope = root || document;
    nodesWithin(scope, ".alb-slider").forEach(initSlider);
    nodesWithin(scope, "[data-alb-preview-form]").forEach(initPreviewForm);
    nodesWithin(scope, '[data-alb-section="projects"]').forEach(initProjects);
    initProjectLinks();
    initLazyImages(scope);
    initAttribution(scope);
    initTracking();
    installElementorSuccessBridge();
  }

  window.AlbedoLanding = {
    initAll: initAll
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { initAll(document); });
  } else {
    initAll(document);
  }
  window.addEventListener("elementor/frontend/init", initElementor);
}());
