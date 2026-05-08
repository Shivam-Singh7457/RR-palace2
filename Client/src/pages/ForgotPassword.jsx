import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { assets } from "../assets/assets";
import heroImage from "../assets/heroImage.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password`, { email });
      if (data.success) {
        toast.success(data.message);
        navigate("/verify-otp", { state: { email } });
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
          <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-2">Forgot Password</h2>
          <p className="text-gray-500 font-light italic text-sm">Enter your email to receive an OTP</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 transition-all duration-200 outline-none bg-gray-50/50"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 disabled:bg-gray-400"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-black hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
