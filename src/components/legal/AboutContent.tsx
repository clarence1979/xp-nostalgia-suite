import logo from '@/assets/cla_sol.png';

export const AboutContent = () => {
  return (
    <div className="p-6 overflow-y-auto h-full bg-white">
      <div className="flex items-center gap-3 mb-4">
        <img src={logo} alt="Clarence's Solutions" className="h-12" />
        <h1 className="text-2xl font-bold">About Teaching Tools</h1>
      </div>

      <div className="space-y-4 text-sm">
        <section>
          <h2 className="text-lg font-semibold mb-2">Made by Teachers, for Teachers</h2>
          <p className="text-gray-700">
            Teaching Tools is created by experienced educators who understand the daily challenges of teaching.
            We're dedicated to empowering Australian teachers with innovative, AI-powered educational tools
            that enhance teaching and learning experiences across primary and secondary schools.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">What We Offer</h2>
          <p className="text-gray-700 mb-2">
            Our platform provides access to a comprehensive suite of educational applications:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li><strong>General Tools:</strong> AI Note Taker, Tool Hub for productivity</li>
            <li><strong>Teacher Tools:</strong> Magic Marker for automated grading, Teacher Scheduler, Student Emotion Recognition</li>
            <li><strong>Secondary School Subjects:</strong> Interactive tools for History, STEM, Languages (AUSLAN), and more</li>
            <li><strong>Primary School:</strong> Engaging storytelling and foundational learning tools</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Built for Australian Schools</h2>
          <p className="text-gray-700">
            All tools are designed with the Australian Curriculum in mind, ensuring relevance and alignment 
            with educational standards. We prioritize student safety, privacy, and age-appropriate content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Technology & Innovation</h2>
          <p className="text-gray-700">
            We leverage cutting-edge AI and educational technology to create tools that are both powerful 
            and accessible. Our nostalgic Windows XP-inspired interface makes advanced technology feel 
            familiar and easy to use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Commitment to Privacy & Safety</h2>
          <p className="text-gray-700">
            Student safety and data privacy are our top priorities. We comply with all Australian privacy 
            laws and educational standards, ensuring a safe digital environment for learners.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Support & Contact</h2>
          <p className="text-gray-700">
            Need help or have questions?<br />
            <strong>Contact:</strong>{' '}
            <a href="https://clarence.guru/#contact" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              https://clarence.guru/#contact
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Version Information</h2>
          <p className="text-gray-700">
            Platform Version: 1.0.0<br />
            Last Updated: January 2025<br />
            © 2025 Teachingtools.dev - All Rights Reserved
          </p>
        </section>

        <section className="bg-blue-50 p-4 rounded border border-blue-200 mt-6">
          <p className="text-gray-700 text-center italic">
            "Empowering educators, inspiring learners, and building the future of education in Australia."
          </p>
        </section>
      </div>
    </div>
  );
};