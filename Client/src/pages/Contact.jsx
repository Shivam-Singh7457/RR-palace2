import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Contact = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const showUPIPayment = queryParams.get("payment") === "true";
  const bookingId = queryParams.get("bookingId");

  const { axios, getToken } = useAppContext();
  const [upiRef, setUpiRef] = useState("");

  const handleUPISubmit = async () => {
    if (!upiRef.trim()) {
      return toast.error("Please enter the UPI reference number.");
    }

    try {
      const token = await getToken();
      const res = await axios.post(
        "/api/bookings/submit-upi",
        { bookingId, upiRef },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        toast.success("UPI reference submitted successfully!");
        navigate("/my-bookings");
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Submission failed");
    }
  };

  return (
    <div style={styles.container}>
      {/* Contact Info */}
      <div style={styles.card}>
        <img src={assets.logo} alt="RR Palace Logo" style={styles.logo} />
        <h2 style={styles.heading}>Contact RR Palace</h2>
        <p><strong>Owner:</strong> Prof Sudheer Sharma</p>
        <p><strong>Phone:</strong> +91-7007608026</p>
        <p><strong>Email:</strong> shivamsinghsn95@gmail.com</p>
        <p><strong>Address:</strong> Varanasi-Jaunpur Highway, Babatpur Airport</p>
      </div>

      {showUPIPayment && (
        <>
          {/* QR Box */}
          <div style={styles.qrBox}>
            <h3 style={{ color: "#001f3f", marginBottom: "1rem" }}>📷 UPI QR Code</h3>
            <img
              src={assets.QR}
              alt="QR Code"
              style={{ width: "800px", margin: "0 auto", display: "block" }}
            />
            <p style={{ marginTop: "1rem" }}>Scan to Pay</p>
          </div>

          {/* UPI Submission Box */}
          <div style={styles.upiBox}>
            <h3 style={{ color: "#222", marginBottom: "1rem" }}>💳 Submit UPI Reference</h3>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.3rem" }}>
              UPI Reference Number
            </label>
            <input
              type="text"
              value={upiRef}
              onChange={(e) => setUpiRef(e.target.value)}
              placeholder="Enter UPI Ref No."
              style={{
                padding: "10px",
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: "6px",
                marginBottom: "1rem",
              }}
            />
            <button
              onClick={handleUPISubmit}
              style={{
                padding: "10px 20px",
                backgroundColor: "#001f3f",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Submit
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    padding: "100px 20px 40px",
    background: "linear-gradient(135deg, #001f3f, #000000)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2rem",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: "2rem",
    borderRadius: "15px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.25)",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    color: "#222",
  },
  qrBox: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "15px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    color: "#222",
  },
  upiBox: {
    backgroundColor: "#FFD700",
    padding: "2rem",
    borderRadius: "15px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    width: "90%",
    maxWidth: "400px",
    textAlign: "left",
    color: "#222",
  },
  logo: {
    width: "100px",
    height: "100px",
    objectFit: "contain",
    marginBottom: "1.5rem",
  },
  heading: {
    fontSize: "1.8rem",
    marginBottom: "1.2rem",
    color: "#001f3f",
  },
};

export default Contact;
