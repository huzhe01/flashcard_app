import React from 'react';
import './LandingPage.css';

function LandingPage({ onStart }) {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">Master Your Knowledge</h1>
                    <p className="hero-subtitle">
                        Transform your CSV files into powerful flashcards. Learn smarter with AI-powered spaced repetition.
                    </p>
                    <button className="cta-button" onClick={onStart}>
                        开始使用 (Get Started)
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <h2 className="section-title">Why Choose Flashcard App?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📂</div>
                        <h3>CSV Import</h3>
                        <p>Drag & drop your CSV files. Instant flashcard generation with smart column mapping.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔄</div>
                        <h3>Multi-Device Sync</h3>
                        <p>Access your cards anywhere. GitHub-based sync keeps your data available on all devices.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🧠</div>
                        <h3>Spaced Repetition</h3>
                        <p>Science-backed learning. Review cards at optimal intervals for maximum retention.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🎨</div>
                        <h3>Premium Design</h3>
                        <p>Beautiful glassmorphism UI. Fully responsive for mobile and desktop.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">⚡️</div>
                        <h3>Keyboard Shortcuts</h3>
                        <p>Power user optimized. Navigate and study at lightning speed.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>AI Recommendations</h3>
                        <p className="coming-soon">Coming Soon: Personalized card suggestions based on your learning state.</p>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials">
                <h2 className="section-title">What Our Users Say</h2>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <div className="stars">⭐⭐⭐⭐⭐</div>
                        <p className="testimonial-text">
                            "This app completely changed how I study. The spaced repetition system is incredibly effective!"
                        </p>
                        <p className="testimonial-author">— Alex Chen, Student</p>
                    </div>
                    <div className="testimonial-card">
                        <div className="stars">⭐⭐⭐⭐⭐</div>
                        <p className="testimonial-text">
                            "Being able to sync my flashcards across devices is a game-changer. Perfect for learning on the go."
                        </p>
                        <p className="testimonial-author">— Sarah Johnson, Teacher</p>
                    </div>
                    <div className="testimonial-card">
                        <div className="stars">⭐⭐⭐⭐⭐</div>
                        <p className="testimonial-text">
                            "The CSV import feature saved me hours. I converted all my notes into flashcards in minutes!"
                        </p>
                        <p className="testimonial-author">— David Kim, Professional</p>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing">
                <h2 className="section-title">Choose Your Plan</h2>
                <div className="pricing-grid">
                    <div className="pricing-card">
                        <h3 className="plan-name">Free</h3>
                        <div className="plan-price">
                            <span className="price">$0</span>
                            <span className="period">/month</span>
                        </div>
                        <ul className="plan-features">
                            <li>✅ Unlimited Flashcards</li>
                            <li>✅ CSV Import</li>
                            <li>✅ Multi-Device Sync</li>
                            <li>✅ Spaced Repetition</li>
                            <li>✅ Keyboard Shortcuts</li>
                            <li>❌ AI Recommendations</li>
                        </ul>
                        <button className="plan-button" onClick={onStart}>Get Started</button>
                    </div>
                    <div className="pricing-card featured">
                        <div className="featured-badge">Coming Soon</div>
                        <h3 className="plan-name">Pro</h3>
                        <div className="plan-price">
                            <span className="price">$9</span>
                            <span className="period">/month</span>
                        </div>
                        <ul className="plan-features">
                            <li>✅ Everything in Free</li>
                            <li>✅ AI-Powered Recommendations</li>
                            <li>✅ Daily Push Notifications</li>
                            <li>✅ Advanced Analytics</li>
                            <li>✅ Priority Support</li>
                            <li>✅ Custom Themes</li>
                        </ul>
                        <button className="plan-button primary" disabled>Coming Soon</button>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="footer-cta">
                <h2>Ready to Master Your Knowledge?</h2>
                <button className="cta-button" onClick={onStart}>
                    开始免费使用 (Start Free)
                </button>
            </section>
        </div>
    );
}

export default LandingPage;
