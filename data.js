// ============================================================================
// data.js — طبقة الوصول للبيانات (Data Access Layer)
//
// لم تعد هذه الطبقة تتحدث مع Firestore مباشرة من المتصفح إطلاقًا — كل شي يمر
// عبر الـ Backend API (انظر مجلد backend/) الذي يحمل مفاتيح Firebase الحقيقية
// ويتحقق من الصلاحيات. باقي الملفات (app.js) لا تعرف شيئًا عن هذا التفصيل —
// تتعامل فقط مع الدوال أدناه، تمامًا كما كانت تتعامل مع DataLayer القديم.
// ============================================================================

const DataLayer = (() => {
  // يمكن ضبط API_BASE من index.html عبر window.__API_BASE__ (مثلًا لو الواجهة
  // والـ Backend على نطاقين مختلفين على Render). الافتراضي: نفس النطاق، /api.
  const API_BASE = (window.__API_BASE__ || "/api").replace(/\/+$/, "");

  const TOKEN_KEY = "aah_amb_identity"; // نفس المفتاح المستخدم في app.js لتخزين الهوية

  function getToken() {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const identity = JSON.parse(raw);
      return identity && identity.token ? identity.token : null;
    } catch (e) { return null; }
  }

  async function request(path, { method = "GET", body, auth = false } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth) {
      const token = getToken();
      if (token) headers["Authorization"] = "Bearer " + token;
    }
    let res;
    try {
      res = await fetch(API_BASE + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      throw new Error("تعذّر الاتصال بالسيرفر. تحقق من اتصالك بالإنترنت.");
    }
    let json = null;
    try { json = await res.json(); } catch (e) { /* رد بدون محتوى */ }
    if (!res.ok) {
      const msg = (json && json.error) || `خطأ غير متوقع (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return json;
  }

  // =========================================================================
  // تسجيل دخول السفراء — يستبدل كود الوصول المشترك القديم بكلمة مرور فردية
  // محققة من السيرفر، ويُخزَّن JWT محليًا للاستخدام في الطلبات اللاحقة.
  // =========================================================================
  const auth = {
    async login(ambassadorId, password) {
      return request("/auth/login", { method: "POST", body: { ambassadorId, password } });
    },
    async changePassword(oldPassword, newPassword) {
      return request("/auth/change-password", { method: "POST", auth: true, body: { oldPassword, newPassword } });
    },
  };

  // الأرقام المرجعية أصبح توليدها بالكامل من السيرفر ضمن إنشاء التحدي/`الطلب
  // (لم تعد هناك حساجة لنداء منفصل من الواجهة الأمامية).

  // =========================================================================
  // السفراء — قائمة عامة (بدون تسجيل دخول) لتعبئة قوائم الاختيار فقط.
  // =========================================================================
  const ambassadors = {
    async list() {
      return request("/ambassadors");
    },
    subscribeAll(cb, onError) {
      let stopped = false;
      const tick = () => {
        ambassadors.list().then((list) => { if (!stopped) cb(list); }).catch((err) => { if (!stopped && onError) onError(err); });
      };
      tick();
      const interval = setInterval(tick, 20000);
      return () => { stopped = true; clearInterval(interval); };
    },
  };

  // =========================================================================
  // أدوات مشتركة بين التحديات وطلبات المشاركة - نفس الواجهة القديٟة تمامًا,
  // لكن كل عملية الآن طلب HTTP للـ Backend بدل نداء Firestore مباشرر.
  // =========================================================================
  function buildHistoryHelpers(basePath) {
    return {
      // create(refNumber, data) — يُستخدم الآن بشكل مختلف: السيرفر هو من يولّد
      // الرقم المرجعي وينشئ السجل دفعة واحدة من بيانات النموذج الخام.
      async create(formFields) {
        return request(basePath, { method: "POST", body: formFields });
      },
      async listAll() {
        return request(basePath, { auth: true });
      },
      subscribeAll(cb, onError) {
        let stopped = false;
        const tick = () => {
          request(basePath, { auth: true }).then((list) => { if (!stopped) cb(list); }).catch((err) => { if (!stopped && onError) onError(err); });
        };
        tick();
        const interval = setInterval(tick, 15000);
        return () => { stopped = true; clearInterval(interval); };
      },
      async changeStatus(id, { to, closureReason }) {
        await request(`${basePath}/${encodeURIComponent(id)}/status`, { method: "PATCH", auth: true, body: { status: to, closureReason } });
      },
      async addNote(id, note) {
        await request(`${basePath}/${encodeURIComponent(id)}/notes`, { method: "POST", auth: true, body: { text: note.text } });
      },
      async reassign(id, { to, toName, reason, reasonOther }) {
        await request(`${basePath}/${encodeURIComponent(id)}/reassign`, { method: "PATCH", auth: true, body: { to, toName, reason, reasonOther } });
      },
    };
  }

  const challenges = buildHistoryHelpers("/challenges");
  const participation = buildHistoryHelpers("/participation");

  return { auth, ambassadors, challenges, participation };
})();
