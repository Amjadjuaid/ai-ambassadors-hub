const express = require("express");
const { login, changePassword, requireAuth } = require("../auth");

const router = express.Router();

router.post("/login", login);
router.post("/change-password", requireAuth, changePassword);
// يسمح للواجهة تتأكد إن الجلسة المخزّنة لسه صالحة بدون إعادة إرسال كلمة المرور
router.get("/me", requireAuth, (req, res) => res.json({ ambassador: req.ambassador }));

module.exports = router;
