import { useState } from "react";
import { TextField, Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

function CreateListing() {
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (!title || !price) {
        alert("Please fill all fields");
        return;
        }

        await fetch("http://localhost:3001/listings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title,
            price: Number(price)
        })
        });

        navigate("/");
    };

    return (
        <Box sx={{ maxWidth: 400, margin: "auto", mt: 5 }}>
        <Typography variant="h4" gutterBottom>
            Create Listing
        </Typography>

        <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
            label="Starting Price"
            type="number"
            fullWidth
            margin="normal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
        />

        <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleSubmit}
        >
            Create
        </Button>
        </Box>
    );
}

export default CreateListing;