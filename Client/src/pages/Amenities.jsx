import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";

const Amenities = () => {
  const { axios, getToken, toast } = useAppContext();
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    try {
      setUploading(true);
      const token = await getToken();
      const res = await axios.post("/api/amenities/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        toast.success("Memories uploaded successfully!");
        fetchAmenities();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error("Upload failed. Please try again.");
      console.error("Upload failed:", error.message);
    } finally {
      setUploading(false);
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

      if (res.data.success) {
        toast.success("Memory deleted");
        fetchAmenities();
      }
    } catch (error) {
      toast.error("Delete failed");
      console.error("Delete failed:", error.message);
    }
  };

  useEffect(() => {
    fetchAmenities();
    scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001f3f] to-black pt-32 pb-20 px-4 md:px-16 lg:px-24">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="font-playfair text-4xl md:text-5xl text-[#b8860b] font-bold">
            ✨ Beautiful Memories at RR Palace ✨
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto font-light italic">
            "A collection of moments captured by our guests. Every corner of our palace tells a story of luxury and comfort."
          </p>

          <div className="pt-4">
            <label htmlFor="upload-input" className={`btn-premium cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </div>
              ) : (
                "📤 Share Your Memory"
              )}
            </label>
            <input
              id="upload-input"
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
              accept="image/*"
            />
          </div>
        </div>

        {/* Gallery Grid */}
        {images.length === 0 ? (
          <div className="py-20 text-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
            <p className="text-gray-500 italic">No memories captured yet. Be the first to share one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="group relative aspect-[4/5] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/5 cursor-zoom-in"
                onClick={() => setPreviewImage(img.imageUrl)}
              >
                <img 
                  src={img.imageUrl} 
                  alt="Amenity" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                   <span className="text-white text-xs font-medium tracking-widest uppercase">View Full</span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(img._id);
                  }}
                  className="absolute top-4 right-4 w-8 h-8 bg-red-500/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                  title="Delete this memory"
                >
                  <span className="text-sm">✕</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal Preview */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain border border-white/10" 
            />
            <button
              className="absolute -top-12 right-0 md:-right-12 text-white text-4xl hover:text-[#b8860b] transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Amenities;
