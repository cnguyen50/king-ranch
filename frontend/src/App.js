import { useEffect, useState } from "react";
import {
  closeAuction,
  getListings,
  getMe,
  getNotifications,
  placeBid
} from "./services/api";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { Routes, Route, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import CreateListing from "./pages/CreateListing";
import ListingCard from "./components/ListingCard";
import { Box, Typography, Button } from "@mui/material";
import Notifications from "./pages/Notifications";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#5A3E2B",
      dark: "#4A3324",
      light: "#7A5A3A"
    },
    secondary: {
      main: "#C19A6B"
    },
    background: {
      default: "#F5E6D3"
    },
    success: {
      main: "#2E7D32"
    }
  }
});

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
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <>
        <NavBar
          unreadCount={unreadCount}
          isAuthenticated={isAuthenticated}
          userEmail={me?.email || ""}
        />

        <Routes>
          <Route
            path="/"
            element={
              <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
                <Box sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 } }}>
              <Typography
                variant="h4"
                sx={{
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "primary.main",
                  mb: 4
                }}
              >
                Auction List
              </Typography>


                  <Box
                    sx={{
                      mt: 4,
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(340px, 1fr))",
                      gap: 3,
                      width: "100%",
                      maxWidth: "1700px",
                      mx: "auto"
                    }}
                  >
                  {[...listings]
                    .sort((a, b) => {
                      if (a.status === b.status) {
                        if (a.status === "open") {
                          return new Date(a.endsAt) - new Date(b.endsAt);
                        }
                        return 0;
                      }
                      return a.status === "open" ? -1 : 1;
                    })
                    .map((listing) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        isAuthenticated={isAuthenticated}
                        bidAmount={bidAmounts[listing.id]}
                        setBidAmount={(value) =>
                          setBidAmounts((prev) => ({
                            ...prev,
                            [listing.id]: value
                          }))
                        }
                        onPlaceBid={() =>
                          handlePlaceBid(listing.id)
                        }
                        onClose={() =>
                          handleClose(listing.id)
                        }
                        formatTimeRemaining={formatTimeRemaining}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            }
          />

          <Route path="/create" element={<CreateListing />} />

          <Route
            path="/notifications"
            element={
              <Notifications
                onNotificationsUpdate={setUnreadCount}
              />
            }
          />
        </Routes>
      </>
    </ThemeProvider>
  );
}

export default App;