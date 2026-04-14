import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Copyrights() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors mb-6">
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </Link>
          
          <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-2">Copyrights & Legal Notice</h1>
          <p className="text-[var(--text-secondary)] text-lg">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
          
          {/* Project Declaration */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Project Declaration</h2>
            <p className="mb-4">
              <strong className="text-green-500">MuSync</strong> is a personal academic/educational project created by <strong>Meet Patel</strong>. This application is developed solely for educational, learning, and demonstration purposes as part of coursework and personal skill development. This is not a commercial product, and it is not intended for any commercial, profit-generating, or business use.
            </p>
            <p>
              This project is created to demonstrate understanding of full-stack web development, including frontend technologies (React, Vite, Tailwind CSS), backend development (PHP REST APIs), database management (MySQL), authentication systems (JWT), and cloud deployment (Vercel, Hostinger).
            </p>
          </section>

          {/* Non-Commercial Use */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Non-Commercial Use Policy</h2>
            <div className="space-y-3">
              <p>
                <strong>MuSync is strictly for personal educational use only.</strong> You are not permitted to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Use this application for commercial purposes or monetary gain</li>
                <li>Sell, lease, or distribute this application or any part of it</li>
                <li>Use this application as a basis for a commercial product or service</li>
                <li>Operate this application as a public service or SaaS offering</li>
                <li>Charge users any fees or generate revenue from this application</li>
                <li>Use the application infrastructure for any business activities</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property & Copyright */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property & Copyright Notice</h2>
            <p className="mb-4">
              The source code, design, architecture, and all original content of <strong>MuSync</strong> are the intellectual property of <strong>Meet Patel</strong> and are provided "as-is" for educational examination and non-commercial usage only.
            </p>
            <p className="mb-4">
              <strong>All copyrights to this application and its components are retained by Meet Patel.</strong> No part of this application may be reproduced, distributed, transmitted, displayed, published, or broadcast without the prior written permission of Meet Patel, except as permitted for educational and non-commercial purposes.
            </p>
            <p>
              Permission is granted to view, study, and use this code for educational and personal learning purposes only. Unauthorized copying, modification for commercial use, or redistribution is strictly prohibited and may result in legal action.
            </p>
          </section>

          {/* Third-Party Content & Music Copyrights */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Music Content Disclaimer</h2>
            <p className="mb-4">
              <strong>IMPORTANT -- MUSIC COPYRIGHTS:</strong> Any music data, metadata, song information, or artist information displayed in this application is provided solely for educational and demonstration purposes. This application does not host, distribute, stream, or provide access to actual music files.
            </p>
            <div className="space-y-3 ml-2">
              <p>
                <strong>We do not own, control, or have permission to use:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Any copyrighted music tracks, compositions, or recordings</li>
                <li>Artist names, images, or related intellectual property</li>
                <li>Song metadata, lyrics, or associated copyrighted content</li>
                <li>Record label names, production company brands, or trademarks</li>
              </ul>
            </div>
            <p className="mt-4">
              <strong>All respect to original creators:</strong> We acknowledge that all music, artistry, and entertainment content are the exclusive property of their respective copyright owners, artists, record labels, and publishers. This application is purely educational and makes no claims to the ownership or licensing rights of any musical content.
            </p>
            <p className="mt-4">
              If any copyrighted content is inadvertently used or displayed in violation of copyright laws, and the rights holder objects, please contact {' '}
              <a href="mailto:developer.meetptl@gmail.com" className="text-green-500 hover:text-green-400">developer.meetptl@gmail.com</a>, and appropriate action will be taken immediately.
            </p>
          </section>

          {/* Third-Party Libraries & Attribution */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Libraries & Open Source Attribution</h2>
            <p className="mb-4">
              This application makes use of several open-source libraries and frameworks. We gratefully acknowledge and respect the contributions of their developers:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>React</strong> - Facebook's JavaScript library for building user interfaces (MIT License)</li>
              <li><strong>React Router</strong> - Client-side routing for React applications (MIT License)</li>
              <li><strong>Vite</strong> - Next generation frontend tooling (MIT License)</li>
              <li><strong>Tailwind CSS</strong> - Utility-first CSS framework (MIT License)</li>
              <li><strong>Zustand</strong> - Lightweight state management library (MIT License)</li>
              <li><strong>TanStack Query</strong> - Powerful data synchronization library (MIT License)</li>
              <li><strong>Howler.js</strong> - JavaScript audio library (MIT License)</li>
              <li><strong>Axios</strong> - Promise-based HTTP client (MIT License)</li>
              <li><strong>Lucide React</strong> - Beautiful react icon library (ISC License)</li>
              <li><strong>PHP</strong> - General-purpose scripting language (PHP License)</li>
              <li><strong>MySQL</strong> - Open-source relational database (GPL License)</li>
            </ul>
            <p className="mt-4">
              Each of these libraries is used in accordance with their respective licenses. We comply with all open-source license requirements and encourage users to review their terms.
            </p>
          </section>

          {/* Data & Privacy */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Data Collection & Privacy</h2>
            <p className="mb-4">
              This application collects user information including (but not limited to) usernames, email addresses, and password hashes for functional purposes such as user authentication and account management. Usage data and listening history may be stored to provide personalized features.
            </p>
            <p className="mb-4">
              <strong>User data is used solely for application functionality</strong> and is not shared with, sold to, or disclosed to any third parties for commercial purposes. No personal data is used for profit generation or unauthorized redistribution.
            </p>
            <p>
              <strong>Security Notice:</strong> While we implement reasonable security measures, users should understand that this is an educational project, not a production-grade secure system. Do not use sensitive personal information or payment details on this platform.
            </p>
          </section>

          {/* Educational Purpose & Academic Integrity */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Educational Purpose & Academic Integrity</h2>
            <p className="mb-4">
              This project is created as part of learning and educational development. It demonstrates competency in:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li>Full-stack web development architecture</li>
              <li>Frontend frameworks and component development</li>
              <li>Backend API design and REST principles</li>
              <li>Database design and SQL optimization</li>
              <li>User authentication and authorization systems</li>
              <li>Cloud infrastructure and deployment</li>
              <li>Software engineering best practices</li>
            </ul>
            <p>
              This project may be used for educational purposes, including classroom instruction, learning demonstrations, and portfolio showcasing, subject to all other terms and conditions in this notice.
            </p>
          </section>

          {/* Disclaimer of Warranties */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Disclaimer of Warranties</h2>
            <p className="mb-4">
              <strong>THIS APPLICATION IS PROVIDED "AS-IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.</strong>
            </p>
            <p className="mb-4">
              Meet Patel makes no representation or warranty regarding:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li>The accuracy, completeness, or reliability of any content or data</li>
              <li>The functionality or availability of the application</li>
              <li>The absence of errors, bugs, or security vulnerabilities</li>
              <li>The compatibility with any specific device or system</li>
              <li>The safety or appropriateness of content for any user</li>
            </ul>
            <p>
              Users assume all risk and responsibility for use of this application. This application is provided for educational purposes and may contain bugs, incomplete features, or security issues inherent in educational projects.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
            <p className="mb-4">
              <strong>IN NO EVENT SHALL MEET PATEL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li>Loss of data or information</li>
              <li>Loss of revenue or profits</li>
              <li>Business interruption</li>
              <li>System failure or malfunction</li>
              <li>Unauthorized access or data breaches</li>
              <li>Any other damages arising from use or inability to use this application</li>
            </ul>
            <p>
              This limitation applies even if Meet Patel has been advised of the possibility of such damages. Some jurisdictions do not allow limitations on liability, so this may not apply to you.
            </p>
          </section>

          {/* No License to Use Third-Party Content */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">No License to Use Copyrighted Content</h2>
            <p className="mb-4">
              By accessing or using MuSync, you acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li>You do not obtain any license or right to copyrighted music or content</li>
              <li>The application is for demonstration purposes only</li>
              <li>Any music metadata or artist information is provided for educational context</li>
              <li>You must not use this application to bypass any copyright protections</li>
              <li>All music copyrights remain with their respective owners and holders</li>
            </ul>
          </section>

          {/* Indemnification */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Meet Patel from any and all claims, damages, losses, liabilities, costs, and expenses (including attorney's fees) arising from or related to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
              <li>Your use or misuse of this application</li>
              <li>Your violation of these terms and conditions</li>
              <li>Your violation of any third-party rights or applicable laws</li>
              <li>Your content or data submitted through this application</li>
              <li>Your unauthorized use of copyrighted material</li>
            </ul>
          </section>

          {/* DMCA & Copyright Claims */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">DMCA & Copyright Claims</h2>
            <p className="mb-4">
              If you believe that any content in this application infringes upon your copyrights or intellectual property rights, please contact Meet Patel immediately at:
            </p>
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 my-4">
              <p className="font-semibold text-white mb-2">Contact Information:</p>
              <p className="text-[var(--text-muted)]">
                📧 Email: <a href="mailto:developer.meetptl@gmail.com" className="text-green-500 hover:text-green-400">developer.meetptl@gmail.com</a>
              </p>
              <p className="text-[var(--text-muted)]">
                📱 Phone: +91 63512 43855
              </p>
              <p className="text-[var(--text-muted)]">
                🔗 Portfolio: <a href="https://patelmeet.vercel.app" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400">https://patelmeet.vercel.app</a>
              </p>
            </div>
            <p>
              Please provide detailed information regarding the allegedly infringing content, and appropriate action will be taken promptly. Cease and desist notices will be honored immediately.
            </p>
          </section>

          {/* Termination */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Termination of Use</h2>
            <p className="mb-4">
              Meet Patel reserves the right to terminate access to this application at any time, for any reason, without notice, including (but not limited to):
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li>Violation of these terms and conditions</li>
              <li>Misuse for commercial purposes</li>
              <li>Unauthorized copying or redistribution</li>
              <li>Any illegal or harmful activity</li>
              <li>System maintenance or project discontinuation</li>
            </ul>
          </section>

          {/* Compliance & Jurisdiction */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Compliance & Jurisdiction</h2>
            <p className="mb-4">
              This application complies with applicable laws and regulations regarding:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li>Content protection and intellectual property rights</li>
              <li>Educational fair use provisions</li>
              <li>Data protection and privacy regulations</li>
              <li>Terms of service for third-party platforms and libraries</li>
            </ul>
            <p>
              These terms and conditions are governed by the laws of India and the jurisdiction of Vadodara, Gujarat. Any disputes shall be resolved in the competent courts of Vadodara, Gujarat.
            </p>
          </section>

          {/* No Affiliation */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">No Affiliation or Endorsement</h2>
            <p className="mb-4">
              MuSync is not affiliated with, endorsed by, or associated with any major music platform, record label, artist, or entertainment company. Any mention of artists, songs, or labels is purely for demonstration and educational purposes only.
            </p>
            <p>
              This application does not imply any partnership or endorsement with Apple Music, Spotify, YouTube Music, or any other music streaming service or copyright holder.
            </p>
          </section>

          {/* Final Statement */}
          <section className="glass-effect rounded-2xl p-6 sm:p-8 border-2 border-green-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Final Statement</h2>
            <p className="mb-4">
              <strong>This is a personal educational project created by Meet Patel, a student/developer, for learning and demonstration purposes only. It is not a commercial product and is not intended for any commercial use, profit generation, or business operations.</strong>
            </p>
            <p className="mb-4">
              All intellectual property rights, copyrights, trademarks, and other proprietary rights are the exclusive property of their respective owners. No copyright infringement or intellectual property violation is intended.
            </p>
            <p>
              By using this application, you acknowledge that you have read, understood, and agree to be bound by all terms, conditions, and disclaimers contained in this notice. If you do not agree to these terms, you must discontinue use of this application immediately.
            </p>
          </section>

          {/* Date & Signature */}
          <div className="text-center pt-4 border-t border-[var(--border-color)]">
            <p className="text-[var(--text-muted)] text-sm">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-[var(--text-muted)] text-sm mt-2">
              <strong>Prepared by:</strong> Meet Patel
            </p>
            <p className="text-[var(--text-muted)] text-xs mt-4">
              © {new Date().getFullYear()} Meet Patel. All Rights Reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
