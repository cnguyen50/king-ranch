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
            return (
                user.displayName ||
                user.email ||
                user.username ||
                user.userId ||
                ""
            );
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
                minHeight: 500,
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                overflow: "hidden",
                transition: "all 0.2s ease",
                opacity: listing.status === "open" ? 1 : 0.6,
                filter: listing.status === "open" ? "none" : "grayscale(40%)",
                boxShadow: 3,
                border: "1px solid rgba(0,0,0,0.05)",

                "&:hover": {
                transform:
                    listing.status === "open"
                    ? "translateY(-4px)"
                    : "none",
                boxShadow: listing.status === "open" ? 6 : 1
                }
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
                        height: 350,
                        width: "100%",
                        objectFit: "cover"
                    }}
                />
            </CardActionArea>

            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ pb: 1 }}>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                    {listing.title}
                </Typography>

                <Typography
                    sx={{
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        mb: 1
                    }}
                >
                    Price: ${listing.currentPrice}
                </Typography>

                <Chip
                    label={listing.status.toUpperCase()}
                    size="small"
                    sx={{
                        mb: 1,
                        backgroundColor:
                            listing.status === "open"
                                ? "success.main"
                                : "transparent",
                        color:
                            listing.status === "open"
                                ? "#fff"
                                : "error.main",
                        border:
                            listing.status === "open"
                                ? "none"
                                : "1px solid",
                    }}
                />

                {(listing.creator || listing.seller) && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Seller:{" "}
                    {getUserLabel(listing.creator) ||
                        getUserLabel(listing.seller)}
                    </Typography>
                )}

                {listing.winner && (
                    <Typography variant="body2">
                        Winner: {getUserLabel(listing.winner)}
                    </Typography>
                )}

                {listing.endsAt && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        Time Left: {timeLeftLabel}
                    </Typography>
                )}
                </CardContent>

                {listing.status === "open" && (
                <Box
                    sx={{
                        px: 2,
                        pb: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.2
                    }}
                >
                    <TextField
                        size="small"
                        type="number"
                        label="Bid Amount"
                        fullWidth
                        value={bidAmount ?? ""}
                        onChange={(e) => setBidAmount(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root": { borderRadius: 2 }
                        }}
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={onPlaceBid}
                        disabled={!isAuthenticated}
                        sx={{
                            py: 1.1,
                            fontWeight: "bold",
                            transition: "all 0.2s ease",
                            "&:hover": { transform: "translateY(-1px)" }
                        }}
                    >
                        Place Bid
                    </Button>

                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={onClose}
                        disabled={!isAuthenticated}
                        sx={{ borderRadius: 2 }}
                    >
                        Close Auction
                    </Button>
                </Box>
                )}
            </Box>

            <Divider />

            <Box
                sx={{
                    p: 2,
                    maxHeight: 160,
                    overflowY: "auto"
                }}
            >
                <BidList bids={listing.bids} />
            </Box>
        </Card>
    );
}

export default ListingCard;