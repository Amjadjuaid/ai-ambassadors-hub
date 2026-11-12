const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("./firebaseAdmin");

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "12h";

function signToken(ambassador) {
  return jwt.sign({ sub: ambassador.id, name: ambassador.name }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// POST /api/auth/login  { ambassadorId, password }
async function login(req, res) {
  try {
    const { ambassadorId, password } = req.body || {};
    if (!ambassadorId || !password) {
      return res.status(400).json({ error: "ambassadorId و password مطلوبان" });
    }
    const snap = await db.collection("ambassadors").doc(ambassadorId).get();
    if (!snap.exists) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }
    const amb = snap.data();
    if (!amb.passwordHash) {
      // سفير لم يُفعَّل له كلمة مرور بعد
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }
    const ok = await bcrypt.compare(password, amb.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }
    const token = signToken({ id: ambassadorId, name: amb.name });
    return res.json({ token, ambassador: { id: ambassadorId, name: amb.name, department: amb.department || null, track: amb.track || null } });
  } catch (err) {
    console.error("login error", err);
    return res.status(500).json({ error: "خطأ غير متوقع" });
  }
}

// POST /api/auth/change-password  { oldPassword, newPassword }  — يتطلب مصادقة
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" });
    }
    const ref = db.collection("ambassadors").doc(req.ambassador.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "غير موجود" });
    const amb = snap.data();
    const ok = amb.passwordHash && (await bcrypt.compare(oldPassword, amb.passwordHash));
    if (!ok) return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
    const newHash = await bcrypt.hash(newPassword, 12);
    await ref.update({ passwordHash: newHash, passwordUpdatedAt: new Date().toISOString() });
    return res.json({ ok: true });
  } catch (err) {
    console.error("changePassword error", err);
    return res.status(500).json({ error: "خطأ غير متوقع" });
  }
}

// Middleware: يتحقق من رمز JWT ويعبّي req.ambassador
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "غير مصرّح" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.ambassador = { id: payload.sub, name: payload.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: "جلسة منتهية أو غير صالحة" });
  }
}

module.exports = { login, changePassword, requireAuth, signToken };
