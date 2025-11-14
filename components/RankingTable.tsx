
import React, { memo, useState } from 'react';
import type { RankingData, Team } from '../types';
import TeamInfoModal from './TeamInfoModal';

interface RankingTableProps {
    rankingData: RankingData[];
    teams: Team[];
}

const RankingTable: React.FC<RankingTableProps> = ({ rankingData, teams }) => {
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    const handleTeamClick = (teamId: number) => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            setSelectedTeam(team);
        }
    };

    return (
        <>
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-xl border border-gray-200">
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-yellow-600">Live Ranking</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm md:text-base min-w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-300 bg-gray-50">
                                <th className="p-1 sm:p-2 whitespace-nowrap font-bold text-gray-700">#</th>
                                <th className="p-1 sm:p-2 whitespace-nowrap font-bold text-gray-700">Team</th>
                                <th className="p-1 sm:p-2 text-center whitespace-nowrap font-bold text-gray-700">MP</th>
                                <th className="p-1 sm:p-2 text-center whitespace-nowrap font-bold text-gray-700">Pts</th>
                                <th className="p-1 sm:p-2 text-center whitespace-nowrap font-bold text-gray-700">Avg</th>
                                <th className="p-1 sm:p-2 text-center whitespace-nowrap font-bold text-gray-700">X+10s</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankingData.map((team, index) => (
                                <tr 
                                    key={team.teamId} 
                                    onClick={() => handleTeamClick(team.teamId)}
                                    className="border-b border-gray-200 hover:bg-yellow-50 transition cursor-pointer"
                                >
                                    <td className="p-1 sm:p-2 font-bold whitespace-nowrap text-gray-900">{index + 1}</td>
                                    <td className="p-1 sm:p-2 whitespace-nowrap min-w-[80px] text-gray-900 font-semibold hover:text-yellow-600">{team.teamName}</td>
                                    <td className="p-1 sm:p-2 text-center whitespace-nowrap text-gray-900">{team.matchesPlayed}</td>
                                    <td className="p-1 sm:p-2 text-center font-bold text-yellow-600 whitespace-nowrap">{team.matchPoints}</td>
                                    <td className="p-1 sm:p-2 text-center whitespace-nowrap text-gray-900">{(Math.round(team.arrowAverage * 100) / 100).toFixed(2)}</td>
                                    <td className="p-1 sm:p-2 text-center whitespace-nowrap text-gray-900">{team.totalX10s}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center italic">Click on a team name to view members</p>
            </div>
            
            {selectedTeam && (
                <TeamInfoModal
                    team={selectedTeam}
                    onClose={() => setSelectedTeam(null)}
                />
            )}
        </>
    );
};

export default memo(RankingTable);