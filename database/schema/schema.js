const { Schema } = require("mongoose");

const UserSchema = new Schema({
  name: String,
  email: String,
  password: String,
  gender: String,
  access_token: String,
  secret_key: String,
  avatar_path: String,
});

module.exports = UserSchema;
