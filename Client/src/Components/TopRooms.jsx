import React, { useEffect, useState } from 'react';
import HotelCard from './HotelCard';
import Title from './Title';
import { useAppContext } from '../context/AppContext';

const TopRooms = () => {
  const { axios } = useAppContext();
  const [topRooms, setTopRooms] = useState([]);

  const fetchTopRooms = async () => {
    try {
      const { data } = await axios.get("/api/rooms/top-viewed");
      if (data.success) {
        setTopRooms(data.rooms);
      }
    } catch (error) {
      console.error("Failed to fetch top rooms:", error.message);
    }
  };

  useEffect(() => {
    fetchTopRooms();
  }, []);

  if (topRooms.length === 0) return null;

  return (
    <div className='w-full px-6 md:px-16 lg:px-24 bg-yellow-50 py-20'>
      <Title
        title='Popular Choices at RR Palace'
        subTitle='Explore our most booked and loved rooms – comfort meets elegance'
      />

      <div className='mt-12 overflow-x-auto'>
        <div className='flex gap-6 w-max'>
          {topRooms.map((room, index) => (
            <div key={room._id} className='min-w-[270px] sm:min-w-[300px] md:min-w-[320px]'>
              <HotelCard room={room} index={index} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopRooms;
