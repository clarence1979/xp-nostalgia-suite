export const TermsContent = () => {
  return (
    <div className="p-6 overflow-y-auto h-full bg-white">
      <h1 className="text-2xl font-bold mb-4">Terms of Use</h1>
      <p className="text-sm text-gray-600 mb-6">Last Updated: January 2025</p>
      
      <div className="space-y-4 text-sm">
        <section>
          <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing and using Teachingtools.dev, you agree to comply with these Terms of Use. 
            If you do not agree, please discontinue use immediately.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Intended Use</h2>
          <p className="text-gray-700">
            This platform is designed for educational purposes in Australian schools. Users include teachers, 
            students (with appropriate supervision), and educational administrators.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Acceptable Use Policy</h2>
          <p className="text-gray-700 mb-2">Users must:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Use the platform for educational purposes only</li>
            <li>Respect the intellectual property rights of others</li>
            <li>Not engage in any harmful, abusive, or inappropriate behavior</li>
            <li>Not attempt to breach security or access unauthorized areas</li>
            <li>Comply with all applicable Australian laws and school policies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Teacher and School Responsibilities</h2>
          <p className="text-gray-700">
            Teachers and schools are responsible for supervising student use, obtaining necessary consents, 
            and ensuring compliance with their institution's policies and duty of care obligations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Content and Intellectual Property</h2>
          <p className="text-gray-700">
            All content provided through Teachingtools.dev remains the property of respective owners. 
            Educational use is permitted within the scope of fair dealing provisions under Australian 
            Copyright Act 1968.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Third-Party Tools and Links</h2>
          <p className="text-gray-700">
            Some integrated educational tools are provided by third parties. We are not responsible for 
            third-party content or services. Review their terms before use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">7. Disclaimer of Warranties</h2>
          <p className="text-gray-700">
            The platform is provided "as is" without warranties of any kind. We do not guarantee 
            uninterrupted access or error-free operation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8. Limitation of Liability</h2>
          <p className="text-gray-700">
            To the extent permitted by Australian law, we are not liable for any indirect, incidental, 
            or consequential damages arising from use of this platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">9. Changes to Terms</h2>
          <p className="text-gray-700">
            We reserve the right to modify these terms at any time. Continued use after changes 
            constitutes acceptance of modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">10. Governing Law</h2>
          <p className="text-gray-700">
            These terms are governed by the laws of Australia. Any disputes will be subject to the 
            exclusive jurisdiction of Australian courts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">11. Contact Information</h2>
          <p className="text-gray-700">
            For questions about these terms, visit:<br />
            <a href="https://clarence.guru/#contact" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              https://clarence.guru/#contact
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};