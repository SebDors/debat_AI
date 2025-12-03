import net.sf.tweety.arg.dung.syntax.Argument;
import net.sf.tweety.arg.dung.syntax.Attack;
import net.sf.tweety.arg.dung.syntax.DungTheory;
import net.sf.tweety.arg.dung.reasoner.SimpleGroundedReasoner;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public class DebateSolver {
    public static void main(String[] args) {
        // args[0] contiendra la chaine envoyée par Python
        // format attendu: "arg(id1),arg(id2),att(id2,id1)"
        
        if (args.length == 0) {
            System.out.println("Erreur: Aucun argument reçu.");
            return;
        }

        String input = args[0];
        DungTheory theory = new DungTheory();
        Map<String, Argument> mapArgs = new HashMap<>();

        // On découpe par virgule
        String[] instructions = input.split(",");

        for (String instr : instructions) {
            instr = instr.trim();
            
            // Si c'est un argument : arg(monID)
            if (instr.startsWith("arg(")) {
                String id = instr.substring(4, instr.length() - 1);
                Argument a = new Argument(id);
                theory.add(a);
                mapArgs.put(id, a);
            }
            // Si c'est une attaque : att(attaquant,victime)
            else if (instr.startsWith("att(")) {
                String content = instr.substring(4, instr.length() - 1); // retire att( et )
                String[] parts = content.split(":"); // On utilisera : comme séparateur interne
                
                String idAttaquant = parts[0];
                String idVictime = parts[1];

                Argument source = mapArgs.get(idAttaquant);
                Argument target = mapArgs.get(idVictime);

                if (source != null && target != null) {
                    theory.add(new Attack(source, target));
                }
            }
        }

        // Calcul
        SimpleGroundedReasoner reasoner = new SimpleGroundedReasoner();
        Collection<Argument> gagnants = reasoner.getModel(theory);

        // On affiche juste les IDs gagnants pour que Python puisse lire facilement
        System.out.println("GAGNANTS:" + gagnants);
    }
}