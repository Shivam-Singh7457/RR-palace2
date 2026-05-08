import React from "react";
import Navbar from "../Components/Navbar";
import { useLocation } from "react-router-dom";
import Home from "./Home";
import { Routes,Route } from "react-router-dom";
import Footer from "../Components/Footer";
import AllRooms from "./AllRooms";
import MyBookings from "./MyBookings";
import Layout from "./hotelOwner/Layout";
import Dashboard from "./hotelOwner/Dashboard";
import AddRoom from "./hotelOwner/AddRoom";
import ListRooms from "./hotelOwner/ListRooms";
import {Toaster} from 'react-hot-toast';
import { useAppContext } from "../context/AppContext";
import RoomDetails from "./RoomDetails";
import Contact from "./Contact";
import Amenities from "./Amenities";
import AdminBookings from "./hotelOwner/AdminBooking";
import PendingBookings from "./hotelOwner/PendingBooking";
import AdminReviews from "./hotelOwner/AdminReviews";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import VerifyOTP from "./VerifyOTP";
import ResetPassword from "./ResetPassword";

// Helper component to handle Google OAuth callback success
const LoginSuccess = () => {
  const { setToken, fetchUser, navigate } = useAppContext();
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      setToken(token);
      fetchUser(); // Explicitly trigger profile fetch
      navigate("/");
    } else {
      navigate("/login");
    }
  }, []);
  return <div className="h-screen flex items-center justify-center font-light text-gray-500">Completing sign in...</div>;
};

const App=()=>{
  const isOwnerPath=useLocation().pathname.includes("owner");
  return (
    <div>
      <Toaster />
      {!isOwnerPath && <Navbar />}
      <div className='min-h-[70vh]'>
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/amenities" element={<Amenities />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login-success" element={<LoginSuccess />} />
          <Route path='/rooms' element={<AllRooms/>} />
          <Route path='/rooms/:id' element={<RoomDetails/>} />
          <Route path='/my-bookings' element={<MyBookings/>} /> 
          <Route path='/owner' element={<Layout/>}>
            <Route index element={<Dashboard/>} />
            <Route path="add-room" element={<AddRoom/>} />
            <Route path="list-room" element={<ListRooms/>} />
            <Route path="all" element={<AdminBookings/>} />
            <Route path="pending" element={<PendingBookings/>} />
            <Route path="reviews" element={<AdminReviews/>} />
          </Route>         
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

export default App;