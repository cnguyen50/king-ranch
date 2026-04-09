const BASE_URL = "http://localhost:3001";

const fetchJson = async (url, options) => {
    const res = await fetch(url, {
        credentials: "include",
        ...options
    });
    return res;
};

export const getUsers = async () => {
    const res = await fetchJson(`${BASE_URL}/users`);
    return res.json();
};

export const createUser = async (data) => {
    const res = await fetchJson(`${BASE_URL}/users`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const getMe = async () => {
    const res = await fetchJson(`${BASE_URL}/auth/me`);
    return res.json();
};

export const getNotifications = async () => {
    const res = await fetchJson(`${BASE_URL}/notifications`);
    return res.json();
};

export const markNotificationRead = async (id) => {
    const res = await fetchJson(`${BASE_URL}/notifications/${id}/read`, {
        method: "POST"
    });
    return res.json();
};

export const getListings = async () => {
    const res = await fetchJson(`${BASE_URL}/listings`);
    return res.json();
};

export const createListing = async (data) => {
    const res = await fetchJson(`${BASE_URL}/listings`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const text = await res.text(); // handle HTML error (413)
        console.error("Server error:", text);
        throw new Error("Failed to create listing");
    }

    return res.json();
};

export const placeBid = async (id, data) => {
    const res = await fetchJson(`${BASE_URL}/listings/${id}/bid`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const closeAuction = async (id) => {
    const res = await fetchJson(`${BASE_URL}/listings/${id}/close`, {
        method: "POST"
    });
    return res.json();
};