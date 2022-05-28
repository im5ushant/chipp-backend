const fs = require("fs");
const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const { v4: uuidv4 } = require("uuid");
const Fundraiser = require("../models/fundraiser");
const User = require("../models/user");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: `${process.env.RAZORPAY_KEY_ID}`,
  key_secret: `${process.env.RAZORPAY_KEY_SECRET}`,
});




// ---------------- RAZORPAY --------------------
const initRazorPay = async (req, res) => {
  const { amount } = req.body;
  const currency = "INR";

  const options = {
    amount: (amount * 100).toString(),
    currency,
    receipt: uuidv4(),
  };

  try {
    const response = await razorpay.orders.create(options);
    // console.log(response);
    res.send({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
    });
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }
};





// --------------- CREATE FUNDRAISER -----------------------
const createFundraiser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors);
    return next(new HttpError("Invalid Field", 422));
  }

  const {
    name,
    title,
    category,
    state,
    city,
    amount,
    description,
    cover,
    documentone,
    doc2,
    doc3,
    creator,
  } = req.body;

  if (creator !== req.userData.userId) {
    // console.log(creator);
    // console.log(req.userData.userId);
    const error = new HttpError(
      "You are not allowed to create this fundraiser",
      401
    );
    return next(error);
  }

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for the provided id", 404);
    return next(error);
  }

  // console.log(req.file);

  const createdFundraiser = new Fundraiser({
    active: true,
    name,
    title,
    category,
    state,
    city,
    amount,
    description,
    cover: req.file.path,
    // documentone: req.file.path,
    // doc2: req.file.path,
    // doc3: req.file.path,
    collectionAmt: 0,
    creator,
    updates: [],
    donors: [],
  });

  // console.log(createdFundraiser);

  createdFundraiser.creatorName = user.name;

  try {
    await createdFundraiser.save();
    user.fundraisers.unshift(createdFundraiser);
    await user.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(201).json({ id: createdFundraiser.id });
};




// --------------- UPLOAD DOCUMENTS -----------------
const uploadDocuments = async (req, res, next) => {
  const { fundraiserId } = req.body;

  // for(var i = 0; i < req.files.length; i++){
  //   documents.push(req.files[i].path);
  // }

  let fundraiser;
  try {
    fundraiser = await Fundraiser.findById(fundraiserId);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!fundraiser) {
    const error = new HttpError(
      "Could not find the fundraiser for the provided id.",
      404
    );
    return next(error);
  }

  fundraiser.documents.push(req.file.path);

  try {
    await fundraiser.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ fundraiser: fundraiser });
};




// ---------------- GET FUNDRAISERS --------------------
const getFundraisers = async (req, res, next) => {
  let fundraisers;
  try {
    fundraisers = await Fundraiser.find({ active: true }).sort({
      created_at: -1,
    });
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!fundraisers || fundraisers.length === 0) {
    return next(new HttpError("No fundraisers found", 404));
  }

  res.json({
    fundraisers: fundraisers.map((fundraiser) =>
      fundraiser.toObject({ getters: true })
    ),
  });
};



// ---------------- GET FUNDRAISERS BY CATEGORY ---------------
const getFundraisersByCategory = async (req, res, next) => {
  const category = req.params.category;

  let fundraisers;
  try {
    fundraisers = await Fundraiser.find({
      category: category,
      active: true,
    }).sort({ created_at: -1 });
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!fundraisers || fundraisers.length === 0) {
    return next(new HttpError("No fundraisers found", 404));
  }

  res.json({
    fundraisers: fundraisers.map((fundraiser) =>
      fundraiser.toObject({ getters: true })
    ),
  });
};



