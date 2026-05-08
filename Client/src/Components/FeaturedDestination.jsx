import React from 'react';
import HotelCard from './HotelCard';
import Title from './Title';
import { useAppContext } from '../context/AppContext';

const FeaturedDestination = () => {
    const { rooms, navigate, loadingRooms } = useAppContext();

    return (
        <div className="flex flex-col items-center px-6 md:px-16 lg:px-24 bg-gradient-to-br from-blue-50 via-white to-pink-50 py-20 w-full">
            <Title
                title="Explore Rooms in This Hotel"
                subTitle="Handpicked luxury, comfort, and affordability – all under one roof."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-14 w-full">
                {loadingRooms ? (
                    // Skeleton/Loading State
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-[350px] bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
                             <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    ))
                ) : (
                    rooms.map((room, index) => (
                        <HotelCard key={room._id} room={room} index={index} />
                    ))
                )}
            </div>

            <div className="mt-16 flex flex-col items-center gap-4">
                {loadingRooms && (
                    <p className="text-sm text-blue-500 font-medium animate-pulse">
                        Finding the best rooms for you...
                    </p>
                )}
                
                <button
                    onClick={() => {
                        navigate('/rooms');
                        scrollTo(0, 0);
                    }}
                    className={`px-8 py-4 text-white font-bold rounded-xl shadow-lg transition-all duration-300 ${loadingRooms ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 active:scale-95'}`}
                    disabled={loadingRooms}
                >
                    {loadingRooms ? 'Searching...' : 'View All Rooms'}
                </button>
            </div>
        </div>
    );
};

export default FeaturedDestination;
