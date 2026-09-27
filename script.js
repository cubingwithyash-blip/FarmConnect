const API_URL = "https://farmconnect-wyel.onrender.com/api";

// ================= AUTHENTICATION =================

let isLoginMode = false;


// Switch between Login and Register

function switchAuthMode() {

    isLoginMode = !isLoginMode;

    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");

    const title = document.getElementById("auth-title");
    const subtitle = document.getElementById("auth-subtitle");
    const switchText = document.getElementById("switchText");
    const switchButton = document.getElementById("switchAuth");

    if (isLoginMode) {

        registerForm.classList.add("hidden");
        loginForm.classList.remove("hidden");

        title.textContent = "Welcome Back";
        subtitle.textContent = "Login to your FarmConnect account";

        switchText.textContent = "Don't have an account?";
        switchButton.textContent = "Register";

    } else {

        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");

        title.textContent = "Create Account";
        subtitle.textContent = "Join the FarmConnect marketplace";

        switchText.textContent = "Already have an account?";
        switchButton.textContent = "Login";
    }
}


// ================= LOGOUT =================

// ================= LOGOUT =================

function logout() {

    // Stop automatic order refresh
    if (orderRefreshInterval) {
        clearInterval(orderRefreshInterval);
        orderRefreshInterval = null;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    document.getElementById("app").classList.add("hidden");

    document.getElementById("auth-screen").classList.remove("hidden");

    document.getElementById("loginForm").reset();

    document.getElementById("authMessage").textContent = "";

    if (isLoginMode) {
        switchAuthMode();
    }
}


// ================= REGISTER =================

document.getElementById("registerForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const phone = document.getElementById("registerPhone").value;
    const password = document.getElementById("registerPassword").value;
    const role = document.getElementById("registerRole").value;
    const location = document.getElementById("registerLocation").value;

    try {

        const response = await fetch(`${API_URL}/auth/register`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name,
                email,
                phone,
                password,
                role,
                location
            })
        });

        const data = await response.json();

        const message = document.getElementById("authMessage");

        if (response.ok) {

            message.textContent =
                getTranslation("registrationSuccess");

            document.getElementById("registerForm").reset();

            switchAuthMode();

        } else {

            message.textContent = data.message;
        }

    } catch (error) {

        console.error(error);

        document.getElementById("authMessage").textContent =
            getTranslation("unableServer");
    }
});


// ================= LOGIN =================

