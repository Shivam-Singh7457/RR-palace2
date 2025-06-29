import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { Link, useLocation } from "react-router-dom";
import { useClerk, UserButton } from "@clerk/clerk-react";
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
  const { openSignIn } = useClerk();
  const location = useLocation();
  const { user, navigate, isOwner } = useAppContext();

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
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="My Bookings"
                  labelIcon={<BookIcon />}
                  onClick={() => navigate("/my-bookings")}
                />
              </UserButton.MenuItems>
            </UserButton>
          ) : (
            <button
              onClick={openSignIn}
              className="bg-black text-white px-6 py-2 rounded-full transition hover:bg-gray-900 text-sm"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile Icons */}
        <div className="md:hidden flex items-center gap-3">
          {user && (
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="My Bookings"
                  labelIcon={<BookIcon />}
                  onClick={() => navigate("/my-bookings")}
                />
              </UserButton.MenuItems>
            </UserButton>
          )}
          <img
            src={assets.menuIcon}
            alt="menu"
            onClick={() => setIsMenuOpen(true)}
            className={`h-5 cursor-pointer ${isScrolled ? "invert" : ""}`}
          />
        </div>
      </div>

      {/* Mobile Fullscreen Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-screen bg-white text-black z-40 flex flex-col items-center justify-center gap-6 text-lg font-medium transition-transform duration-500 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button className="absolute top-4 right-4" onClick={() => setIsMenuOpen(false)}>
          <img src={assets.closeIcon} alt="close" className="h-6" />
        </button>

        {navLinks.map((link, i) => (
          <Link key={i} to={link.path} onClick={() => setIsMenuOpen(false)}>
            {link.name}
          </Link>
        ))}

        {user && isOwner && (
          <button
            className="border px-4 py-1 text-sm font-light rounded-full cursor-pointer"
            onClick={() => {
              setIsMenuOpen(false);
              navigate("/owner");
            }}
          >
            Dashboard
          </button>
        )}

        {!user && (
          <button
            onClick={() => {
              setIsMenuOpen(false);
              openSignIn();
            }}
            className="bg-black text-white px-8 py-2.5 rounded-full transition-all duration-300"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
