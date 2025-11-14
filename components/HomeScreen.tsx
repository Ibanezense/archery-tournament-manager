import React from 'react';
import type { Team } from '../types';

interface HomeScreenProps {
    registeredTeams: Team[];
    hasTournament: boolean;
    onEnterTournament: () => void;
    onCreateTournament: () => void;
    isAdmin: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
    registeredTeams, 
    hasTournament,
    onEnterTournament,
    onCreateTournament,
    isAdmin 
}) => {
    return (
        <div className="max-w-6xl mx-auto">
            {/* Tournament Status */}
            {hasTournament ? (
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg shadow-xl p-8 text-white text-center">
                        <div className="text-5xl mb-4">🏆</div>
                        <h2 className="text-3xl font-bold mb-2">Torneo en Curso</h2>
                        <p className="text-lg mb-6 opacity-90">El torneo está activo. Click para ver el dashboard</p>
                        <button
                            onClick={onEnterTournament}
                            className="bg-white text-yellow-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition shadow-lg text-lg"
                        >
                            Ver Dashboard del Torneo →
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mb-8">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center border-2 border-gray-200">
                        <div className="text-5xl mb-4">🎯</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Equipos Registrados</h2>
                        <p className="text-gray-600 mb-4">
                            {registeredTeams.length > 0 
                                ? `${registeredTeams.length} equipos listos para competir`
                                : 'No hay equipos registrados aún'}
                        </p>
                        {isAdmin && registeredTeams.length >= 7 && (
                            <button
                                onClick={onCreateTournament}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
                            >
                                🏆 Crear Torneo
                            </button>
                        )}
                        {isAdmin && registeredTeams.length < 7 && (
                            <p className="text-sm text-gray-500 mt-2">
                                Se necesitan al menos 7 equipos para crear un torneo
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Teams List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Equipos Participantes</h3>
                    <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold">
                        {registeredTeams.length} {registeredTeams.length === 1 ? 'Equipo' : 'Equipos'}
                    </span>
                </div>

                {registeredTeams.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">👥</div>
                        <p className="text-gray-500 text-lg">
                            {isAdmin 
                                ? 'No hay equipos registrados. Ve a Gestión de Equipos para crear equipos.'
                                : 'Aún no hay equipos registrados para el torneo.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {registeredTeams.map((team, index) => (
                            <div
                                key={team.id}
                                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border-2 border-gray-200 hover:border-yellow-400 transition-all hover:shadow-md"
                                style={{ 
                                    borderLeftWidth: '6px',
                                    borderLeftColor: team.color || '#d69e2e'
                                }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                                            <h4 className="text-lg font-bold text-gray-900">{team.name}</h4>
                                        </div>
                                    </div>
                                </div>

                                {team.members && team.members.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                            <span>👥</span>
                                            <span>Integrantes ({team.members.length})</span>
                                        </p>
                                        <ul className="space-y-1">
                                            {team.members.map((member, idx) => (
                                                <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                                                    {member}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {(!team.members || team.members.length === 0) && (
                                    <p className="text-xs text-gray-400 italic mt-2">Sin integrantes registrados</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeScreen;
