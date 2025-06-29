import React from 'react';
import HotelCard from './HotelCard';
import Title from './Title';
import { useAppContext } from '../context/AppContext';

const FeaturedDestination = () => {
    const { rooms, navigate } = useAppContext();

    return (
        <div className="flex flex-col items-center px-6 md:px-16 lg:px-24 bg-gradient-to-br from-blue-50 via-white to-pink-50 py-20">
            <Title
                title="Explore Rooms in This Hotel"
                subTitle="Handpicked luxury, comfort, and affordability – all under one roof."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-14 w-full">
                {rooms.map((room, index) => (
                    <HotelCard key={room._id} room={room} index={index} />
                ))}
            </div>

            <button
                onClick={() => {
                    navigate('/rooms');
                    scrollTo(0, 0);
                }}
                className="mt-16 px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 rounded-xl shadow-md"
            >
                View All Rooms
            </button>
        </div>
    );
};

export default FeaturedDestination;
