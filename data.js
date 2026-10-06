// ============================================================================
// data.js — طبقة الوصول للبيانات (Data Access Layer)
//
// كل استدعاءات Firestore تمر من هنا فقط. باقي الملفات (app.js) لا تعرف شيئًا
// عن Firestore مباشرة — تتعامل فقط مع الدوال أدناه.
// ============================================================================

const DataLayer = (() => {
  function db() {
    if (!window.__FIREBASE_READY__ || !window.__FSDB__) {
      throw new Error("Firestore غير مهيأ. تحقق من firebase-config.js");
    }
    return window.__FSDB__;
  }
  const FieldValue = () => firebase.firestore.FieldValue;

  function docToObj(doc) {
    if (!doc.exists) return null;
    return { ...doc.data(), _id: doc.id };
  }

  // =========================================================================
  // الأرقام المرجعية — عدّاد ذري (Transaction) يضمن عدم التكرار.
  // =========================================================================
  const counters = {
    async next(kind, prefix) {
      const ref = db().collection("counters").doc(kind);
      const seq = await db().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const current = snap.exists ? (snap.data().seq || 0) : 0;
        const nextSeq = current + 1;
        tx.set(ref, { seq: nextSeq }, { merge: true });
        return nextSeq;
      });
      return `${prefix}-${String(seq).padStart(4, "0")}`;
    },
  };

  // =========================================================================
  // السفراء — بدون بيانات تجريبية. يُسجَّل السفير بنفسه عبر كود الوصول.
  // =========================================================================
  const ambassadors = {
    async list() {
      const snap = await db().collection("ambassadors").get();
      const list = snap.docs.map(docToObj).filter((a) => a && a.isDemo !== true);
      list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
      return list;
    },
    async get(id) {
      if (!id) return null;
      const snap = await db().collection("ambassadors").doc(id).get();
      return docToObj(snap);
    },
    async create({ name, department, track }) {
      const ref = db().collection("ambassadors").doc();
      const data = { id: ref.id, name, department, track, createdAt: new Date().toISOString() };
      await ref.set(data);
      return data;
    },
    async update(id, patch) {
      await db().collection("ambassadors").doc(id).update(patch);
    },
    subscribeAll(cb, onError) {
      return db().collection("ambassadors").onSnapshot((snap) => {
        const list = snap.docs.map(docToObj).filter((a) => a && a.isDemo !== true);
        list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
        cb(list);
      }, onError);
    },
  };

  // =========================================================================
  // أدوات مشتركة بين التحديات وطلبات المشاركة
  // =========================================================================
  function buildHistoryHelpers(collectionName) {
    const col = () => db().collection(collectionName);
    return {
      async create(refNumber, data) {
        const ref = col().doc(refNumber);
        await ref.set(data);
        return data;
      },
      async get(id) {
        if (!id) return null;
        const snap = await col().doc(id).get();
        return docToObj(snap);
      },
      async update(id, patch) {
        await col().doc(id).update({ ...patch, updatedAt: new Date().toISOString() });
      },
      async addNote(id, note) {
        await col().doc(id).update({
          notes: FieldValue().arrayUnion(note),
          updatedAt: new Date().toISOString(),
        });
      },
      async changeStatus(id, { from, to, changedBy, closureReason, closedBy, closedAt }) {
        const patch = {
          status: to,
          statusHistory: FieldValue().arrayUnion({ from, to, changedBy, changedAt: new Date().toISOString() }),
          updatedAt: new Date().toISOString(),
        };
        if (closureReason !== undefined) {
          patch.closureReason = closureReason;
          patch.closedBy = closedBy;
          patch.closedAt = closedAt;
        } else {
          patch.closureReason = null;
          patch.closedBy = null;
          patch.closedAt = null;
        }
        await col().doc(id).update(patch);
      },
      async reassign(id, { from, to, fromName, toName, reason, reasonOther, changedBy }) {
        await col().doc(id).update({
          assignedAmbassadorId: to || null,
          assignedAmbassadorName: toName || null,
          assignmentHistory: FieldValue().arrayUnion({
            from: from || null, to: to || null, fromName: fromName || null, toName: toName || null,
            reason, reasonOther: reasonOther || null, changedBy, changedAt: new Date().toISOString(),
          }),
          updatedAt: new Date().toISOString(),
        });
      },
      async listAll() {
        const snap = await col().get();
        const list = snap.docs.map(docToObj).filter((x) => x && x.archived !== true && x.isTest !== true);
        list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        return list;
      },
      subscribeAll(cb, onError) {
        return col().onSnapshot((snap) => {
          const list = snap.docs.map(docToObj).filter((x) => x && x.archived !== true && x.isTest !== true);
          list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
          cb(list);
        }, onError);
      },
    };
  }

  const challenges = buildHistoryHelpers("challenges");
  const participation = buildHistoryHelpers("participationRequests");

  return { counters, ambassadors, challenges, participation };
})();
