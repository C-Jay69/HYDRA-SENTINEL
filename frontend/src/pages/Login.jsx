import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Shield, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password
        });
        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          subscription: "Basic"
        });
        toast({
          title: "Registration successful",
          description: "Welcome to ParentGuard!"
        });
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication failed",
        description: error.response?.data?.detail || "Please check your credentials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Demo login function for testing with seeded data
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await login({
        email: 'sarah.johnson@email.com',
        password: 'password123'
      });
      toast({
        title: "Demo login successful",
        description: "Welcome to the demo!"
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Demo login failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="relative w-full max-w-md bg-gray-800/80 border-gray-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">ParentGuard</span>
          </div>
          <CardTitle className="text-2xl text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <p className="text-gray-300">
            {isLogin 
              ? 'Sign in to your parental control dashboard'
              : 'Start monitoring your family\'s digital safety'
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pl-10"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-800 px-2 text-gray-400">Or</span>
            </div>
          </div>

          <Button 
            onClick={handleDemoLogin}
            disabled={loading}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Demo...
              </>
            ) : (
              'Try Demo Account'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          {isLogin && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-blue-300 text-sm text-center">
                <strong>Demo Credentials:</strong><br />
                Email: sarah.johnson@email.com<br />
                Password: password123
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;