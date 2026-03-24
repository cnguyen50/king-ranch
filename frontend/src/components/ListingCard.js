import BidList from "./BidList";
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    CardActionArea,
    Button,
    TextField,
    Box
} from "@mui/material";

function ListingCard({
    listing,
    activeUser,
    bidAmount,
    setBidAmount,
    onPlaceBid,
    onClose,
    formatTimeRemaining
}) {
    return (
        <Card
        sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            transition: "0.3s",
            "&:hover": { transform: "scale(1.02)" }
        }}
        >
        <CardActionArea>
            {listing.image && (
                <CardMedia
                    component="img"
                    height="180"
                    image={listing.image}
                    alt={listing.title}
                />
            )}

            <CardContent>
                <Typography variant="h6">{listing.title}</Typography>

                <Typography>Price: ${listing.currentPrice}</Typography>

                <Typography sx={{
                        color: listing.status === "open" ? "green" : "red"
                    }}
                >
                    {listing.status.toUpperCase()}
                </Typography>

                {listing.seller && (
                    <Typography variant="body2">
                    Seller: {listing.seller}
                    </Typography>
                )}

                {listing.winner && (
                    <Typography variant="body2">
                    Winner: {listing.winner}
                    </Typography>
                )}

                {listing.endsAt && (
                    <Typography variant="body2" color="text.secondary">
                    Time Left: {formatTimeRemaining(listing.endsAt)}
                    </Typography>
                )}
            </CardContent>
        </CardActionArea>

        {listing.status === "open" && (
            <Box sx={{ p: 2 }}>
            <TextField
                size="small"
                type="number"
                label="Bid Amount"
                fullWidth
                value={bidAmount ?? ""}
                onChange={(e) => setBidAmount(e.target.value)}
            />

            <Button
                variant="contained"
                fullWidth
                sx={{ mt: 1 }}
                onClick={onPlaceBid}
                disabled={!activeUser}
            >
                Place Bid
            </Button>

            <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 1 }}
                onClick={onClose}
            >
                Close Auction
            </Button>
            </Box>
        )}

        <Box sx={{ p: 2 }}>
            <BidList bids={listing.bids} />
        </Box>
        </Card>
    );
}

export default ListingCard;