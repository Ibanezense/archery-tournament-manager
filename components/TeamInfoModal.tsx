import React from 'react';
import type { Team } from '../types';

interface TeamInfoModalProps {
    team: Team;
    onClose: () => void;
}

const TeamInfoModal: React.FC<TeamInfoModalProps> = ({ team, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                    <div 
                        className="w-6 h-6 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: team.color }}
                    />
                    <h3 className="text-2xl font-bold text-gray-900">{team.name}</h3>
                </div>
                
                {team.members && team.members.length > 0 ? (
                    <div>
                        <p className="text-sm font-semibold text-gray-600 mb-3">
                            Team Members ({team.members.length}):
                        </p>
                        <ul className="space-y-2">
                            {team.members.map((member, idx) => (
                                <li 
                                    key={idx} 
                                    className="text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-200"
                                >
                                    {idx + 1}. {member}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm italic">
                        No members registered for this team
                    </p>
                )}
                
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

export default TeamInfoModal;
