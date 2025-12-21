import Chat from '../components/Chat';

export default function ChatPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assistant fiscal</h1>
        <p className="text-gray-600 mt-1">
          Posez vos questions sur la déclaration d'impôts genevoise 2024
        </p>
      </div>
      <Chat />
    </div>
  );
}
