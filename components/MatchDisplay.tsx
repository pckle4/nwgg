
import React, { useState } from 'react';
import { Player, MatchState } from '../types';

interface Props {
  matchState: MatchState;
  players: Player[];
  bowlingTeamPlayers: Player[];
  onAction: (type: 'safe' | 'hard') => void;
  onRestart: () => void;
  onSuperOver: () => void;
}

export const MatchDisplay: React.FC<Props> = ({ matchState, players, bowlingTeamPlayers, onAction, onRestart, onSuperOver }) => {
  const lastBall = matchState.lastBallOutcome;
  const lastDetail = matchState.lastBallDetail;
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleActionClick = (type: 'safe' | 'hard') => {
    if (isProcessing) return; 
    setIsProcessing(true);
    onAction(type);
    setTimeout(() => setIsProcessing(false), 300); // Increased debounce slightly for animation
  };

  let resultColor = 'bg-gray-100 text-gray-400';
  let resultScale = 'scale-100';
  let animationClass = '';

  if (lastBall === '6') { 
      resultColor = 'bg-green-500 text-white shadow-lg shadow-green-500/50'; 
      resultScale = 'scale-110';
      animationClass = 'animate-bounce-short';
  }
  else if (lastBall === '4') { 
      resultColor = 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'; 
      resultScale = 'scale-105'; 
      animationClass = 'animate-bounce-short';
  }
  else if (lastBall === 'W') { 
      resultColor = 'bg-red-600 text-white shadow-lg shadow-red-600/50'; 
      resultScale = 'scale-100'; 
      animationClass = 'animate-shake';
  }
  else if (lastBall === 'NB' || lastBall === 'wd') { 
      resultColor = 'bg-orange-500 text-white'; 
  }
  else if (lastBall === '0') {
      resultColor = 'bg-gray-700 text-white';
      if (lastDetail) animationClass = 'animate-shake'; // Shake on close calls/swings
  }
  else if (lastBall && parseInt(lastBall) > 0) { 
      resultColor = 'bg-gray-800 text-white'; 
  }

  const isGameOver = matchState.status === 'WON' || matchState.status === 'LOST';
  const isTied = matchState.status === 'TIED';
  const runsNeeded = Math.max(0, matchState.target - matchState.currentScore);
  const ballsRemaining = (matchState.totalOvers * 6) - matchState.ballsBowled;
  const rrr = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)).toFixed(1) : '-';

  // Determine Game Context Color
  let contextColor = "bg-blue-50 text-blue-700 border-blue-200";
  if (parseFloat(rrr) > 12) contextColor = "bg-red-50 text-red-700 border-red-200";
  else if (parseFloat(rrr) > 10) contextColor = "bg-orange-50 text-orange-700 border-orange-200";

  // --- MATCH SUMMARY VIEW ---
  if (isGameOver || isTied) {
     const won = matchState.status === 'WON';
     const resultText = won ? "VICTORY!" : (isTied ? "MATCH TIED" : "DEFEAT");
     const resultSubText = won 
        ? `Won by ${10 - matchState.wickets} wickets` 
        : (isTied ? "Scores Level" : `Lost by ${matchState.target - matchState.currentScore} runs`);
     const resultColorClass = won ? 'text-green-600' : (isTied ? 'text-orange-500' : 'text-red-600');
     
     const potm = matchState.playerOfTheMatch;
     const potmName = potm ? [...players, ...bowlingTeamPlayers].find(p => p.id === potm.playerId)?.name : "Calculating...";

     return (
       <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-lg p-4 text-center animate-pop-in border border-gray-100">
          <h2 className={`text-4xl lg:text-5xl font-display font-bold mb-2 ${resultColorClass}`}>{resultText}</h2>
          <p className="text-base text-gray-600 font-medium mb-6">{resultSubText}</p>
          
          {potm && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200 mb-6 w-full max-w-sm shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 opacity-20 text-4xl">🏆</div>
                  <div className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1">Player of the Match</div>
                  <div className="text-xl font-bold text-gray-900">{potmName}</div>
                  <div className="text-sm text-gray-600 mt-1">{potm.reason}</div>
              </div>
          )}

          <div className="flex flex-col gap-3 w-full max-w-xs">
            {isTied && (
              <button onClick={onSuperOver} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold shadow-md">PLAY SUPER OVER</button>
            )}
            <button onClick={onRestart} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md">PLAY AGAIN</button>
          </div>
       </div>
     );
  }

  // --- GAMEPLAY VIEW ---
  return (
    <div className="flex flex-col gap-3 h-full">
      
      {/* MOBILE: Context Bar (Hidden on Desktop) */}
      <div className="flex lg:hidden justify-between items-center px-1 shrink-0">
         <div className="flex gap-2">
            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${matchState.pitchType === 'GREEN' ? 'bg-green-50 border-green-200 text-green-700' : matchState.pitchType === 'DUSTY' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                {matchState.pitchType} PITCH
            </span>
            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${contextColor}`}>
                Req Rate: {rrr}
            </span>
         </div>
         {matchState.isFreeHit && <div className="animate-pulse text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">⚠️ FREE HIT</div>}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
        
        {/* CONTROLS (Full Width Mobile / 50% Desktop - Left Side) */}
        <div className="order-2 lg:order-1 flex flex-col gap-3 justify-center h-full">
            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-3 lg:gap-4 h-32 lg:h-64">
                <button 
                  onClick={() => handleActionClick('safe')}
                  disabled={isProcessing}
                  className={`group relative overflow-hidden bg-emerald-600 text-white h-full rounded-xl font-bold shadow-md shadow-emerald-600/20 transition-all transform active:scale-[0.98] flex flex-col items-center justify-center ${isProcessing ? 'opacity-80' : 'hover:bg-emerald-700 hover:shadow-lg'}`}
                >
                  <div className="relative z-10 flex flex-col items-center">
                      <span className="text-sm lg:text-2xl font-display tracking-widest">TIMING SHOT</span>
                      <span className="text-[9px] font-normal opacity-80 hidden lg:block mt-2">Low Risk • Rotate Strike</span>
                  </div>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
                
                <button 
                  onClick={() => handleActionClick('hard')}
                  disabled={isProcessing}
                  className={`group relative overflow-hidden bg-rose-600 text-white h-full rounded-xl font-bold shadow-md shadow-rose-600/20 transition-all transform active:scale-[0.98] flex flex-col items-center justify-center ${isProcessing ? 'opacity-80' : 'hover:bg-rose-700 hover:shadow-lg'}`}
                >
                  <div className="relative z-10 flex flex-col items-center">
                      <span className="text-sm lg:text-2xl font-display tracking-widest">POWER HIT</span>
                       <span className="text-[9px] font-normal opacity-80 hidden lg:block mt-2">High Risk • Boundaries</span>
                  </div>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
            </div>
            
            <div className="text-center hidden lg:block">
                 <p className="text-xs text-gray-400 font-medium">
                    {parseFloat(rrr) > 12 ? "Pressure is building! Focus on timing." : "Steady the ship and keep the scoreboard ticking."}
                 </p>
            </div>
        </div>

        {/* VISUALIZER (Full Width Mobile / 50% Desktop - Right Side) */}
        <div className="order-1 lg:order-2 flex flex-col relative h-full min-h-[200px] lg:min-h-[400px]">
             
             {/* DESKTOP: Overlay Context (Pitch/FreeHit) */}
             <div className="hidden lg:flex absolute top-4 right-4 z-20 gap-2">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm bg-white/80 ${matchState.pitchType === 'GREEN' ? 'text-green-700 border-green-200' : matchState.pitchType === 'DUSTY' ? 'text-amber-800 border-amber-200' : 'text-slate-700 border-slate-200'}`}>
                    {matchState.pitchType} PITCH
                 </span>
                 {matchState.isFreeHit && <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm animate-pulse">FREE HIT</span>}
             </div>

             <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 relative flex items-center justify-center overflow-hidden group shadow-inner">
                 <div className={`relative z-10 w-24 h-24 lg:w-40 lg:h-40 rounded-full flex items-center justify-center text-4xl lg:text-7xl font-display font-bold shadow-xl transition-all duration-300 ease-out transform ${resultColor} ${resultScale} ${animationClass} ${lastBall ? 'opacity-100' : 'opacity-0 scale-50'}`}>
                   {lastBall}
                   {lastDetail && <div className="absolute -bottom-5 lg:-bottom-6 left-1/2 transform -translate-x-1/2 text-[9px] lg:text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded-full whitespace-nowrap shadow-md z-20">{lastDetail}</div>}
                </div>
                
                {/* Decoration Rings */}
                <div className="absolute w-40 h-40 lg:w-72 lg:h-72 border border-gray-200 rounded-full animate-ping-slow opacity-20"></div>
                <div className="absolute w-60 h-60 lg:w-[28rem] lg:h-[28rem] border border-gray-100 rounded-full opacity-10"></div>

                 {/* Commentary Bubble */}
                {matchState.commentary && (
                   <div className="absolute bottom-4 lg:bottom-12 w-full text-center px-4 transition-all duration-300 z-20">
                     <span className="inline-block bg-white/95 backdrop-blur-md border border-gray-200 text-gray-800 px-3 py-1.5 lg:px-6 lg:py-3 rounded-xl text-xs lg:text-lg font-medium shadow-sm max-w-full lg:max-w-2xl">
                       {matchState.commentary}
                     </span>
                   </div>
                 )}
            </div>
        </div>

      </div>
    </div>
  );
};

