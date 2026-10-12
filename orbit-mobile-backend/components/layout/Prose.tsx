export function Prose({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="text-4xl font-bold">{title}</h1>
      {intro && <p className="mt-3 text-lg text-muted">{intro}</p>}
      <div className="mt-8 space-y-4 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </div>
  );
}