document.getElementById("loginForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {

        const response = await fetch(`${API_URL}/auth/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    document.getElementById("auth-screen")
        .classList.add("hidden");

    document.getElementById("app")
        .classList.remove("hidden");

    updateUserProfile(data.user);

    loadMarketplaceProducts();

    loadOrders();

    loadRecentOrders();

    // Start automatic order checking
    startOrderAutoRefresh();

} else {

            document.getElementById("authMessage").textContent =
                data.message;
        }

    } catch (error) {

        console.error(error);

        document.getElementById("authMessage").textContent =
            getTranslation("unableServer");
    }
});


// ================= UPDATE PROFILE =================

function updateUserProfile(user) {

    const profileName =
        document.querySelector(".profile b");

    const profileRole =
        document.querySelector(".profile p");

    const welcomeMessage =
        document.getElementById("welcome-message");

    if (profileName) {
        profileName.textContent = user.name;
    }

    if (profileRole) {

        const language =
            localStorage.getItem("language") || "en";

        if (translations[language]) {

            if (user.role === "farmer") {
                profileRole.textContent =
                    translations[language].farmer;
            } else if (user.role === "buyer") {
                profileRole.textContent =
                    translations[language].buyer;
            } else {
                profileRole.textContent = user.role;
            }

        } else {
            profileRole.textContent = user.role;
        }
    }

    if (welcomeMessage) {

        const language =
            localStorage.getItem("language") || "en";

        const welcomeTemplate =
            translations[language]?.welcomeBackUser ||
            translations.en.welcomeBackUser;

        welcomeMessage.textContent =
            welcomeTemplate.replace("{name}", user.name);
    }
}


// ================= CHECK LOGIN =================

// ================= CHECK LOGIN =================

window.addEventListener("DOMContentLoaded", function() {

    const token =
        localStorage.getItem("token");

    const user =
        localStorage.getItem("user");

    if (token && user) {

        const parsedUser =
            JSON.parse(user);

        document.getElementById("auth-screen")
            .classList.add("hidden");

        document.getElementById("app")
            .classList.remove("hidden");

        updateUserProfile(parsedUser);

        loadMarketplaceProducts();

        loadOrders();

        loadRecentOrders();

        // Start automatic refresh
        startOrderAutoRefresh();
    }

});


// ==========================================
// SHOW PAGE
// ==========================================

function showPage(pageName, event) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(function(page) {
        page.classList.add("hidden");
    });

    document.getElementById(pageName)
        .classList.remove("hidden");


    const language =
        localStorage.getItem("language") || "en";

    const titles = {

        dashboard:
            translations[language]?.dashboard ||
            "Dashboard",

        marketplace:
            translations[language]?.marketplace ||
            "Marketplace",

        orders:
            translations[language]?.orders ||
            "Orders",

        forecast:
            translations[language]?.forecast ||
            "AI Demand Forecast",

        logistics:
            translations[language]?.logistics ||
            "Smart Logistics"
    };

    document.getElementById("page-title")
        .textContent = titles[pageName];


    const buttons =
        document.querySelectorAll(".nav-btn");

    buttons.forEach(function(button) {
        button.classList.remove("active");
    });

    if (event && event.target) {
        event.target.classList.add("active");
    }


    if (pageName === "orders") {
        loadOrders();
    }
}


// ==========================================
// FARMER - ADD NEW PRODUCE
// ==========================================

const produceForm =
    document.getElementById("produceForm");

if (produceForm) {

    produceForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const token =
            localStorage.getItem("token");

        if (!token) {

            alert(
                getTranslation("pleaseLogin")
            );

            return;
        }

        const name =
            document.getElementById("product").value;

        const quantity =
            document.getElementById("quantity").value;

        const price =
            document.getElementById("price").value;

        const location =
            document.getElementById("location").value;


        try {

            const response = await fetch(
                `${API_URL}/products`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        name: name,
                        quantity: Number(quantity),
                        price: Number(price),
                        location: location
                    })
                }
            );

            const data =
                await response.json();


            if (response.ok) {

                alert(
                    "✅ " +
                    getTranslation("produceAdded")
                );

                produceForm.reset();

                console.log(
                    "Product saved:",
                    data.product
                );

            } else {

                alert(
                    "❌ " +
                    (
                        data.message ||
                        getTranslation("failedProduce")
                    )
                );

                console.error(data);
            }

        } catch (error) {

            console.error("Error:", error);

            alert(
                "❌ " +
                getTranslation("unableBackend")
            );
        }
    });
}


// ==========================================
// MARKETPLACE - LOAD REAL PRODUCTS
// ==========================================

async function loadMarketplaceProducts() {

    const productsContainer =
        document.querySelector(".products");

    const language =
        localStorage.getItem("language") || "en";

    const t =
        translations[language] || translations.en;


    if (!productsContainer) {
        return;
    }


    try {

        const response =
            await fetch(`${API_URL}/products`);

        const products =
            await response.json();


        if (!response.ok) {

            throw new Error(
                products.message ||
                "Failed to load products"
            );
        }


        productsContainer.innerHTML = "";


        if (products.length === 0) {

            productsContainer.innerHTML = `
                <div class="empty-marketplace">

                    <h3>
                        🌾 ${t.noProduce}
                    </h3>

                    <p>
                        ${t.farmersNoProduce}
                    </p>

                </div>
            `;

            return;
        }


        products.forEach(product => {

            const card =
                document.createElement("div");

            card.className =
                "product-card";


            card.innerHTML = `

                <div class="product-image">
                    ${getProductEmoji(product.name)}
                </div>

                <h3>
                    ${t.freshProduce}
                    ${getTranslatedProductName(product.name)}
                </h3>

                <p>
                    👨‍🌾
                    ${product.farmer?.name || t.farmer}
                </p>

                <p>
                    📍 ${product.location}
                </p>

                <div class="product-bottom">

                    <strong>
    ₹${product.price}/${t.kg}
</strong>

                    <span>
                        ${product.quantity}
                        ${t.kgAvailable}
                    </span>

                </div>

                <button
                    onclick="placeOrder('${product._id}')"
                >
                    ${t.buyNow}
                </button>

            `;

            productsContainer.appendChild(card);
        });


    } catch (error) {

        console.error(
            "Marketplace error:",
            error
        );

        productsContainer.innerHTML = `

            <div class="empty-marketplace">

                <h3>
                    ❌ ${t.unableLoadProducts}
                </h3>

                <p>
                    ${t.backendMessage}
                </p>

            </div>
        `;
    }
}


// ==========================================
// LOAD REAL ORDERS
// ==========================================

async function loadOrders() {

    const ordersList =
        document.getElementById("ordersList");

    const token =
        localStorage.getItem("token");

    const userData =
        localStorage.getItem("user");


    if (!ordersList || !token || !userData) {
        return;
    }


    const user =
        JSON.parse(userData);


    const language =
        localStorage.getItem("language") || "en";

    const t =
        translations[language] || translations.en;


    const ordersEndpoint =
        user.role === "farmer"
            ? `${API_URL}/orders/farmer-orders`
            : `${API_URL}/orders/my-orders`;


    try {

        const response =
            await fetch(
                ordersEndpoint,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const orders =
            await response.json();


        if (!response.ok) {

            throw new Error(
                orders.message ||
                "Failed to load orders"
            );
        }


        ordersList.innerHTML = "";


        if (orders.length === 0) {

            ordersList.innerHTML = `
                <tr>

                    <td colspan="5">
                        ${t.noOrders}
                    </td>

                </tr>
            `;

            return;
        }


        orders.forEach(order => {

            const row =
                document.createElement("tr");


            const originalProductName =
    order.product?.name ||
    "Unknown Product";

const productName =
    getTranslatedProductName(originalProductName);


            const buyerName =
                order.buyer?.name ||
                "Unknown Buyer";


            const quantity =
                order.quantity || 0;


            const price =
                order.product?.price ||
                (
                    order.quantity
                        ? order.totalPrice /
                          order.quantity
                        : 0
                );


            const status =
                order.status || "pending";


            let statusHTML = "";


            // ================= FARMER STATUS DROPDOWN =================

            if (user.role === "farmer") {

                statusHTML = `

                    <select
                        class="order-status"
                        onchange="updateOrderStatus(
                            '${order._id}',
                            this.value
                        )"
                    >

                        <option
                            value="pending"
                            ${status === "pending"
                                ? "selected"
                                : ""}
                        >
                            ${t.pending}
                        </option>

                        <option
                            value="confirmed"
                            ${status === "confirmed"
                                ? "selected"
                                : ""}
                        >
                            ${t.confirmed}
                        </option>

                        <option
                            value="shipped"
                            ${status === "shipped"
                                ? "selected"
                                : ""}
                        >
                            ${t.shipped}
                        </option>

                        <option
                            value="delivered"
                            ${status === "delivered"
                                ? "selected"
                                : ""}
                        >
                            ${t.delivered}
                        </option>

                        <option
                            value="cancelled"
                            ${status === "cancelled"
                                ? "selected"
                                : ""}
                        >
                            ${t.cancelled}
                        </option>

                    </select>
                `;

            } else {

                // ================= BUYER STATUS =================

                statusHTML = `

                    <span
                        class="status ${status.toLowerCase()}"
                    >
                        ${t[status] || status}
                    </span>

                `;
            }


            row.innerHTML = `

                <td>

                    ${getProductEmoji(productName)}

                    ${productName}

                </td>


                <td>

                    ${buyerName}

                </td>


                <td>

                    ${quantity} ${translations[localStorage.getItem("language") || "en"].kg}

                </td>


                <td>

    ₹${price}/${t.kg}

</td>


                <td>

                    ${statusHTML}

                </td>

            `;


            ordersList.appendChild(row);

        });


    } catch (error) {

        console.error(
            "Orders error:",
            error
        );


        ordersList.innerHTML = `

            <tr>

                <td colspan="5">

                    ❌ ${t.unableLoadOrders}

                </td>

            </tr>

        `;
    }
}
// ==========================================
// LOAD RECENT ORDERS ON DASHBOARD
// ==========================================

async function loadRecentOrders() {

    const recentOrdersList =
        document.getElementById("recentOrdersList");

    const token =
        localStorage.getItem("token");

    const userData =
        localStorage.getItem("user");


    if (!recentOrdersList || !token || !userData) {
        return;
    }


    const user =
        JSON.parse(userData);


    const language =
        localStorage.getItem("language") || "en";

    const t =
        translations[language] || translations.en;


    const ordersEndpoint =
        user.role === "farmer"
            ? `${API_URL}/orders/farmer-orders`
            : `${API_URL}/orders/my-orders`;


    try {

        const response =
            await fetch(
                ordersEndpoint,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const orders =
            await response.json();


        if (!response.ok) {
            throw new Error(
                orders.message ||
                "Failed to load orders"
            );
        }


        recentOrdersList.innerHTML = "";


        if (orders.length === 0) {

            recentOrdersList.innerHTML = `
                <div class="order">

                    <p>
                        ${t.noOrders}
                    </p>

                </div>
            `;

            return;
        }


        // Show only the 3 most recent orders
        const recentOrders =
            orders.slice(0, 3);


        recentOrders.forEach(order => {

            const productName =
                order.product?.name ||
                "Unknown Product";


            const translatedProduct =
                getTranslatedProductName(
                    productName
                );


            const buyerName =
                order.buyer?.name ||
                "Unknown Buyer";


            const quantity =
                order.quantity || 0;


            const status =
                order.status || "pending";


            const row =
                document.createElement("div");


            row.className = "order";


            row.innerHTML = `

                <div>

                    <b>
                        ${getProductEmoji(productName)}
                        ${translatedProduct}
                    </b>

                    <p>

                        <span data-translate="buyer">
                            ${t.buyer}
                        </span>:

                        ${buyerName}

                    </p>

                </div>


                <div>

                    <b>
                        ${quantity} ${t.kg}
                    </b>

                    <span
                        class="status ${status.toLowerCase()}"
                    >

                        ${t[status] || status}

                    </span>

                </div>

            `;


            recentOrdersList.appendChild(row);

        });


    } catch (error) {

        console.error(
            "Recent orders error:",
            error
        );


        recentOrdersList.innerHTML = `
            <div class="order">

                <p>
                    ❌ ${t.unableLoadOrders}
                </p>

            </div>
        `;
    }
}
// ==========================================
// AUTOMATIC ORDER STATUS REFRESH
// ==========================================

let orderRefreshInterval = null;

let isRefreshingOrders = false;


async function refreshOrdersAutomatically() {

    const token =
        localStorage.getItem("token");

    const user =
        localStorage.getItem("user");


    // Stop if user is not logged in
    if (!token || !user) {
        return;
    }


    // Prevent multiple requests running together
    if (isRefreshingOrders) {
        return;
    }


    isRefreshingOrders = true;


    console.log(
        "Checking orders:",
        new Date().toLocaleTimeString()
    );


    try {

        // Refresh full Orders page
        await loadOrders();

        // Refresh Dashboard Recent Orders
        await loadRecentOrders();

    } catch (error) {

        console.error(
            "Automatic order refresh error:",
            error
        );

    } finally {

        isRefreshingOrders = false;

    }
}


function startOrderAutoRefresh() {

    // Prevent multiple timers
    if (orderRefreshInterval) {

        clearInterval(
            orderRefreshInterval
        );

        orderRefreshInterval = null;
    }


    console.log(
        "Order auto-refresh started."
    );


    // Check immediately
    refreshOrdersAutomatically();


    // Then check every 5 seconds
    orderRefreshInterval =
        setInterval(
            refreshOrdersAutomatically,
            5000
        );
}

// ==========================================
// UPDATE ORDER STATUS
// ==========================================

async function updateOrderStatus(
    orderId,
    newStatus
) {

    const token =
        localStorage.getItem("token");


    if (!token) {

        alert(
            getTranslation("pleaseLogin")
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/orders/${orderId}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                "❌ " +
                (
                    data.message ||
                    getTranslation("failedStatus")
                )
            );


            loadOrders();

            return;
        }


        alert(
            "✅ " +
            getTranslation("orderStatusUpdated")
        );


        loadOrders();


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        alert(
            "❌ " +
            getTranslation("unableStatus")
        );


        loadOrders();
    }
}


// ==========================================
// BUYER - PLACE ORDER
// ==========================================

async function placeOrder(productId) {

    const token =
        localStorage.getItem("token");


    if (!token) {

        alert(
            getTranslation("pleaseLogin")
        );

        return;
    }


    const quantity =
        prompt(
            getTranslation("quantityPrompt")
        );


    if (!quantity) {
        return;
    }


    const quantityNumber =
        Number(quantity);


    if (
        isNaN(quantityNumber) ||
        quantityNumber <= 0
    ) {

        alert(
            getTranslation("validQuantity")
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/orders`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        productId:
                            productId,

                        quantity:
                            quantityNumber
                    })
                }
            );


        const data =
            await response.json();


        if (response.ok) {

            const language =
                localStorage.getItem("language") ||
                "en";

            const t =
                translations[language] ||
                translations.en;


            alert(
                "✅ " +
                t.orderPlaced +
                "\n\n" +
                t.total +
                ": ₹" +
                data.order.totalPrice
            );


            loadMarketplaceProducts();

            loadOrders();


        } else {

            alert(
                "❌ " +
                (
                    data.message ||
                    getTranslation("couldNotPlace")
                )
            );
        }


    } catch (error) {

        console.error(error);


        alert(
            "❌ " +
            getTranslation("unableBackend")
        );
    }
}


