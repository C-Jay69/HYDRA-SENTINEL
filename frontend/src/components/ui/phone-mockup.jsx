import React from 'react';

const PhoneMockup = ({ className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Phone Frame */}
      <div className="relative w-72 h-[600px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
        {/* Phone Screen */}
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
          {/* Status Bar */}
          <div className="bg-gray-100 px-6 py-2 flex justify-between items-center text-xs">
            <span className="font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-black rounded-sm">
                <div className="w-3/4 h-full bg-green-500 rounded-sm"></div>
              </div>
            </div>
          </div>

          {/* App Interface */}
          <div className="relative h-full bg-gradient-to-b from-blue-50 to-white">
            {/* Location Interface */}
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-white rounded-lg shadow-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Current Location</div>
                    <div className="text-xs text-gray-500">2 mins ago</div>
                  </div>
                </div>
                <div className="h-24 bg-green-100 rounded-md relative">
                  <div className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute top-4 right-3 text-xs text-green-700">Maps</div>
                </div>
              </div>
            </div>

            {/* Message Interface */}
            <div className="absolute top-32 left-4 right-4">
              <div className="bg-white rounded-lg shadow-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                    M
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">ann_white</div>
                    <div className="text-xs text-gray-500">Last night was amazing, thx</div>
                  </div>
                  <div className="text-xs text-gray-400">2m</div>
                </div>
              </div>
            </div>

            {/* Audio Interface */}
            <div className="absolute bottom-32 left-4 right-4">
              <div className="bg-blue-600 rounded-lg shadow-lg p-3 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Audio Recording</div>
                  <div className="text-xs">0:45</div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-1 bg-white rounded-full ${
                        i < 8 ? 'h-3' : i < 12 ? 'h-4' : 'h-2'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* App Control */}
            <div className="absolute bottom-16 left-4 right-4">
              <div className="bg-yellow-400 rounded-lg shadow-lg p-3">
                <div className="text-sm font-medium text-black">Apps Control</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 bg-red-500 rounded"></div>
                  <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  <div className="w-6 h-6 bg-purple-500 rounded"></div>
                  <div className="text-xs text-black ml-2">3 blocked</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
        <div className="text-white text-xs font-bold">LIVE</div>
      </div>

      <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
        <div className="text-white text-xs">🔒</div>
      </div>
    </div>
  );
};

export default PhoneMockup;