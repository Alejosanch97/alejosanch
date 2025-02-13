import React, { useState, useContext, useEffect } from "react";
import { Context } from "../store/appContext";
import { useNavigate } from "react-router-dom";
import "../../styles/locations.css";

export const Locations = () => {
    const { store, actions } = useContext(Context);
    const [showForm, setShowForm] = useState(false);
    const navigate = useNavigate();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newLocation, setNewLocation] = useState({
        name: "",
        space_type: "",
        area: "",
        cleaning_frequency: "",
        description: "",
        status: "active"
    });

    const sortedLocations = [...locations].sort((a, b) => a.id - b.id);

    // Función para cargar las ubicaciones
    const loadLocations = async () => {
        try {
            const response = await fetch(`${process.env.BACKEND_URL}/api/locations`);
            const data = await response.json();
            if (response.ok) {
                setLocations(data);
            } else {
                console.error("Error loading locations:", data.message);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Cargar ubicaciones cuando el componente se monta
    useEffect(() => {
        loadLocations();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewLocation(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const locationData = {
                ...newLocation,
                area: parseFloat(newLocation.area)
            };
    
            let result;
            if (newLocation.id) {
                // Actualización
                result = await actions.updateLocation(newLocation.id, locationData);
            } else {
                // Creación
                result = await actions.createLocation(locationData);
            }
            
            if (result) {
                setShowForm(false);
                setNewLocation({
                    name: "",
                    space_type: "",
                    area: "",
                    cleaning_frequency: "",
                    description: "",
                    status: "active"
                });
                alert(newLocation.id ? "Ubicación actualizada exitosamente!" : "Ubicación creada exitosamente!");
                loadLocations();
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error: " + error.message);
        }
    };

    const handleEdit = (location) => {
        setNewLocation(location);
        setShowForm(true);
    };
    
    const handleDelete = async (locationId) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar esta ubicación?")) {
            try {
                await actions.deleteLocation(locationId);
                loadLocations(); // Recargar la lista
                alert("Ubicación eliminada exitosamente");
            } catch (error) {
                alert("Error al eliminar la ubicación: " + error.message);
            }
        }
    };
    
    const spaceTypes = [
        { value: "Classroom", label: "Aula" },
        { value: "Auditorium", label: "Auditorio" },
        { value: "locker_room", label: "Vestuario" },
        { value: "office", label: "Oficina" },
        { value: "Storage", label: "Almacén" },
        { value: "Recepction", label: "Recepción" },
        { value: "Hallway", label: "Pasillo" },
        { value: "Bathroom", label: "Baños" },
        { value: "other", label: "Otro" }
    ];

    const cleaningFrequencies = [
        { value: "daily", label: "Diaria" },
        { value: "weekly", label: "Semanal" },
        { value: "biweekly", label: "Quincenal" },
        { value: "monthly", label: "Mensual" }
    ];

    // Función para traducir los valores a etiquetas
    const getSpaceTypeLabel = (value) => {
        const type = spaceTypes.find(t => t.value === value);
        return type ? type.label : value;
    };

    const getFrequencyLabel = (value) => {
        const freq = cleaningFrequencies.find(f => f.value === value);
        return freq ? freq.label : value;
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Mis Ubicaciones</h1>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? "Cancelar" : "Crear Nueva Ubicación"}
                </button>
            </div>

            {loading ? (
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            ) : locations.length === 0 ? (
                <div className="text-center">
                    <p>No hay ubicaciones creadas. ¡Crea tu primera ubicación!</p>
                </div>
            ) : (
                <div className="row g-4">
                    {sortedLocations.map((location) => (
                        <div key={location.id} className="col-md-4">
                        <div className="location-card">
                            <div className="location-info">
                                <h5 className="mb-2">{location.name}</h5>
                                <small className="text-muted">ID: {location.id}</small>
                            </div>
                            <div className="location-overlay">
                                <h5>{location.name}</h5>
                                <div className="location-overlay-content">
                                    <p><strong>Área:</strong> {location.area} m²</p>
                                    <p><strong>Tipo:</strong> {getSpaceTypeLabel(location.space_type)}</p>
                                    <p><strong>Frecuencia:</strong> {getFrequencyLabel(location.cleaning_frequency)}</p>
                                    <p><strong>Descripción:</strong> {location.description}</p>
                                </div>
                                <div className="location-overlay-actions">
                                    <button 
                                        className="action-button edit-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(location);
                                        }}
                                    >
                                        <i className="fas fa-pencil-alt"></i>
                                        <span>Editar</span>
                                    </button>
                                    <button 
                                        className="action-button delete-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(location.id);
                                        }}
                                    >
                                        <i className="fas fa-trash"></i>
                                        <span>Eliminar</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div> 
                    ))}
                </div>
            )}

            {/* Formulario Modal - Sin cambios */}
            {showForm && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Nueva Ubicación</h5>
                                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Nombre de la Ubicación *</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="name"
                                            value={newLocation.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Tipo de Espacio *</label>
                                        <select 
                                            className="form-select"
                                            name="space_type"
                                            value={newLocation.space_type}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Seleccionar tipo</option>
                                            {spaceTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Área (m²) *</label>
                                        <input 
                                            type="number" 
                                            className="form-control"
                                            name="area"
                                            value={newLocation.area}
                                            onChange={handleInputChange}
                                            step="0.1"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Frecuencia de Limpieza *</label>
                                        <select 
                                            className="form-select"
                                            name="cleaning_frequency"
                                            value={newLocation.cleaning_frequency}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Seleccionar frecuencia</option>
                                            {cleaningFrequencies.map(freq => (
                                                <option key={freq.value} value={freq.value}>
                                                    {freq.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Descripción</label>
                                        <textarea 
                                            className="form-control"
                                            name="description"
                                            value={newLocation.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                        />
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary" 
                                            onClick={() => setShowForm(false)}
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Locations;