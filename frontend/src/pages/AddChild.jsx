import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  Shield, 
  Loader2, 
  Smartphone, 
  Users, 
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';

const AddChild = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [childData, setChildData] = useState({
    name: '',
    age: '',
    avatar: '',
    device: '',
    device_id: ''
  });

  const deviceTypes = [
    { value: 'iPhone 15 Pro', label: 'iPhone 15 Pro', icon: '📱' },
    { value: 'iPhone 15', label: 'iPhone 15', icon: '📱' },
    { value: 'iPhone 14', label: 'iPhone 14', icon: '📱' },
    { value: 'Samsung Galaxy S24', label: 'Samsung Galaxy S24', icon: '📱' },
    { value: 'Samsung Galaxy S23', label: 'Samsung Galaxy S23', icon: '📱' },
    { value: 'Google Pixel 8', label: 'Google Pixel 8', icon: '📱' },
    { value: 'iPad', label: 'iPad', icon: '📱' },
    { value: 'Other Android', label: 'Other Android', icon: '📱' },
    { value: 'Other iOS', label: 'Other iOS', icon: '📱' }
  ];

  const avatarOptions = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150'
  ];

  const handleInputChange = (field, value) => {
    setChildData(prev => ({ ...prev, [field]: value }));
  };

  const generateDeviceId = () => {
    const deviceType = childData.device.toLowerCase().includes('iphone') ? 'ios' : 'android';
    const randomId = Math.random().toString(36).substring(2, 15);
    return `${deviceType}_${childData.name.toLowerCase().replace(/\s+/g, '_')}_${randomId}`;
  };

  const handleSubmit = async () => {
    if (!childData.name || !childData.age || !childData.device) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const deviceId = generateDeviceId();
      const submitData = {
        ...childData,
        age: parseInt(childData.age),
        device_id: deviceId,
        avatar: childData.avatar || avatarOptions[0]
      };

      await usersAPI.addChild(submitData);
      
      toast({
        title: "Child Added Successfully!",
        description: `${childData.name} has been added to your monitoring dashboard`,
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to add child:', error);
      toast({
        title: "Failed to Add Child",
        description: error.response?.data?.detail || "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!childData.name || !childData.age)) {
      toast({
        title: "Missing Information",
        description: "Please enter child's name and age",
        variant: "destructive"
      });
      return;
    }
    setStep(step + 1);
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
                <h1 className="text-2xl font-bold text-white">Add New Child</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum === step 
                    ? 'bg-blue-600 text-white' 
                    : stepNum < step 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-400'
                }`}>
                  {stepNum < step ? <CheckCircle className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-0.5 ${
                    stepNum < step ? 'bg-green-600' : 'bg-gray-700'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <span className="text-gray-300">
              Step {step} of 3: {
                step === 1 ? 'Basic Information' : 
                step === 2 ? 'Device Selection' : 
                'Final Setup'
              }
            </span>
          </div>
        </div>

        <Card className="bg-gray-800/80 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Users className="w-6 h-6" />
              {step === 1 && 'Child Information'}
              {step === 2 && 'Device Selection'}
              {step === 3 && 'Review & Setup'}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Child's Name *</Label>
                    <Input
                      id="name"
                      value={childData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white"
                      placeholder="Enter child's name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-white">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="5"
                      max="18"
                      value={childData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white"
                      placeholder="Enter age"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Choose Avatar</Label>
                  <div className="grid grid-cols-6 gap-4">
                    {avatarOptions.map((avatar, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleInputChange('avatar', avatar)}
                        className={`relative rounded-full overflow-hidden border-2 transition-all ${
                          childData.avatar === avatar 
                            ? 'border-blue-500 ring-2 ring-blue-500/30' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <img src={avatar} alt={`Avatar ${index + 1}`} className="w-16 h-16 object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Device Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white">Select Device Type *</Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {deviceTypes.map((device) => (
                      <button
                        key={device.value}
                        type="button"
                        onClick={() => handleInputChange('device', device.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          childData.device === device.value
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{device.icon}</span>
                          <span className="text-white font-medium">{device.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-blue-300 font-medium">Device Setup Required</h4>
                      <p className="text-blue-200 text-sm mt-1">
                        After adding this child, you'll need to install the ParentGuard monitoring app 
                        on their device to begin tracking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Setup */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-gray-700/30 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4">Review Child Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={childData.avatar || avatarOptions[0]} 
                        alt="Child avatar" 
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-white font-medium">{childData.name}</div>
                        <div className="text-gray-400">{childData.age} years old</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{childData.device}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Device ID will be auto-generated
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-green-300 font-medium">Ready to Add</h4>
                      <p className="text-green-200 text-sm mt-1">
                        Click "Add Child" to create the monitoring profile. You'll receive setup 
                        instructions for device installation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={() => step > 1 ? setStep(step - 1) : navigate('/dashboard')}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {step > 1 ? 'Previous' : 'Cancel'}
              </Button>
              
              {step < 3 ? (
                <Button 
                  onClick={nextStep}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Child...
                    </>
                  ) : (
                    'Add Child'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddChild;