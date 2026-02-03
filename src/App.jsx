
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ProductCard } from "./Components/ProductCard";
import { Cart } from "./Components/Cart";
import { HikeList } from "./Components/HikeList";

const DEFAULT_PRODUCTS = [
  { id: 1, title: "Hiking Boots", price: 89.99, qty: 15, img: "images/product1.png" },
  { id: 2, title: "Backpack", price: 45.5, qty: 20, img: "images/product2.png" },
  { id: 3, title: "Water Bottle", price: 12.99, qty: 50, img: "images/product3.png" },
];

const DIFFICULTY_ITEMS = {
  Easy: ["Water Bottle", "Map", "Snacks"],
  Moderate: ["Water Bottle", "Map", "Snacks", "First Aid Kit", "Rain Jacket"],
  Hard: ["Water Bottle", "Map", "Snacks", "First Aid Kit", "Rain Jacket", "Hiking Poles", "Extra Layers"]
};

const LOGIN_BANNERS = [
  {
    title: "Plan Your Perfect Hike 🌄",
    text: "Create hiking plans, choose difficulty, and stay prepared for every trail."
  },
  {
    title: "Stay Safe on the Trail 🧭",
    text: "Get random trail suggestions and safety alerts for hiking areas."
  },
  {
    title: "Hike on a Budget 💰",
    text: "Buy only what you need. Budget-friendly gear for every hike."
  }
];

