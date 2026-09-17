// ============================================================================
// app.js — التوجيه (Router) وكل واجهات العرض والتفاعل.
// SPA بسيطة بدون أي إطار عمل: hash router + innerHTML rendering + event
// delegation. مصممة لتبقى قابلة للقراءة والتعديل من غير مطوّر متمرّس.
// ============================================================================

const State = {
  employee: null,
  ambIdentity: null,
  ambUnlocked: false,
  requests: [],
  ambassadors: [],
  clusters: [],
  loaded: { requests: false, ambassadors: false, clusters: false },
};

// مسارات لا يُعاد رسمها تلقائيًا عند وصول بيانات جديدة (حتى لا تُفقد مدخلات
// المستخدم الجارية في نموذج مفتوح)
const NO_AUTO_RERENDER = new Set(["submit", "workspace-hours"]);
let currentRouteKey = "";

// ---------------------------------------------------------------------------
// تخزين الهوية محليًا (على هذا الجهاز فقط — وليس بديلاً عن قاعدة البيانات)
// ---------------------------------------------------------------------------
function loadLocalIdentities() {
  try {
    const emp = localStorage.getItem("aah_employee");
    if (emp) State.employee = JSON.parse(emp);
    const amb = localStorage.getItem("aah_amb_identity");
    if (amb) State.ambIdentity = JSON.parse(amb);
    State.ambUnlocked = localStorage.getItem("aah_amb_unlocked") === "1";
  } catch (e) { /* تجاهل أخطاء التخزين المحلي (وضع خاص مثلًا) */ }
}
function saveLocalEmployee(emp) {
  State.employee = emp;
  try { localStorage.setItem("aah_employee", JSON.stringify(emp)); } catch (e) {}
}
function clearLocalEmployee() {
  State.employee = null;
  try { localStorage.removeItem("aah_employee"); } catch (e) {}
}
function saveLocalAmbassador(identity) {
  State.ambIdentity = identity;
  State.ambUnlocked = true;
  try {
    localStorage.setItem("aah_amb_identity", JSON.stringify(identity));
    localStorage.setItem("aah_amb_unlocked", "1");
  } catch (e) {}
}
function clearLocalAmbassador() {
  State.ambIdentity = null;
  State.ambUnlocked = false;
  try {
    localStorage.removeItem("aah_amb_identity");
    localStorage.removeItem("aah_amb_unlocked");
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// أدوات عامة: تنقّل، إشعارات، نوافذ منبثقة
// ---------------------------------------------------------------------------
function navigate(hash) { location.hash = hash; }
function toast(message, type) {
  const root = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = "toast" + (type === "error" ? " error" : "");
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3400);
}
function openModal(html) {
  document.getElementById("modal-root").innerHTML =
    `<div class="modal-overlay" data-action="closeModalOverlay">
       <div class="modal-box" data-action="noop">
         <div class="flex-between" style="margin-bottom:10px;">
           <div></div>
           <button class="btn btn-ghost btn-sm" data-action="closeModal" type="button">✕ إغلاق</button>
         </div>
         ${html}
       </div>
     </div>`;
}
function closeModal() { document.getElementById("modal-root").innerHTML = ""; }

// ---------------------------------------------------------------------------
// دوال مساعدة على البيانات
// ---------------------------------------------------------------------------
function getAmbassadorById(id) { return State.ambassadors.find((a) => a.id === id) || null; }
function getRequestById(id) { return State.requests.find((r) => r.id === id) || null; }
function getClusterById(id) { return State.clusters.find((c) => c.id === id) || null; }
function isOpenStatus(status) { return status !== "completed" && status !== "closed"; }
function openCountForAmbassador(ambId) {
  return State.requests.filter((r) => r.assignedAmbassadorId === ambId && isOpenStatus(r.status)).length;
}
function requestsForCluster(cluster) {
  return (cluster.requestIds || []).map(getRequestById).filter(Boolean);
}
function deptCountForCluster(cluster) {
  const depts = new Set(requestsForCluster(cluster).map((r) => r.department).filter(Boolean));
  return depts.size;
}
function initials(name) { return (name || "؟").trim().charAt(0); }

// ---------------------------------------------------------------------------
// مكوّنات HTML قابلة لإعادة الاستخدام
// ---------------------------------------------------------------------------
function statusBadge(statusId) {
  return `<span class="badge ${statusColor(statusId)}">${escapeHtml(statusLabel(statusId))}</span>`;
}
function demoBadge(isDemo) {
  return isDemo ? `<span class="badge badge-demo">بيانات تجريبية</span>` : "";
}
function pillGroup(name, options, selectedValue, required) {
  return `<div class="choice-group" role="radiogroup">${options
    .map((opt, i) => `
      <label class="choice-pill">
        <input type="radio" name="${name}" value="${escapeHtml(opt)}" ${opt === selectedValue ? "checked" : ""} ${required ? "required" : ""}/>
        ${escapeHtml(opt)}
      </label>`)
    .join("")}</div>`;
}
function selectOptions(items, valueKey, labelKey, selected, placeholder) {
  const opts = items.map((it) => {
    const v = valueKey ? it[valueKey] : it;
    const l = labelKey ? it[labelKey] : it;
    return `<option value="${escapeHtml(v)}" ${String(v) === String(selected) ? "selected" : ""}>${escapeHtml(l)}</option>`;
  });
  return (placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : "") + opts.join("");
}

function ambassadorCardHtml(amb) {
  const openCount = openCountForAmbassador(amb.id);
  return `
    <div class="card amb-card">
      ${demoBadge(amb.isDemo)}
      <div class="amb-head">
        <div class="amb-avatar">${escapeHtml(initials(amb.name))}</div>
        <div>
          <div class="amb-name">${escapeHtml(amb.name)}</div>
          <div class="amb-dept">${escapeHtml(amb.department)}</div>
        </div>
      </div>
      <div class="amb-track">${escapeHtml(amb.track || "")}</div>
      <div class="amb-areas">${(amb.helpAreas || []).map((a) => `<span class="tag">${escapeHtml(a)}</span>`).join("")}</div>
      <div class="amb-footer">
        <span class="open-count"><b>${openCount}</b> طلب مفتوح</span>
        <a class="btn btn-outline btn-sm" href="#/ambassador/${encodeURIComponent(amb.id)}">عرض الملف</a>
      </div>
    </div>`;
}

function requestCardHtml(req, opts) {
  opts = opts || {};
  const href = opts.workspace ? `#/workspace/requests/${encodeURIComponent(req.id)}` : `#/request/${encodeURIComponent(req.id)}`;
  const metaExtra = opts.workspace
    ? `<span>${escapeHtml(req.employeeName || "—")} · ${escapeHtml(req.department || "—")}</span>`
    : "";
  return `
    <a class="card req-card" href="${href}" style="text-decoration:none;color:inherit;display:block;">
      <div class="req-top">
        <div class="req-title">${escapeHtml(req.title)}</div>
        ${statusBadge(req.status)}
      </div>
      <div class="req-meta">
        ${metaExtra}
        <span>${escapeHtml(categoryLabel(req.category) || "غير مصنف")}</span>
        <span>${escapeHtml(req.assignedAmbassadorName ? "السفير: " + req.assignedAmbassadorName : "غير معيّن")}</span>
        <span>${formatDate(req.createdAt)}</span>
        <span class="req-id">${escapeHtml(req.id)}</span>
        ${req.duplicateOf ? '<span class="badge badge-outline">مكرر</span>' : ""}
        ${demoBadge(req.isDemo)}
      </div>
    </a>`;
}

function timelineHtml(req) {
  const items = [];
  items.push({ title: "تم إنشاء الطلب", at: req.createdAt, text: "الحالة الأولية: " + statusLabel("new") });
  (req.updates || []).forEach((u) => items.push({ title: "تحديث من السفير", at: u.at, text: u.text }));
  items.sort((a, b) => (a.at || "").localeCompare(b.at || ""));
  items.push({ title: "الحالة الحالية: " + statusLabel(req.status), at: req.updatedAt, text: "", current: true });
  return `<div class="timeline">${items
    .map(
      (it) => `
      <div class="timeline-item ${it.current ? "" : "faded"}">
        <div class="timeline-dot"></div>
        <div class="timeline-body">
          <div class="timeline-title">${escapeHtml(it.title)}</div>
          <div class="timeline-date">${formatDateTime(it.at)}</div>
          ${it.text ? `<div class="timeline-text">${escapeHtml(it.text)}</div>` : ""}
        </div>
      </div>`
    )
    .join("")}</div>`;
}

// ---------------------------------------------------------------------------
// الهيدر (شريط التنقل)
// ---------------------------------------------------------------------------
function renderHeader(parts) {
  const active = parts[0] || "home";
  const link = (key, hash, label) =>
    `<a href="${hash}" class="${active === key ? "active" : ""}">${label}</a>`;

  let ambBox = "";
  if (State.ambUnlocked && State.ambIdentity) {
    ambBox = `
      <span class="text-faint" style="margin-inline-start:8px;">
        سفير: <b>${escapeHtml(State.ambIdentity.name)}</b>
        · <button class="nav-link" data-action="logoutAmbassador" type="button" style="padding:0;font-weight:700;">خروج</button>
      </span>`;
  }

  document.getElementById("site-header").innerHTML = `
    <div class="header-inner">
      <a href="#/" class="brand" style="text-decoration:none;">
        <span class="brand-badge">🤖</span>
        <span>
          سفراء الذكاء الاصطناعي
          <div class="brand-sub">AI Ambassadors Hub — نسخة تجريبية</div>
        </span>
      </a>
      <nav class="nav">
        ${link("home", "#/", "الرئيسية")}
        ${link("submit", "#/submit", "شارك تحدي")}
        ${link("ambassadors", "#/ambassadors", "السفراء")}
        ${link("my-requests", "#/my-requests", "طلباتي")}
        <a href="#/workspace" class="workspace-link ${active === "workspace" ? "active" : ""}">
          <span class="lock-icon">🔒</span> مساحة السفراء
        </a>
        ${ambBox}
      </nav>
    </div>`;
}

// ---------------------------------------------------------------------------
// مسارات: تحليل الـ hash
// ---------------------------------------------------------------------------
function parseHash() {
  let h = location.hash || "";
  h = h.replace(/^#\/?/, "");
  const [pathPart, queryPart] = h.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  const query = {};
  if (queryPart) {
    queryPart.split("&").forEach((kv) => {
      const [k, v] = kv.split("=");
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
  }
  return { parts, query };
}

// ---------------------------------------------------------------------------
// الصفحة الرئيسية
// ---------------------------------------------------------------------------
function pageHome() {
  if (!State.employee) {
    return `
      <div class="hero">
        <h1>حوّل تحديات العمل إلى فرص بالذكاء الاصطناعي</h1>
        <p class="lead">شاركنا التحدي الذي تواجهه في عملك، وسيساعدك سفراء الذكاء الاصطناعي في اكتشاف أفضل طريقة لمعالجته.</p>
      </div>
      <div class="card" style="max-width:460px;margin:0 auto;">
        <h3>مرحبًا بك — لنبدأ بتعريف بسيط</h3>
        <p class="text-muted" style="font-size:13.5px;">بيانات سريعة لمرة واحدة فقط، بدون كلمة مرور.</p>
        ${registerFormHtml()}
      </div>`;
  }
  return `
    <div class="hero">
      <h1>حوّل تحديات العمل إلى فرص بالذكاء الاصطناعي</h1>
      <p class="lead">شاركنا التحدي الذي تواجهه في عملك، وسيساعدك سفراء الذكاء الاصطناعي في اكتشاف أفضل طريقة لمعالجته.</p>
      <p class="text-muted">أهلًا، <b>${escapeHtml(State.employee.name)}</b> — ${escapeHtml(State.employee.department)}
        · <button class="btn-ghost btn-sm" data-action="switchEmployee" type="button" style="border:none;background:none;cursor:pointer;text-decoration:underline;">ليس أنت؟ تبديل الحساب</button>
      </p>
    </div>
    <div class="action-grid">
      <a class="action-card" href="#/submit"><span class="icon">📝</span><div class="title">شارك تحدي</div><div class="desc">أقل من دقيقتين</div></a>
      <a class="action-card" href="#/ambassadors"><span class="icon">🧭</span><div class="title">اطلب مساعدة</div><div class="desc">تواصل مباشرة مع سفير</div></a>
      <a class="action-card" href="#/ambassadors"><span class="icon">👥</span><div class="title">تعرف على السفراء</div><div class="desc">دليل السفراء العشرة</div></a>
      <a class="action-card" href="#/my-requests"><span class="icon">📋</span><div class="title">تابع طلباتك</div><div class="desc">حالة كل طلباتك</div></a>
    </div>`;
}

function registerFormHtml(hiddenNext) {
  return `
    <form data-form="registerEmployee">
      ${hiddenNext ? `<input type="hidden" name="next" value="${escapeHtml(hiddenNext)}"/>` : ""}
      <div class="form-group">
        <label class="field-label">الاسم الثنائي</label>
        <input type="text" name="name" required placeholder="مثال: عبدالله الأحمدي" />
      </div>
      <div class="form-group">
        <label class="field-label">الرقم الوظيفي</label>
        <input type="text" name="employeeId" required placeholder="مثال: 90045" />
        <div class="field-hint">يُستخدم فقط لتحديد طلباتك لاحقًا، ولا يظهر في أي إحصاءات عامة.</div>
      </div>
      <div class="form-group">
        <label class="field-label">الإدارة</label>
        <select name="department" required>${selectOptions(DEPARTMENTS, null, null, null, "اختر إدارتك")}</select>
      </div>
      <button class="btn btn-primary btn-block" type="submit">متابعة</button>
    </form>`;
}

// ---------------------------------------------------------------------------
// شارك تحدي
// ---------------------------------------------------------------------------
function pageSubmit(query) {
  if (!State.employee) {
    return `<div class="page-title-row"><h2>شارك تحدي</h2></div>
      <div class="card" style="max-width:460px;">
        <p class="text-muted">سجّل بياناتك أولًا (لمرة واحدة) لمتابعة مشاركة التحدي.</p>
        ${registerFormHtml("submit")}
      </div>`;
  }

  const amb = query.amb ? getAmbassadorById(query.amb) : null;
  const isConsult = query.consult === "1" && amb;

  let banner = "";
  if (amb && !isConsult) {
    banner = `<div class="notice-box" style="margin-bottom:16px;">🎯 سيتم توجيه هذا الطلب مباشرة إلى السفير <b>${escapeHtml(amb.name)}</b> (${escapeHtml(amb.department)}).</div>`;
  } else if (isConsult) {
    banner = `<div class="notice-box" style="margin-bottom:16px;">📅 طلب استشارة مع <b>${escapeHtml(amb.name)}</b> — الموعد: ${escapeHtml(query.day || "")} ${escapeHtml(query.start || "")}–${escapeHtml(query.end || "")}</div>`;
  }

  return `
    <div class="page-title-row"><h2>شارك تحدي</h2></div>
    <div class="notice-box" style="margin-bottom:20px;">⚠️ يرجى عدم إدخال بيانات سرية أو معلومات حساسة ضمن وصف التحدي.</div>
    ${banner}
    <form data-form="submitChallenge" class="card" style="max-width:640px;">
      <input type="hidden" name="amb" value="${amb ? escapeHtml(amb.id) : ""}"/>
      <input type="hidden" name="ambName" value="${amb ? escapeHtml(amb.name) : ""}"/>
      <input type="hidden" name="isConsult" value="${isConsult ? "1" : ""}"/>
      <input type="hidden" name="slot" value="${isConsult ? escapeHtml((query.day || "") + " " + (query.start || "") + "–" + (query.end || "")) : ""}"/>

      <div class="form-group">
        <label class="field-label">عنوان التحدي</label>
        <input type="text" name="title" required placeholder="مثال: إعداد التقرير الأسبوعي يدويًا" />
      </div>
      <div class="form-group">
        <label class="field-label">ما المهمة أو المشكلة التي تستهلك وقتك؟</label>
        <textarea name="description" required placeholder="اشرح التحدي باختصار"></textarea>
      </div>
      <div class="form-group">
        <label class="field-label">كيف تنفذ هذه المهمة حاليًا؟</label>
        <textarea name="currentMethod" required placeholder="الطريقة الحالية خطوة بخطوة"></textarea>
      </div>
      <div class="form-group">
        <label class="field-label">كم تتكرر؟</label>
        ${pillGroup("frequency", FREQUENCIES, null, true)}
      </div>
      <div class="form-group">
        <label class="field-label">تقريبًا كم تستغرق منك؟</label>
        <input type="text" name="timeSpent" required placeholder="مثال: ساعة يوميًا" />
      </div>
      <div class="form-group">
        <label class="field-label">من يتأثر بهذا التحدي؟</label>
        ${pillGroup("affectedScope", SCOPES, null, true)}
      </div>
      <div class="form-group">
        <label class="field-label">ما نوع المساعدة التي تبحث عنها؟</label>
        ${pillGroup("helpType", HELP_TYPES, null, true)}
      </div>
      <button class="btn btn-primary btn-block" type="submit">إرسال الطلب</button>
    </form>`;
}

// ---------------------------------------------------------------------------
// دليل السفراء
// ---------------------------------------------------------------------------
function pageAmbassadorsList() {
  if (!State.loaded.ambassadors) return loadingHtml();
  return `
    <div class="page-title-row"><h2>سفراء الذكاء الاصطناعي</h2><span class="text-faint">${State.ambassadors.length} سفير</span></div>
    <div class="grid grid-3">${State.ambassadors.map(ambassadorCardHtml).join("")}</div>`;
}

function pageAmbassadorProfile(id) {
  if (!State.loaded.ambassadors) return loadingHtml();
  const amb = getAmbassadorById(id);
  if (!amb) return notFoundHtml("السفير غير موجود");
  const openCount = openCountForAmbassador(amb.id);
  return `
    <div class="breadcrumb"><a href="#/ambassadors">السفراء</a> / ${escapeHtml(amb.name)}</div>
    <div class="card" style="margin-bottom:20px;">
      <div class="amb-head" style="margin-bottom:14px;">
        <div class="amb-avatar" style="width:58px;height:58px;font-size:22px;">${escapeHtml(initials(amb.name))}</div>
        <div>
          <h2 style="margin-bottom:2px;">${escapeHtml(amb.name)}</h2>
          <div class="amb-dept">${escapeHtml(amb.department)} · ${escapeHtml(amb.track || "")}</div>
        </div>
      </div>
      <div class="amb-areas" style="margin-bottom:14px;">${(amb.helpAreas || []).map((a) => `<span class="tag">${escapeHtml(a)}</span>`).join("")}</div>
      <div class="flex-between">
        <span class="open-count"><b>${openCount}</b> طلب مفتوح حاليًا</span>
        <a class="btn btn-accent" href="#/submit?amb=${encodeURIComponent(amb.id)}">طلب مساعدة</a>
      </div>
    </div>
    <div class="card">
      <h3>ساعات السفير المكتبية</h3>
      ${(amb.officeHours || []).length === 0
        ? `<p class="text-faint">لم يتم تحديد ساعات مكتبية بعد.</p>`
        : (amb.officeHours || [])
            .map(
              (h) => `
          <div class="flex-between" style="padding:10px 0;border-bottom:1px dashed var(--border);">
            <span><b>${escapeHtml(h.day)}</b> · ${escapeHtml(h.start)}–${escapeHtml(h.end)}</span>
            <a class="btn btn-outline btn-sm" href="#/submit?amb=${encodeURIComponent(amb.id)}&consult=1&day=${encodeURIComponent(h.day)}&start=${encodeURIComponent(h.start)}&end=${encodeURIComponent(h.end)}">طلب استشارة</a>
          </div>`
            )
            .join("")}
    </div>`;
}

// ---------------------------------------------------------------------------
// طلباتي
// ---------------------------------------------------------------------------
function pageMyRequests() {
  if (!State.employee) {
    return `
      <div class="page-title-row"><h2>طلباتي</h2></div>
      <div class="card" style="max-width:420px;">
        <p class="text-muted">أدخل رقمك الوظيفي لعرض طلباتك، أو سجّل بيانات جديدة.</p>
        <form data-form="lookupEmployee">
          <div class="form-group">
            <label class="field-label">الرقم الوظيفي</label>
            <input type="text" name="employeeId" required placeholder="مثال: 90045" />
          </div>
          <button class="btn btn-primary btn-block" type="submit">عرض طلباتي</button>
        </form>
        <div class="divider"></div>
        <p class="text-faint" style="margin-bottom:8px;">مستخدم جديد؟</p>
        ${registerFormHtml()}
      </div>`;
  }
  if (!State.loaded.requests) return loadingHtml();
  const mine = State.requests.filter((r) => r.employeeId === State.employee.employeeId);
  return `
    <div class="page-title-row">
      <h2>طلباتي</h2>
      <a class="btn btn-primary" href="#/submit">+ شارك تحدي جديد</a>
    </div>
    <p class="text-faint" style="margin-bottom:16px;">
      ${escapeHtml(State.employee.name)} · ${escapeHtml(State.employee.department)}
      · <button class="btn-ghost btn-sm" data-action="switchEmployee" type="button" style="border:none;background:none;cursor:pointer;text-decoration:underline;padding:0;">ليس أنت؟</button>
    </p>
    ${mine.length === 0
      ? emptyStateHtml("📭", "لا توجد طلبات بعد", "ابدأ بمشاركة أول تحدٍ يواجهك في عملك.")
      : `<div class="grid grid-2">${mine.map((r) => requestCardHtml(r, { workspace: false })).join("")}</div>`}
  `;
}

function pageRequestDetail(id, query) {
  if (!State.loaded.requests) return loadingHtml();
  const req = getRequestById(id);
  if (!req) return notFoundHtml("لم يتم العثور على هذا الطلب");
  const justSubmitted = query.justSubmitted === "1";
  return `
    <div class="breadcrumb"><a href="#/my-requests">طلباتي</a> / ${escapeHtml(req.id)}</div>
    ${justSubmitted ? `<div class="notice-box" style="background:var(--status-done-bg);border-color:#bfe3c9;color:var(--status-done-fg);margin-bottom:16px;">✅ تم استلام طلبك بنجاح. سيتواصل معك السفير المختص قريبًا.</div>` : ""}
    <div class="page-title-row">
      <div>
        <h2 style="margin-bottom:6px;">${escapeHtml(req.title)}</h2>
        <div style="display:flex;gap:8px;align-items:center;">${statusBadge(req.status)} ${demoBadge(req.isDemo)}</div>
      </div>
    </div>
    ${req.consultationSlot ? `<div class="notice-box" style="margin-bottom:16px;">📅 موعد الاستشارة المطلوب: ${escapeHtml(req.consultationSlot)}</div>` : ""}
    <div class="card" style="margin-bottom:18px;">
      <div class="kv-list">
        <div class="kv-item"><div class="k">رقم الطلب</div><div class="v req-id">${escapeHtml(req.id)}</div></div>
        <div class="kv-item"><div class="k">تاريخ التقديم</div><div class="v">${formatDate(req.createdAt)}</div></div>
        <div class="kv-item"><div class="k">السفير المسؤول</div><div class="v">${escapeHtml(req.assignedAmbassadorName || "لم يتم التعيين بعد")}</div></div>
        <div class="kv-item"><div class="k">نوع المساعدة</div><div class="v">${escapeHtml(req.helpType)}</div></div>
        <div class="kv-item"><div class="k">التكرار</div><div class="v">${escapeHtml(req.frequency)}</div></div>
        <div class="kv-item"><div class="k">الوقت المستغرق تقريبًا</div><div class="v">${escapeHtml(req.timeSpent)}</div></div>
      </div>
      <div class="divider"></div>
      <div class="kv-item" style="margin-bottom:12px;"><div class="k">وصف التحدي</div><div class="v">${escapeHtml(req.description)}</div></div>
      <div class="kv-item"><div class="k">طريقة التنفيذ الحالية</div><div class="v">${escapeHtml(req.currentMethod)}</div></div>
    </div>
    <div class="card">
      <h3>سجل المتابعة</h3>
      ${timelineHtml(req)}
    </div>`;
}

// ---------------------------------------------------------------------------
// مساحة السفراء
// ---------------------------------------------------------------------------
function pageWorkspaceGate() {
  if (!State.loaded.ambassadors) return loadingHtml();
  return `
    <div class="page-title-row"><h2>مساحة السفراء</h2></div>
    <div class="card" style="max-width:420px;">
      <p class="text-muted" style="font-size:13.5px;">هذه المساحة مخصصة لسفراء الذكاء الاصطناعي فقط. أدخل اسمك وكود الوصول المشترك المُرسل لكم.</p>
      <form data-form="ambassadorGate">
        <div class="form-group">
          <label class="field-label">أنا:</label>
          <select name="ambassadorId" required>${selectOptions(State.ambassadors, "id", "name", null, "اختر اسمك")}</select>
        </div>
        <div class="form-group">
          <label class="field-label">كود الوصول</label>
          <input type="text" name="code" required placeholder="••••••••" />
        </div>
        <button class="btn btn-primary btn-block" type="submit">دخول مساحة السفراء</button>
      </form>
    </div>`;
}

function workspaceSubnav(active) {
  const item = (key, hash, label) => `<button class="${active === key ? "active" : ""}" data-action="navigate" data-href="${hash}">${label}</button>`;
  return `<div class="subnav">
    ${item("requests", "#/workspace/requests", "الطلبات")}
    ${item("radar", "#/workspace/radar", "فرص الذكاء الاصطناعي")}
    ${item("hours", "#/workspace/hours", "ساعات السفراء")}
    ${item("dashboard", "#/workspace/dashboard", "لوحة المتابعة")}
  </div>`;
}

const WORKSPACE_FILTERS = [
  { key: "new", label: "جديدة", test: (r) => r.status === "new" },
  { key: "mine", label: "طلباتي", test: (r) => State.ambIdentity && r.assignedAmbassadorId === State.ambIdentity.ambassadorId },
  { key: "active", label: "كل النشطة", test: (r) => ACTIVE_STATUSES.includes(r.status) },
  { key: "need_info", label: "بحاجة لمعلومات", test: (r) => r.status === "need_info" },
  { key: "potential", label: "فرص محتملة", test: (r) => r.status === "potential_use_case" },
  { key: "completed", label: "مكتملة", test: (r) => r.status === "completed" },
  { key: "all", label: "الكل", test: () => true },
];

function pageWorkspaceRequests(query) {
  if (!State.loaded.requests) return loadingHtml();
  const activeKey = WORKSPACE_FILTERS.some((f) => f.key === query.filter) ? query.filter : "new";
  const list = State.requests.filter(WORKSPACE_FILTERS.find((f) => f.key === activeKey).test);
  list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return `
    ${workspaceSubnav("requests")}
    <div class="filter-tabs">
      ${WORKSPACE_FILTERS.map((f) => {
        const count = State.requests.filter(f.test).length;
        return `<a class="filter-tab ${f.key === activeKey ? "active" : ""}" href="#/workspace/requests?filter=${f.key}">${f.label} <span class="count">(${count})</span></a>`;
      }).join("")}
    </div>
    ${list.length === 0
      ? emptyStateHtml("📭", "لا توجد طلبات في هذا التصنيف", "")
      : `<div class="grid grid-2">${list.map((r) => requestCardHtml(r, { workspace: true })).join("")}</div>`}
  `;
}

function pageWorkspaceRequestDetail(id) {
  if (!State.loaded.requests || !State.loaded.ambassadors) return loadingHtml();
  const req = getRequestById(id);
  if (!req) return notFoundHtml("لم يتم العثور على هذا الطلب");
  const dup = req.duplicateOf ? getRequestById(req.duplicateOf) : null;
  const cluster = req.clusterId ? getClusterById(req.clusterId) : null;

  return `
    ${workspaceSubnav("requests")}
    <div class="breadcrumb"><a href="#/workspace/requests">الطلبات</a> / ${escapeHtml(req.id)}</div>
    <div class="page-title-row">
      <div>
        <h2 style="margin-bottom:6px;">${escapeHtml(req.title)}</h2>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          ${statusBadge(req.status)} ${demoBadge(req.isDemo)}
          ${req.duplicateOf ? `<span class="badge badge-outline">مكرر</span>` : ""}
        </div>
      </div>
    </div>

    ${dup ? `<div class="notice-box" style="margin-bottom:16px;">🔗 هذا الطلب معلَّم كمكرر للطلب <a href="#/workspace/requests/${escapeHtml(dup.id)}">${escapeHtml(dup.id)} — ${escapeHtml(dup.title)}</a></div>` : ""}
    ${req.consultationSlot ? `<div class="notice-box" style="margin-bottom:16px;">📅 طلب استشارة — الموعد: ${escapeHtml(req.consultationSlot)}</div>` : ""}
    ${cluster ? `<div class="notice-box" style="margin-bottom:16px;">🧩 مرتبط بتجمّع الفرص: <a href="#/workspace/radar">${escapeHtml(cluster.title)}</a></div>` : ""}

    <div class="card" style="margin-bottom:18px;">
      <div class="kv-list">
        <div class="kv-item"><div class="k">مقدّم الطلب</div><div class="v">${escapeHtml(req.employeeName)}</div></div>
        <div class="kv-item"><div class="k">الإدارة</div><div class="v">${escapeHtml(req.department)}</div></div>
        <div class="kv-item"><div class="k">تاريخ التقديم</div><div class="v">${formatDate(req.createdAt)}</div></div>
        <div class="kv-item"><div class="k">رقم الطلب</div><div class="v req-id">${escapeHtml(req.id)}</div></div>
        <div class="kv-item"><div class="k">نوع المساعدة</div><div class="v">${escapeHtml(req.helpType)}</div></div>
        <div class="kv-item"><div class="k">التكرار / الوقت</div><div class="v">${escapeHtml(req.frequency)} · ${escapeHtml(req.timeSpent)}</div></div>
        <div class="kv-item"><div class="k">نطاق التأثر</div><div class="v">${escapeHtml(req.affectedScope)}</div></div>
      </div>
      <div class="divider"></div>
      <div class="kv-item" style="margin-bottom:12px;"><div class="k">وصف التحدي</div><div class="v">${escapeHtml(req.description)}</div></div>
      <div class="kv-item"><div class="k">طريقة التنفيذ الحالية</div><div class="v">${escapeHtml(req.currentMethod)}</div></div>
    </div>

    <div class="card" style="margin-bottom:18px;">
      <h3>إدارة الطلب</h3>
      <div class="grid grid-2">
        <div class="form-group">
          <label class="field-label">السفير المسؤول (تعيين / نقل)</label>
          <select data-autochange="assignAmbassador" data-id="${escapeHtml(req.id)}">
            <option value="">غير معيّن</option>
            ${selectOptions(State.ambassadors, "id", "name", req.assignedAmbassadorId)}
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">الحالة</label>
          <select data-autochange="changeStatus" data-id="${escapeHtml(req.id)}">
            ${selectOptions(STATUSES, "id", "label", req.status)}
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">التصنيف</label>
          <select data-autochange="changeCategory" data-id="${escapeHtml(req.id)}">
            <option value="">بدون تصنيف</option>
            ${selectOptions(CATEGORIES, "id", "label", req.category)}
          </select>
        </div>
      </div>
      <div class="flex-between" style="margin-top:6px;">
        <button class="btn btn-outline btn-sm" type="button" data-action="openLinkCluster" data-id="${escapeHtml(req.id)}">🧩 ربط بتحدٍّ مشابه</button>
        <button class="btn btn-outline btn-sm" type="button" data-action="openMarkDuplicate" data-id="${escapeHtml(req.id)}">🔗 تحديد كمكرر</button>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <h3>ملاحظات داخلية</h3>
        <p class="text-faint" style="margin-bottom:10px;">لا تظهر للموظف.</p>
        <form data-form="addNote" data-id="${escapeHtml(req.id)}">
          <textarea name="text" required placeholder="أضف ملاحظة للفريق..."></textarea>
          <button class="btn btn-outline btn-sm" style="margin-top:8px;" type="submit">إضافة ملاحظة</button>
        </form>
        <div class="divider"></div>
        ${(req.notes || []).slice().reverse().map((n) => `
          <div class="note-item">
            ${escapeHtml(n.text)}
            <div class="meta">${escapeHtml(n.author || "—")} · ${formatDateTime(n.at)}</div>
          </div>`).join("") || `<p class="text-faint">لا توجد ملاحظات بعد.</p>`}
      </div>
      <div class="card">
        <h3>تحديث مرئي للموظف</h3>
        <p class="text-faint" style="margin-bottom:10px;">يظهر للموظف في صفحة «طلباتي».</p>
        <form data-form="addUpdate" data-id="${escapeHtml(req.id)}">
          <textarea name="text" required placeholder="اكتب تحديثًا يراه الموظف..."></textarea>
          <button class="btn btn-primary btn-sm" style="margin-top:8px;" type="submit">إضافة تحديث</button>
        </form>
        <div class="divider"></div>
        ${(req.updates || []).slice().reverse().map((u) => `
          <div class="update-item">
            ${escapeHtml(u.text)}
            <div class="meta">${escapeHtml(u.author || "—")} · ${formatDateTime(u.at)}</div>
          </div>`).join("") || `<p class="text-faint">لا توجد تحديثات بعد.</p>`}
      </div>
    </div>`;
}

function pageWorkspaceRadar() {
  if (!State.loaded.clusters) return loadingHtml();
  const CLUSTER_STATUSES = [
    { id: "observed", label: "مرصود حديثًا" },
    { id: "studying", label: "قيد الدراسة" },
    { id: "adopted", label: "تم اعتماده كمبادرة AI" },
    { id: "closed", label: "مغلق" },
  ];
  window.__CLUSTER_STATUSES__ = CLUSTER_STATUSES;
  return `
    ${workspaceSubnav("radar")}
    <div class="page-title-row">
      <div>
        <h2>رادار الفرص</h2>
        <p class="text-faint">تحديات متكررة عبر عدة موظفين وإدارات — مؤشر على فرصة ذكاء اصطناعي واسعة الأثر.</p>
      </div>
      <button class="btn btn-primary" type="button" data-action="openCreateCluster">+ إنشاء تجمّع جديد</button>
    </div>
    ${State.clusters.length === 0
      ? emptyStateHtml("🧩", "لا توجد تجمّعات بعد", "اربط الطلبات المتشابهة من صفحة كل طلب.")
      : `<div class="grid grid-2">${State.clusters.map((c) => clusterCardHtml(c, CLUSTER_STATUSES)).join("")}</div>`}
  `;
}

function clusterCardHtml(cluster, CLUSTER_STATUSES) {
  const reqs = requestsForCluster(cluster);
  const deptCount = deptCountForCluster(cluster);
  const others = State.clusters.filter((c) => c.id !== cluster.id);
  return `
    <div class="card cluster-card">
      <div class="flex-between">
        <span class="badge badge-outline">تحدٍّ متكرر</span>
        ${demoBadge(cluster.isDemo)}
      </div>
      <h3 class="mb-0">${escapeHtml(cluster.title)}</h3>
      <div class="cluster-nums">
        <div class="cluster-num"><b>${reqs.length}</b><span>طلبات</span></div>
        <div class="cluster-num"><b>${deptCount}</b><span>إدارات</span></div>
      </div>
      <div class="form-group mb-0">
        <label class="field-label">الحالة الحالية</label>
        <select data-autochange="changeClusterStatus" data-id="${escapeHtml(cluster.id)}">
          ${selectOptions(CLUSTER_STATUSES, "id", "label", cluster.status)}
        </select>
      </div>
      <details>
        <summary style="cursor:pointer;font-size:13px;font-weight:700;color:var(--primary);">عرض الطلبات المرتبطة (${reqs.length})</summary>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
          ${reqs.map((r) => `<a href="#/workspace/requests/${escapeHtml(r.id)}" style="font-size:13px;">• ${escapeHtml(r.title)} — ${escapeHtml(r.department)}</a>`).join("") || "—"}
        </div>
      </details>
      ${others.length > 0 ? `
      <div class="form-group mb-0" style="margin-top:6px;">
        <label class="field-label">دمج مع تجمّع آخر</label>
        <div style="display:flex;gap:8px;">
          <select id="merge-target-${escapeHtml(cluster.id)}">
            ${selectOptions(others, "id", "title", null, "اختر تجمعًا")}
          </select>
          <button class="btn btn-outline btn-sm" type="button" data-action="mergeCluster" data-id="${escapeHtml(cluster.id)}">دمج</button>
        </div>
      </div>` : ""}
    </div>`;
}

function pageWorkspaceHours() {
  if (!State.loaded.ambassadors) return loadingHtml();
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
  window.__HOURS_DAYS__ = DAYS;
  return `
    ${workspaceSubnav("hours")}
    <div class="page-title-row"><h2>ساعات السفراء المكتبية</h2></div>
    <div class="grid grid-2">
      ${State.ambassadors.map((amb) => {
        const isSelf = State.ambIdentity && amb.id === State.ambIdentity.ambassadorId;
        return `<div class="card" id="hours-card-${escapeHtml(amb.id)}">
          <div class="flex-between" style="margin-bottom:10px;">
            <div><b>${escapeHtml(amb.name)}</b><div class="text-faint">${escapeHtml(amb.department)}</div></div>
            ${isSelf ? '<span class="badge badge-outline">أنت</span>' : ""}
          </div>
          ${isSelf ? hoursEditorHtml(amb) : hoursReadonlyHtml(amb)}
        </div>`;
      }).join("")}
    </div>`;
}

function hoursReadonlyHtml(amb) {
  if (!(amb.officeHours || []).length) return `<p class="text-faint">لم يتم تحديد ساعات مكتبية بعد.</p>`;
  return amb.officeHours.map((h) => `<div class="hour-row"><span>${escapeHtml(h.day)}</span><span class="text-faint">${escapeHtml(h.start)}–${escapeHtml(h.end)}</span></div>`).join("");
}
function hoursEditorHtml(amb) {
  const rows = window.__HOURS_EDIT_STATE__ && window.__HOURS_EDIT_STATE__.ambId === amb.id
    ? window.__HOURS_EDIT_STATE__.rows
    : (amb.officeHours || []).map((h) => ({ ...h }));
  window.__HOURS_EDIT_STATE__ = { ambId: amb.id, rows };
  const DAYS = window.__HOURS_DAYS__ || ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
  return `
    <div id="hours-editor-${escapeHtml(amb.id)}">
      ${rows.map((r, i) => `
        <div class="hour-row">
          <select data-hour-field="day" data-index="${i}">${selectOptions(DAYS, null, null, r.day)}</select>
          <input type="time" data-hour-field="start" data-index="${i}" value="${escapeHtml(r.start || "10:00")}" />
          <span>–</span>
          <input type="time" data-hour-field="end" data-index="${i}" value="${escapeHtml(r.end || "11:00")}" />
          <button class="btn btn-ghost btn-sm" type="button" data-action="removeHourRow" data-index="${i}">✕</button>
        </div>`).join("")}
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn btn-outline btn-sm" type="button" data-action="addHourRow">+ إضافة موعد</button>
        <button class="btn btn-primary btn-sm" type="button" data-action="saveHours" data-id="${escapeHtml(amb.id)}">حفظ الساعات</button>
      </div>
    </div>`;
}

function pageWorkspaceDashboard() {
  if (!State.loaded.requests) return loadingHtml();
  const total = State.requests.length;
  const byStatus = (id) => State.requests.filter((r) => r.status === id).length;
  const active = State.requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;

  const byDept = {};
  State.requests.forEach((r) => { byDept[r.department] = (byDept[r.department] || 0) + 1; });
  const byCat = {};
  State.requests.forEach((r) => { const c = r.category ? categoryLabel(r.category) : "غير مصنف"; byCat[c] = (byCat[c] || 0) + 1; });
  const byAmb = {};
  State.ambassadors.forEach((a) => { byAmb[a.name] = openCountForAmbassador(a.id); });

  const barSection = (title, obj) => {
    const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...entries.map((e) => e[1]));
    return `<div class="card">
      <h3>${title}</h3>
      ${entries.length === 0 ? `<p class="text-faint">لا توجد بيانات بعد.</p>` : entries.map(([label, val]) => `
        <div class="bar-row">
          <div class="bar-label">${escapeHtml(label)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(val / max) * 100}%;"></div></div>
          <div class="bar-val">${val}</div>
        </div>`).join("")}
    </div>`;
  };

  return `
    ${workspaceSubnav("dashboard")}
    <div class="page-title-row"><h2>لوحة المتابعة</h2></div>
    <div class="grid grid-4" style="margin-bottom:20px;">
      <div class="card stat-tile"><div class="stat-num">${total}</div><div class="stat-label">إجمالي الطلبات</div></div>
      <div class="card stat-tile"><div class="stat-num">${byStatus("new")}</div><div class="stat-label">طلبات جديدة</div></div>
      <div class="card stat-tile"><div class="stat-num">${active}</div><div class="stat-label">طلبات نشطة</div></div>
      <div class="card stat-tile"><div class="stat-num">${byStatus("completed")}</div><div class="stat-label">طلبات مكتملة</div></div>
      <div class="card stat-tile"><div class="stat-num">${byStatus("potential_use_case")}</div><div class="stat-label">فرص AI محتملة</div></div>
      <div class="card stat-tile"><div class="stat-num">${State.clusters.length}</div><div class="stat-label">تحديات متكررة</div></div>
    </div>
    <div class="grid grid-2" style="margin-bottom:20px;">
      ${barSection("الطلبات حسب الإدارة", byDept)}
      ${barSection("الطلبات حسب التصنيف", byCat)}
    </div>
    ${barSection("الطلبات المفتوحة حسب السفير", byAmb)}

    <div class="divider"></div>
    <div class="card">
      <div class="flex-between">
        <div>
          <h3 class="mb-0">إدارة البيانات التجريبية</h3>
          <p class="text-faint mb-0">يحذف كل العناصر المعلّمة كـ«بيانات تجريبية» نهائيًا من قاعدة البيانات.</p>
        </div>
        <button class="btn btn-danger btn-sm" type="button" data-action="clearDemoData">مسح البيانات التجريبية</button>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// حالات فارغة / تحميل / غير موجود
// ---------------------------------------------------------------------------
function loadingHtml() { return `<div class="loading-state">جارِ تحميل البيانات…</div>`; }
function emptyStateHtml(icon, title, desc) {
  return `<div class="empty-state"><span class="icon">${icon}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc || "")}</p></div>`;
}
function notFoundHtml(msg) {
  return `<div class="empty-state"><span class="icon">🔍</span><h3>${escapeHtml(msg)}</h3><a href="#/" class="btn btn-outline btn-sm">العودة للرئيسية</a></div>`;
}
function configMissingHtml() {
  return `<div class="empty-state"><span class="icon">⚙️</span><h3>إعداد أولي مطلوب</h3>
    <p>لم يتم ربط قاعدة البيانات بعد. افتح ملف <code>firebase-config.js</code> وأدخل بيانات مشروع Firebase الخاص بك (راجع README.md).</p></div>`;
}

// ---------------------------------------------------------------------------
// المُوجّه الرئيسي
// ---------------------------------------------------------------------------
function render() {
  const { parts, query } = parseHash();
  renderHeader(parts);
  const root = document.getElementById("app-root");

  if (!window.__FIREBASE_READY__) {
    root.innerHTML = configMissingHtml();
    return;
  }

  const p0 = parts[0] || "";
  let html = "";
  let routeKey = p0 || "home";

  if (!p0) {
    html = pageHome();
  } else if (p0 === "submit") {
    html = pageSubmit(query);
    routeKey = "submit";
  } else if (p0 === "ambassadors" && !parts[1]) {
    html = pageAmbassadorsList();
  } else if (p0 === "ambassador" && parts[1]) {
    html = pageAmbassadorProfile(decodeURIComponent(parts[1]));
  } else if (p0 === "my-requests") {
    html = pageMyRequests();
  } else if (p0 === "request" && parts[1]) {
    html = pageRequestDetail(decodeURIComponent(parts[1]), query);
  } else if (p0 === "workspace") {
    if (!State.ambUnlocked) {
      html = pageWorkspaceGate();
      routeKey = "workspace-gate";
    } else if (!parts[1] || parts[1] === "requests") {
      if (!parts[1]) { navigate("#/workspace/requests"); return; }
      html = pageWorkspaceRequests(query);
      routeKey = parts[2] ? "workspace-requests-detail" : "workspace-requests";
      if (parts[2]) html = pageWorkspaceRequestDetail(decodeURIComponent(parts[2]));
    } else if (parts[1] === "radar") {
      html = pageWorkspaceRadar();
      routeKey = "workspace-radar";
    } else if (parts[1] === "hours") {
      html = pageWorkspaceHours();
      routeKey = "workspace-hours";
    } else if (parts[1] === "dashboard") {
      html = pageWorkspaceDashboard();
      routeKey = "workspace-dashboard";
    } else {
      html = notFoundHtml("الصفحة غير موجودة");
    }
  } else {
    html = notFoundHtml("الصفحة غير موجودة");
  }

  currentRouteKey = routeKey;
  root.innerHTML = html;
}

function onDataChange() {
  if (NO_AUTO_RERENDER.has(currentRouteKey)) return;
  // تجنّب مسح ما يكتبه المستخدم حاليًا في نموذج مفتوح عند وصول بيانات جديدة
  const active = document.activeElement;
  const root = document.getElementById("app-root");
  const isTyping = active && root && root.contains(active) && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName);
  if (isTyping) return;
  render();
}

// ---------------------------------------------------------------------------
// معالجات الأحداث المفوَّضة (Event delegation)
// ---------------------------------------------------------------------------
document.addEventListener("click", (e) => {
  const actionEl = e.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;

  if (action === "closeModal" || action === "closeModalOverlay") { closeModal(); return; }
  if (action === "navigate") { navigate(actionEl.dataset.href); return; }
  if (action === "switchEmployee") { clearLocalEmployee(); render(); toast("تم تبديل الحساب، يمكنك التسجيل من جديد."); return; }
  if (action === "logoutAmbassador") { clearLocalAmbassador(); navigate("#/"); render(); return; }

  if (action === "openLinkCluster") { openLinkClusterModal(actionEl.dataset.id); return; }
  if (action === "openMarkDuplicate") { openMarkDuplicateModal(actionEl.dataset.id); return; }
  if (action === "openCreateCluster") { openCreateClusterModal(); return; }

  if (action === "mergeCluster") {
    const sourceId = actionEl.dataset.id;
    const select = document.getElementById("merge-target-" + sourceId);
    const targetId = select ? select.value : "";
    if (!targetId) { toast("اختر التجمّع الهدف أولًا", "error"); return; }
    mergeClusters(sourceId, targetId);
    return;
  }

  if (action === "clearDemoData") {
    if (confirm("هل أنت متأكد من حذف كل البيانات التجريبية نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.")) {
      DataLayer.admin.clearDemoData()
        .then((n) => toast(`تم حذف ${n} عنصر تجريبي.`))
        .catch((e) => toast("تعذّر الحذف: " + e.message, "error"));
    }
    return;
  }

  if (action === "addHourRow") {
    window.__HOURS_EDIT_STATE__.rows.push({ day: "الأحد", start: "10:00", end: "11:00" });
    refreshHoursEditor();
    return;
  }
  if (action === "removeHourRow") {
    const idx = Number(actionEl.dataset.index);
    window.__HOURS_EDIT_STATE__.rows.splice(idx, 1);
    refreshHoursEditor();
    return;
  }
  if (action === "saveHours") {
    const ambId = actionEl.dataset.id;
    const rows = window.__HOURS_EDIT_STATE__.rows;
    DataLayer.ambassadors.update(ambId, { officeHours: rows })
      .then(() => { toast("تم حفظ الساعات المكتبية."); NO_AUTO_RERENDER.delete("workspace-hours"); render(); NO_AUTO_RERENDER.add("workspace-hours"); })
      .catch((e) => toast("تعذّر الحفظ: " + e.message, "error"));
    return;
  }
});

document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-hour-field]");
  if (el) {
    const idx = Number(el.dataset.index);
    const field = el.dataset.hourField;
    window.__HOURS_EDIT_STATE__.rows[idx][field] = el.value;
    return;
  }

  const auto = e.target.closest("[data-autochange]");
  if (!auto) return;
  const action = auto.dataset.autochange;
  const id = auto.dataset.id;
  const value = auto.value;

  if (action === "assignAmbassador") {
    const amb = value ? getAmbassadorById(value) : null;
    DataLayer.requests.update(id, { assignedAmbassadorId: value || null, assignedAmbassadorName: amb ? amb.name : null })
      .then(() => toast(amb ? `تم تعيين الطلب إلى ${amb.name}` : "تم إلغاء التعيين"))
      .catch((e) => toast("خطأ: " + e.message, "error"));
  } else if (action === "changeStatus") {
    DataLayer.requests.update(id, { status: value })
      .then(() => toast("تم تحديث الحالة إلى: " + statusLabel(value)))
      .catch((e) => toast("خطأ: " + e.message, "error"));
  } else if (action === "changeCategory") {
    DataLayer.requests.update(id, { category: value || null })
      .then(() => toast("تم تحديث التصنيف"))
      .catch((e) => toast("خطأ: " + e.message, "error"));
  } else if (action === "changeClusterStatus") {
    DataLayer.clusters.update(id, { status: value })
      .then(() => toast("تم تحديث حالة التجمّع"))
      .catch((e) => toast("خطأ: " + e.message, "error"));
  }
});

document.addEventListener("submit", (e) => {
  const form = e.target.closest("form[data-form]");
  if (!form) return;
  e.preventDefault();
  const type = form.dataset.form;
  const fd = new FormData(form);
  const val = (k) => (fd.get(k) || "").toString().trim();

  if (type === "registerEmployee") {
    const name = val("name"), employeeId = val("employeeId"), department = val("department");
    if (!name || !employeeId || !department) { toast("يرجى تعبئة كل الحقول", "error"); return; }
    if (/[\/.#$\[\]]/.test(employeeId)) { toast("الرقم الوظيفي يحتوي على رموز غير مسموحة", "error"); return; }
    DataLayer.employees.upsert(employeeId, { name, department })
      .then(() => {
        saveLocalEmployee({ employeeId, name, department });
        toast("تم إنشاء ملفك بنجاح");
        const next = val("next");
        render();
        if (next) navigate("#/" + next);
      })
      .catch((e) => toast("تعذّر الحفظ: " + e.message, "error"));
    return;
  }

  if (type === "lookupEmployee") {
    const employeeId = val("employeeId");
    if (!employeeId) return;
    DataLayer.employees.get(employeeId).then((emp) => {
      if (!emp) { toast("لم يتم العثور على موظف بهذا الرقم — سجّل بيانات جديدة أدناه", "error"); return; }
      saveLocalEmployee({ employeeId, name: emp.name, department: emp.department });
      render();
    }).catch((e) => toast("خطأ: " + e.message, "error"));
    return;
  }

  if (type === "submitChallenge") {
    const frequency = fd.get("frequency"), affectedScope = fd.get("affectedScope"), helpType = fd.get("helpType");
    if (!frequency || !affectedScope || !helpType) { toast("يرجى إكمال كل الحقول المطلوبة", "error"); return; }
    const isConsult = val("isConsult") === "1";
    const now = new Date().toISOString();
    const req = {
      id: generateRequestId(),
      employeeId: State.employee.employeeId,
      employeeName: State.employee.name,
      department: State.employee.department,
      title: val("title"),
      description: val("description"),
      currentMethod: val("currentMethod"),
      frequency, timeSpent: val("timeSpent"), affectedScope, helpType,
      status: isConsult ? "consultation" : "new",
      category: null,
      assignedAmbassadorId: val("amb") || null,
      assignedAmbassadorName: val("ambName") || null,
      consultationSlot: isConsult ? val("slot") : null,
      notes: [],
      updates: isConsult ? [{ text: "تم تسجيل طلب استشارة للموعد: " + val("slot"), author: "النظام", at: now }] : [],
      duplicateOf: null, clusterId: null, isDemo: false,
      createdAt: now, updatedAt: now,
    };
    DataLayer.requests.create(req)
      .then(() => { toast("تم إرسال طلبك بنجاح"); navigate(`#/request/${req.id}?justSubmitted=1`); })
      .catch((e) => toast("تعذّر إرسال الطلب: " + e.message, "error"));
    return;
  }

  if (type === "ambassadorGate") {
    const ambassadorId = val("ambassadorId"), code = val("code");
    if (code !== AMBASSADOR_ACCESS_CODE) { toast("كود الوصول غير صحيح", "error"); return; }
    const amb = getAmbassadorById(ambassadorId);
    if (!amb) { toast("يرجى اختيار اسمك من القائمة", "error"); return; }
    saveLocalAmbassador({ ambassadorId, name: amb.name });
    toast("مرحبًا بك، " + amb.name);
    navigate("#/workspace/requests");
    return;
  }

  if (type === "addNote") {
    const id = form.dataset.id, text = val("text");
    if (!text) return;
    DataLayer.requests.addNote(id, { text, author: State.ambIdentity ? State.ambIdentity.name : "سفير", at: new Date().toISOString() })
      .then(() => { toast("تمت إضافة الملاحظة"); form.reset(); })
      .catch((e) => toast("خطأ: " + e.message, "error"));
    return;
  }
  if (type === "addUpdate") {
    const id = form.dataset.id, text = val("text");
    if (!text) return;
    DataLayer.requests.addEmployeeUpdate(id, text, State.ambIdentity ? State.ambIdentity.name : "سفير")
      .then(() => { toast("تمت إضافة التحديث"); form.reset(); })
      .catch((e) => toast("خطأ: " + e.message, "error"));
    return;
  }

  if (type === "markDuplicateForm") {
    const id = form.dataset.id, originalId = val("originalId");
    if (!originalId) return;
    DataLayer.requests.update(id, { duplicateOf: originalId })
      .then(() => { toast("تم تحديد الطلب كمكرر"); closeModal(); })
      .catch((e) => toast("خطأ: " + e.message, "error"));
    return;
  }

  if (type === "linkClusterForm") {
    const id = form.dataset.id;
    const newTitle = val("newTitle");
    const existing = fd.get("existingCluster");
    if (newTitle) {
      DataLayer.clusters.create({ title: newTitle, requestIds: [id], status: "observed", isDemo: false, createdAt: new Date().toISOString() })
        .then((c) => DataLayer.requests.update(id, { clusterId: c.id }))
        .then(() => { toast("تم إنشاء تجمّع جديد وربط الطلب به"); closeModal(); })
        .catch((e) => toast("خطأ: " + e.message, "error"));
    } else if (existing) {
      DataLayer.clusters.addRequests(existing, [id])
        .then(() => DataLayer.requests.update(id, { clusterId: existing }))
        .then(() => { toast("تم ربط الطلب بالتجمّع"); closeModal(); })
        .catch((e) => toast("خطأ: " + e.message, "error"));
    } else {
      toast("اختر تجمّعًا أو أدخل عنوانًا جديدًا", "error");
    }
    return;
  }

  if (type === "createClusterForm") {
    const title = val("title");
    const ids = fd.getAll("requestIds");
    if (!title || ids.length === 0) { toast("أدخل عنوانًا واختر طلبًا واحدًا على الأقل", "error"); return; }
    DataLayer.clusters.create({ title, requestIds: ids, status: "observed", isDemo: false, createdAt: new Date().toISOString() })
      .then((c) => Promise.all(ids.map((id) => DataLayer.requests.update(id, { clusterId: c.id }))))
      .then(() => { toast("تم إنشاء التجمّع"); closeModal(); })
      .catch((e) => toast("خطأ: " + e.message, "error"));
    return;
  }
});

