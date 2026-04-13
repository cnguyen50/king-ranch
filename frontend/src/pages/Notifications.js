import { useEffect, useState } from "react";
import { Box, Typography, Button, Divider } from "@mui/material";
import { getNotifications, markNotificationRead } from "../services/api";

const getColor = (type) => {
  switch (type) {
    case "WON":
      return "#4caf50";
    case "OUTBID":
      return "#f44336";
    default:
      return "#2196f3";
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

    const interval = setInterval(() => {
      load();
    }, 5000);

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
    <Box sx={{ p: 3, maxWidth: 900, margin: "0 auto" }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
        Notifications
      </Typography>

      <Button variant="outlined" size="small" onClick={load}>
        Refresh
      </Button>

      <Divider sx={{ my: 2 }} />

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
              borderRadius: 2,
              backgroundColor: n.read ? "#f5f5f5" : "#fff",
              borderLeft: `6px solid ${getColor(n.type)}`,
              boxShadow: 2,
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 4
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
                      bgcolor: "#f44336",
                      borderRadius: "50%",
                      boxShadow: "0 0 6px rgba(244,67,54,0.6)"
                    }}
                  />
                )}

                <Box>
                  <Typography sx={{ fontWeight: n.read ? "normal" : "bold" }}>
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
              >
                Mark Read
              </Button>
            )}
          </Box>
        ))
      )}
    </Box>
  );
}

export default Notifications;