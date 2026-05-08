import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const BookIcon = () => (
  <svg className="w-4 h-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M5 19V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13H7a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h12M9 3v14m7 0v4" />
  </svg>
);

const Navbar = () => {
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Rooms', path: '/rooms' },
    { name: 'Amenities', path: '/amenities' },
    { name: 'Contact', path: '/contact' },
  ];

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const { user, navigate, isOwner, logout } = useAppContext();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    if (location.pathname !== "/") {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
      window.addEventListener("scroll", handleScroll);
    }
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  if (location.pathname.startsWith("/owner")) return null;

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 px-4 md:px-16 lg:px-24 xl:px-32 transition-all duration-500 
      ${isScrolled ? "bg-white/90 text-gray-800 shadow-md backdrop-blur-lg py-3" : "bg-[#49B9FF]/70 text-white py-4 md:py-6"}`}>

      <div className="flex justify-between items-center">

        {/* Logo + Brand */}
        <Link to="/" className="flex items-center gap-2">
          <img src={assets.logo} alt="logo" className={`h-9 ${isScrolled ? "invert opacity-80" : ""}`} />
          <div className="hidden sm:block font-semibold text-lg leading-tight">
            RR Palace
            <div className="text-xs font-normal text-blue-700">Varanasi</div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-10">
          {navLinks.map((link, i) => (
            <Link key={i} to={link.path} className="group text-sm">
              {link.name}
              <div className="h-0.5 bg-black group-hover:w-full w-0 transition-all duration-300" />
            </Link>
          ))}

          {user && isOwner && (
            <button
              className={`border px-4 py-1 text-sm font-light rounded-full cursor-pointer transition-all ${
                isScrolled ? "text-black" : "text-white"
              }`}
              onClick={() => navigate("/owner")}
            >
              Dashboard
            </button>
          )}
        </div>

        {/* Desktop Right Icons */}
        <div className="hidden md:flex items-center gap-4 relative">
          {user ? (
            <>
              <button
                onClick={() => navigate("/my-bookings")}
                className={`flex items-center gap-2 text-sm px-4 py-1 border rounded-full ${
                  isScrolled ? "text-black border-gray-300" : "text-white border-white/70"
                } hover:bg-gray-100 hover:text-black transition`}
              >
                <BookIcon />
                My Bookings
              </button>
              
              <div className="relative">
                <img 
                  src={user.image || "https://ui-avatars.com/api/?name=User"} 
                  alt="profile" 
                  className="h-8 w-8 rounded-full cursor-pointer border border-gray-200"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                />
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-2 border-bottom border-gray-50">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => { setIsProfileOpen(false); logout(); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-black text-white px-12 py-2.5 rounded-xl transition hover:bg-gray-900 text-sm font-medium tracking-wide"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile Icons */}
        <div className="md:hidden flex items-center gap-4">
          {user ? (
            <div className="relative">
              <img 
                src={user.image || "https://ui-avatars.com/api/?name=User"} 
                alt="profile" 
                className="h-8 w-8 rounded-full cursor-pointer border border-gray-200"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              />
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                  </div>
                  <button 
                    onClick={() => { setIsProfileOpen(false); logout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => navigate("/login")}
              className="text-sm font-medium bg-black text-white px-4 py-1.5 rounded-lg"
            >
              Login
            </button>
          )}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-1"
          >
            <img
              src={assets.menuIcon}
              alt="menu"
              className={`h-5 ${isScrolled ? "invert" : "brightness-0 invert"}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Fullscreen Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-screen bg-white/95 backdrop-blur-xl text-black z-[60] flex flex-col items-center justify-center gap-8 text-xl font-light transition-all duration-500 ${
          isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <button className="absolute top-8 right-8 p-2" onClick={() => setIsMenuOpen(false)}>
          <img src={assets.closeIcon} alt="close" className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center gap-8">
          {navLinks.map((link, i) => (
            <Link 
              key={i} 
              to={link.path} 
              onClick={() => setIsMenuOpen(false)}
              className={`transition-all duration-300 ${location.pathname === link.path ? "text-blue-600 font-medium scale-110" : "text-gray-600"}`}
            >
              {link.name}
            </Link>
          ))}
          
          {user && (
            <Link 
              to="/my-bookings" 
              onClick={() => setIsMenuOpen(false)}
              className={`transition-all duration-300 ${location.pathname === "/my-bookings" ? "text-blue-600 font-medium scale-110" : "text-gray-600"}`}
            >
              My Bookings
            </Link>
          )}

          {user && isOwner && (
            <Link 
              to="/owner" 
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-600"
            >
              Owner Dashboard
            </Link>
          )}
        </div>

        <div className="mt-8">
          {!user ? (
            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/login");
              }}
              className="bg-black text-white px-12 py-3 rounded-full text-base font-medium shadow-lg"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={() => {
                setIsMenuOpen(false);
                logout();
              }}
              className="text-red-500 font-medium border border-red-100 px-10 py-3 rounded-full hover:bg-red-50 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
