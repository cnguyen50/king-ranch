const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const cors = require("cors");
const express = require("express");
const session = require("express-session");
const { Issuer, generators } = require("openid-client");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand
} = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");
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

const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const DDB_LISTINGS_TABLE = process.env.DDB_LISTINGS_TABLE;
const DDB_BIDS_TABLE = process.env.DDB_BIDS_TABLE;
const DDB_NOTIFICATIONS_TABLE = process.env.DDB_NOTIFICATIONS_TABLE;

if (!COGNITO_ISSUER || !COGNITO_CLIENT_ID || !COGNITO_CLIENT_SECRET || !COGNITO_DOMAIN) {
    throw new Error(
        "Missing required Cognito env vars: COGNITO_ISSUER, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET, COGNITO_DOMAIN"
    );
}

if (!AWS_REGION || !DDB_LISTINGS_TABLE || !DDB_BIDS_TABLE || !DDB_NOTIFICATIONS_TABLE) {
    throw new Error(
        "Missing required DynamoDB env vars: AWS_REGION, DDB_LISTINGS_TABLE, DDB_BIDS_TABLE, DDB_NOTIFICATIONS_TABLE"
    );
}

const ddbDoc = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: AWS_REGION }),
    {
        marshallOptions: { removeUndefinedValues: true }
    }
);

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

async function ddbListListings() {
    const items = [];
    let lastEvaluatedKey;

    do {
        const res = await ddbDoc.send(
            new ScanCommand({
                TableName: DDB_LISTINGS_TABLE,
                ExclusiveStartKey: lastEvaluatedKey
            })
        );

        if (Array.isArray(res.Items) && res.Items.length > 0) {
            items.push(...res.Items);
        }

        lastEvaluatedKey = res.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return items;
}

async function ddbPutListing(listing) {
    await ddbDoc.send(
        new PutCommand({
            TableName: DDB_LISTINGS_TABLE,
            Item: {
                ...listing,
                listingId: listing.id
            }
        })
    );
}

async function ddbQueryBids(listingId) {
    const res = await ddbDoc.send(
        new QueryCommand({
            TableName: DDB_BIDS_TABLE,
            KeyConditionExpression: "listingId = :listingId",
            ExpressionAttributeValues: {
                ":listingId": listingId
            },
            ScanIndexForward: true
        })
    );
    return Array.isArray(res.Items) ? res.Items : [];
}

async function ddbPutBid(bid) {
    await ddbDoc.send(
        new PutCommand({
            TableName: DDB_BIDS_TABLE,
            Item: bid
        })
    );
}

async function ddbQueryNotifications(userId) {
    const res = await ddbDoc.send(
        new QueryCommand({
            TableName: DDB_NOTIFICATIONS_TABLE,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            },
            ScanIndexForward: false
        })
    );
    return Array.isArray(res.Items) ? res.Items : [];
}

async function ddbPutNotification(notification) {
    const createdAtId = `${notification.createdAt}#${notification.id}`;
    await ddbDoc.send(
        new PutCommand({
            TableName: DDB_NOTIFICATIONS_TABLE,
            Item: {
                ...notification,
                createdAtId
            }
        })
    );
}

