import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";

const Amenities = () => {
  const { axios, getToken } = useAppContext();
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchAmenities = async () => {
    try {
      const { data } = await axios.get("/api/amenities");
      if (data.success) {
        setImages(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch amenities:", error.message);
    }
  };

  const handleUpload = async (e) => {
    const formData = new FormData();
    Array.from(e.target.files).forEach((file) =>
      formData.append("images", file)
    );

    try {
      const token = await getToken();
      const res = await axios.post("/api/amenities/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) fetchAmenities();
    } catch (error) {
      console.error("Upload failed:", error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = await getToken();
      const res = await axios.delete(`/api/amenities/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) fetchAmenities();
    } catch (error) {
      console.error("Delete failed:", error.message);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>✨ Beautiful memories at RR Palace ✨</h2>

        {/* Small Upload Button */}
        <div style={styles.smallUploadBox}>
          <label htmlFor="upload-input" style={styles.smallUploadLabel}>
            📤 Upload
          </label>
          <input
            id="upload-input"
            type="file"
            multiple
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </div>

        {/* Image Gallery */}
        <div style={styles.gallery}>
          {images.map((img, idx) => (
            <div
              key={idx}
              style={styles.imageWrapper}
              className="image-wrapper"
              onClick={() => setPreviewImage(img.imageUrl)}
            >
              <img src={img.imageUrl} alt="Amenity" style={styles.image} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(img._id);
                }}
                className="delete-btn"
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {previewImage && (
        <div style={styles.modal} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" style={styles.modalImage} />
          <button
            style={styles.modalClose}
            onClick={() => setPreviewImage(null)}
          >
            ✖
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    paddingTop: "100px",
    background: "linear-gradient(135deg, #001f3f, #000)",
  },
  card: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "900px",
    margin: "auto",
    textAlign: "center",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
    color: "#bfa145",
  },
  smallUploadBox: {
    display: "inline-block",
    marginBottom: "1.5rem",
  },
  smallUploadLabel: {
    display: "inline-block",
    padding: "8px 16px",
    backgroundColor: "#49B9FF",
    color: "#fff",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background 0.3s",
  },
  gallery: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "1rem",
  },
  imageWrapper: {
    position: "relative",
    cursor: "pointer",
    borderRadius: "10px",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
    borderRadius: "10px",
    transition: "transform 0.3s ease",
  },
  modal: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modalImage: {
    maxHeight: "80vh",
    maxWidth: "90vw",
    borderRadius: "10px",
  },
  modalClose: {
    position: "absolute",
    top: "20px",
    right: "30px",
    fontSize: "2rem",
    background: "transparent",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};

// Global styles for delete button on hover
const globalCSS = `
.image-wrapper .delete-btn {
  display: none;
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  padding: 5px;
  cursor: pointer;
}
.image-wrapper:hover .delete-btn {
  display: block;
}
`;

// Inject global style
const styleTag = document.createElement("style");
styleTag.innerHTML = globalCSS;
document.head.appendChild(styleTag);

export default Amenities;