const loadCart = () => {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const saveCart = (c) => localStorage.setItem("cart", JSON.stringify(c));

const getRandomColor = () => {
  const colors = ["#2b8aef", "#f97316", "#10b981", "#eab308", "#8b5cf6", "#ec4899"];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function App() {
  // --- USERS ---
  const [user, setUser] = useState(null); // null = not logged in
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // --- DATA ---
  const [hikes, setHikes] = useState([]);
  const [products, setProducts] = useState(() => DEFAULT_PRODUCTS);
  const [cart, setCart] = useState(() => loadCart());

  // --- UI ---
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // --- Forms ---
  const [hikeName, setHikeName] = useState("");
  const [hikeLocation, setHikeLocation] = useState("");
  const [hikeDifficulty, setHikeDifficulty] = useState("Easy");
  const [hikeNotes, setHikeNotes] = useState("");

  const [prodTitle, setProdTitle] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodQty, setProdQty] = useState("");
  const [prodImg, setProdImg] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);

  const [bannerIndex, setBannerIndex] = useState(0);

  const nextBanner = () => {
  setBannerIndex((prev) => (prev + 1) % LOGIN_BANNERS.length);
  };

  const prevBanner = () => {
    setBannerIndex((prev) =>
      prev === 0 ? LOGIN_BANNERS.length - 1 : prev - 1
    );
  };


  // --- MAP ---
  const [mapLocation, setMapLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef(null);
  const mapDivRef = useRef(null);

  const generateRandomTrails = (lat, lng) => {
    const trails = [];

    for (let i = 0; i < 3; i++) {
        const offsetLat = (Math.random() - 0.5) * 0.02;
        const offsetLng = (Math.random() - 0.5) * 0.02;

        trails.push([
            [lat, lng],
            [lat + offsetLat, lng + offsetLng],
            [lat + offsetLat * 1.5, lng + offsetLng * 1.5],
        ]);
    }

    return trails;
};

  // --- LocalStorage helpers ---
  useEffect(() => saveCart(cart), [cart]);
  useEffect(() => {
    localStorage.setItem("hikes", JSON.stringify(hikes));
  }, [hikes]);

  // --- Filtered ---
  const filteredHikes = useMemo(() =>
    filterDifficulty ? hikes.filter(h => h.difficulty === filterDifficulty) : hikes,
    [hikes, filterDifficulty]
  );
  const filteredProducts = useMemo(() =>
    searchTerm ? products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())) : products,
    [products, searchTerm]
  );

  // --- Login/Register ---
  const USERS_KEY = "hiking_users";

  const handleRegister = () => {
    if (!username || !password) return alert("Enter username/password");
    const saved = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    if (saved[username]) return alert("User exists");
    saved[username] = { password, isAdmin: username === "admin" };
    localStorage.setItem(USERS_KEY, JSON.stringify(saved));
    alert("Registered! Now login.");
  };

  const handleLogin = () => {
    const saved = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    const u = saved[username];
    if (!u || u.password !== password) return alert("Wrong username/password");
    setUser({ username, isAdmin: u.isAdmin });
  };

  const handleLogout = () => setUser(null);



  // --- Hikes ---
  const checkRandomDanger = () => {
    if (Math.random() < 0.2) alert("⚠️ Warning: This area may have dangerous wildlife or terrain!");
  };

  const handleHikeSubmit = (e) => {
    e.preventDefault();
    if (!hikeName.trim()) return alert("Name required");

    const newHike = {
      id: Date.now(),
      name: hikeName.trim(),
      location: hikeLocation.trim(),
      difficulty: hikeDifficulty,
      notes: hikeNotes.trim()
    };

    setHikes(prev => [...prev, newHike]);
    setHikeName(""); setHikeLocation(""); setHikeDifficulty("Easy"); setHikeNotes("");
    checkRandomDanger();
  };

  const deletePlan = (idx) => {
    if (!window.confirm("Delete this hike?")) return;
    setHikes(prev => prev.filter((_, i) => i !== idx));
  };

  const editPlan = (idx) => {
    const h = hikes[idx];
    if (!h) return;
    setHikeName(h.name);
    setHikeLocation(h.location);
    setHikeDifficulty(h.difficulty);
    setHikeNotes(h.notes);
    setHikes(prev => prev.filter((_, i) => i !== idx));
  };

  const clearAllPlans = () => {
    if (window.confirm("Clear all plans?")) setHikes([]);
  };

  // --- Cart ---
  const addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.qty <= 0) return alert("Out of stock");
    setCart(prev => {
      const found = prev.find(c => c.id === productId);
      if (found) return prev.map(c => c.id === productId ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: product.id, title: product.title, price: product.price, qty: 1 }];
    });
  };

  const changeCartQty = (idx, delta) => setCart(prev => {
    const copy = [...prev];
    if (!copy[idx]) return copy;
    copy[idx] = { ...copy[idx], qty: copy[idx].qty + delta };
    if (copy[idx].qty <= 0) copy.splice(idx, 1);
    return copy;
  });
  const removeCartItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));
  const emptyCart = () => { if (window.confirm("Empty cart?")) setCart([]); };

  // --- Products ---
  const handleAddProduct = () => {
    if (!user?.isAdmin) return alert("Admins only");
    const title = prodTitle.trim();
    if (!title) return alert("Enter title");
    const price = parseFloat(prodPrice) || 0;
    const qty = parseInt(prodQty) || 0;
    const img = prodImg.trim();

    if (editingProductId) {
      setProducts(prev => prev.map(p => p.id === editingProductId ? { ...p, title, price, qty, img } : p));
      setEditingProductId(null);
    } else {
      const newId = Date.now();
      setProducts(prev => [...prev, { id: newId, title, price, qty, img }]);
    }

    setProdTitle(""); setProdPrice(""); setProdQty(""); setProdImg("");
  };

  const deleteProduct = (id) => {
    if (!user?.isAdmin) return;
    if (!window.confirm("Delete this product?")) return;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const editProduct = (id) => {
    if (!user?.isAdmin) return;
    const p = products.find(x => x.id === id);
    if (!p) return;
    setProdTitle(p.title); setProdPrice(String(p.price)); setProdQty(String(p.qty)); setProdImg(p.img || "");
    setEditingProductId(p.id);
  };

  // --- Map ---
  useEffect(() => {
    if (!showMap || !mapLocation) return;
    let cancelled = false;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapLocation)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (!data || !data[0]) return alert("Location not found");
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
        mapRef.current = L.map(mapDivRef.current).setView([lat, lon], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(mapRef.current);
        L.marker([lat, lon]).addTo(mapRef.current).bindPopup(mapLocation).openPopup();
        const trails = generateRandomTrails(lat, lon);

        trails.forEach((trail, index) => {
            L.polyline(trail, {
            color: "green",
            weight: 4,
            opacity: 0.8,
        })
            .addTo(mapRef.current)
            .bindPopup(`Suggested Hiking Trail ${index + 1}`);
        });

      })
      .catch(() => alert("Map error"));
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [showMap, mapLocation]);

  const openMapForLocation = (location) => { if (!location) return alert("No location provided"); setMapLocation(location); setShowMap(true); };
  const closeMap = () => { setShowMap(false); setMapLocation(null); if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };

  // --- JSX ---
  if (!user) {
    return (
      <div className="container login-layout">
        
        {/* LEFT: Banner */}
        <div className="login-banner">
          <h1>{LOGIN_BANNERS[bannerIndex].title}</h1>
          <p>{LOGIN_BANNERS[bannerIndex].text}</p>

          <div className="banner-controls">
            <button onClick={prevBanner} className="small">◀</button>
            <button onClick={nextBanner} className="small">▶</button>
          </div>
        </div>

        {/* RIGHT: Login */}
        <div className="login-card card">
          <h2>Login / Register</h2>

          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button onClick={handleLogin}>Login</button>
            <button onClick={handleRegister}>Register</button>
          </div>

          <p className="muted" style={{ marginTop: "10px" }}>
            Tip: Login as <b>admin</b> to manage products
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="container">
      <div>
        <div className="header">
          <div className="logo">BP</div>
          <div>
            <h1>Budget-Friendly Hiking Planner</h1>
            <div className="muted">Plan hikes, track budget, and buy affordable gear</div>
          </div>
          <button onClick={handleLogout} style={{marginLeft:"20px"}}>Logout</button>
        </div>

        {/* Hike Planner */}
        <div className="card">
          <h2>Plan a Hike</h2>
          <label>
            Filter by Difficulty
            <select value={filterDifficulty} onChange={e=>setFilterDifficulty(e.target.value)}>
              <option value="">All</option><option>Easy</option><option>Moderate</option><option>Hard</option>
            </select>
          </label>

          <form id="hikeForm" onSubmit={handleHikeSubmit}>
            <div className="form-row">
              <label>Hike name<input value={hikeName} onChange={e=>setHikeName(e.target.value)} required/></label>
              <label>Location<input value={hikeLocation} onChange={e=>setHikeLocation(e.target.value)}/></label>
            </div>
            <div className="form-row">
              <label>Difficulty<select value={hikeDifficulty} onChange={e=>setHikeDifficulty(e.target.value)}><option>Easy</option><option>Moderate</option><option>Hard</option></select></label>
              <label>&nbsp;
                <button type="button" className="small" onClick={clearAllPlans} style={{margin:"15px 0",padding:"10px"}}>Clear All Plans</button>
              </label>
            </div>
            <label>Notes<textarea rows="3" value={hikeNotes} onChange={e=>setHikeNotes(e.target.value)}/></label>
            <div className="muted">Suggested items: {DIFFICULTY_ITEMS[hikeDifficulty].join(", ")}</div>
            <button style={{margin:"10px 0",padding:"10px"}} type="submit" className="small">Save Plan</button>
          </form>

          <div id="plansList" className="list">
            <HikeList hikes={filteredHikes} onEdit={editPlan} onDelete={deletePlan} onViewMap={openMapForLocation}/>
          </div>
        </div>

        {showMap && <div id="mapContainer" style={{marginTop:"16px"}}>
          <button type="button" className="small" style={{margin:"15px 0",padding:"10px"}} onClick={closeMap}>Close Map</button>
          <div id="map" ref={mapDivRef} style={{height:300}}/>
        </div>}

        {/* Products */}
        <div className="card" style={{marginTop:"16px"}}>
          <h2>Products (Store)</h2>
          <input placeholder="Search products..." className="search-input" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          <div id="productsList" className="list">
            {filteredProducts.length === 0 ? <div className="muted">No products found</div> :
              filteredProducts.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} adminLogged={user?.isAdmin} onEdit={editProduct} onDelete={deleteProduct}/>)
            }
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="aside-stack">
        <div className="card">
          <h3>Your Cart</h3>
          <div id="cartList" className="list">
            <Cart cart={cart} changeQty={changeCartQty} removeItem={removeCartItem} onCheckout={()=>alert("Checkout simulated!")} onEmpty={emptyCart}/>
          </div>
        </div>

        {user?.isAdmin && <div className="card">
          <h3>Admin Panel</h3>
          <label>Title<input value={prodTitle} onChange={e=>setProdTitle(e.target.value)}/></label>
          <label>Price<input type="number" min="0" step="0.01" value={prodPrice} onChange={e=>setProdPrice(e.target.value)}/></label>
          <label>Qty<input type="number" min="0" step="1" value={prodQty} onChange={e=>setProdQty(e.target.value)}/></label>
          <label>Image URL<input placeholder="https://example.com/img.png" value={prodImg} onChange={e=>setProdImg(e.target.value)}/></label>
          <div style={{marginTop:"8px"}} className="row">
            <button className="small" onClick={handleAddProduct}>Add / Update</button>
          </div>
        </div>}
      </aside>
    </div>
  );







}
