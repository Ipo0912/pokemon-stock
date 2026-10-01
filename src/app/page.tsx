import Camera from "../components/Camera";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center py-12">
      <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
        Poké<span className="text-blue-500">Stock</span>
      </h1>
      <p className="text-slate-400 mb-8">Placez la carte au centre du cadre svp</p>

      <Camera />
    </main>
  );
}
