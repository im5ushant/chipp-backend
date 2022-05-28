const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const fundraiserSchema = new Schema(
  {
    active: {type: Boolean, required: true},
    name: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    cover: { type: String },
    documents: {type: Array},
    // deadline: { type: Date, required: true },
    collectionAmt: { type: Number, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    creatorName: { type: String, required: true },
    created_at: { type: Date },
    updates: [
      {
        content: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
    donors: [
      {
        donor: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
        donorName: { type: String, required: true },
        donatedAmount: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Fundraiser", fundraiserSchema);
