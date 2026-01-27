// Terms of Service page

import { LegalPageLayout } from '@/components/legal';

export const metadata = {
  title: 'Terms of Service | theglory.app',
  description: 'Terms of Service for theglory.app',
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="January 2025">
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
        <p className="text-gray-300 mb-3">
          By accessing or using theglory.app (&quot;the App&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound
          by these Terms of Service. If you do not agree to these terms, you may not use the App.
        </p>
        <p className="text-gray-300">
          We reserve the right to modify these terms at any time. Continued use of the App after
          changes constitutes acceptance of the modified terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. Age Requirement</h2>
        <p className="text-gray-300 mb-3">
          <strong className="text-white">You must be at least 18 years of age to use this App.</strong>
        </p>
        <p className="text-gray-300 mb-3">
          By using the App, you represent and warrant that you are at least 18 years old and have
          the legal capacity to enter into this agreement. We reserve the right to verify your age
          and may terminate accounts that we believe belong to underage users.
        </p>
        <p className="text-gray-300">
          The App contains sexually explicit content intended for consenting adults only. It is your
          responsibility to ensure that viewing such content is legal in your jurisdiction.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. Account Responsibilities</h2>
        <p className="text-gray-300 mb-3">When creating an account, you agree to:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Provide accurate and truthful information</li>
          <li>Maintain the security of your account credentials</li>
          <li>Notify us immediately of any unauthorised access</li>
          <li>Accept responsibility for all activities under your account</li>
          <li>Not share your account with others</li>
          <li>Not create multiple accounts</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. Acceptable Use Policy</h2>
        <p className="text-gray-300 mb-3">You agree to use the App only for lawful purposes. You may:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300 mb-4">
          <li>Create a profile and share information about yourself</li>
          <li>Connect with other consenting adult users</li>
          <li>Share photos and messages with your consent</li>
          <li>Use location features to discover nearby users</li>
        </ul>
        <p className="text-gray-300">
          All interactions must be between consenting adults. You are responsible for obtaining
          proper consent before any in-person meetings.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. Prohibited Content & Behaviour</h2>
        <p className="text-gray-300 mb-3">The following is strictly prohibited:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Any content involving minors</li>
          <li>Non-consensual content or activities</li>
          <li>Harassment, threats, or abusive behaviour</li>
          <li>Impersonation of others</li>
          <li>Solicitation of prostitution or illegal services</li>
          <li>Distribution of malware or harmful code</li>
          <li>Spam, scams, or fraudulent activity</li>
          <li>Content that violates intellectual property rights</li>
          <li>Discrimination based on race, ethnicity, religion, or other protected characteristics</li>
          <li>Doxxing or sharing others&apos; private information without consent</li>
          <li>Automated access or scraping of the App</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">6. User-Generated Content</h2>
        <p className="text-gray-300 mb-3">
          You retain ownership of content you upload to the App. By uploading content, you grant us
          a limited, non-exclusive licence to use, display, and distribute your content within the App
          for the purpose of providing our services.
        </p>
        <p className="text-gray-300 mb-3">You represent and warrant that:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>You own or have rights to all content you upload</li>
          <li>All persons depicted in your photos have consented to their use</li>
          <li>Your content does not violate any laws or these terms</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7. Termination & Suspension</h2>
        <p className="text-gray-300 mb-3">
          We may suspend or terminate your account at any time for violations of these terms,
          illegal activity, or any reason at our sole discretion.
        </p>
        <p className="text-gray-300 mb-3">Upon termination:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Your access to the App will be revoked</li>
          <li>Your profile will no longer be visible to other users</li>
          <li>You may request deletion of your data per our Privacy Policy</li>
          <li>Paid subscriptions are non-refundable except as required by law</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">8. Disclaimers & Limitations</h2>
        <p className="text-gray-300 mb-3">
          <strong className="text-white">THE APP IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND.</strong>
        </p>
        <p className="text-gray-300 mb-3">We do not guarantee:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-300 mb-4">
          <li>The accuracy of information provided by other users</li>
          <li>The identity or intentions of other users</li>
          <li>Uninterrupted or error-free service</li>
          <li>The safety of in-person meetings</li>
        </ul>
        <p className="text-gray-300 mb-3">
          You are solely responsible for your interactions with other users. We strongly recommend
          meeting in public places and informing someone of your whereabouts.
        </p>
        <p className="text-gray-300">
          To the maximum extent permitted by law, we shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages arising from your use of the App.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">9. Indemnification</h2>
        <p className="text-gray-300">
          You agree to indemnify and hold harmless theglory.app, its operators, and affiliates from
          any claims, damages, or expenses arising from your use of the App, your content, or your
          violation of these terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">10. Governing Law</h2>
        <p className="text-gray-300 mb-3">
          These Terms of Service are governed by the laws of Australia. Any disputes arising from
          these terms or your use of the App shall be resolved in the courts of Australia.
        </p>
        <p className="text-gray-300">
          If any provision of these terms is found to be unenforceable, the remaining provisions
          shall continue in full force and effect.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">11. Contact</h2>
        <p className="text-gray-300">
          For questions about these Terms of Service, please contact us at{' '}
          <a href="mailto:legal@theglory.app" className="text-hole-accent hover:underline">
            legal@theglory.app
          </a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
