const categorys = require("../Models/CategorySchema.js");
const express = require('express');
const slugify = require('slugify');
const jwt = require('jsonwebtoken');
const users = require("../Models/UserSchema.js");
const CategoryRouter = express.Router();

// Replace 'your_secret_key' with your actual secret key
const jwtSecretKey = 'secret_key';

// Protected Routes token base
const requireSignIn = async (req, res, next) => {
  try {
    const token = req.headers.authorization; 
    if (!token) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized Access. User not authenticated.",
      });
    }
    const decoded = jwt.verify(token, 'secret-key');
    const user = await users.findById(decoded.userId);

    if (!user) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized Access. User not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({
      success: false,
      message: "Unauthorized Access. Authentication error.",
    });
  }
};

// Admin access
const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, 'secret-key');
    const user = await users.findById(req.user._id);
    if (user.role !== 1) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized Access",
      });
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(401).send({
      success: false,
      error,
      message: "Error in admin middleware",
    });
  }
};

// Create category
CategoryRouter.post("/create-category", requireSignIn, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(401).send({ message: "Name is required" });
    }
    const existingCategory = await categorys.findOne({ name });
    if (existingCategory) {
      return res.status(200).send({
        success: true,
        message: "Category Already Exists",
      });
    }
    const category = await new categorys({
      name,
      slug: slugify(name),
    }).save();
    res.status(201).send({
      success: true,
      message: "New category created",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Category",
    });
  }
});

// Update category
CategoryRouter.put("/update-category/:id", requireSignIn, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;
    const category = await categorys.findByIdAndUpdate(
      id,
      { name, slug: slugify(name) },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Category Updated Successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while updating category",
    });
  }
});

// Get all categories
CategoryRouter.get("/get-category",  async (req, res) => {
  try {
    const categories = await categorys.find({});
    res.status(200).send({
      success: true,
      message: "All Categories List",
      categories,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting all categories",
    });
  }
});

// Get single category
CategoryRouter.get("/single-category/:slug", async (req, res) => {
  try {
    const category = await categorys.findOne({ slug: req.params.slug });
    res.status(200).send({
      success: true,
      message: "Get Single Category Successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While getting Single Category",
    });
  }
});

// Delete category
CategoryRouter.delete("/delete-category/:id",requireSignIn, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await categorys.findByIdAndDelete(id);
    res.status(200).send({
      success: true,
      message: "Category Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting category",
      error,
    });
  }
});




module.exports = CategoryRouter;