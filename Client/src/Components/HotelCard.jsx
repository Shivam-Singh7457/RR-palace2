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
      className="group relative w-full max-w-xl mx-auto bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col"
    >
      {/* Room Image with overlay */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt="Room"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
          <span className="text-white text-sm font-medium">View Detailed Amenities →</span>
        </div>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
          <p className="text-xs font-bold text-orange-600 tracking-wider uppercase">Top Choice</p>
        </div>
      </div>

      {/* Room Info */}
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900 font-playfair group-hover:text-orange-600 transition-colors">
            {room.roomType || "Deluxe Room"}
          </h2>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-[0.2em]">{room.hotel?.city || "Varanasi"}</p>
        </div>

        {/* Room Amenities - Pills instead of list */}
        <div className="flex flex-wrap gap-2">
          {amenities.slice(0, 3).map((item, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-md border border-gray-100 uppercase tracking-wider">
              {item}
            </span>
          ))}
        </div>

        {/* Price & CTA */}
        <div className="flex justify-between items-center pt-4 mt-auto border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Price per night</span>
            <p className="text-xl font-bold text-gray-900">
              ₹{room.pricePerNight}
            </p>
          </div>
          <div className="btn-premium">
            Book Now
          </div>
        </div>
      </div>
    </Link>
  );
};

export default HotelCard;
