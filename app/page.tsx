import Link from 'next/link';
import Button from '@/components/Button';
import { ArrowRight, Video, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b px-6 lg:px-12">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Video className="h-6 w-6" />
          <span>StreamCatch</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-24 text-center lg:px-12 lg:py-32">
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight lg:text-6xl">
            Capture Live Streams <span className="text-primary">Automatically</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Never miss a moment. StreamCatch automatically records your favorite live streams from multiple platforms so you can watch them later, anytime, anywhere.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Recording Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Log In
              </Button>
            </Link>
          </div>
        </section>

        <section className="bg-muted/30 px-6 py-24 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Instant Capture</h3>
              <p className="mt-2 text-muted-foreground">
                Our system detects when a channel goes live and starts recording immediately.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Secure Storage</h3>
              <p className="mt-2 text-muted-foreground">
                Your recordings are stored privately and securely. Only you have access to them.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <Video className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">High Quality</h3>
              <p className="mt-2 text-muted-foreground">
                We record the original stream quality without transcoding, ensuring the best viewing experience.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} StreamCatch. All rights reserved.</p>
      </footer>
    </div>
  );
}
