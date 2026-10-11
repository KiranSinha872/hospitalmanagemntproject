const AvailabilityBadge = ({ availability }) => {
    const { total = 0, available = 0, label = "Unavailable" } = availability || {};

    let modifier = "catalog-badge--unavailable";
    if (label === "Available") {
        modifier = "catalog-badge--available";
    } else if (label === "All copies out") {
        modifier = "catalog-badge--out";
    }

    return (
        <span
            className={`catalog-badge ${modifier}`}
            aria-label={`Status: ${label}, ${available} of ${total} copies available`}
        >
            <span className="catalog-badge__label">{label}</span>
            <span className="catalog-badge__detail">
                {label === "Unavailable" ? `(${total} copies)` : `(${available}/${total} available)`}
            </span>
        </span>
    );
};

export default AvailabilityBadge;
