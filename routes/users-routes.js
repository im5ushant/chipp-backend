const express = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/users-controllers");
const profilePicUpload = require("../middleware/profile-pic-upload");
const aadharUpload = require("../middleware/aadhar-upload");
const pancardUpload = require("../middleware/pancard-upload");
const userimageUpload = require("../middleware/userimage-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

//User Signup
router.post(
  "/signup",
  profilePicUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").toLowerCase().isEmail(),
    check("password").isLength({ min: 6 }),
    check("phone").isMobilePhone(),
  ],
  usersControllers.signup
);
router.patch("/confirmemail/:token", usersControllers.confirmEmail);
router.post(
  "/signin",
  [
    check("email").toLowerCase().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersControllers.signin
);
router.patch("/verifyforgotpassword", usersControllers.verifyForgotPassword);
router.get("/confirmforgotpassword/:token", usersControllers.confirmForgotPassword);
router.patch("/changeforgotpassword/:token", usersControllers.changeForgotPassword);
router.get("/sendemail", usersControllers.sendemail);
router.get("/:uid", usersControllers.getUserById);
// router.post("/sendOTP", usersControllers.sendOTP);
// router.post("/verifyOTP", usersControllers.verifyOTP);

router.use(checkAuth);

router.patch("/kyc/aadhar", aadharUpload.single("aadhar"), usersControllers.aadharUpload);
router.patch("/kyc/pancard", pancardUpload.single("pancard"), usersControllers.pancardUpload);
router.patch("/kyc/userimage", userimageUpload.single("userimage"), usersControllers.userimageUpload);
router.patch("/updateprofiledetails", usersControllers.updateProfileDetails);
router.patch(
  "/changePassword",
  [check("newPass").isLength({ min: 6 })],
  usersControllers.changePassword
);

module.exports = router;
