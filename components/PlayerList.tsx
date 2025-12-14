
import React from 'react';
import { Player, MatchState } from '../types';

interface Props {
  players: Player[];
  matchState: MatchState;
  bowlingTeamPlayers: Player[];
}

export const PlayerList: React.FC<Props> = ({ players, matchState, bowlingTeamPlayers }) => {
  const { batsmen } = matchState;

  // Get active bowlers (those who have bowled at least 1 ball)
  const activeBowlers = bowlingTeamPlayers.filter(p => matchState.bowler.stats[p.id]?.overs > 0 || p.id === matchState.bowler.currentBowlerId);

  return (
    <div className="bg-white rounded-xl lg:rounded-none lg:bg-transparent lg:border-0 shadow-sm border border-gray-200 lg:shadow-none overflow-hidden flex flex-col w-full h-full">
      
      {/* Batting Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-gray-50 p-2.5 grid grid-cols-12 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 sticky top-0 z-10">
          <div className="col-span-5 pl-2">Batting</div>
          <div className="col-span-1 text-center">R</div>
          <div className="col-span-1 text-center">B</div>
          <div className="col-span-1 text-center">4s</div>
          <div className="col-span-1 text-center">6s</div>
          <div className="col-span-3 text-right pr-2">SR</div>
        </div>

        <div className="overflow-y-auto scrollbar-hide lg:scrollbar-default flex-1 lg:max-h-none max-h-[250px]">
          {matchState.battingOrder.map((playerId) => {
            const player = players.find(p => p.id === playerId);
            const stats = matchState.batsmen.stats[playerId];
            if (!player || !stats) return null;

            const isStriker = playerId === batsmen.strikerId;
            const isNonStriker = playerId === batsmen.nonStrikerId;
            const isActive = isStriker || isNonStriker;

            // Only show players who have batted or are currently batting
            if (stats.balls === 0 && !isActive) return null;

            const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(0) : '-';
            
            return (
              <div 
                key={playerId} 
                className={`grid grid-cols-12 p-2.5 text-sm border-b border-gray-50 items-center ${isActive ? 'bg-blue-50/50' : ''} ${stats.out ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="col-span-5 font-medium text-gray-800 pl-2 flex items-center gap-2 truncate">
                   <span className="truncate">{player.name}</span>
                   {isStriker && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>}
                   {stats.out && <span className="text-red-500 text-[10px] font-bold shrink-0">OUT</span>}
                </div>
                <div className="col-span-1 text-center font-bold text-gray-900">{stats.runs}</div>
                <div className="col-span-1 text-center text-gray-500">{stats.balls}</div>
                <div className="col-span-1 text-center text-gray-400">{stats.fours}</div>
                <div className="col-span-1 text-center text-gray-400">{stats.sixes}</div>
                <div className="col-span-3 text-right pr-2 text-gray-500">{sr}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Partnership Info */}
      <div className="bg-indigo-50 p-2 border-y border-indigo-100 flex justify-between items-center px-4 text-xs text-indigo-900 shrink-0">
         <span className="font-bold">Partnership</span>
         <span className="font-mono">{matchState.partnership.runs} ({matchState.partnership.balls})</span>
      </div>

      {/* Bowling Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-gray-50 p-2.5 grid grid-cols-12 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 sticky top-0 z-10">
          <div className="col-span-5 pl-2">Bowling</div>
          <div className="col-span-2 text-center">O</div>
          <div className="col-span-1 text-center">M</div>
          <div className="col-span-2 text-center">R</div>
          <div className="col-span-2 text-right pr-2">W</div>
        </div>
        
        <div className="overflow-y-auto scrollbar-hide lg:scrollbar-default flex-1 lg:max-h-none max-h-[200px]">
          {activeBowlers.map((bowler) => {
             const stats = matchState.bowler.stats[bowler.id];
             const isCurrent = bowler.id === matchState.bowler.currentBowlerId;
             
             // Convert balls to overs (e.g., 8 balls = 1.2)
             const overs = Math.floor(stats.overs / 6);
             const balls = stats.overs % 6;
             
             return (
               <div key={bowler.id} className={`grid grid-cols-12 p-2.5 text-sm border-b border-gray-50 items-center ${isCurrent ? 'bg-red-50/50' : ''}`}>
                  <div className="col-span-5 font-medium text-gray-800 pl-2 flex items-center gap-2 truncate">
                      <span className="truncate">{bowler.name}</span>
                      {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>}
                  </div>
                  <div className="col-span-2 text-center text-gray-600 font-mono">{overs}.{balls}</div>
                  <div className="col-span-1 text-center text-gray-400">{stats.maidens}</div>
                  <div className="col-span-2 text-center text-gray-800">{stats.runsConceded}</div>
                  <div className="col-span-2 text-right pr-2 font-bold text-gray-900">{stats.wickets}</div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};
