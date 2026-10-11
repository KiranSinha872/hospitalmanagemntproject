const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true
        },
        passwordHash: {
            type: String,
            required: [true, "Password hash is required"]
        },
        role: {
            type: String,
            enum: ["Admin", "User"],
            default: "User"
        }
    },
    {
        timestamps: true
    }
);

userSchema.methods.toSafeObject = function () {
    return {
        id: this._id.toString(),
        name: this.name,
        email: this.email,
        role: this.role,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

const User = mongoose.model("User", userSchema);

module.exports = User;
