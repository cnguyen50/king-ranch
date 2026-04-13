import { useEffect, useState } from "react";
import { closeAuction, getListings, getMe, getNotifications, placeBid } from "./services/api";
import { Routes, Route, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import CreateListing from "./pages/CreateListing";
import ListingCard from "./components/ListingCard";
import { Grid, Box, Typography, Button } from "@mui/material";
import Notifications from "./pages/Notifications";

function formatTimeRemaining(endsAt) {
  if (!endsAt) return "";
  const ms = Date.parse(endsAt) - Date.now();
  if (!Number.isFinite(ms)) return "";
  if (ms <= 0) return "Ended";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatListingTimeRemaining(listing) {
  if (!listing) return "";
  if (listing.status !== "open") return "Closed";
  return formatTimeRemaining(listing.endsAt);
}

function App() {
  const [listings, setListings] = useState([]);
  const [me, setMe] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bidAmounts, setBidAmounts] = useState({});
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const auth = await getMe();
      const authed = Boolean(auth && auth.isAuthenticated);
      setIsAuthenticated(authed);
      setMe(auth && auth.user ? auth.user : null);

      if (authed) {
        const notifs = await getNotifications();
        if (Array.isArray(notifs)) {
          setUnreadCount(notifs.filter((n) => !n.read).length);
        }
      } else {
        setUnreadCount(0);
      }
      await loadListings();
    })();
  }, []);

  useEffect(() => {
    if (location.pathname === "/") {
      loadListings();
    }
  }, [location.pathname]); 

  const loadListings = async () => {
    const data = await getListings();
    setListings(data);
  };

  const handlePlaceBid = async (listingId) => {
    const amount = Number(bidAmounts[listingId]);
    const res = await placeBid(listingId, { amount });
    if (res && res.error) {
      alert(res.error);
      return;
    }
    await loadListings();
  };

  const handleClose = async (listingId) => {
    const res = await closeAuction(listingId);
    if (res && res.error) {
      alert(res.error);
      return;
    }
    await loadListings();
  };

  return (
    <>
      <NavBar unreadCount={unreadCount} isAuthenticated={isAuthenticated} />

      <Routes>
        <Route
          path="/"
          element={
            <Box sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
              <Box sx={{ py: 3, px: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
                  King Ranch Auctions
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {isAuthenticated
                      ? `Signed in as ${me?.email || me?.username || me?.sub || "user"}`
                      : "Not signed in"}
                  </Typography>

                  <Button variant="outlined" size="small" onClick={loadListings}>
                    Refresh
                  </Button>
                </Box>

                <Box sx={{ mt: 4, maxWidth: "1400px", margin: "0 auto" }}>
                  <Grid
                    container
                    spacing={4}
                    alignItems="stretch"
                    justifyContent="center"
                  >
                    {listings.map((listing) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        key={listing.id}
                        sx={{ display: "flex" }}
                      >
                        <ListingCard
                          listing={listing}
                          isAuthenticated={isAuthenticated}
                          bidAmount={bidAmounts[listing.id]}
                          setBidAmount={(value) =>
                            setBidAmounts((prev) => ({
                              ...prev,
                              [listing.id]: value
                            }))
                          }
                          onPlaceBid={() => handlePlaceBid(listing.id)}
                          onClose={() => handleClose(listing.id)}
                          formatTimeRemaining={formatTimeRemaining}
                        >
                          <p>Status: {listing.status}</p>
                          {listing.creator ? <p>Creator: {listing.creator.displayName || listing.creator.email || listing.creator.userId}</p> : null}
                          {listing.winner ? <p>Winner: {listing.winner.displayName || listing.winner.email || listing.winner.userId}</p> : null}
                          {listing.createdAt ? <p>Created: {new Date(listing.createdAt).toLocaleString()}</p> : null}
                          {listing.endsAt ? <p>Ends: {new Date(listing.endsAt).toLocaleString()}</p> : null}
                          {listing.endsAt ? <p>Time Remaining: {formatListingTimeRemaining(listing)}</p> : null}
                        </ListingCard>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Box>
          }
        />

        <Route path="/create" element={<CreateListing />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </>
  );
}

export default App;