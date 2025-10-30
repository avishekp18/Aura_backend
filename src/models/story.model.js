import mongoose, { Schema } from "mongoose";

const StorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      maxLength: [100, "Story must be in length 100"],
    },
    image: {
      // If you use Cloudinary, you might want to store
      // public_id and url as an object
      // { public_id: String, url: String }
      type: String,
    },
    expiresAt: {
      type: Date,
      default: () => Date.now() + 24 * 60 * 60 * 1000, // Expire in 24 hours
      // This line tells MongoDB to automatically delete the document
      // when the 'expiresAt' time is reached.
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

export const Story = mongoose.model("Story", StorySchema);
