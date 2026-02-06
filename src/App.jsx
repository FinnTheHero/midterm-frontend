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
	const [notifications, setNotifications] = useState([]);
	const [notifOpen, setNotifOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [difficultyFilter, setDifficultyFilter] = useState("");

	useEffect(() => {
		axios.get(`${API}/routes`).then((r) => setRoutes(r.data));
		axios.get(`${API}/products`).then((r) => setProducts(r.data));
		if (token) {
			axios
				.get(`${API}/plans`, {
					headers: { Authorization: `Bearer ${token}` },
				})
				.then((r) => setPlans(r.data));
			axios
				.get(`${API}/notifications`, {
					headers: { Authorization: `Bearer ${token}` },
				})
				.then((r) => setNotifications(r.data));
			const decoded = JSON.parse(atob(token.split(".")[1]));
			setUser({ id: decoded.id, role: decoded.role });
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

	const register = async (username, password, email) => {
		await axios.post(`${API}/register`, { username, password, email });
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
		const notif = await axios.get(`${API}/notifications`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setPlans(data);
		setNotifications(notif.data);
	};

	const updatePlanStatus = async (id, status) => {
		await axios.put(
			`${API}/plans/${id}`,
			{ status },
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

	const removeFromCart = (id) => {
		setCart(cart.filter((c) => c.id !== id));
	};

	const checkout = async () => {
		const items = cart.map((c) => ({ id: c.id, qty: c.qty }));
		const { data } = await axios.post(
			`${API}/orders`,
			{ items },
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		const notif = await axios.get(`${API}/notifications`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setProducts(data.products);
		setNotifications(notif.data);
		setCart([]);
		setCartOpen(false);
		alert("Order placed!");
	};

	const markNotifRead = async (id) => {
		await axios.put(
			`${API}/notifications/${id}/read`,
			{},
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		setNotifications(
			notifications.map((n) =>
				n.id === id ? { ...n, is_read: true } : n,
			),
		);
	};

	const filteredRoutes = routes.filter(
		(r) =>
			(!difficultyFilter || r.difficulty === difficultyFilter) &&
			(!searchTerm ||
				r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				r.location.toLowerCase().includes(searchTerm.toLowerCase())),
	);

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
				<MobileNav
					page="detail"
					onNav={setPage}
					user={user}
					cart={cart}
					onCart={() => setCartOpen(true)}
					onLogout={logout}
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
					onRemove={removeFromCart}
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
					notifications={notifications}
					notifOpen={notifOpen}
					setNotifOpen={setNotifOpen}
					onNotifRead={markNotifRead}
					onCart={() => setCartOpen(true)}
					cart={cart}
					onNav={setPage}
				/>
				<div className="container">
					<h2 className="section-title">My Hiking Plans</h2>
					{plans.length === 0 ? (
						<div className="empty-state">No hikes planned yet</div>
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
										<p className="card-subtitle">
											{p.location}
										</p>
										<div style={{ marginBottom: "0.5rem" }}>
											<span
												className={`badge badge-${p.difficulty?.toLowerCase()}`}
											>
												{p.difficulty}
											</span>
											<span
												className={`badge badge-${p.status}`}
											>
												{p.status}
											</span>
										</div>
										<p
											style={{
												fontSize: "0.85rem",
												color: "#6b7280",
											}}
										>
											Date: {p.date}
										</p>
										<p
											style={{
												fontSize: "0.85rem",
												color: "#6b7280",
											}}
										>
											Budget: ${p.budget}
										</p>
										<div
											style={{
												display: "flex",
												gap: "0.5rem",
												marginTop: "0.75rem",
											}}
										>
											<button
												className="btn btn-outline"
												style={{
													flex: 1,
													fontSize: "0.85rem",
													padding: "0.5rem",
												}}
												onClick={() =>
													updatePlanStatus(
														p.id,
														p.status === "planned"
															? "completed"
															: "planned",
													)
												}
											>
												{p.status === "planned"
													? "Complete"
													: "Replan"}
											</button>
											<button
												className="btn btn-danger"
												style={{
													fontSize: "0.85rem",
													padding: "0.5rem",
												}}
												onClick={() => deletePlan(p.id)}
											>
												Delete
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
				<MobileNav
					page="plans"
					onNav={setPage}
					user={user}
					cart={cart}
					onCart={() => setCartOpen(true)}
					onLogout={logout}
				/>
				<Cart
					cart={cart}
					open={cartOpen}
					onClose={() => setCartOpen(false)}
					onCheckout={checkout}
					onRemove={removeFromCart}
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
					notifications={notifications}
					notifOpen={notifOpen}
					setNotifOpen={setNotifOpen}
					onNotifRead={markNotifRead}
					onCart={() => setCartOpen(true)}
					cart={cart}
					onNav={setPage}
				/>
				<div className="container">
					<h2 className="section-title">Gear Store</h2>
					<div className="grid">
						{products.map((p) => (
							<div key={p.id} className="card">
								<img
									src={p.image_url}
									alt={p.title}
									className="card-img"
								/>
								<div className="card-body">
									<h4 className="card-title">{p.title}</h4>
									<p
										style={{
											fontSize: "1.25rem",
											fontWeight: "700",
											color: "#428a13",
											margin: "0.5rem 0",
										}}
									>
										${p.price}
									</p>
									<p
										style={{
											fontSize: "0.85rem",
											color: "#6b7280",
										}}
									>
										In stock: {p.qty}
									</p>
									<button
										className="btn btn-primary"
										onClick={() => addToCart(p)}
										style={{
											width: "100%",
											marginTop: "0.75rem",
										}}
									>
										Add to Cart
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
				<MobileNav
					page="store"
					onNav={setPage}
					user={user}
					cart={cart}
					onCart={() => setCartOpen(true)}
					onLogout={logout}
				/>
				<Cart
					cart={cart}
					open={cartOpen}
					onClose={() => setCartOpen(false)}
					onCheckout={checkout}
					onRemove={removeFromCart}
				/>
			</div>
		);
	}

	if (page === "admin" && user?.role === "admin") {
		return (
			<div>
				<Nav
					user={user}
					onLogout={logout}
					notifications={notifications}
					notifOpen={notifOpen}
					setNotifOpen={setNotifOpen}
					onNotifRead={markNotifRead}
					onCart={() => setCartOpen(true)}
					cart={cart}
					onNav={setPage}
				/>
				<AdminDashboard
					token={token}
					products={products}
					setProducts={setProducts}
				/>
				<MobileNav
					page="admin"
					onNav={setPage}
					user={user}
					cart={cart}
					onCart={() => setCartOpen(true)}
					onLogout={logout}
				/>
				<Cart
					cart={cart}
					open={cartOpen}
					onClose={() => setCartOpen(false)}
					onCheckout={checkout}
					onRemove={removeFromCart}
				/>
			</div>
		);
	}

	return (
		<div>
			<Nav
				user={user}
				onLogout={logout}
				notifications={notifications}
				notifOpen={notifOpen}
				setNotifOpen={setNotifOpen}
				onNotifRead={markNotifRead}
				onCart={() => setCartOpen(true)}
				cart={cart}
				onNav={setPage}
			/>
			<div className="hero">
				<h1>Discover Your Next Adventure</h1>
				<p>Explore trails, plan hikes, and gear up</p>
			</div>
			<div className="container">
				<div className="search-bar">
					<span className="search-icon">🔍</span>
					<input
						className="search-input"
						placeholder="Search trails..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<div className="filter-chips">
					<button
						className={`filter-chip ${!difficultyFilter ? "active" : ""}`}
						onClick={() => setDifficultyFilter("")}
					>
						All
					</button>
					<button
						className={`filter-chip ${difficultyFilter === "Easy" ? "active" : ""}`}
						onClick={() => setDifficultyFilter("Easy")}
					>
						Easy
					</button>
					<button
						className={`filter-chip ${difficultyFilter === "Moderate" ? "active" : ""}`}
						onClick={() => setDifficultyFilter("Moderate")}
					>
						Moderate
					</button>
					<button
						className={`filter-chip ${difficultyFilter === "Hard" ? "active" : ""}`}
						onClick={() => setDifficultyFilter("Hard")}
					>
						Hard
					</button>
				</div>
				<h2 className="section-title">Top trails nearby</h2>
				<div className="grid">
					{filteredRoutes.map((r) => (
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
								<p className="card-subtitle">{r.location}</p>
								<span
									className={`badge badge-${r.difficulty.toLowerCase()}`}
								>
									{r.difficulty}
								</span>
								<div className="card-meta">
									<span>{r.distance} km</span>
									<span>•</span>
									<span>{r.duration}</span>
									<span>•</span>
									<span>{r.elevation} m</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
			<MobileNav page="home" onNav={setPage} user={user} cart={cart} onCart={() => setCartOpen(true)} onLogout={logout} />
			<Cart
				cart={cart}
				open={cartOpen}
				onClose={() => setCartOpen(false)}
				onCheckout={checkout}
				onRemove={removeFromCart}
			/>
		</div>
	);
}

function Nav({
	user,
	onLogout,
	notifications,
	notifOpen,
	setNotifOpen,
	onNotifRead,
	onCart,
	cart,
	onNav,
}) {
	const unread = notifications.filter((n) => !n.is_read).length;
	return (
		<>
			<nav className="nav">
				<div className="nav-brand">🥾 TrailBuddy</div>
				<div className="nav-links">
					<button className="btn btn-outline" onClick={() => onNav("home")}>
						Explore
					</button>
					<button className="btn btn-outline" onClick={() => onNav("store")}>
						Store
					</button>
					{user && (
						<>
							<button className="btn btn-outline" onClick={() => onNav("plans")}>
								Plans
							</button>
							<div style={{ position: "relative" }}>
								<span
									style={{
										cursor: "pointer",
										fontSize: "1.25rem",
										position: "relative",
									}}
									onClick={() => setNotifOpen(!notifOpen)}
								>
									🔔
									{unread > 0 && (
										<span
											style={{
												position: "absolute",
												top: "-5px",
												right: "-8px",
												background: "#dc2626",
												color: "white",
												borderRadius: "50%",
												width: "18px",
												height: "18px",
												fontSize: "0.7rem",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontWeight: "600",
											}}
										>
											{unread}
										</span>
									)}
								</span>
							</div>
						</>
					)}
					{user?.role === "admin" && (
						<button className="btn btn-outline" onClick={() => onNav("admin")}>
							Admin
						</button>
					)}
					<button className="btn btn-outline" onClick={onCart}>
						Cart ({cart.length})
					</button>
					{user ? (
						<button
							className="btn btn-secondary"
							onClick={onLogout}
						>
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
			{notifOpen && (
				<div className="notif-panel">
					{notifications.length === 0 ? (
						<p
							style={{
								padding: "2rem",
								textAlign: "center",
								color: "#6b7280",
							}}
						>
							No notifications
						</p>
					) : (
						notifications.map((n) => (
							<div
								key={n.id}
								className={`notif-item ${!n.is_read ? "unread" : ""}`}
								onClick={() => {
									onNotifRead(n.id);
									setNotifOpen(false);
								}}
							>
								<p
									style={{
										fontSize: "0.9rem",
										marginBottom: "0.25rem",
										fontWeight: !n.is_read ? "600" : "400",
									}}
								>
									{n.message}
								</p>
								<p
									style={{
										fontSize: "0.75rem",
										color: "#6b7280",
									}}
								>
									{new Date(
										n.created_at,
									).toLocaleDateString()}
								</p>
							</div>
						))
					)}
				</div>
			)}
		</>
	);
}

function MobileNav({ page, onNav, user, cart, onCart, onLogout }) {
	return (
		<div className="mobile-nav">
			<div
				className={`mobile-nav-item ${page === "home" ? "active" : ""}`}
				onClick={() => onNav("home")}
			>
				<span className="mobile-nav-icon">🏔️</span>
				<span>Explore</span>
			</div>
			{user && (
				<div
					className={`mobile-nav-item ${page === "plans" ? "active" : ""}`}
					onClick={() => onNav("plans")}
				>
					<span className="mobile-nav-icon">📋</span>
					<span>Plans</span>
				</div>
			)}
			<div
				className={`mobile-nav-item ${page === "store" ? "active" : ""}`}
				onClick={() => onNav("store")}
			>
				<span className="mobile-nav-icon">🎒</span>
				<span>Store</span>
			</div>
			{user?.role === "admin" && (
				<div
					className={`mobile-nav-item ${page === "admin" ? "active" : ""}`}
					onClick={() => onNav("admin")}
				>
					<span className="mobile-nav-icon">⚙️</span>
					<span>Admin</span>
				</div>
			)}
			<div
				className={`mobile-nav-item`}
				style={{ position: "relative" }}
				onClick={onCart}
			>
				<span className="mobile-nav-icon">
					🛒
					{cart.length > 0 && (
						<span
							style={{
								position: "absolute",
								top: "0",
								right: "25%",
								background: "#dc2626",
								color: "white",
								borderRadius: "50%",
								width: "16px",
								height: "16px",
								fontSize: "0.65rem",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: "600",
							}}
						>
							{cart.length}
						</span>
					)}
				</span>
				<span>Cart</span>
			</div>
			<div
				className={`mobile-nav-item`}
				onClick={() => (user ? onLogout() : onNav("auth"))}
			>
				<span className="mobile-nav-icon">{user ? "🚪" : "🔑"}</span>
				<span>{user ? "Logout" : "Login"}</span>
			</div>
		</div>
	);
}

function Auth({ onLogin, onRegister, onBack }) {
	const [tab, setTab] = useState("login");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [email, setEmail] = useState("");

	const submit = () => {
		tab === "login"
			? onLogin(username, password)
			: onRegister(username, password, email);
	};

	return (
		<div className="auth-page">
			<div className="auth-box">
				<div className="auth-logo" onClick={onBack}>
					🥾
				</div>
				<h2 className="auth-title">TrailBuddy</h2>
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
				{tab === "register" && (
					<input
						placeholder="Email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				)}
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
					{tab === "login" ? "Login" : "Create Account"}
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
			<img
				src={route.image_url}
				alt={route.name}
				className="detail-img"
			/>
			<div className="detail-content">
				<div className="back-btn" onClick={onBack}>
					← Back
				</div>
				<h1 className="detail-title">{route.name}</h1>
				<p className="detail-location">📍 {route.location}</p>
				<span
					className={`badge badge-${route.difficulty.toLowerCase()}`}
				>
					{route.difficulty}
				</span>

				<div className="detail-stats">
					<div className="stat-item">
						<span className="stat-label">Distance</span>
						<span className="stat-value">{route.distance} km</span>
					</div>
					<div className="stat-item">
						<span className="stat-label">Duration</span>
						<span className="stat-value">{route.duration}</span>
					</div>
					<div className="stat-item">
						<span className="stat-label">Elevation</span>
						<span className="stat-value">{route.elevation} m</span>
					</div>
				</div>

				<p
					style={{
						lineHeight: "1.6",
						margin: "1rem 0",
						color: "#4b5563",
					}}
				>
					{route.description}
				</p>

				{weather && (
					<div className="weather-card">
						<span className="weather-icon">
							{getWeatherIcon(weather.weathercode)}
						</span>
						<div>
							<div className="weather-temp">
								{Math.round(weather.temperature_2m)}°C
							</div>
							<p style={{ fontSize: "0.9rem", color: "#374151" }}>
								Wind: {weather.windspeed_10m} km/h
							</p>
						</div>
					</div>
				)}

				<div className="map-container" id="route-map" style={{ position: "relative", zIndex: 10 }}></div>

				<div
					style={{
						background: "white",
						padding: "1.5rem",
						borderRadius: "12px",
						border: "1px solid #e5e7eb",
						marginTop: "1rem",
					}}
				>
					<h3 style={{ marginBottom: "1rem", fontWeight: "700" }}>
						Plan Your Hike
					</h3>
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
						style={{ width: "100%", marginTop: "0.5rem" }}
					>
						Save to My Plans
					</button>
				</div>
			</div>
		</div>
	);
}

function Cart({ cart, open, onClose, onCheckout, onRemove }) {
	const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
	return (
		<div className={`cart-panel ${open ? "open" : ""}`}>
			<div className="cart-header">
				<h2 style={{ fontWeight: "700", fontSize: "1.25rem" }}>
					Shopping Cart
				</h2>
				<button
					onClick={onClose}
					style={{
						background: "none",
						border: "none",
						fontSize: "2rem",
						cursor: "pointer",
						color: "#6b7280",
					}}
				>
					×
				</button>
			</div>
			<div className="cart-items">
				{cart.length === 0 ? (
					<div className="empty-state">Cart is empty</div>
				) : (
					<>
						{cart.map((item) => (
							<div key={item.id} className="cart-item">
								<img
									src={item.image_url}
									alt={item.title}
									className="cart-item-img"
								/>
								<div style={{ flex: 1 }}>
									<p
										style={{
											fontWeight: "600",
											marginBottom: "0.25rem",
										}}
									>
										{item.title}
									</p>
									<p
										style={{
											color: "#6b7280",
											fontSize: "0.9rem",
											marginBottom: "0.5rem",
										}}
									>
										Qty: {item.qty}
									</p>
									<p
										style={{
											fontWeight: "700",
											color: "#428a13",
										}}
									>
										${(item.price * item.qty).toFixed(2)}
									</p>
								</div>
								<button
									onClick={() => onRemove(item.id)}
									style={{
										background: "none",
										border: "none",
										fontSize: "1.5rem",
										cursor: "pointer",
										color: "#dc2626",
									}}
								>
									×
								</button>
							</div>
						))}
					</>
				)}
			</div>
			{cart.length > 0 && (
				<div className="cart-footer">
					<div
						style={{
							fontSize: "1.5rem",
							fontWeight: "700",
							marginBottom: "1rem",
						}}
					>
						Total: ${total.toFixed(2)}
					</div>
					<button
						className="btn btn-primary"
						onClick={onCheckout}
						style={{
							width: "100%",
							padding: "1rem",
							fontSize: "1rem",
						}}
					>
						Checkout
					</button>
				</div>
			)}
		</div>
	);
}

function AdminDashboard({ token, products, setProducts }) {
	const [stats, setStats] = useState(null);
	const [users, setUsers] = useState([]);
	const [salesData, setSalesData] = useState([]);
	const [orders, setOrders] = useState([]);
	const [tab, setTab] = useState("stats");

	useEffect(() => {
		axios
			.get(`${API}/admin/stats`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			.then((r) => setStats(r.data));
		axios
			.get(`${API}/admin/users`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			.then((r) => setUsers(r.data));
		axios
			.get(`${API}/admin/products/sales`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			.then((r) => setSalesData(r.data));
		axios
			.get(`${API}/admin/orders`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			.then((r) => setOrders(r.data));
	}, [token]);

	const updateUser = async (id, role, status) => {
		await axios.put(
			`${API}/admin/users/${id}`,
			{ role, status },
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		const { data } = await axios.get(`${API}/admin/users`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setUsers(data);
	};

	const deleteUser = async (id) => {
		if (!confirm("Delete this user?")) return;
		await axios.delete(`${API}/admin/users/${id}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const { data } = await axios.get(`${API}/admin/users`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setUsers(data);
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

	return (
		<div className="admin-panel">
			<h1
				style={{
					fontSize: "1.75rem",
					fontWeight: "700",
					marginBottom: "1.5rem",
				}}
			>
				Admin Dashboard
			</h1>

			<div className="admin-tabs">
				<button
					className={`admin-tab ${tab === "stats" ? "active" : ""}`}
					onClick={() => setTab("stats")}
				>
					Stats
				</button>
				<button
					className={`admin-tab ${tab === "users" ? "active" : ""}`}
					onClick={() => setTab("users")}
				>
					Users
				</button>
				<button
					className={`admin-tab ${tab === "stock" ? "active" : ""}`}
					onClick={() => setTab("stock")}
				>
					Stock
				</button>
				<button
					className={`admin-tab ${tab === "sales" ? "active" : ""}`}
					onClick={() => setTab("sales")}
				>
					Sales
				</button>
				<button
					className={`admin-tab ${tab === "orders" ? "active" : ""}`}
					onClick={() => setTab("orders")}
				>
					Orders
				</button>
			</div>

			{tab === "stats" && stats && (
				<div className="stats-grid">
					<div className="stat-card">
						<div className="stat-card-value">{stats.users}</div>
						<div className="stat-card-label">Total Users</div>
					</div>
					<div className="stat-card">
						<div className="stat-card-value">{stats.plans}</div>
						<div className="stat-card-label">Hike Plans</div>
					</div>
					<div className="stat-card">
						<div className="stat-card-value">{stats.orders}</div>
						<div className="stat-card-label">Total Orders</div>
					</div>
					<div className="stat-card">
						<div className="stat-card-value">
							${parseFloat(stats.revenue || 0).toFixed(2)}
						</div>
						<div className="stat-card-label">Revenue</div>
					</div>
					<div className="stat-card">
						<div className="stat-card-value">{stats.totalSold}</div>
						<div className="stat-card-label">Items Sold</div>
					</div>
				</div>
			)}

			{tab === "users" && (
				<div className="table-container">
					<table className="table">
						<thead>
							<tr>
								<th>ID</th>
								<th>Username</th>
								<th>Role</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{users.map((u) => (
								<tr key={u.id}>
									<td>{u.id}</td>
									<td>{u.username}</td>
									<td>
										<select
											value={u.role}
											onChange={(e) =>
												updateUser(
													u.id,
													e.target.value,
													u.status,
												)
											}
											style={{
												padding: "0.25rem",
												fontSize: "0.85rem",
											}}
										>
											<option value="user">User</option>
											<option value="admin">Admin</option>
										</select>
									</td>
									<td>
										<select
											value={u.status}
											onChange={(e) =>
												updateUser(
													u.id,
													u.role,
													e.target.value,
												)
											}
											style={{
												padding: "0.25rem",
												fontSize: "0.85rem",
											}}
										>
											<option value="active">
												Active
											</option>
											<option value="disabled">
												Disabled
											</option>
										</select>
									</td>
									<td>
										<button
											className="btn btn-danger"
											style={{
												fontSize: "0.75rem",
												padding: "0.25rem 0.5rem",
											}}
											onClick={() => deleteUser(u.id)}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{tab === "stock" && (
				<div className="table-container">
					<table className="table">
						<thead>
							<tr>
								<th>Product</th>
								<th>Price</th>
								<th>Stock</th>
								<th>Update Stock</th>
							</tr>
						</thead>
						<tbody>
							{products.map((p) => (
								<tr key={p.id}>
									<td>{p.title}</td>
									<td>${p.price}</td>
									<td>{p.qty}</td>
									<td>
										<input
											type="number"
											defaultValue={p.qty}
											onBlur={(e) =>
												updateStock(
													p.id,
													parseInt(e.target.value),
												)
											}
											style={{
												width: "80px",
												padding: "0.25rem",
												fontSize: "0.85rem",
											}}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{tab === "sales" && (
				<div className="table-container">
					<table className="table">
						<thead>
							<tr>
								<th>Product</th>
								<th>Price</th>
								<th>Sold</th>
								<th>Revenue</th>
							</tr>
						</thead>
						<tbody>
							{salesData.map((p) => (
								<tr key={p.id}>
									<td>{p.title}</td>
									<td>${parseFloat(p.price).toFixed(2)}</td>
									<td>{p.sold}</td>
									<td>
										${parseFloat(p.revenue || 0).toFixed(2)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{tab === "orders" && (
				<div className="table-container">
					<table className="table">
						<thead>
							<tr>
								<th>ID</th>
								<th>User</th>
								<th>Total</th>
								<th>Status</th>
								<th>Date</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((o) => (
								<tr key={o.id}>
									<td>#{o.id}</td>
									<td>{o.username}</td>
									<td>${parseFloat(o.total).toFixed(2)}</td>
									<td>
										<span
											style={{
												fontSize: "0.75rem",
												padding: "0.25rem 0.5rem",
												background: "#f3f4f6",
												borderRadius: "8px",
											}}
										>
											{o.status}
										</span>
									</td>
									<td>
										{new Date(
											o.created_at,
										).toLocaleDateString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

export default App;