async function ddbMarkNotificationRead({ userId, createdAtId }) {
    const res = await ddbDoc.send(
        new UpdateCommand({
            TableName: DDB_NOTIFICATIONS_TABLE,
            Key: {
                userId,
                createdAtId
            },
            UpdateExpression: "SET #read = :true",
            ExpressionAttributeNames: {
                "#read": "read"
            },
            ExpressionAttributeValues: {
                ":true": true
            },
            ReturnValues: "ALL_NEW"
        })
    );
    return res.Attributes;
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

function withBids(listing, bids) {
    return {
        ...listing,
        bids: getListingBids(listing.id, bids)
    };
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

// Notifications (DynamoDB-friendly shape: userId + createdAt + type + listingId)
app.get("/notifications", requireAuth, async (req, res) => {
    const mine = await ddbQueryNotifications(req.authUser.userId);
    res.json(mine);
});

app.post("/notifications/:id/read", requireAuth, async (req, res) => {
    const mine = await ddbQueryNotifications(req.authUser.userId);
    const n = mine.find((x) => x && x.id === req.params.id);
    if (!n) return res.status(404).json({ error: "Not found" });
    if (!n.createdAtId) {
        const createdAtId = `${n.createdAt}#${n.id}`;
        n.createdAtId = createdAtId;
    }
    const updated = await ddbMarkNotificationRead({
        userId: req.authUser.userId,
        createdAtId: n.createdAtId
    });
    res.json(updated);
});

// Get all listings
app.get("/listings", async (req, res) => {
    const listings = await ddbListListings();

    const enriched = [];

    for (const listing of listings) {
        const normalized = {
            ...listing,
            id: listing.id || listing.listingId
        };

        const bids = await ddbQueryBids(normalized.id);
        ensureListingTimeFields(normalized);

        const endsAtMs = Date.parse(normalized.endsAt);
        if (normalized.status === "open" && Number.isFinite(endsAtMs) && Date.now() >= endsAtMs) {
            closeListing(normalized, bids);
            try {
                await ddbPutListing(normalized);
            } catch (err) {
                console.error("Failed to persist auto-closed listing", {
                    listingId: normalized.id,
                    message: err && err.message ? err.message : String(err)
                });
            }
        }

        enriched.push(withBids(normalized, bids));
    }

    res.json(enriched);
});

// Create listing
app.post("/listings", requireAuth, async (req, res) => {
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

    await ddbPutListing(newListing);
    res.json(withBids(newListing, []));
});

// Place Bid
app.post("/listings/:id/bid", requireAuth, async (req, res) => {
    const listingId = req.params.id;
    const listings = await ddbListListings();
    const listing = listings
        .map((l) => ({ ...l, id: l.id || l.listingId }))
        .find((l) => l.id === listingId);
    if (!listing) return res.status(404).json({ error: "Not found" });

    const bids = await ddbQueryBids(listing.id);

    ensureListingTimeFields(listing);

    const now = Date.now();
    if (listing.status !== "open") {
        return res.status(400).json({ error: "Invalid listing" });
    }
    if (now >= Date.parse(listing.endsAt)) {
        closeListing(listing, bids);
        await ddbPutListing(listing);
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

    await ddbPutBid({ ...newBid, bidId: newBid.id });

    const updatedBids = [...bids, newBid];

    listing.currentPrice = amount;

    await ddbPutListing(listing);

    if (previousHighest && previousHighest.bidder && previousHighest.bidder.userId !== bidder.userId) {
        await ddbPutNotification(
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
    }

    res.json(withBids(listing, updatedBids));
});

// Close auction
app.post("/listings/:id/close", async (req, res) => {
    const listingId = req.params.id;
    const listings = await ddbListListings();
    const listing = listings
        .map((l) => ({ ...l, id: l.id || l.listingId }))
        .find((l) => l.id === listingId);
    if (!listing) return res.status(404).json({ error: "Not found" });

    const bids = await ddbQueryBids(listing.id);

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
    await ddbPutListing(listing);

    const highest = getHighestBid(listing.id, bids);
    const allBids = getListingBids(listing.id, bids);
    const participantUserIds = new Set(
        allBids
            .map((b) => (b.bidder ? b.bidder.userId : null))
            .filter(Boolean)
    );

    for (const userId of participantUserIds) {
        if (highest && highest.bidder && userId === highest.bidder.userId) {
            await ddbPutNotification(
                createNotification({
                    userId,
                    type: "WON",
                    listingId: listing.id,
                    message: `You won the auction for ${listing.title} at $${highest.amount}.`,
                    data: { listingTitle: listing.title, amount: highest.amount }
                })
            );
        } else {
            await ddbPutNotification(
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

    res.json(withBids(listing, bids));
});

// Start server
app.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
});