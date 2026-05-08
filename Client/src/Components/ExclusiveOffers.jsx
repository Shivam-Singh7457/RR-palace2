import React from "react";
import Title from "./Title";
import { assets, exclusiveOffers } from "../assets/assets";

const ExclusiveOffers = () => {
  const hasOffers = exclusiveOffers && exclusiveOffers.length > 0;

  return (
    <div className='flex flex-col items-center px-4 sm:px-6 md:px-16 lg:px-24 xl:px-32 py-16 md:py-24'>
      <div className='flex flex-col md:flex-row items-center md:items-end justify-between w-full gap-6'>
        <Title
          align='left'
          title='Exclusive Offers'
          subTitle='Special treats just for our valued guests'
        />
        {hasOffers && (
          <button className="text-sm font-bold text-orange-600 uppercase tracking-widest hover:text-orange-700 transition-colors flex items-center gap-2">
            View All
            <img
              src={assets.arrowIcon}
              alt='arrow-icon'
              className='w-4 h-4'
            />
          </button>
        )}
      </div>

      {!hasOffers ? (
        <div className='w-full text-center text-gray-500 text-sm mt-12'>
          <p className="bg-gray-50 py-12 px-6 rounded-3xl border border-dashed border-gray-200 font-light italic">
            🛏️ No exclusive offers are available at the moment. Please check back soon!
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 w-full'>
          {exclusiveOffers.map((item) => (
            <div
              key={item._id}
              className='group relative flex flex-col items-start justify-end p-6 min-h-[320px] rounded-3xl text-white overflow-hidden shadow-xl'
            >
              {/* Background with Zoom Effect */}
              <div 
                className="absolute inset-0 bg-no-repeat bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <div className="relative z-10 w-full">
                <p className='inline-block px-3 py-1 mb-4 text-[10px] font-bold bg-orange-500 text-white rounded-full uppercase tracking-widest'>
                  {item.priceOff}% OFF
                </p>
                <p className='text-2xl font-bold font-playfair mb-2 leading-tight'>{item.title}</p>
                <p className="text-xs text-white/80 line-clamp-2 font-light">{item.description}</p>
                
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                   <p className='text-[9px] uppercase tracking-widest text-white/50'>Expires {item.expiryDate}</p>
                   <button className="text-xs font-bold uppercase tracking-widest text-white hover:text-orange-400 transition-colors">
                     Claim Now
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExclusiveOffers;
