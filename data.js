// ============================================================================
// data.js — طبقة الوصول للبيانات (Data Access Layer)
//
// كل استدعاءات Firestore تمر من هنا فقط. باقي الملفات (app.js) لا تعرف شيئًا
// عن Firestore مباشرة — تتعامل فقط مع الدوال أدناه. هذا يسمح لاحقًا باستبدال
// المزوّد (مثلاً بقاعدة بيانات داخلية للمؤسسة) بتعديل هذا الملف فقط.
// ============================================================================

const DataLayer = (() => {
  function db() {
    if (!window.__FIREBASE_READY__ || !window.__FSDB__) {
      throw new Error("Firestore غير مهيأ. تحقق من firebase-config.js");
    }
    return window.__FSDB__;
  }
  const FieldValue = () => firebase.firestore.FieldValue;

  // ---- تحويل مستند Firestore إلى كائن JS عادي ----
  function docToObj(doc) {
    if (!doc.exists) return null;
    return { ...doc.data(), _id: doc.id };
  }

  // =========================================================================
  // الموظفون
  // =========================================================================
  const employees = {
    async upsert(employeeId, { name, department }) {
      const ref = db().collection("employees").doc(employeeId);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.update({ name, department, updatedAt: new Date().toISOString() });
      } else {
        await ref.set({
          employeeId,
          name,
          department,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      return (await ref.get()).data();
    },
    async get(employeeId) {
      if (!employeeId) return null;
      const snap = await db().collection("employees").doc(employeeId).get();
      return snap.exists ? snap.data() : null;
    },
  };

  // =========================================================================
  // الطلبات
  // =========================================================================
  const requests = {
    async create(request) {
      const ref = db().collection("requests").doc(request.id);
      await ref.set(request);
      return request;
    },
    async get(id) {
      if (!id) return null;
      const snap = await db().collection("requests").doc(id).get();
      return docToObj(snap);
    },
    async update(id, patch) {
      await db()
        .collection("requests")
        .doc(id)
        .update({ ...patch, updatedAt: new Date().toISOString() });
    },
    async addNote(id, note) {
      // note: { author, text, at }
      await db()
        .collection("requests")
        .doc(id)
        .update({
          notes: FieldValue().arrayUnion(note),
          updatedAt: new Date().toISOString(),
        });
    },
    async addEmployeeUpdate(id, text, author) {
      await db()
        .collection("requests")
        .doc(id)
        .update({
          updates: FieldValue().arrayUnion({ text, author, at: new Date().toISOString() }),
          updatedAt: new Date().toISOString(),
        });
    },
    async listByEmployee(employeeId) {
      const snap = await db().collection("requests").where("employeeId", "==", employeeId).get();
      const list = snap.docs.map(docToObj);
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return list;
    },
    async listAll() {
      const snap = await db().collection("requests").get();
      const list = snap.docs.map(docToObj);
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return list;
    },
    subscribeAll(cb, onError) {
      return db()
        .collection("requests")
        .onSnapshot((snap) => {
          const list = snap.docs.map(docToObj);
          list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
          cb(list);
        }, onError);
    },
    subscribeByEmployee(employeeId, cb, onError) {
      return db()
        .collection("requests")
        .where("employeeId", "==", employeeId)
        .onSnapshot((snap) => {
          const list = snap.docs.map(docToObj);
          list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
          cb(list);
        }, onError);
    },
  };

  // =========================================================================
  // السفراء
  // =========================================================================
  const ambassadors = {
    async list() {
      const snap = await db().collection("ambassadors").get();
      const list = snap.docs.map(docToObj);
      list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
      return list;
    },
    async get(id) {
      const snap = await db().collection("ambassadors").doc(id).get();
      return docToObj(snap);
    },
    async upsert(id, data) {
      await db().collection("ambassadors").doc(id).set(data, { merge: true });
    },
    async update(id, patch) {
      await db().collection("ambassadors").doc(id).update(patch);
    },
    subscribeAll(cb, onError) {
      return db()
        .collection("ambassadors")
        .onSnapshot((snap) => {
          const list = snap.docs.map(docToObj);
          list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
          cb(list);
        }, onError);
    },
  };

  // =========================================================================
  // رادار الفرص — تجمعات التحديات المتكررة
  // =========================================================================
  const clusters = {
    async list() {
      const snap = await db().collection("clusters").get();
      return snap.docs.map(docToObj);
    },
    async create(cluster) {
      const ref = cluster.id ? db().collection("clusters").doc(cluster.id) : db().collection("clusters").doc();
      const data = { ...cluster, id: ref.id };
      await ref.set(data);
      return data;
    },
    async update(id, patch) {
      await db().collection("clusters").doc(id).update(patch);
    },
    async addRequests(id, requestIds) {
      await db()
        .collection("clusters")
        .doc(id)
        .update({ requestIds: FieldValue().arrayUnion(...requestIds) });
    },
    async delete(id) {
      await db().collection("clusters").doc(id).delete();
    },
    subscribeAll(cb, onError) {
      return db().collection("clusters").onSnapshot((snap) => {
        cb(snap.docs.map(docToObj));
      }, onError);
    },
  };

  // =========================================================================
  // حالة البذور (Seed) — هل تم زرع البيانات التجريبية؟
  // =========================================================================
  const meta = {
    async getSeedStatus() {
      const snap = await db().collection("meta").doc("seed").get();
      return snap.exists ? snap.data() : null;
    },
    async markSeeded() {
      await db().collection("meta").doc("seed").set({ seededAt: new Date().toISOString() });
    },
  };

  // =========================================================================
  // أدوات إدارية — لأغراض الطيار فقط (مسح البيانات التجريبية)
  // =========================================================================
  const admin = {
    async clearDemoData() {
      const collections = ["requests", "clusters", "ambassadors", "employees"];
      let deleted = 0;
      for (const col of collections) {
        const snap = await db().collection(col).where("isDemo", "==", true).get();
        for (const d of snap.docs) {
          await d.ref.delete();
          deleted++;
        }
      }
      return deleted;
    },
  };

  return { employees, requests, ambassadors, clusters, meta, admin };
})();
