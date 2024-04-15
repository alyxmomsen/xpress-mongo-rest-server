const { model } = require("mongoose");
const UserSchema = require("../schema/schema");

// Модель пользователя
const User = model("User", UserSchema);

module.exports = User;
