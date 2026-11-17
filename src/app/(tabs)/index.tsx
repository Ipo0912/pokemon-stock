import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "../../lib/supabase";

export default function ScannerScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultatIA, setResultatIA] = useState<any>(null);

  const pickImage = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Accès à la caméra requis.");
        return;
      }
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Accès à la galerie requis.");
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setResultatIA(null); // On réinitialise l'IA si nouvelle photo
    }
  };

  const evaluerCarte = async () => {
    if (!imageUri) return;
    setLoading(true);

    try {
      // 🔴 REMPLACE PAR TON ADRESSE IPv4 RÉELLE (ex: 192.168.1.30) 🔴
      const API_URL = "http://192.168.1.30:3000/api/evaluate";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUri }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur de l'API web.");
      }

      // On stocke le résultat de l'IA pour l'afficher
      setResultatIA(data);
    } catch (error: any) {
      Alert.alert(
        "Erreur de connexion",
        error.message ||
          "Impossible de joindre le PC. Vérifie ton IP et que npm run dev tourne.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanner une Carte Pokémon</Text>

      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#d9480f"
              style={styles.loader}
            />
          ) : resultatIA ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                Nom: {resultatIA.nom || "Inconnu"}
              </Text>
              <Text style={styles.resultText}>
                Extension: {resultatIA.extension || "Inconnue"}
              </Text>
              <Text style={styles.resultText}>
                Estimation: {resultatIA.estimation || "N/A"}
              </Text>

              {/* Le bouton pour sauvegarder PROPREMENT arrivera ici plus tard */}
            </View>
          ) : (
            <TouchableOpacity style={styles.saveButton} onPress={evaluerCarte}>
              <Ionicons
                name="sparkles"
                size={20}
                color="#fff"
                style={styles.icon}
              />
              <Text style={styles.saveButtonText}>Évaluer avec Gemini IA</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setImageUri(null);
              setResultatIA(null);
            }}
          >
            <Text style={styles.resetButtonText}>Reprendre une photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => pickImage(true)}
          >
            <Ionicons
              name="camera"
              size={24}
              color="#fff"
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Ouvrir la Caméra</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => pickImage(false)}
          >
            <Ionicons
              name="images"
              size={24}
              color="#d9480f"
              style={styles.icon}
            />
            <Text style={styles.secondaryButtonText}>
              Choisir de la Galerie
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 30,
  },
  buttonContainer: { width: "100%", alignItems: "center", gap: 15 },
  button: {
    flexDirection: "row",
    backgroundColor: "#d9480f",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    width: "80%",
    justifyContent: "center",
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#d9480f",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryButtonText: { color: "#d9480f", fontSize: 16, fontWeight: "600" },
  icon: { marginRight: 10 },
  previewContainer: { alignItems: "center", width: "100%" },
  preview: {
    width: 220,
    height: 310,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: "cover",
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#0b5ed7",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  resetButton: {
    backgroundColor: "#343a40",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  resetButtonText: { color: "#fff", fontSize: 14 },
  loader: { marginVertical: 20 },
  resultBox: {
    backgroundColor: "#e8f4f8",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#b6d4fe",
  },
  resultText: {
    fontSize: 16,
    color: "#052c65",
    marginBottom: 5,
    fontWeight: "500",
  },
});
