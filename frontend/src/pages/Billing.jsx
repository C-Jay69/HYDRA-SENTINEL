import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Shield, 
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Download,
  Calendar,
  Crown,
  Star,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';

const Billing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29.99,
      period: '/month',
      description: 'Essential monitoring for small families',
      features: [
        '1 Device',
        'Call & SMS Monitoring',
        'GPS Tracking',
        'Web History',
        'Basic App Control',
        '24/7 Support'
      ],
      popular: false,
      color: 'from-gray-600 to-gray-700',
      icon: <Shield className="w-6 h-6" />
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 69.99,
      period: '/month',
      description: 'Complete family protection suite',
      features: [
        'Up to 5 Devices',
        'All Basic Features',
        'Social Media Monitoring',
        'Advanced App Blocking',
        'Geofencing & Alerts',
        'Keylogger',
        'Screen Time Controls',
        'Priority Support'
      ],
      popular: true,
      color: 'from-blue-600 to-cyan-500',
      icon: <Crown className="w-6 h-6" />
    },
    {
      id: 'family',
      name: 'Family',
      price: 99.99,
      period: '/month',
      description: 'Enterprise-grade monitoring for large families',
      features: [
        'Unlimited Devices',
        'All Premium Features',
        'Advanced Analytics',
        'Custom Reports',
        'API Access',
        'White-label Options',
        'Dedicated Account Manager',
        'Custom Integrations'
      ],
      popular: false,
      color: 'from-purple-600 to-pink-500',
      icon: <Zap className="w-6 h-6" />
    }
  ];

  const billingHistory = [
    {
      id: '1',
      date: '2024-09-01',
      plan: 'Premium',
      amount: 69.99,
      status: 'paid',
      invoice: 'INV-2024-09-001'
    },
    {
      id: '2',
      date: '2024-08-01',
      plan: 'Premium',
      amount: 69.99,
      status: 'paid',
      invoice: 'INV-2024-08-001'
    },
    {
      id: '3',
      date: '2024-07-01',
      plan: 'Basic',
      amount: 29.99,
      status: 'paid',
      invoice: 'INV-2024-07-001'
    }
  ];

  const handleUpgrade = async (planId) => {
    if (!planId) return;
    
    setLoading(true);
    try {
      // Here we'll integrate with Stripe
      toast({
        title: "Redirecting to Stripe",
        description: "Please wait while we set up your payment..."
      });
      
      // Simulate API call to create Stripe checkout session
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, redirect to Stripe Checkout
      // window.location.href = stripeCheckoutUrl;
      
      toast({
        title: "Payment Processing",
        description: "This would redirect to Stripe checkout in production",
      });
      
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = (invoiceId) => {
    toast({
      title: "Downloading Invoice",
      description: `Invoice ${invoiceId} would be downloaded in production`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Plan */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Crown className="w-5 h-5 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">Current Plan: {user?.subscription || 'Premium'}</h3>
                  </div>
                  <p className="text-blue-200 mb-4">
                    You're currently on the Premium plan with access to all advanced monitoring features.
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-blue-200">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Next billing: October 1, 2024</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CreditCard className="w-4 h-4" />
                      <span>Visa ending in 4242</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="border-blue-400 text-blue-300 hover:bg-blue-400/10">
                  Update Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Plans */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Choose Your Plan</h2>
            <p className="text-gray-300">Upgrade or downgrade your subscription at any time</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 ${
                  plan.popular 
                    ? 'border-blue-500 bg-gray-800/80 transform scale-105' 
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white`}>
                    {plan.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-300 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-300">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8 text-left">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading || user?.subscription === plan.name}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    } ${user?.subscription === plan.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {user?.subscription === plan.name ? 'Current Plan' : `Upgrade to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billingHistory.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{bill.plan} Plan</div>
                      <div className="text-gray-400 text-sm">{new Date(bill.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-white font-medium">${bill.amount.toFixed(2)}</div>
                      <Badge variant="outline" className="text-xs text-green-400">
                        {bill.status.toUpperCase()}
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadInvoice(bill.invoice)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Billing;