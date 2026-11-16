"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
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

// Vert : emplacement en cours d'ajout
const iconeNouveau = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Rouge : résultats de recherche
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
  html: "<div style='background-color: #416d8f; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;'></div>",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
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

// Bouton "copier" utilisé dans les popups
function BoutonCopier({ texte }: { texte: string }) {
  const [copie, setCopie] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(texte);
        setCopie(true);
        setTimeout(() => setCopie(false), 2000);
      }}
      className="px-2 py-1 border border-bordure rounded-md text-xs text-encre hover:bg-fond cursor-pointer"
    >
      {copie ? "Copié" : "Copier l'adresse"}
    </button>
  );
}

export default function CarteInteractive({
  magasins,
  onLocationSelect,
  pendingLocation,
  centreCarte,
  positionUtilisateur,
  resultatsRecherche = [],
  onSearchResultClick,
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

      {/* Résultats de recherche (marqueurs rouges) */}
      {resultatsRecherche.map((res: any, index: number) => (
        <Marker
          key={`search-${index}`}
          position={[parseFloat(res.lat), parseFloat(res.lon)]}
          icon={iconeRecherche}
          eventHandlers={{
            click: () => {
              if (onSearchResultClick) onSearchResultClick(index);
            },
          }}
        >
          <Popup>
            <div className="max-w-[200px]">
              <strong className="text-encre block mb-1">
                {res.name || res.display_name.split(",")[0]}
              </strong>
              <span className="text-xs text-doux block leading-tight mb-2">
                {res.display_name}
              </span>
              <BoutonCopier texte={res.display_name} />
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Boutiques enregistrées (marqueurs bleus) */}
      {magasins.map((mag: any) => (
        <Marker
          key={mag.id}
          position={[mag.lat, mag.lng]}
          icon={iconeParDefaut}
        >
          <Popup>
            <div className="max-w-[200px]">
              <strong className="text-encre block mb-1">{mag.nom}</strong>
              {mag.adresse && (
                <span className="text-xs text-doux block leading-tight mb-2">
                  {mag.adresse}
                </span>
              )}
              <BoutonCopier
                texte={mag.adresse ? `${mag.nom}, ${mag.adresse}` : mag.nom}
              />
            </div>
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