// ---------------------------------------------------------------------------
// نوافذ منبثقة مخصّصة
// ---------------------------------------------------------------------------
function openMarkDuplicateModal(reqId) {
  openModal(`
    <h3>تحديد الطلب كمكرر</h3>
    <p class="text-faint">أدخل رقم الطلب الأصلي الذي يكرره هذا الطلب.</p>
    <form data-form="markDuplicateForm" data-id="${escapeHtml(reqId)}">
      <div class="form-group">
        <label class="field-label">رقم الطلب الأصلي</label>
        <input type="text" name="originalId" required placeholder="مثال: REQ-260910-AB12" />
      </div>
      <button class="btn btn-primary btn-block" type="submit">تأكيد</button>
    </form>`);
}
function openLinkClusterModal(reqId) {
  const clustersOptions = State.clusters.map((c) => `
    <label style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border);">
      <input type="radio" name="existingCluster" value="${escapeHtml(c.id)}"/>
      ${escapeHtml(c.title)} <span class="text-faint">(${(c.requestIds || []).length} طلب)</span>
    </label>`).join("") || `<p class="text-faint">لا توجد تجمّعات بعد.</p>`;
  openModal(`
    <h3>ربط بتحدٍّ مشابه</h3>
    <form data-form="linkClusterForm" data-id="${escapeHtml(reqId)}">
      <div class="form-group">
        <label class="field-label">اختر تجمّعًا قائمًا</label>
        ${clustersOptions}
      </div>
      <div class="form-group">
        <label class="field-label">أو أنشئ تجمّعًا جديدًا بعنوان</label>
        <input type="text" name="newTitle" placeholder="مثال: تلخيص التقارير الشهرية" />
      </div>
      <button class="btn btn-primary btn-block" type="submit">تأكيد الربط</button>
    </form>`);
}
function openCreateClusterModal() {
  const unlinked = State.requests.filter((r) => !r.clusterId);
  const list = unlinked.map((r) => `
    <label style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px dashed var(--border);">
      <input type="checkbox" name="requestIds" value="${escapeHtml(r.id)}" style="margin-top:4px;"/>
      <span>${escapeHtml(r.title)} <span class="text-faint">— ${escapeHtml(r.department)}</span></span>
    </label>`).join("") || `<p class="text-faint">لا توجد طلبات غير مرتبطة حاليًا.</p>`;
  openModal(`
    <h3>إنشاء تجمّع جديد</h3>
    <form data-form="createClusterForm">
      <div class="form-group">
        <label class="field-label">عنوان التحدي المشترك</label>
        <input type="text" name="title" required placeholder="مثال: تلخيص محاضر الاجتماعات" />
      </div>
      <div class="form-group" style="max-height:260px;overflow-y:auto;">
        <label class="field-label">الطلبات المرتبطة</label>
        ${list}
      </div>
      <button class="btn btn-primary btn-block" type="submit">إنشاء التجمّع</button>
    </form>`);
}
function mergeClusters(sourceId, targetId) {
  const source = getClusterById(sourceId);
  if (!source) return;
  const ids = source.requestIds || [];
  DataLayer.clusters.addRequests(targetId, ids)
    .then(() => Promise.all(ids.map((id) => DataLayer.requests.update(id, { clusterId: targetId }))))
    .then(() => DataLayer.clusters.delete(sourceId))
    .then(() => toast("تم دمج التجمّعين بنجاح"))
    .catch((e) => toast("خطأ: " + e.message, "error"));
}
function refreshHoursEditor() {
  const ambId = window.__HOURS_EDIT_STATE__.ambId;
  const amb = getAmbassadorById(ambId);
  const card = document.getElementById("hours-card-" + ambId);
  if (card && amb) {
    card.innerHTML = `
      <div class="flex-between" style="margin-bottom:10px;">
        <div><b>${escapeHtml(amb.name)}</b><div class="text-faint">${escapeHtml(amb.department)}</div></div>
        <span class="badge badge-outline">أنت</span>
      </div>
      ${hoursEditorHtml(amb)}`;
  }
}

