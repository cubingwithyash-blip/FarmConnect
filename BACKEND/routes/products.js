const express = require("express");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const router = express.Router();


// ===============================
// ADD NEW PRODUCT
// ===============================
router.post("/", auth, async (req, res) => {
    try {

        // Only farmers can add produce
        if (req.user.role !== "farmer") {
            return res.status(403).json({
                message: "Only farmers can add produce"
            });
        }

        const {
            name,
            quantity,
            price,
            location,
            harvestDate
        } = req.body;

        if (!name || !quantity || !price || !location) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        const product = new Product({
            farmer: req.user.id,
            name,
            quantity,
            price,
            location,
            harvestDate
        });

        await product.save();

        res.status(201).json({
            message: "Produce added successfully",
            product
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// ===============================
// GET ALL AVAILABLE PRODUCTS
// ===============================
router.get("/", async (req, res) => {
    try {

        const products = await Product.find({
            available: true,
            quantity: { $gt: 0 }
        })
        .populate("farmer", "name location");

        res.json(products);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// ===============================
// GET FARMER'S PRODUCTS
// ===============================
router.get("/my-products", auth, async (req, res) => {
    try {

        const products = await Product.find({
            farmer: req.user.id
        });

        res.json(products);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// ===============================
// DELETE PRODUCT
// ===============================
router.delete("/:id", auth, async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Make sure farmer owns this product
        if (product.farmer.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You can only delete your own products"
            });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.json({
            message: "Product deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;