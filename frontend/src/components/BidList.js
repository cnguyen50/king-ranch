function BidList({ bids }) {
    if (!bids || bids.length === 0) {
        return <p>No bids yet</p>;
    }

    const getBidderLabel = (bid) => {
        if (!bid) return "Unknown";
        if (bid.bidder) return bid.bidder.displayName || bid.bidder.email || bid.bidder.username || bid.bidder.userId;
        if (bid.user) return bid.user;
        return "Unknown";
    };

    return (
        <div>
        <h4>Bids:</h4>
        <ul>
            {bids.map((bid, index) => (
            <li key={index}>
                {getBidderLabel(bid)}: ${bid.amount}
            </li>
            ))}
        </ul>
        </div>
    );
}

export default BidList;