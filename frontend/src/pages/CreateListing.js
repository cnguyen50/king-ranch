import { useState } from "react";
import {
    TextField,
    Button,
    Typography,
    Box,
    Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createImageUpload, createListing } from "../services/api";

function CreateListing() {
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (!title || !price) {
            alert("Please fill all fields");
            return;
        }

        try {
            let finalImageUrl = imageUrl;

            if (imageFile) {
                const upload = await createImageUpload(imageFile.type);

                const putRes = await fetch(upload.uploadUrl, {
                    method: "PUT",
                    headers: {
                        "Content-Type": imageFile.type
                    },
                    body: imageFile
                });

                if (!putRes.ok) {
                    throw new Error(`Image upload failed (${putRes.status})`);
                }

                finalImageUrl = upload.imageUrl;
                setImageUrl(finalImageUrl);
            }

            await createListing({
                title,
                price: Number(price),
                imageUrl: finalImageUrl || null
            });
        } catch (e) {
            alert(e && e.message ? e.message : "Failed to create listing");
            return;
        }

        navigate("/");
    };

    const handleImageUpload = (e) => {
        const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
        setImageFile(file);

        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
        }

        if (file) {
            setImagePreviewUrl(URL.createObjectURL(file));
        } else {
            setImagePreviewUrl("");
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "background.default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2
            }}
        >
            <Paper
                elevation={4}
                sx={{
                    p: 4,
                    width: "100%",
                    maxWidth: 450,
                    borderRadius: 3,
                    boxShadow: 3,
                    border: "1px solid rgba(0,0,0,0.05)"
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: "bold",
                        mb: 3,
                        textAlign: "center",
                        color: "primary.main"
                    }}
                >
                    Create Listing
                </Typography>

                {imagePreviewUrl && (
                    <Box
                        sx={{
                            mb: 2,
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid rgba(0,0,0,0.1)"
                        }}
                    >
                        <img
                            src={imagePreviewUrl}
                            alt="preview"
                            style={{
                                width: "100%",
                                display: "block"
                            }}
                        />
                    </Box>
                )}

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

                <Box sx={{ mt: 2 }}>
                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{
                            borderColor: "primary.main",
                            color: "primary.main",
                            "&:hover": {
                                borderColor: "primary.dark",
                                backgroundColor: "rgba(90,62,43,0.05)"
                            }
                        }}
                    >
                        Upload Image
                        <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </Button>
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    sx={{
                        mt: 2,
                        py: 1.5,
                        fontWeight: "bold",
                        letterSpacing: 1,
                        backgroundColor: "primary.main",
                        "&:hover": {
                            backgroundColor: "primary.dark"
                        }
                    }}
                    onClick={handleSubmit}
                >
                    CREATE LISTING
                </Button>
            </Paper>
        </Box>
    );
}

export default CreateListing;