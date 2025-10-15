import { PhotoBooth } from "@/components/photobooth";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-5xl font-bold text-primary font-headline">BeachSnap</h1>
          <p className="text-muted-foreground mt-2">Create your beach memory!</p>
        </header>
        <PhotoBooth />
      </div>
    </main>
  );
}
