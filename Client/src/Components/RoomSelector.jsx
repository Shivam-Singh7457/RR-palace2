import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const RoomSelector = ({ category, checkIn, checkOut, onRoomSelect }) => {
    const { rooms, axios, getToken } = useAppContext();
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filter rooms of the selected category
    const categoryRooms = rooms.filter(r => r.roomType === category);

    const checkSpecificAvailability = async () => {
        if (!checkIn || !checkOut) return;
        setLoading(true);
        try {
            const { data } = await axios.get("/api/rooms", { 
                params: { checkIn, checkOut } 
            });
            if (data.success) {
                // Map available room IDs for quick lookup
                const availableIds = data.rooms.map(r => r._id);
                setAvailableRooms(availableIds);
            }
        } catch (error) {
            console.error("Error checking specific availability:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSpecificAvailability();
    }, [category, checkIn, checkOut, rooms]);

    const handleRoomClick = async (room) => {
        if (!availableRooms.includes(room._id)) return;

        try {
            const { data } = await axios.post("/api/rooms/lock", 
                { roomId: room._id, checkIn, checkOut },
                { headers: { Authorization: `Bearer ${await getToken()}` } }
            );

            if (data.success) {
                setSelectedRoom(room._id);
                onRoomSelect(room);
                toast.success(`Room ${room.roomNumber} selected!`);
            } else {
                toast.error(data.message);
                checkSpecificAvailability(); // Refresh
            }
        } catch (error) {
            toast.error("Failed to select room");
        }
    };

    return (
        <div className="mt-8">
            <p className="font-semibold text-lg mb-4">Select a Specific Room</p>
            {loading ? (
                <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-16 h-16 bg-orange-50 border-2 border-orange-100 animate-pulse rounded-xl flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-orange-400 font-medium animate-pulse">Checking live availability in Varanasi...</p>
                </div>
            ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                    {categoryRooms.map((room) => {
                        const isAvailable = availableRooms.includes(room._id);
                        const isSelected = selectedRoom === room._id;

                        return (
                            <button
                                key={room._id}
                                disabled={!isAvailable}
                                onClick={() => handleRoomClick(room)}
                                className={`
                                    relative h-16 w-16 flex flex-col items-center justify-center rounded-xl border-2 transition-all
                                    ${isSelected 
                                        ? "border-orange-500 bg-orange-50 text-orange-700 shadow-md scale-105" 
                                        : isAvailable 
                                            ? "border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700" 
                                            : "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"}
                                `}
                            >
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">No.</span>
                                <span className="text-lg font-bold">{room.roomNumber}</span>
                                {!isAvailable && (
                                    <span className="absolute -bottom-2 bg-gray-800 text-white text-[8px] px-1.5 py-0.5 rounded uppercase">Full</span>
                                )}
                                {isSelected && (
                                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
            <p className="text-xs text-gray-400 mt-4 italic">
                * Selected room will be held for 5 minutes.
            </p>
        </div>
    );
};

export default RoomSelector;
