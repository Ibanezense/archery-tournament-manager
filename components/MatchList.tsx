
import React, { memo, useCallback, useState } from 'react';
import type { Match, Team } from '../types';
import TeamInfoModal from './TeamInfoModal';

interface MatchListProps {
    title: string;
    matches: Match[];
    teams: Team[];
    onOpenScoresheet: (match: Match, isEditing?: boolean) => void;
    onShowQrCode: (match: Match) => void;
    onContinueMatch?: (match: Match) => void;
    isAdmin: boolean;
}

const MatchList: React.FC<MatchListProps> = ({ title, matches, teams, onOpenScoresheet, onShowQrCode, onContinueMatch, isAdmin }) => {
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    const getTeamName = useCallback((id: number) => {
        return teams.find(t => t.id === id)?.name || 'Unknown Team';
    }, [teams]);

    const getTeamColor = useCallback((id: number) => {
        return teams.find(t => t.id === id)?.color || '#6b7280';
    }, [teams]);

    const handleTeamClick = useCallback((e: React.MouseEvent, teamId: number) => {
        e.stopPropagation();
        const team = teams.find(t => t.id === teamId);
        if (team) {
            setSelectedTeam(team);
        }
    }, [teams]);

    return (
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-xl border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-yellow-600">{title}</h2>
            <div className="space-y-3 sm:space-y-4">
                {matches.map(match => (
                    <div key={match.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 border-2 border-gray-200 p-3 sm:p-4 rounded-md gap-2 sm:gap-0 hover:border-yellow-400 transition">
                        <div className="flex items-center justify-between sm:flex-1">
                            <div className="flex-1 text-left sm:text-center flex items-center justify-start sm:justify-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: getTeamColor(match.teamA_id) }}
                                />
                                <span 
                                    onClick={(e) => handleTeamClick(e, match.teamA_id)}
                                    className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 cursor-pointer hover:text-yellow-600 transition"
                                >
                                    {getTeamName(match.teamA_id)}
                                </span>
                            </div>
                            <div className="flex-shrink-0 mx-2 sm:mx-4 text-gray-500 font-bold text-xs sm:text-sm">VS</div>
                            <div className="flex-1 text-right sm:text-center flex items-center justify-end sm:justify-center gap-2">
                                <span 
                                    onClick={(e) => handleTeamClick(e, match.teamB_id)}
                                    className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 cursor-pointer hover:text-yellow-600 transition"
                                >
                                    {getTeamName(match.teamB_id)}
                                </span>
                                <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: getTeamColor(match.teamB_id) }}
                                />
                            </div>
                        </div>
                        <div className="w-full sm:w-auto sm:min-w-[200px] flex justify-end">
                            {match.completed ? (
                                <div className="flex items-center justify-end gap-1 sm:gap-2 w-full">
                                    <span className="text-lg sm:text-xl font-bold text-yellow-600">
                                        {match.teamA_set_points_total} - {match.teamB_set_points_total}
                                    </span>
                                    <button
                                        onClick={() => onOpenScoresheet(match, false)}
                                        className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold py-1 px-2 rounded shadow"
                                        title="View Scoresheet"
                                    >
                                        View
                                    </button>
                                     {isAdmin && (
                                        <button
                                            onClick={() => onOpenScoresheet(match, true)}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold py-1 px-2 rounded shadow"
                                            title="Edit Scoresheet"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {isAdmin && onContinueMatch && match.teamA_set_points_total < 5 && match.teamB_set_points_total < 5 && (
                                        <button
                                            onClick={() => onContinueMatch(match)}
                                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded shadow"
                                            title="Continue Match"
                                        >
                                            Continue
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-end gap-1 sm:gap-2 w-full">
                                    {match.sets.length > 0 && (
                                        <span className="text-base sm:text-lg font-bold text-gray-700 mr-1">
                                            {match.teamA_set_points_total} - {match.teamB_set_points_total}
                                            <span className="text-xs ml-1 text-gray-500">
                                                (Set {match.sets.length}/{match.teamA_set_points_total === 4 && match.teamB_set_points_total === 4 ? '5' : '4'})
                                            </span>
                                        </span>
                                    )}
                                    {isAdmin && (
                                        <>
                                            <button
                                                onClick={() => onShowQrCode(match)}
                                                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded transition duration-200 text-xs sm:text-sm shadow"
                                                title="Show QR Code for Scoring"
                                            >
                                                QR
                                            </button>
                                            <button
                                                onClick={() => onOpenScoresheet(match)}
                                                className={`font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded transition duration-200 text-xs sm:text-sm shadow ${
                                                    match.teamA_set_points_total === 4 && match.teamB_set_points_total === 4 && match.sets.length === 4
                                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                            >
                                                {match.teamA_set_points_total === 4 && match.teamB_set_points_total === 4 && match.sets.length === 4
                                                    ? 'Shoot-Off'
                                                    : `Enter Set ${match.sets.length + 1}`
                                                }
                                            </button>
                                        </>
                                    )}
                                    {!isAdmin && match.sets.length === 0 && (
                                        <span className="text-gray-600 text-sm italic">Not started</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {selectedTeam && (
                <TeamInfoModal
                    team={selectedTeam}
                    onClose={() => setSelectedTeam(null)}
                />
            )}
        </div>
    );
};

export default memo(MatchList);