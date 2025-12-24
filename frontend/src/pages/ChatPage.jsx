import Chat from '../components/Chat';

export default function ChatPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assistant fiscal</h1>
        <p className="text-muted-foreground">
          Posez vos questions sur la déclaration d'impôts genevoise 2024
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <Chat />
      </div>
    </div>
  );
}
