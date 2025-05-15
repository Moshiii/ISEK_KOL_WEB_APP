import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface UserInputProps {
  onSubmit: (request: string) => void;
  isProcessing: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ onSubmit, isProcessing }) => {
  const [request, setRequest] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (request.trim() && !isProcessing) {
      onSubmit(request);
      setRequest('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold mb-1 bg-gradient-to-r from-[#5370FF] to-[#FF66C5] text-transparent bg-clip-text">活动请求</h2>
        <p className="text-gray-400 text-sm">
          描述您的推特活动，我们的AI助手将为您规划和执行。
        </p>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <textarea
            className="flex-1 w-full p-4 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-[#5370FF] focus:border-[#5370FF] transition-all resize-none text-gray-100 placeholder-gray-400"
            placeholder="请描述您的推特活动..."
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            disabled={isProcessing}
          ></textarea>
          
          <button
            type="submit"
            disabled={!request.trim() || isProcessing}
            className={`mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
              !request.trim() || isProcessing
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'gradient-primary text-white hover:opacity-90'
            }`}
          >
            {isProcessing ? '处理中...' : '提交请求'}
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserInput;