import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Divider
} from "@mui/material";

function BidList({ bids }) {
    if (!bids || bids.length === 0) {
        return (
            <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ mt: 2 }}
            >
                No bids yet
            </Typography>
        );
    }

    const getBidderLabel = (bid) => {
    if (!bid) return "Unknown";
    if (bid.bidder)
        return (
            bid.bidder.displayName ||
            bid.bidder.email ||
            bid.bidder.username ||
            bid.bidder.userId
        );
    if (bid.user) return bid.user;
    return "Unknown";
    };

    const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);
    const highest = sortedBids[0]?.amount;

    return (
    <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
            Bids
        </Typography>

        <List dense>
            {sortedBids.map((bid, index) => (
                <Box key={`${getBidderLabel(bid)}-${bid.amount}`}>
                    <ListItem
                        sx={{
                            px: 0,
                            py: 0.5,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        <ListItemText primary={getBidderLabel(bid)} />

                        <Typography
                        sx={{
                            fontWeight: "bold",
                            color: bid.amount === highest ? "green" : "inherit"
                        }}
                        >
                            ${bid.amount}
                        </Typography>
                    </ListItem>

                    {index !== sortedBids.length - 1 && <Divider />}
                </Box>
            ))}
        </List>
    </Box>
    );
}

export default BidList;