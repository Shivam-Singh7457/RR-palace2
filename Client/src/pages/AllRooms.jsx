import { useEffect, useState, useMemo } from "react";
import { assets, facilityIcons } from "../assets/assets";
import { useNavigate, useSearchParams } from "react-router-dom";
import StarRating from "../Components/StarRating";
import { useAppContext } from "../context/AppContext";
import LoadingScreen from "../Components/LoadingScreen";


const CheckBox = ({ label, selected = false, onChange = () => {} }) => {
    return (
        <label className='flex gap-3 items-center cursor-pointer py-2 group'>
            <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selected ? 'bg-[#b8860b] border-[#b8860b]' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                {selected && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <input type="checkbox" className="hidden" checked={selected} onChange={(e) => onChange(e.target.checked, label)} />
            <span className={`text-sm select-none transition-colors ${selected ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{label}</span>
        </label>
    )
}

const RadioButton = ({ label, selected = false, onChange = () => {} }) => {
    return (
        <label className='flex gap-3 items-center cursor-pointer py-2 group'>
            <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${selected ? 'border-[#b8860b]' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                {selected && <div className="w-2.5 h-2.5 bg-[#b8860b] rounded-full scale-100 transition-transform"></div>}
            </div>
            <input type="radio" className="hidden" name="sortOption" checked={selected} onChange={() => onChange(label)} />
            <span className={`text-sm select-none transition-colors ${selected ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{label}</span>
        </label>
    )
}

const AllRooms = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const { rooms, navigate, currency, fetchRooms, loadingRooms } = useAppContext();

    useEffect(() => {
        const checkIn = searchParams.get('checkIn');
        const checkOut = searchParams.get('checkOut');
        if (checkIn && checkOut) {
            fetchRooms({ checkIn, checkOut });
        } else {
            fetchRooms();
        }
    }, [searchParams]);

    const [openFilters, setOpenFilters] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({
        roomType: [],
        priceRange: [],
    });
    const [selectedSort, setSelectedSort] = useState('')

    const roomTypes = [
        "Double Bed",
        "Twin Double Bed",
        "Double Bed with AC",
        "Twin Double Bed with AC",
    ];

    const priceRanges = [
        '0 to 500',
        '500 to 1000',
        '1000 to 2000',
        '2000 to 3000',
    ];

    const sortOptions = [
        "Price Low to High",
        "Price High to Low",
        "Newest first"
    ];

    const handleFilterChange = (checked, value, type) => {
        setSelectedFilters((prevFilters) => {
            const updatedFilters = { ...prevFilters };
            if (checked) {
                updatedFilters[type].push(value);
            } else {
                updatedFilters[type] = updatedFilters[type].filter(item => item !== value);
            }
            return updatedFilters;
        })
    }

    const handleSortChange = (sortOption) => {
        setSelectedSort(sortOption);
    }

    const matchesRoomType = (room) => {
        return selectedFilters.roomType.length === 0 || selectedFilters.roomType.includes(room.roomType);
    }

    const matchesPriceRange = (room) => {
        return selectedFilters.priceRange.length === 0 || selectedFilters.priceRange.some(range => {
            const [min, max] = range.split(' to ').map(Number);
            return room.pricePerNight >= min && room.pricePerNight <= max;
        })
    }

    const sortRooms = (a, b) => {
        if (selectedSort === 'Price Low to High') return a.pricePerNight - b.pricePerNight
        if (selectedSort === 'Price High to Low') return b.pricePerNight - a.pricePerNight
        if (selectedSort === 'Newest first') return new Date(b.createdAt) - new Date(a.createdAt)
        return 0
    }

    const filterDestination = (room) => {
        const destination = searchParams.get('destination');
        if (!destination) return true;
        return room.hotel.city.toLowerCase().includes(destination.toLowerCase())
    }

    const filteredRooms = useMemo(() => {
        return rooms.filter(room => matchesRoomType(room) && matchesPriceRange(room) && filterDestination(room)).sort(sortRooms);
    }, [rooms, selectedFilters, selectedSort, searchParams])

    const clearFilters = () => {
        setSelectedFilters({
            roomType: [],
            priceRange: [],
        });
        setSelectedSort('');
        setSearchParams({});
    }

    return (
        <div className='flex flex-col-reverse lg:flex-row items-start justify-between pt-28 md:pt-35 px-4 md:px-16 lg:px-24 gap-12'>
            <div className="flex-1 w-full">
                <div className='flex flex-col items-start text-left mb-10'>
                    <h1 className='font-playfair text-4xl md:text-[45px] text-gray-900'>Discover Your Stay</h1>
                    <p className='text-sm md:text-base text-gray-500 mt-3 max-w-2xl font-light'>
                        Browse through our collection of premium rooms at RR Palace. Use the filters to find the perfect fit for your comfort and budget.
                    </p>
                </div>

                {loadingRooms ? (
                    <LoadingScreen />
                ) : filteredRooms.length === 0 ? (
                    <div className="py-20 text-center w-full bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 text-lg">No rooms match your filters.</p>
                        <button onClick={clearFilters} className="mt-4 text-[#b8860b] font-semibold hover:underline">Clear all filters</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredRooms.map((room) => (
                            <div 
                                key={room._id} 
                                className='group flex flex-col md:flex-row items-stretch py-6 md:py-8 gap-5 md:gap-8 border-b border-gray-100 last:border-0 hover:bg-gray-50/30 transition-all duration-500 rounded-3xl px-3 md:px-4'
                            >
                                {/* Image Section */}
                                <div className="relative w-full md:w-2/5 aspect-[16/10] sm:aspect-video md:aspect-[4/3] overflow-hidden rounded-2xl shadow-md shrink-0">
                                    <img 
                                        onClick={() => {
                                            const checkIn = searchParams.get('checkIn');
                                            const checkOut = searchParams.get('checkOut');
                                            const guests = searchParams.get('guests');
                                            let url = `/rooms/${room._id}`;
                                            if (checkIn && checkOut) url += `?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests || 1}`;
                                            navigate(url); 
                                            scrollTo(0, 0);
                                        }}
                                        src={room.images[0]} 
                                        alt={room.roomType} 
                                        className='w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110' 
                                    />
                                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                                        <p className="text-[10px] font-bold text-orange-600 tracking-wider uppercase">Premium Room</p>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className='w-full md:w-3/5 flex flex-col gap-2 py-1'>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h2 
                                                className='text-2xl md:text-3xl font-playfair font-bold text-gray-900 cursor-pointer hover:text-orange-600 transition-colors leading-tight' 
                                                onClick={() => {
                                                    const checkIn = searchParams.get('checkIn');
                                                    const checkOut = searchParams.get('checkOut');
                                                    const guests = searchParams.get('guests');
                                                    let url = `/rooms/${room._id}`;
                                                    if (checkIn && checkOut) url += `?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests || 1}`;
                                                    navigate(url); 
                                                    scrollTo(0, 0);
                                                }}
                                            >
                                                {room.roomType}
                                            </h2>
                                            <div className='flex items-center gap-1'>
                                                <StarRating rating={5} />
                                                <span className='text-[10px] text-gray-400 ml-2 uppercase tracking-widest'>Highly Rated</span>
                                            </div>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <p className="text-2xl font-bold text-gray-900">₹{room.pricePerNight}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Per Night</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 line-clamp-2 md:line-clamp-3 font-light leading-relaxed mt-1">
                                        Experience ultimate comfort in our {room.roomType}. Featuring premium linens, elegant decor, and state-of-the-art amenities at RR Palace.
                                    </p>

                                    {/* Amenities */}
                                    <div className='flex flex-wrap items-center mt-3 mb-4 gap-2'>
                                        {room.amenities.slice(0, 3).map((item, index) => (
                                            <div key={index} className='flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100'>
                                                <img src={facilityIcons[item]} alt={item} className='w-3 h-3 opacity-60' /> 
                                                <p className='text-[9px] font-bold text-gray-500 uppercase tracking-wider'>{item}</p>
                                            </div>
                                        ))}
                                        {room.amenities.length > 3 && (
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">+{room.amenities.length - 3} more</p>
                                        )}
                                    </div>

                                    {/* Mobile Price & Desktop Button */}
                                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50 md:border-t-0 md:pt-0">
                                        <div className="sm:hidden">
                                            <p className="text-xl font-bold text-gray-900">₹{room.pricePerNight}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Per Night</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const checkIn = searchParams.get('checkIn');
                                                const checkOut = searchParams.get('checkOut');
                                                const guests = searchParams.get('guests');
                                                let url = `/rooms/${room._id}`;
                                                if (checkIn && checkOut) url += `?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests || 1}`;
                                                navigate(url); 
                                                scrollTo(0, 0);
                                            }}
                                            className="bg-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-900 transition-all shadow-lg active:scale-95"
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Redesigned Filters Sidebar */}
            <div className='w-full lg:w-80 shrink-0'>
                <div className='lg:sticky lg:top-32 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100 overflow-hidden'>
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
                        <p className='text-sm font-bold text-gray-900 tracking-widest uppercase'>Filters</p>
                        <button 
                            onClick={clearFilters}
                            className='text-[10px] font-bold text-[#b8860b] hover:text-[#966b05] uppercase tracking-tighter'
                        >
                            Reset All
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Room Type */}
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-4'>Room Type</p>
                            <div className="space-y-1">
                                {roomTypes.map((type, index) => (
                                    <CheckBox 
                                        key={index} 
                                        label={type} 
                                        selected={selectedFilters.roomType.includes(type)} 
                                        onChange={(checked) => handleFilterChange(checked, type, 'roomType')} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-4'>Price Range</p>
                            <div className="space-y-1">
                                {priceRanges.map((range, index) => (
                                    <CheckBox 
                                        key={index} 
                                        label={`${currency} ${range}`} 
                                        selected={selectedFilters.priceRange.includes(range)} 
                                        onChange={(checked) => handleFilterChange(checked, range, 'priceRange')} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Sort By */}
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-widest mb-4'>Sort By</p>
                            <div className="space-y-1">
                                {sortOptions.map((option, index) => (
                                    <RadioButton 
                                        key={index} 
                                        label={option} 
                                        selected={selectedSort === option} 
                                        onChange={() => handleSortChange(option)} 
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AllRooms;