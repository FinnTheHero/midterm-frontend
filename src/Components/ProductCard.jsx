export function ProductCard({ product, onAdd, adminLogged, onEdit, onDelete }) {
  return (
    <div className="product-card">
      {product.img && <img src={product.img} alt={product.title} />}
      <h4>{product.title}</h4>
      <div className="muted">${product.price.toFixed(2)}</div>
      <div className="muted">Stock: {product.qty}</div>

      <div className="row">
        <button className="small" onClick={() => onAdd(product.id)}>
          Add to Cart
        </button>

        {adminLogged && (
          <>
            <button className="small" onClick={() => onEdit(product.id)}>Edit</button>
            <button className="small danger" onClick={() => onDelete(product.id)}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}
