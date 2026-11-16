"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const iconeParDefaut = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const iconeNouveau = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// NOUVEAU : Icône rouge pour les résultats de recherche
const iconeRecherche = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const iconeUtilisateur = L.divIcon({
  className: "custom-div-icon",
  html: "<div style='background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);'></div>",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function GestionnaireClic({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ControleurCamera({
  centreCarte,
}: {
  centreCarte: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (centreCarte) {
      map.flyTo([centreCarte.lat, centreCarte.lng], 13);
    }
  }, [centreCarte, map]);
  return null;
}

// NOUVEAU : On ajoute "resultatsRecherche" dans les paramètres
export default function CarteInteractive({
  magasins,
  onLocationSelect,
  pendingLocation,
  centreCarte,
  positionUtilisateur,
  resultatsRecherche = [],
}: any) {
  return (
    <MapContainer
      center={[46.603354, 1.888334]}
      zoom={6}
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ControleurCamera centreCarte={centreCarte} />
      <GestionnaireClic onLocationSelect={onLocationSelect} />

      {positionUtilisateur && (
        <Marker
          position={[positionUtilisateur.lat, positionUtilisateur.lng]}
          icon={iconeUtilisateur}
        >
          <Popup>Vous êtes ici</Popup>
        </Marker>
      )}

      {/* Affichage des résultats de recherche en rouge avec BOUTON COPIER */}
      {resultatsRecherche.map((res: any, index: number) => (
        <Marker
          key={`search-${index}`}
          position={[parseFloat(res.lat), parseFloat(res.lon)]}
          icon={iconeRecherche}
        >
          <Popup>
            <div className="text-center max-w-[200px]">
              <strong className="text-slate-900 block mb-1">
                {res.name || res.display_name.split(",")[0]}
              </strong>
              <span className="text-xs text-slate-600 block leading-tight mb-2">
                {res.display_name}
              </span>

              <button
                onClick={(e) => {
                  navigator.clipboard.writeText(res.display_name);
                  // Petit effet visuel pour confirmer la copie
                  e.currentTarget.innerText = "✅ Copié !";
                  setTimeout(() => {
                    if (e.currentTarget)
                      e.currentTarget.innerText = "📋 Copier l'adresse";
                  }, 2000);
                }}
                className="px-2 py-1 mx-auto bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-bold rounded flex items-center justify-center transition-all cursor-pointer"
              >
                📋 Copier l'adresse
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      {magasins.map((mag: any) => (
        <Marker
          key={mag.id}
          position={[mag.lat, mag.lng]}
          icon={iconeParDefaut}
        >
          <Popup>
            <strong className="text-slate-900 text-base">{mag.nom}</strong>
          </Popup>
        </Marker>
      ))}

      {pendingLocation && (
        <Marker
          position={[pendingLocation.lat, pendingLocation.lng]}
          icon={iconeNouveau}
        >
          <Popup>Nouvel emplacement</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
