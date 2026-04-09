import { useEffect, useState } from "react";
import { Box, Typography, Button, Divider } from "@mui/material";
import { getNotifications, markNotificationRead } from "../services/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const load = async () => {
    try {
      const data = await getNotifications();
      if (data && data.error) {
        setNotifications([]);
        return;
      }
      setNotifications(data);
    } catch (e) {
      setNotifications([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await markNotificationRead(id);
    await load();
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
        <Typography>No notifications</Typography>
      ) : (
        notifications.map((n) => (
          <Box
            key={n.id}
            sx={{
              p: 2,
              mb: 1,
              border: "1px solid #ddd",
              borderRadius: 1,
              backgroundColor: n.read ? "#fff" : "#f0f7ff"
            }}
          >
            <Typography sx={{ fontWeight: n.read ? "normal" : "bold" }}>
              {n.type}
            </Typography>
            <Typography>{n.message}</Typography>
            <Typography variant="caption" color="text.secondary">
              {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
            </Typography>

            {!n.read ? (
              <Box sx={{ mt: 1 }}>
                <Button size="small" variant="contained" onClick={() => markRead(n.id)}>
                  Mark read
                </Button>
              </Box>
            ) : null}
          </Box>
        ))
      )}
    </Box>
  );
}

export default Notifications;
