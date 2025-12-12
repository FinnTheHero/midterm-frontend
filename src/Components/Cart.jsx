export function Cart({ cart, changeQty, removeItem, onCheckout, onEmpty }) {
    const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    return (
        <div>
            {cart.length === 0 ? (
                <div className="muted">Cart is empty</div>
            ) : (
                <>
                    {cart.map((c, idx) => (
                        <div key={c.id + "-" + idx} className="item">
                            <div>
                                <strong>{c.title}</strong>
                                <div className="muted">
                                    ${Number(c.price).toFixed(2)} × {c.qty}
                                </div>
                            </div>
                            <div
                                className="controls"
                                style={{ margin: "5px 0px", padding: "5px" }}
                            >
                                <button
                                    onClick={() => changeQty(idx, -1)}
                                    className="small"
                                    style={{
                                        margin: "5px 0px",
                                        padding: "5px",
                                    }}
                                >
                                    -
                                </button>
                                <button
                                    onClick={() => changeQty(idx, 1)}
                                    className="small"
                                    style={{
                                        margin: "5px 0px",
                                        padding: "5px",
                                    }}
                                >
                                    +
                                </button>
                                <button
                                    onClick={() => removeItem(idx)}
                                    className="small delete-btn"
                                    style={{
                                        margin: "5px 0px",
                                        padding: "5px",
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}

                    <div style={{ marginTop: "8px", fontWeight: "bold" }}>
                        Total: ${total.toFixed(2)}
                    </div>
                </>
            )}

            <div style={{ marginTop: "8px" }} className="row">
                <button id="checkoutBtn" className="small" onClick={onCheckout}>
                    Checkout
                </button>
                <button
                    id="emptyCart"
                    type="button"
                    className="small delete-btn"
                    onClick={onEmpty}
                >
                    Empty
                </button>
            </div>
        </div>
    );
}
