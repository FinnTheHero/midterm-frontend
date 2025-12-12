export function ProductCard({ product, onAdd, adminLogged, onEdit, onDelete }) {
    const color = product.color || "#ccc";
    return (
        <div className="item" style={{ borderTop: `4px solid ${color}` }}>
            <div className="product">
                {product.img ? (
                    <img
                        src={product.img}
                        alt={product.title}
                        className="product-img"
                        onError={(ev) => {
                            // hide broken images gracefully
                            ev.currentTarget.style.display = "none";
                        }}
                    />
                ) : (
                    <div
                        className="product-media"
                        // style={{ background: color }}
                    >
                        {(product.title || "").split(" ")[0]}
                    </div>
                )}

                <div style={{ textAlign: "center" }}>
                    <strong>{product.title}</strong>
                    <div className="muted">
                        ${Number(product.price).toFixed(2)} • {product.qty} left
                    </div>
                </div>
            </div>

            <button
                onClick={() => onAdd(product.id)}
                disabled={product.qty <= 0}
                className="small"
                style={{ margin: "5px 0px", padding: "5px" }}
            >
                Add
            </button>
            {adminLogged && (
                <>
                    <button
                        onClick={() => onEdit(product.id)}
                        className="small"
                        style={{ margin: "5px 0px", padding: "5px" }}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(product.id)}
                        className="small delete-btn"
                        style={{ margin: "5px 0px", padding: "5px" }}
                    >
                        Delete
                    </button>
                </>
            )}
        </div>
    );
}
