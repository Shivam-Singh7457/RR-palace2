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
          <Route path='/rooms' element={<AllRooms/>} />
          <Route path='/rooms/:id' element={<RoomDetails/>} />
          <Route path='/my-bookings' element={<MyBookings/>} /> 
          <Route path='/owner' element={<Layout/>}>
            <Route index element={<Dashboard/>} />
            <Route path="add-room" element={<AddRoom/>} />
            <Route path="list-room" element={<ListRooms/>} />
            <Route path="all" element={<AdminBookings/>} />
            <Route path="pending" element={<PendingBookings/>} />
          </Route>         
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

export default App;