
import React, { memo, useMemo } from 'react';
import type { TournamentState, RankingData, Match } from '../types';
import MatchList from './MatchList';
import RankingTable from './RankingTable';
import AllTeamsModal from './AllTeamsModal';

interface DashboardProps {
    tournamentState: TournamentState;
    rankingData: RankingData[];
    onOpenScoresheet: (match: Match, isEditing?: boolean) => void;
    onContinueMatch: (match: Match) => void;
    onShowQrCode: (match: Match) => void;
    onGenerateFinals: () => void;
    isAdmin: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ tournamentState, rankingData, onOpenScoresheet, onContinueMatch, onShowQrCode, onGenerateFinals, isAdmin }) => {
    // Validación de datos
    if (!tournamentState || !tournamentState.teams || !tournamentState.groupMatches) {
        return <div className="text-center mt-10 text-red-600">Error: Tournament data is incomplete</div>;
    }
    
    const allMatchesCompleted = useMemo(
        () => tournamentState.groupMatches.every(m => m.completed),
        [tournamentState.groupMatches]
    );

    const exportToCSV = () => {
        // Validar datos antes de exportar
        if (!rankingData || !tournamentState.teams || !tournamentState.groupMatches) {
            alert('No data available to export');
            return;
        }
        
        // Exportar ranking
        const rankingCSV = [
            ['Rank', 'Team', 'Matches Played', 'Match Points', 'Arrow Average', 'X+10s'],
            ...rankingData.map((team, index) => [
                index + 1,
                team.teamName,
                team.matchesPlayed,
                team.matchPoints,
                (Math.round(team.arrowAverage * 100) / 100).toFixed(2),
                team.totalX10s
            ])
        ].map(row => row.join(',')).join('\n');

        // Exportar matches
        const matchesCSV = [
            ['Match', 'Team A', 'Team B', 'Score', 'Winner', 'Sets Played'],
            ...tournamentState.groupMatches.map(match => {
                const teamA = tournamentState.teams.find(t => t.id === match.teamA_id);
                const teamB = tournamentState.teams.find(t => t.id === match.teamB_id);
                const winner = match.winner_id ? tournamentState.teams.find(t => t.id === match.winner_id)?.name : 'N/A';
                return [
                    match.label || `Match ${match.id}`,
                    teamA?.name || 'N/A',
                    teamB?.name || 'N/A',
                    `${match.teamA_set_points_total || 0}-${match.teamB_set_points_total || 0}`,
                    winner,
                    match.sets?.length || 0
                ];
            })
        ].map(row => row.join(',')).join('\n');

        // Crear archivo combinado
        const fullCSV = `RANKING\n${rankingCSV}\n\nMATCHES\n${matchesCSV}`;
        
        const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tournament_results_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Ranking Section - First */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <RankingTable rankingData={rankingData} teams={tournamentState.teams} />
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={exportToCSV}
                        className="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm shadow-lg"
                    >
                        📊 Export Results to CSV
                    </button>
                    {allMatchesCompleted && isAdmin && (
                        <button
                            onClick={onGenerateFinals}
                            className="flex-1 bg-yellow-600 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-yellow-700 transition duration-300 text-sm sm:text-base shadow-lg"
                        >
                            🏆 Generate Finals
                        </button>
                    )}
                </div>
            </div>

            {/* Matches Section - Middle */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <MatchList 
                    title="Qualification Matches"
                    matches={tournamentState.groupMatches} 
                    teams={tournamentState.teams} 
                    onOpenScoresheet={onOpenScoresheet}
                    onContinueMatch={onContinueMatch}
                    onShowQrCode={onShowQrCode}
                    isAdmin={isAdmin}
                />
            </div>

            {/* Teams Section - Bottom */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Equipos Participantes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tournamentState.teams?.map((team, index) => (
                        <div
                            key={team.id}
                            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-gray-200 hover:border-yellow-400 transition-all"
                            style={{ 
                                borderLeftWidth: '6px',
                                borderLeftColor: team.color || '#d69e2e'
                            }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl font-bold text-gray-400">#{index + 1}</span>
                                <h4 className="text-lg font-bold text-gray-900">{team.name}</h4>
                            </div>
                            {team.members && team.members.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                                        <span>👥</span>
                                        <span>{team.members.length} integrantes</span>
                                    </p>
                                    <ul className="space-y-0.5">
                                        {team.members?.map((member, idx) => (
                                            <li key={idx} className="text-xs text-gray-700 flex items-center gap-1">
                                                <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                                                {member}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(Dashboard);