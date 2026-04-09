const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const cors = require("cors");
const express = require("express");
const session = require("express-session");
const { Issuer, generators } = require("openid-client");
const crypto = require("crypto");
const fs = require("fs");
const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || FRONTEND_URL)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: CORS_ORIGINS,
        credentials: true
    })
);

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET env var is required");
}

const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: COOKIE_SECURE
        }
    })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const COGNITO_ISSUER = process.env.COGNITO_ISSUER;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
const AUTH_CALLBACK_URL = process.env.AUTH_CALLBACK_URL || "http://localhost:3001/auth/callback";
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;

if (!COGNITO_ISSUER || !COGNITO_CLIENT_ID || !COGNITO_CLIENT_SECRET || !COGNITO_DOMAIN) {
    throw new Error(
        "Missing required Cognito env vars: COGNITO_ISSUER, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET, COGNITO_DOMAIN"
    );
}

let oidcClientPromise = (async () => {
    const issuer = await Issuer.discover(COGNITO_ISSUER);
    return new issuer.Client({
        client_id: COGNITO_CLIENT_ID,
        client_secret: COGNITO_CLIENT_SECRET,
        redirect_uris: [AUTH_CALLBACK_URL],
        response_types: ["code"]
    });
})();

async function getOidcClient() {
    return oidcClientPromise;
}

const checkAuth = (req, res, next) => {
    req.isAuthenticated = Boolean(req.session.userInfo);
    next();
};

app.get("/auth/me", checkAuth, (req, res) => {
    res.json({
        isAuthenticated: req.isAuthenticated,
        user: req.session.userInfo || null
    });
});

app.get("/auth/login", async (req, res) => {
    const client = await getOidcClient();
    const nonce = generators.nonce();
    const state = generators.state();

    req.session.nonce = nonce;
    req.session.state = state;

    const authUrl = client.authorizationUrl({
        scope: "openid email phone",
        state,
        nonce,
        redirect_uri: AUTH_CALLBACK_URL
    });

    req.session.save(() => {
        res.redirect(authUrl);
    });
});

app.get("/auth/signup", async (req, res) => {
    const client = await getOidcClient();
    const nonce = generators.nonce();
    const state = generators.state();

    req.session.nonce = nonce;
    req.session.state = state;

    const authUrl = client.authorizationUrl({
        scope: "openid email phone",
        state,
        nonce,
        redirect_uri: AUTH_CALLBACK_URL,
        screen_hint: "signup"
    });

    req.session.save(() => {
        res.redirect(authUrl);
    });
});

app.get("/auth/callback", async (req, res) => {
    try {
        const client = await getOidcClient();
        const params = client.callbackParams(req);
        const tokenSet = await client.callback(AUTH_CALLBACK_URL, params, {
            nonce: req.session.nonce,
            state: req.session.state
        });

        const userInfo = await client.userinfo(tokenSet.access_token);
        req.session.userInfo = userInfo;

        req.session.save(() => {
            res.redirect(FRONTEND_URL);
        });
    } catch (err) {
        console.error("Callback error:", err);
        res.redirect(FRONTEND_URL);
    }
});

app.get("/auth/logout", (req, res) => {
    const logoutRedirect = process.env.LOGOUT_REDIRECT_URL || FRONTEND_URL;

    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        const url = new URL(`https://${COGNITO_DOMAIN}/logout`);
        url.searchParams.set("client_id", COGNITO_CLIENT_ID);
        url.searchParams.set("logout_uri", logoutRedirect);
        res.redirect(url.toString());
    });
});

const DATA_DIR = path.join(__dirname, "data");
const LISTINGS_PATH = path.join(DATA_DIR, "listings.json");
const BIDS_PATH = path.join(DATA_DIR, "bids.json");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const NOTIFICATIONS_PATH = path.join(DATA_DIR, "notifications.json");

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
    fs.mkdirSync(require("path").dirname(path), { recursive: true });
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

function getNotifications() {
    return readJson(NOTIFICATIONS_PATH, []);
}

function saveNotifications(notifications) {
    writeJson(NOTIFICATIONS_PATH, notifications);
}

function toIsoString(value) {
    return new Date(value).toISOString();
}

function getAuthenticatedUser(req) {
    const userInfo = req.session && req.session.userInfo;
    if (!userInfo) return null;

    const userId = userInfo.sub || userInfo.username || userInfo.email;
    if (!userId) return null;

    return {
        userId: String(userId),
        email: userInfo.email ? String(userInfo.email) : null,
        username: userInfo.username ? String(userInfo.username) : null
    };
}

function requireAuth(req, res, next) {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.authUser = user;
    next();
}

function isAutomationAuthorized(req) {
    const secret = process.env.AUCTION_CLOSER_SECRET;
    if (!secret) return false;
    const provided = req.get("x-auction-closer-secret");
    return Boolean(provided) && provided === secret;
}

function getUserDisplayName(user) {
    if (!user) return "Unknown";
    return user.email || user.username || user.userId;
}

