import React, { useState, useEffect, useContext } from 'react';
import { Context } from '../store/appContext';
import { useParams, useNavigate } from 'react-router-dom';
import "../../styles/FormAnswers.css";

export const FormAnswers = () => {
    const { formId } = useParams();
    const { store, actions } = useContext(Context);
    const [loading, setLoading] = useState(true);
    const [localResponses, setLocalResponses] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        let isMounted = true;

        const loadResponses = async () => {
            try {
                setLoading(true);
                const data = await actions.getFormResponses(formId);
                if (isMounted) {
                    setLocalResponses(data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Error al cargar las respuestas');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadResponses();

        return () => {
            isMounted = false;
        };
    }, [formId, actions]);

    const renderAnswer = (answer, question) => {
        if (!answer) return '—';
        
        if (question.question_type === 'locations') {
            return Array.isArray(answer.selected_options) 
                ? answer.selected_options.map((location, index) => (
                    <span key={index} className="location-tag">
                        {location}
                    </span>
                  ))
                : '—';
        } else if (question.question_type === 'multiple_choice' || question.question_type === 'checkbox') {
            return Array.isArray(answer.selected_options)
                ? answer.selected_options.join(', ')
                : '—';
        } else {
            return answer.answer_text || '—';
        }
    };

    const totalPages = Math.ceil((localResponses?.responses?.length || 0) / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const displayedResponses = localResponses?.responses?.slice(startIndex, startIndex + itemsPerPage) || [];

    if (loading) {
        return (
            <div className="fixed inset-0 modal-overlay flex items-center justify-center">
                <div className="p-8 bg-white rounded-lg shadow-lg text-center">
                    <div className="loading-spinner"></div>
                    <p className="mt-4 text-gray-600">Cargando respuestas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 modal-overlay flex items-center justify-center">
                <div className="p-8 bg-white rounded-lg shadow-lg text-center">
                    <h3 className="text-red-600 text-xl mb-4">Error: {error}</h3>
                    <button 
                        onClick={() => navigate('/forms')}
                        className="close-button"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    if (!localResponses || !localResponses.responses || localResponses.responses.length === 0) {
        return (
            <div className="fixed inset-0 modal-overlay flex items-center justify-center">
                <div className="p-8 bg-white rounded-lg shadow-lg text-center">
                    <h3 className="text-xl mb-4">No hay respuestas para este formulario</h3>
                    <button 
                        onClick={() => navigate('/forms')}
                        className="close-button"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center">
            <div className="modal-container">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {localResponses.form?.title || 'Respuestas del Formulario'}
                    </h2>
                    <button 
                        onClick={() => navigate('/forms')}
                        className="close-button"
                    >
                        ✕
                    </button>
                </div>

                <div className="table-container">
                    <table className="responses-table">
                        <thead>
                            <tr>
                                <th style={{ width: '120px' }}>Usuario</th>
                                <th style={{ width: '120px' }}>Fecha</th>
                                {localResponses.questions?.map((question) => (
                                    <th key={question.id}>
                                        {question.text || question.title}
                                        <div className="question-type-badge">
                                            {question.question_type === 'multiple_choice' ? 'Opción Múltiple' :
                                             question.question_type === 'checkbox' ? 'Casillas' :
                                             question.question_type === 'locations' ? 'Ubicaciones' :
                                             question.question_type === 'long_text' ? 'Texto Largo' : 
                                             'Texto Corto'}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayedResponses.map((response) => (
                                <tr key={response.id}>
                                    <td>{response.user_id}</td>
                                    <td>{new Date(response.created_at).toLocaleDateString()}</td>
                                    {localResponses.questions?.map((question) => {
                                        const answer = response.answers?.find(
                                            a => a.question_id === question.id
                                        );
                                        return (
                                            <td key={question.id}>
                                                {renderAnswer(answer, question)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-container">
                        <div className="text-gray-600">
                            Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, localResponses.responses.length)} de {localResponses.responses.length} respuestas
                        </div>
                        <nav>
                            <ul className="flex gap-2">
                                <li>
                                    <button 
                                        className="pagination-button"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                    >
                                        Anterior
                                    </button>
                                </li>
                                {[...Array(totalPages)].map((_, i) => (
                                    <li key={i}>
                                        <button 
                                            className={`pagination-button ${page === i + 1 ? 'active' : ''}`}
                                            onClick={() => setPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    </li>
                                ))}
                                <li>
                                    <button 
                                        className="pagination-button"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        Siguiente
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormAnswers;