from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

class Stueck(db.Model):
    stid = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    schwierigkeit = db.Column(db.String(255))
    genre = db.Column(db.String(255))
    isdigitalisiert = db.Column(db.Boolean)
    jahr = db.Column(db.Integer)
    composers = db.relationship('Komponiert', backref='stueck', cascade="all, delete-orphan")
    arrangers = db.relationship('Arrangiert', backref='stueck', cascade="all, delete-orphan")

class Person(db.Model):
    pid = db.Column(db.Integer, primary_key=True)
    vorname = db.Column(db.String(255))
    name = db.Column(db.String(255))

class Arrangiert(db.Model):
    aid = db.Column(db.Integer, primary_key=True)
    stid = db.Column(db.Integer, db.ForeignKey('stueck.stid'))
    pid = db.Column(db.Integer, db.ForeignKey('person.pid'))
    person = db.relationship('Person', backref='arrangiert')

class Komponiert(db.Model):
    kid = db.Column(db.Integer, primary_key=True)
    stid = db.Column(db.Integer, db.ForeignKey('stueck.stid'))
    pid = db.Column(db.Integer, db.ForeignKey('person.pid'))
    person = db.relationship('Person', backref='komponiert')

class User(UserMixin, db.Model):
    uid = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
<<<<<<< Updated upstream
        return check_password_hash(self.password_hash, password)
=======
        return check_password_hash(self.password_hash, password)
    
    def get_id(self):
        return int(self.uid)
>>>>>>> Stashed changes