function createNotification({ userId, type, listingId, createdAt, message, data }) {
    return {
        id: crypto.randomUUID(),
        userId,
        type,
        listingId,
        createdAt: createdAt || toIsoString(Date.now()),
        read: false,
        message,
        data: data || {}
    };
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

function closeListing(listing, bids, closedAtMs) {
    listing.status = "closed";
    if (closedAtMs !== undefined && closedAtMs !== null && Number.isFinite(closedAtMs)) {
        listing.endsAt = toIsoString(closedAtMs);
    }
    const highest = getHighestBid(listing.id, bids);
    listing.winner = highest && highest.bidder ? highest.bidder : null;
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

// Notifications (DynamoDB-friendly shape: userId + createdAt + type + listingId)
app.get("/notifications", requireAuth, (req, res) => {
    const notifications = getNotifications();
    const mine = notifications
        .filter((n) => n.userId === req.authUser.userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(mine);
});

app.post("/notifications/:id/read", requireAuth, (req, res) => {
    const notifications = getNotifications();
    const n = notifications.find((x) => x.id === req.params.id);
    if (!n) return res.status(404).json({ error: "Not found" });
    if (n.userId !== req.authUser.userId) return res.status(403).json({ error: "Forbidden" });
    n.read = true;
    saveNotifications(notifications);
    res.json(n);
});

// Get all listings
app.get("/listings", (req, res) => {
    const bids = getBids();
    const listings = refreshExpiredListings(getListings(), bids);
    res.json(listings.map((l) => withBids(l, bids)));
});

// Create listing
app.post("/listings", requireAuth, (req, res) => {
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

    const creator = {
        userId: req.authUser.userId,
        email: req.authUser.email,
        username: req.authUser.username,
        displayName: getUserDisplayName(req.authUser)
    };

    const newListing = {
        id: crypto.randomUUID(),
        title,
        startingPrice: price,
        currentPrice: price,
        status: "open",
        createdAt,
        endsAt,
        creator,
        winner: null,
        image: req.body.image || null
    };

    listings.push(newListing);
    saveListings(listings);
    res.json(withBids(newListing, bids));
});

// Place Bid
app.post("/listings/:id/bid", requireAuth, (req, res) => {
    const listings = getListings();
    const bids = getBids();
    const notifications = getNotifications();
    refreshExpiredListings(listings, bids);

    const listingId = req.params.id;
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

    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }
    if (amount <= listing.currentPrice) {
        return res.status(400).json({ error: "Bid too low" });
    }

    const previousHighest = getHighestBid(listing.id, bids);
    const bidder = {
        userId: req.authUser.userId,
        email: req.authUser.email,
        username: req.authUser.username,
        displayName: getUserDisplayName(req.authUser)
    };

    const newBid = {
        id: crypto.randomUUID(),
        listingId: listing.id,
        bidder,
        amount,
        createdAt: toIsoString(now)
    };

    bids.push(newBid);
    saveBids(bids);

    listing.currentPrice = amount;
    saveListings(listings);

    if (previousHighest && previousHighest.bidder && previousHighest.bidder.userId !== bidder.userId) {
        notifications.push(
            createNotification({
                userId: previousHighest.bidder.userId,
                type: "OUTBID",
                listingId: listing.id,
                message: `You were outbid on ${listing.title}. New bid: $${amount}.`,
                data: {
                    amount,
                    listingTitle: listing.title
                }
            })
        );
        saveNotifications(notifications);
    }

    res.json(withBids(listing, bids));
});

// Close auction
app.post("/listings/:id/close", (req, res) => {
    const listings = getListings();
    const bids = getBids();
    const notifications = getNotifications();
    refreshExpiredListings(listings, bids);

    const listingId = req.params.id;
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return res.status(404).json({ error: "Not found" });

    const automationOk = isAutomationAuthorized(req);
    if (!automationOk) {
        const user = getAuthenticatedUser(req);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const creatorUserId = listing && listing.creator && listing.creator.userId ? String(listing.creator.userId) : null;
        if (!creatorUserId) {
            return res.status(403).json({ error: "Only the listing creator can close this auction" });
        }
        if (String(user.userId) !== creatorUserId) {
            return res.status(403).json({ error: "Only the listing creator can close this auction" });
        }
    }

    closeListing(listing, bids, Date.now());
    saveListings(listings);

    const highest = getHighestBid(listing.id, bids);
    const allBids = getListingBids(listing.id, bids);
    const participantUserIds = new Set(
        allBids
            .map((b) => (b.bidder ? b.bidder.userId : null))
            .filter(Boolean)
    );

    for (const userId of participantUserIds) {
        if (highest && highest.bidder && userId === highest.bidder.userId) {
            notifications.push(
                createNotification({
                    userId,
                    type: "WON",
                    listingId: listing.id,
                    message: `You won the auction for ${listing.title} at $${highest.amount}.`,
                    data: { listingTitle: listing.title, amount: highest.amount }
                })
            );
        } else {
            notifications.push(
                createNotification({
                    userId,
                    type: "CLOSED",
                    listingId: listing.id,
                    message: `Auction closed for ${listing.title}.`,
                    data: { listingTitle: listing.title }
                })
            );
        }
    }

    if (participantUserIds.size > 0) saveNotifications(notifications);
    res.json(withBids(listing, bids));
});

// Start server
app.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
});