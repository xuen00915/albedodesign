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
        status.textContent = "Thank you! An Albedo designer will contact you within [1 working day]. Want a faster reply? WhatsApp us at 9669 9319.";
      }
    });
  }

  function initLazyImages(root) {
    nodesWithin(root, "img[data-alb-lazy]").forEach(function (image) {
      if (image.dataset.albLazyReady === "true") return;
      image.dataset.albLazyReady = "true";
      function hydrate() {
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

  function initAll(root) {
    var scope = root || document;
    nodesWithin(scope, ".alb-slider").forEach(initSlider);
    nodesWithin(scope, "[data-alb-preview-form]").forEach(initPreviewForm);
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
