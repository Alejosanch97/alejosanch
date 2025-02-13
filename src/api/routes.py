from flask import Flask, request, jsonify, url_for, Blueprint
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from api.models import db, User, Company, Location, Form, Question, QuestionOption
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from datetime import datetime

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api, resources={
    r"/api/*": {
        "origins": "*",  # En producción, especifica los orígenes permitidos
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Ruta de prueba
@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend"
    }
    return jsonify(response_body), 200

# Rutas de Autenticación
@api.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Verificar si el usuario ya existe
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"message": "Email already registered"}), 400
        
        # Crear nueva empresa
        new_company = Company(
            name=data['companyName']
        )
        
        db.session.add(new_company)
        db.session.flush()  # Para obtener el ID de la empresa
        
        # Crear nuevo usuario
        new_user = User(
            email=data['email'],
            password=generate_password_hash(data['password'], method='pbkdf2:sha256'),
            first_name=data['firstName'],
            last_name=data['lastName'],
            role='admin',  # El primer usuario de la empresa será admin
            company_id=new_company.id
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({"message": "User and company registered successfully"}), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@api.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({"message": "Invalid credentials"}), 401
        
        if not user.is_active:
            return jsonify({"message": "User is inactive"}), 401
        
        access_token = create_access_token(identity=user.id)
        return jsonify({
            "access_token": access_token,  # Sin "Bearer"
            "user": user.serialize()
        }), 200
        
    except Exception as e:
        return jsonify({"message": str(e)}), 400

# Rutas de Locations
@api.route('/locations', methods=['POST'])
def create_location():
    try:
        data = request.get_json()
        
        # Validar que todos los campos requeridos estén presentes
        required_fields = ['name', 'space_type', 'area', 'cleaning_frequency', 'company_id', 'created_by']
        if not all(field in data for field in required_fields):
            return jsonify({"message": "Missing required fields"}), 400
        
        # Verificar que la compañía existe
        company = Company.query.get(data['company_id'])
        if not company:
            return jsonify({"message": "Company not found"}), 404
            
        # Verificar que el usuario existe
        user = User.query.get(data['created_by'])
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        # Crear nueva locación
        new_location = Location(
            name=data['name'],
            space_type=data['space_type'],
            area=float(data['area']),
            cleaning_frequency=data['cleaning_frequency'],
            company_id=data['company_id'],
            created_by=data['created_by'],
            description=data.get('description', '')
        )
        
        db.session.add(new_location)
        db.session.commit()
        
        return jsonify(new_location.serialize()), 201
    
    except Exception as e:
        db.session.rollback()
        print("Error creating location:", str(e))
        return jsonify({"message": "Error creating location"}), 400

@api.route('/locations', methods=['GET'])
def get_locations():
    try:
        company_id = request.args.get('company_id')
        user_id = request.args.get('user_id')
        
        query = Location.query
        
        if company_id:
            query = query.filter_by(company_id=company_id)
        if user_id:
            query = query.filter_by(created_by=user_id)
            
        locations = query.all()
        return jsonify([location.serialize() for location in locations]), 200
        
    except Exception as e:
        return jsonify({"message": str(e)}), 400
    
@api.route('/locations/<int:location_id>', methods=['PUT'])
def update_location(location_id):
    try:
        data = request.get_json()
        location = Location.query.get(location_id)
        
        if not location:
            return jsonify({"message": "Location not found"}), 404
        
        # Actualizar campos
        location.name = data.get('name', location.name)
        location.space_type = data.get('space_type', location.space_type)
        location.area = float(data.get('area', location.area))
        location.cleaning_frequency = data.get('cleaning_frequency', location.cleaning_frequency)
        location.description = data.get('description', location.description)
        
        db.session.commit()
        return jsonify(location.serialize()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@api.route('/locations/<int:location_id>', methods=['DELETE'])
def delete_location(location_id):
    try:
        location = Location.query.get(location_id)
        
        if not location:
            return jsonify({"message": "Location not found"}), 404
        
        db.session.delete(location)
        db.session.commit()
        
        return jsonify({"message": "Location deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400
     
# Rutas de Forms
@api.route('/forms', methods=['GET'])
def get_forms():
    try:
        company_id = request.args.get('company_id')
        forms = Form.query.filter_by(company_id=company_id).all()
        return jsonify([{
            **form.serialize(),
            "questions": [q.serialize() for q in form.questions]
        } for form in forms]), 200
    
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@api.route('/forms', methods=['POST'])
def create_form():
    try:
        data = request.get_json()
        
        # Crear el formulario
        new_form = Form(
            title=data['title'],
            description=data.get('description', ''),
            created_by=data['created_by'],
            company_id=data['company_id']
        )
        
        db.session.add(new_form)
        db.session.flush()  # Para obtener el ID del formulario
        
        # Crear las preguntas y opciones
        for q_data in data.get('questions', []):
            question = Question(
                form_id=new_form.id,
                question_text=q_data['question_text'],
                question_type=q_data['question_type'],
                required=q_data.get('required', False),
                order=q_data['order']
            )
            
            db.session.add(question)
            db.session.flush()
            
            # Crear opciones si es pregunta de opción múltiple
            if q_data['question_type'] in ['multiple_choice', 'checkbox']:
                for opt_data in q_data.get('options', []):
                    option = QuestionOption(
                        question_id=question.id,
                        option_text=opt_data['option_text'],
                        order=opt_data['order']
                    )
                    db.session.add(option)
        
        db.session.commit()
        return jsonify({
            **new_form.serialize(),
            "questions": [q.serialize() for q in new_form.questions]
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@api.route('/forms/<int:form_id>', methods=['DELETE'])
def delete_form(form_id):
    try:
        form = Form.query.get(form_id)
        
        if not form:
            return jsonify({"message": "Form not found"}), 404
        
        # Eliminar las preguntas y opciones relacionadas
        for question in form.questions:
            for option in question.options:
                db.session.delete(option)
            db.session.delete(question)
            
        db.session.delete(form)
        db.session.commit()
        
        return jsonify({"message": "Form deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400