import React, { useState } from 'react';
import UserInput from './components/UserInput';
import ChatWindow from './components/ChatWindow';
import { useChatSimulation } from './hooks/useChatSimulation';

function App() {
  const { messages, tasks, typingAgent, status, startCampaign } = useChatSimulation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmitRequest = async (request: string) => {
    try {
      setIsProcessing(true);
      await startCampaign(request);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden text-gray-100">
      <header className="gradient-primary px-6 py-4 flex items-center">
        <h1 className="text-xl font-bold text-white">推特活动中心</h1>
      </header>
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/4 lg:w-1/5 border-r border-gray-700 overflow-hidden">
          <UserInput 
            onSubmit={handleSubmitRequest}
            isProcessing={isProcessing}
            placeholder="请描述您的推特活动..."
          />
        </div>
        
        <div className="w-full md:w-3/4 lg:w-4/5 overflow-hidden">
          <ChatWindow 
            messages={messages} 
            tasks={tasks}
            typingAgent={typingAgent}
            status={status}
          />
        </div>
      </main>
    </div>
  );
}

export default App;