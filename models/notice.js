const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const noticeSchema = new Schema(
  {
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    state: {type: String, required: true},
    city: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    created_at: { type: Date },
    name: { type: String, required: true },
    phone1: { type: String, required: true, minlength: 10, maxlength: 10 },
    phone2: { type: String, required: false, minlength: 10, maxlength: 10 },
    msg: { type: String, required: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Notice", noticeSchema);
