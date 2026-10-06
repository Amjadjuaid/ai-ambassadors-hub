// ============================================================================
// app.js — التوجيه (Router) وكل واجهات العرض والتفاعل.
// SPA بدون أي إطار عمل: hash router + innerHTML rendering + event delegation.
// ============================================================================

const State = {
  ambIdentity: null,
  ambUnlocked: false,
  ambassadors: [],
  challenges: [],
  participation: [],
  loaded: { ambassadors: false, challenges: false, participation: false },
};

// مسارات لا يُعاد رسمها تلقائيًا عند وصول بيانات جديدة (حتى لا تُفقد مدخلات
// المستخدم الجارية في نموذج مفتوح)
const NO_AUTO_RERENDER = new Set(["share-challenge", "share-participate"]);
let currentRouteKey = "";

// ---------------------------------------------------------------------------
// تخزين هوية السفير محليًا (على هذا الجهاز فقط)
// ---------------------------------------------------------------------------
function loadLocalIdentities() {
  try {
    const amb = localStorage.getItem("aah_amb_identity");
    if (amb) State.ambIdentity = JSON.parse(amb);
    State.ambUnlocked = localStorage.getItem("aah_amb_unlocked") === "1";
  } catch (e) { /* تجاهل أخطاء التخزين المحلي (وضع خاص مثلًا) */ }
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
  setTimeout(() => el.remove(), 3600);
}
function openModal(html) {
  document.getElementById("modal-root").innerHTML =
    `<div class="modal-overlay" data-action="closeModalOverlay">
       <div class="modal-box" data-action="noop">
         <div class="flex-between" style="margin-bottom:10px;">
           <div></div>
           <button class="btn btn-ghost btn-sm" data-action="closeModal" type="button">إغلاق</button>
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
function getChallengeById(id) { return State.challenges.find((r) => r.id === id || r._id === id) || null; }
function getParticipationById(id) { return State.participation.find((r) => r.id === id || r._id === id) || null; }
function initials(name) { return (name || "؟").trim().charAt(0); }
function myId() { return State.ambIdentity ? State.ambIdentity.ambassadorId : null; }

function challengeOpenCountForAmbassador(ambId) {
  return State.challenges.filter((r) => r.assignedAmbassadorId === ambId && isChallengeOpenStatus(r.status)).length;
}

// ---------------------------------------------------------------------------
// مكوّنات HTML قابلة لإعادة الاستخدام
// ---------------------------------------------------------------------------
function challengeStatusBadge(id) { return `<span class="badge ${isChallengeClosureStatus(id) ? "status-closed" : (id === "completed" ? "status-done" : "status-progress")}">${escapeHtml(challengeStatusLabel(id))}</span>`; }
function participationStatusBadge(id) { return `<span class="badge ${id === "closed" ? "status-closed" : (id === "joined" ? "status-done" : "status-progress")}">${escapeHtml(participationStatusLabel(id))}</span>`; }

function pillGroup(name, options, selectedValue, required) {
  return `<div class="choice-group" role="radiogroup">${options
    .map((opt) => `
      <label class="choice-pill">
        <input type="radio" name="${name}" value="${escapeHtml(opt)}" ${opt === selectedValue ? "checked" : ""} ${required ? "required" : ""}/>
        ${escapeHtml(opt)}
      </label>`)
    .join("")}</div>`;
}
function checkGroup(name, options, selectedValues) {
  const sel = selectedValues || [];
  return `<div class="choice-group" role="group">${options
    .map((opt) => `
      <label class="choice-pill">
        <input type="checkbox" name="${name}" value="${escapeHtml(opt)}" ${sel.includes(opt) ? "checked" : ""}/>
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
  return (placeholder !== undefined ? `<option value="">${escapeHtml(placeholder)}</option>` : "") + opts.join("");
}
function deptTrackSelectOptions(selected) {
  const items = [...DEPARTMENTS.map((d) => ({ v: d })), ...AI_TRACKS.map((t) => ({ v: t }))];
  return selectOptions(items, "v", "v", selected, "الكل — المسار / الإدارة");
}

// ---------------------------------------------------------------------------
// الهيدر (شريط التنقل) — ثلاثة عناصر رئيسية فقط
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
        <span class="brand-badge">AI</span>
        <span>سفراء الذكاء الاصطناعي</span>
      </a>
      <nav class="nav">
        ${link("home", "#/", "الرئيسية")}
        ${link("share", "#/share", "شارك معنا")}
        <a href="#/workspace" class="workspace-link ${active === "workspace" ? "active" : ""}">بوابة السفراء</a>
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
  return `
    <div class="hero">
      <h1>حوّل تحديات عملك إلى فرص بالذكاء الاصطناعي</h1>
      <p class="lead">
        كل يوم نواجه مهامًا متكررة، إجراءات تأخذ وقتًا، وتحديات يمكن تنفيذها بطريقة أذكى.
        تهدف مبادرة سفراء الذكاء الاصطناعي إلى مساعدتك في اكتشاف كيف يمكن للذكاء الاصطناعي أن
        يسهّل عملك، يختصر الوقت، ويرفع الكفاءة. إذا كان لديك إجراء متكرر، مهمة تستهلك وقتك،
        أو تحدٍ تعتقد أنه يمكن تحسينه أو أتمتته، شاركنا به. سيعمل معك سفراء الذكاء الاصطناعي على
        فهم التحدي، ودراسة الفرصة، والمساعدة في تحويلها إلى حل عملي يمكن تطبيقه والاستفادة منه
        في العمل.
      </p>
      <a class="btn btn-primary btn-lg" href="#/share/challenge">شاركنا تحديك</a>
    </div>

    <div class="card callout-card">
      <h3>عندك تحدٍ؟</h3>
      <p class="text-muted">قد تكون بدايته فكرة تستحق أن تتحول إلى حل. شاركنا تحديك، وسنساعدك في
        إيجاد طريقة أذكى وأسرع لإنجازه باستخدام الذكاء الاصطناعي.</p>
      <a class="btn btn-outline" href="#/share/challenge">شاركنا تحديك</a>
    </div>

    <div class="card callout-card">
      <h3>تريد المساهمة في بناء حلول الذكاء الاصطناعي؟</h3>
      <p class="text-muted">إذا كانت لديك خبرة أو رغبة في المساهمة ضمن فرق تطوير حلول الذكاء
        الاصطناعي داخل المؤسسة، سجّل اهتمامك وسيتواصل معك أحد سفراء الذكاء الاصطناعي.</p>
      <a class="btn btn-outline" href="#/share/participate">سجّل اهتمامك بالمشاركة</a>
    </div>`;
}

// ---------------------------------------------------------------------------
// شارك معنا — Conditional Branching بين تحدٍّ ومشاركة
// ---------------------------------------------------------------------------
function pageShare() {
  return `
    <div class="page-title-row"><h2>شارك معنا</h2></div>
    <div class="grid grid-2">
      <a class="card branch-card" href="#/share/challenge">
        <h3>شارك تحديًا</h3>
        <p class="text-muted">لديك مهمة متكررة أو تحدٍ تريد تحسينه أو أتمتته بالذكاء الاصطناعي؟</p>
        <span class="btn btn-primary">متابعة</span>
      </a>
      <a class="card branch-card" href="#/share/participate">
        <h3>شارك في بناء منتجات الذكاء الاصطناعي</h3>
        <p class="text-muted">تريد المساهمة ضمن فريق بناء حلول الذكاء الاصطناعي داخل المؤسسة؟</p>
        <span class="btn btn-primary">متابعة</span>
      </a>
    </div>`;
}

function employeeFieldsHtml() {
  return `
    <div class="form-group">
      <label class="field-label">الاسم الثنائي</label>
      <input type="text" name="employeeName" required placeholder="مثال: عبدالله الأحمدي" />
    </div>
    <div class="form-group">
      <label class="field-label">الرقم الوظيفي</label>
      <input type="text" name="employeeId" required placeholder="مثال: 90045" />
    </div>
    <div class="form-group">
      <label class="field-label">الإدارة</label>
      <select name="department" required>${selectOptions(DEPARTMENTS, null, null, null, "اختر الإدارة")}</select>
    </div>
    <div class="form-group">
      <label class="field-label">المسار</label>
      <select name="track" required>${selectOptions(AI_TRACKS, null, null, null, "اختر المسار")}</select>
    </div>
    <div class="form-group">
      <label class="field-label">السفير المفضّل للتواصل (اختياري)</label>
      <select name="ambassadorId">
        <option value="">بدون تحديد</option>
        ${State.ambassadors.map((a) => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)} — ${escapeHtml(a.department)}</option>`).join("")}
      </select>
      <div class="field-hint">هذا تعيين مبدئي فقط — قد يُعاد توجيه طلبك لسفير آخر أنسب لتخصص التحدي.</div>
    </div>`;
}

function pageShareChallenge() {
  return `
    <div class="page-title-row"><h2>شارك تحديًا</h2></div>
    <div class="notice-box" style="margin-bottom:20px;">يرجى عدم إدخال بيانات سرية أو معلومات حساسة ضمن وصف التحدي.</div>
    <form data-form="submitChallenge" class="card" style="max-width:680px;">
      ${employeeFieldsHtml()}
      <div class="form-group">
        <label class="field-label">عنوان التحدي</label>
        <input type="text" name="title" required placeholder="مثال: إعداد التقرير الأسبوعي يدويًا" />
      </div>
      <div class="form-group">
        <label class="field-label">شرح التحدي</label>
        <textarea name="description" required placeholder="اشرح التحدي والمهمة التي تستهلك وقتك"></textarea>
      </div>
      <div class="form-group">
        <label class="field-label">الوقت الذي تستغرقه المهمة تقريبًا</label>
        <input type="text" name="timeImpact" required placeholder="مثال: ساعة يوميًا" />
      </div>
      <div class="form-group">
        <label class="field-label">من يتأثر بهذا التحدي؟</label>
        <input type="text" name="affectedParties" required placeholder="مثال: فريقي، إدارتي بالكامل..." />
      </div>
      <button class="btn btn-primary btn-block" type="submit">إرسال التحدي</button>
    </form>`;
}

function pageShareParticipate() {
  return `
    <div class="page-title-row"><h2>شارك في بناء منتجات الذكاء الاصطناعي</h2></div>
    <form data-form="submitParticipation" class="card" style="max-width:680px;">
      ${employeeFieldsHtml()}
      <div class="form-group">
        <label class="field-label">أدوات الذكاء الاصطناعي التي تستخدمها</label>
        ${checkGroup("aiTools", AI_TOOLS, [])}
        <input type="text" name="aiToolsOther" placeholder="إذا اخترت «أخرى» اذكرها هنا" style="margin-top:8px;" />
      </div>
      <div class="form-group">
        <label class="field-label">هل سبق لك بناء منتج أو حل باستخدام الذكاء الاصطناعي؟</label>
        ${pillGroup("hasBuiltBefore", ["نعم", "لا"], null, true)}
      </div>
      <div class="form-group">
        <label class="field-label">صِف تجربتك إن وُجدت (اختياري)</label>
        <textarea name="experienceDescription" placeholder="وصف مختصر لأي تجربة سابقة"></textarea>
      </div>
      <button class="btn btn-primary btn-block" type="submit">إرسال طلب المشاركة</button>
    </form>`;
}

function pageShareConfirmation(query) {
  const kind = query.kind === "participation" ? "participation" : "challenge";
  const ref = query.ref || "";
  const title = kind === "challenge" ? "تم استلام تحديك بنجاح" : "تم استلام طلب مشاركتك بنجاح";
  return `
    <div class="card" style="max-width:520px;margin:40px auto;text-align:center;">
      <h2>${title}</h2>
      <p class="text-muted">رقم الطلب: <span class="req-id" style="font-size:16px;">${escapeHtml(ref)}</span></p>
      <p class="text-faint">يرجى الاحتفاظ برقم الطلب للمراجعة لاحقًا. سيتواصل معك سفير الذكاء الاصطناعي المختص قريبًا.</p>
      <a class="btn btn-outline" href="#/">العودة للرئيسية</a>
    </div>`;
}

// ---------------------------------------------------------------------------
// مساحة السفراء — الدخول والتسجيل
// ---------------------------------------------------------------------------
function pageWorkspaceGate() {
  if (!State.loaded.ambassadors) return loadingHtml();
  return `
    <div class="page-title-row"><h2>بوابة السفراء</h2></div>
    <div class="grid grid-2">
      <div class="card" style="max-width:420px;">
        <h3>دخول سفير مسجَّل</h3>
        <p class="text-muted" style="font-size:13.5px;">هذه المساحة مخصصة لسفراء الذكاء الاصطناعي فقط.</p>
        <form data-form="ambassadorGate">
          <div class="form-group">
            <label class="field-label">أنا:</label>
            <select name="ambassadorId" required>${selectOptions(State.ambassadors, "id", "name", null, "اختر اسمك")}</select>
          </div>
          <div class="form-group">
            <label class="field-label">كود الوصول</label>
            <input type="text" name="code" required placeholder="••••••••" />
          </div>
          <button class="btn btn-primary btn-block" type="submit">دخول</button>
        </form>
      </div>
      <div class="card" style="max-width:420px;">
        <h3>سفير جديد؟</h3>
        <p class="text-muted" style="font-size:13.5px;">سجّل بياناتك لإضافة ملفك كسفير ذكاء اصطناعي.</p>
        <form data-form="ambassadorRegister">
          <div class="form-group">
            <label class="field-label">الاسم الثنائي</label>
            <input type="text" name="name" required placeholder="اسمك الكامل" />
          </div>
          <div class="form-group">
            <label class="field-label">الإدارة</label>
            <select name="department" required>${selectOptions(DEPARTMENTS, null, null, null, "اختر الإدارة")}</select>
          </div>
          <div class="form-group">
            <label class="field-label">المسار</label>
            <select name="track" required>${selectOptions(AI_TRACKS, null, null, null, "اختر المسار")}</select>
          </div>
          <div class="form-group">
            <label class="field-label">كود الوصول</label>
            <input type="text" name="code" required placeholder="••••••••" />
          </div>
          <button class="btn btn-outline btn-block" type="submit">تسجيل وإنشاء ملف سفير</button>
        </form>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// بوابة السفراء — البطاقات الموجزة + التبويبات الفرعية
// ---------------------------------------------------------------------------
function workspaceSummaryCards(query) {
  const mine = State.challenges.filter((c) => c.assignedAmbassadorId === myId());
  const openCount = mine.filter((c) => isChallengeOpenStatus(c.status)).length;
  const newCount = mine.filter((c) => c.status === CHALLENGE_DEFAULT_STATUS).length;
  const progressCount = mine.filter((c) => c.status === "implementing").length;
  const doneCount = mine.filter((c) => c.status === "completed").length;
  const cardLink = (status) => `#/workspace/challenges?scope=mine${status ? "&status=" + encodeURIComponent(status) : ""}`;
  const tile = (label, num, href) => `<a class="card stat-tile stat-tile-link" href="${href}"><div class="stat-num">${num}</div><div class="stat-label">${label}</div></a>`;
  return `<div class="grid grid-4" style="margin-bottom:22px;">
    ${tile("تحدياتي المفتوحة", openCount, cardLink(""))}
    ${tile("تحديات جديدة", newCount, cardLink(CHALLENGE_DEFAULT_STATUS))}
    ${tile("قيد التنفيذ", progressCount, cardLink("implementing"))}
    ${tile("مكتملة", doneCount, cardLink("completed"))}
  </div>`;
}
function workspaceSubtabs(active) {
  return `<div class="subnav">
    <a class="${active === "challenges" ? "active" : ""}" href="#/workspace/challenges">التحديات</a>
    <a class="${active === "participation" ? "active" : ""}" href="#/workspace/participation">طلبات المشاركة</a>
  </div>`;
}
function scopeToggle(basePath, query) {
  const scope = query.scope === "all" ? "all" : "mine";
  const qs = (s) => {
    const q = { ...query, scope: s };
    delete q.ref;
    const parts = Object.entries(q).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
    return parts.length ? `${basePath}?${parts.join("&")}` : basePath;
  };
  return `<div class="toggle-group">
    <a class="toggle-btn ${scope === "mine" ? "active" : ""}" href="${qs("mine")}">طلباتي</a>
    <a class="toggle-btn ${scope === "all" ? "active" : ""}" href="${qs("all")}">جميع الطلبات</a>
  </div>`;
}

function applyCommonFilters(list, query) {
  const scope = query.scope === "all" ? "all" : "mine";
  let out = list;
  if (scope === "mine") out = out.filter((r) => r.assignedAmbassadorId === myId());
  if (query.q) {
    const q = query.q.toLowerCase();
    out = out.filter((r) =>
      (r.title || r.name || "").toLowerCase().includes(q) ||
      (r.refNumber || r.id || "").toLowerCase().includes(q) ||
      (r.employeeName || "").toLowerCase().includes(q)
    );
  }
  if (query.amb) out = out.filter((r) => r.assignedAmbassadorId === query.amb);
  if (query.dept) out = out.filter((r) => r.department === query.dept || r.track === query.dept);
  if (query.status) out = out.filter((r) => r.status === query.status);
  return out;
}

function filterBarHtml(basePath, query, statusList) {
  const qs = (overrides) => {
    const q = { ...query, ...overrides };
    const parts = Object.entries(q).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
    return parts.length ? `${basePath}?${parts.join("&")}` : basePath;
  };
  return `
    <form class="filter-bar card" data-form="filterForm" data-base="${basePath}">
      <input type="hidden" name="scope" value="${escapeHtml(query.scope === "all" ? "all" : "mine")}" />
      <input type="text" name="q" value="${escapeHtml(query.q || "")}" placeholder="بحث بالعنوان أو رقم الطلب أو اسم الموظف" />
      <select name="amb">${selectOptions(State.ambassadors, "id", "name", query.amb, "كل السفراء")}</select>
      <select name="dept">${deptTrackSelectOptions(query.dept)}</select>
      <select name="status">${selectOptions(statusList, "id", "label", query.status, "كل الحالات")}</select>
      <button class="btn btn-outline btn-sm" type="submit">تطبيق الفلاتر</button>
      ${(query.q || query.amb || query.dept || query.status) ? `<a class="btn btn-ghost btn-sm" href="${qs({ q: "", amb: "", dept: "", status: "" })}">إعادة ضبط</a>` : ""}
    </form>`;
}

function challengeRowHtml(c) {
  return `
    <a class="card list-row" href="#/workspace/challenges/${encodeURIComponent(c.id)}">
      <div class="list-row-main">
        <div class="req-id">${escapeHtml(c.refNumber || c.id)}</div>
        <div class="req-title">${escapeHtml(c.title)}</div>
        <div class="req-meta">
          <span>${escapeHtml(c.employeeName || "—")} · ${escapeHtml(c.department || "—")} / ${escapeHtml(c.track || "—")}</span>
          <span>السفير: ${escapeHtml(c.assignedAmbassadorName || "غير معيّن")}</span>
          <span>${formatDate(c.submittedAt || c.createdAt)}</span>
        </div>
      </div>
      ${challengeStatusBadge(c.status)}
    </a>`;
}
function participationRowHtml(p) {
  return `
    <a class="card list-row" href="#/workspace/participation/${encodeURIComponent(p.id)}">
      <div class="list-row-main">
        <div class="req-id">${escapeHtml(p.refNumber || p.id)}</div>
        <div class="req-title">${escapeHtml(p.name)}</div>
        <div class="req-meta">
          <span>${escapeHtml(p.department || "—")} / ${escapeHtml(p.track || "—")}</span>
          <span>السفير: ${escapeHtml(p.assignedAmbassadorName || "غير معيّن")}</span>
          <span>${formatDate(p.submittedAt || p.createdAt)}</span>
        </div>
      </div>
      ${participationStatusBadge(p.status)}
    </a>`;
}

function pageWorkspaceChallenges(query) {
  if (!State.loaded.challenges) return loadingHtml();
  const list = applyCommonFilters(State.challenges, query);
  return `
    ${workspaceSummaryCards(query)}
    ${workspaceSubtabs("challenges")}
    ${scopeToggle("#/workspace/challenges", query)}
    ${filterBarHtml("#/workspace/challenges", query, CHALLENGE_STATUSES)}
    ${list.length === 0
      ? emptyStateHtml("لا توجد طلبات حاليًا", "لا توجد تحديات مطابقة لهذا العرض.")
      : `<div class="list-stack">${list.map(challengeRowHtml).join("")}</div>`}`;
}
function pageWorkspaceParticipation(query) {
  if (!State.loaded.participation) return loadingHtml();
  const list = applyCommonFilters(State.participation, query);
  return `
    ${workspaceSummaryCards(query)}
    ${workspaceSubtabs("participation")}
    ${scopeToggle("#/workspace/participation", query)}
    ${filterBarHtml("#/workspace/participation", query, PARTICIPATION_STATUSES)}
    ${list.length === 0
      ? emptyStateHtml("لا توجد طلبات حاليًا", "لا توجد طلبات مشاركة مطابقة لهذا العرض.")
      : `<div class="list-stack">${list.map(participationRowHtml).join("")}</div>`}`;
}

// ---------------------------------------------------------------------------
// تفاصيل الطلب — مشتركة بين التحديات وطلبات المشاركة
// ---------------------------------------------------------------------------
function historySectionsHtml(item) {
  const statusHist = (item.statusHistory || []).slice().reverse();
  const assignHist = (item.assignmentHistory || []).slice().reverse();
  const notes = (item.notes || []).slice().reverse();
  return `
    <div class="grid grid-2">
      <div class="card">
        <h3>ملاحظات الفريق</h3>
        <p class="text-faint" style="margin-bottom:10px;">داخلية — لا تظهر لصاحب الطلب.</p>
        <form data-form="addNote" data-id="${escapeHtml(item.id)}" data-kind="${item._kind}">
          <textarea name="text" required placeholder="أضف ملاحظة للفريق..."></textarea>
          <button class="btn btn-outline btn-sm" style="margin-top:8px;" type="submit">إضافة ملاحظة</button>
        </form>
        <div class="divider"></div>
        <div class="note-list">
          ${notes.map((n) => `
            <div class="note-item">
              ${escapeHtml(n.text)}
              <div class="meta">${escapeHtml(n.author || "—")} — ${formatDateTime(n.at)}</div>
            </div>`).join("") || `<p class="text-faint">لا توجد ملاحظات بعد.</p>`}
        </div>
      </div>
      <div class="card">
        <h3>سجل الحالات</h3>
        <div class="note-list">
          ${statusHist.map((h) => `
            <div class="note-item">
              ${escapeHtml(h.from ? (statusLabelFor(item._kind, h.from) + " ← ") : "")}${escapeHtml(statusLabelFor(item._kind, h.to))}
              <div class="meta">${escapeHtml(h.changedBy || "—")} — ${formatDateTime(h.changedAt)}</div>
            </div>`).join("") || `<p class="text-faint">لا يوجد سجل حالات بعد.</p>`}
        </div>
        <div class="divider"></div>
        <h3>سجل التحويلات</h3>
        <div class="note-list">
          ${assignHist.map((h) => `
            <div class="note-item">
              ${escapeHtml(h.fromName || "غير معيّن")} ← ${escapeHtml(h.toName || "غير معيّن")}
              <div class="meta">السبب: ${escapeHtml(h.reason === "أخرى" ? (h.reasonOther || "أخرى") : (h.reason || "—"))}
                — ${escapeHtml(h.changedBy || "—")} — ${formatDateTime(h.changedAt)}</div>
            </div>`).join("") || `<p class="text-faint">لا يوجد سجل تحويلات بعد.</p>`}
        </div>
      </div>
    </div>`;
}
function statusLabelFor(kind, id) { return kind === "challenge" ? challengeStatusLabel(id) : participationStatusLabel(id); }

function managementSectionHtml(item, kind, statusList) {
  return `
    <div class="card" style="margin-bottom:18px;">
      <h3>إدارة الطلب</h3>
      <div class="grid grid-2">
        <div class="form-group">
          <label class="field-label">الحالة الحالية</label>
          <select data-autochange="changeStatus" data-id="${escapeHtml(item.id)}" data-kind="${kind}">
            ${selectOptions(statusList, "id", "label", item.status)}
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">السفير المسؤول</label>
          <select data-autochange="reassign" data-id="${escapeHtml(item.id)}" data-kind="${kind}">
            <option value="">غير معيّن</option>
            ${selectOptions(State.ambassadors, "id", "name", item.assignedAmbassadorId)}
          </select>
        </div>
      </div>
      ${item.closureReason ? `<div class="notice-box closure-box">سبب الإغلاق: ${escapeHtml(item.closureReason)}
        <div class="text-faint" style="margin-top:4px;">${escapeHtml(item.closedBy || "—")} — ${formatDateTime(item.closedAt)}</div></div>` : ""}
    </div>`;
}

function pageChallengeDetail(id) {
  if (!State.loaded.challenges || !State.loaded.ambassadors) return loadingHtml();
  const c = getChallengeById(id);
  if (!c) return notFoundHtml("لم يتم العثور على هذا الطلب");
  c._kind = "challenge";
  return `
    ${workspaceSubtabs("challenges")}
    <div class="breadcrumb"><a href="#/workspace/challenges">التحديات</a> / ${escapeHtml(c.refNumber || c.id)}</div>
    <div class="page-title-row">
      <div>
        <h2 style="margin-bottom:6px;">${escapeHtml(c.title)}</h2>
        <div style="display:flex;gap:8px;align-items:center;">${challengeStatusBadge(c.status)}<span class="req-id">${escapeHtml(c.refNumber || c.id)}</span></div>
      </div>
    </div>
    <div class="card" style="margin-bottom:18px;">
      <div class="kv-list">
        <div class="kv-item"><div class="k">اسم الموظف</div><div class="v">${escapeHtml(c.employeeName)}</div></div>
        <div class="kv-item"><div class="k">الرقم الوظيفي</div><div class="v">${escapeHtml(c.employeeId)}</div></div>
        <div class="kv-item"><div class="k">المسار / الإدارة</div><div class="v">${escapeHtml(c.department)} / ${escapeHtml(c.track)}</div></div>
        <div class="kv-item"><div class="k">الوقت الذي تستغرقه المهمة</div><div class="v">${escapeHtml(c.timeImpact)}</div></div>
        <div class="kv-item"><div class="k">من يتأثر</div><div class="v">${escapeHtml(c.affectedParties)}</div></div>
        <div class="kv-item"><div class="k">تاريخ الإرسال</div><div class="v">${formatDate(c.submittedAt || c.createdAt)}</div></div>
      </div>
      <div class="divider"></div>
      <div class="kv-item"><div class="k">شرح التحدي</div><div class="v">${escapeHtml(c.description)}</div></div>
    </div>
    ${managementSectionHtml(c, "challenge", CHALLENGE_STATUSES)}
    ${historySectionsHtml(c)}`;
}

function pageParticipationDetail(id) {
  if (!State.loaded.participation || !State.loaded.ambassadors) return loadingHtml();
  const p = getParticipationById(id);
  if (!p) return notFoundHtml("لم يتم العثور على هذا الطلب");
  p._kind = "participation";
  return `
    ${workspaceSubtabs("participation")}
    <div class="breadcrumb"><a href="#/workspace/participation">طلبات المشاركة</a> / ${escapeHtml(p.refNumber || p.id)}</div>
    <div class="page-title-row">
      <div>
        <h2 style="margin-bottom:6px;">${escapeHtml(p.name)}</h2>
        <div style="display:flex;gap:8px;align-items:center;">${participationStatusBadge(p.status)}<span class="req-id">${escapeHtml(p.refNumber || p.id)}</span></div>
      </div>
    </div>
    <div class="card" style="margin-bottom:18px;">
      <div class="kv-list">
        <div class="kv-item"><div class="k">الرقم الوظيفي</div><div class="v">${escapeHtml(p.employeeId)}</div></div>
        <div class="kv-item"><div class="k">المسار / الإدارة</div><div class="v">${escapeHtml(p.department)} / ${escapeHtml(p.track)}</div></div>
        <div class="kv-item"><div class="k">أدوات الذكاء الاصطناعي</div><div class="v">${escapeHtml((p.aiTools || []).join("، ") || "—")}${p.aiToolsOther ? " — " + escapeHtml(p.aiToolsOther) : ""}</div></div>
        <div class="kv-item"><div class="k">بناء منتج سابق؟</div><div class="v">${escapeHtml(p.hasBuiltBefore || "—")}</div></div>
        <div class="kv-item"><div class="k">تاريخ الطلب</div><div class="v">${formatDate(p.submittedAt || p.createdAt)}</div></div>
      </div>
      ${p.experienceDescription ? `<div class="divider"></div><div class="kv-item"><div class="k">وصف التجربة</div><div class="v">${escapeHtml(p.experienceDescription)}</div></div>` : ""}
    </div>
    ${managementSectionHtml(p, "participation", PARTICIPATION_STATUSES)}
    ${historySectionsHtml(p)}`;
}

// ---------------------------------------------------------------------------
// حالات فارغة / تحميل / غير موجود
// ---------------------------------------------------------------------------
function loadingHtml() { return `<div class="loading-state">جارِ تحميل البيانات…</div>`; }
function emptyStateHtml(title, desc) {
  return `<div class="empty-state"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc || "")}</p></div>`;
}
function notFoundHtml(msg) {
  return `<div class="empty-state"><h3>${escapeHtml(msg)}</h3><a href="#/" class="btn btn-outline btn-sm">العودة للرئيسية</a></div>`;
}
function configMissingHtml() {
  return `<div class="empty-state"><h3>إعداد أولي مطلوب</h3>
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
  } else if (p0 === "share" && !parts[1]) {
    html = pageShare();
  } else if (p0 === "share" && parts[1] === "challenge") {
    html = pageShareChallenge();
    routeKey = "share-challenge";
  } else if (p0 === "share" && parts[1] === "participate") {
    html = pageShareParticipate();
    routeKey = "share-participate";
  } else if (p0 === "share" && parts[1] === "confirmation") {
    html = pageShareConfirmation(query);
  } else if (p0 === "workspace") {
    if (!State.ambUnlocked) {
      html = pageWorkspaceGate();
      routeKey = "workspace-gate";
    } else if (!parts[1]) {
      navigate("#/workspace/challenges");
      return;
    } else if (parts[1] === "challenges" && !parts[2]) {
      html = pageWorkspaceChallenges(query);
      routeKey = "workspace-challenges";
    } else if (parts[1] === "challenges" && parts[2]) {
      html = pageChallengeDetail(decodeURIComponent(parts[2]));
      routeKey = "workspace-challenge-detail";
    } else if (parts[1] === "participation" && !parts[2]) {
      html = pageWorkspaceParticipation(query);
      routeKey = "workspace-participation";
    } else if (parts[1] === "participation" && parts[2]) {
      html = pageParticipationDetail(decodeURIComponent(parts[2]));
      routeKey = "workspace-participation-detail";
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
  if (action === "logoutAmbassador") { clearLocalAmbassador(); navigate("#/"); render(); return; }
});

document.addEventListener("change", (e) => {
  const auto = e.target.closest("[data-autochange]");
  if (!auto) return;
  const action = auto.dataset.autochange;
  const id = auto.dataset.id;
  const kind = auto.dataset.kind;
  const value = auto.value;
  const layer = kind === "challenge" ? DataLayer.challenges : DataLayer.participation;
  const item = kind === "challenge" ? getChallengeById(id) : getParticipationById(id);
  if (!item) return;

  if (action === "changeStatus") {
    const requiresClosure = kind === "challenge" && isChallengeClosureStatus(value);
    if (requiresClosure) {
      openClosureReasonModal(id, kind, item.status, value);
      auto.value = item.status; // لا نغيّر القيمة المعروضة حتى تأكيد السبب
      return;
    }
    layer.changeStatus(id, { from: item.status, to: value, changedBy: currentAmbName() })
      .then(() => toast("تم تحديث الحالة إلى: " + statusLabelFor(kind, value)))
      .catch((err) => toast("خطأ: " + err.message, "error"));
  } else if (action === "reassign") {
    openReassignModal(id, kind, item.assignedAmbassadorId, item.assignedAmbassadorName, value);
    auto.value = item.assignedAmbassadorId || ""; // ننتظر تأكيد سبب التحويل
  }
});

function currentAmbName() { return State.ambIdentity ? State.ambIdentity.name : "سفير"; }

document.addEventListener("submit", (e) => {
  const form = e.target.closest("form[data-form]");
  if (!form) return;
  e.preventDefault();
  const type = form.dataset.form;
  const fd = new FormData(form);
  const val = (k) => (fd.get(k) || "").toString().trim();

  if (type === "filterForm") {
    const base = form.dataset.base;
    const q = { scope: val("scope") || "mine", q: val("q"), amb: val("amb"), dept: val("dept"), status: val("status") };
    const parts = Object.entries(q).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
    navigate(parts.length ? `${base}?${parts.join("&")}` : base);
    return;
  }

  if (type === "submitChallenge") {
    const ambId = val("ambassadorId");
    const amb = ambId ? getAmbassadorById(ambId) : null;
    const now = new Date().toISOString();
    DataLayer.counters.next("challenges", "AI-CH").then((refNumber) => {
      const data = {
        id: refNumber, refNumber,
        employeeName: val("employeeName"), employeeId: val("employeeId"),
        department: val("department"), track: val("track"),
        title: val("title"), description: val("description"),
        timeImpact: val("timeImpact"), affectedParties: val("affectedParties"),
        status: CHALLENGE_DEFAULT_STATUS,
        closureReason: null, closedBy: null, closedAt: null,
        originalAmbassadorId: amb ? amb.id : null, originalAmbassadorName: amb ? amb.name : null,
        assignedAmbassadorId: amb ? amb.id : null, assignedAmbassadorName: amb ? amb.name : null,
        statusHistory: [{ from: null, to: CHALLENGE_DEFAULT_STATUS, changedBy: "النظام", changedAt: now }],
        assignmentHistory: [],
        notes: [],
        submittedAt: now, createdAt: now, updatedAt: now,
      };
      return DataLayer.challenges.create(refNumber, data);
    }).then((data) => {
      navigate(`#/share/confirmation?kind=challenge&ref=${encodeURIComponent(data.refNumber)}`);
    }).catch((err) => toast("تعذّر إرسال الطلب: " + err.message, "error"));
    return;
  }

  if (type === "submitParticipation") {
    const ambId = val("ambassadorId");
    const amb = ambId ? getAmbassadorById(ambId) : null;
    const now = new Date().toISOString();
    const aiTools = fd.getAll("aiTools");
    DataLayer.counters.next("participation", "AI-PT").then((refNumber) => {
      const data = {
        id: refNumber, refNumber,
        name: val("employeeName"), employeeId: val("employeeId"),
        department: val("department"), track: val("track"),
        aiTools, aiToolsOther: val("aiToolsOther"),
        hasBuiltBefore: val("hasBuiltBefore"), experienceDescription: val("experienceDescription"),
        status: PARTICIPATION_DEFAULT_STATUS,
        originalAmbassadorId: amb ? amb.id : null, originalAmbassadorName: amb ? amb.name : null,
        assignedAmbassadorId: amb ? amb.id : null, assignedAmbassadorName: amb ? amb.name : null,
        statusHistory: [{ from: null, to: PARTICIPATION_DEFAULT_STATUS, changedBy: "النظام", changedAt: now }],
        assignmentHistory: [],
        notes: [],
        submittedAt: now, createdAt: now, updatedAt: now,
      };
      return DataLayer.participation.create(refNumber, data);
    }).then((data) => {
      navigate(`#/share/confirmation?kind=participation&ref=${encodeURIComponent(data.refNumber)}`);
    }).catch((err) => toast("تعذّر إرسال الطلب: " + err.message, "error"));
    return;
  }

  if (type === "ambassadorGate") {
    const ambassadorId = val("ambassadorId"), code = val("code");
    if (code !== AMBASSADOR_ACCESS_CODE) { toast("كود الوصول غير صحيح", "error"); return; }
    const amb = getAmbassadorById(ambassadorId);
    if (!amb) { toast("يرجى اختيار اسمك من القائمة", "error"); return; }
    saveLocalAmbassador({ ambassadorId, name: amb.name });
    toast("مرحبًا بك، " + amb.name);
    navigate("#/workspace/challenges");
    return;
  }

  if (type === "ambassadorRegister") {
    const code = val("code");
    if (code !== AMBASSADOR_ACCESS_CODE) { toast("كود الوصول غير صحيح", "error"); return; }
    const name = val("name"), department = val("department"), track = val("track");
    if (!name || !department || !track) { toast("يرجى تعبئة كل الحقول", "error"); return; }
    DataLayer.ambassadors.create({ name, department, track })
      .then((amb) => {
        saveLocalAmbassador({ ambassadorId: amb.id, name: amb.name });
        toast("تم إنشاء ملفك كسفير بنجاح");
        navigate("#/workspace/challenges");
      })
      .catch((err) => toast("تعذّر إنشاء الملف: " + err.message, "error"));
    return;
  }

  if (type === "addNote") {
    const id = form.dataset.id, kind = form.dataset.kind, text = val("text");
    if (!text) return;
    const layer = kind === "challenge" ? DataLayer.challenges : DataLayer.participation;
    layer.addNote(id, { text, author: currentAmbName(), at: new Date().toISOString() })
      .then(() => { toast("تمت إضافة الملاحظة"); form.reset(); })
      .catch((err) => toast("خطأ: " + err.message, "error"));
    return;
  }

  if (type === "closureReasonForm") {
    const id = form.dataset.id, kind = form.dataset.kind, fromStatus = form.dataset.from, toStatus = form.dataset.to;
    const reason = val("closureReason");
    if (!reason) { toast("سبب الإغلاق إلزامي", "error"); return; }
    const layer = kind === "challenge" ? DataLayer.challenges : DataLayer.participation;
    const now = new Date().toISOString();
    layer.changeStatus(id, { from: fromStatus, to: toStatus, changedBy: currentAmbName(), closureReason: reason, closedBy: currentAmbName(), closedAt: now })
      .then(() => { toast("تم إغلاق الطلب"); closeModal(); })
      .catch((err) => toast("خطأ: " + err.message, "error"));
    return;
  }

  if (type === "reassignForm") {
    const id = form.dataset.id, kind = form.dataset.kind;
    const fromId = form.dataset.fromId || null, fromName = form.dataset.fromName || null;
    const toId = form.dataset.toId || null;
    const toAmb = toId ? getAmbassadorById(toId) : null;
    let reason = fd.get("reason");
    const reasonOther = val("reasonOther");
    if (!reason) { toast("يرجى اختيار سبب التحويل", "error"); return; }
    if (reason === "أخرى" && !reasonOther) { toast("يرجى كتابة سبب التحويل", "error"); return; }
    const layer = kind === "challenge" ? DataLayer.challenges : DataLayer.participation;
    layer.reassign(id, {
      from: fromId, to: toId, fromName, toName: toAmb ? toAmb.name : null,
      reason, reasonOther, changedBy: currentAmbName(),
    }).then(() => { toast("تم تحديث السفير المسؤول"); closeModal(); })
      .catch((err) => toast("خطأ: " + err.message, "error"));
    return;
  }
});

