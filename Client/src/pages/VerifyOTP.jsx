import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { assets } from "../assets/assets";
import heroImage from "../assets/heroImage.jpg";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  if (!email) {
    navigate("/forgot-password");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-otp`, { email, otp });
      if (data.success) {
        toast.success(data.message);
        navigate("/reset-password", { state: { email, otp } });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>

      <Link to="/" className="absolute top-8 left-8 md:left-16 z-20 flex items-center gap-2">
        <img src={assets.logo} alt="logo" className="h-10 md:h-12" />
        <div className="text-white font-semibold text-xl tracking-tight hidden sm:block">
            RR Palace
            <div className="text-[10px] font-normal text-yellow-500 uppercase tracking-widest">Varanasi</div>
        </div>
      </Link>

      <div className="relative z-10 max-w-md w-full space-y-8 p-10 bg-white rounded-3xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-2">Verify OTP</h2>
          <p className="text-gray-500 font-light italic text-sm">Enter the 6-digit code sent to <b>{email}</b></p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">OTP Code</label>
            <input
              type="text"
              required
              maxLength="6"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all duration-200 outline-none bg-gray-50/50 text-center text-2xl tracking-[10px] font-bold"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 disabled:bg-gray-400"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          Didn't receive the code?{" "}
          <button 
            onClick={() => navigate("/forgot-password")}
            className="font-medium text-black hover:underline"
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
