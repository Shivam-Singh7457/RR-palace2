import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { assets, facilityIcons, roomCommonData} from "../assets/assets";
import StarRating from "../Components/StarRating";
import { useAppContext } from "../context/AppContext"
import toast from "react-hot-toast";

const RoomDetails = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const {rooms,getToken, axios } =useAppContext()
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [mainImage, setMainImage] = useState(null);
    const [checkInDate, setCheckInDate] = useState(searchParams.get("checkIn") || "");
    const [checkOutDate, setCheckOutDate] = useState(searchParams.get("checkOut") || "");
    const [guests, setGuests] = useState(searchParams.get("guests") || 1);
    const [isAvailable, setIsAvailable] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ average: 0, total: 0 });

    //checks availablity
    const checkAvailability = async ()=>{
        console.log("🔍 Checking availability for room:", id, { checkInDate, checkOutDate });
        try {
            setCheckingAvailability(true);
            if(checkInDate >= checkOutDate){
                console.warn("❌ Invalid dates: check-in >= check-out");
                toast.error('Check-In date should be less then Check-Out date')
                return; // Fixed: added return to prevent API call
            }
            const {data} = await axios.post('/api/bookings/check-availability', {room:id, checkInDate ,checkOutDate})
            console.log("📡 Availability response:", data);
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
            console.error("🔴 checkAvailability Error:", error);
            toast.error(error.message)
        } finally {
            setCheckingAvailability(false);
        }
    }

    // onsubmit handler func
    const onSubmitHandler = async(e)=>{
        try {
            e.preventDefault();
            if(!isAvailable){
                return checkAvailability();
            } else {
                setShowConfirmation(true);
            }
        } catch (error) {
            toast.error(error.message)            
        }
    }

    const confirmBooking = async () => {
        const bookingData = {
            room: id, 
            checkInDate, 
            checkOutDate, 
            guests, 
            paymentMethod: "Pay At Hotel"
        };
        console.log("🚀 Confirming booking with data:", bookingData);
        
        try {
            setLoading(true);
            const token = await getToken();
            console.log("🎟️ Token for booking:", token ? "Found (Truncated: " + token.substring(0, 10) + "...)" : "Not Found");

            const { data } = await axios.post('/api/bookings/book', bookingData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("📡 Booking response:", data);

            if (data.success) {
                console.log("✅ Booking successful, navigating to /my-bookings");
                toast.success(data.message);
                navigate('/my-bookings');
                window.scrollTo(0, 0);
            } else {
                console.warn("⚠️ Booking failed on server:", data.message);
                toast.error(data.message);
            }
        } catch (error) {
            console.error("🔴 confirmBooking Error:", error);
            console.error("🔴 Error Response:", error.response?.data);
            toast.error(error.message);
        } finally {
            setLoading(false);
            setShowConfirmation(false);
        }
    }

    const fetchRoomReviews = async () => {
        try {
            const { data } = await axios.get(`/api/reviews/room/${id}`);
            if (data.success) {
                setReviews(data.reviews);
                if (data.reviews.length > 0) {
                    const avg = data.reviews.reduce((acc, curr) => acc + curr.rating, 0) / data.reviews.length;
                    setReviewStats({ average: avg.toFixed(1), total: data.reviews.length });
                }
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    useEffect(() => {
        const foundRoom = rooms.find(room => room._id === id);
        if (foundRoom) {
            setRoom(foundRoom);
            setMainImage(foundRoom.images[0]);
        }
        fetchRoomReviews();
    }, [id, rooms]);

    useEffect(() => {
        if (checkInDate && checkOutDate) {
            checkAvailability();
        }
    }, [checkInDate, checkOutDate]);

    if (!room) return null;

    return (
        <div className="py-28 px-4 md:px-16 lg:px-24 xl:px-32">
            {/* Header Section */}
            <div className="flex flex-col gap-2 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <h1 className="text-3xl md:text-4xl font-playfair">
                        {room.roomType}
                    </h1>
                    <p className="text-xs text-white bg-orange-500 px-3 py-1 rounded-full font-semibold">20% OFF</p>
                </div>

                <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(reviewStats.average) || 5} />
                    <p className="text-sm text-gray-600 ml-2">{reviewStats.total}+ reviews</p>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                    <img src={assets.locationIcon} alt="location" className="h-4 w-4" />
                    <span className="text-sm">{room.hotel?.address || "Varanasi, India"}</span>
                </div>
            </div>

            {/* Image Section */}
            <div className="flex flex-col xl:flex-row gap-6">
                <div className="w-full xl:w-2/3">
                    <img src={mainImage} alt="Main Room" className="w-full aspect-[4/3] md:aspect-video rounded-2xl shadow-xl object-cover" />
                </div>
                <div className="grid grid-cols-4 xl:grid-cols-2 gap-3 w-full xl:w-1/3">
                    {room.images.length > 0 && room.images.map((image, index) => (
                        <img
                            key={index}
                            src={image}
                            onClick={() => setMainImage(image)}
                            className={`w-full h-20 sm:h-24 md:h-32 xl:h-full object-cover rounded-xl cursor-pointer transition-all duration-300 shadow-md ${mainImage === image ? 'ring-2 ring-orange-500 ring-offset-2' : 'hover:opacity-80'}`}
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
            <form onSubmit={onSubmitHandler} className="mt-14 bg-white p-5 md:p-8 rounded-2xl shadow-2xl max-w-6xl mx-auto flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 flex-grow">
                    <div className="flex-1">
                        <label htmlFor="checkInDate" className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-1 block">Check-In</label>
                        <input onChange={(e)=>setCheckInDate(e.target.value)}
                        value={checkInDate}
                        min={new Date().toISOString().split('T')[0]} 
                        type="date" id="checkInDate" className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none focus:border-orange-500 transition-colors bg-gray-50/50" required />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="checkOutDate" className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-1 block">Check-Out</label>
                        <input onChange={(e)=>setCheckOutDate(e.target.value)}
                        value={checkOutDate}
                        min={checkInDate} disabled = {!checkInDate} 
                        type="date" id="checkOutDate" className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none focus:border-orange-500 transition-colors bg-gray-50/50" required />
                    </div>
                    <div className='w-full md:w-32'>
                        <label htmlFor="guests" className="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-1 block">Guests</label>
                        <input onChange={(e)=>setGuests(e.target.value)} value={guests} type="number" id="guests" placeholder="1" className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none focus:border-orange-500 transition-colors bg-gray-50/50" required />
                    </div>
                </div>
                <button 
                    type="submit" 
                    disabled={checkingAvailability}
                    className="bg-black text-white px-10 py-4 rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg active:scale-[0.98] disabled:bg-gray-400 mt-2 xl:mt-0 h-[58px]"
                >
                    <div className="flex items-center justify-center gap-2">
                        {checkingAvailability && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        <span>{checkingAvailability ? "Checking..." : isAvailable ? "Book This Room" : "Check Availability"}</span>
                    </div>
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

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6 transform transition-all scale-100">
                        <div className="text-center">
                            <h2 className="text-2xl font-playfair font-bold text-gray-900">Confirm Your Stay</h2>
                            <p className="text-sm text-gray-500 mt-1">Please review your booking details</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                <span className="text-gray-500 text-sm">Room</span>
                                <span className="font-semibold text-gray-800">{room.roomType}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                <span className="text-gray-500 text-sm">Check-In</span>
                                <span className="font-semibold text-gray-800">{new Date(checkInDate).toDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                <span className="text-gray-500 text-sm">Check-Out</span>
                                <span className="font-semibold text-gray-800">{new Date(checkOutDate).toDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                <span className="text-gray-500 text-sm">Guests</span>
                                <span className="font-semibold text-gray-800">{guests}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-gray-900 font-bold">Total Amount</span>
                                <span className="text-xl font-bold text-orange-600">₹ {room.pricePerNight * Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 3600 * 24))}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={confirmBooking}
                                disabled={loading}
                                className="btn-premium w-full py-4 text-base"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                                {loading ? "Booking..." : "Confirm & Book Now"}
                            </button>
                            <button 
                                onClick={() => !loading && setShowConfirmation(false)}
                                disabled={loading}
                                className={`w-full text-gray-500 py-2 text-sm transition-colors ${loading ? "opacity-50 cursor-not-allowed" : "hover:text-gray-800"}`}
                            >
                                Go back and edit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews Section */}
            <div className="mt-24 space-y-12">
                <div className="border-b border-gray-200 pb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-playfair font-bold text-gray-900">Guest Experiences</h2>
                        <p className="text-gray-500 mt-2">What our visitors have to say about their stay</p>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-bold text-gray-900">{reviewStats.average || "5.0"}</p>
                        <div className="flex text-orange-500 text-sm">★★★★★</div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">{reviewStats.total} Reviews</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {reviews.length === 0 ? (
                        <p className="text-gray-400 italic">No reviews yet for this room. Be the first to share your experience!</p>
                    ) : (
                        reviews.map((review) => (
                            <div key={review._id} className="bg-gray-50/50 p-8 rounded-3xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <img src={review.userImage || assets.profile_icon} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{review.userName}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex text-orange-500 text-xs">
                                        {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= review.rating ? "★" : "☆"}</span>)}
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed italic">"{review.experience}"</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoomDetails;