// ---------------------------------------------------------------------------
// نوافذ منبثقة: سبب الإغلاق / سبب التحويل
// ---------------------------------------------------------------------------
function openClosureReasonModal(id, kind, fromStatus, toStatus) {
  openModal(`
    <h3>سبب الإغلاق</h3>
    <p class="text-faint">الحالة المختارة «${escapeHtml(statusLabelFor(kind, toStatus))}» تتطلب كتابة سبب الإغلاق قبل الحفظ.</p>
    <form data-form="closureReasonForm" data-id="${escapeHtml(id)}" data-kind="${escapeHtml(kind)}" data-from="${escapeHtml(fromStatus)}" data-to="${escapeHtml(toStatus)}">
      <div class="form-group">
        <label class="field-label">سبب الإغلاق</label>
        <textarea name="closureReason" required placeholder="اكتب سبب الإغلاق"></textarea>
      </div>
      <button class="btn btn-primary btn-block" type="submit">تأكيد الإغلاق</button>
    </form>`);
}
function openReassignModal(id, kind, fromId, fromName, toId) {
  const toAmb = toId ? getAmbassadorById(toId) : null;
  openModal(`
    <h3>سبب التحويل</h3>
    <p class="text-faint">تحويل من «${escapeHtml(fromName || "غير معيّن")}» إلى «${escapeHtml(toAmb ? toAmb.name : "غير معيّن")}»</p>
    <form data-form="reassignForm" data-id="${escapeHtml(id)}" data-kind="${escapeHtml(kind)}" data-from-id="${escapeHtml(fromId || "")}" data-from-name="${escapeHtml(fromName || "")}" data-to-id="${escapeHtml(toId || "")}">
      <div class="form-group">
        <label class="field-label">سبب التحويل</label>
        ${pillGroup("reason", REASSIGNMENT_REASONS, null, true)}
      </div>
      <div class="form-group">
        <label class="field-label">تفصيل إضافي (عند اختيار «أخرى»)</label>
        <input type="text" name="reasonOther" placeholder="اكتب السبب" />
      </div>
      <button class="btn btn-primary btn-block" type="submit">تأكيد التحويل</button>
    </form>`);
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

  render();

  try {
    DataLayer.ambassadors.subscribeAll(
      (list) => { State.ambassadors = list; State.loaded.ambassadors = true; onDataChange(); },
      (err) => console.error("ambassadors subscribe error", err)
    );
  } catch (e) { console.error("ambassadors subscribeAll failed", e); }

  try {
    DataLayer.challenges.subscribeAll(
      (list) => { State.challenges = list; State.loaded.challenges = true; onDataChange(); },
      (err) => console.error("challenges subscribe error", err)
    );
  } catch (e) { console.error("challenges subscribeAll failed", e); }

  try {
    DataLayer.participation.subscribeAll(
      (list) => { State.participation = list; State.loaded.participation = true; onDataChange(); },
      (err) => console.error("participation subscribe error", err)
    );
  } catch (e) { console.error("participation subscribeAll failed", e); }
}

document.addEventListener("DOMContentLoaded", init);
