export function HikeList({ hikes, onEdit, onDelete, onViewMap }) {
    if (!hikes || hikes.length === 0)
        return <div className="muted">No plans yet</div>;
    return (
        <>
            {hikes.map((h, idx) => (
                <div key={idx} className="item" style={{ margin: "15px 0px" }}>
                    <div>
                        <strong>{h.name}</strong>
                        <div
                            className={`muted ${h.difficulty ? h.difficulty.toLowerCase() : ""}`}
                        >
                            {h.location} • {h.difficulty}
                        </div>
                        <div className="muted">{h.notes}</div>
                    </div>
                    <div
                        className="controls"
                        style={{ margin: "5px 0px", padding: "5px" }}
                    >
                        <button
                            onClick={() => onEdit(idx)}
                            className="small"
                            style={{ margin: "5px 0px", padding: "5px" }}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(idx)}
                            className="small delete-btn"
                            style={{ margin: "5px 0px", padding: "5px" }}
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => onViewMap(h.location)}
                            className="small"
                            style={{ margin: "5px 0px", padding: "5px" }}
                        >
                            View on Map
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
}
