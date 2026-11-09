(function () {
  "use strict";
  if (window.__albWordPressReady) return;
  window.__albWordPressReady = true;

  // CF7 emits this event only after its server reports mail_sent. Never track
  // invalid, spam, mailfailed, generic submit, or preview-form success here.
  document.addEventListener("wpcf7mailsent", function (event) {
    var wrapper = event.target;
    if (!wrapper || !wrapper.closest || !wrapper.closest(".alb-wp-page #enquire")) return;
    var detail = event.detail || {};
    var fields = {};
    (detail.inputs || []).forEach(function (field) { fields[field.name] = field.value; });
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "alb_lead_submit",
      property_type: fields.property_type || "",
      promo_opt_in: fields.promo_opt_in || ""
    });
  });
})();
