import BidList from "./BidList";

function ListingCard({
    listing,
    activeUser,
    bidAmount,
    setBidAmount,
    onPlaceBid,
    onClose,
    formatTimeRemaining
    }) {
    return (
        <div
        style={{
            border: "1px solid black",
            margin: "10px",
            padding: "10px"
        }}
        >
        <h2>{listing.title}</h2>

        <p>Current Price: ${listing.currentPrice}</p>
        <p>Status: {listing.status}</p>

        {listing.seller && <p>Seller: {listing.seller}</p>}
        {listing.winner && <p>Winner: {listing.winner}</p>}

        {listing.createdAt && (
            <p>
            Created: {new Date(listing.createdAt).toLocaleString()}
            </p>
        )}

        {listing.endsAt && (
            <>
            <p>Ends: {new Date(listing.endsAt).toLocaleString()}</p>
            <p>
                Time Remaining:{" "}
                {formatTimeRemaining(listing.endsAt)}
            </p>
            </>
        )}

        {listing.status === "open" && (
            <div style={{ marginTop: "10px" }}>
            <input
                type="number"
                placeholder="Bid amount"
                value={bidAmount ?? ""}
                onChange={(e) => setBidAmount(e.target.value)}
            />

            <button
                style={{ marginLeft: "8px" }}
                onClick={onPlaceBid}
                disabled={!activeUser}
            >
                Place Bid
            </button>

            <button
                style={{ marginLeft: "8px" }}
                onClick={onClose}
            >
                Close Auction
            </button>
            </div>
        )}

        {/* Bids list */}
        <BidList bids={listing.bids} />
        </div>
    );
}

export default ListingCard;