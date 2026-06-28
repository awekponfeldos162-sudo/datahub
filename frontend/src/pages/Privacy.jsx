export default function Privacy() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">
          Dernière mise à jour : 28 juin 2026
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Présentation</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            DATAhub est une plateforme d'analyse multi-réseaux sociaux destinée aux créateurs de contenu
            et aux entreprises du marché africain francophone. Nous accordons une importance primordiale
            à la protection de vos données personnelles.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. Données collectées</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            Dans le cadre de l'utilisation de DATAhub, nous collectons les données suivantes :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Adresse email et nom complet lors de l'inscription</li>
            <li>Tokens d'accès OAuth des réseaux sociaux connectés (chiffrés AES-256-GCM)</li>
            <li>Statistiques publiques de vos comptes sociaux (vues, mentions j'aime, abonnés)</li>
            <li>Données de paiement traitées exclusivement par nos prestataires (Flutterwave, CinetPay)</li>
            <li>Journaux de connexion à des fins de sécurité (adresse IP, horodatage)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. Utilisation des données</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            Vos données sont utilisées uniquement pour :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Afficher vos statistiques dans votre tableau de bord</li>
            <li>Générer des rapports PDF/Excel à votre demande</li>
            <li>Vous envoyer des alertes d'engagement (si activé)</li>
            <li>Améliorer nos services via des analyses agrégées et anonymisées</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
            Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers
            à des fins commerciales.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Accès aux réseaux sociaux</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            DATAhub demande uniquement des permissions en lecture seule sur vos comptes sociaux.
            Nous n'écrivons, ne publions ni ne modifions aucun contenu en votre nom.
            Les tokens OAuth sont chiffrés avant stockage et ne sont jamais exposés en clair.
            Vous pouvez révoquer l'accès à tout moment depuis vos paramètres ou directement
            sur chaque plateforme.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Sécurité</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Chiffrement AES-256-GCM pour tous les tokens OAuth</li>
            <li>Mots de passe hachés avec bcrypt (facteur de coût 12)</li>
            <li>Communications sécurisées via HTTPS / TLS 1.3</li>
            <li>Authentification à deux facteurs (TOTP) disponible</li>
            <li>Journaux d'audit pour toutes les actions sensibles</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Conservation des données</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Vos données sont conservées tant que votre compte est actif. En cas de suppression
            du compte, l'ensemble de vos données personnelles est supprimé dans un délai de 30 jours.
            Les journaux de sécurité sont conservés 90 jours maximum.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Vos droits</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            Conformément aux réglementations en vigueur, vous disposez des droits suivants :
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Droit d'accès à vos données personnelles</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement (« droit à l'oubli »)</li>
            <li>Droit à la portabilité de vos données</li>
            <li>Droit d'opposition au traitement</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
            Pour exercer ces droits, contactez-nous à l'adresse ci-dessous.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">8. Cookies</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            DATAhub utilise uniquement des cookies essentiels au fonctionnement de l'application
            (session, préférences d'affichage). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Pour toute question relative à cette politique ou pour exercer vos droits, contactez-nous :
          </p>
          <p className="mt-2 font-medium">
            <a
              href="mailto:contact@datahub.app"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              contact@datahub.app
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">10. Modifications</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Nous nous réservons le droit de modifier cette politique à tout moment. Toute modification
            substantielle sera notifiée par email aux utilisateurs enregistrés. La date de dernière
            mise à jour figure en haut de cette page.
          </p>
        </section>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-10 text-sm text-gray-500 dark:text-gray-400">
          <a href="/" className="hover:underline">← Retour à l'accueil</a>
        </div>
      </div>
    </div>
  );
}
