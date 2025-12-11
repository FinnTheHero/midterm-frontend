const DEFAULT_PRODUCTS = [
  {id: 'p1', title: 'Trekking Poles', price: 19.99, qty: 10, img: 'images/product1.png'},
  {id: 'p2', title: 'Water Bottle', price: 9.50, qty: 25, img: 'images/product2.png'},
  {id: 'p3', title: 'Backpack 20L', price: 29.99, qty: 8, img: 'images/product3.png'}
];
const ADMIN_PASSWORD = 'admin123';
const $ = id => document.getElementById(id);
function load(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch(e){ return fallback; } }
function save(key,val){ localStorage.setItem(key, JSON.stringify(val)); }
let hikes = load('hikes', []);
let products = load('products', DEFAULT_PRODUCTS.slice());
let cart = load('cart', []);
let adminLogged = false;
function escapeHtml(s){ if(!s) return ''; return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function getRandomColor(){ const colors = ['#2b8aef','#f97316','#10b981','#eab308','#8b5cf6','#ec4899']; return colors[Math.floor(Math.random()*colors.length)]; }

function renderPlans(filter=''){
  const el = $('plansList'); el.innerHTML='';
  const list = filter ? hikes.filter(h=>h.difficulty===filter) : hikes;
  if(list.length===0){ el.innerHTML = '<div class="muted">No plans yet</div>'; return; }
  list.forEach((h, idx)=>{
    const item = document.createElement('div'); item.className='item';
    item.innerHTML = `<div>
      <strong>${escapeHtml(h.name)}</strong>
      <div class="muted ${h.difficulty.toLowerCase()}">${escapeHtml(h.location)} • ${h.difficulty}</div>
      <div class="muted">${escapeHtml(h.notes)}</div>
    </div>
    <div class="controls">
      <button type="button" onclick="editPlan(${idx})" class="small">Edit</button>
      <button type="button" onclick="deletePlan(${idx})" class="small delete-btn">Delete</button>
      <button type="button" onclick="showMap('${escapeHtml(h.location)}')" class="small">View on Map</button>
    </div>`;
    el.appendChild(item);
  });
}

function renderProducts(list = products){
  const el = $('productsList'); el.innerHTML='';
  if(list.length===0){ el.innerHTML='<div class="muted">No products found</div>'; return; }
  let madeChange = false;
  list.forEach(p=>{
    if(!p.color){ p.color = getRandomColor(); madeChange = true; }
    const item = document.createElement('div'); item.className='item';
    item.style.borderTop = `4px solid ${p.color}`;
    const imgHtml = p.img ? `<img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.title)}" class="product-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
    const placeholder = `<div class="product-media" style="background:${p.color};">${escapeHtml(p.title.split(' ')[0] || p.title)}</div>`;
    item.innerHTML = `<div class="product">
      ${imgHtml}
      ${placeholder}
      <div style="text-align:center;">
        <strong>${escapeHtml(p.title)}</strong>
        <div class="muted">$${Number(p.price).toFixed(2)} • ${p.qty} left</div>
      </div>
    </div>
    <div class="controls">
      <button type="button" onclick="addToCart('${p.id}')" ${p.qty<=0?'disabled':''} class="small">Add</button>
      ${adminLogged ? `<button type="button" onclick="editProduct('${p.id}')" class="small">Edit</button>` : `<button type="button" class="small" disabled>Edit</button>`}
      ${adminLogged ? `<button type="button" class="small delete-btn" onclick="deleteProduct('${p.id}')">Delete</button>` : ''}
    </div>`;
    el.appendChild(item);
  });
  if(madeChange) save('products', products);
}

function renderCart(){
  const el = $('cartList'); el.innerHTML='';
  if(cart.length===0){ el.innerHTML='<div class="muted">Cart is empty</div>'; return; }
  let total = 0;
  cart.forEach((c, idx)=>{
    total += c.price * c.qty;
    const item = document.createElement('div'); item.className='item';
    item.innerHTML = `<div>
      <strong>${escapeHtml(c.title)}</strong>
      <div class="muted">$${Number(c.price).toFixed(2)} × ${c.qty}</div>
    </div>
    <div class="controls">
      <button type="button" onclick="changeCartQty(${idx}, -1)" class="small">-</button>
      <button type="button" onclick="changeCartQty(${idx}, 1)" class="small">+</button>
      <button type="button" onclick="removeCartItem(${idx})" class="small delete-btn">Remove</button>
    </div>`;
    el.appendChild(item);
  });
  const totalEl = document.createElement('div');
  totalEl.style.marginTop = '8px';
  totalEl.style.fontWeight = 'bold';
  totalEl.textContent = `Total: $${total.toFixed(2)}`;
  el.appendChild(totalEl);
}

$('hikeForm').addEventListener('submit', e=>{
  e.preventDefault();
  const name = $('hikeName').value.trim();
  if(!name) return alert('Name required');
  hikes.push({name, location: $('hikeLocation').value.trim(), difficulty: $('hikeDifficulty').value, notes: $('hikeNotes').value.trim()});
  save('hikes', hikes); renderPlans(); $('hikeForm').reset();
});

window.deletePlan = function(idx){ if(!confirm('Delete plan?')) return; hikes.splice(idx,1); save('hikes',hikes); renderPlans(); }
window.editPlan = function(idx){ const h = hikes[idx]; $('hikeName').value=h.name; $('hikeLocation').value=h.location; $('hikeDifficulty').value=h.difficulty; $('hikeNotes').value=h.notes; hikes.splice(idx,1); save('hikes',hikes); renderPlans(); }
$('clearPlans').addEventListener('click', ()=>{ if(confirm('Clear all plans?')){ hikes=[]; save('hikes',hikes); renderPlans(); } });

window.addToCart = function(productId){
  const product = products.find(p=>p.id===productId); if(!product||product.qty<=0){ alert('Out of stock'); return; }
  const inCart = cart.find(c=>c.id===productId);
  if(inCart){ inCart.qty += 1; } else { cart.push({id:product.id, title:product.title, price:product.price, qty:1}); }
  save('cart',cart); renderCart();
}

window.changeCartQty = function(idx, delta){ const item=cart[idx]; if(!item) return; item.qty += delta; if(item.qty<=0) cart.splice(idx,1); save('cart',cart); renderCart(); }
window.removeCartItem = function(idx){ cart.splice(idx,1); save('cart',cart); renderCart(); }

$('checkoutBtn').addEventListener('click', ()=>{
  if(cart.length===0) return alert('Cart empty');
  for(const c of cart){ const p = products.find(x=>x.id===c.id); if(!p || p.qty < c.qty) return alert('Not enough inventory for ' + (p? p.title : c.title)); }
  if(!confirm('Proceed to checkout?')) return;
  for(const c of cart){ const p = products.find(x=>x.id===c.id); p.qty -= c.qty; if(p.qty<0) p.qty=0; }
  cart = []; save('products',products); save('cart',cart); renderProducts(); renderCart(); alert('Purchase complete — inventory updated');
});

$('emptyCart').addEventListener('click', ()=>{ if(confirm('Empty cart?')){ cart=[]; save('cart',cart); renderCart(); } });

$('adminLogin').addEventListener('click', ()=>{ const pass = $('adminPass').value; if(pass === ADMIN_PASSWORD){ adminLogged = true; $('adminPanel').style.display='block'; $('adminMsg').textContent='Logged in'; renderProducts(); } else{ $('adminMsg').textContent='Wrong password'; } });
$('adminLogout').addEventListener('click', ()=>{ adminLogged=false; $('adminPanel').style.display='none'; $('adminMsg').textContent=''; renderProducts(); });

$('addProduct').addEventListener('click', ()=>{
  if(!adminLogged) return alert('Admin only');
  const title = $('prodTitle').value.trim();
  const price = parseFloat($('prodPrice').value)||0;
  const qty = parseInt($('prodQty').value)||0;
  const img = $('prodImg').value.trim();
  if(!title) return alert('Enter product title');
  let p = products.find(x=>x.title.toLowerCase()===title.toLowerCase());
  if(p){ p.price = price; p.qty = qty; p.img = img || p.img; $('adminMsg').textContent='Product updated'; }
  else{ p = {id: 'p'+Date.now(), title, price, qty, img: img || 'images/product1.png', color:getRandomColor()}; products.push(p); $('adminMsg').textContent='Product added'; }
  save('products',products); renderProducts(); $('prodTitle').value=''; $('prodPrice').value=''; $('prodQty').value=''; $('prodImg').value='';
});

$('resetProducts').addEventListener('click', ()=>{ if(!confirm('Reset to default products?')) return; products = DEFAULT_PRODUCTS.map(p=>Object.assign({},p)); save('products',products); renderProducts(); $('adminMsg').textContent='Reset done'; });

window.deleteProduct = function(productId){ if(!adminLogged) return; if(!confirm('Delete this product?')) return; products = products.filter(p=>p.id!==productId); save('products',products); renderProducts(); }

window.editProduct = function(productId){ if(!adminLogged) return; const p = products.find(x=>x.id===productId); if(!p) return; $('prodTitle').value = p.title; $('prodPrice').value = p.price; $('prodQty').value = p.qty; $('prodImg').value = p.img || ''; }

$('filterDifficulty').addEventListener('change', e=>{ renderPlans(e.target.value); });

$('searchProducts').addEventListener('input', e=>{ const term = e.target.value.toLowerCase(); renderProducts(products.filter(p=>p.title.toLowerCase().includes(term))); });

window.showMap = function(location){
  const container = $('mapContainer'); const mapDiv = $('map'); container.style.display = 'block'; mapDiv.innerHTML = '';
  if(!location){ alert('No location provided'); return; }
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
    .then(res=>res.json())
    .then(data=>{ if(!data || !data[0]) return alert('Location not found'); const lat = parseFloat(data[0].lat); const lon = parseFloat(data[0].lon); const map = L.map('map').setView([lat, lon], 13); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'&copy; OpenStreetMap contributors'}).addTo(map); L.marker([lat, lon]).addTo(map).bindPopup(location).openPopup(); }).catch(err=>alert('Map error'));
}

$('closeMapBtn').addEventListener('click', ()=>{$('mapContainer').style.display='none';});

renderPlans(); renderProducts(); renderCart();
window._app = {hikes, products, cart};
