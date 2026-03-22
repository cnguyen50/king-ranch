function BidList({ bids }) {
    if (!bids || bids.length === 0) {
        return <p>No bids yet</p>;
    }

    return (
        <div>
        <h4>Bids:</h4>
        <ul>
            {bids.map((bid, index) => (
            <li key={index}>
                {bid.user}: ${bid.amount}
            </li>
            ))}
        </ul>
        </div>
    );
}

export default BidList;