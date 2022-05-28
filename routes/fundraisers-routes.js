const express = require("express");

const fundraisersControllers = require("../controllers/fundraisers-controllers");
const fundraiserPicUpload = require('../middleware/fundraiser-pic-upload');
const documentUpload = require('../middleware/document-upload');
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/fundraisers", fundraisersControllers.getFundraisers);
router.get("/fundraisers/:category", fundraisersControllers.getFundraisersByCategory);
router.get("/fundraisers/filter", fundraisersControllers.filterFundraisers);
router.get("/search", fundraisersControllers.searchFundraisers);
router.get("/:fid", fundraisersControllers.getFundraisersById);
router.patch("/:fid/donate", fundraisersControllers.donateFundraiser);  
router.post("/razorpay", fundraisersControllers.initRazorPay);

router.use(checkAuth);

router.post("/create", fundraiserPicUpload.single('cover'), fundraisersControllers.createFundraiser);  // Auth required
router.patch("/documents", documentUpload.single('document'), fundraisersControllers.uploadDocuments);
router.get("/user/:uid", fundraisersControllers.getFundraisersByUserId);    // Auth required
router.patch("/:fid/edit", fundraiserPicUpload.single('cover'), fundraisersControllers.editFundraiser);  // Auth required
router.patch("/:fid/addupdate", fundraisersControllers.addUpdate);  // Auth required
router.patch("/:fid/disable", fundraisersControllers.disableFundraiser);    // Auth required

//router.delete("/:fid", fundraisersControllers.deleteFundraiser);    // Auth required

module.exports = router;