const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

const DATA_PATH = "./src/data/listings.json";

// Read data
function getListings() {
    const data = fs.readFileSync(DATA_PATH);
    return JSON.parse(data);
}

// Save data
function saveListings(listings) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(listings, null, 2));
}

// Get all listings
app.get("/listings", (req, res) => {
    const listings = getListings();
    res.json(listings);
});

// Create listing
app.post("/listings", (req, res) => {
    const listings = getListings();

    const newListing = {
        id: listings.length + 1,
        title: req.body.title,
        startingPrice: req.body.price,
        currentPrice: req.body.price,
        status: "open",
        bids: [],
        winner: null
    };

    listings.push(newListing);
    saveListings(listings);

    res.json(newListing);
});

// Place Bid
app.post("/listings/:id/bid", (req, res) => {
    const listings = getListings();
    const listing = listings.find(l => l.id == req.params.id);

    const { user, amount } = req.body;

    if (!listing || listing.status !== "open") {
        return res.status(400).json({ error: "Invalid listing" });
    }

    if (amount <= listing.currentPrice) {
        return res.status(400).json({ error: "Bid too low" });
    }

    listing.currentPrice = amount;
    listing.bids.push({ user, amount });

    saveListings(listings);

    res.json(listing);
});

// Close auction
app.post("/listings/:id/close", (req, res) => {
    const listings = getListings();
    const listing = listings.find(l => l.id == req.params.id);

    if (!listing) return res.status(404).json({ error: "Not found" });

    listing.status = "closed";

    if (listing.bids.length > 0) {
        const highest = listing.bids.reduce((max, bid) =>
        bid.amount > max.amount ? bid : max
        );
        listing.winner = highest.user;
    }

    saveListings(listings);

    res.json(listing);
});

// Start server
app.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
});