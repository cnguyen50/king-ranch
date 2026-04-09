import BidList from "./BidList";
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    CardActionArea,
    Button,
    TextField,
    Box,
    Divider,
    Chip
} from "@mui/material";

function ListingCard({
    listing,
    isAuthenticated,
    bidAmount,
    setBidAmount,
    onPlaceBid,
    onClose,
    formatTimeRemaining
}) {
    const getUserLabel = (user) => {
        if (!user) return "";
        if (typeof user === "string") return user;
        if (typeof user === "object") {
            return user.displayName || user.email || user.username || user.userId || "";
        }
        return "";
    };

    const timeLeftLabel =
        listing.status === "open"
            ? formatTimeRemaining(listing.endsAt)
            : "Closed";

    return (
        <Card
            sx={{
                width: "100%",
                height: "100%",
                minHeight: 450,
                display: "flex",
                flexDirection: "column",
                transition: "0.3s",
                "&:hover": { transform: "scale(1.02)" }
            }}
        >

        <CardActionArea>
            <CardMedia
                component="img"
                image={
                    listing.image ||
                    "https://via.placeholder.com/400x200"
                }
                alt={listing.title}
                sx={{
                    height: 200,
                    width: "100%",
                    objectFit: "cover",
                    borderBottom: "1px solid #eee"
                }}
            />
        </CardActionArea>

        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <CardContent>
                <Typography variant="h6">{listing.title}</Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>Price: ${listing.currentPrice}</Typography>

                <Chip
                    label={listing.status.toUpperCase()}
                    color={listing.status === "open" ? "success" : "error"}
                    variant={listing.status === "open" ? "filled" : "outlined"}
                    size="small"
                    sx={{ mt: 1 }}
                />

                {(listing.creator || listing.seller) && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                    Seller: {getUserLabel(listing.creator) || getUserLabel(listing.seller)}
                    </Typography>
                )}

                {listing.winner && (
                    <Typography variant="body2">
                    Winner: {getUserLabel(listing.winner)}
                    </Typography>
                )}

                {listing.endsAt && (
                    <Typography variant="body2" color="text.secondary">
                    Time Left: {timeLeftLabel}
                    </Typography>
                )}
            </CardContent>

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
                        disabled={!isAuthenticated}
                    >
                        Place Bid
                    </Button>

                    <Button
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 1 }}
                        onClick={onClose}
                        disabled={!isAuthenticated}
                    >
                        Close Auction
                    </Button>
                </Box>
            )}
        </Box>

        <Divider />
        <Box sx={{ p: 2 }}>
            <BidList bids={listing.bids} />
        </Box>
        </Card>
    );
}

export default ListingCard;