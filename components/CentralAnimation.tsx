import React from "react";

const HologramCoins = () => {
  return (
    <div className="absolute right-45 top-5 w-64 h-96 pointer-events-none">

      {/* Energy beam */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-40 h-56
        bg-gradient-to-t from-cyan-400/70 via-purple-500/30 to-transparent
        blur-xl opacity-250" />

      {/* Coins */}
      <div className="absolute inset-0 flex items-center justify-center">

        {/* Coin 1 */}
        <Coin size="w-12 h-12" delay="0s" y="-20px" x="-90px" />

        {/* Coin 2 (center) */}
        <Coin size="w-14 h-14" delay="0.8s" y="-120px" x="0px" />

        {/* Coin 3 */}
        <Coin size="w-10 h-10" delay="1.6s" y="-30px" x="100px" />

      </div>
    </div>
  );
};

const Coin = ({ size, delay, x, y }: any) => {
  return (
    <div
      className={`absolute ${size} rounded-full animate-float-coin
        bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-600
        border border-amber-700/40
        shadow-[0_0_30px_rgba(250,204,21,0.8),inset_2px_2px_6px_rgba(255,255,255,0.5)]`}
      style={{
        transform: `translate(${x}, ${y})`,
        animationDelay: delay,
      }}
    >
      {/* Inner shine */}
      <div className="absolute inset-2 rounded-full
        bg-gradient-to-br from-yellow-200/80 to-transparent" />

      {/* Bitcoin symbol */}
      <div className="absolute inset-0 flex items-center justify-center
        text-amber-900 font-bold text-lg drop-shadow-md">
        ₿
      </div>

      {/* Glow aura */}
      <div className="absolute -inset-3 rounded-full
        bg-yellow-400/30 blur-xl" />
    </div>
  );
};

export default HologramCoins;
