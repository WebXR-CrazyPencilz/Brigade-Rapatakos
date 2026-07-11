/**
 * lead.js
 * ─────────────────────────────────────────────────────────────
 * Frontend lead-collection logic.
 *
 * Flow:
 *   Submit clicked → validate → build payload → POST to Apps Script
 *   → on success: hide form, start the interactive experience
 *   → on failure: show a friendly error, keep the entered values
 *
 * Depends on CONFIG from config.js (load config.js first).
 *
 * Expects this HTML structure (adjust the SELECTORS block below if
 * your markup uses different ids):
 *
 *   <form id="leadForm">
 *     <div id="lead-error" style="display:none;"></div>
 *     <input id="Name" />
 *     <input id="Phone" />
 *     <input id="Email" />
 *     <button id="submitLeadBtn" type="submit">Submit</button>
 *   </form>
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // ── SELECTORS ────────────────────────────────────────────
  // Centralised so the rest of the file never repeats a raw id string.
  const SELECTORS = {
    form: 'leadForm',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    error: 'lead-error',
    submitBtn: 'submitLeadBtn'
  };

  // Guards against double submits (double click, double Enter, etc.)
  let isSubmitting = false;


  // ── DOM HELPERS ──────────────────────────────────────────
  function $(id) {
    return document.getElementById(id);
  }

  function showError(message) {
    const el = $(SELECTORS.error);
    if (!el) return;
    el.textContent = message;
    el.style.display = '';
  }

  function hideError() {
    const el = $(SELECTORS.error);
    if (!el) return;
    el.style.display = 'none';
  }

  function setSubmitting(loading) {
    const btn = $(SELECTORS.submitBtn);
    if (!btn) return;
    btn.disabled = loading;
    btn.dataset.originalLabel = btn.dataset.originalLabel || btn.textContent || btn.value || 'Submit';
    const label = loading ? 'Submitting…' : btn.dataset.originalLabel;
    if ('value' in btn) btn.value = label;
    else btn.textContent = label;
  }


  // ── VALIDATION ───────────────────────────────────────────
  function trim(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function digitsOnly(value) {
    return (value || '').replace(/\D/g, '');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Reads and trims the raw field values from the form.
   */
  function readFormValues() {
    return {
      name: trim($(SELECTORS.name)?.value),
      phone: trim($(SELECTORS.phone)?.value),
      email: trim($(SELECTORS.email)?.value)
    };
  }

  /**
   * Validates the trimmed form values.
   * Returns the first error message found, or null if valid.
   */
  function validate(values) {
    if (!values.name) return 'Name is required.';
    if (!values.phone) return 'Phone number is required.';
    if (!values.email) return 'Email address is required.';

    const phoneDigits = digitsOnly(values.phone);
    if (phoneDigits.length < 10) return 'Phone number must have at least 10 digits.';

    if (!isValidEmail(values.email)) return 'Please enter a valid email address.';

    return null;
  }


  // ── DEVICE / BROWSER / OS DETECTION ─────────────────────
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/iPad|Tablet/i.test(ua)) return 'Tablet';
    if (/Mobi|Android/i.test(ua)) return 'Mobile';
    return 'Desktop';
  }

  function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    return 'Other';
  }

  function getOperatingSystem() {
    const ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) return 'macOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Other';
  }


  // ── PAYLOAD ──────────────────────────────────────────────
  function buildPayload(values) {
    return {
      secret: CONFIG.SECRET_KEY,
      name: values.name,
      phone: values.phone,
      email: values.email,
      timestamp: new Date().toISOString(),
      browser: getBrowserName(),
      device: getDeviceType(),
      os: getOperatingSystem(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      screen: `${window.screen.width}×${window.screen.height}`,
      url: window.location.href,
      referrer: document.referrer || 'direct'
    };
  }


  // ── SUBMIT ───────────────────────────────────────────────
  /**
   * Sends the payload to the Apps Script Web App.
   *
   * IMPORTANT — Content-Type note:
   * Apps Script Web Apps don't respond to CORS preflight (OPTIONS)
   * requests, and "Content-Type: application/json" triggers a
   * preflight in every browser. Sending "text/plain;charset=utf-8"
   * instead avoids the preflight entirely — Apps Script still parses
   * the body as JSON via JSON.parse(e.postData.contents), so nothing
   * on the backend needs to change. This is the standard workaround
   * for calling Apps Script Web Apps directly from browser JS.
   */
  async function submitLead(payload) {
    const response = await fetch(CONFIG.WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Request failed with status ' + response.status);
    }

    const result = await response.json();

    if (!result || result.success !== true) {
      throw new Error((result && result.message) || 'Could not submit your details.');
    }

    return result;
  }

  /**
   * Called once the lead has been saved successfully.
   * Hides the form and starts the interactive experience.
   */
  function onSubmitSuccess() {
    const form = $(SELECTORS.form);
    if (form) form.style.display = 'none';

    // Prefer an existing gate-dismiss function if the page defines one
    // (keeps this file decoupled from the rest of the page's markup).
    if (typeof window.dismissGateAndStart === 'function') {
      window.dismissGateAndStart();
    } else if (typeof window.startApp === 'function') {
      window.startApp();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    hideError();

    const values = readFormValues();
    const validationError = validate(values);
    if (validationError) {
      showError(validationError);
      return;
    }

    if (!CONFIG.WEB_APP_URL) {
      showError('Lead form is not configured yet. Please set CONFIG.WEB_APP_URL.');
      return;
    }

    isSubmitting = true;
    setSubmitting(true);

    try {
      const payload = buildPayload(values);
      await submitLead(payload);
      onSubmitSuccess();
      // Deliberately not resetting isSubmitting here — the form is
      // being hidden/torn down, so there's nothing left to re-submit.
    } catch (err) {
      console.error('❌ Lead submission failed:', err.message);
      showError('Something went wrong. Please try again.');
      // Form values are intentionally left untouched so the user
      // doesn't have to re-type everything.
      isSubmitting = false;
      setSubmitting(false);
    }
  }


  // ── INIT ─────────────────────────────────────────────────
  function init() {
    const form = $(SELECTORS.form);
    if (!form) return;
    form.addEventListener('submit', handleSubmit);
  }

  document.addEventListener('DOMContentLoaded', init);
})();