import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import axios from 'axios';
import { Search, Loader2, MapPin, Briefcase, Linkedin, X, ChevronRight, Users, Menu } from 'lucide-react';

// Fix for default marker icon issues in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

import { API_URL } from '../config';

// Helper function to ensure URL has protocol
const ensureAbsoluteUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `https://${url}`;
};

// Create avatar icon with pin pointer
const createAvatarIcon = (url) => {
    return L.divIcon({
        html: `
        <div class="relative">
            <div class="w-12 h-12 p-1 bg-white rounded-full shadow-lg border-2 border-bis-maroon/30 transition-transform transform hover:scale-110">
                <img src="${url}" class="w-full h-full rounded-full object-cover" 
                     onerror="this.src='https://img.icons8.com/color/96/user-male-circle--v1.png'" />
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-bis-maroon transform rotate-45 border-r border-b border-white"></div>
        </div>
        `,
        className: 'bg-transparent border-none',
        iconSize: [48, 56],
        iconAnchor: [24, 54],
        popupAnchor: [0, -50]
    });
};

// Component to handle map interactions
const MapController = ({ selectedStudent }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedStudent && selectedStudent.latitude && selectedStudent.longitude) {
            map.flyTo([selectedStudent.latitude, selectedStudent.longitude], 10, {
                animate: true,
                duration: 1.5
            });
        }
    }, [selectedStudent, map]);

    return null;
};

