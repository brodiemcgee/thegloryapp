// Privacy Policy page

import { LegalPageLayout } from '@/components/legal';

export const metadata = {
  title: 'Privacy Policy | thehole.app',
  description: 'Privacy Policy for thehole.app',
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="January 2025">
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
        <p className="text-gray-300 mb-3">
          thehole.app ("we", "us", or "our") is committed to protecting your privacy. This Privacy
          Policy explains how we collect, use, share, and protect your personal information when you
          use our App.
        </p>
        <p className="text-gray-300">
          By using the App, you consent to the practices described in this policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>

        <h3 className="text-lg font-medium mb-3 mt-4">Profile Information</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Display name and username</li>
          <li>Age and date of birth</li>
          <li>Profile photos</li>
          <li>Bio and personal description</li>
          <li>Physical attributes (height, body type, etc.)</li>
          <li>Preferences and interests</li>
          <li>Intent and availability status</li>
        </ul>

        <h3 className="text-lg font-medium mb-3 mt-4">Location Data</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Precise location (with your permission) for nearby user discovery</li>
          <li>Approximate location for regional features</li>
          <li>Location history for showing your presence on the map</li>
        </ul>

        <h3 className="text-lg font-medium mb-3 mt-4">Photos & Media</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Profile photos you upload</li>
          <li>Album photos (public and private)</li>
          <li>Photos shared in messages</li>
        </ul>

        <h3 className="text-lg font-medium mb-3 mt-4">Messages & Communications</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Direct messages with other users</li>
          <li>Message metadata (timestamps, read status)</li>
          <li>Blocked and reported user interactions</li>
        </ul>

        <h3 className="text-lg font-medium mb-3 mt-4">Technical Data</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Device type and operating system</li>
          <li>Browser type and version</li>
          <li>IP address</li>
          <li>App usage analytics</li>
          <li>Crash reports and error logs</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
        <p className="text-gray-300 mb-3">We use your information to:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Provide and operate the App's features</li>
          <li>Show your profile to other users</li>
          <li>Display nearby users on the map</li>
          <li>Facilitate messaging between users</li>
          <li>Send push notifications (with your consent)</li>
          <li>Improve our services and user experience</li>
          <li>Detect and prevent fraud, abuse, and violations</li>
          <li>Comply with legal obligations</li>
          <li>Respond to your support requests</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. Information Sharing</h2>
        <p className="text-gray-300 mb-3">We share your information in the following circumstances:</p>

        <h3 className="text-lg font-medium mb-3 mt-4">With Other Users</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Your public profile information is visible to other users</li>
          <li>Your location is shown to nearby users (if enabled)</li>
          <li>Private albums are shared only with users you grant access to</li>
        </ul>

        <h3 className="text-lg font-medium mb-3 mt-4">With Service Providers</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Supabase (database and authentication)</li>
          <li>Mapbox (mapping services)</li>
          <li>Payment processors (for subscriptions)</li>
          <li>Analytics providers</li>
        </ul>

        <h3 className="text-lg font-medium mb-3 mt-4">Legal Requirements</h3>
        <p className="text-gray-300">
          We may disclose your information when required by law, court order, or to protect the
          safety of users or the public.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. Data Retention</h2>
        <p className="text-gray-300 mb-3">We retain your data as follows:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li><strong className="text-white">Active account data:</strong> Retained while your account is active</li>
          <li><strong className="text-white">Deleted accounts:</strong> Data deleted within 30 days of account deletion</li>
          <li><strong className="text-white">Messages:</strong> Retained for 90 days after deletion request</li>
          <li><strong className="text-white">Location history:</strong> Automatically purged after 24 hours</li>
          <li><strong className="text-white">Blocked user records:</strong> Retained for safety purposes</li>
          <li><strong className="text-white">Legal holds:</strong> Data may be retained longer if required by law</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
        <p className="text-gray-300 mb-3">You have the right to:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
          <li><strong className="text-white">Correction:</strong> Update or correct inaccurate information</li>
          <li><strong className="text-white">Deletion:</strong> Request deletion of your account and data</li>
          <li><strong className="text-white">Export:</strong> Download your data in a portable format</li>
          <li><strong className="text-white">Restrict Processing:</strong> Limit how we use your data</li>
          <li><strong className="text-white">Withdraw Consent:</strong> Revoke previously given consents</li>
        </ul>
        <p className="text-gray-300 mt-3">
          To exercise these rights, contact us at{' '}
          <a href="mailto:privacy@thehole.app" className="text-hole-accent hover:underline">
            privacy@thehole.app
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7. Cookies & Tracking</h2>
        <p className="text-gray-300 mb-3">We use cookies and similar technologies to:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Keep you logged in</li>
          <li>Remember your preferences (e.g., SFW mode)</li>
          <li>Analyze app usage and performance</li>
          <li>Prevent fraud and abuse</li>
        </ul>
        <p className="text-gray-300 mt-3">
          You can manage cookie preferences through your browser settings.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">8. Third-Party Services</h2>
        <p className="text-gray-300 mb-3">
          Our App integrates with third-party services that have their own privacy policies:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>
            <strong className="text-white">Supabase:</strong> Database, authentication, and storage{' '}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-hole-accent hover:underline">
              (Privacy Policy)
            </a>
          </li>
          <li>
            <strong className="text-white">Mapbox:</strong> Map and location services{' '}
            <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-hole-accent hover:underline">
              (Privacy Policy)
            </a>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">9. International Data Transfers</h2>
        <p className="text-gray-300">
          Your data may be processed in countries other than your own. We ensure appropriate
          safeguards are in place for international transfers in compliance with applicable data
          protection laws.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">10. Children's Privacy</h2>
        <p className="text-gray-300">
          The App is strictly for adults 18 years and older. We do not knowingly collect data from
          anyone under 18. If we discover that a user is underage, we will immediately terminate
          their account and delete their data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">11. Changes to This Policy</h2>
        <p className="text-gray-300">
          We may update this Privacy Policy from time to time. We will notify you of significant
          changes through the App or via email. Continued use of the App after changes constitutes
          acceptance of the updated policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
        <p className="text-gray-300">
          For privacy-related questions or requests, contact us at{' '}
          <a href="mailto:privacy@thehole.app" className="text-hole-accent hover:underline">
            privacy@thehole.app
          </a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
