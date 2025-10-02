// client/src/auth.js
export const auth = {
  login({ token, user }) {
    if (token) localStorage.setItem("token", token);
    if (user) localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("authChanged"));
  },
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChanged"));
  },
  get token() {
    return localStorage.getItem("token");
  },
  get user() {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  },
  get isLoggedIn() { return !!this.token; },
  get isAdmin() { return this.user?.role === "admin"; },
};
