const { db, FieldValue } = require("./firebaseAdmin");

// مصنع عمليات مشترك لمجموعتي "challenges" و"participationRequests" —
// نفس منطق buildHistoryHelpers القديم في data.js، لكن بصلاحيات Admin SDK الكاملة
// فقط من داخل السيرفر، ومحمي الآن خلف المصادقة بدل ما كان مفتوح للجميع عبر Firestore.
function makeHistoryCollection(collectionName) {
  const col = () => db.collection(collectionName);

  function docToObj(doc) {
    if (!doc.exists) return null;
    return { ...doc.data(), _id: doc.id };
  }

  return {
    async create(refNumber, data) {
      await col().doc(refNumber).set(data);
      return data;
    },
    async get(id) {
      if (!id) return null;
      return docToObj(await col().doc(id).get());
    },
    async listAll() {
      const snap = await col().get();
      const list = snap.docs.map(docToObj).filter((x) => x && x.archived !== true && x.isTest !== true);
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return list;
    },
    async changeStatus(id, { from, to, changedBy, closureReason, closedBy, closedAt }) {
      const patch = {
        status: to,
        statusHistory: FieldValue.arrayUnion({ from, to, changedBy, changedAt: new Date().toISOString() }),
        updatedAt: new Date().toISOString(),
      };
      if (closureReason !== undefined && closureReason !== null) {
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
    async addNote(id, note) {
      await col().doc(id).update({
        notes: FieldValue.arrayUnion(note),
        updatedAt: new Date().toISOString(),
      });
    },
    async reassign(id, { from, to, fromName, toName, reason, reasonOther, changedBy }) {
      await col().doc(id).update({
        assignedAmbassadorId: to || null,
        assignedAmbassadorName: toName || null,
        assignmentHistory: FieldValue.arrayUnion({
          from: from || null, to: to || null, fromName: fromName || null, toName: toName || null,
          reason, reasonOther: reasonOther || null, changedBy, changedAt: new Date().toISOString(),
        }),
        updatedAt: new Date().toISOString(),
      });
    },
  };
}

module.exports = { makeHistoryCollection };
