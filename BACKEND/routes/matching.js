const express = require("express");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const router = express.Router();


// Find farmers matching buyer requirements
router.post("/", auth, async (req, res) => {
    try {

        // Only buyers can use matching
        if (req.user.role !== "buyer") {
            return res.status(403).json({
                message: "Only buyers can find farmer matches"
            });
        }

        const {
            productName,
            quantity,
            maxPrice
        } = req.body;


        // Validate input
        if (!productName || !quantity) {
            return res.status(400).json({
                message: "Product name and quantity are required"
            });
        }


        // Find available products
        const products = await Product.find({
            name: {
                $regex: new RegExp(`^${productName}$`, "i")
            },
            available: true,
            quantity: {
                $gte: Number(quantity)
            }
        })
        .populate("farmer", "name location");


        // Optional maximum price filter
        let matches = products;

        if (maxPrice) {
            matches = matches.filter(
                product => product.price <= Number(maxPrice)
            );
        }


        // Rank farmers
        matches.sort((a, b) => {

            // Lower price gets higher priority
            if (a.price !== b.price) {
                return a.price - b.price;
            }

            // If prices are same, higher quantity gets priority
            return b.quantity - a.quantity;
        });


        res.json({
            message: "Matching farmers found",
            requestedProduct: productName,
            requestedQuantity: Number(quantity),
            totalMatches: matches.length,
            matches
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;