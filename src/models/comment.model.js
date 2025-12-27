import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    content: { type: String, required: true, trim: true, maxLength: 1000 },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Stats
    likesCount: { type: Number, default: 0 },

    // Edit status
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
