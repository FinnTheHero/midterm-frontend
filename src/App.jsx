import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ProductCard } from "./Components/ProductCard";
import { Cart } from "./Components/Cart";
import { HikeList } from "./Components/HikeList";

const API_BASE = "http://localhost:3000/api";
const ADMIN_PASSWORD = "admin123";

const loadCart = () => {
    try {
        const raw = localStorage.getItem("cart");
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};
const saveCart = (c) => {
    localStorage.setItem("cart", JSON.stringify(c));
};

const getRandomColor = () => {
    const colors = [
        "#2b8aef",
        "#f97316",
        "#10b981",
        "#eab308",
        "#8b5cf6",
        "#ec4899",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

export default function App() {
    // data from backend
    const [hikes, setHikes] = useState([]);
    const [products, setProducts] = useState([]);
    const [_, setOrders] = useState([]);

    // ui state
    const [adminLogged, setAdminLogged] = useState(false);
    const [adminMsg, setAdminMsg] = useState("");
    const [adminPass, setAdminPass] = useState("");

    const [filterDifficulty, setFilterDifficulty] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // forms
    const [hikeName, setHikeName] = useState("");
    const [hikeLocation, setHikeLocation] = useState("");
    const [hikeDifficulty, setHikeDifficulty] = useState("Easy");
    const [hikeNotes, setHikeNotes] = useState("");

    const [prodTitle, setProdTitle] = useState("");
    const [prodPrice, setProdPrice] = useState("");
    const [prodQty, setProdQty] = useState("");
    const [prodImg, setProdImg] = useState("");
    const [editingProductId, setEditingProductId] = useState(null);

    // cart stored locally in browser
    const [cart, setCart] = useState(() => loadCart());

    // map
    const [mapLocation, setMapLocation] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const mapRef = useRef(null);
    const mapDivRef = useRef(null);

    // fetch helpers
    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE}/products`);
            const data = await res.json();
            // ensure color
            const updated = data.map((p) => ({
                ...p,
                color: p.color || getRandomColor(),
            }));
            setProducts(updated);
        } catch {
            console.error("Failed to fetch products");
        }
    };

    const fetchHikes = async () => {
        try {
            const res = await fetch(`${API_BASE}/hikes`);
            const data = await res.json();
            setHikes(data);
        } catch {
            console.error("Failed to fetch hikes");
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE}/orders`);
            const data = await res.json();
            setOrders(data);
        } catch {
            /* ignore */
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchHikes();
        fetchOrders();
    }, []);

    // persist cart locally
    useEffect(() => saveCart(cart), [cart]);

    const filteredHikes = useMemo(
        () =>
            filterDifficulty
                ? hikes.filter((h) => h.difficulty === filterDifficulty)
                : hikes,
        [hikes, filterDifficulty],
    );
    const filteredProducts = useMemo(
        () =>
            searchTerm
                ? products.filter((p) =>
                      p.title.toLowerCase().includes(searchTerm.toLowerCase()),
                  )
                : products,
        [products, searchTerm],
    );

    // Hike handlers using API
    const handleHikeSubmit = async (e) => {
        e.preventDefault();
        if (!hikeName.trim()) return alert("Name required");
        try {
            const res = await fetch(`${API_BASE}/hikes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: hikeName.trim(),
                    location: hikeLocation.trim(),
                    difficulty: hikeDifficulty,
                    notes: hikeNotes.trim(),
                }),
            });
            const newHike = await res.json();
            setHikes((prev) => [...prev, newHike]);
            setHikeName("");
            setHikeLocation("");
            setHikeDifficulty("Easy");
            setHikeNotes("");
        } catch {
            alert("Failed to create hike");
        }
    };

    const deletePlan = async (idx) => {
        const hike = filteredHikes[idx];
        if (!hike) return;
        if (!window.confirm("Delete plan?")) return;
        try {
            await fetch(`${API_BASE}/hikes/${hike.id}`, { method: "DELETE" });
            // refresh list
            fetchHikes();
        } catch {
            alert("Delete failed");
        }
    };

    const editPlan = (idx) => {
        const h = filteredHikes[idx];
        if (!h) return;
        setHikeName(h.name);
        setHikeLocation(h.location);
        setHikeDifficulty(h.difficulty || "Easy");
        setHikeNotes(h.notes || "");
        // remove local copy before saving; will do PUT on submission in future if needed
        setHikes((prev) => prev.filter((x) => x.id !== h.id));
    };

    const clearAllPlans = async () => {
        if (!window.confirm("Clear all plans?")) return;
        try {
            // delete one by one (server has no bulk delete)
            const current = await (await fetch(`${API_BASE}/hikes`)).json();
            await Promise.all(
                current.map((h) =>
                    fetch(`${API_BASE}/hikes/${h.id}`, { method: "DELETE" }),
                ),
            );
            fetchHikes();
        } catch {
            alert("Failed to clear");
        }
    };

    // Cart handlers (client-side cart; checkout posts to server)
    const addToCart = (productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product || product.qty <= 0) return alert("Out of stock");
        setCart((prev) => {
            const found = prev.find((c) => c.id === productId);
            if (found)
                return prev.map((c) =>
                    c.id === productId ? { ...c, qty: c.qty + 1 } : c,
                );
            return [
                ...prev,
                {
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    qty: 1,
                },
            ];
        });
    };

    const changeCartQty = (idx, delta) =>
        setCart((prev) => {
            const copy = [...prev];
            if (!copy[idx]) return copy;
            copy[idx] = { ...copy[idx], qty: copy[idx].qty + delta };
            if (copy[idx].qty <= 0) copy.splice(idx, 1);
            return copy;
        });
    const removeCartItem = (idx) =>
        setCart((prev) => prev.filter((_, i) => i !== idx));

    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Cart empty");
        try {
            const items = cart.map((c) => ({ id: c.id, qty: c.qty }));
            const res = await fetch(`${API_BASE}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
            });
            if (!res.ok) {
                const err = await res.json();
                return alert(err.message || "Checkout failed");
            }
            const order = await res.json();
            // refresh products and orders
            fetchProducts();
            fetchOrders();
            setCart([]);
            alert(
                "Purchase complete — inventory updated (order id: " +
                    order.id +
                    ")",
            );
        } catch {
            alert("Checkout error");
        }
    };

    const emptyCart = () => {
        if (window.confirm("Empty cart?")) setCart([]);
    };

    // Admin handlers (talk to API)
    const handleAdminLogin = () => {
        if (adminPass === ADMIN_PASSWORD) {
            setAdminLogged(true);
            setAdminMsg("Logged in");
        } else setAdminMsg("Wrong password");
    };
    const handleAdminLogout = () => {
        setAdminLogged(false);
        setAdminMsg("");
    };

    const handleAddProduct = async () => {
        if (!adminLogged) return alert("Admin only");
        const title = prodTitle.trim();
        if (!title) return alert("Enter product title");
        const price = parseFloat(prodPrice) || 0;
        const qty = parseInt(prodQty) || 0;
        const img = prodImg.trim();
        try {
            if (editingProductId) {
                const res = await fetch(
                    `${API_BASE}/products/${editingProductId}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title, price, qty, img }),
                    },
                );
                if (!res.ok) throw new Error();
                setAdminMsg("Product updated");
            } else {
                const res = await fetch(`${API_BASE}/products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, price, qty, img }),
                });
                if (!res.ok) throw new Error();
                setAdminMsg("Product added");
            }
            setProdTitle("");
            setProdPrice("");
            setProdQty("");
            setProdImg("");
            setEditingProductId(null);
            fetchProducts();
        } catch {
            alert("Product save failed");
        }
    };

    const resetProducts = async () => {
        if (!window.confirm("Reset to default products?")) return;
        // For demo, we'll delete all products and recreate defaults via API
        try {
            const res = await fetch(`${API_BASE}/products`);
            const current = await res.json();
            await Promise.all(
                current.map((p) =>
                    fetch(`${API_BASE}/products/${p.id}`, { method: "DELETE" }),
                ),
            );
            // recreate defaults client-side (these match the server initial set in server.js)
            await fetch(`${API_BASE}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Hiking Boots",
                    price: 89.99,
                    qty: 15,
                    img: "images/product1.png",
                }),
            });
            await fetch(`${API_BASE}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Backpack",
                    price: 45.5,
                    qty: 20,
                    img: "images/product2.png",
                }),
            });
            await fetch(`${API_BASE}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Water Bottle",
                    price: 12.99,
                    qty: 50,
                    img: "images/product3.png",
                }),
            });
            fetchProducts();
            setAdminMsg("Reset done");
        } catch {
            alert("Reset failed");
        }
    };

    const deleteProduct = async (productId) => {
        if (!adminLogged) return;
        if (!window.confirm("Delete this product?")) return;
        try {
            await fetch(`${API_BASE}/products/${productId}`, {
                method: "DELETE",
            });
            fetchProducts();
        } catch {
            alert("Delete failed");
        }
    };

    const editProduct = (productId) => {
        if (!adminLogged) return;
        const p = products.find((x) => x.id === productId);
        if (!p) return;
        setProdTitle(p.title);
        setProdPrice(String(p.price));
        setProdQty(String(p.qty));
        setProdImg(p.img || "");
        setEditingProductId(p.id);
    };

    // Map: uses npm leaflet
    useEffect(() => {
        if (!showMap || !mapLocation) return;
        let cancelled = false;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapLocation)}`;
        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                if (!data || !data[0]) return alert("Location not found");
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                if (mapRef.current) {
                    mapRef.current.remove();
                    mapRef.current = null;
                }
                mapRef.current = L.map(mapDivRef.current).setView(
                    [lat, lon],
                    13,
                );
                L.tileLayer(
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    { attribution: "&copy; OpenStreetMap contributors" },
                ).addTo(mapRef.current);
                L.marker([lat, lon])
                    .addTo(mapRef.current)
                    .bindPopup(mapLocation)
                    .openPopup();
            })
            .catch(() => alert("Map error"));
        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [showMap, mapLocation]);

    const openMapForLocation = (location) => {
        if (!location) return alert("No location provided");
        setMapLocation(location);
        setShowMap(true);
    };
    const closeMap = () => {
        setShowMap(false);
        setMapLocation(null);
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
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

                    <form id="hikeForm" onSubmit={handleHikeSubmit}>
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
                                    style={{
                                        margin: "15px 0px",
                                        padding: "10px",
                                    }}
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
                            />
                        </label>

                        <button
                            style={{ margin: "10px 0px", padding: "10px" }}
                            type="submit"
                            className="small"
                        >
                            Save Plan
                        </button>
                    </form>

                    <div id="plansList" className="list">
                        <HikeList
                            hikes={filteredHikes}
                            onEdit={editPlan}
                            onDelete={deletePlan}
                            onViewMap={openMapForLocation}
                        />
                    </div>
                </div>

                {showMap && (
                    <div id="mapContainer" style={{ marginTop: "16px" }}>
                        <button
                            id="closeMapBtn"
                            type="button"
                            className="small"
                            style={{ margin: "15px 0px", padding: "10px" }}
                            onClick={closeMap}
                        >
                            Close Map
                        </button>
                        <div id="map" ref={mapDivRef} style={{ height: 300 }} />
                    </div>
                )}

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
                            filteredProducts.map((p) => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    onAdd={addToCart}
                                    adminLogged={adminLogged}
                                    onEdit={editProduct}
                                    onDelete={deleteProduct}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            <aside className="aside-stack">
                <div className="card">
                    <h3>Your Cart</h3>
                    <div id="cartList" className="list">
                        <Cart
                            cart={cart}
                            changeQty={changeCartQty}
                            removeItem={removeCartItem}
                            onCheckout={handleCheckout}
                            onEmpty={emptyCart}
                        />
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
                            style={{ margin: "5px 0px", padding: "5px" }}
                        />
                    </label>
                    <div style={{ marginTop: "8px" }} className="row">
                        <button
                            id="adminLogin"
                            className="small"
                            onClick={handleAdminLogin}
                            style={{ margin: "5px 0px", padding: "5px" }}
                        >
                            Login
                        </button>
                        <button
                            id="adminLogout"
                            className="small"
                            onClick={handleAdminLogout}
                            style={{ margin: "5px 0px", padding: "5px" }}
                        >
                            Logout
                        </button>
                    </div>

                    {adminLogged && (
                        <div id="adminPanel" style={{ marginTop: "10px" }}>
                            <h4>Add / Edit Product</h4>
                            <label>
                                Title
                                <input
                                    id="prodTitle"
                                    value={prodTitle}
                                    onChange={(e) =>
                                        setProdTitle(e.target.value)
                                    }
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
                                    onChange={(e) =>
                                        setProdPrice(e.target.value)
                                    }
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
                                    style={{
                                        margin: "5px 0px",
                                        padding: "5px",
                                    }}
                                >
                                    Add / Update Product
                                </button>
                                <button
                                    id="resetProducts"
                                    className="small"
                                    onClick={resetProducts}
                                    style={{
                                        margin: "5px 0px",
                                        padding: "5px",
                                    }}
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
                    )}
                </div>
            </aside>
        </div>
    );
}
