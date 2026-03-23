import { useEffect, useState } from "react";
import { TextField, Button, Typography, Box, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createListing, getUsers } from "../services/api";

function CreateListing() {
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [users, setUsers] = useState([]);
    const [seller, setSeller] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
        const data = await getUsers();
        setUsers(data);
        })();
    }, []);

    const handleSubmit = async () => {
        if (!title || !price) {
        alert("Please fill all fields");
        return;
        }

        await createListing({
        title,
        price: Number(price),
        user: seller || undefined
        });

        navigate("/");
    };

    return (
        <Box sx={{ maxWidth: 400, margin: "auto", mt: 5 }}>
        <Typography variant="h4" gutterBottom>
            Create Listing
        </Typography>

        <TextField
            select
            label="Seller"
            fullWidth
            margin="normal"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
        >
            <MenuItem value="">(none)</MenuItem>
            {users.map((u) => (
            <MenuItem key={u.id} value={u.username}>
                {u.username}
            </MenuItem>
            ))}
        </TextField>

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