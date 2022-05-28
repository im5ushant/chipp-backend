const express = require("express");

const noticeControllers = require("../controllers/notice-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/notices", noticeControllers.getNotices);

router.get("/filternotice", noticeControllers.filterNotice);

router.use(checkAuth);

router.get("/noticebyuser/:userId", noticeControllers.getNoticeByUserId);

router.post("/createnotice", noticeControllers.createNotice);

router.delete("/deletenotice/:id", noticeControllers.deleteNotice);

module.exports = router;