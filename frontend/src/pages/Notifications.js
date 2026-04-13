import { useEffect, useState } from "react";
import { Box, Typography, Button, Divider } from "@mui/material";
import { getNotifications, markNotificationRead } from "../services/api";

const getColor = (type) => {
  switch (type) {
    case "WON":
      return "success.main";
    case "OUTBID":
      return "error.main";
    default:
      return "primary.main";
  }
};

const getIcon = (type) => {
  switch (type) {
    case "WON":
      return "🏆";
    case "OUTBID":
      return "⚠️";
    default:
      return "🔔";
  }
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

function Notifications({ onNotificationsUpdate }) {
  const [notifications, setNotifications] = useState([]);

  const load = async () => {
    try {
      const data = await getNotifications();
      if (data && data.error) {
        setNotifications([]);
        return;
      }

      setNotifications((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(data)) {
          return data;
        }
        return prev;
      });

      if (onNotificationsUpdate) {
        const unread = data.filter((n) => !n.read).length;
        onNotificationsUpdate(unread);
      }
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id) => {
    await markNotificationRead(id);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );

    if (onNotificationsUpdate) {
      onNotificationsUpdate((prev) => Math.max(prev - 1, 0));
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        py: 4
      }}
    >
      <Box sx={{ maxWidth: 900, mx: "auto", px: 2 }}>
        
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            mb: 2,
            textAlign: "center",
            color: "primary.main"
          }}
        >
          Notifications
        </Typography>

        <Button
          variant="outlined"
          size="small"
          onClick={load}
          sx={{
            display: "block",
            mx: "auto",
            mb: 2,
            borderColor: "primary.main",
            color: "primary.main",
            "&:hover": {
              borderColor: "primary.dark",
              backgroundColor: "rgba(90,62,43,0.05)"
            }
          }}
        >
          Refresh
        </Button>

        <Divider sx={{ mb: 3 }} />

        {notifications.length === 0 ? (
          <Typography align="center" sx={{ mt: 5 }} color="text.secondary">
            You're all caught up
          </Typography>
        ) : (
          notifications.map((n) => (
            <Box
              key={n.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                mb: 2,
                borderRadius: 3,
                backgroundColor: "#fff",
                borderLeft: `6px solid`,
                borderColor: getColor(n.type),
                boxShadow: 3,
                transition: "all 0.2s ease",
                opacity: n.read ? 0.7 : 1,

                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 5
                }
              }}
            >
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                
                <Typography fontSize="1.8rem">
                  {getIcon(n.type)}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {!n.read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        bgcolor: "error.main",
                        borderRadius: "50%"
                      }}
                    />
                  )}

                  <Box>
                    <Typography
                      sx={{
                        fontWeight: n.read ? "normal" : "bold"
                      }}
                    >
                      {n.message}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {n.createdAt ? timeAgo(n.createdAt) : ""}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {!n.read && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => markRead(n.id)}
                  sx={{
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      borderColor: "primary.dark",
                      backgroundColor: "rgba(90,62,43,0.05)"
                    }
                  }}
                >
                  Mark Read
                </Button>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

export default Notifications;