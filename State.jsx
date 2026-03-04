import React, { createContext, useState, useContext, useEffect } from 'react';

// ==========================================
// 1. GLOBAL USER STATE CONTEXT
// ==========================================
const UserContext = createContext();

export const useUser = () => useContext(UserContext);

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const register = async (name, icNumber) => {
        try {
            // First check if user already exists
            const checkRes = await fetch(`${API_BASE_URL}/api/data`);
            if (checkRes.ok) {
                const allUsers = await checkRes.json();
                const existingUser = allUsers.find(u => u.data.ic === icNumber);
                if (existingUser) {
                    throw new Error("IC Number already registered. Please login.");
                }
            }

            const lastDigit = parseInt(icNumber.charAt(11), 10);
            const detectedGender = (lastDigit % 2 === 0) ? 'Female' : 'Male';

            const simulatedLegacyReport = {
                lastTreated: "Eczema (Mild), Oct 2024",
                knownAllergies: "Latex, Pollen",
                riskFactor: "Moderate (Climate Sensitive)",
                totalScans: 12
            };

            const newUser = {
                name,
                ic: icNumber,
                gender: detectedGender,
                university: 'MyVerse ID',
                lastScanDate: 'No recent scans',
                riskHistory: [],
                currentRiskIndex: 'Pending',
                currentRiskChange: 'N/A',
                legacyData: simulatedLegacyReport
            };

            const res = await fetch(`${API_BASE_URL}/api/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (!res.ok) throw new Error("Failed to register");

            const savedData = await res.json();
            return true;
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        }
    };

    const login = async (icNumber) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/data`);
            if (!res.ok) throw new Error("Database connection failed");

            const allUsers = await res.json();
            const foundUser = allUsers.find(u => u.data.ic === icNumber);

            if (foundUser) {
                setUser({ ...foundUser.data, dbId: foundUser.id });
                return true;
            } else {
                throw new Error("IC Number not found. Please register first.");
            }
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const addScanResult = (newRiskValue) => {
        setUser(prev => {
            if (!prev) return prev;
            const newHistory = prev.riskHistory.length > 5 ? [...prev.riskHistory.slice(1), newRiskValue] : [...prev.riskHistory, newRiskValue];
            let newIndex = 'Optimal';
            if (newRiskValue > 60) newIndex = 'Elevated';
            else if (newRiskValue > 40) newIndex = 'Warning';

            return { ...prev, lastScanDate: 'Just now', riskHistory: newHistory, currentRiskIndex: newIndex, currentRiskChange: 'Calculated' };
        });
    };

    const logout = () => setUser(null);

    return (
        <UserContext.Provider value={{ user, login, register, logout, addScanResult }}>
            {children}
        </UserContext.Provider>
    );
};


// ==========================================
// 2. HARDWARE & SENSOR HOOKS
// ==========================================

export const useGeolocation = (defaultCoords = { lat: 1.4927, lng: 103.7414 }) => {
    const [location, setLocation] = useState(defaultCoords);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
            (err) => console.warn(`Geolocation error (${err.code}): ${err.message}.`),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }, []);

    return { location, error };
};

export const useCamera = () => {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let activeStream = null;
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                activeStream = mediaStream;
                setStream(mediaStream);
            } catch (err) {
                setError(err.message || 'Failed to access camera.');
            }
        };

        startCamera();
        return () => {
            if (activeStream) activeStream.getTracks().forEach(track => track.stop());
        };
    }, []);

    return { stream, error };
};
