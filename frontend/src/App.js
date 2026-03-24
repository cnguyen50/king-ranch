import { useEffect, useState } from "react";
import { closeAuction, getListings, getUsers, placeBid } from "./services/api";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import CreateListing from "./pages/CreateListing";
import ListingCard from "./components/ListingCard";
import { Grid, Box, Typography, Button } from "@mui/material";

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

function App() {
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState("");
  const [bidAmounts, setBidAmounts] = useState({});

  useEffect(() => {
    (async () => {
      const u = await getUsers();
      setUsers(u);
      if (u && u.length > 0) setActiveUser(u[0].username);
      await loadListings();
    })();
  }, []);

  const loadListings = async () => {
    const data = await getListings();
    setListings(data);
  };

  const handlePlaceBid = async (listingId) => {
    const amount = Number(bidAmounts[listingId]);
    const res = await placeBid(listingId, { user: activeUser, amount });
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
      <NavBar />

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
                  <label>
                    Active User{" "}
                    <select
                      value={activeUser}
                      onChange={(e) => setActiveUser(e.target.value)}
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.username}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                  </label>

                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ ml: 2 }}
                    onClick={loadListings}
                  >
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
                          activeUser={activeUser}
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
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Box>
          }
        />

        <Route path="/create" element={<CreateListing />} />
      </Routes>
    </>
  );
}

export default App;