// ==========================================
// PRODUCT EMOJI
// ==========================================

function getProductEmoji(productName) {

    const name = productName.toLowerCase().trim();

    if (name.includes("tomato") || name.includes("टमाटर")) {
        return "🍅";
    }

    if (name.includes("potato") || name.includes("आलू")) {
        return "🥔";
    }

    if (name.includes("onion") || name.includes("प्याज़") || name.includes("प्याज")) {
        return "🧅";
    }

    if (name.includes("apple") || name.includes("सेब")) {
        return "🍎";
    }

    if (name.includes("rice") || name.includes("चावल")) {
        return "🌾";
    }

    if (name.includes("wheat") || name.includes("गेहूँ") || name.includes("गेहूं")) {
        return "🌾";
    }

    if (name.includes("carrot") || name.includes("गाजर")) {
        return "🥕";
    }

    if (name.includes("mango") || name.includes("आम")) {
        return "🥭";
    }

    return "🌱";
}
function getTranslatedProductName(productName) {

    const language =
        localStorage.getItem("language") || "en";

    const name =
        productName.toLowerCase().trim();

    const translationKey = {

        potato: "potato",
        tomato: "tomato",
        onion: "onion",
        apple: "apple",
        rice: "rice",
        wheat: "wheat",
        carrot: "carrot",
        mango: "mango"

    }[name];

    if (
        translationKey &&
        translations[language] &&
        translations[language][translationKey]
    ) {
        return translations[language][translationKey];
    }

    return productName;
}
function translateProductDropdown(language) {

    const productSelect =
        document.getElementById("product");

    if (!productSelect) {
        return;
    }

    const options =
        productSelect.querySelectorAll("option");

    options.forEach(option => {

        const key =
            option.getAttribute("data-product");

        if (
            key &&
            translations[language] &&
            translations[language][key]
        ) {
            option.textContent =
                translations[language][key];
        }

    });
}

