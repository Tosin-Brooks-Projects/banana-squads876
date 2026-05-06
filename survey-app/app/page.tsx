'use client';

import Link from 'next/link';
import AnimatedButton from '@/components/ui/AnimatedButton';
import Footer from '@/components/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { Marquee } from '@/components/ui/3d-testimonials';
import { Navbar1 } from '@/components/ui/navbar-1';
import { HeroSection03 } from '@/components/ui/hero-03';
import DisplayCards from '@/components/ui/display-cards';
import { CallToAction } from '@/components/ui/cta-3';
import { Gamepad2, BarChart3, Rocket } from 'lucide-react';

const featureCards = [
  {
    icon: <Gamepad2 className="size-4 text-orange-600" />,
    title: "Gamified",
    description: "Interactive adventures",
    date: "Engagement Boosted",
    iconClassName: "text-orange-600",
    titleClassName: "text-orange-600",
    className:
      "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <BarChart3 className="size-4 text-orange-600" />,
    title: "Analytics",
    description: "Real-time insights",
    date: "Beautifully Visualized",
    iconClassName: "text-orange-600",
    titleClassName: "text-orange-600",
    className:
      "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Rocket className="size-4 text-orange-600" />,
    title: "Conversion",
    description: "3x Completion rates",
    date: "Available Now",
    iconClassName: "text-orange-600",
    titleClassName: "text-orange-600",
    className:
      "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
  },
];

const testimonials = [
  {
    name: 'Ava Green',
    username: '@ava',
    body: 'Unboring Surveys made my workflow 10x faster!',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    country: '🇦🇺',
  },
  {
    name: 'Ana Miller',
    username: '@ana',
    body: 'The 3x completion rate is real. Highly recommend!',
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    country: '🇩🇪',
  },
  {
    name: 'Mateo Rossi',
    username: '@mat',
    body: 'Animations are buttery smooth and engaging!',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    country: '🇮🇹',
  },
  {
    name: 'Maya Patel',
    username: '@maya',
    body: 'Setup was a breeze! Best feedback tool ever.',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    country: '🇮🇳',
  },
  {
    name: 'Noah Smith',
    username: '@noah',
    body: 'Finally, surveys people actually want to take!',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    country: '🇺🇸',
  },
  {
    name: 'Lucas Stone',
    username: '@luc',
    body: 'Interactive adventures are a game changer.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    country: '🇫🇷',
  },
];

function TestimonialCard({ img, name, username, body, country }: (typeof testimonials)[number]) {
  return (
    <Card className="w-64 border-neutral-200 bg-white/50 backdrop-blur-sm hover:border-orange-200 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 border border-neutral-100">
            <AvatarImage src={img} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <figcaption className="text-sm font-semibold text-neutral-900 flex items-center gap-1">
              {name} <span className="text-xs grayscale">{country}</span>
            </figcaption>
            <p className="text-xs font-medium text-neutral-500">{username}</p>
          </div>
        </div>
        <blockquote className="mt-3 text-sm text-neutral-600 leading-relaxed italic">&quot;{body}&quot;</blockquote>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar1 />
      <HeroSection03 />

      <div className="font-outfit">
        {/* Features Section */}
        <section className="bg-white py-32 overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 text-start">
                <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-6">
                  Why Choose <span className="text-orange-600">Unboring</span> Surveys?
                </h2>
                <p className="text-neutral-600 text-lg max-w-xl mb-8">
                  Traditional forms are dead. Our interactive adventures keep respondents engaged,
                  leading to cleaner data and much higher completion rates.
                </p>
                <Link href="/login">
                  <AnimatedButton variant="outline" size="lg" className="border-orange-200 hover:bg-orange-50 text-orange-700">
                    Explore Features
                  </AnimatedButton>
                </Link>
              </div>
              <div className="flex-1 flex justify-center py-12">
                <DisplayCards cards={featureCards} />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-neutral-50 overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 max-w-xl">
                <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-6">
                  Loved by teams <br /><span className="text-orange-600">worldwide.</span>
                </h2>
                <p className="text-neutral-600 text-lg mb-8">
                  Join thousands of users who have transformed their feedback loops into
                  engaging experiences that people actually finish.
                </p>
                <div className="flex gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex-1">
                    <div className="text-2xl font-bold text-orange-600 mb-1">98%</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Satisfaction</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex-1">
                    <div className="text-2xl font-bold text-orange-600 mb-1">3.5M+</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Quests Done</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 relative flex h-[500px] w-full flex-row items-center justify-center overflow-hidden gap-4 [perspective:1200px]">
                <div
                  className="flex flex-row items-center gap-4"
                  style={{
                    transform:
                      'translateX(-50px) translateY(0px) translateZ(-100px) rotateX(15deg) rotateY(-15deg) rotateZ(10deg)',
                  }}
                >
                  <Marquee vertical pauseOnHover repeat={3} className="[--duration:30s]">
                    {testimonials.map((review) => (
                      <TestimonialCard key={review.username} {...review} />
                    ))}
                  </Marquee>
                  <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:25s]">
                    {testimonials.map((review) => (
                      <TestimonialCard key={review.username} {...review} />
                    ))}
                  </Marquee>
                  <Marquee vertical pauseOnHover repeat={3} className="[--duration:35s] hidden sm:flex">
                    {testimonials.map((review) => (
                      <TestimonialCard key={review.username} {...review} />
                    ))}
                  </Marquee>
                </div>

                {/* Overlays */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-neutral-50"></div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-neutral-50"></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-white relative overflow-hidden">
          <div className="container mx-auto px-6">
            <CallToAction />
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
