import { useEffect, useState } from 'react';
import logo from '@/assets/cla_sol.png';
import blissWallpaper from '@/assets/bliss-wallpaper.jpg';

export const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[9999]">
      {/* Blurred desktop background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${blissWallpaper})`,
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
        }}
      />

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img
            src={logo}
            alt="Clarence's Solutions"
            className="h-24 md:h-32 drop-shadow-2xl"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-16 tracking-wide animate-fade-in drop-shadow-lg">
          Educational AI Suite
        </h1>

        {/* Loading Bar Container */}
        <div className="w-64 md:w-96 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {/* Windows XP style loading bar */}
          <div className="relative h-6 bg-[#2952A3] border-2 border-[#1a3870] rounded-sm overflow-hidden shadow-xl">
            {/* Progress bar background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#3c6dc7] to-[#2952A3]" />

            {/* Animated blocks */}
            <div
              className="absolute left-0 top-0 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full bg-gradient-to-r from-[#6BA4FF] via-[#5A94EE] to-[#4884DD] relative overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                {/* Block pattern */}
                <div className="absolute inset-0 flex">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 border-r border-[#4884DD]/30"
                      style={{
                        animation: `pulse 1s ease-in-out infinite`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Top highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-white/20 to-transparent" />
          </div>

          {/* Loading text */}
          <div className="mt-4 text-center">
            <p className="text-white text-sm md:text-base font-semibold tracking-wider drop-shadow-lg">
              Loading system...
            </p>
            <div className="flex justify-center gap-1 mt-2">
              <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="absolute bottom-8 text-white/80 text-xs md:text-sm drop-shadow-lg">
          Powered by Clarence&apos;s Solutions
        </div>
      </div>
    </div>
  );
};
