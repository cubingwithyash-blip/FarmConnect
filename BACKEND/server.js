const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const matchingRoutes = require("./routes/matching");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/matching", matchingRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");
    })
    .catch((error) => {
        console.log("MongoDB Connection Error:", error);
    });

// Test route
app.get("/", (req, res) => {
    res.send("FarmConnect Backend is Running!");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// ==========================================
// BUYER - PLACE ORDER
// ==========================================

async function placeOrder(productId) {

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login first.");
        return;
    }

    const quantity = prompt(
        "Enter quantity you want to buy (kg):"
    );

    if (!quantity) {
        return;
    }

    const quantityNumber = Number(quantity);

    if (
        isNaN(quantityNumber) ||
        quantityNumber <= 0
    ) {
        alert("Please enter a valid quantity.");
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:5000/api/orders",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    productId: productId,
                    quantity: quantityNumber
                })
            }
        );

        const data = await response.json();

        if (response.ok) {

            alert(
                "✅ Order placed successfully!\n\n" +
                "Total: ₹" + data.order.totalPrice
            );

            // Reload marketplace
            loadMarketplaceProducts();

        } else {

            alert(
                "❌ " +
                (data.message || "Could not place order")
            );
        }

    } catch (error) {

        console.error(error);

        alert(
            "❌ Cannot connect to backend."
        );
    }
}