import Chat from "@/components/Chat";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[720px] flex-col px-4 py-6 sm:px-6 sm:py-10">
      <div
        className="mb-4 h-1.5 w-16 rounded-full bg-accent"
        aria-hidden="true"
      />
      <Chat />
    </main>
  );
}
