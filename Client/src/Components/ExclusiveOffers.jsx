import React from "react";
import Title from "./Title";
import { assets, exclusiveOffers } from "../assets/assets";

const ExclusiveOffers = () => {
  const hasOffers = exclusiveOffers && exclusiveOffers.length > 0;

  return (
    <div className='flex flex-col items-center px-6 md:px-16 lg:px-24 xl:px-32 pt-20 pb-30'>
      <div className='flex flex-col md:flex-row items-center justify-between w-full'>
        <Title
          align='left'
          title='Exclusive Offers'
          subTitle='This is an extra treat from our side only for our customers.'
        />
        {hasOffers && (
          <button className='group flex items-center gap-2 font-medium cursor-pointer max-md:mt-12'>
            View All Offers
            <img
              src={assets.arrowIcon}
              alt='arrow-icon'
              className='group-hover:translate-x-1 transition-all'
            />
          </button>
        )}
      </div>

      {!hasOffers ? (
        <div className='w-full text-center text-gray-500 text-sm mt-16'>
          <p className="bg-gray-100 py-8 px-6 rounded-xl">
            🛏️ No exclusive offers are available at the moment. Please check back soon!
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12'>
          {exclusiveOffers.map((item) => (
            <div
              key={item._id}
              className='group relative flex flex-col items-start justify-between gap-1 pt-12 md:pt-18 px-4 rounded-xl text-white bg-no-repeat bg-cover bg-center'
              style={{ backgroundImage: `url(${item.image})` }}
            >
              <p className='px-3 py-1 absolute top-4 text-xs bg-white text-gray-800 font-medium rounded-full'>
                {item.priceOff}% OFF
              </p>
              <div>
                <p className='text-2xl font-medium font-playfair'>{item.title}</p>
                <p>{item.description}</p>
                <p className='text-xs text-white/70 mt-3'>Expires {item.expiryDate}</p>
              </div>
              <button className='flex items-center gap-2 font-medium cursor-pointer mt-4 mb-5'>
                View Offers
                <img
                  className='invert group-hover:translate-x-1 transition-all'
                  src={assets.arrowIcon}
                  alt='arrow-icon'
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExclusiveOffers;
