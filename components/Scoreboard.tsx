
import React from 'react';
import { MatchState, Player } from '../types';

interface Props {
  state: MatchState;
  battingTeam: string;
  striker?: Player;
  nonStriker?: Player;
  bowler?: Player;
}

export const Scoreboard: React.FC<Props> = ({ state, battingTeam, striker, nonStriker, bowler }) => {
  const oversBowled = Math.floor(state.ballsBowled / 6);
  const ballsInOver = state.ballsBowled % 6;
  const crr = state.ballsBowled > 0 ? (state.currentScore / (state.ballsBowled / 6)).toFixed(2) : '0.00';
  
  const ballsRemaining = (state.totalOvers * 6) - state.ballsBowled;
  const runsNeeded = Math.max(0, state.target - state.currentScore);
  const rrr = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)).toFixed(2) : '-';

  // Stats
  const sStats = state.batsmen.stats[state.batsmen.strikerId];
  const nsStats = state.batsmen.stats[state.batsmen.nonStrikerId];
  const bStats = state.bowler.stats[state.bowler.currentBowlerId];

  // --- LOGIC TO GET ONLY CURRENT OVER BALLS ---
  const getCurrentOverHistory = () => {
      const history = [...state.ballHistory];
      if (history.length === 0) return [];

      const ballsToRetrieve = ballsInOver === 0 ? 6 : ballsInOver;
      let legalBallsFound = 0;
      let currentOverBalls: string[] = [];

      for (let i = history.length - 1; i >= 0; i--) {
          const ball = history[i];
          currentOverBalls.unshift(ball); 

          if (ball !== 'wd' && ball !== 'NB') {
              legalBallsFound++;
          }

          if (legalBallsFound === ballsToRetrieve) break;
      }
      return currentOverBalls;
  };

  const currentOverDisplay = getCurrentOverHistory();

  return (
    <div className="w-full mb-1">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-3 bg-gray-200 border-b border-gray-300 rounded-t-lg overflow-hidden text-center py-1.5">
        <div>
          <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">CRR</div>
          <div className="text-sm font-display font-semibold text-gray-800">{crr}</div>
        </div>
        <div className="border-x border-gray-300">
          <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Target</div>
          <div className="text-sm font-display font-semibold text-gray-800">{state.target}</div>
        </div>
        <div>
          <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">RRR</div>
          <div className="text-sm font-display font-semibold text-gray-800">{rrr}</div>
        </div>
      </div>

      {/* Main Score Banner */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white p-3 rounded-b-lg shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[120px]">
        
        {/* Background Team Name Watermark */}
        <div className="absolute top-0 right-0 p-1 opacity-10 text-4xl font-display font-bold leading-none select-none text-right w-full pointer-events-none">
          {battingTeam}
        </div>
        
        {/* Main Score */}
        <div className="flex flex-col items-center justify-center relative z-10 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-display font-bold tracking-tight leading-none">
              {state.currentScore}<span className="text-gray-400 mx-0.5">/</span>{state.wickets}
            </span>
            <span className="text-xl font-display text-gray-300">
              {oversBowled}.{ballsInOver} <span className="text-xs font-sans text-gray-400">({state.totalOvers})</span>
            </span>
          </div>
          <div className={`mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${runsNeeded <= 12 ? 'bg-red-500/20 text-red-100 animate-pulse' : 'text-blue-200'}`}>
            Need {runsNeeded} runs from {ballsRemaining} balls
          </div>
        </div>

        {/* Player Stats Footer */}
        <div className="relative z-10 grid grid-cols-2 mt-2 text-[9px] sm:text-[10px]">
            {/* Bowler (Left) */}
            <div className="flex flex-col items-start justify-end text-blue-200 opacity-80 leading-tight">
                {bowler && (
                    <>
                        <div className="font-bold uppercase tracking-wider text-blue-300">Bowling</div>
                        <div className="font-medium text-white text-[10px]">{bowler.name}</div>
                        <div>{bStats?.wickets}-{bStats?.runsConceded} <span className="opacity-70">({Math.floor((bStats?.overs || 0)/6)}.{(bStats?.overs || 0)%6})</span></div>
                    </>
                )}
            </div>

            {/* Batsmen (Right) */}
            <div className="flex flex-col items-end justify-end text-blue-100 leading-tight">
                {striker && (
                    <div className="flex items-center gap-1 font-medium text-white">
                        <span className="text-[10px]">{striker.name}</span>
                        <span className="bg-blue-600/50 px-1 rounded text-[9px] text-blue-100">{sStats?.runs}({sStats?.balls})</span>
                        <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse"></span>
                    </div>
                )}
                {nonStriker && (
                    <div className="flex items-center gap-1 text-blue-300 mt-0.5">
                         <span className="text-[10px]">{nonStriker.name}</span>
                         <span className="opacity-70">{nsStats?.runs}({nsStats?.balls})</span>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {/* Current Over Display */}
      <div className="mt-1.5 flex items-center gap-2 px-1">
         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest shrink-0">This Over</span>
         <div className="flex-1 h-[1px] bg-gray-200"></div>
      </div>

      <div className="mt-0.5 flex justify-center">
         <div className="flex items-center gap-1.5 overflow-x-auto px-2 py-1 scrollbar-hide min-h-[30px]">
             {currentOverDisplay.length === 0 && <span className="text-[10px] text-gray-400 italic">New Over</span>}
             {currentOverDisplay.map((ball, idx) => {
                let colorClass = "bg-gray-100 text-gray-600 border-gray-200";
                if (ball === '4') colorClass = "bg-blue-500 text-white border-blue-600 shadow-sm shadow-blue-200";
                if (ball === '6') colorClass = "bg-green-500 text-white border-green-600 shadow-sm shadow-green-200";
                if (ball === 'W') colorClass = "bg-red-500 text-white border-red-600 shadow-sm shadow-red-200";
                if (ball === 'NB' || ball === 'wd') colorClass = "bg-orange-400 text-white border-orange-500";
                
                return (
                  <div key={idx} className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${colorClass} border animate-pop-in`}>
                    {ball}
                  </div>
                );
             })}
         </div>
      </div>
    </div>
  );
};

