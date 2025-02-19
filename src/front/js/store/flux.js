const getState = ({ getStore, getActions, setStore }) => {
    return {
        store: {
            message: null,
            demo: [
                {
                    title: "FIRST",
                    background: "white",
                    initial: "white"
                },
                {
                    title: "SECOND",
                    background: "white",
                    initial: "white"
                }
            ],
            // Nuevo estado agregado
            token: localStorage.getItem("token") || null,
            currentUser: JSON.parse(localStorage.getItem("currentUser")) || null,
            locations: [],
            forms: [],
            formResponses: [],
            selectedForm: null,
            loading: false,
            error: null
        },
        actions: {
            // Use getActions to call a function within a fuction
            exampleFunction: () => {
                getActions().changeColor(0, "green");
            },

            getMessage: async () => {
                try {
                    // fetching data from the backend
                    const resp = await fetch(process.env.BACKEND_URL + "/api/hello")
                    const data = await resp.json()
                    setStore({ message: data.message })
                    // don't forget to return something, that is how the async resolves
                    return data;
                } catch (error) {
                    console.log("Error loading message from backend", error)
                }
            },

            changeColor: (index, color) => {
                //get the store
                const store = getStore();

                //we have to loop the entire demo array to look for the respective index
                //and change its color
                const demo = store.demo.map((elm, i) => {
                    if (i === index) elm.background = color;
                    return elm;
                });

                //reset the global store
                setStore({ demo: demo });
            },

            // Nuevas acciones agregadas
            getValidToken: () => {
                const store = getStore();
                const token = store.token;
                
                if (!token) {
                    throw new Error('No token available');
                }
                
                // Verificar si el token ha expirado
                try {
                    const tokenParts = token.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        const expTime = payload.exp * 1000; // Convertir a milisegundos
                        
                        if (Date.now() >= expTime) {
                            throw new Error('Token has expired');
                        }
                    }
                } catch (error) {
                    console.error("Error validating token:", error);
                    throw new Error('Invalid token format');
                }
                
                return token;
            },

            register: async (userData) => {
                try {
                    setStore({ loading: true, error: null });
                    
                    const resp = await fetch(`${process.env.BACKEND_URL}/api/register`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: userData.email,
                            password: userData.password,
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            companyName: userData.companyName
                        })
                    });
                    
                    const data = await resp.json();
                    
                    if (!resp.ok) {
                        throw new Error(data.message || 'Error en el registro');
                    }
                    
                    return true;
                } catch (error) {
                    setStore({ error: error.message });
                    return false;
                } finally {
                    setStore({ loading: false });
                }
            },

            login: async (credentials) => {
                try {
                    setStore({ loading: true, error: null });
                    
                    const resp = await fetch(`${process.env.BACKEND_URL}/api/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(credentials)
                    });
                    
                    const data = await resp.json();
                    
                    if (!resp.ok) {
                        throw new Error(data.message || 'Error en el login');
                    }
                    
                    // Asegurarse de extraer el token exactamente como viene en la respuesta
                    const token = data.access_token;
                    
                    // Guardar en localStorage y store
                    localStorage.setItem("token", token);
                    localStorage.setItem("currentUser", JSON.stringify(data.user));
                    
                    // Actualizar el store con el token exacto
                    setStore({
                        token: token,
                        currentUser: data.user
                    });
            
                    console.log("Token guardado:", token); // Para debug
                    return true;
                } catch (error) {
                    console.error("Error en login:", error);
                    setStore({ error: error.message });
                    return false;
                } finally {
                    setStore({ loading: false });
                }
            },

            logout: () => {
                // Limpiar localStorage
                localStorage.removeItem("token");
                localStorage.removeItem("currentUser");
                
                // Limpiar store
                setStore({ 
                    token: null,
                    currentUser: null,
                    locations: [],
                    forms: []
                });
            },
            
            createLocation: async (locationData) => {
                try {
                    const store = getStore();
                    
                    const resp = await fetch(`${process.env.BACKEND_URL}/api/locations`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            ...locationData,
                            company_id: store.currentUser.company_id,  // Obtener del usuario actual
                            created_by: store.currentUser.id  // Obtener del usuario actual
                        })
                    });
                    
                    const data = await resp.json();
                    
                    if (!resp.ok) {
                        throw new Error(data.message || 'Error creating location');
                    }
                    
                    return data;
                } catch (error) {
                    console.error("Error detallado en createLocation:", error);
                    throw error;
                }
            },

            updateLocation: async (locationId, locationData) => {
                try {
                    const store = getStore();
                    
                    const resp = await fetch(`${process.env.BACKEND_URL}/api/locations/${locationId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            ...locationData,
                            company_id: store.currentUser.company_id,
                            created_by: store.currentUser.id
                        })
                    });
                    
                    const data = await resp.json();
                    
                    if (!resp.ok) {
                        throw new Error(data.message || 'Error updating location');
                    }
                    
                    // Actualizar la lista de ubicaciones en el store
                    const updatedLocations = store.locations.map(loc => 
                        loc.id === locationId ? data : loc
                    );
                    setStore({ locations: updatedLocations });
                    
                    return data;
                } catch (error) {
                    console.error("Error updating location:", error);
                    throw error;
                }
            },
            
            deleteLocation: async (locationId) => {
                try {
                    const store = getStore();
                    
                    const resp = await fetch(`${process.env.BACKEND_URL}/api/locations/${locationId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (!resp.ok) {
                        const data = await resp.json();
                        throw new Error(data.message || 'Error deleting location');
                    }
                    
                    // Actualizar la lista de ubicaciones en el store
                    const updatedLocations = store.locations.filter(loc => loc.id !== locationId);
                    setStore({ locations: updatedLocations });
                    
                    return true;
                } catch (error) {
                    console.error("Error deleting location:", error);
                    throw error;
                }
            },

            getForms: async (companyId) => {
                try {
                    setStore({ loading: true, error: null });
                    
                    const resp = await fetch(`${process.env.BACKEND_URL}/api/forms?company_id=${companyId}`);
                    const data = await resp.json();
                    
                    if (!resp.ok) {
                        throw new Error(data.message || 'Error al obtener formularios');
                    }
                    
                    setStore({ forms: data });
                    return data;
                } catch (error) {
                    setStore({ error: error.message });
                    console.error("Error fetching forms:", error);
                    return null;
                } finally {
                    setStore({ loading: false });
                }
            },
            
            createForm: async (formData) => {
                try {
                    const store = getStore();
                    setStore({ loading: true, error: null });
                    
                    const resp = await fetch(`${process.env.BACKEND_URL}/api/forms`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...formData,
                            company_id: store.currentUser.company_id,
                            created_by: store.currentUser.id
                        })
                    });
                    
                    const data = await resp.json();
                    
                    if (!resp.ok) {
                        throw new Error(data.message || 'Error al crear formulario');
                    }
                    
                    // Actualizar la lista de formularios
                    const forms = [...store.forms, data];
                    setStore({ forms });
                    
                    return data;
                } catch (error) {
                    setStore({ error: error.message });
                    console.error("Error creating form:", error);
                    return null;
                } finally {
                    setStore({ loading: false });
                }
            },
            
            deleteForm: async (formId) => {
                try {
                    const store = getStore();
                    setStore({ loading: true, error: null });
                    
                    const resp = await fetch(`${process.env.BACKEND_URL}/api/forms/${formId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!resp.ok) {
                        const data = await resp.json();
                        throw new Error(data.message || 'Error al eliminar formulario');
                    }
                    
                    // Actualizar la lista de formularios
                    const updatedForms = store.forms.filter(form => form.id !== formId);
                    setStore({ forms: updatedForms });
                    
                    return true;
                } catch (error) {
                    setStore({ error: error.message });
                    console.error("Error deleting form:", error);
                    return false;
                } finally {
                    setStore({ loading: false });
                }
            },

            submitFormResponse: async (formId, answers) => {
                try {
                    const store = getStore();
                    const baseUrl = process.env.BACKEND_URL.replace(/\/+$/, '');
                    
                    // Formatear las respuestas correctamente
                    const formattedAnswers = answers.map(answer => ({
                        question_id: parseInt(answer.question_id),
                        answer_text: answer.answer_text || '',
                        selected_options: Array.isArray(answer.selected_options) 
                            ? answer.selected_options.map(opt => opt.toString()) // Asegurarse de que los IDs sean strings
                            : []
                    }));
            
                    const resp = await fetch(`${baseUrl}/api/forms/${formId}/respond`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            form_id: parseInt(formId),
                            user_id: store.currentUser.id,
                            answers: formattedAnswers
                        })
                    });
            
                    if (!resp.ok) {
                        const errorData = await resp.json();
                        throw new Error(errorData.message || 'Error al enviar respuesta');
                    }
                    
                    const data = await resp.json();
                    return data;
                } catch (error) {
                    console.error("Error submitting form response:", error);
                    setStore({ error: error.message });
                    return null;
                }
            },

            getFormResponses: async (formId) => {
                try {
                    const resp = await fetch(`${process.env.BACKEND_URL}/api/forms/${formId}/responses`);
                    const data = await resp.json();
                    
                    if (!resp.ok) {
                        throw new Error(data.message || 'Error al obtener respuestas');
                    }
                    
                    return data;
                } catch (error) {
                    console.error("Error fetching form responses:", error);
                    throw error;
                }
            },

            clearError: () => {
                setStore({ error: null });
            }
        }
    };
};

export default getState;