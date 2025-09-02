// src/auth.js
export const auth = {
  get token() {
    return localStorage.getItem("token");
  },
  set token(v) {
    if (v) localStorage.setItem("token", v);
    else localStorage.removeItem("token");
  },
  get isLoggedIn() {
    return !!localStorage.getItem("token");
  },
  logout() {
    localStorage.removeItem("token");
  },
};
