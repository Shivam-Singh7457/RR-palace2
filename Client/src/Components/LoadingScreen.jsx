import React from 'react';
import ghats from '../assets/loading/ghats.png';
import aarti from '../assets/loading/aarti.png';
import streets from '../assets/loading/streets.png';

const LoadingScreen = () => {
    const scenes = [
        { img: ghats, title: "The Sacred Ghats", sub: "Spirituality at its source" },
        { img: aarti, title: "Evening Ganga Aarti", sub: "A symphony of light and fire" },
        { img: streets, title: "Ancient Narrow Alleys", sub: "History in every corner" }
    ];

    return (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4 min-h-[85vh] w-full bg-white overflow-hidden relative">
            {/* Soft Ambient Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-400 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-red-400 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl w-full relative z-10">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-[0.3em] mb-8 border border-orange-100/50">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        Live from Varanasi
                    </div>
                    
                    <h2 className="text-4xl md:text-6xl font-playfair font-bold text-gray-900 leading-tight mb-6">
                        Finding the best rooms <br className="hidden md:block" /> for you
                    </h2>
                    
                    <p className="text-gray-500 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto italic">
                        "While we curate your perfect stay, take a moment to experience the timeless soul of Varanasi..."
                    </p>
                </div>

                {/* Immersive Gallery Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
                    {scenes.map((scene, i) => (
                        <div 
                            key={i} 
                            className="group relative h-[300px] md:h-[450px] rounded-[40px] overflow-hidden bg-gray-100 shadow-2xl shadow-gray-200 transition-all duration-1000 hover:-translate-y-3"
                        >
                            {/* Image with Parallax-like Zoom */}
                            <img 
                                src={scene.img} 
                                alt={scene.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] ease-out group-hover:scale-125"
                            />
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                            
                            {/* Text Content */}
                            <div className="absolute bottom-0 left-0 w-full p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
                                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.3em] mb-2">{scene.sub}</p>
                                <h3 className="text-2xl font-playfair font-bold text-white leading-none">{scene.title}</h3>
                            </div>

                            {/* Animated Border on Hover */}
                            <div className="absolute inset-4 border border-white/20 rounded-[30px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        </div>
                    ))}
                </div>

                {/* Progress Indicators */}
                <div className="flex flex-col items-center gap-6">
                    <div className="flex gap-4">
                        {[0, 1, 2].map((dot) => (
                            <div 
                                key={dot}
                                className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce"
                                style={{ animationDelay: `${dot * 0.2}s` }}
                            ></div>
                        ))}
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.5em]">
                            Connecting to RR Palace Cloud
                        </p>
                        <div className="w-48 h-[1px] bg-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 h-full w-1/2 bg-orange-400 animate-[loading-bar_2s_infinite_linear]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Animation Keyframes (Inline Style for convenience) */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}} />
        </div>
    );
};

export default LoadingScreen;
