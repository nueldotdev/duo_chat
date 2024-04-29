const mongoose = require("mongoose");

// Define user schema
const userSchema = new mongoose.Schema({
    displayName: String,
    username: String,
    password: String,
    email: String,
    profileImage: String, // Store image URL or file path
    created_at: { type: Date, default: Date.now },
    last_login: Date,
    online: Boolean,
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Reference to other users
});

// Define media schema
const mediaSchema = new mongoose.Schema({
    images: [{ type: String }], // Store multiple image URLs or file paths
    videos: [{ type: String }], // Store multiple video URLs or file paths
});

// Define message schema
const messageSchema = new mongoose.Schema({
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to sender user
    receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to receiver user
    message: String,
    media: { type: mongoose.Schema.Types.ObjectId, ref: "Media" }, // Reference to media associated with the message
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
});

// define request
const requestSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to sender user
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to recipient user
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000) } // Set expiration date to 1 week (7 days) from creation
  });


// Define models based on schemas
const User = mongoose.model("User", userSchema);
const Media = mongoose.model("Media", mediaSchema);
const Message = mongoose.model("Message", messageSchema);
const Request = mongoose.model("Request", requestSchema);

module.exports = { User, Message, Media, Request };