const MapView = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get(`${API_URL}/students`);
            setStudents(response.data);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStudentClick = (student) => {
        setSelectedStudent(student);
        setIsSidebarOpen(true);
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-bis-maroon" />
            </div>
        );
    }

    return (
        <div className="h-full w-full relative bg-gray-50 flex">
            
            {/* Sidebar Toggle Button (When Closed) */}
            {!isSidebarOpen && (
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-6 left-6 z-[900] bg-white text-gray-700 p-3 rounded-full shadow-xl hover:bg-bis-maroon hover:text-white transition-all duration-300 group flex items-center gap-2 pr-5"
                >
                    <Users className="w-5 h-5" />
                    <span className="font-medium text-sm">Alumni List</span>
                </button>
            )}

            {/* Floating Sidebar Panel */}
            <div className={`absolute left-6 top-6 bottom-6 w-96 z-[1000] flex flex-col transition-all duration-500 transform ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 pointer-events-none'}`}>
                <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl h-full flex flex-col overflow-hidden border border-white/20">
                    
                    {/* Header / Search */}
                    <div className="p-5 border-b border-gray-100 bg-white/50 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Alumni Directory</h2>
                            <button 
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search by name, job..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bis-maroon/20 focus:bg-white transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4 group-focus-within:text-bis-maroon transition-colors" />
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                        {selectedStudent ? (
                            // Detailed View
                            <div className="p-6 animate-fadeIn">
                                <button 
                                    onClick={() => setSelectedStudent(null)}
                                    className="mb-4 flex items-center text-sm text-gray-500 hover:text-bis-maroon transition"
                                >
                                    <X className="w-4 h-4 mr-1" /> Back to list
                                </button>
                                
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-bis-maroon to-bis-gold">
                                            <img 
                                                src={selectedStudent.image_url || "https://img.icons8.com/color/96/user-male-circle--v1.png"} 
                                                alt={selectedStudent.name}
                                                className="w-full h-full rounded-full object-cover border-4 border-white"
                                            />
                                        </div>
                                    </div>
                                    <h3 className="mt-4 text-xl font-bold text-gray-900 text-center">{selectedStudent.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium text-center">{selectedStudent.job_title}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start p-3 bg-gray-50 rounded-xl">
                                        <MapPin className="w-5 h-5 text-bis-maroon mt-0.5 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Location</p>
                                            <p className="text-sm text-gray-700 font-medium">{selectedStudent.location}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start p-3 bg-gray-50 rounded-xl">
                                        <Briefcase className="w-5 h-5 text-bis-maroon mt-0.5 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Role</p>
                                            <p className="text-sm text-gray-700 font-medium">{selectedStudent.job_title}</p>
                                        </div>
                                    </div>

                                    {selectedStudent.linkedin_url && (
                                        <a 
                                            href={ensureAbsoluteUrl(selectedStudent.linkedin_url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center w-full py-3 bg-[#0077b5] hover:bg-[#006396] text-white rounded-xl transition shadow-lg shadow-blue-200 mt-6"
                                        >
                                            <Linkedin className="w-5 h-5 mr-2" />
                                            Connect on LinkedIn
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // List View
                            <div className="p-2 space-y-1">
                                {filteredStudents.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        <p>No alumni found</p>
                                    </div>
                                ) : (
                                    filteredStudents.map(student => (
                                        <div 
                                            key={student.id}
                                            onClick={() => handleStudentClick(student)}
                                            className="flex items-center p-3 hover:bg-bis-maroon/5 rounded-xl cursor-pointer transition group"
                                        >
                                            <img 
                                                src={student.image_url || "https://img.icons8.com/color/96/user-male-circle--v1.png"} 
                                                alt={student.name}
                                                className="w-10 h-10 rounded-full object-cover border border-gray-100 group-hover:border-bis-maroon/30 transition"
                                            />
                                            <div className="ml-3 flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-bis-maroon transition">{student.name}</h4>
                                                <p className="text-xs text-gray-500 truncate">{student.location}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-bis-maroon transition" />
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Footer Status */}
                    <div className="p-3 border-t border-gray-100 bg-gray-50 text-xs text-center text-gray-400 font-medium">
                        {filteredStudents.length} Alumni Found
                    </div>
                </div>
            </div>

            <MapContainer 
                center={[20, 0]} 
                zoom={2} 
                scrollWheelZoom={true} 
                className="h-full w-full outline-none z-0"
                style={{ background: '#f8fafc' }}
                zoomControl={false}
            >
                <ZoomControl position="bottomright" />
                <MapController selectedStudent={selectedStudent} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                <MarkerClusterGroup
                    chunkedLoading
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                    maxClusterRadius={50}
                >
                    {filteredStudents.map((student, index) => {
                        // Skip invalid coordinates
                        if (!student.latitude || !student.longitude) return null;

                        // Group students by location to handle overlaps
                        const locationKey = `${student.latitude.toFixed(4)}_${student.longitude.toFixed(4)}`;
                        const studentsAtLocation = filteredStudents.filter(s => 
                            s.latitude && s.longitude && 
                            `${s.latitude.toFixed(4)}_${s.longitude.toFixed(4)}` === locationKey
                        );
                        const positionInGroup = studentsAtLocation.findIndex(s => s.id === student.id);
                        const totalAtLocation = studentsAtLocation.length;

                        // Calculate offset for popup when multiple students at same location
                        // Arrange popups in a circle around the marker
                        const angle = (positionInGroup * (360 / totalAtLocation)) * Math.PI / 180;
                        const popupRadius = totalAtLocation > 1 ? 80 : 0; // Offset in pixels
                        const popupOffsetX = popupRadius * Math.sin(angle);
                        const popupOffsetY = -popupRadius * Math.cos(angle) - 50; // -50 to position above marker

                        return (
                            <Marker
                                key={student.id}
                                position={[student.latitude, student.longitude]}
                                icon={createAvatarIcon(student.image_url)}
                                eventHandlers={{
                                    click: () => handleStudentClick(student),
                                    mouseover: (e) => {
                                        e.target.openPopup();
                                    },
                                    mouseout: (e) => {
                                        // Small delay to allow moving to popup
                                        setTimeout(() => {
                                            const popupEl = e.target._popup?._container;
                                            if (popupEl && !popupEl.matches(':hover') && !popupEl.querySelector(':hover')) {
                                                e.target.closePopup();
                                            }
                                        }, 200);
                                    }
                                }}
                            >
                                <Popup 
                                    className="custom-popup-card"
                                    autoPan={false}
                                    closeButton={false}
                                    autoOpen={false}
                                    offset={[popupOffsetY, popupOffsetX]}
                                >
                                    <div className="relative">
                                        {/* Connecting Line - Angled line pointing to marker */}
                                        {totalAtLocation > 1 && (
                                            <svg 
                                                className="absolute pointer-events-none z-0"
                                                style={{
                                                    bottom: '-60px',
                                                    left: '50%',
                                                    width: '120px',
                                                    height: '60px',
                                                    transform: `translateX(-50%) rotate(${Math.atan2(popupOffsetX, -popupOffsetY) * 180 / Math.PI}deg)`
                                                }}
                                            >
                                                <line 
                                                    x1="60" 
                                                    y1="0" 
                                                    x2="60" 
                                                    y2="60" 
                                                    stroke="#7B1E2A" 
                                                    strokeWidth="2" 
                                                    strokeDasharray="4,4"
                                                    opacity="0.5"
                                                />
                                            </svg>
                                        )}
                                        {totalAtLocation === 1 && (
                                            <div 
                                                className="absolute -bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-0"
                                                style={{
                                                    width: '2px',
                                                    height: '50px',
                                                    background: 'linear-gradient(to bottom, rgba(123, 30, 42, 0.5), rgba(123, 30, 42, 0.2))',
                                                    borderLeft: '1px dashed rgba(123, 30, 42, 0.4)',
                                                    transform: 'translateX(-50%)'
                                                }}
                                            ></div>
                                        )}
                                        
                                        {/* Info Card */}
                                        <div 
                                            className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px] cursor-pointer hover:shadow-2xl hover:border-bis-maroon/50 transition-all relative z-10"
                                            onClick={() => handleStudentClick(student)}
                                            onMouseEnter={(e) => {
                                                // Keep popup open when hovering card
                                                const marker = e.target.closest('.leaflet-popup')?.__parent;
                                                if (marker) {
                                                    marker.openPopup();
                                                }
                                            }}
                                        >
                                            <div className="flex items-center space-x-3 mb-2">
                                                <img 
                                                    src={student.image_url || "https://img.icons8.com/color/96/user-male-circle--v1.png"} 
                                                    alt={student.name}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-bis-maroon/20"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-900 text-sm truncate">{student.name}</h3>
                                                    <p className="text-xs text-gray-500 truncate">{student.location}</p>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded text-xs text-gray-700 mb-2">
                                                {student.job_title}
                                            </div>
                                            {student.linkedin_url && (
                                                <a 
                                                    href={ensureAbsoluteUrl(student.linkedin_url)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="block w-full text-center bg-[#0077b5] text-white py-1.5 rounded text-xs hover:bg-[#006396] transition"
                                                >
                                                    View LinkedIn
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
};

export default MapView;

