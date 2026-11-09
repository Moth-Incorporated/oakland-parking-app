from flask import Flask, jsonify

from .parking_search import parking_search_bp


def create_app():
    app = Flask(__name__)

    @app.get("/health")
    def health():
        return jsonify(status="ok")

    # Parking Search subsystem (server)
    app.register_blueprint(parking_search_bp, url_prefix="/api")
    return app
