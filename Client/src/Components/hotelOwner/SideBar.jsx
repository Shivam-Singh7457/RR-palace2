import React from "react";
import { assets } from "../../assets/assets";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const sidebarLinks = [
    { name: "Dashboard", path: "/owner", icon: assets.dashboardIcon },
    { name: "Add Room", path: "/owner/add-room", icon: assets.addIcon },
    { name: "List Room", path: "/owner/list-room", icon: assets.listIcon },
    { name: "Booking Confirmation", path: "/owner/pending", icon: assets.listIcon },
    { name: "Payment Check", path: "/owner/all", icon: assets.listIcon },

    
  ];

  return (
    <div className='md:w-64 w-16 border-r h-full text-base border-gray-300 pt-4 flex flex-col transition-all duration-300'>

      {/* 🏨 Logo */}
      <NavLink
        to='/'
        className='flex items-center justify-center md:justify-start px-4 md:px-8 py-4 mb-2 hover:bg-gray-100 transition'
      >
        <img
          src={assets.logo} 
          alt="Logo"
          className='h-10 w-auto'
        />
        <span className='ml-3 md:block hidden font-semibold text-lg text-gray-800'>
            Home
        </span>
      </NavLink>

      {/* Navigation Links */}
      {sidebarLinks.map((item, index) => (
        <NavLink
          to={item.path}
          key={index}
          className={({ isActive }) =>
            `flex items-center py-3 px-4 md:px-8 gap-3 ${
              isActive
                ? "border-r-4 md:border-r-[6px] bg-blue-600/10 border-blue-600 text-blue-600"
                : "hover:bg-gray-100/90 border-white text-gray-700"
            }`
          }
        >
          <img src={item.icon} alt={item.name} className='min-h-6 min-w-6' />
          <p className='md:block hidden text-center'>{item.name}</p>
        </NavLink>
      ))}

    </div>
  );
};

export default Sidebar;
