import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    // ✅ include all roles you will ever use
    role: { type: String, enum: ["user", "admin", "delivery", "deliveryPartner"], default: "user" },
  },
  { timestamps: true }
);

// hash helpers
userSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plain, salt);
};
userSchema.methods.verifyPassword = async function (plain) {
  return this.passwordHash ? bcrypt.compare(plain, this.passwordHash) : false;
};

// export once
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
