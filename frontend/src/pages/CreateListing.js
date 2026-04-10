import { useState } from "react";
import { TextField, Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createListing } from "../services/api";

function CreateListing() {
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [image, setImage] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (!title || !price) {
        alert("Please fill all fields");
        return;
        }

        try {
        await createListing({
            title,
            price: Number(price),
            image
        });
        } catch (e) {
        alert(e && e.message ? e.message : "Failed to create listing");
        return;
        }

        navigate("/");
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onloadend = () => {
        setImage(reader.result);
        };

        if (file) reader.readAsDataURL(file);
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

        <input type="file" accept="image/*" onChange={handleImageUpload} />

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