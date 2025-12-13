-- ============================================================
-- 1. INSERTION DES UTILISATEURS
-- ============================================================
INSERT INTO users (username) VALUES ('Alice');
INSERT INTO users (username) VALUES ('Bob');


-- ============================================================
-- 2. INSERTION DES SUJETS DE DÉBAT (TOPICS)
-- ============================================================
-- ID 1
INSERT INTO debates (topic) VALUES ('L''IA va-t-elle remplacer les humains ?');
-- ID 2
INSERT INTO debates (topic) VALUES ('Le nucléaire est-il indispensable pour la transition écologique ?');
-- ID 3
INSERT INTO debates (topic) VALUES ('Faut-il instaurer un revenu universel ?');
-- ID 4
INSERT INTO debates (topic) VALUES ('Les réseaux sociaux sont-ils un danger pour la démocratie ?');
-- ID 5
INSERT INTO debates (topic) VALUES ('Les chiens sont-ils meilleurs que les chats ?');
-- ID 6
INSERT INTO debates (topic) VALUES ('Pour ou contre les boissons gazeuses ?');


-- ============================================================
-- 3. SCÉNARIO 1 : DÉBAT SUR L'IA (ID=1)
-- Session : '1_Alice_Bob'
-- ============================================================

-- Message 1 (Alice) : Racine
INSERT INTO messages 
    (content, user_id, debate_id, arg_type, relation_type, target_id, session_id, feedback)
VALUES 
    (
        'Je pense que l''IA est un outil puissant qui augmentera nos capacités, plutôt que de nous remplacer.',
        (SELECT id FROM users WHERE username = 'Alice'),
        (SELECT id FROM debates WHERE topic = 'L''IA va-t-elle remplacer les humains ?'),
        'claim', 'none', NULL, 
        '1_Alice_Bob',
        'Affirmation claire et positive. Manque peut-être d''un exemple concret.'
    );

-- Message 2 (Bob) : Attaque le message 1
INSERT INTO messages 
    (content, user_id, debate_id, arg_type, relation_type, target_id, session_id, feedback)
VALUES 
    (
        'Cependant, l''automatisation avancée pourrait bien rendre certains emplois obsolètes, créant des défis sociaux majeurs.',
        (SELECT id FROM users WHERE username = 'Bob'),
        (SELECT id FROM debates WHERE topic = 'L''IA va-t-elle remplacer les humains ?'),
        'claim', 'attack', 
        (SELECT id FROM messages WHERE content LIKE 'Je pense que l''IA%' AND session_id = '1_Alice_Bob'),
        '1_Alice_Bob',
        'Contre-argument valide sur l''aspect social et économique.'
    );

-- Message 3 (Alice) : Attaque le message 2
INSERT INTO messages 
    (content, user_id, debate_id, arg_type, relation_type, target_id, session_id, feedback)
VALUES 
    (
        'Tout dépend de la façon dont nous gérons cette transition et investissons dans la formation. L''histoire montre que la technologie crée plus d''emplois qu''elle n''en détruit.',
        (SELECT id FROM users WHERE username = 'Alice'),
        (SELECT id FROM debates WHERE topic = 'L''IA va-t-elle remplacer les humains ?'),
        'premise', 'attack', 
        (SELECT id FROM messages WHERE content LIKE 'Cependant%' AND session_id = '1_Alice_Bob'),
        '1_Alice_Bob',
        'Bonne utilisation d''une preuve historique (la technologie crée de l''emploi).'
    );


-- ============================================================
-- 4. SCÉNARIO 2 : DÉBAT SUR LE NUCLÉAIRE (ID=2)
-- Session : '2_Alice_Bob' (Note le 2 au début)
-- ============================================================

-- Message 1 (Alice) : Racine
INSERT INTO messages 
    (content, user_id, debate_id, arg_type, relation_type, target_id, session_id, feedback)
VALUES 
    (
        'Sans le nucléaire, nous ne pourrons jamais atteindre la neutralité carbone à temps car les énergies renouvelables sont intermittentes.',
        (SELECT id FROM users WHERE username = 'Alice'),
        (SELECT id FROM debates WHERE topic LIKE 'Le nucléaire%'),
        'claim', 'none', NULL, 
        '2_Alice_Bob',
        'Argument fort basé sur l''urgence climatique et la contrainte technique.'
    );

-- Message 2 (Bob) : Attaque le message 1
INSERT INTO messages 
    (content, user_id, debate_id, arg_type, relation_type, target_id, session_id, feedback)
VALUES 
    (
        'C''est un pari risqué. La gestion des déchets radioactifs sur des milliers d''années pose un problème éthique majeur que nous léguons aux générations futures.',
        (SELECT id FROM users WHERE username = 'Bob'),
        (SELECT id FROM debates WHERE topic LIKE 'Le nucléaire%'),
        'claim', 'attack', 
        (SELECT id FROM messages WHERE content LIKE 'Sans le nucléaire%' AND session_id = '2_Alice_Bob'),
        '2_Alice_Bob',
        'Argument éthique pertinent. Sophisme de la pente savonneuse évité.'
    );

-- Message 3 (Alice) : Attaque le message 2 (Solution technique)
INSERT INTO messages 
    (content, user_id, debate_id, arg_type, relation_type, target_id, session_id, feedback)
VALUES 
    (
        'Les nouvelles technologies de réacteurs (Génération IV) permettent de recycler une grande partie de ces déchets et de réduire leur durée de vie.',
        (SELECT id FROM users WHERE username = 'Alice'),
        (SELECT id FROM debates WHERE topic LIKE 'Le nucléaire%'),
        'premise', 'attack', 
        (SELECT id FROM messages WHERE content LIKE 'C''est un pari risqué%' AND session_id = '2_Alice_Bob'),
        '2_Alice_Bob',
        'Contre-attaque factuelle basée sur l''innovation technologique.'
    );