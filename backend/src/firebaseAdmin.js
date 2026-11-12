// تهيئة Firebase Admin SDK — هذا الملف وحده المخوّل يتحدث مع Firestore.
// لا تستخدم مفاتيح العميل (firebase-config.js) هنا أبدًا — هذا مفتاح خدمة منفصل
// بصلاحيات كاملة، ويجب أن يبقى سرّيًا (متغيرات بيئة فقط، لا يُرفع للمستودع).

const admin = require("firebase-admin");

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
    return JSON.parse(json);
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  throw new Error(
    "لم يتم ضبط بيانات اعتماد Firebase. عبّي FIREBASE_SERVICE_ACCOUNT_BASE64 أو FIREBASE_SERVICE_ACCOUNT_JSON في متغيرات البيئة."
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
  });
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

module.exports = { admin, db, FieldValue };
