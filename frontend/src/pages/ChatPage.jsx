import Chat from '../components/Chat';

export default function ChatPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Assistant fiscal</h1>
        <p className="text-text-secondary mt-1">
          Posez vos questions sur la déclaration d'impôts genevoise 2024
        </p>
      </div>
      <Chat />
    </div>
  );
}
