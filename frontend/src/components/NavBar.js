import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

function NavBar() {
    return (
        <AppBar position="static">
        <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                King Ranch
            </Typography>

            <Button color="inherit" component={Link} to="/">
                Home
            </Button>

            <Button color="inherit" component={Link} to="/create">
                Create Listing
            </Button>
        </Toolbar>
        </AppBar>
    );
}

export default NavBar;