// ---------------- FILTER FUNDRAISERS -------------------
const filterFundraisers = async (req, res, next) => {
  const { state, city, category } = req.query;

  let fundraisers;
  if (state !== "null" && city !== "null" && category !== "null") {
    try {
      fundraisers = await Fundraiser.find({
        state: state,
        city: city,
        category: category,
        active: true,
      }).sort({ created_at: -1 });
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }
  } else if (state !== "null" && city !== "null" && category === "null") {
    try {
      fundraisers = await Fundraiser.find({
        state: state,
        city: city,
        active: true,
      }).sort({ created_at: -1 });
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }
  } else if (state !== "null" && category !== "null" && city === "null") {
    try {
      fundraisers = await Fundraiser.find({
        state: state,
        category: category,
        active: true,
      }).sort({ created_at: -1 });
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }
  } else if (state !== "null" && city === "null" && category === "null") {
    try {
      fundraisers = await Fundraiser.find({ state: state, active: true }).sort({
        created_at: -1,
      });
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }
  } else if (category !== "null" && state === "null" && city === "null") {
    try {
      fundraisers = await Fundraiser.find({
        category: category,
        active: true,
      }).sort({ created_at: -1 });
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }
  }

  if (!fundraisers || fundraisers.length === 0) {
    return next(new HttpError("No fundraisers found", 404));
  }

  res.json({
    fundraisers: fundraisers.map((fundraiser) =>
      fundraiser.toObject({ getters: true })
    ),
  });
};




// ----------------- GET FUNDRAISER BY ID ---------------------
const getFundraisersById = async (req, res, next) => {
  const fundraiserId = req.params.fid;

  let fundraiser;
  try {
    fundraiser = await Fundraiser.findById(fundraiserId);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!fundraiser) {
    const error = new HttpError(
      "Could not find the fundraiser for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ fundraiser: fundraiser.toObject({ getters: true }) });
};



// ------------------- GET FUNDRAISERS BY USER ID ------------------
const getFundraisersByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let fundraisers;
  try {
    fundraisers = await Fundraiser.find({ creator: userId }).sort({
      created_at: -1,
    });
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (userId !== req.userData.userId) {
    const error = new HttpError("You are not allowed to make this action", 401);
    return next(error);
  }

  if (!fundraisers || fundraisers.length === 0) {
    return next(new HttpError("No fundraisers found!", 404));
  }

  res.json({
    fundraisers: fundraisers.map((fundraiser) =>
      fundraiser.toObject({ getters: true })
    ),
  });
};




// ------------------- SEARCH FUNDRAISERS ----------------------------
const searchFundraisers = async (req, res, next) => {
  const { searchedField } = req.body;

  // await Fundraiser.find({ name: searchedField }).then(
  //   (data) => {
  //     res.send(data);
  //   }
  // );
  let fundraisers;
  try {
    fundraisers = await Fundraiser.find({
      title: { $regex: searchedField, $options: "$i" },
    }).sort({ created_at: -1 });
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!fundraisers || fundraisers.length === 0) {
    return next(new HttpError("No fundraisers found!", 404));
  }

  res.json({
    fundraisers: fundraisers.map((fundraiser) =>
      fundraiser.toObject({ getters: true })
    ),
  });
};

// ------------------- Update Fundraisers ----------------------
const editFundraiser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors);
    return next(new HttpError("Invalid Field", 422));
  }

  const fundraiserId = req.params.fid;
  const { title, description, cover } = req.body;

  let fundraiser;
  try {
    fundraiser = await Fundraiser.findById(fundraiserId);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (fundraiser.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not authorized to edit this fundraiser",
      401
    );
    return next(error);
  }

  fundraiser.title = title;
  fundraiser.description = description;


  if (req.file) {
    // Deleting old image
    const oldImagePath = fundraiser.cover;
    fs.unlink(oldImagePath, (err) => {
      const error = new HttpError(err, 500);
    });
    //Adding new image
    fundraiser.cover = req.file.path;
  }

  try {
    await fundraiser.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ fundraiser: fundraiser.toObject({ getters: true }) });
};




