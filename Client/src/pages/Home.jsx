import React from "react";
import Hero from '../Components/Hero';
import FeaturedDestination from "../Components/FeaturedDestination";
import ExclusiveOffers from "../Components/ExclusiveOffers";
import Testimonial from "../Components/Testimonial";
import NewsLetter from "../Components/NewsLetter";
import TopRooms from "../Components/TopRooms";

const Home=()=>{
    return (
        <>
            <Hero />
            <TopRooms />
            <FeaturedDestination />
            <ExclusiveOffers />
            <Testimonial />
            <NewsLetter />
        </>
    )
}

export default Home;