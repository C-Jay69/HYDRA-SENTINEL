import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import PhoneMockup from '../components/ui/phone-mockup';
import { 
  Shield, 
  Smartphone, 
  MapPin, 
  MessageSquare, 
  Camera, 
  Clock,
  Users,
  Globe,
  Lock,
  Star,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';

const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Message Monitoring",
      description: "Track all text messages, WhatsApp, and social media chats in real-time",
      color: "from-blue-500 to-cyan-400"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "GPS Location",
      description: "Real-time location tracking with geofencing alerts and location history",
      color: "from-green-500 to-emerald-400"
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Media Access",
      description: "Monitor photos, videos, and camera usage with timestamp data",
      color: "from-purple-500 to-pink-400"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Web Filtering",
      description: "Block inappropriate websites and monitor browsing history",
      color: "from-orange-500 to-red-400"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "App Control",
      description: "Block or limit access to specific apps and games remotely",
      color: "from-indigo-500 to-blue-400"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Screen Time",
      description: "Set daily limits and monitor device usage patterns",
      color: "from-teal-500 to-cyan-400"
    }
  ];

  const pricingPlans = [
    {
      name: "Basic",
      price: "$29.99",
      period: "/month",
      features: [
        "1 Device",
        "Call & SMS Monitoring", 
        "GPS Tracking",
        "Web History",
        "24/7 Support"
      ],
      popular: false
    },
    {
      name: "Premium",
      price: "$69.99", 
      period: "/month",
      features: [
        "Up to 5 Devices",
        "All Basic Features",
        "Social Media Monitoring",
        "App Blocking",
        "Geofencing",
        "Keylogger",
        "Priority Support"
      ],
      popular: true
    },
    {
      name: "Family",
      price: "$99.99",
      period: "/month", 
      features: [
        "Unlimited Devices",
        "All Premium Features",
        "Advanced Analytics",
        "Custom Reports",
        "API Access",
        "Dedicated Support"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="relative z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">ParentGuard</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#solutions" className="text-gray-300 hover:text-white transition-colors">Solutions</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#support" className="text-gray-300 hover:text-white transition-colors">Support</a>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                LOG IN
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-6"
              >
                TRY NOW
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-800 border-t border-gray-700">
            <div className="px-4 py-2 space-y-2">
              <a href="#features" className="block py-2 text-gray-300 hover:text-white">Features</a>
              <a href="#solutions" className="block py-2 text-gray-300 hover:text-white">Solutions</a>
              <a href="#pricing" className="block py-2 text-gray-300 hover:text-white">Pricing</a>
              <a href="#support" className="block py-2 text-gray-300 hover:text-white">Support</a>
              <div className="border-t border-gray-700 pt-2 space-y-2">
                <Button variant="ghost" className="w-full text-left text-gray-300">LOG IN</Button>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500">TRY NOW</Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">
                #1 CHOICE IN PARENTAL CONTROL
              </Badge>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                The Best Phone
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Tracker
                </span>
                <span className="block text-3xl lg:text-4xl text-gray-300 mt-4">
                  for Parental Control
                </span>
              </h1>

              <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
                Know more. Worry less. That's the power of ParentGuard, the app that lets you find out what they're up to on their phone and online. And they won't even know you're using it.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-8 py-4 text-lg font-semibold"
                >
                  TRY NOW
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg"
                >
                  👁 VIEW DEMO
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-8">
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-gray-300 text-sm">4.8/5 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">2M+ Families</span>
                </div>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="relative flex justify-center">
              <PhoneMockup className="transform rotate-6 hover:rotate-3 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Comprehensive Monitoring
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Features
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Monitor every aspect of your child's digital life with our advanced tracking and control features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-800/80 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Simple, Transparent
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-300">Choose the plan that fits your family's needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative bg-gray-800/80 border-gray-700 hover:border-gray-600 transition-all duration-300 ${plan.popular ? 'transform scale-105 border-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-300">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                    } text-white`}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">ParentGuard</span>
              </div>
              <p className="text-gray-400">Keeping families safe in the digital world.</p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ParentGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;