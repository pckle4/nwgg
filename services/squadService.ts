
import { Player } from "../types";
import { STATIC_SQUADS } from "../constants";

export const fetchSquads = async (
  teamAShort: string,
  teamBShort: string
): Promise<{ teamA: Player[]; teamB: Player[] }> => {
  
  // Simulate a short delay for effect
  await new Promise(resolve => setTimeout(resolve, 600));

  const getTeamPlayers = (shortCode: string, prefix: string): Player[] => {
    // Exact match using short code (e.g. 'CSK', 'MI')
    const playersData = STATIC_SQUADS[shortCode] || STATIC_SQUADS['CSK'];

    return playersData.map((p, i) => ({
      ...p,
      id: `${prefix}-${i}-${Date.now()}`,
      role: p.role as any,
    }));
  };

  const teamA = getTeamPlayers(teamAShort, 't1');
  const teamB = getTeamPlayers(teamBShort, 't2');

  return { teamA, teamB };
};
