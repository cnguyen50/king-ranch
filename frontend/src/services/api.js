const BASE_URL = "";

const fetchJson = async (url, options) => {
    const res = await fetch(url, {
        credentials: "include",
        ...options
    });
    return res;
};

const readErrorMessage = async (res) => {
    try {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            const data = await res.json();
            if (data && typeof data.error === "string") return data.error;
            return JSON.stringify(data);
        }
        const text = await res.text();
        return text || `Request failed (${res.status})`;
    } catch {
        return `Request failed (${res.status})`;
    }
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

export const createImageUpload = async (contentType) => {
    const res = await fetchJson(`${BASE_URL}/uploads/image`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ contentType })
    });

    if (!res.ok) {
        const msg = await readErrorMessage(res);
        const prefix = res.status === 401 ? "Unauthorized" : `Error ${res.status}`;
        throw new Error(`${prefix}: ${msg}`);
    }

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
        const msg = await readErrorMessage(res);
        const prefix = res.status === 401 ? "Unauthorized" : `Error ${res.status}`;
        throw new Error(`${prefix}: ${msg}`);
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