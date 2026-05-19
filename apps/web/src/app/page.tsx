import Link from 'next/link';
import {
  FileText,
  Bell,
  Eye,
  CheckSquare,
  Users,
  Smartphone,
  ArrowRight,
  Check,
  Building2,
  Shield,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="bg-[#0F2044] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F59E0B] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold text-white font-display">PermitPro</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/70 hover:text-white text-sm transition-colors">Features</a>
            <a href="#how-it-works" className="text-white/70 hover:text-white text-sm transition-colors">How it works</a>
            <a href="#pricing" className="text-white/70 hover:text-white text-sm transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/80 hover:text-white text-sm transition-colors">Sign in</Link>
            <Link
              href="/login"
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F2044] via-[#1e3a6e] to-[#0F2044] py-24 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#F59E0B] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#4a6fa5] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-pulse" />
            <span className="text-white/90 text-sm">Trusted by 1,200+ permit professionals</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-white leading-tight mb-6">
            Permit management,{' '}
            <span className="text-[#F59E0B]">finally under control</span>
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Track every permit from application to approval. AI-powered document extraction,
            smart deadline alerts, and real-time status visibility — all in one workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base text-center"
            >
              See how it works
            </a>
          </div>
          <p className="text-white/40 text-sm mt-4">No credit card required · Free forever plan</p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#0F2044] border-t border-white/10 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '2,400+', label: 'Permits managed' },
            { value: '47', label: 'Jurisdictions served' },
            { value: '98%', label: 'On-time submissions' },
            { value: '< 2min', label: 'Setup time' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-[#F59E0B] font-display">{stat.value}</div>
              <div className="text-white/60 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-semibold text-[#0F2044] mb-4">
              Everything you need to manage permits
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Stop losing track of deadlines, documents, and status updates across spreadsheets and email.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'Document chaos → single source of truth',
                description: 'Upload all permit documents in one place. AI automatically extracts key fields, expiry dates, and license numbers.',
                color: 'bg-blue-100 text-blue-600',
              },
              {
                icon: Bell,
                title: 'Deadline blindness → smart alerts',
                description: 'Never miss a submission window. Automated reminders at 7, 3, and 1 day before every critical deadline.',
                color: 'bg-amber-100 text-amber-600',
              },
              {
                icon: Eye,
                title: 'Status opacity → real-time visibility',
                description: 'See exactly where every permit stands. Visual status timeline with jurisdiction-specific workflow stages.',
                color: 'bg-purple-100 text-purple-600',
              },
              {
                icon: CheckSquare,
                title: 'Checklist gaps → AI detection',
                description: 'AI generates complete permit-type checklists and flags missing items before you submit to the agency.',
                color: 'bg-green-100 text-green-600',
              },
              {
                icon: Users,
                title: 'Multi-agency → one workspace',
                description: 'Manage permits across dozens of jurisdictions, agencies, and project types from a single dashboard.',
                color: 'bg-rose-100 text-rose-600',
              },
              {
                icon: Smartphone,
                title: 'Field capture → mobile scanner',
                description: 'Scan and upload inspection reports, notices, and permits directly from the job site using the mobile app.',
                color: 'bg-teal-100 text-teal-600',
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 font-sans text-base">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-semibold text-[#0F2044] mb-4">How it works</h2>
            <p className="text-gray-500 text-lg">From permit intake to final approval in three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create your permit',
                description: 'Add a new permit in seconds. Select project, jurisdiction, permit type, and key dates. PermitPro builds the workflow automatically.',
                icon: Building2,
              },
              {
                step: '02',
                title: 'Upload docs — AI extracts',
                description: 'Drag and drop application forms, plans, and licenses. Our AI reads every document and fills in expiry dates, license numbers, and more.',
                icon: FileText,
              },
              {
                step: '03',
                title: 'Track to approval',
                description: "Follow your permit through every review stage. Get notified on status changes, schedule inspections, and chat with AI for guidance.",
                icon: Shield,
              },
            ].map((step, i) => (
              <div key={step.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-[#F59E0B] to-transparent z-0 -translate-y-1/2" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-[#0F2044] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <step.icon className="w-8 h-8 text-[#F59E0B]" />
                  </div>
                  <div className="text-[#F59E0B] font-bold text-sm mb-2 font-display">{step.step}</div>
                  <h3 className="font-semibold text-[#0F2044] text-lg mb-3 font-sans">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-semibold text-[#0F2044] mb-4">Simple, honest pricing</h2>
            <p className="text-gray-500 text-lg">Start free. Scale when you need to.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="mb-6">
                <h3 className="font-display text-xl font-semibold text-[#0F2044] mb-1">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
                <p className="text-gray-500 text-sm">Forever free for solo coordinators</p>
              </div>
              <ul className="space-y-3 mb-8">
                {['1 team member', 'Up to 5 permits', '1 GB storage', 'Email support', 'Basic analytics'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block w-full text-center border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm">
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[#0F2044] rounded-2xl p-8 border-2 border-[#F59E0B] shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#F59E0B] text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
              </div>
              <div className="mb-6">
                <h3 className="font-display text-xl font-semibold text-white mb-1">Pro</h3>
                <div className="text-4xl font-bold text-white mb-1">$49<span className="text-lg font-normal text-white/60">/mo</span></div>
                <p className="text-white/60 text-sm">For growing teams</p>
              </div>
              <ul className="space-y-3 mb-8">
                {['10 team members', 'Up to 100 permits', '50 GB storage', 'AI document extraction', 'Smart deadline alerts', 'Priority support', 'Full analytics'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <Check className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block w-full text-center bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                Start Pro trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="mb-6">
                <h3 className="font-display text-xl font-semibold text-[#0F2044] mb-1">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">Custom</div>
                <p className="text-gray-500 text-sm">For large organizations</p>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited members', 'Unlimited permits', '500 GB storage', 'Custom integrations', 'SSO / SAML', 'Dedicated account manager', 'SLA + 24/7 support'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="mailto:sales@permitpro.app" className="block w-full text-center border border-[#0F2044] hover:bg-[#0F2044] hover:text-white text-[#0F2044] font-semibold py-3 rounded-xl transition-colors text-sm">
                Contact sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F2044] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[#F59E0B] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-xl font-bold text-white font-display">PermitPro</span>
              </div>
              <p className="text-white/50 text-sm max-w-xs">
                The permit lifecycle management platform built for construction professionals.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
                <ul className="space-y-2">
                  {['Features', 'Pricing', 'Changelog'].map((l) => (
                    <li key={l}><a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
                <ul className="space-y-2">
                  {['About', 'Blog', 'Careers'].map((l) => (
                    <li key={l}><a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
                <ul className="space-y-2">
                  {['Privacy', 'Terms', 'Security'].map((l) => (
                    <li key={l}><a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">© 2026 PermitPro. All rights reserved.</p>
            <p className="text-white/40 text-sm">Made for permit coordinators everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