// ---------------- ADD UPDATE ------------------
const addUpdate = async (req, res, next) => {
  const fundraiserId = req.params.fid;
  const { update } = req.body;

  let fundraiser;
  try {
    fundraiser = await Fundraiser.findById(fundraiserId);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (fundraiser.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to make updates on this fundraiser",
      401
    );
    return next(error);
  }

  fundraiser.updates.push({ content: update });

  try {
    await fundraiser.save();
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  res.status(200).json({ fundraiser: fundraiser.toObject({ getters: true }) });
};




// ---------------- DONATE FUNDRAISER -----------------
const donateFundraiser = async (req, res, next) => {
  const fundraiserId = req.params.fid;
  const { amount, donorId } = req.body;

  let user;
  try {
    user = await User.findById(donorId);
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  if (!user) {
    const error = new HttpError("Unrecognized donor", 404);
    return next(error);
  }

  let fundraiser;
  try {
    fundraiser = await Fundraiser.findById(fundraiserId);
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  const updatedCollectionAmount = fundraiser.collectionAmt + amount;
  fundraiser.donors.unshift({
    donor: donorId,
    donorName: user.name,
    donatedAmount: amount,
  });
  fundraiser.collectionAmt = updatedCollectionAmount;

  try {
    await fundraiser.save();
    user.donations.unshift({ fundraiser: fundraiserId, donatedAmount: amount });
    await user.save();
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  res.status(200).json({ message: "Donation Successful" });
};




// --------------------- DISABLE FUNDRAISER -----------------------
const disableFundraiser = async (req, res, next) => {
  const fundraiserId = req.params.fid;

  let fundraiser;
  try {
    fundraiser = await Fundraiser.findById(fundraiserId);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (fundraiser.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to disable this fundraiser",
      401
    );
    return next(error);
  }

  fundraiser.active = false;

  try {
    await fundraiser.save();
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  res.status(200).json({ fundraiser: fundraiser.toObject({ getters: true }) });
};





exports.initRazorPay = initRazorPay;
exports.createFundraiser = createFundraiser;
exports.uploadDocuments = uploadDocuments;
exports.getFundraisersByCategory = getFundraisersByCategory;
exports.filterFundraisers = filterFundraisers;
exports.getFundraisers = getFundraisers;
exports.getFundraisersById = getFundraisersById;
exports.getFundraisersByUserId = getFundraisersByUserId;
exports.searchFundraisers = searchFundraisers;
exports.editFundraiser = editFundraiser;
exports.addUpdate = addUpdate;
exports.donateFundraiser = donateFundraiser;
exports.disableFundraiser = disableFundraiser;






// const donateFundraiser = async (req, res, next) => {
//     const fundraiserId = req.params.fid;
//     const { user, donatedAmount } = req.body;

//     let fundraiser;
//     try{
//         fundraiser = await Fundraiser.findById(fundraiserId).populate("creator");
//     } catch (err) {
//         return next(new HttpError(err, 500));
//     }

// };

//Delete Fundraisers
// const deleteFundraiser = async (req, res, next) => {
//   const fundraiserId = req.params.fid;

//   let fundraiser;
//   try {
//     fundraiser = await Fundraiser.findById(fundraiserId).populate("creator");
//   } catch (err) {
//     return next(new HttpError(err, 500));
//   }

//   if(!fundraiser){
//     const error = new HttpError("Could not find the fundraiser for this id.", 404);
//     return next(error);
//   }

//   if (fundraiser.creator.id !== req.userData.userId){
//     const error = new HttpError("You are not allowed to delete this fundraiser", 401);
//     return next(error);
//   }

//   try {
//     await fundraiser.remove();
//     fundraiser.creator.fundraisers.pull(fundraiser);
//     await fundraiser.creator.save();
//   } catch (err) {
//     return next(new HttpError(err, 500));
//   }

//   res.status(200).json({ message: "Deleted Fundraiser!" });
// };