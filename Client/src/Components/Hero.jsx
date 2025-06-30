import React, { useState } from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import heroImage from "../assets/heroImage.jpg";

const Hero = () => {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const { navigate } = useAppContext();

  const onSearch = (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) return alert("Please select check-in and check-out dates.");
    navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  return (
    <div
      className="relative h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-start justify-center h-full px-6 md:px-16 lg:px-24 xl:px-32 text-white">
        <p className="bg-[#FFD700]/90 text-black px-4 py-1 rounded-full text-sm">
          Royal Rudraksh Palace – Varanasi
        </p>

        <h1 className="font-playfair text-3xl md:text-5xl font-extrabold leading-tight max-w-xl mt-4">
          Where timeless tradition meets modern luxury
        </h1>

        <p className="text-sm md:text-base max-w-lg mt-4">
          Located near the sacred Ganges and Kashi Vishwanath Temple, our palace-style hotel offers a peaceful stay with elegant rooms, warm hospitality, and a true taste of Varanasi’s spiritual charm.
        </p>

        {/* Search Form */}
        <form
          onSubmit={onSearch}
          className="bg-white text-gray-800 rounded-xl px-6 py-5 mt-8 flex flex-col md:flex-row items-stretch gap-4 w-full max-w-4xl shadow-lg border-[2px] border-[#FFD700]"
        >
          {/* Check In */}
          <div className="flex-1">
            <label htmlFor="checkIn" className="text-sm font-medium text-gray-700 mb-1 block">
              Check-in
            </label>
            <input
              id="checkIn"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#FFD700]"
            />
          </div>

          {/* Check Out */}
          <div className="flex-1">
            <label htmlFor="checkOut" className="text-sm font-medium text-gray-700 mb-1 block">
              Check-out
            </label>
            <input
              id="checkOut"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#FFD700]"
            />
          </div>

          {/* Guests */}
          <div className="flex flex-col">
            <label htmlFor="guests" className="text-sm font-medium text-gray-700 mb-1">
              Guests
            </label>
            <input
              id="guests"
              type="number"
              min={1}
              max={4}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-24 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#FFD700]"
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="bg-black text-white px-6 py-3 rounded-md mt-1 font-semibold hover:brightness-110 transition w-full md:w-auto"
          >
            <div className="flex items-center gap-2 justify-center">
              <img src={assets.searchIcon} alt="search" className="h-5 invert" />
              <span>Search</span>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Hero;
