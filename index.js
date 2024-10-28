const express = require('express');
const mongoose = require('mongoose');
const cors= require("cors");
const bodyParser= require("body-parser");
const AuthenticationRouter = require("./Controllers/Authroutes.js");
const CategoryRouter = require("./Controllers/Categoryroutes.js");
const ProductRouter = require("./Controllers/Productroutes.js");


const app = express();

mongoose.set("strictQuery",true);
mongoose.connect("mongodb+srv://aditya:aditya123@cluster0.vxjh9wg.mongodb.net/ecommerce");
var db = mongoose.connection;
db.on("open",()=>console.log("Connected to DB"));
db.on("error",()=>console.log("Error occurred while connecting with DB"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());


app.use("/AuthRoutes",AuthenticationRouter);
app.use("/CategoryRoutes",CategoryRouter);
app.use("/ProductRoutes",ProductRouter);

app.listen(4000,()=> {
    console.log("Server started at 4000");
})