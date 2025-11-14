import React from 'react';

interface Tournament {
    id: string;
    name: string;
    date: string;
    teamsCount: number;
    stage: 'group' | 'playoffs' | 'finished';
}

interface TournamentListProps {
    tournaments: Tournament[];
    onSelectTournament: (id: string) => void;
    onCreateTournament: () => void;
    isAdmin: boolean;
}

const TournamentList: React.FC<TournamentListProps> = ({ 
    tournaments, 
    onSelectTournament, 
    onCreateTournament,
    isAdmin 
}) => {
    const getStageLabel = (stage: string) => {
        switch (stage) {
            case 'group': return '🎯 Fase de Grupos';
            case 'playoffs': return '🏆 Playoffs';
            case 'finished': return '✅ Finalizado';
            default: return stage;
        }
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'group': return 'bg-blue-100 text-blue-700';
            case 'playoffs': return 'bg-yellow-100 text-yellow-700';
            case 'finished': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Torneos</h2>
                    <p className="text-gray-600 mt-1">Selecciona un torneo para ver detalles</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={onCreateTournament}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
                    >
                        ➕ Crear Torneo
                    </button>
                )}
            </div>

            {tournaments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <div className="text-6xl mb-4">🏹</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No hay torneos creados</h3>
                    <p className="text-gray-600 mb-6">
                        {isAdmin 
                            ? 'Crea tu primer torneo para comenzar' 
                            : 'No hay torneos disponibles en este momento'}
                    </p>
                    {isAdmin && (
                        <button
                            onClick={onCreateTournament}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
                        >
                            Crear Primer Torneo
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.map((tournament) => (
                        <div
                            key={tournament.id}
                            onClick={() => onSelectTournament(tournament.id)}
                            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 flex-1">
                                        {tournament.name}
                                    </h3>
                                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStageColor(tournament.stage)}`}>
                                        {getStageLabel(tournament.stage)}
                                    </span>
                                </div>
                                
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">📅</span>
                                        <span>{new Date(tournament.date).toLocaleDateString('es-ES', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">👥</span>
                                        <span>{tournament.teamsCount} equipos</span>
                                    </div>
                                </div>

                                <button className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-2 px-4 rounded-lg transition">
                                    Ver Torneo →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TournamentList;
