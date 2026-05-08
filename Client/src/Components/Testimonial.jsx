import React from "react";
import Title from "./Title";
import { testimonials as fallbackTestimonials } from "../assets/assets";
import StarRating from "./StarRating";
import { useAppContext } from "../context/AppContext";
import { useEffect, useState } from "react";

const Testimonial=()=>{
    const { axios } = useAppContext();
    const [displayReviews, setDisplayReviews] = useState([]);

    const getInitials = (name) => {
        if (!name) return "G";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const getRandomColor = (name) => {
        const colors = [
            'bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 
            'bg-rose-500', 'bg-amber-500', 'bg-emerald-500',
            'bg-cyan-500', 'bg-fuchsia-500'
        ];
        // Use name to consistently pick a color
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data } = await axios.get("/api/reviews/latest");
                if (data.success && data.reviews.length > 0) {
                    const mapped = data.reviews.map(r => ({
                        id: r._id,
                        name: r.userName || "Guest",
                        address: r.room?.roomType || "Previous Guest",
                        review: r.experience,
                        rating: r.rating
                    }));
                    setDisplayReviews(mapped);
                } else {
                    setDisplayReviews(fallbackTestimonials);
                }
            } catch (error) {
                setDisplayReviews(fallbackTestimonials);
            }
        };
        fetchReviews();
    }, []);

    return (
        <div className='flex flex-col items-center px-6 md:px-16 lg:px-24 bg-slate-50 pt-20 pb-30'>
            <Title title="What Our Guests Say" subTitle="Discover why discerning travelers consistently choose RR palace for their exclusive and luxurious accomodations around the world" />

            <div className="flex flex-wrap items-center justify-center gap-6 mt-20">
                {displayReviews.map((testimonial) => (
                    <div key={testimonial.id} className="bg-white p-6 rounded-xl shadow w-full md:w-[350px] min-h-[220px] flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ${getRandomColor(testimonial.name)}`}>
                                    {getInitials(testimonial.name)}
                                </div>
                                <div>
                                    <p className="font-playfair text-lg font-bold text-gray-800">{testimonial.name}</p>
                                    <p className="text-xs text-orange-500 uppercase tracking-widest">{testimonial.address}</p>
                                </div>
                            </div>
                            <p className="text-gray-500 mt-6 text-sm italic leading-relaxed">"{testimonial.review}"</p>
                        </div>
                        <div className="flex items-center gap-1 mt-6 border-t border-gray-100 pt-4">
                           <StarRating rating={testimonial.rating || 5} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Testimonial;