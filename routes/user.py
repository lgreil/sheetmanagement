from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import User
from extensions import db

user_bp = Blueprint('user', __name__, url_prefix='/api')  # Added URL prefix

@user_bp.route("/admin/users", methods=["GET"])
@login_required
def manage_users():
    if not current_user.is_admin:
        return redirect(url_for('index'))
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])  # Return JSON data

@user_bp.route("/admin/users/add", methods=["POST"])
@login_required
def add_user():
    if not current_user.is_admin:
        return redirect(url_for('index'))
    data = request.get_json()
    username = data['username']
    password = data['password']
    is_admin = data['is_admin']
    new_user = User(username=username, is_admin=is_admin)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify(success=True, user=new_user.to_dict())

@user_bp.route("/admin/users/delete/<int:user_id>", methods=["POST"])
@login_required
def delete_user(user_id):
    if not current_user.is_admin:
        return redirect(url_for('index'))
    user = User.query.get(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify(success=True)

@user_bp.route("/admin/users/reset_password/<int:user_id>", methods=["POST"])
@login_required
def reset_password(user_id):
    if not current_user.is_admin:
        return redirect(url_for('index'))
    data = request.get_json()
    user = User.query.get(user_id)
    new_password = data['new_password']
    user.set_password(new_password)
    db.session.commit()
    return jsonify(success=True)

@user_bp.route("/admin/users/update_rights/<int:user_id>", methods=["POST"])
@login_required
def update_rights(user_id):
    if not current_user.is_admin:
        return redirect(url_for('index'))
    data = request.get_json()
    user = User.query.get(user_id)
    user.is_admin = data['is_admin']
    db.session.commit()
    return jsonify(success=True)

@user_bp.route("/admin/manage_users", methods=["GET"])  # New route to render the user management page
@login_required
def manage_users_page():
    if not current_user.is_admin:
        return redirect(url_for('index'))
    return render_template("manage_users.html")
