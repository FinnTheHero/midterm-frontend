export function HikeList({
  hikes,
  onEdit,
  onDelete,
  onViewMap,
  favorites,
  onToggleFavorite
}) {
  if (hikes.length === 0) {
    return <div className="muted">No hikes planned</div>;
  }

  return (
    <>
      {hikes.map((hike, idx) => (
        <div key={hike.id} className="plan-item">
          <strong>{hike.name}</strong>

          <div className="muted">
            {hike.location || "No location"}
          </div>

          <div className="tag">{hike.difficulty}</div>

          {hike.notes && <p>{hike.notes}</p>}

          <div className="row">
            <button
              className="small"
              onClick={() => onEdit(idx)}
            >
              Edit
            </button>

            <button
              className="small danger"
              onClick={() => onDelete(idx)}
            >
              Delete
            </button>

            <button
              className="small"
              onClick={() => onToggleFavorite(hike.id)}
            >
              {favorites.includes(hike.id)
                ? "⭐ Favorited"
                : "☆ Favorite"}
            </button>

            {hike.location && (
              <button
                className="small"
                onClick={() =>
                  onViewMap(hike.location, hike.difficulty)
                }
              >
                Map
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
