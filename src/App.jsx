import { useState, useMemo } from "react";
import "./App.css";

function App() {
    const DEFAULT_PRODUCTS = [
        {
            id: "p1",
            title: "Trekking Poles",
            price: 19.99,
            qty: 10,
            img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
        },
        {
            id: "p2",
            title: "Water Bottle",
            price: 9.5,
            qty: 25,
            img: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=300&fit=crop",
        },
        {
            id: "p3",
            title: "Backpack 20L",
            price: 29.99,
            qty: 8,
            img: "https://images.unsplash.com/photo-1622260614153-03223fb72052?w=400&h=300&fit=crop",
        },
    ];

    const ADMIN_PASSWORD = "admin123";

    // State management
    const [hikes, setHikes] = useState([]);
    const [products, setProducts] = useState(DEFAULT_PRODUCTS);
    const [cart, setCart] = useState([]);
    const [adminLogged, setAdminLogged] = useState(false);
    const [filterDifficulty, setFilterDifficulty] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [adminPass, setAdminPass] = useState("");
    const [adminMsg, setAdminMsg] = useState("");

    // Form states
    const [hikeName, setHikeName] = useState("");
    const [hikeLocation, setHikeLocation] = useState("");
    const [hikeDifficulty, setHikeDifficulty] = useState("Easy");
    const [hikeNotes, setHikeNotes] = useState("");

    const [prodTitle, setProdTitle] = useState("");
    const [prodPrice, setProdPrice] = useState("");
    const [prodQty, setProdQty] = useState("");
    const [prodImg, setProdImg] = useState("");

    const getRandomColor = () => {
        const colors = [
            "#2b8aef",
            "#f97316",
            "#10b981",
            "#eab308",
            "#8b5cf6",
            "#ec4899",
        ];
        return colors[Math.floor(colors.length)];
    };

    // Optimized filtered lists with useMemo
    const filteredHikes = useMemo(() => {
        return filterDifficulty
            ? hikes.filter((h) => h.difficulty === filterDifficulty)
            : hikes;
    }, [hikes, filterDifficulty]);

    const filteredProducts = useMemo(() => {
        return searchTerm
            ? products.filter((p) =>
                  p.title.toLowerCase().includes(searchTerm.toLowerCase()),
              )
            : products;
    }, [products, searchTerm]);

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    }, [cart]);

    // Hike handlers
    const handleHikeSubmit = (e) => {
        e.preventDefault();
        if (!hikeName.trim()) {
            alert("Name required");
            return;
        }
        setHikes([
            ...hikes,
            {
                name: hikeName,
                location: hikeLocation,
                difficulty: hikeDifficulty,
                notes: hikeNotes,
            },
        ]);
        setHikeName("");
        setHikeLocation("");
        setHikeDifficulty("Easy");
        setHikeNotes("");
    };

    const deletePlan = (idx) => {
        if (!window.confirm("Delete plan?")) return;
        setHikes(hikes.filter((_, i) => i !== idx));
    };

    const editPlan = (idx) => {
        const h = hikes[idx];
        setHikeName(h.name);
        setHikeLocation(h.location);
        setHikeDifficulty(h.difficulty);
        setHikeNotes(h.notes);
        setHikes(hikes.filter((_, i) => i !== idx));
    };

    const clearAllPlans = () => {
        if (window.confirm("Clear all plans?")) {
            setHikes([]);
        }
    };

    const showMap = (location) => {
        alert(
            `Map view for: ${location}\n(Map functionality would require Leaflet integration)`,
        );
    };

    // Cart handlers
    const addToCart = (productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product || product.qty <= 0) {
            alert("Out of stock");
            return;
        }

        const existingItem = cart.find((c) => c.id === productId);
        if (existingItem) {
            setCart(
                cart.map((c) =>
                    c.id === productId ? { ...c, qty: c.qty + 1 } : c,
                ),
            );
        } else {
            setCart([
                ...cart,
                {
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    qty: 1,
                },
            ]);
        }
    };

    const changeCartQty = (idx, delta) => {
        const newCart = [...cart];
        newCart[idx].qty += delta;
        if (newCart[idx].qty <= 0) {
            newCart.splice(idx, 1);
        }
        setCart(newCart);
    };

    const removeCartItem = (idx) => {
        setCart(cart.filter((_, i) => i !== idx));
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert("Cart empty");
            return;
        }

        for (const c of cart) {
            const p = products.find((x) => x.id === c.id);
            if (!p || p.qty < c.qty) {
                alert("Not enough inventory for " + (p ? p.title : c.title));
                return;
            }
        }

        if (!window.confirm("Proceed to checkout?")) return;

        const updatedProducts = products.map((p) => {
            const cartItem = cart.find((c) => c.id === p.id);
            if (cartItem) {
                return { ...p, qty: Math.max(0, p.qty - cartItem.qty) };
            }
            return p;
        });

        setProducts(updatedProducts);
        setCart([]);
        alert("Purchase complete — inventory updated");
    };

    const emptyCart = () => {
        if (window.confirm("Empty cart?")) {
            setCart([]);
        }
    };

    // Admin handlers
    const handleAdminLogin = () => {
        if (adminPass === ADMIN_PASSWORD) {
            setAdminLogged(true);
            setAdminMsg("Logged in");
        } else {
            setAdminMsg("Wrong password");
        }
    };

    const handleAdminLogout = () => {
        setAdminLogged(false);
        setAdminMsg("");
    };

    const handleAddProduct = () => {
        if (!adminLogged) {
            alert("Admin only");
            return;
        }

        if (!prodTitle.trim()) {
            alert("Enter product title");
            return;
        }

        const existingProduct = products.find(
            (x) => x.title.toLowerCase() === prodTitle.toLowerCase(),
        );

        if (existingProduct) {
            setProducts(
                products.map((p) =>
                    p.id === existingProduct.id
                        ? {
                              ...p,
                              price: parseFloat(prodPrice) || 0,
                              qty: parseInt(prodQty) || 0,
                              img: prodImg || p.img,
                          }
                        : p,
                ),
            );
            setAdminMsg("Product updated");
        } else {
            const newProduct = {
                id: "p",
                title: prodTitle,
                price: parseFloat(prodPrice) || 0,
                qty: parseInt(prodQty) || 0,
                img:
                    prodImg ||
                    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
                color: getRandomColor(),
            };
            setProducts([...products, newProduct]);
            setAdminMsg("Product added");
        }

        setProdTitle("");
        setProdPrice("");
        setProdQty("");
        setProdImg("");
    };

    const resetProducts = () => {
        if (!window.confirm("Reset to default products?")) return;
        setProducts([...DEFAULT_PRODUCTS]);
        setAdminMsg("Reset done");
    };

    const deleteProduct = (productId) => {
        if (!adminLogged) return;
        if (!window.confirm("Delete this product?")) return;
        setProducts(products.filter((p) => p.id !== productId));
    };

    const editProduct = (productId) => {
        if (!adminLogged) return;
        const p = products.find((x) => x.id === productId);
        if (!p) return;
        setProdTitle(p.title);
        setProdPrice(p.price.toString());
        setProdQty(p.qty.toString());
        setProdImg(p.img);
    };

    return (
        <div className="container">
            <div>
                <div className="header">
                    <div className="logo">BP</div>
                    <div>
                        <h1>Budget-Friendly Hiking Planner</h1>
                        <div className="muted">
                            Plan hikes, track budget, and buy affordable gear
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2>Plan a Hike</h2>
                    <label>
                        Filter by Difficulty
                        <select
                            id="filterDifficulty"
                            value={filterDifficulty}
                            onChange={(e) =>
                                setFilterDifficulty(e.target.value)
                            }
                        >
                            <option value="">All</option>
                            <option>Easy</option>
                            <option>Moderate</option>
                            <option>Hard</option>
                        </select>
                    </label>
                    <div id="hikeForm">
                        <div className="form-row">
                            <label>
                                Hike name
                                <input
                                    id="hikeName"
                                    value={hikeName}
                                    onChange={(e) =>
                                        setHikeName(e.target.value)
                                    }
                                    required
                                />
                            </label>
                            <label>
                                Location
                                <input
                                    id="hikeLocation"
                                    value={hikeLocation}
                                    onChange={(e) =>
                                        setHikeLocation(e.target.value)
                                    }
                                />
                            </label>
                        </div>
                        <div className="form-row">
                            <label>
                                Difficulty
                                <select
                                    id="hikeDifficulty"
                                    value={hikeDifficulty}
                                    onChange={(e) =>
                                        setHikeDifficulty(e.target.value)
                                    }
                                >
                                    <option>Easy</option>
                                    <option>Moderate</option>
                                    <option>Hard</option>
                                </select>
                            </label>
                            <label>
                                &nbsp;
                                <button
                                    id="clearPlans"
                                    type="button"
                                    className="small"
                                    onClick={clearAllPlans}
                                >
                                    Clear All Plans
                                </button>
                            </label>
                        </div>
                        <label>
                            Notes
                            <textarea
                                id="hikeNotes"
                                rows="3"
                                value={hikeNotes}
                                onChange={(e) => setHikeNotes(e.target.value)}
                            ></textarea>
                        </label>
                        <div style={{ marginTop: "10px" }} className="row">
                            <button
                                type="submit"
                                className="small"
                                onClick={handleHikeSubmit}
                            >
                                Save Plan
                            </button>
                        </div>
                    </div>

                    <div id="plansList" className="list">
                        {filteredHikes.length === 0 ? (
                            <div className="muted">No plans yet</div>
                        ) : (
                            filteredHikes.map((h, idx) => (
                                <div key={idx} className="item">
                                    <div>
                                        <strong>{h.name}</strong>
                                        <div
                                            className={`muted ${h.difficulty.toLowerCase()}`}
                                        >
                                            {h.location} • {h.difficulty}
                                        </div>
                                        <div className="muted">{h.notes}</div>
                                    </div>
                                    <div className="controls">
                                        <button
                                            onClick={() => editPlan(idx)}
                                            className="small"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deletePlan(idx)}
                                            className="small"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => showMap(h.location)}
                                            className="small"
                                        >
                                            View on Map
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card" style={{ marginTop: "16px" }}>
                    <h2>Products (Store)</h2>
                    <input
                        id="searchProducts"
                        placeholder="Search products..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div id="productsList" className="list">
                        {filteredProducts.length === 0 ? (
                            <div className="muted">No products found</div>
                        ) : (
                            filteredProducts.map((p) => {
                                const color = p.color || getRandomColor();
                                return (
                                    <div
                                        key={p.id}
                                        className="item"
                                        style={{
                                            borderTop: `4px solid ${color}`,
                                        }}
                                    >
                                        <div className="product">
                                            <img
                                                src={p.img}
                                                alt=""
                                                className="product-img"
                                            />
                                            <div
                                                style={{ textAlign: "center" }}
                                            >
                                                <strong>{p.title}</strong>
                                                <div className="muted">
                                                    $
                                                    {Number(p.price).toFixed(2)}{" "}
                                                    • {p.qty} left
                                                </div>
                                            </div>
                                        </div>
                                        <div className="controls">
                                            <button
                                                onClick={() => addToCart(p.id)}
                                                disabled={p.qty <= 0}
                                                className="small"
                                            >
                                                Add
                                            </button>
                                            {adminLogged && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            editProduct(p.id)
                                                        }
                                                        className="small"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            deleteProduct(p.id)
                                                        }
                                                        className="small"
                                                        style={{
                                                            background: "red",
                                                            color: "white",
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <aside className="aside-stack">
                <div className="card">
                    <h3>Your Cart</h3>
                    <div id="cartList" className="list">
                        {cart.length === 0 ? (
                            <div className="muted">Cart is empty</div>
                        ) : (
                            <>
                                {cart.map((c, idx) => (
                                    <div key={idx} className="item">
                                        <div>
                                            <strong>{c.title}</strong>
                                            <div className="muted">
                                                ${Number(c.price).toFixed(2)} ×{" "}
                                                {c.qty}
                                            </div>
                                        </div>
                                        <div className="controls">
                                            <button
                                                onClick={() =>
                                                    changeCartQty(idx, -1)
                                                }
                                                className="small"
                                            >
                                                -
                                            </button>
                                            <button
                                                onClick={() =>
                                                    changeCartQty(idx, 1)
                                                }
                                                className="small"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() =>
                                                    removeCartItem(idx)
                                                }
                                                className="small"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div
                                    style={{
                                        marginTop: "8px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Total: ${cartTotal.toFixed(2)}
                                </div>
                            </>
                        )}
                    </div>
                    <div style={{ marginTop: "8px" }} className="row">
                        <button
                            id="checkoutBtn"
                            className="small"
                            onClick={handleCheckout}
                        >
                            Checkout
                        </button>
                        <button
                            id="emptyCart"
                            type="button"
                            className="small"
                            onClick={emptyCart}
                        >
                            Empty
                        </button>
                    </div>
                </div>

                <div className="card">
                    <h3>Admin / Seller</h3>
                    <div className="muted">
                        Enter admin password to edit inventory
                    </div>
                    <label>
                        Admin password
                        <input
                            id="adminPass"
                            type="password"
                            value={adminPass}
                            onChange={(e) => setAdminPass(e.target.value)}
                        />
                    </label>
                    <div style={{ marginTop: "8px" }} className="row">
                        <button
                            id="adminLogin"
                            className="small"
                            onClick={handleAdminLogin}
                        >
                            Login
                        </button>
                        <button
                            id="adminLogout"
                            className="small"
                            onClick={handleAdminLogout}
                        >
                            Logout
                        </button>
                    </div>
                    <div
                        id="adminPanel"
                        style={{
                            display: adminLogged ? "block" : "none",
                            marginTop: "10px",
                        }}
                    >
                        <h4>Add / Edit Product</h4>
                        <label>
                            Title
                            <input
                                id="prodTitle"
                                value={prodTitle}
                                onChange={(e) => setProdTitle(e.target.value)}
                            />
                        </label>
                        <label>
                            Price (USD)
                            <input
                                id="prodPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                value={prodPrice}
                                onChange={(e) => setProdPrice(e.target.value)}
                            />
                        </label>
                        <label>
                            Quantity
                            <input
                                id="prodQty"
                                type="number"
                                min="0"
                                step="1"
                                value={prodQty}
                                onChange={(e) => setProdQty(e.target.value)}
                            />
                        </label>
                        <label>
                            Image URL
                            <input
                                id="prodImg"
                                placeholder="https://example.com/image.png"
                                value={prodImg}
                                onChange={(e) => setProdImg(e.target.value)}
                            />
                        </label>
                        <div style={{ marginTop: "8px" }} className="row">
                            <button
                                id="addProduct"
                                className="small"
                                onClick={handleAddProduct}
                            >
                                Add / Update Product
                            </button>
                            <button
                                id="resetProducts"
                                className="small"
                                onClick={resetProducts}
                            >
                                Reset Default
                            </button>
                        </div>
                        <div
                            id="adminMsg"
                            className="muted"
                            style={{ marginTop: "8px" }}
                        >
                            {adminMsg}
                        </div>
                    </div>
                </div>

                <div className="footer card">
                    Tips: Use the cart to simulate purchases. Data is stored
                    locally in your browser.
                </div>
            </aside>
        </div>
    );
}

export default App;
