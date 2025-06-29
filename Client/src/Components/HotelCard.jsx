import React from "react";
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

const HotelCard = ({ room }) => {
  const image = room?.images?.[0] || "https://via.placeholder.com/800x500?text=RR+Palace";

  const amenities = room?.amenities || ["Free Wi-Fi", "AC Room", "Hot Water", "TV"];

  return (
    <Link
      to={`/rooms/${room._id}`}
      onClick={() => scrollTo(0, 0)}
      className="relative w-full max-w-xl mx-auto bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-yellow-400"
    >
      {/* Room Image */}
      <img
        src={image}
        alt="Room"
        className="w-full h-64 object-cover"
      />

      {/* Room Info */}
      <div className="p-5 space-y-2">
        {/* Room Title */}
        <h2 className="text-xl font-semibold text-yellow-700 font-playfair">
          {room.roomType || "Deluxe Room"}
        </h2>

        {/* Hotel Name */}
        <p className="text-sm text-gray-500 italic">RR Palace, Varanasi</p>

        {/* Room Amenities */}
        <ul className="list-disc list-inside text-sm text-gray-600">
          {amenities.slice(0, 4).map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>

        {/* Price & CTA */}
        <div className="flex justify-between items-center pt-3">
          <p className="text-lg font-semibold text-gray-800">
            ₹{room.pricePerNight}
            <span className="text-sm text-gray-500"> /night</span>
          </p>
          <button className="px-5 py-2 text-sm font-medium border border-yellow-600 text-yellow-700 rounded-full hover:bg-yellow-100 transition-all">
            Book Now
          </button>
        </div>
      </div>
    </Link>
  );
};

export default HotelCard;
