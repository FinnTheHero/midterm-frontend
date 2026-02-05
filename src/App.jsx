import { useState, useEffect } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = "http://localhost:3000/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function App() {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(null);
    const [page, setPage] = useState("home");
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [plans, setPlans] = useState([]);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

    const formatDate = (date) =>
        new Date(date).toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });

    useEffect(() => {
        axios.get(`${API}/routes`).then((r) => setRoutes(r.data));
        axios.get(`${API}/products`).then((r) => setProducts(r.data));
        if (token) {
            axios
                .get(`${API}/plans`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((r) => setPlans(r.data));
            const decoded = JSON.parse(atob(token.split(".")[1]));
            setUser({ role: decoded.role });
        }
    }, [token]);

    const login = async (username, password) => {
        const { data } = await axios.post(`${API}/login`, {
            username,
            password,
        });
        setToken(data.token);
        localStorage.setItem("token", data.token);
        setUser(data.user);
        setPage("home");
    };

    const register = async (username, password) => {
        await axios.post(`${API}/register`, { username, password });
        alert("Registered! Please login.");
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        setPage("home");
    };

    const viewRoute = async (id) => {
        const { data } = await axios.get(`${API}/routes/${id}`);
        setSelectedRoute(data);
        setPage("detail");
    };

    const savePlan = async (route_id, date, budget, notes) => {
        if (!token) {
            setPage("auth");
            return;
        }
        await axios.post(
            `${API}/plans`,
            { route_id, date, budget, notes },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        const { data } = await axios.get(`${API}/plans`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(data);
    };

    const deletePlan = async (id) => {
        await axios.delete(`${API}/plans/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(plans.filter((p) => p.id !== id));
    };

    const addToCart = (product) => {
        if (!token) {
            setPage("auth");
            return;
        }
        const existing = cart.find((c) => c.id === product.id);
        if (existing) {
            setCart(
                cart.map((c) =>
                    c.id === product.id ? { ...c, qty: c.qty + 1 } : c,
                ),
            );
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const updateStock = async (id, qty) => {
        const product = products.find((p) => p.id === id);
        await axios.put(
            `${API}/products/${id}`,
            { ...product, qty },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        const { data } = await axios.get(`${API}/products`);
        setProducts(data);
    };

    const checkout = async () => {
        const items = cart.map((c) => ({ id: c.id, qty: c.qty }));
        const { data } = await axios.post(
            `${API}/orders`,
            { items },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        setProducts(data.products);
        setCart([]);
        setCartOpen(false);
        alert("Order placed!");
    };

    if (page === "auth")
        return (
            <Auth
                onLogin={login}
                onRegister={register}
                onBack={() => setPage("home")}
            />
        );

    if (page === "detail" && selectedRoute) {
        return (
            <div>
                <Nav
                    user={user}
                    onLogout={logout}
                    onNav={setPage}
                    cart={cart}
                    onCart={() => setCartOpen(true)}
                />
                <RouteDetail
                    route={selectedRoute}
                    onBack={() => setPage("home")}
                    onSave={savePlan}
                />
                <Cart
                    cart={cart}
                    open={cartOpen}
                    onClose={() => setCartOpen(false)}
                    onCheckout={checkout}
                />
            </div>
        );
    }

    if (page === "plans") {
        return (
            <div>
                <Nav
                    user={user}
                    onLogout={logout}
                    onNav={setPage}
                    cart={cart}
                    onCart={() => setCartOpen(true)}
                />
                <div className="container">
                    <h2 style={{ marginBottom: "1.5rem" }}>My Hiking Plans</h2>
                    {plans.length === 0 ? (
                        <p>No plans yet</p>
                    ) : (
                        <div className="grid">
                            {plans.map((p) => (
                                <div key={p.id} className="card">
                                    <img
                                        src={p.image_url}
                                        alt={p.route_name}
                                        className="card-img"
                                    />
                                    <div className="card-body">
                                        <h3 className="card-title">
                                            {p.route_name}
                                        </h3>
                                        <p className="card-text">
                                            {p.location}
                                        </p>
                                        <span
                                            className={`badge badge-${p.difficulty?.toLowerCase()}`}
                                        >
                                            {p.difficulty}
                                        </span>
                                        <p style={{ marginTop: "1rem" }}>
                                            Date: {formatDate(p.date)}
                                        </p>
                                        <p>Budget: ${p.budget}</p>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => deletePlan(p.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Cart
                    cart={cart}
                    open={cartOpen}
                    onClose={() => setCartOpen(false)}
                    onCheckout={checkout}
                />
            </div>
        );
    }

    if (page === "store") {
        return (
            <div>
                <Nav
                    user={user}
                    onLogout={logout}
                    onNav={setPage}
                    cart={cart}
                    onCart={() => setCartOpen(true)}
                />
                <div className="container">
                    {user?.role === "admin" && (
                        <div className="admin-panel">
                            <h2>Admin: Manage Inventory</h2>
                            <div
                                className="product-grid"
                                style={{ marginTop: "1.5rem" }}
                            >
                                {products.map((p) => (
                                    <div
                                        key={p.id}
                                        style={{
                                            padding: "1rem",
                                            border: "1px solid #e1e4e8",
                                            borderRadius: "8px",
                                        }}
                                    >
                                        <h4>{p.title}</h4>
                                        <p>Stock: {p.qty}</p>
                                        <input
                                            type="number"
                                            defaultValue={p.qty}
                                            onBlur={(e) =>
                                                updateStock(
                                                    p.id,
                                                    parseInt(e.target.value),
                                                )
                                            }
                                            style={{ width: "80px" }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <h2 style={{ marginBottom: "1.5rem" }}>Gear Store</h2>
                    <div className="product-grid">
                        {products.map((p) => (
                            <div key={p.id} className="product-card">
                                <img
                                    src={p.image_url}
                                    alt={p.title}
                                    className="product-img"
                                />
                                <div className="product-body">
                                    <h4>{p.title}</h4>
                                    <p>${p.price}</p>
                                    <p
                                        style={{
                                            fontSize: "0.85rem",
                                            color: "#586069",
                                        }}
                                    >
                                        Stock: {p.qty}
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => addToCart(p)}
                                        style={{
                                            width: "100%",
                                            marginTop: "0.5rem",
                                        }}
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <Cart
                    cart={cart}
                    open={cartOpen}
                    onClose={() => setCartOpen(false)}
                    onCheckout={checkout}
                />
            </div>
        );
    }

    return (
        <div>
            <Nav
                user={user}
                onLogout={logout}
                onNav={setPage}
                cart={cart}
                onCart={() => setCartOpen(true)}
            />
            <div className="hero">
                <h1>Discover Your Next Adventure</h1>
                <p>Explore trails, plan hikes, and gear up for the outdoors</p>
            </div>
            <div className="container">
                <div className="grid">
                    {routes.map((r) => (
                        <div
                            key={r.id}
                            className="card"
                            onClick={() => viewRoute(r.id)}
                        >
                            <img
                                src={r.image_url}
                                alt={r.name}
                                className="card-img"
                            />
                            <div className="card-body">
                                <h3 className="card-title">{r.name}</h3>
                                <p className="card-text">{r.location}</p>
                                <span
                                    className={`badge badge-${r.difficulty.toLowerCase()}`}
                                >
                                    {r.difficulty}
                                </span>
                                <p
                                    style={{
                                        marginTop: "1rem",
                                        color: "#586069",
                                    }}
                                >
                                    {r.distance} mi • {r.duration}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Cart
                cart={cart}
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                onCheckout={checkout}
            />
        </div>
    );
}

function Nav({ user, onLogout, onNav, cart, onCart }) {
    return (
        <nav className="nav">
            <div className="nav-brand" onClick={() => onNav("home")}>
                🥾 TrailBuddy
            </div>
            <div className="nav-links">
                <span className="nav-link" onClick={() => onNav("home")}>
                    Explore
                </span>
                {user && (
                    <span className="nav-link" onClick={() => onNav("plans")}>
                        My Plans
                    </span>
                )}
                <span className="nav-link" onClick={() => onNav("store")}>
                    Store
                </span>
                <button className="btn btn-outline" onClick={onCart}>
                    Cart ({cart.length})
                </button>
                {user ? (
                    <button className="btn btn-secondary" onClick={onLogout}>
                        Logout
                    </button>
                ) : (
                    <button
                        className="btn btn-primary"
                        onClick={() => onNav("auth")}
                    >
                        Login
                    </button>
                )}
            </div>
        </nav>
    );
}

function Auth({ onLogin, onRegister, onBack }) {
    const [tab, setTab] = useState("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const submit = () => {
        tab === "login"
            ? onLogin(username, password)
            : onRegister(username, password);
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "1rem",
                        cursor: "pointer",
                    }}
                    onClick={onBack}
                >
                    <span style={{ fontSize: "2rem" }}>🥾</span>
                </div>
                <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>
                    TrailBuddy
                </h2>
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${tab === "login" ? "active" : ""}`}
                        onClick={() => setTab("login")}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${tab === "register" ? "active" : ""}`}
                        onClick={() => setTab("register")}
                    >
                        Register
                    </button>
                </div>
                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    className="btn btn-primary"
                    onClick={submit}
                    style={{ width: "100%", marginTop: "1rem" }}
                >
                    {tab === "login" ? "Login" : "Register"}
                </button>
            </div>
        </div>
    );
}

function RouteDetail({ route, onBack, onSave }) {
    const [date, setDate] = useState("");
    const [budget, setBudget] = useState("");
    const [notes, setNotes] = useState("");
    const [weather, setWeather] = useState(null);

    useEffect(() => {
        const mapDiv = document.getElementById("route-map");
        if (!mapDiv) return;
        const map = L.map(mapDiv).setView([route.lat, route.lng], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
            map,
        );
        L.marker([route.lat, route.lng])
            .addTo(map)
            .bindPopup(route.name)
            .openPopup();
        return () => map.remove();
    }, [route]);

    useEffect(() => {
        axios
            .get(`${API}/weather/${route.lat}/${route.lng}`)
            .then((r) => setWeather(r.data.current))
            .catch(() => {});
    }, [route]);

    const getWeatherIcon = (code) => {
        if (code === 0) return "☀️";
        if (code <= 3) return "⛅";
        if (code <= 67) return "🌧️";
        return "🌨️";
    };

    return (
        <div className="detail-container">
            <div className="back-btn" onClick={onBack}>
                ← Back to Trails
            </div>
            <div className="detail-header">
                <img
                    src={route.image_url}
                    alt={route.name}
                    className="detail-img"
                />
                <h1 className="detail-title">{route.name}</h1>
                <p
                    style={{
                        fontSize: "1.1rem",
                        color: "#586069",
                        marginBottom: "1rem",
                    }}
                >
                    {route.location}
                </p>
                <span
                    className={`badge badge-${route.difficulty.toLowerCase()}`}
                >
                    {route.difficulty}
                </span>
                <div className="detail-meta">
                    <div className="meta-item">
                        <span className="meta-label">Distance</span>
                        <span className="meta-value">
                            {route.distance} miles
                        </span>
                    </div>
                    <div className="meta-item">
                        <span className="meta-label">Duration</span>
                        <span className="meta-value">{route.duration}</span>
                    </div>
                    <div className="meta-item">
                        <span className="meta-label">Elevation Gain</span>
                        <span className="meta-value">{route.elevation} ft</span>
                    </div>
                </div>
                <p style={{ lineHeight: "1.6", marginTop: "1.5rem" }}>
                    {route.description}
                </p>
            </div>

            {weather && (
                <div className="weather-box">
                    <h3 style={{ marginBottom: "1rem" }}>Current Weather</h3>
                    <div
                        style={{
                            display: "flex",
                            gap: "2rem",
                            alignItems: "center",
                        }}
                    >
                        <span style={{ fontSize: "3rem" }}>
                            {getWeatherIcon(weather.weathercode)}
                        </span>
                        <div>
                            <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
                                {Math.round(weather.temperature_2m)}°F
                            </p>
                            <p>Wind: {weather.windspeed_10m} mph</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="map-container" id="route-map"></div>

            <div
                style={{
                    background: "white",
                    padding: "2rem",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
            >
                <h3 style={{ marginBottom: "1.5rem" }}>Plan Your Hike</h3>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Budget ($)"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                />
                <textarea
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                />
                <button
                    className="btn btn-primary"
                    onClick={() => onSave(route.id, date, budget, notes)}
                    style={{ width: "100%" }}
                >
                    Save to My Plans
                </button>
            </div>
        </div>
    );
}

function Cart({ cart, open, onClose, onCheckout }) {
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    return (
        <div className={`cart-panel ${open ? "open" : ""}`}>
            <div className="cart-header">
                <h2>Shopping Cart</h2>
                <button
                    onClick={onClose}
                    style={{
                        background: "none",
                        border: "none",
                        fontSize: "1.5rem",
                        cursor: "pointer",
                    }}
                >
                    ×
                </button>
            </div>
            <div className="cart-items">
                {cart.length === 0 ? (
                    <p>Cart is empty</p>
                ) : (
                    <>
                        {cart.map((item) => (
                            <div key={item.id} className="cart-item">
                                <div>
                                    <p style={{ fontWeight: "600" }}>
                                        {item.title}
                                    </p>
                                    <p style={{ color: "#586069" }}>
                                        Qty: {item.qty}
                                    </p>
                                </div>
                                <p style={{ fontWeight: "600" }}>
                                    ${(item.price * item.qty).toFixed(2)}
                                </p>
                            </div>
                        ))}
                        <div
                            style={{
                                marginTop: "1.5rem",
                                fontSize: "1.25rem",
                                fontWeight: "bold",
                            }}
                        >
                            Total: ${total.toFixed(2)}
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={onCheckout}
                            style={{ width: "100%", marginTop: "1rem" }}
                        >
                            Checkout
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
