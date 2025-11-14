
import React, { useState } from 'react';
import type { Team } from '../types';

interface SetupScreenProps {
    registeredTeams: Team[];
    onSetupComplete: (teams: Team[], tournamentName: string, tournamentDate: string) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ registeredTeams, onSetupComplete }) => {
    const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
    const [tournamentName, setTournamentName] = useState('');
    const [tournamentDate, setTournamentDate] = useState(new Date().toISOString().split('T')[0]);

    const handleToggleTeam = (teamId: number) => {
        if (selectedTeamIds.includes(teamId)) {
            setSelectedTeamIds(selectedTeamIds.filter(id => id !== teamId));
        } else {
            setSelectedTeamIds([...selectedTeamIds, teamId]);
        }
    };

    const handleMoveUp = (index: number) => {
        if (index > 0) {
            const newOrder = [...selectedTeamIds];
            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
            setSelectedTeamIds(newOrder);
        }
    };

    const handleMoveDown = (index: number) => {
        if (index < selectedTeamIds.length - 1) {
            const newOrder = [...selectedTeamIds];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setSelectedTeamIds(newOrder);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!tournamentName.trim()) {
            alert('Por favor ingresa un nombre para el torneo');
            return;
        }
        
        if (selectedTeamIds.length < 7 || selectedTeamIds.length > 10) {
            alert('Por favor selecciona entre 7 y 10 equipos para el torneo');
            return;
        }

        // Crear los equipos del torneo basados en la selección y orden
        const tournamentTeams = selectedTeamIds.map((teamId, index) => {
            const team = registeredTeams.find(t => t.id === teamId)!;
            return {
                ...team,
                id: index + 1, // Re-asignar IDs secuenciales para el torneo
            };
        });

        onSetupComplete(tournamentTeams, tournamentName, tournamentDate);
    };

    const selectedTeams = selectedTeamIds.map(id => registeredTeams.find(t => t.id === id)!);
    const validCount = selectedTeamIds.length >= 7 && selectedTeamIds.length <= 10;

    return (
        <div className="max-w-4xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-yellow-600">Crear Nuevo Torneo</h2>
            
            {registeredTeams.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay equipos registrados. Por favor ve a Gestión de Equipos primero.</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* Tournament Info */}
                    <div className="mb-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nombre del Torneo *
                            </label>
                            <input
                                type="text"
                                value={tournamentName}
                                onChange={(e) => setTournamentName(e.target.value)}
                                placeholder="Ej: Campeonato Nacional 2025"
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Fecha del Torneo
                            </label>
                            <input
                                type="date"
                                value={tournamentDate}
                                onChange={(e) => setTournamentDate(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Available Teams */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">
                                Available Teams ({registeredTeams.length})
                            </h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {registeredTeams.map(team => (
                                    <div
                                        key={team.id}
                                        onClick={() => handleToggleTeam(team.id)}
                                        className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                                            selectedTeamIds.includes(team.id)
                                                ? 'border-yellow-500 bg-yellow-50'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-4 h-4 rounded-full flex-shrink-0" 
                                                style={{ backgroundColor: team.color }}
                                            />
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">{team.name}</p>
                                                {team.members && team.members.length > 0 ? (
                                                    <p className="text-xs text-gray-600">
                                                        👥 {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-orange-600 italic">
                                                        ⚠️ No members
                                                    </p>
                                                )}
                                            </div>
                                            {selectedTeamIds.includes(team.id) && (
                                                <span className="text-yellow-600 font-bold">✓</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Selected Teams in Order */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">
                                Selected Teams ({selectedTeamIds.length}/7-10)
                            </h3>
                            {selectedTeams.length === 0 ? (
                                <p className="text-center text-gray-500 py-8 text-sm">
                                    Click on teams to select them
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {selectedTeams.map((team, index) => (
                                        <div
                                            key={team.id}
                                            className="p-3 rounded-lg border-2 border-yellow-500 bg-yellow-50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-yellow-600 w-6">{index + 1}.</span>
                                                <div 
                                                    className="w-4 h-4 rounded-full flex-shrink-0" 
                                                    style={{ backgroundColor: team.color }}
                                                />
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900">{team.name}</p>
                                                    {team.members && team.members.length > 0 && (
                                                        <span className="text-xs text-gray-600">
                                                            👥 {team.members.length}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0}
                                                        className="text-gray-600 hover:text-gray-900 disabled:text-gray-300 font-bold text-sm"
                                                    >
                                                        ▲
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === selectedTeams.length - 1}
                                                        className="text-gray-600 hover:text-gray-900 disabled:text-gray-300 font-bold text-sm"
                                                    >
                                                        ▼
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleTeam(team.id)}
                                                        className="text-red-600 hover:text-red-800 font-bold text-sm ml-1"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        {!validCount && selectedTeamIds.length > 0 && (
                            <p className="text-red-600 text-sm mb-2 text-center">
                                Please select between 7 and 10 teams
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={!validCount}
                            className="w-full bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-yellow-700 transition duration-300 text-base sm:text-lg shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Start Tournament with {selectedTeamIds.length} Teams
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SetupScreen;
