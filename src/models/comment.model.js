import mongoose, { Schema } from "mongoose";
import { Post } from "./post.model.js";

const commentSchema = new Schema(
  {
    content: { type: String, required: true, trim: true, maxLength: 1000 },
    attachment: { type: String },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },

    likesCount: { type: Number, default: 0 },

    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
