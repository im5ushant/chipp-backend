const mongoose = require('mongoose');

const HttpError = require("../models/http-error");
const Notice = require("../models/notice");
const User = require("../models/user");

const createNotice = async (req, res, next) => {
  const { userId, state, city, category, name, phone1, phone2, msg } = req.body;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for the provided id", 404);
    return next(error);
  }

  const createdNotice = new Notice({
    creator: userId,
    state,
    city,
    category,
    name,
    phone1,
  });

  if (phone2) {
    createdNotice.phone2 = phone2;
  }

  if (msg) {
    createdNotice.msg = msg;
  }

  try {

    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdNotice.save({session: sess});
    user.notices.push(createdNotice);
    await user.save({session: sess});
    await sess.commitTransaction();

  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(201).json({ notices: createdNotice });
};

const getNotices = async (req, res, next) => {
  let notices;
  try {
    notices = await Notice.find().sort({"created_at": -1});
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!notices || notices.length === 0) {
    return next(new HttpError("No notices found", 404));
  }

  res.json({
    notices: notices.map((notice) => notice.toObject({ getters: true })),
  });
};

const filterNotice = async (req, res, next) => {
  const { state, city, category } = req.query;

  let notices;
  if (state !== 'null' && city !== 'null' && category !== 'null') {
    try {
      notices = await Notice.find({
        state: state,
        city: city,
        category: category,
      }).sort({"created_at": -1});
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }
  } 
  
  else if (state !== 'null' && city !== 'null' && category === 'null') {
    try {
      notices = await Notice.find({ state: state, city: city }).sort({"created_at": -1});
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }
  }
  
  else if(state !== 'null' && category !== 'null' && city === 'null'){
    try {
      notices = await Notice.find({ state: state, category: category }).sort({"created_at": -1});
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }
  } 
  
  else if(state !== 'null' && city === 'null' && category === 'null'){
    try {
      notices = await Notice.find({ state: state }).sort({"created_at": -1});
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }
  }
  
  else if(category !== 'null' && state === 'null' && city === 'null'){
    try {
      notices = await Notice.find({ category: category }).sort({"created_at": -1});
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }
  }

  if (!notices || notices.length === 0) {
    return next(new HttpError("No notices found", 404));
  }

  res.json({
    notices: notices.map((notice) => notice.toObject({ getters: true })),
  });
};

const getNoticeByUserId = async (req, res, next) => {
  const userId = req.params.userId;

  let notices;
  try {
    notices = await Notice.find({ creator: userId }).sort({"created_at": -1});
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!notices || notices.length === 0) {
    return next(new HttpError("No notices found", 404));
  }

  res.json({
    notices: notices.map((notice) => notice.toObject({ getters: true })),
  });
};

const deleteNotice = async (req, res, next) => {
  const noticeId = req.params.id;

  let notice;
  try {
    notice = await Notice.findById(noticeId).populate("creator");
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  if (!notice) {
    const error = new HttpError("Could not find the notice for this id.", 404);
    return next(error);
  }

  // if (notice.creator !== req.userData.userId){
  //   const error = new HttpError("You are not allowed to delete this fundraiser", 401);
  //   return next(error);
  // }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await notice.remove({session: sess});
    notice.creator.notices.pull(notice);
    await notice.creator.save({session: sess});
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  res.status(200).json({ message: "Deleted Notice!" });
};

exports.createNotice = createNotice;
exports.getNotices = getNotices;
exports.filterNotice = filterNotice;
exports.getNoticeByUserId = getNoticeByUserId;
exports.deleteNotice = deleteNotice;
