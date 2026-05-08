import React from "react";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const Navbar=()=>{
    const { user, logout } = useAppContext();
    return (
        <div className='flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-3 bg-white transition-all duration-300'>
            <Link to='/' className="flex items-center gap-2">
                <img src={assets.logo} alt="logo" className='h-9 invert opacity-80' />
                <span className="text-sm font-medium text-gray-500">Back to Site</span>
            </Link>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:block">{user?.username}</span>
                <button 
                    onClick={logout}
                    className="text-xs font-medium text-red-500 border border-red-200 px-3 py-1 rounded-full hover:bg-red-50 transition"
                >
                    Logout
                </button>
            </div>
        </div>
    )
}

export default Navbar;
