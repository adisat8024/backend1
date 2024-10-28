const fs = require("fs");
const formidable = require("express-formidable");
const express = require('express');
const slugify = require('slugify');
const jwt = require('jsonwebtoken');
const users = require("../Models/UserSchema.js");
const productsses = require("../Models/ProductSchema.js");
const categorys = require("../Models/CategorySchema.js");
const CategoryRouter = require("./Categoryroutes.js");
const orders = require("../Models/OrderSchema.js");

const ProductRouter = express.Router();

const jwtSecretKey = 'your_secret_key';

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

// Create product
ProductRouter.post("/create-product", requireSignIn, isAdmin, formidable() ,async (req, res) => {
  try {
    const { name, description, price, category, quantity } = req.fields;
    const { photo } = req.files;

    // Validation
    switch (true) {
      case !name:
        return res.status(400).send({ error: "Name is Required" });
      case !description:
        return res.status(400).send({ error: "Description is Required" });
      case !price:
        return res.status(400).send({ error: "Price is Required" });
      case !category:
        return res.status(400).send({ error: "Category is Required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res
          .status(400)
          .send({ error: "Photo is Required and should be less than 1MB" });
    }

    const products = new productsses({
      ...req.fields,
      slug: slugify(name),
    });

    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }

    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating product",
    });
  }
});

// Update product
ProductRouter.put("/update-product/:pid", requireSignIn, isAdmin,formidable(),  async (req, res) => {
  try {
    const { name, description, price, category, quantity } = req.fields;
    const { photo } = req.files;

    // Validation
    switch (true) {
      case !name:
        return res.status(400).send({ error: "Name is Required" });
      case !description:
        return res.status(400).send({ error: "Description is Required" });
      case !price:
        return res.status(400).send({ error: "Price is Required" });
      case !category:
        return res.status(400).send({ error: "Category is Required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res
          .status(400)
          .send({ error: "Photo should be less than 1MB" });
    }

    const products = await productsses.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );

    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }

    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Updated Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in updating product",
    });
  }
});

// Get products

ProductRouter.get("/get-product", async (req, res) => {
  try {
    const products = await productsses.find({}).populate("category").select("-photo").limit(12).sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      countTotal: products.length,
      message: "All Products",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  }
});




// Get single product
ProductRouter.get("/get-product/:slug", async (req, res) => {
  try {
    const product = await productsses.findOne({ slug: req.params.slug }).select("-photo").populate("category");
    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error,
    });
  }
});

// Get photo
ProductRouter.get("/product-photo/:pid", async (req, res) => {
  try {
    const product = await productsses.findById(req.params.pid).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error,
    });
  }
});

// Delete product
ProductRouter.delete("/delete-product/:pid", requireSignIn, isAdmin, async (req, res) => {
  try {
    await productsses.findByIdAndDelete(req.params.pid).select("-photo");
    res.status(200).send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
});

ProductRouter.post("/product-filters", async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productsses.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while Filtering Products",
      error,
    });
  }
});

ProductRouter.get("/product-count", async (req, res) => {
  try {
    const total = await productsses.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
});

// Corrected endpoint to use req.query instead of req.params
ProductRouter.get("/product-list", async (req, res) => {
  try {
    const perPage = 2;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const products = await productsses
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in pagination control",
      error,
    });
  }
});

ProductRouter.get("/Search/:keyword",  async (req, res) => {
  try {
    const { keyword } = req.params;
    const resutls = await productsses
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");
    res.json(resutls);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error In Search Product",
      error,
    });
  }
});

ProductRouter.get("/related-product/:pid/:cid"  , async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productsses
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while geting related product",
      error,
    });
  }
});

ProductRouter.get("/product-category/:slug" , async (req, res) => {
  try {
    const category = await categorys.findOne({ slug: req.params.slug });
    const products = await productsses.find({ category }).populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error While Getting products",
    });
  }
});

// Place Order Route
ProductRouter.post("/place-order",requireSignIn, async (req, res) => {
  try {
    const { products } = req.body;
    const buyerId = req.user._id; // Assuming req.user is set for an authenticated user


    // Check if there are products in the cart
    if (!products || products.length === 0) {
      return res.status(400).send({
        success: false,
        message: "Cart is empty",
      });
    }

    // Create a new order
    const newOrder = new orders({
      products,
      payment: { method: "Cash on Delivery" }, // Only COD payment
      buyer: buyerId,
      status: "Not Process", // Initial status
    });

    // Save the order in the database
    await newOrder.save();

    res.status(201).send({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    console.log("Error placing order:", error);
    res.status(500).send({
      success: false,
      message: "Failed to place order. Please try again later.",
      error: error.message,
    });
  }
});

module.exports = ProductRouter;
