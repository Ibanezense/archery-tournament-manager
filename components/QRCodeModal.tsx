
import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import type { Match, Team } from '../types';

interface QRCodeModalProps {
    match: Match;
    teamA: Team;
    teamB: Team;
    onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ match, teamA, teamB, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const url = `${window.location.origin}/score/${match.id}`;
            QRCode.toCanvas(canvasRef.current, url, { width: 256 }, function (error: Error | null | undefined) {
                if (error) console.error(error);
            });
        }
    }, [match.id]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm text-center">
                <div className="p-6 border-b-2 border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-yellow-600">Scan to Score</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-2xl transition">&times;</button>
                    </div>
                </div>
                <div className="p-6 flex flex-col items-center bg-gray-50">
                    <p className="mb-2 font-semibold text-gray-900">{teamA.name} vs {teamB.name}</p>
                    <canvas ref={canvasRef} className="rounded-lg border-2 border-gray-200 shadow-sm"></canvas>
                    <p className="text-xs text-gray-600 mt-4">
                        Open your camera app and point it at the code to open the scoring page.
                    </p>
                </div>
                 <div className="p-4 bg-white border-t-2 border-gray-200 rounded-b-lg flex justify-end">
                    <button onClick={onClose} className="bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 transition shadow-md">Close</button>
                </div>
            </div>
        </div>
    );
};

export default QRCodeModal;