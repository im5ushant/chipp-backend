const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  emailconfirmed: { type: Boolean, required: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true, minlength: 10, maxlength: 10 },
  image: { type: String },
  kyc: {type: Boolean, require: true},
  kycdocuments: {
    aadharCard: {type:String},
    panCard: {type: String},
    userImage: {type: String}
  },
  fundraisers: [
    { type: mongoose.Types.ObjectId, required: true, ref: "Fundraiser" },
  ],
  donations: [
    {
      fundraiser: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Fundraiser",
      },
      donatedAmount: {
        type: Number,
        required: true,
      },
    },
  ],
  notices: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Notice",
    },
  ],
});

userSchema.plugin(uniqueValidator);

function getPrice(num) {
  return (num / 100).toFixed(2);
}

function setPrice(num) {
  return num * 100;
}

module.exports = mongoose.model("User", userSchema);