// ---------------------------------------------------------------------------
// التهيئة
// ---------------------------------------------------------------------------
async function init() {
  loadLocalIdentities();
  window.addEventListener("hashchange", render);

  if (!window.__FIREBASE_READY__) {
    render();
    return;
  }

  render(); // عرض حالة التحميل فورًا

  try { await seedDemoDataIfNeeded(); } catch (e) { console.error(e); }

  // كل اشتراك محاط بـ try/catch منفصل حتى لا يمنع فشل أحدها الآخرَين
  try {
    DataLayer.requests.subscribeAll(
      (list) => { State.requests = list; State.loaded.requests = true; onDataChange(); },
      (err) => console.error("requests subscribe error", err)
    );
  } catch (e) { console.error("requests subscribeAll failed", e); }

  try {
    DataLayer.ambassadors.subscribeAll(
      (list) => { State.ambassadors = list; State.loaded.ambassadors = true; onDataChange(); },
      (err) => console.error("ambassadors subscribe error", err)
    );
  } catch (e) { console.error("ambassadors subscribeAll failed", e); }

  try {
    DataLayer.clusters.subscribeAll(
      (list) => { State.clusters = list; State.loaded.clusters = true; onDataChange(); },
      (err) => console.error("clusters subscribe error", err)
    );
  } catch (e) { console.error("clusters subscribeAll failed", e); }
}

document.addEventListener("DOMContentLoaded", init);
