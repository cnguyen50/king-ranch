import { AppBar, Toolbar, Typography, Button, Badge } from "@mui/material";
import { Link } from "react-router-dom";

const AUTH_BASE_URL = "http://localhost:3001";

function NavBar({ unreadCount = 0, isAuthenticated = false }) {
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

            <Button color="inherit" component={Link} to="/notifications">
                <Badge
                color="error"
                badgeContent={unreadCount}
                invisible={unreadCount === 0}
                >
                    Notifications
                </Badge>
            </Button>

            {isAuthenticated ? (
                <Button
                    color="inherit"
                    onClick={() => {
                        window.location.href = `${AUTH_BASE_URL}/auth/logout`;
                    }}
                >
                    Logout
                </Button>
            ) : (
                <>
                    <Button
                        color="inherit"
                        onClick={() => {
                            window.location.href = `${AUTH_BASE_URL}/auth/login`;
                        }}
                    >
                        Login
                    </Button>

                    <Button
                        color="inherit"
                        onClick={() => {
                            window.location.href = `${AUTH_BASE_URL}/auth/signup`;
                        }}
                    >
                        Signup
                    </Button>
                </>
            )}
        </Toolbar>
        </AppBar>
    );
}

export default NavBar;