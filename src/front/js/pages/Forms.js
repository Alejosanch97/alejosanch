import React, { useState, useEffect, useContext } from 'react';
import { Context } from '../store/appContext';
import { useNavigate } from 'react-router-dom';

export const Forms = () => {
    const { store, actions } = useContext(Context);
    const [forms, setForms] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState([]);
    const navigate = useNavigate();
    
    const [newForm, setNewForm] = useState({
        title: '',
        description: '',
        questions: []
    });
    const [currentQuestion, setCurrentQuestion] = useState({
        question_text: '',
        question_type: '',
        required: false,
        order: 0,
        options: []
    });
    

    const questionTypes = [
        { value: 'text', label: 'Texto Corto' },
        { value: 'long_text', label: 'Texto Largo' },
        { value: 'multiple_choice', label: 'Opción Múltiple' },
        { value: 'checkbox', label: 'Casillas de Verificación' },
        { value: 'locations', label: 'Selección de Ubicaciones' }
    ];

    useEffect(() => {
        const loadData = async () => {
            // Cargar formularios
            await actions.getForms(store.currentUser.company_id);
            setForms(store.forms);
            
            // Cargar ubicaciones
            const response = await fetch(`${process.env.BACKEND_URL}/api/locations?company_id=${store.currentUser.company_id}`);
            const locationData = await response.json();
            setLocations(locationData);
            
            setLoading(false);
        };
        loadData();
    }, []);

    const handleAddQuestion = () => {
        if (currentQuestion.question_text && currentQuestion.question_type) {
            let finalQuestion = { ...currentQuestion };
            
            // Si el tipo es 'locations', crear opciones automáticamente desde las ubicaciones
            if (currentQuestion.question_type === 'locations') {
                finalQuestion.options = locations.map((loc, index) => ({
                    option_text: loc.name,
                    order: index + 1,
                    location_id: loc.id
                }));
            }
            
            setNewForm({
                ...newForm,
                questions: [...newForm.questions, {
                    ...finalQuestion,
                    order: newForm.questions.length + 1
                }]
            });
            
            setCurrentQuestion({
                question_text: '',
                question_type: '',
                required: false,
                order: 0,
                options: []
            });
        }
    };

    const handleAddOption = () => {
        setCurrentQuestion({
            ...currentQuestion,
            options: [...currentQuestion.options, { 
                option_text: '', 
                order: currentQuestion.options.length + 1 
            }]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await actions.createForm(newForm);
        if (result) {
            setShowCreateForm(false);
            setNewForm({
                title: '',
                description: '',
                questions: []
            });
            // Recargar formularios
            await actions.getForms(store.currentUser.company_id);
        }
    };

    const handleFormClick = (formId) => {
        navigate(`/forms/${formId}/respond`);
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Mis Formularios</h1>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? "Cancelar" : "Crear Nuevo Formulario"}
                </button>
            </div>

            {loading ? (
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            ) : forms.length === 0 ? (
                <div className="text-center">
                    <p>No hay formularios creados. ¡Crea tu primer formulario!</p>
                </div>
            ) : (
                <div className="row g-4">
                    {forms.map((form) => (
                        <div key={form.id} className="col-md-4">
                            <div className="location-card" onClick={() => handleFormClick(form.id)}>
                                <div className="location-info">
                                    <h5 className="mb-2">{form.title}</h5>
                                    <small className="text-muted">Preguntas: {form.questions.length}</small>
                                </div>
                                <div className="location-overlay">
                                    <h5>{form.title}</h5>
                                    <div className="location-overlay-content">
                                        <p><strong>Descripción:</strong> {form.description}</p>
                                        <p><strong>Preguntas:</strong> {form.questions.length}</p>
                                        <p><strong>Creado:</strong> {new Date(form.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="location-overlay-actions">
                                        <button 
                                            className="action-button edit-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFormClick(form.id);
                                            }}
                                        >
                                            <i className="fas fa-pencil-alt"></i>
                                            <span>Responder</span>
                                        </button>
                                        <button 
                                            className="action-button delete-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                actions.deleteForm(form.id);
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

            {showCreateForm && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Nuevo Formulario</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateForm(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Título del Formulario *</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            value={newForm.title}
                                            onChange={(e) => setNewForm({...newForm, title: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Descripción</label>
                                        <textarea 
                                            className="form-control"
                                            value={newForm.description}
                                            onChange={(e) => setNewForm({...newForm, description: e.target.value})}
                                            rows="3"
                                        />
                                    </div>

                                    <h6 className="mt-4">Preguntas Agregadas</h6>
                                    {newForm.questions.map((q, index) => (
                                        <div key={index} className="card mb-2 p-2">
                                            <p className="mb-1"><strong>{q.question_text}</strong></p>
                                            <small>Tipo: {questionTypes.find(t => t.value === q.question_type)?.label}</small>
                                            {q.options && q.options.length > 0 && (
                                                <div className="mt-1">
                                                    <small>Opciones: {q.options.map(o => o.option_text).join(', ')}</small>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <h6 className="mt-4">Agregar Nueva Pregunta</h6>
                                    <div className="card p-3 mb-3">
                                        <div className="mb-3">
                                            <label className="form-label">Pregunta</label>
                                            <input 
                                                type="text" 
                                                className="form-control"
                                                value={currentQuestion.question_text}
                                                onChange={(e) => setCurrentQuestion({
                                                    ...currentQuestion, 
                                                    question_text: e.target.value
                                                })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Tipo de Pregunta</label>
                                            <select 
                                                className="form-select"
                                                value={currentQuestion.question_type}
                                                onChange={(e) => setCurrentQuestion({
                                                    ...currentQuestion, 
                                                    question_type: e.target.value,
                                                    options: []
                                                })}
                                            >
                                                <option value="">Seleccionar tipo</option>
                                                {questionTypes.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <div className="form-check">
                                                <input 
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={currentQuestion.required}
                                                    onChange={(e) => setCurrentQuestion({
                                                        ...currentQuestion,
                                                        required: e.target.checked
                                                    })}
                                                />
                                                <label className="form-check-label">Obligatoria</label>
                                            </div>
                                        </div>

                                        {['multiple_choice', 'checkbox'].includes(currentQuestion.question_type) && (
                                            <div className="mb-3">
                                                <label className="form-label">Opciones</label>
                                                {currentQuestion.options.map((option, index) => (
                                                    <input
                                                        key={index}
                                                        type="text"
                                                        className="form-control mb-2"
                                                        placeholder={`Opción ${index + 1}`}
                                                        value={option.option_text}
                                                        onChange={(e) => {
                                                            const newOptions = [...currentQuestion.options];
                                                            newOptions[index].option_text = e.target.value;
                                                            setCurrentQuestion({
                                                                ...currentQuestion,
                                                                options: newOptions
                                                            });
                                                        }}
                                                    />
                                                ))}
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={handleAddOption}
                                                >
                                                    + Agregar Opción
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleAddQuestion}
                                        >
                                            Agregar Pregunta
                                        </button>
                                    </div>

                                    <div className="modal-footer">
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary" 
                                            onClick={() => setShowCreateForm(false)}
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary"
                                            disabled={newForm.questions.length === 0}
                                        >
                                            Guardar Formulario
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