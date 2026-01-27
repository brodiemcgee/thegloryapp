// Data Protection page

import { LegalPageLayout } from '@/components/legal';

export const metadata = {
  title: 'Data Protection | theglory.app',
  description: 'Data Protection practices for theglory.app',
};

export default function DataProtectionPage() {
  return (
    <LegalPageLayout title="Data Protection" lastUpdated="January 2025">
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Overview</h2>
        <p className="text-gray-300 mb-3">
          At theglory.app, we take the security and privacy of your data seriously. This document
          outlines the technical and organisational measures we employ to protect your personal
          information.
        </p>
        <p className="text-gray-300">
          Given the sensitive nature of our platform, we implement industry-leading security
          practices to ensure your data remains protected.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. Encryption</h2>

        <h3 className="text-lg font-medium mb-3 mt-4">Data in Transit</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>All data transmitted between your device and our servers uses TLS 1.3 encryption</li>
          <li>API communications are secured with HTTPS</li>
          <li>Real-time connections use secure WebSocket (WSS) protocols</li>
        </ul>

        <h3 className="text-lg font-medium mb-3 mt-4">Data at Rest</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Database storage is encrypted using AES-256 encryption</li>
          <li>Photo and media files are encrypted at rest</li>
          <li>Backup data is encrypted with separate encryption keys</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. Access Controls & Authentication</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Secure authentication via email/password or OAuth providers</li>
          <li>Session tokens with automatic expiration</li>
          <li>Row-level security (RLS) ensures users can only access their own data</li>
          <li>Administrative access requires multi-factor authentication</li>
          <li>Access logs are maintained for audit purposes</li>
          <li>Principle of least privilege for all system access</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. Data Minimisation</h2>
        <p className="text-gray-300 mb-3">
          We practise data minimisation, collecting only the information necessary to provide our
          services:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Optional fields are clearly marked and not required</li>
          <li>Location data is only collected with explicit permission</li>
          <li>We do not collect data from your device beyond what you explicitly provide</li>
          <li>Analytics data is aggregated and anonymised where possible</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. Photo & Message Security</h2>

        <h3 className="text-lg font-medium mb-3 mt-4">Photo Protection</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Photos are stored in secure, access-controlled storage buckets</li>
          <li>Private album photos require explicit access grants and use signed URLs with expiration</li>
          <li>Profile photos are publicly accessible to other app users</li>
          <li>We recommend removing sensitive metadata from photos before uploading</li>
        </ul>

        <h3 className="text-lg font-medium mb-3 mt-4">Message Security</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Messages are stored in encrypted database</li>
          <li>Message content is only accessible to conversation participants</li>
          <li>Deleted messages are permanently removed from our systems</li>
          <li>Message attachments follow the same security protocols as photos</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">6. Location Data Handling</h2>
        <p className="text-gray-300 mb-3">
          Location data is particularly sensitive. We protect it through:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Location sharing is opt-in and can be disabled at any time</li>
          <li>Only your current location is stored; we do not maintain location history</li>
          <li>Distance calculations are performed server-side</li>
          <li>Your location is updated only while the app is active</li>
          <li>Ghost mode allows browsing without revealing your location</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7. Anonymisation & Pseudonymisation</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Analytics data is anonymised before processing</li>
          <li>User IDs are pseudonymous (UUIDs, not real names)</li>
          <li>Reported content is reviewed with user identifiers hidden when possible</li>
          <li>Aggregated statistics do not contain personally identifiable information</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">8. Infrastructure Security</h2>
        <p className="text-gray-300 mb-3">Our infrastructure is built on trusted platforms:</p>

        <h3 className="text-lg font-medium mb-3 mt-4">Supabase</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>SOC 2 Type II certified</li>
          <li>GDPR compliant</li>
          <li>Automatic backups with point-in-time recovery</li>
          <li>DDoS protection and rate limiting</li>
          <li>Isolated database instances</li>
        </ul>

        <h3 className="text-lg font-medium mb-3 mt-4">Hosting</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Deployed on secure, managed infrastructure</li>
          <li>Regular security patches and updates</li>
          <li>Network isolation and firewall protection</li>
          <li>Geographic redundancy for reliability</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">9. Incident Response</h2>
        <p className="text-gray-300 mb-3">
          In the event of a security incident, we follow a structured response process:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li><strong className="text-white">Detection:</strong> Continuous monitoring for suspicious activity</li>
          <li><strong className="text-white">Containment:</strong> Immediate isolation of affected systems</li>
          <li><strong className="text-white">Investigation:</strong> Root cause analysis and impact assessment</li>
          <li><strong className="text-white">Notification:</strong> Affected users notified within 72 hours as required by law</li>
          <li><strong className="text-white">Remediation:</strong> Implementation of fixes and preventive measures</li>
          <li><strong className="text-white">Documentation:</strong> Detailed incident reports for continuous improvement</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">10. Security Best Practices for Users</h2>
        <p className="text-gray-300 mb-3">
          We recommend the following practices to protect your account:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Use a strong, unique password for your account</li>
          <li>Do not share your login credentials with anyone</li>
          <li>Be cautious about the personal information you share in your profile</li>
          <li>Review your privacy settings regularly</li>
          <li>Report suspicious accounts or behaviour immediately</li>
          <li>Log out from shared devices</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">11. Compliance</h2>
        <p className="text-gray-300 mb-3">We comply with applicable data protection regulations:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li><strong className="text-white">GDPR:</strong> General Data Protection Regulation (EU)</li>
          <li><strong className="text-white">Privacy Act 1988:</strong> Australian privacy legislation</li>
          <li><strong className="text-white">CCPA:</strong> California Consumer Privacy Act (where applicable)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">12. Security Contact</h2>
        <p className="text-gray-300 mb-3">
          If you discover a security vulnerability, please report it responsibly to{' '}
          <a href="mailto:security@theglory.app" className="text-hole-accent hover:underline">
            security@theglory.app
          </a>
        </p>
        <p className="text-gray-300">
          For general privacy and data protection inquiries, contact{' '}
          <a href="mailto:privacy@theglory.app" className="text-hole-accent hover:underline">
            privacy@theglory.app
          </a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
