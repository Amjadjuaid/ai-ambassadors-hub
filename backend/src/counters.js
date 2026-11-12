const { db } = require("./firebaseAdmin");

// عدّاد ذرّي (Transaction) — نفس منطق DataLayer.counters.next في الواجهة القديمة،
// لكن الآن يعمل فقط من السيرفر، وهذا يمنع أي تلاعب بالرقم المرجعي من المتصفح.
async function nextRef(kind, prefix) {
  const ref = db.collection("counters").doc(kind);
  const seq = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data().seq || 0) : 0;
    const nextSeq = current + 1;
    tx.set(ref, { seq: nextSeq }, { merge: true });
    return nextSeq;
  });
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

module.exports = { nextRef };
