import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.withCredentials = true; // Enable sending cookies

console.log("🌐 Axios Base URL:", axios.defaults.baseURL);
if (!axios.defaults.baseURL) {
  console.warn("⚠️ VITE_BACKEND_URL is undefined. Requests will be made to the frontend origin.");
}

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY || "Rupees";
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isOwner, setIsOwner] = useState(false);
  const [showHotelReg, setShowHotelReg] = useState(false);
  const [searchedCities, setSearchedCities] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Configure axios authorization header whenever token changes
  useEffect(() => {
    if (token) {
      console.log("🔑 Token found, setting Authorization header");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      console.log("🚫 No token, removing Authorization header");
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [token]);

  const fetchRooms = async (params = {}) => {
    setLoadingRooms(true);
    try {
      const { data } = await axios.get("/api/rooms", { params });
      if (data.success) {
        setRooms(data.rooms);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch rooms");
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchUser = async () => {
    if (!token) {
      setAuthLoading(false);
      return;
    }
    try {
      const { data } = await axios.get('/api/auth/profile');
      if (data.success) {
        setUser(data.user);
        setIsOwner(data.user.role === "hotelOwner");
        setSearchedCities(data.user.recentSearchedCities || []);
      } else {
        logout();
      }
    } catch (error) {
      console.error("🔴 Error in fetchUser:", error.message);
      logout();
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async (identifier, password) => {
    try {
      const { data } = await axios.post("/api/auth/login", { identifier, password });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        setIsOwner(data.user.role === "hotelOwner");
        toast.success("Logged in successfully");
        navigate("/");
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    }
  };

  const register = async (username, email, password, role) => {
    try {
      const { data } = await axios.post("/api/auth/register", { username, email, password, role });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        setIsOwner(data.user.role === "hotelOwner");
        toast.success("Registered successfully");
        navigate("/");
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");
    setIsOwner(false);
    localStorage.removeItem("token");
    axios.post("/api/auth/logout"); // Clear server-side cookie
    navigate("/login");
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const getToken = async () => {
    return token || localStorage.getItem("token");
  };

  const value = {
    currency,
    navigate,
    user,
    setUser,
    token,
    setToken,
    getToken,
    login,
    register,
    logout,
    isOwner,
    setIsOwner,
    axios,
    toast,
    showHotelReg,
    setShowHotelReg,
    searchedCities,
    setSearchedCities,
    rooms,
    setRooms,
    loadingRooms,
    fetchRooms,
    fetchUser,
    authLoading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
