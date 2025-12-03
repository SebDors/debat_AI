import os
import json
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# --- 1. CONFIGURATION ET CHARGEMENT DE LA CLÉ ---

# On récupère le chemin du fichier actuel pour savoir où on est
current_file_path = Path(__file__).resolve()

# On remonte de 3 niveaux pour trouver la racine (ai_engine -> backend -> RACINE)
project_root = current_file_path.parent.parent.parent
env_path = project_root / ".env"

# On charge le fichier .env
load_dotenv(dotenv_path=env_path)

# On récupère la clé
api_key = os.getenv("OPENAI_API_KEY")

# Sécurité : on vérifie que la clé est bien là
if not api_key:
    raise ValueError(f"ERREUR : La clé 'OPENAI_API_KEY' est introuvable.\nLe script a cherché le fichier .env ici : {env_path}")

# Initialisation du client OpenAI
client = OpenAI(api_key=api_key)

# --- 2. LOGIQUE MÉTIER (TON CODE IA) ---

SYSTEM_PROMPT = """
Tu es un expert en "Argument Mining". Ton rôle est d'analyser une phrase dans un débat.
Tu dois extraire la structure logique au format JSON strict.
Si l'utilisateur attaque un argument précédent, identifie-le.

Format de sortie attendu :
{
  "content": "résumé court de l'argument",
  "type": "claim" (affirmation) ou "premise" (preuve),
  "relation": "attack" ou "support" ou "none" (si c'est le premier argument),
  "target_id": "ID de l'argument visé (si applicable)"
}
"""

def analyze_input(user_text, context_history):
    """
    user_text: Le message actuel
    context_history: Liste des arguments précédents pour donner du contexte au LLM
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo", # Utilise un modèle intelligent pour la logique
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Historique: {context_history}\n\nNouveau message: {user_text}"}
            ]
        )
        # On convertit le texte JSON reçu en dictionnaire Python utilisable
        return json.loads(response.choices[0].message.content)
    
    except Exception as e:
        print(f"Erreur lors de l'appel OpenAI : {e}")
        return {"error": str(e)}

# --- 3. TEST (Ne s'exécute que si tu lances ce fichier directement) ---
if __name__ == "__main__":
    print("--- Test de connexion et d'analyse ---")
    
    # Exemple de faux historique
    historique_test = [
        {"id": "arg1", "content": "Il faut investir dans le nucléaire.", "type": "claim"}
    ]
    
    # Test d'une réponse qui attaque
    message_test = "Non, c'est trop dangereux et les déchets restent des milliers d'années."
    
    resultat = analyze_input(message_test, historique_test)
    
    print("Résultat reçu du LLM :")
    print(json.dumps(resultat, indent=2, ensure_ascii=False))