// ==========================================
// TRANSLATIONS
// ==========================================

const translations = {

    en: {
kgAvailable: "kg available",
        // Navigation
        dashboard:
            "Dashboard",

        marketplace:
            "Marketplace",

        orders:
            "Orders",

        forecast:
            "AI Forecast",

        logistics:
            "Logistics",

            kg: "kg",


        // Profile
        farmer:
            "Farmer",

        buyer:
            "Buyer",

        language:
            "Language",

        logout:
            "Logout",


        // Authentication
        createAccount:
            "Create Account",

        welcomeBack:
            "Welcome Back",

        welcomeBackUser:
            "Welcome back, {name} 👋",

        joinMarketplace:
            "Join the FarmConnect marketplace",

        loginSubtitle:
            "Login to your FarmConnect account",

        login:
            "Login",

        register:
            "Register",

        alreadyAccount:
            "Already have an account?",

        noAccount:
            "Don't have an account?",

        fullName:
            "Full Name",


        // Dashboard
        welcome:
            "Welcome back",

        totalProduce:
            "Total Produce",

        activeOrders:
            "Active Orders",

        monthlyEarnings:
            "This Month's Earnings",

        averagePrice:
            "Average Price",


        // Add Produce
        addProduce:
            "Add Produce",

        product:
            "Product",

        quantity:
            "Quantity (kg)",

        price:
            "Expected Price (₹/kg)",

        location:
            "Location",

        listProduce:
            "+ List Produce",


        // Orders
        recentOrders:
            "Recent Orders",

        viewAll:
            "View All",

        status:
            "Status",

        trackTransactions:
            "Track your transactions",


        // Marketplace
        freshProduce:
            "Fresh Produce",

        buyDirectly:
            "Buy directly from farmers and FPOs",

        buyNow:
            "Buy Now",

        kgAvailable:
            "kg available",


        // Order Status
        pending:
            "Pending",

        confirmed:
            "Confirmed",

        shipped:
            "Shipped",

        delivered:
            "Delivered",

        cancelled:
            "Cancelled",


        // AI Forecast
        aiForecast:
            "AI Demand Forecast",

        aiDemandForecast:
            "AI Demand Forecast",

        predictedDemand:
            "Predicted demand based on historical marketplace data",

        expectedDemand:
            "18% expected demand",

        expectedDemandDecrease:
            "5% expected demand",

        expectedDemandOnion:
            "12% expected demand",

        tomatoDemandForecast:
            "Tomato Demand Forecast",

        mon:
            "Mon",

        tue:
            "Tue",

        wed:
            "Wed",

        thu:
            "Thu",

        fri:
            "Fri",

        sat:
            "Sat",

        sun:
            "Sun",

        recommendation:
            "Recommendation:",

        forecastRecommendation:
            "Based on predicted demand, farmers should consider increasing tomato production by approximately 15–20%.",


        // Logistics
        smartLogistics:
            "Smart Logistics",

        logisticsOptimization:
            "Smart Logistics",

        routeOptimization:
            "AI-assisted route optimization",

        activeVehicles:
            "Active Vehicles",

        deliveriesToday:
            "Deliveries Today",

        estimatedSaving:
            "Estimated Saving",

        optimizedRoute:
            "Optimized Delivery Route",

        farmerA:
            "Farmer A",

        farmerB:
            "Farmer B",

        collectionCentre:
            "Collection Centre",

        bulkBuyer:
            "Bulk Buyer",

        totalDistance:
            "Total Distance",

        estimatedCost:
            "Estimated Cost",

        saving:
            "Saving",


        // AI Market Insight
        aiMarketInsight:
            "AI Market Insight",

        tomatoDemand:
            "Tomato demand is expected to increase by",

        nextWeek:
            "next week.",

        increaseSupply:
            "Consider increasing your tomato supply.",

        viewForecast:
            "View Forecast",


        // Search
        searchProduce:
            "Search produce...",


        // Examples
        quantityExample:
            "e.g. 500",

        priceExample:
            "e.g. 30",


        // Marketplace Messages
        noProduce:
            "No produce available",

        farmersNoProduce:
            "Farmers haven't listed any produce yet.",

        unableLoadProducts:
            "Unable to load products",

        backendMessage:
            "Please make sure the backend is running.",


        // Orders Messages
        noOrders:
            "No orders found.",

        unableLoadOrders:
            "Unable to load orders.",

            potato: "Potato",
tomato: "Tomato",
onion: "Onion",
apple: "Apple",
rice: "Rice",
wheat: "Wheat",
carrot: "Carrot",
mango: "Mango",


        // General Messages
        pleaseLogin:
            "Please login first.",

        validQuantity:
            "Please enter a valid quantity.",

        quantityPrompt:
            "Enter quantity you want to buy (kg):",

        orderPlaced:
            "Order placed successfully!",

        total:
            "Total",

        couldNotPlace:
            "Could not place order",

        unableBackend:
            "Cannot connect to backend.",

        produceAdded:
            "Produce added successfully!",

        failedProduce:
            "Failed to add produce",

        orderStatusUpdated:
            "Order status updated successfully!",

        failedStatus:
            "Failed to update order status",

        unableStatus:
            "Unable to update order status",

        unableServer:
            "Unable to connect to server.",

        registrationSuccess:
            "Registration successful! Please login."
    },


    hi: {
kgAvailable: "किग्रा उपलब्ध",
        // Navigation
        dashboard:
            "डैशबोर्ड",

        marketplace:
            "बाज़ार",

        orders:
            "ऑर्डर",

        forecast:
            "एआई मांग पूर्वानुमान",

        logistics:
            "लॉजिस्टिक्स",

            kg: "किग्रा",


        // Profile
        farmer:
            "किसान",

        buyer:
            "खरीदार",

        language:
            "भाषा",

        logout:
            "लॉग आउट",


        // Authentication
        createAccount:
            "खाता बनाएं",

        welcomeBack:
            "वापसी पर स्वागत है",

        welcomeBackUser:
            "वापसी पर स्वागत है, {name} 👋",

        joinMarketplace:
            "FarmConnect कृषि बाज़ार से जुड़ें",

        loginSubtitle:
            "अपने FarmConnect खाते में लॉग इन करें",

        login:
            "लॉग इन",

        register:
            "पंजीकरण करें",

        alreadyAccount:
            "क्या आपका पहले से खाता है?",

        noAccount:
            "क्या आपका खाता नहीं है?",

        fullName:
            "पूरा नाम",


        // Dashboard
        welcome:
            "वापसी पर स्वागत है",

        totalProduce:
            "कुल उपज",

        activeOrders:
            "सक्रिय ऑर्डर",

        monthlyEarnings:
            "इस महीने की कमाई",

        averagePrice:
            "औसत कीमत",


        // Add Produce
        addProduce:
            "उपज जोड़ें",

        product:
            "उत्पाद",

        quantity:
            "मात्रा (किग्रा)",

        price:
            "अपेक्षित कीमत (₹/किग्रा)",

        location:
            "स्थान",

        listProduce:
            "+ उपज सूचीबद्ध करें",


        // Orders
        recentOrders:
            "हाल के ऑर्डर",

        viewAll:
            "सभी देखें",

        status:
            "स्थिति",

        trackTransactions:
            "अपने लेन-देन देखें",


        // Marketplace
        freshProduce:
            "ताज़ी उपज",

        buyDirectly:
            "किसानों और FPO से सीधे खरीदें",

        buyNow:
            "अभी खरीदें",

        kgAvailable:
            "किग्रा उपलब्ध",


        // Order Status
        pending:
            "लंबित",

        confirmed:
            "पुष्टि की गई",

        shipped:
            "भेजा गया",

        delivered:
            "डिलीवर किया गया",

        cancelled:
            "रद्द किया गया",


        // AI Forecast
        aiForecast:
            "एआई मांग पूर्वानुमान",

        aiDemandForecast:
            "एआई मांग पूर्वानुमान",

        predictedDemand:
            "पिछले बाज़ार के आंकड़ों के आधार पर अनुमानित मांग",

        expectedDemand:
            "18% मांग बढ़ने की उम्मीद",

        expectedDemandDecrease:
            "5% मांग घटने की उम्मीद",

        expectedDemandOnion:
            "12% मांग बढ़ने की उम्मीद",

        tomatoDemandForecast:
            "टमाटर की मांग का पूर्वानुमान",

        mon:
            "सोम",

        tue:
            "मंगल",

        wed:
            "बुध",

        thu:
            "गुरु",

        fri:
            "शुक्र",

        sat:
            "शनि",

        sun:
            "रवि",

        recommendation:
            "सुझाव:",

        forecastRecommendation:
            "अनुमानित मांग के आधार पर किसानों को टमाटर का उत्पादन लगभग 15–20% बढ़ाने पर विचार करना चाहिए।",


        // Logistics
        smartLogistics:
            "स्मार्ट लॉजिस्टिक्स",

        logisticsOptimization:
            "स्मार्ट लॉजिस्टिक्स",

        routeOptimization:
            "एआई की सहायता से मार्ग अनुकूलन",

        activeVehicles:
            "सक्रिय वाहन",

        deliveriesToday:
            "आज की डिलीवरी",

        estimatedSaving:
            "अनुमानित बचत",

        optimizedRoute:
            "अनुकूलित डिलीवरी मार्ग",

        farmerA:
            "किसान A",

        farmerB:
            "किसान B",

        collectionCentre:
            "संग्रह केंद्र",

        bulkBuyer:
            "थोक खरीदार",

        totalDistance:
            "कुल दूरी",

        estimatedCost:
            "अनुमानित लागत",

        saving:
            "बचत",


        // AI Market Insight
        aiMarketInsight:
            "AI बाज़ार जानकारी",

        tomatoDemand:
            "टमाटर की मांग में बढ़ोतरी की उम्मीद है",

        nextWeek:
            "अगले सप्ताह।",

        increaseSupply:
            "अपने टमाटर की आपूर्ति बढ़ाने पर विचार करें।",

        viewForecast:
            "पूर्वानुमान देखें",


        // Search
        searchProduce:
            "उपज खोजें...",


        // Examples
        quantityExample:
            "जैसे 500",

        priceExample:
            "जैसे 30",


        // Marketplace Messages
        noProduce:
            "कोई उपज उपलब्ध नहीं है",

        farmersNoProduce:
            "किसानों ने अभी तक कोई उपज सूचीबद्ध नहीं की है।",

        unableLoadProducts:
            "उत्पाद लोड नहीं हो सके",

        backendMessage:
            "कृपया सुनिश्चित करें कि सर्वर चल रहा है।",


        // Orders Messages
        noOrders:
            "कोई ऑर्डर नहीं मिला।",

        unableLoadOrders:
            "ऑर्डर लोड नहीं हो सके।",

            potato: "आलू",
tomato: "टमाटर",
onion: "प्याज़",
apple: "सेब",
rice: "चावल",
wheat: "गेहूँ",
carrot: "गाजर",
mango: "आम",


        // General Messages
        pleaseLogin:
            "कृपया पहले लॉग इन करें।",

        validQuantity:
            "कृपया सही मात्रा दर्ज करें।",

        quantityPrompt:
            "आप कितनी मात्रा खरीदना चाहते हैं (किग्रा)?",

        orderPlaced:
            "ऑर्डर सफलतापूर्वक दिया गया!",

        total:
            "कुल",

        couldNotPlace:
            "ऑर्डर नहीं दिया जा सका।",

        unableBackend:
            "सर्वर से कनेक्ट नहीं हो सका।",

        produceAdded:
            "उपज सफलतापूर्वक जोड़ दी गई!",

        failedProduce:
            "उपज जोड़ने में समस्या हुई।",

        orderStatusUpdated:
            "ऑर्डर की स्थिति सफलतापूर्वक अपडेट हुई!",

        failedStatus:
            "ऑर्डर की स्थिति अपडेट नहीं हो सकी।",

        unableStatus:
            "ऑर्डर की स्थिति अपडेट नहीं हो सकी।",

        unableServer:
            "सर्वर से कनेक्ट नहीं हो सका।",

        registrationSuccess:
            "पंजीकरण सफल रहा! कृपया लॉग इन करें।"
    }
};


