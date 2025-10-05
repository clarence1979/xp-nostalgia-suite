export const PrivacyContent = () => {
  return (
    <div className="p-6 overflow-y-auto h-full bg-white">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-gray-600 mb-6">Last Updated: January 2025</p>
      
      <div className="space-y-4 text-sm">
        <section>
          <h2 className="text-lg font-semibold mb-2">1. Introduction</h2>
          <p className="text-gray-700">
            Teachingtools.dev is committed to protecting the privacy of students, teachers, and educational institutions 
            in accordance with the Australian Privacy Principles (APPs) under the Privacy Act 1988 (Cth) and applicable 
            state/territory privacy laws.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Information We Collect</h2>
          <p className="text-gray-700 mb-2">We may collect:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Usage data and interaction with educational tools</li>
            <li>School and teacher account information (with consent)</li>
            <li>Technical information necessary for app functionality</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Student Privacy</h2>
          <p className="text-gray-700">
            We are committed to protecting student privacy. No personally identifiable student information is 
            collected without explicit parental/guardian consent where required. All data handling complies with 
            educational privacy standards and Australian law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Data Storage and Security</h2>
          <p className="text-gray-700">
            Data is stored securely and may be hosted within Australia or with trusted international providers 
            meeting Australian privacy standards. We implement industry-standard security measures to protect 
            all information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Third-Party Services</h2>
          <p className="text-gray-700">
            Some educational tools may link to third-party services. Each has its own privacy policy. 
            We recommend reviewing these policies before use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Your Rights</h2>
          <p className="text-gray-700 mb-2">You have the right to:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Access your personal information</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your data (subject to legal requirements)</li>
            <li>Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">7. Contact Us</h2>
          <p className="text-gray-700">
            For privacy-related inquiries, please contact:<br />
            Email: privacy@teachingtools.dev<br />
            Address: [Your School/Organization Address]
          </p>
        </section>
      </div>
    </div>
  );
};