import { useEffect, useState } from "react";
import { closeAuction, getListings, getUsers, placeBid } from "./services/api";
import { Routes, Route } from "react-router-dom";
import BidList from "./components/BidList";
import NavBar from "./components/NavBar";
import CreateListing from "./pages/CreateListing";

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
            <div style={{ padding: "20px" }}>
              <h1>King Ranch Auctions</h1>

              <div style={{ marginBottom: "12px" }}>
                <label>
                  Active User:{" "}
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
                <button style={{ marginLeft: "10px" }} onClick={loadListings}>
                  Refresh
                </button>
              </div>

              {listings.map((listing) => (
                <div
                  key={listing.id}
                  style={{
                    border: "1px solid black",
                    margin: "10px",
                    padding: "10px"
                  }}
                >
                  <h2>{listing.title}</h2>
                  <p>Current Price: ${listing.currentPrice}</p>
                  <p>Status: {listing.status}</p>
                  {listing.seller ? <p>Seller: {listing.seller}</p> : null}
                  {listing.winner ? <p>Winner: {listing.winner}</p> : null}
                  {listing.createdAt ? <p>Created: {new Date(listing.createdAt).toLocaleString()}</p> : null}
                  {listing.endsAt ? <p>Ends: {new Date(listing.endsAt).toLocaleString()}</p> : null}
                  {listing.endsAt ? <p>Time Remaining: {formatTimeRemaining(listing.endsAt)}</p> : null}

                  {listing.status === "open" ? (
                    <div style={{ marginTop: "10px" }}>
                      <input
                        type="number"
                        placeholder="Bid amount"
                        value={bidAmounts[listing.id] ?? ""}
                        onChange={(e) =>
                          setBidAmounts((prev) => ({
                            ...prev,
                            [listing.id]: e.target.value
                          }))
                        }
                      />
                      <button
                        style={{ marginLeft: "8px" }}
                        onClick={() => handlePlaceBid(listing.id)}
                        disabled={!activeUser}
                      >
                        Place Bid
                      </button>
                      <button
                        style={{ marginLeft: "8px" }}
                        onClick={() => handleClose(listing.id)}
                      >
                        Close Auction
                      </button>
                    </div>
                  ) : null}

                  <BidList bids={listing.bids} />
                </div>
              ))}
            </div>
          }
        />

        <Route path="/create" element={<CreateListing />} />
      </Routes>
    </>
  );
}

export default App;