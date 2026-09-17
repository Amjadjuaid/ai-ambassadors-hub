// ============================================================================
// تهيئة Firebase — طبقة اتصال فقط، لا منطق عمل هنا.
// يستخدم Firebase SDK (compat) عبر CDN — لا حاجة لأي أدوات بناء (build tools).
// ============================================================================
(function () {
  const isPlaceholder =
    typeof FIREBASE_CONFIG === "undefined" ||
    !FIREBASE_CONFIG ||
    FIREBASE_CONFIG.apiKey === "PASTE_API_KEY_HERE" ||
    !FIREBASE_CONFIG.apiKey;

  if (isPlaceholder) {
    // لم يتم ضبط إعدادات Firebase بعد — نعرض تنبيهًا واضحًا بدل فشل صامت
    window.__FIREBASE_READY__ = false;
    document.addEventListener("DOMContentLoaded", () => {
      const el = document.createElement("div");
      el.className = "config-banner";
      el.innerHTML =
        '<strong>إعداد أولي مطلوب:</strong> لم يتم ربط قاعدة البيانات بعد. ' +
        "افتح ملف <code>firebase-config.js</code> وضع بيانات مشروع Firebase الخاص بك. " +
        "راجع <code>README.md</code> للخطوات.";
      document.body.prepend(el);
    });
    return;
  }

  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    window.__FSDB__ = firebase.firestore();
    window.__FIREBASE_READY__ = true;
  } catch (e) {
    console.error("Firebase init failed", e);
    window.__FIREBASE_READY__ = false;
  }
})();
