import os  
from flask import Flask, jsonify  
from dotenv import load_dotenv  

load_dotenv()  

app = Flask(__name__) 
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")  


@app.route("/")  
def index():  
    return jsonify(
        {
            "proyecto": "Sistema de Organización de Datos de Escribanía",
            "estado": "entorno inicial funcionando",
        }
    )  


if __name__ == "__main__": 
    app.run(debug=True) 
