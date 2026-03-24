const cors = require("cors");
const express = require("express");
const fs = require("fs");
const app = express();

app.use(cors())
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const LISTINGS_PATH = "./src/data/listings.json";
const BIDS_PATH = "./src/data/bids.json";
const USERS_PATH = "./src/data/users.json";

function readJson(path, fallbackValue) {
    try {
        const data = fs.readFileSync(path);
        return JSON.parse(data);
    } catch (err) {
        if (err && err.code === "ENOENT") return fallbackValue;
        throw err;
    }
}

function writeJson(path, value) {
    fs.writeFileSync(path, JSON.stringify(value, null, 2));
}

function getListings() {
    return readJson(LISTINGS_PATH, []);
}

function saveListings(listings) {
    writeJson(LISTINGS_PATH, listings);
}

function getBids() {
    return readJson(BIDS_PATH, []);
}

function saveBids(bids) {
    writeJson(BIDS_PATH, bids);
}

function getUsers() {
    return readJson(USERS_PATH, []);
}

function saveUsers(users) {
    writeJson(USERS_PATH, users);
}

function toIsoString(value) {
    return new Date(value).toISOString();
}

function ensureListingTimeFields(listing) {
    if (!listing.createdAt) listing.createdAt = toIsoString(Date.now());
    if (!listing.endsAt) {
        const createdAtMs = Date.parse(listing.createdAt);
        listing.endsAt = toIsoString(createdAtMs + 24 * 60 * 60 * 1000);
    }
    return listing;
}

function getListingBids(listingId, bids) {
    return bids
        .filter((b) => b.listingId === listingId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function getHighestBid(listingId, bids) {
    const listingBids = getListingBids(listingId, bids);
    if (listingBids.length === 0) return null;
    return listingBids.reduce((max, bid) => (bid.amount > max.amount ? bid : max));
}

function closeListing(listing, bids) {
    listing.status = "closed";
    const highest = getHighestBid(listing.id, bids);
    listing.winner = highest ? highest.user : null;
    return listing;
}

function refreshExpiredListings(listings, bids) {
    const now = Date.now();
    let changed = false;

    for (const listing of listings) {
        ensureListingTimeFields(listing);
        const endsAtMs = Date.parse(listing.endsAt);

        if (listing.status === "open" && Number.isFinite(endsAtMs) && now >= endsAtMs) {
            closeListing(listing, bids);
            changed = true;
        }
    }

    if (changed) saveListings(listings);
    return listings;
}

function withBids(listing, bids) {
    return {
        ...listing,
        bids: getListingBids(listing.id, bids)
    };
}

function getNextId(items) {
    const maxId = items.reduce((max, item) => (item.id > max ? item.id : max), 0);
    return maxId + 1;
}

function findUserIdentifier(user, users) {
    if (user === undefined || user === null || user === "") return null;

    if (typeof user === "number") {
        const found = users.find((u) => u.id === user);
        return found ? found.username : null;
    }

    if (typeof user === "string") {
        const trimmed = user.trim();
        if (!trimmed) return null;

        const asNumber = Number(trimmed);
        if (Number.isFinite(asNumber)) {
            const found = users.find((u) => u.id === asNumber);
            if (found) return found.username;
        }

        const foundByUsername = users.find((u) => u.username === trimmed);
        return foundByUsername ? foundByUsername.username : null;
    }

    return null;
}

// Users
app.get("/users", (req, res) => {
    const users = getUsers();
    res.json(users);
});

app.post("/users", (req, res) => {
    const users = getUsers();
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";

    if (!username) {
        return res.status(400).json({ error: "username is required" });
    }

    if (users.some((u) => u.username === username)) {
        return res.status(400).json({ error: "username already exists" });
    }

    const newUser = { id: getNextId(users), username };
    users.push(newUser);
    saveUsers(users);
    res.json(newUser);
});

// Get all listings
app.get("/listings", (req, res) => {
    const bids = getBids();
    const listings = refreshExpiredListings(getListings(), bids);
    res.json(listings.map((l) => withBids(l, bids)));
});

// Create listing
app.post("/listings", (req, res) => {
    const listings = getListings();
    const bids = getBids();
    refreshExpiredListings(listings, bids);

    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const price = Number(req.body.price);

    if (!title) return res.status(400).json({ error: "title is required" });
    if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ error: "price must be a positive number" });
    }

    const now = Date.now();
    const createdAt = toIsoString(now);
    const endsAt = toIsoString(now + 24 * 60 * 60 * 1000);

    const users = getUsers();
    const seller = findUserIdentifier(req.body.user ?? req.body.userId ?? req.body.seller, users);

    const newListing = {
        id: getNextId(listings),
        title,
        startingPrice: price,
        currentPrice: price,
        status: "open",
        createdAt,
        endsAt,
        seller,
        winner: null,
        image: req.body.image || null
    };

    listings.push(newListing);
    saveListings(listings);
    res.json(withBids(newListing, bids));
});

// Place Bid
app.post("/listings/:id/bid", (req, res) => {
    const listings = getListings();
    const bids = getBids();
    refreshExpiredListings(listings, bids);

    const listingId = Number(req.params.id);
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return res.status(404).json({ error: "Not found" });

    ensureListingTimeFields(listing);

    const now = Date.now();
    if (listing.status !== "open") {
        return res.status(400).json({ error: "Invalid listing" });
    }
    if (now >= Date.parse(listing.endsAt)) {
        closeListing(listing, bids);
        saveListings(listings);
        return res.status(400).json({ error: "Auction ended" });
    }

    const users = getUsers();
    const user = findUserIdentifier(req.body.user ?? req.body.userId, users);
    const amount = Number(req.body.amount);

    if (!user) return res.status(400).json({ error: "Invalid user" });
    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }
    if (amount <= listing.currentPrice) {
        return res.status(400).json({ error: "Bid too low" });
    }

    const newBid = {
        id: getNextId(bids),
        listingId: listing.id,
        user,
        amount,
        createdAt: toIsoString(now)
    };

    bids.push(newBid);
    saveBids(bids);

    listing.currentPrice = amount;
    saveListings(listings);

    res.json(withBids(listing, bids));
});

// Close auction
app.post("/listings/:id/close", (req, res) => {
    const listings = getListings();
    const bids = getBids();
    refreshExpiredListings(listings, bids);

    const listingId = Number(req.params.id);
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return res.status(404).json({ error: "Not found" });

    closeListing(listing, bids);
    saveListings(listings);
    res.json(withBids(listing, bids));
});

// Start server
app.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
});