from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    users = db.relationship('User', backref='company', lazy=True)
    locations = db.relationship('Location', backref='company', lazy=True)
    forms = db.relationship('Form', backref='company', lazy=True)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # 'admin' or 'user'
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean(), default=True)
    
    # Relaciones
    created_locations = db.relationship('Location', backref='creator', lazy=True,
                                      foreign_keys='Location.created_by')
    created_forms = db.relationship('Form', backref='creator', lazy=True,
                                  foreign_keys='Form.created_by')
    form_responses = db.relationship('FormResponse', backref='respondent', lazy=True)

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat()
        }

class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    space_type = db.Column(db.String(50), nullable=False)  # oficina, almacén, sala de reuniones, etc.
    area = db.Column(db.Float, nullable=False)  # en metros cuadrados
    cleaning_frequency = db.Column(db.String(50), nullable=False)  # diaria, semanal, quincenal, etc.
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')  # active, inactive, maintenance

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "space_type": self.space_type,
            "area": self.area,
            "cleaning_frequency": self.cleaning_frequency,
            "company_id": self.company_id,
            "created_at": self.created_at.isoformat(),
            "description": self.description,
            "status": self.status
        }

class Form(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')  # active, inactive, draft
    
    # Relaciones
    questions = db.relationship('Question', backref='form', lazy=True)
    responses = db.relationship('FormResponse', backref='form', lazy=True)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    form_id = db.Column(db.Integer, db.ForeignKey('form.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False)  # text, multiple_choice, checkbox, locations
    required = db.Column(db.Boolean, default=False)
    order = db.Column(db.Integer, nullable=False)
    
    # Relaciones
    options = db.relationship('QuestionOption', backref='question', lazy=True)
    answers = db.relationship('Answer', backref='question', lazy=True)
    
    def serialize(self):
        return {
            "id": self.id,
            "form_id": self.form_id,
            "question_text": self.question_text,
            "question_type": self.question_type,
            "required": self.required,
            "order": self.order,
            "options": [option.serialize() for option in self.options]
        }

class QuestionOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    option_text = db.Column(db.String(200), nullable=False)
    order = db.Column(db.Integer, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=True)  # Nueva columna
    
    def serialize(self):
        return {
            "id": self.id,
            "question_id": self.question_id,
            "option_text": self.option_text,
            "order": self.order,
            "location_id": self.location_id
        }

class FormResponse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    form_id = db.Column(db.Integer, db.ForeignKey('form.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    answers = db.relationship('Answer', backref='form_response', lazy=True)

class Answer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    form_response_id = db.Column(db.Integer, db.ForeignKey('form_response.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    answer_text = db.Column(db.Text)
    selected_options = db.relationship('QuestionOption', secondary='answer_options',
                                     backref=db.backref('answers', lazy=True))

# Tabla de asociación para respuestas de opción múltiple
answer_options = db.Table('answer_options',
    db.Column('answer_id', db.Integer, db.ForeignKey('answer.id'), primary_key=True),
    db.Column('option_id', db.Integer, db.ForeignKey('question_option.id'), primary_key=True)
)