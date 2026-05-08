import React from 'react';

const LoadingScreen = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[70vh] w-full bg-gradient-to-b from-orange-50/30 to-white rounded-3xl overflow-hidden relative">
            {/* Decorative background element */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-[0.03] overflow-hidden">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-500 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-500 rounded-full blur-[120px]"></div>
            </div>

            {/* Animated Header */}
            <div className="text-center mb-16 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest mb-6 animate-bounce">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    Live from Varanasi
                </div>
                
                <div className="relative inline-block mb-4">
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 leading-tight">
                        Finding the best room <br/> for your journey
                    </h2>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
                </div>
                
                <p className="text-gray-500 mt-10 text-lg font-light tracking-wide max-w-lg mx-auto">
                    Taking a moment to curate the perfect stay amidst the spiritual soul of India...
                </p>
            </div>

            {/* Varanasi Image Grid Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl relative z-10">
                {[1, 2, 3].map((i) => (
                    <div 
                        key={i} 
                        className="group relative h-72 md:h-96 rounded-3xl overflow-hidden bg-white shadow-2xl transition-all duration-700 hover:-translate-y-2"
                    >
                        {/* Skeleton Content */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse"></div>
                            
                            {/* Animated Inner Box (User adds image here) */}
                            <div className="relative h-full w-full border-2 border-dashed border-orange-200 rounded-2xl flex items-center justify-center group-hover:border-orange-400 transition-colors duration-500 bg-white/40 backdrop-blur-[2px]">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                                    </div>
                                    <p className="text-[10px] font-mono text-orange-300 uppercase tracking-[0.3em]">
                                        Varanasi Scene {i}
                                    </p>
                                </div>
                            </div>

                            {/* Bottom Skeleton Lines */}
                            <div className="mt-6 space-y-3 relative z-10">
                                <div className="h-4 w-2/3 bg-gray-200/50 rounded-full animate-pulse"></div>
                                <div className="h-3 w-1/2 bg-gray-100/50 rounded-full animate-pulse"></div>
                            </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-orange-600/0 group-hover:bg-orange-600/5 transition-all duration-500"></div>
                    </div>
                ))}
            </div>

            {/* Bottom Progress */}
            <div className="mt-20 flex flex-col items-center gap-4 relative z-10">
                <div className="flex gap-2">
                    {[0, 1, 2].map((dot) => (
                        <div 
                            key={dot}
                            className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
                            style={{ animationDelay: `${dot * 0.2}s` }}
                        ></div>
                    ))}
                </div>
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.4em] ml-2">
                    Connecting to RR Palace Network
                </span>
            </div>
        </div>
    );
};

export default LoadingScreen;
