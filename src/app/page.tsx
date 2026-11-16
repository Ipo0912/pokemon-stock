import Camera from "../components/Camera";

export default function Home() {
  return (
    <main className="min-h-screen bg-fond text-encre px-4 py-8">
      <div className="max-w-sm mx-auto mb-6">
        <h1 className="text-xl font-semibold">Scanner une carte</h1>
        <p className="text-sm text-doux mt-1">
          Placez la carte au centre du cadre.
        </p>
      </div>

      <Camera />
    </main>
  );
}
