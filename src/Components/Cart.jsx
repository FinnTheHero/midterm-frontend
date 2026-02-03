export function Cart({ cart, changeQty, removeItem, onCheckout, onEmpty }) {
  if (cart.length === 0) {
    return <div className="muted">Cart is empty</div>;
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <>
      {cart.map((item, idx) => (
        <div key={idx} className="cart-item">
          <strong>{item.title}</strong>
          <div>${(item.price * item.qty).toFixed(2)}</div>
          <div className="row">
            <button onClick={() => changeQty(idx, -1)}>-</button>
            <span>{item.qty}</span>
            <button onClick={() => changeQty(idx, 1)}>+</button>
            <button onClick={() => removeItem(idx)}>✕</button>
          </div>
        </div>
      ))}

      <hr />
      <div><strong>Total:</strong> ${total.toFixed(2)}</div>

      <button className="small" onClick={onCheckout}>Checkout</button>
      <button className="small danger" onClick={onEmpty}>Empty Cart</button>
    </>
  );
}
