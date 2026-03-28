import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../utils/api';
import { getAnimalById, createAnimal, updateAnimal } from '../api/animalsApi';

const AnimalForm = ({ tagId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        tagId: '',
        species: '',
        sex: 'UNKNOWN',
        ageClass: 'UNKNOWN',
        status: 'ACTIVE',
        protectedAreaId: '',
        zoneId: '',
        description: '',
        endemicToSriLanka: false
    });

    const [areas, setAreas] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const areasData = await api('/protected-areas');
                setAreas(areasData.data || areasData);
            } catch (err) {
                console.error('Failed to fetch areas:', err);
            }
        };
        fetchDropdownData();
    }, []);

    useEffect(() => {
        if (formData.protectedAreaId) {
            const fetchZones = async () => {
                try {
                    const zonesData = await api(`/protected-areas/${formData.protectedAreaId}/zones`);
                    setZones(zonesData.data || zonesData);
                } catch (err) {
                    console.error('Failed to fetch zones:', err);
                }
            };
            fetchZones();
        } else {
            setZones([]);
        }
    }, [formData.protectedAreaId]);

    useEffect(() => {
        if (tagId) {
            const fetchAnimal = async () => {
                setFetchingData(true);
                try {
                    const data = await getAnimalById(tagId);
                    const animal = data.animal || data;
                    setFormData({
                        tagId: animal.tagId,
                        species: animal.species,
                        sex: animal.sex || 'UNKNOWN',
                        ageClass: animal.ageClass || 'UNKNOWN',
                        status: animal.status,
                        protectedAreaId: animal.protectedAreaId || '',
                        zoneId: animal.zoneId || '',
                        description: animal.description || '',
                        endemicToSriLanka: !!animal.endemicToSriLanka
                    });
                } catch (err) {
                    setError(err.message);
                } finally {
                    setFetchingData(false);
                }
            };
            fetchAnimal();
        }
    }, [tagId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (tagId) {
                await updateAnimal(tagId, formData);
            } else {
                await createAnimal(formData);
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 p-1 animate-enter">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <h2 className="text-[17px] font-bold text-primary-dark tracking-tight leading-none mb-1">
                        {tagId ? 'Update Entity' : 'Register New Entity'}
                    </h2>
                    <p className="text-[11px] font-medium text-text-gray opacity-80">Maintain precision in tracking registry data.</p>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-bg-soft rounded-lg transition-all duration-200 border-none bg-transparent cursor-pointer active:scale-90">
                    <X size={18} className="text-[#adb5bd]" />
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex gap-3 text-rose-700 text-[12px] items-start">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5 group">
                        <label className="text-[10px] font-semibold text-primary-medium tracking-[0.05em] uppercase ml-0.5 opacity-60">Tracker Tag ID</label>
                        <input
                            name="tagId"
                            type="text"
                            disabled={!!tagId}
                            className="px-4 py-2.5 bg-bg-soft/40 border border-border-light rounded-xl text-[13px] font-medium transition-all duration-300 focus:bg-white focus:border-primary-medium focus:ring-4 focus:ring-primary-medium/5 outline-none disabled:opacity-40"
                            placeholder="e.g. T0001"
                            value={formData.tagId}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 group">
                        <label className="text-[10px] font-semibold text-primary-medium tracking-[0.05em] uppercase ml-0.5 opacity-60">Common Species Name</label>
                        <input
                            name="species"
                            type="text"
                            className="px-4 py-2.5 bg-bg-soft/40 border border-border-light rounded-xl text-[13px] font-medium transition-all duration-300 focus:bg-white focus:border-primary-medium focus:ring-4 focus:ring-primary-medium/5 outline-none"
                            placeholder="e.g. Sri Lankan Elephant"
                            value={formData.species}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-5">
                    {[
                        { label: 'Biological Sex', name: 'sex', options: ['MALE', 'FEMALE', 'UNKNOWN'] },
                        { label: 'Development Stage', name: 'ageClass', options: ['INFANT', 'JUVENILE', 'SUBADULT', 'ADULT', 'UNKNOWN'] },
                        { label: 'Monitoring Status', name: 'status', options: ['ACTIVE', 'INACTIVE', 'DECEASED'] }
                    ].map((field) => (
                        <div key={field.name} className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold text-primary-medium tracking-[0.05em] uppercase ml-0.5 opacity-60">{field.label}</label>
                            <select
                                name={field.name}
                                className="px-4 py-2.5 bg-bg-soft/40 border border-border-light rounded-xl text-[12px] font-medium text-primary-dark outline-none cursor-pointer focus:bg-white focus:border-primary-medium transition-all"
                                value={formData[field.name]}
                                onChange={handleChange}
                            >
                                {field.options.map(opt => (
                                    <option key={opt} value={opt}>{opt.charAt(0) + opt.slice(1).toLowerCase()}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-primary-medium tracking-[0.05em] uppercase ml-0.5 opacity-60">Primary Protected Area</label>
                        <select
                            name="protectedAreaId"
                            className="px-4 py-2.5 bg-bg-soft/40 border border-border-light rounded-xl text-[12px] font-medium text-primary-dark outline-none cursor-pointer focus:bg-white focus:border-primary-medium transition-all"
                            value={formData.protectedAreaId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Conservation Area</option>
                            {areas.map(area => (
                                <option key={area._id} value={area._id}>{area.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-primary-medium tracking-[0.05em] uppercase ml-0.5 opacity-60">Specified Monitoring Zone</label>
                        <select
                            name="zoneId"
                            className="px-4 py-2.5 bg-bg-soft/40 border border-border-light rounded-xl text-[12px] font-medium text-primary-dark outline-none cursor-pointer focus:bg-white focus:border-primary-medium transition-all"
                            value={formData.zoneId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Zone</option>
                            {zones.map(zone => (
                                <option key={zone._id} value={zone._id}>{zone.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-primary-medium tracking-[0.05em] uppercase ml-0.5 opacity-60">Observation Notes</label>
                    <textarea
                        name="description"
                        rows="2"
                        className="px-4 py-2.5 bg-bg-soft/40 border border-border-light rounded-xl text-[12px] font-medium outline-none focus:bg-white focus:border-primary-medium transition-all resize-none"
                        placeholder="Detail physical markings or behavioral observations..."
                        value={formData.description}
                        onChange={handleChange}
                    ></textarea>
                </div>

                <div className="flex items-center gap-3 py-2 bg-bg-soft/20 px-4 rounded-xl border border-border-light/40 group hover:border-primary/20 transition-all">
                    <div className="relative flex items-center justify-center">
                        <input
                            name="endemicToSriLanka"
                            type="checkbox"
                            id="endemic"
                            className="peer w-5 h-5 rounded border-border-light text-primary focus:ring-primary-medium transition-all cursor-pointer opacity-0 absolute inset-0"
                            checked={formData.endemicToSriLanka}
                            onChange={handleChange}
                        />
                        <div className="w-5 h-5 border border-border-light rounded flex items-center justify-center peer-checked:border-primary peer-checked:bg-primary transition-all pointer-events-none">
                            <Save size={12} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                    </div>
                    <label htmlFor="endemic" className="text-[12px] font-medium text-primary-dark cursor-pointer select-none">Confirmed endemic species to Sri Lanka</label>
                </div>

                <div className="flex gap-3 mt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl text-[13px] font-bold text-text-gray hover:bg-bg-soft transition-all active:scale-95"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-2 bg-primary text-white py-3 rounded-xl text-[13px] font-bold flex justify-center items-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-premium active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {tagId ? 'Update Record' : 'Commit Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AnimalForm;
