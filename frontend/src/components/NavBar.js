import { AppBar, Toolbar, Typography, Button, Badge, Box } from "@mui/material";
import { Link } from "react-router-dom";

import HomeIcon from "@mui/icons-material/Home";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AgricultureIcon from "@mui/icons-material/Agriculture";

const AUTH_BASE_URL = "";

function NavBar({ unreadCount = 0, isAuthenticated = false, userEmail = "" }) {
    return (
        <AppBar position="static">
        <Toolbar>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}></Box>
                <AgricultureIcon sx={{ fontSize: 30 }} />
                <Typography 
                    variant="h6"
                    sx={{
                        flexGrow: 1,
                        fontFamily: "'Rye', serif",
                        letterSpacing: 1.5,
                        fontWeight: "bold",
                        fontSize: "1.5rem"
                    }}
                >
                    King Ranch
                </Typography>
            <Box/>

            <Button
                color="inherit"
                component={Link}
                to="/"
                sx={{ 
                    ml: 1,
                    minWidth: 48,
                    height: 48,
                    px: 1,
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.1)"} 
                }}
            >
                <HomeIcon fontSize="medium" />
            </Button>


            {isAuthenticated && (
                <>
                    <Button
                        color="inherit"
                        component={Link}
                        to="/create"
                        sx={{ 
                            ml: 1,
                            minWidth: 48,
                            height: 48,
                            px: 1,
                            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)"} 
                        }}
                    >
                        <AddCircleIcon fontSize="medium" />
                    </Button>

                    <Button
                        color="inherit"
                        component={Link}
                        to="/notifications"
                        sx={{
                            ml: 1,
                            minWidth: 48,
                            height: 48,
                            px: 1,
                            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" }
                        }}
                    >
                        <Badge
                            color="error"
                            badgeContent={unreadCount}
                            invisible={unreadCount === 0}
                        >
                            <NotificationsIcon fontSize="medium" />
                        </Badge>
                    </Button>
                </>
            )}

            <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
                {isAuthenticated ? (
                    <>
                        <AccountCircleIcon fontSize="medium" sx={{ mr: 0.5 }} />
                        <Typography sx={{ mr: 2, fontSize: "0.9rem", opacity: 0.85 }}>
                            {userEmail}
                        </Typography>

                        <Button
                            color="inherit"
                            sx={{
                                minWidth: 48,
                                height: 48,
                                px: 1,
                                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" }
                            }}
                            onClick={() => {
                                window.location.href = `${AUTH_BASE_URL}/auth/logout`;
                            }}
                        >
                            <LogoutIcon fontSize="medium" />
                        </Button>
                    </>
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
            </Box>
        </Toolbar>
        </AppBar>
    );
}

export default NavBar;