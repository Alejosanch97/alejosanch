import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Context } from '../store/appContext';

export const FormResponse = () => {
    const { formId } = useParams();
    const navigate = useNavigate();
    const { store, actions } = useContext(Context);
    const [form, setForm] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Cargar formulario
                const forms = store.forms;
                const currentForm = forms.find(f => f.id === parseInt(formId));
                
                // Cargar ubicaciones si hay preguntas de tipo 'locations'
                if (currentForm && currentForm.questions.some(q => q.question_type === 'locations')) {
                    const response = await fetch(
                        `${process.env.BACKEND_URL}/api/locations?company_id=${store.currentUser.company_id}`,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        }
                    );
                    const locationData = await response.json();
                    setLocations(locationData);
                }

                if (currentForm) {
                    setForm(currentForm);
                    // Inicializar respuestas
                    const initialAnswers = {};
                    currentForm.questions.forEach(q => {
                        initialAnswers[q.id] = q.question_type === 'checkbox' || q.question_type === 'locations' ? [] : '';
                    });
                    setAnswers(initialAnswers);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [formId, store.forms, store.currentUser.company_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
            question_id: parseInt(questionId),
            answer_text: typeof value === 'string' ? value : '',
            selected_options: Array.isArray(value) ? value : []
        }));

        const response = await actions.submitFormResponse(formId, formattedAnswers);
        if (response) {
            navigate('/forms');
        }
    };

    const handleAnswerChange = (questionId, value, type) => {
        if (type === 'checkbox') {
            setAnswers(prev => ({
                ...prev,
                [questionId]: Array.isArray(prev[questionId]) 
                    ? prev[questionId].includes(value)
                        ? prev[questionId].filter(v => v !== value)
                        : [...prev[questionId], value]
                    : [value]
            }));
        } else {
            setAnswers(prev => ({
                ...prev,
                [questionId]: value
            }));
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="alert alert-danger">
                Formulario no encontrado
            </div>
        );
    }

    return (
        <div className="container py-4">
            {loading ? (
                <div className="text-center mt-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            ) : !form ? (
                <div className="alert alert-danger">
                    Formulario no encontrado
                </div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3>{form.title}</h3>
                        <p className="text-muted mb-0">{form.description}</p>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            {form.questions.map((question, index) => (
                                <div key={question.id} className="mb-4">
                                    <label className="form-label">
                                        {index + 1}. {question.question_text}
                                        {question.required && <span className="text-danger ms-1">*</span>}
                                    </label>
    
                                    {question.question_type === 'text' && (
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={answers[question.id] || ''}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            required={question.required}
                                        />
                                    )}
    
                                    {question.question_type === 'long_text' && (
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={answers[question.id] || ''}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            required={question.required}
                                        />
                                    )}
    
                                    {question.question_type === 'multiple_choice' && (
                                        <div className="mt-2">
                                            {question.options.map((option) => (
                                                <div key={option.id} className="form-check">
                                                    <input
                                                        type="radio"
                                                        className="form-check-input"
                                                        name={`question_${question.id}`}
                                                        value={option.id}
                                                        checked={answers[question.id] === option.id.toString()}
                                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                        required={question.required}
                                                    />
                                                    <label className="form-check-label">
                                                        {option.option_text}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
    
                                    {question.question_type === 'checkbox' && (
                                        <div className="mt-2">
                                            {question.options.map((option) => (
                                                <div key={option.id} className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        value={option.id}
                                                        checked={answers[question.id]?.includes(option.id.toString())}
                                                        onChange={(e) => handleAnswerChange(
                                                            question.id,
                                                            e.target.value,
                                                            'checkbox'
                                                        )}
                                                    />
                                                    <label className="form-check-label">
                                                        {option.option_text}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
    
                                    {question.question_type === 'locations' && (
                                        <div className="mt-2">
                                            {locations.map((location) => (
                                                <div key={location.id} className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        value={location.id}
                                                        checked={answers[question.id]?.includes(location.id.toString())}
                                                        onChange={(e) => handleAnswerChange(
                                                            question.id,
                                                            e.target.value,
                                                            'checkbox'
                                                        )}
                                                        required={question.required && answers[question.id]?.length === 0}
                                                    />
                                                    <label className="form-check-label">
                                                        {location.name} - {location.space_type} 
                                                        <small className="text-muted ms-2">
                                                            ({location.area}m² - {location.cleaning_frequency})
                                                        </small>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
    
                            <div className="d-flex justify-content-between mt-4">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/forms')}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Enviar Respuestas
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormResponse;