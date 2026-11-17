import React from "react";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";
import Ionicons from "@expo/vector-icons/Ionicons";

// Liste fictive de boutiques partenaires (comme sur le web)
const boutiques = [
  {
    id: "1",
    name: "PokeShop Bordeaux",
    latitude: 44.8378,
    longitude: -0.5792,
    description: "Spécialiste cartes rares & rétro",
  },
  {
    id: "2",
    name: "Le Repaire du Dresseur",
    latitude: 44.842,
    longitude: -0.581,
    description: "Tournois et achats de collections",
  },
];

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 44.8378,
          longitude: -0.5792,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {boutiques.map((boutique) => (
          <Marker
            key={boutique.id}
            coordinate={{
              latitude: boutique.latitude,
              longitude: boutique.longitude,
            }}
            title={boutique.name}
            description={boutique.description}
          >
            <View style={styles.markerCustom}>
              <Ionicons name="location" size={28} color="#d9480f" />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  markerCustom: {
    alignItems: "center",
    justifyContent: "center",
  },
});
