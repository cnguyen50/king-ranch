import { AppBar, Toolbar, Typography, Button, Badge } from "@mui/material";
import { Link } from "react-router-dom";

import HomeIcon from "@mui/icons-material/Home";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const AUTH_BASE_URL = "http://localhost:3001";

function NavBar({ unreadCount = 0, isAuthenticated = false }) {
    return (
        <AppBar position="static">
        <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                King Ranch
            </Typography>

            <Button
                color="inherit"
                component={Link}
                to="/"
                startIcon={<HomeIcon />}
                sx={{ ml: 1, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)"} }}
            >
                Home
            </Button>

            <Button
                color="inherit"
                component={Link}
                to="/create"
                startIcon={<AddCircleIcon />}
                sx={{ ml: 1, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)"} }}
            >
                Create Listing
            </Button>

            <Button
                color="inherit"
                component={Link}
                to="/notifications"
                startIcon={
                    <Badge
                        color="error"
                        badgeContent={unreadCount}
                        invisible={unreadCount === 0}
                        sx={{"& .MuiBadge-badge": { fontWeight: "bold"}}}
                    >
                        <NotificationsIcon />
                    </Badge>
                }
                sx={{ ml: 1, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)"} }}
            >
                Notifications
            </Button>

            {isAuthenticated ? (
                <Button
                    color="inherit"
                    startIcon={<LogoutIcon />}
                    sx={{ ml: 1, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)"} }}
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
                    startIcon={<LoginIcon />}
                    sx={{ ml: 1, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)"} }}
                    onClick={() => {
                        window.location.href = `${AUTH_BASE_URL}/auth/login`;
                    }}
                >
                    Login
                </Button>

                <Button
                    color="inherit"
                    startIcon={<PersonAddIcon />}
                    sx={{ ml: 1, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)"} }}
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