// ==========================================
// GET TRANSLATION
// ==========================================

function getTranslation(key) {

    const language =
        localStorage.getItem("language") || "en";

    return (
        translations[language]?.[key] ||
        translations.en[key] ||
        key
    );
}


// ==========================================
// CHANGE LANGUAGE
// ==========================================

function changeLanguage(language) {

    const selectedLanguage =
        translations[language]
            ? language
            : "en";


    // Translate normal text
    const elements =
        document.querySelectorAll(
            "[data-translate]"
        );


    elements.forEach(function(element) {

        const key =
            element.getAttribute(
                "data-translate"
            );


        if (
            translations[selectedLanguage] &&
            translations[selectedLanguage][key]
        ) {

            element.textContent =
                translations[selectedLanguage][key];
        }

    });


    // Translate placeholders
    const placeholderElements =
        document.querySelectorAll(
            "[data-translate-placeholder]"
        );


    placeholderElements.forEach(
        function(element) {

            const key =
                element.getAttribute(
                    "data-translate-placeholder"
                );


            if (
                translations[selectedLanguage] &&
                translations[selectedLanguage][key]
            ) {

                element.placeholder =
                    translations[selectedLanguage][key];
            }

        }
    );


    // Save selected language
    localStorage.setItem(
        "language",
        selectedLanguage
    );
        translateProductDropdown(selectedLanguage);


    // Update logged-in user's profile
    const userData =
        localStorage.getItem("user");


    if (userData) {

        try {

            const user =
                JSON.parse(userData);

            updateUserProfile(user);

        } catch (error) {

            console.error(
                "Language profile update error:",
                error
            );
        }
    }


    // Reload dynamic content
    loadMarketplaceProducts();

    loadOrders();

    loadRecentOrders();
}


// ==========================================
// LOAD MARKETPLACE AND ORDERS ON PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadMarketplaceProducts();

        loadOrders();

        loadRecentOrders();

    }
);


// ==========================================
// LOAD SAVED LANGUAGE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const languageSelect =
            document.getElementById(
                "languageSelect"
            );


        const savedLanguage =
            localStorage.getItem("language") ||
            "en";


        if (languageSelect) {

            languageSelect.value =
                savedLanguage;


            languageSelect.addEventListener(
                "change",
                function() {

                    changeLanguage(
                        this.value
                    );

                }
            );
        }


        // Apply saved language
        changeLanguage(
            savedLanguage
        );

    }
);