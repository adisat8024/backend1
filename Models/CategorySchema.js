const mongoose = require("mongoose");
const CategorySchema = new mongoose.Schema({
  "name": {
    type: String,
    required:true,
    unique:true
  },
  "slug": {
    type:String,
    lowercase:true
  },
}, {
    collection:"categorys"
});
module.exports = mongoose.model("categorys",CategorySchema);