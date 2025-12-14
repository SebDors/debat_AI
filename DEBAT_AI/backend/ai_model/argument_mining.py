import os
import json
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# --- CONFIG (La même qu'avant) ---
current_file_path = Path(__file__).resolve()
project_root = current_file_path.parent.parent.parent
env_path = project_root / ".env"
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("Clé API manquante")

client = OpenAI(api_key=api_key)

# --- 1. ANALYSE + CRITIQUE (Amélioré) ---
SYSTEM_PROMPT_ANALYSIS = """
Tu es un expert en logique formelle. Analyse le message de l'utilisateur.
1. Extrais la structure (type, relation).
2. IDENTIFIE LES FAIBLESSES : Cherche des sophismes (Ad Hominem, Pente savonneuse, etc.) ou manque de preuve.

Format JSON attendu :
{
  "content": "résumé",
  "type": "claim" | "premise",
  "relation": "attack" | "support" | "none",
  "target_id": id_visé | null,
  "feedback": "Une phrase courte de conseil ou critique sur la solidité de l'argument (ex: 'Attention, attaque personnelle detectée'). Sinon null."
}
"""

def analyze_input(user_text, context_history):
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_ANALYSIS},
                {"role": "user", "content": f"Contexte: {context_history}\n\nMessage: {user_text}"}
            ]
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"error": str(e)}

# --- 2. NOUVEAU : GÉNÉRATEUR DE CONTRE-ARGUMENTS ---
SYSTEM_PROMPT_SUGGESTION = """
Tu es un assistant de débat stratégique.
Ton but : Aider l'utilisateur à gagner le débat.
Analyse l'argument cible et propose 3 phrases à répondres d'attaque logiques (Rebuttal, Undercut, Premise Attack).

Format JSON attendu :
{
  "suggestions": [
    "Attaque sur la source : ",
    "Contre-exemple : ",
    "Nuance sur :"
  ]
}
"""

def generate_suggestions(target_text, debate_context):
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_SUGGESTION},
                {"role": "user", "content": f"Contexte du débat: {debate_context}\n\nARGUMENT CIBLE À ATTAQUER: {target_text}"}
            ]
        )
        return json.loads(response.choices[0].message.content).get("suggestions", [])
    except Exception as e:
        print(f"Erreur suggestion: {e}")
        return ["Impossible de générer des suggestions pour le moment."]