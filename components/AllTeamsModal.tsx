import React from 'react';
import type { Team } from '../types';

interface AllTeamsModalProps {
    teams: Team[];
    onClose: () => void;
}

const AllTeamsModal: React.FC<AllTeamsModalProps> = ({ teams, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl p-4 sm:p-6 max-w-3xl w-full my-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-yellow-600">All Teams</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 font-bold text-2xl"
                    >
                        ×
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                    {teams.map(team => (
                        <div 
                            key={team.id} 
                            className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:border-yellow-400 transition"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div 
                                    className="w-5 h-5 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: team.color }}
                                />
                                <h4 className="text-lg font-bold text-gray-900">{team.name}</h4>
                            </div>
                            
                            {team.members && team.members.length > 0 ? (
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-2">
                                        Members ({team.members.length}):
                                    </p>
                                    <ul className="space-y-1">
                                        {team.members.map((member, idx) => (
                                            <li 
                                                key={idx} 
                                                className="text-sm text-gray-700 bg-white p-1.5 rounded border border-gray-200"
                                            >
                                                {idx + 1}. {member}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm italic">
                                    No members registered
                                </p>
                            )}
                        </div>
                    ))}
                </div>
                
                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default AllTeamsModal;
