from flask import Flask, render_template, request, redirect, url_for
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv
import os 
import logging

from extensions import db
from models import User
from routes.stueck import stueck_bp
from routes.person import person_bp
from routes.komponiert import komponiert_bp
from routes.arrangiert import arrangiert_bp


load_dotenv()

app = Flask(__name__)


app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['PREFERRED_URL_SCHEME'] = 'https'

# Apply ProxyFix middleware
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Initialize the app
db.init_app(app)

# Initialize LoginManager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Register blueprints for different routes
app.register_blueprint(stueck_bp, url_prefix='/api/stueck')
app.register_blueprint(person_bp, url_prefix='/api/person')
app.register_blueprint(komponiert_bp, url_prefix='/api/komponiert')
app.register_blueprint(arrangiert_bp, url_prefix='/api/arrangiert')

@app.context_processor
def inject_user():
    return dict(current_user=current_user)

# Configure logging
logging.basicConfig(filename='app.log', level=logging.INFO, format='%(asctime)s - %(message)s')

@app.route("/")
@login_required
def index():
    # Debug: Output current user ID and admin status
    user_info = f"Current User ID: {current_user.id}, Is Admin: {current_user.is_admin}"
    logging.info(user_info)
    # Render the main index page
    return render_template("index.html", user_info=user_info)

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form['username'].lower()
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)  # Log in the user
            return render_template("index.html")
        else:
            return redirect(url_for('login', error=True))
    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route("/admin/users", methods=["GET"])
@login_required
def manage_users():
    if not current_user.is_admin:
        return redirect(url_for('index'))
    users = User.query.all()
    return render_template("manage_users.html", users=users)

@app.route("/admin/users/add", methods=["POST"])
@login_required
def add_user():
    if not current_user.is_admin:
        return redirect(url_for('index'))
    username = request.form['username']
    password = request.form['password']
    is_admin = 'is_admin' in request.form
    new_user = User(username=username, is_admin=is_admin)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return redirect(url_for('manage_users'))

@app.route("/admin/users/delete/<int:user_id>", methods=["POST"])
@login_required
def delete_user(user_id):
    if not current_user.is_admin:
        return redirect(url_for('index'))
    user = User.query.get(user_id)
    db.session.delete(user)
    db.session.commit()
    return redirect(url_for('manage_users'))

@app.route("/admin/users/reset_password/<int:user_id>", methods=["POST"])
@login_required
def reset_password(user_id):
    if not current_user.is_admin:
        return redirect(url_for('index'))
    user = User.query.get(user_id)
    new_password = request.form['new_password']
    user.set_password(new_password)
    db.session.commit()
    return redirect(url_for('manage_users'))

@app.route("/admin/users/update_rights/<int:user_id>", methods=["POST"])
@login_required
def update_rights(user_id):
    if not current_user.is_admin:
        return redirect(url_for('index'))
    user = User.query.get(user_id)
    user.is_admin = 'is_admin' in request.form
    db.session.commit()
    return redirect(url_for('manage_users'))

if __name__ == '__main__':
    # Run the Flask application
    app.run(host='0.0.0.0', port=5000, debug=False)
