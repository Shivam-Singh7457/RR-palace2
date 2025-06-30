import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { assets, facilityIcons, roomCommonData} from "../assets/assets";
import StarRating from "../Components/StarRating";
import { useAppContext } from "../context/AppContext"
import toast from "react-hot-toast";

const RoomDetails = () => {
    const { id } = useParams();
    const {rooms,getToken, axios , navigate} =useAppContext()
    const [room, setRoom] = useState(null);
    const [mainImage, setMainImage] = useState(null);
    const [checkInDate, setCheckInDate] = useState(null);
    const [checkOutDate, setCheckOutDate] = useState(null);
    const [guests, setGuests] = useState(1);
    const [isAvailable, setIsAvailable] = useState(false);

    //checks availablity
    const checkAvailability = async ()=>{
        try {
            if(checkInDate >= checkOutDate){
                toast.error('Check-In date should be less then Check-Out date')
            }
            const {data} = await axios.post('/api/bookings/check-availability', {room:id, checkInDate ,checkOutDate})
            if(data.success){
                if(data.isAvailable){
                    setIsAvailable(true)
                    toast.success('Room is Available')
                }else{
                    setIsAvailable(false)
                    toast.error('Room is not Available')
                }
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // onsubmit handler func
    const onSubmitHandler = async(e)=>{
        try {
            e.preventDefault();
            if(!isAvailable){
                return checkAvailability();
            }else{
                const {data} = await axios.post('/api/bookings/book', {room: id, checkInDate , checkOutDate, guests, paymentMethod: "Pay At Hotel"},{headers: {Authorization: `Bearer ${await getToken()}`}})
                if(data.success){
                    toast.success(data.message)
                    navigate('/my-bookings')
                    scrollTo(0,0)
                }else{
                    toast.error(data.message)
                }
            }

        } catch (error) {
            toast.error(error.message)            
        }
    }

    useEffect(() => {
        const foundRoom = rooms.find(room => room._id === id);
        if (foundRoom) {
            setRoom(foundRoom);
            setMainImage(foundRoom.images[0]);
        }
    }, [id]);

    if (!room) return null;

    return (
        <div className="py-28 px-4 md:px-16 lg:px-24 xl:px-32">
            {/* Header Section */}
            <div className="flex flex-col gap-2 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <h1 className="text-3xl md:text-4xl font-playfair">
                        {room.hotel.name}
                        <span className="block text-sm font-inter text-gray-600 ml-2">{room.roomType}</span>
                    </h1>
                    <p className="text-xs text-white bg-orange-500 px-3 py-1 rounded-full font-semibold">20% OFF</p>
                </div>

                <div className="flex items-center gap-2">
                    <StarRating />
                    <p className="text-sm text-gray-600 ml-2">200+ reviews</p>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                    <img src={assets.locationIcon} alt="location" className="h-4 w-4" />
                    <span className="text-sm">{room.hotel.address}</span>
                </div>
            </div>

            {/* Image Section */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/2">
                    <img src={mainImage} alt="Main Room" className="w-full rounded-xl shadow-lg object-cover" />
                </div>
                <div className="grid grid-cols-2 gap-4 w-full lg:w-1/2">
                    {room.images.length > 1 && room.images.map((image, index) => (
                        <img
                            key={index}
                            src={image}
                            onClick={() => setMainImage(image)}
                            className={`w-full h-full object-cover rounded-xl cursor-pointer transition-all duration-200 shadow-md ${mainImage === image ? 'outline outline-2 outline-orange-500' : ''}`}
                        />
                    ))}
                </div>
            </div>

            {/* Amenities + Price */}
            <div className="flex flex-col lg:flex-row justify-between mt-10 gap-6">
                <div className="flex flex-wrap gap-4">
                    {room.amenities.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
                            <img src={facilityIcons[item]} alt={item} className="w-5 h-5" />
                            <p className="text-sm">{item}</p>
                        </div>
                    ))}
                </div>
                <div className="text-2xl font-semibold text-gray-800"> ₹ {room.pricePerNight} / night</div>
            </div>

            {/* Availability Form */}
            <form onSubmit={onSubmitHandler} className="mt-14 bg-white p-6 rounded-xl shadow-xl max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto">
                    <div>
                        <label htmlFor="checkInDate" className="font-medium text-sm">Check-In</label>
                        <input onChange={(e)=>setCheckInDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]} 
                        type="date" id="checkInDate" className="w-full border border-gray-300 px-3 py-2 mt-1 rounded-md outline-none" required />
                    </div>
                    <div>
                        <label htmlFor="checkOutDate" className="font-medium text-sm">Check-Out</label>
                        <input onChange={(e)=>setCheckOutDate(e.target.value)}
                        min={checkInDate} disabled = {!checkInDate} 
                        type="date" id="checkOutDate" className="w-full border border-gray-300 px-3 py-2 mt-1 rounded-md outline-none" required />
                    </div>
                    <div className='flex flex-col'>
                        <label htmlFor="guests" className="font-medium text-sm">Guests</label>
                        <input onChange={(e)=>setGuests(e.target.value)} value={guests} type="number" id="guests" placeholder="1" className="w-20 border border-gray-300 px-3 py-2 mt-1 rounded-md outline-none" required />
                    </div>
                </div>
                <button type="submit" className="bg-primary text-white px-8 py-3 rounded-md hover:bg-primary-dull transition">
                    {isAvailable ? "Book Now" : "Check Availability"}
                </button>
            </form>

            {/* Description Section */}
            <div className="mt-16 space-y-6">
                {roomCommonData.map((spec, index) => (
                    <div key={index} className="flex gap-4 items-start">
                        <img src={spec.icon} alt="icon" className="w-6 h-6 mt-1" />
                        <div>
                            <p className="font-semibold text-base">{spec.title}</p>
                            <p className="text-sm text-gray-500">{spec.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Notice Section */}
            <div className="max-w-3xl border-y border-gray-300 my-12 py-6 text-sm text-gray-600">
                Guests are allocated rooms as per availability.
            </div>
        </div>
    );
};

export default RoomDetails;
