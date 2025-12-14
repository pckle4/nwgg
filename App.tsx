import React, { useState, useEffect } from 'react';
import { TEAMS, TOTAL_OVERS } from './constants';
import { Player, MatchState, TeamOption } from './types';
import { fetchSquads } from './services/squadService';
import { initializeMatch, playBall, calculatePOTM } from './services/gameService';
import { Scoreboard } from './components/Scoreboard';
import { PlayerList } from './components/PlayerList';
import { MatchDisplay } from './components/MatchDisplay';

function App() {
  const [gameState, setGameState] = useState<'SETUP' | 'LOADING' | 'PLAYING'>('SETUP');
  // Initialize as null to force user selection
  const [selectedBattingTeam, setSelectedBattingTeam] = useState<TeamOption | null>(null);
  const [selectedBowlingTeam, setSelectedBowlingTeam] = useState<TeamOption | null>(null);
  const [showScorecard, setShowScorecard] = useState(false);
  
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [matchState, setMatchState] = useState<MatchState | null>(null);

  // Check for POTM when game ends
  useEffect(() => {
     if (matchState && (matchState.status === 'WON' || matchState.status === 'LOST' || matchState.status === 'TIED') && !matchState.playerOfTheMatch) {
         const allPlayers = [...teamA, ...teamB];
         const potm = calculatePOTM(matchState, allPlayers);
         if (potm) {
             setMatchState(prev => prev ? ({ ...prev, playerOfTheMatch: potm }) : null);
         }
     }
  }, [matchState?.status]);

  const handleStartGame = async () => {
    if (!selectedBattingTeam || !selectedBowlingTeam) return;

    setGameState('LOADING');
    try {
      const { teamA: batters, teamB: bowlers } = await fetchSquads(selectedBattingTeam.short, selectedBowlingTeam.short);
      setTeamA(batters);
      setTeamB(bowlers);
      
      const initial = initializeMatch(batters, bowlers, TOTAL_OVERS);
      initial.status = 'IN_PROGRESS';
      setMatchState(initial);
      setGameState('PLAYING');
      setShowScorecard(false); 
    } catch (e) {
      console.error(e);
      setGameState('SETUP');
    }
  };

  const handleSuperOver = () => {
      if (!teamA.length || !teamB.length) return;
      const superOverState = initializeMatch(teamA, teamB, 1, true);
      superOverState.status = 'IN_PROGRESS';
      setMatchState(superOverState);
      setShowScorecard(false);
  };

  const handleAction = (action: 'safe' | 'hard') => {
    if (!matchState || !matchState.batsmen.strikerId || !matchState.bowler.currentBowlerId) return;

    const striker = teamA.find(p => p.id === matchState.batsmen.strikerId);
    const bowler = teamB.find(p => p.id === matchState.bowler.currentBowlerId);

    if (striker && bowler) {
      const newState = playBall(matchState, action, striker, bowler);
      setMatchState(newState);
    }
  };

  const handleRestart = () => {
    setGameState('SETUP');
    setMatchState(null);
    setSelectedBattingTeam(null);
    setSelectedBowlingTeam(null);
  };

  if (gameState === 'SETUP') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="glass-panel p-6 rounded-2xl w-full max-w-md shadow-2xl my-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-display font-bold text-blue-900 mb-1 tracking-tight">IPL SUPER CHASE</h1>
            <p className="text-gray-600 text-xs">Strategy is key. Don't be predictable.</p>
          </div>

          <div className="space-y-5 mb-6">
            {/* Batting Team Selection */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Select Your Team</label>
              <div className="relative">
                <select
                  value={selectedBattingTeam?.short || ""}
                  onChange={(e) => {
                      const team = TEAMS.find(t => t.short === e.target.value);
                      setSelectedBattingTeam(team || null);
                      if (selectedBowlingTeam?.short === team?.short) setSelectedBowlingTeam(null);
                  }}
                  className="w-full appearance-none bg-white border border-gray-300 text-gray-800 py-2.5 px-4 pr-8 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm invalid:text-gray-400"
                >
                  <option value="" disabled>Choose Batting Team</option>
                  {TEAMS.map(team => (
                      <option 
                        key={team.short} 
                        value={team.short}
                        disabled={team.short === selectedBowlingTeam?.short}
                      >
                        {team.name}
                      </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Bowling Team Selection */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Select Opponent</label>
               <div className="relative">
                <select
                  value={selectedBowlingTeam?.short || ""}
                  onChange={(e) => setSelectedBowlingTeam(TEAMS.find(t => t.short === e.target.value) || null)}
                  disabled={!selectedBattingTeam}
                  className="w-full appearance-none bg-white border border-gray-300 text-gray-800 py-2.5 px-4 pr-8 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="" disabled>Choose Opponent</option>
                  {TEAMS.map(team => (
                    <option 
                        key={team.short} 
                        value={team.short} 
                        disabled={selectedBattingTeam?.short === team.short}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            
            {/* Visual Confirmation */}
            <div className="flex items-center justify-center gap-4 py-1 h-8">
                {selectedBattingTeam && selectedBowlingTeam ? (
                    <>
                        <div className="flex items-center gap-2 animate-pop-in">
                            <div className="w-4 h-4 rounded-full shadow-sm flex items-center justify-center text-[7px] text-white font-bold" style={{ background: selectedBattingTeam.color }}>{selectedBattingTeam.short}</div>
                            <span className="font-bold text-xs">{selectedBattingTeam.short}</span>
                        </div>
                        <span className="text-gray-400 font-bold text-[10px] animate-pop-in">VS</span>
                        <div className="flex items-center gap-2 animate-pop-in">
                            <div className="w-4 h-4 rounded-full shadow-sm flex items-center justify-center text-[7px] text-white font-bold" style={{ background: selectedBowlingTeam.color }}>{selectedBowlingTeam.short}</div>
                            <span className="font-bold text-xs">{selectedBowlingTeam.short}</span>
                        </div>
                    </>
                ) : null}
            </div>
          </div>

          <button 
            onClick={handleStartGame}
            disabled={!selectedBattingTeam || !selectedBowlingTeam}
            className={`w-full text-white py-3.5 rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${(!selectedBattingTeam || !selectedBowlingTeam) ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 hover:scale-[1.01] active:scale-[0.99] shadow-blue-500/20'}`}
          >
            <span>START MATCH</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'LOADING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-display font-bold text-gray-800">PREPARING PITCH...</h2>
        </div>
      </div>
    );
  }

  // Active players for scoreboard
  const striker = teamA.find(p => p.id === matchState?.batsmen.strikerId);
  const nonStriker = teamA.find(p => p.id === matchState?.batsmen.nonStrikerId);
  const currentBowler = teamB.find(p => p.id === matchState?.bowler.currentBowlerId);

  // --- PLAYING STATE ---
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-800 overflow-x-hidden">
        {/* Header - Sticky */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center sticky top-0 z-30 shadow-sm h-12 shrink-0">
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-0.5 border border-gray-100">
                 <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[8px] shadow-sm shrink-0" style={{ backgroundColor: selectedBattingTeam!.color }}>
                    {selectedBattingTeam!.short}
                 </div>
                 <span className="text-gray-300 font-bold text-[8px]">VS</span>
                 <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[8px] shadow-sm shrink-0" style={{ backgroundColor: selectedBowlingTeam!.color }}>
                    {selectedBowlingTeam!.short}
                 </div>
             </div>
          </div>
          <button onClick={handleRestart} className="text-[10px] font-bold text-gray-500 hover:text-red-600 px-2 py-1 hover:bg-red-50 rounded-full transition-colors">
            QUIT
          </button>
        </div>

        {/* Content Container - Compact and Centered */}
        <div className="flex-1 flex flex-col items-center p-2 lg:p-4">
            <div className="w-full max-w-5xl flex flex-col gap-2 lg:gap-3">
                
                {matchState && (
                    <Scoreboard 
                        state={matchState} 
                        battingTeam={selectedBattingTeam!.name}
                        striker={striker}
                        nonStriker={nonStriker}
                        bowler={currentBowler}
                    />
                )}
                
                {matchState && (
                  <MatchDisplay 
                    matchState={matchState}
                    players={teamA}
                    bowlingTeamPlayers={teamB}
                    onAction={handleAction}
                    onRestart={handleRestart}
                    onSuperOver={handleSuperOver}
                  />
                )}

                {/* Scorecard Collapsible - Bottom for all screens */}
                {matchState && (
                  <div className="mt-1">
                     <button 
                        onClick={() => setShowScorecard(!showScorecard)}
                        className={`w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all`}
                     >
                        <span>Match Scorecard</span>
                        <span className={`transition-transform duration-300 ${showScorecard ? 'rotate-180' : ''}`}>▼</span>
                     </button>
                     
                     <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-white rounded-b-lg shadow-sm ${showScorecard ? 'max-h-[500px] opacity-100 border-x border-b border-gray-200' : 'max-h-0 opacity-0'}`}>
                        <PlayerList 
                            players={teamA} 
                            matchState={matchState} 
                            bowlingTeamPlayers={teamB}
                        />
                     </div>
                  </div>
                )}
            </div>
        </div>
    </div>
  );
}

export default App;