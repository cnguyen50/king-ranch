import { useEffect, useState } from "react";
import { getListings } from "./services/api";
import { Routes, Route } from "react-router-dom";
import BidList from "./components/BidList";
import NavBar from "./components/NavBar";
import CreateListing from "./pages/CreateListing";

function App() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    const data = await getListings();
    setListings(data);
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