const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const router = express.Router();


// ==========================================
// PLACE ORDER
// ==========================================

router.post("/", auth, async (req, res) => {

    try {

        // Only buyers can place orders
        if (req.user.role !== "buyer") {
            return res.status(403).json({
                message: "Only buyers can place orders"
            });
        }

        const {
            productId,
            quantity
        } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({
                message: "Product and quantity are required"
            });
        }

        // Find product
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Check availability
        if (!product.available || product.quantity <= 0) {
            return res.status(400).json({
                message: "Product is no longer available"
            });
        }

        // Check requested quantity
        if (quantity > product.quantity) {
            return res.status(400).json({
                message: `Only ${product.quantity} kg available`
            });
        }

        

        // Calculate total
        const totalPrice = quantity * product.price;

        // Create order
        const order = new Order({
            buyer: req.user.id,
            product: product._id,
            quantity: quantity,
            totalPrice: totalPrice
        });

        await order.save();

        // Reduce product quantity
        product.quantity -= quantity;

        // If no stock remains
        if (product.quantity === 0) {
            product.available = false;
        }

        await product.save();

        res.status(201).json({
            message: "Order placed successfully",
            order
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// ==========================================
// GET BUYER ORDERS
// ==========================================

// ==========================================
// GET BUYER ORDERS
// ==========================================

router.get("/my-orders", auth, async (req, res) => {

    try {

        const orders = await Order.find({
            buyer: req.user.id
        })
        .populate("buyer", "name email phone location")
        .populate({
            path: "product",
            populate: {
                path: "farmer",
                select: "name location"
            }
        })
        .sort({ createdAt: -1 });

        res.json(orders);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// ==========================================
// GET ORDERS FOR FARMER
// ==========================================

router.get("/farmer-orders", auth, async (req, res) => {

    try {

        if (req.user.role !== "farmer") {
            return res.status(403).json({
                message: "Only farmers can access this"
            });
        }

        // Find products belonging to this farmer
        const products = await Product.find({
            farmer: req.user.id
        });

        const productIds = products.map(product => product._id);

        // Find orders containing those products
        const orders = await Order.find({
            product: { $in: productIds }
        })
        .populate("buyer", "name email phone location")
        .populate("product", "name price")
        .sort({ createdAt: -1 });

        res.json(orders);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// ==========================================
// UPDATE ORDER STATUS
// ==========================================

router.patch("/:id/status", auth, async (req, res) => {

    try {

        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }

        const order = await Order.findById(req.params.id)
            .populate("product");

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Farmer can update orders for their products
        if (req.user.role === "farmer") {

            if (
                !order.product ||
                order.product.farmer.toString() !== req.user.id
            ) {
                return res.status(403).json({
                    message: "You cannot update this order"
                });
            }
        }

        // Buyer can only update their own order
        if (req.user.role === "buyer") {

            if (order.buyer.toString() !== req.user.id) {
                return res.status(403).json({
                    message: "You cannot update this order"
                });
            }
        }

        order.status = status;

        await order.save();

        res.json({
            message: "Order status updated",
            order
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;